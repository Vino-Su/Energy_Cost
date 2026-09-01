---
name: page-selftest
description: 页面功能自测与渲染验证。当需要验证 HTML 页面渲染结果、检查组件是否正确挂载(如分页、表格、图表)、排查页面 JS 报错或接口失败、判断页面是否空白或数据是否渲染出来时使用。输出机器可读的 DOM/报错结果供 AI 自主判定,不依赖看图。视觉外观确认(布局/配色/样式/截图留档)用 page-screenshot,本 skill 不做外观判断。
---

# 页面自测流程

## 触发场景
- 需要确认页面/组件渲染结果、验证组件是否挂载
- 排查页面 JS 报错、接口失败
- 判断页面是否空白、数据是否渲染出来
- 改动页面代码后自测回归

> **与 page-screenshot 的分工**:本 skill 做**功能/结构验证**,AI 可读结构化结果自主判定;
> 视觉外观确认(布局/配色/样式)、截图留档给用户查看 → 用 page-screenshot skill,两者不重复使用。

## 核心工具(全局脚本,所有项目可用)
```
node C:\Users\vino\.claude\scripts\selftest.mjs <目标> [等待秒数] [CSS选择器]
```

参数说明:
- `<目标>`:本地 html 文件路径 / 目录 / http(s) URL
  - 本地文件支持带 hash/query(如 `test.html#renewal`),用于验证弹窗、详情入口等哈希路由场景
  - 注意 PowerShell 下 `#` 前不要留空格,或用引号包裹 `"test.html#renewal"`
- `[等待秒数]`:默认 3,SPA 或数据异步加载建议 5-8
- `[CSS选择器]`:可选,验证指定组件是否挂载(如 `.pg-stats`、`#app`、`.renewal-dialog`)

## 标准流程
1. **确定目标**:
   - 本地 html 文件 → 直接传路径,脚本自动起 http 服务
   - 已有本地服务(如 vite dev) → 传 http://localhost:端口 的 URL
2. **验证具体组件时带上选择器**:
   ```
   node selftest.mjs <目标> 5 .组件选择器
   ```
3. **读取结果**(优先 `<输出目录>/result.json`,需要看结构时读 `dom.html`;脚本 stdout 会打印实际路径)
4. **按 verdict 判定**:
   - `ok`:渲染正常无报错 → 可结束或继续功能验证
   - `check_errors`:渲染了但有报错 → 读 `errors` 数组定位 JS/接口问题
   - `empty_dom`:页面空白 → 按下方排查

## 结果判定标准
- 组件挂载:`selectorFound: true` 且 `selectorText` 有实际内容
- 页面结构:`bodyChildren`、`htmlLen` 正常(空页面 htmlLen < 100)
- 报错:`errors` 按 `kind` 分类(`console` / `exception` / `log`),已去重

## 常见问题排查
1. **empty_dom(页面空白)**:
   - 确认不是 file:// 访问(ESM 被 CORS 拦截,必须 http 访问)
   - 增大等待秒数(框架渲染慢)
   - 读 `errors` 看 JS 是否崩溃
2. **check_errors**:
   - 读 `errors` 里的具体报错文本,定位到 JS/接口问题
3. **选择器找不到**:
   - 先不带选择器跑一次,读 `dom.html` 看页面实际结构,再定选择器
4. **脚本本身失败(CDP 启动失败/超时)**:
   - 重试一次即可;或确认本机 Chrome/Edge 存在
   - Chrome 不存在时会自动回退用 Edge

## 禁止事项
- 禁止 `chrome --dump-dom` 配合 PowerShell 捕获 stdout(PowerShell 5.1 用 GBK 解码 UTF-8 输出,中文页面输出必丢为 null)
- 禁止用 file:// 直接验证 SPA 页面(ES Module 被 CORS 拦截,组件必然渲染为空)
- 禁止依赖截图验证(Read 工具无法显示图片;shot.png 仅作备用留档)

## 输出文件
默认输出目录(优先级):
1. `--out <目录>` 显式指定
2. 工作目录存在 `07-bugs/` 时 → `<工作目录>/07-bugs/selftest/`(与项目规范一致)
3. 否则 → `<工作目录>/.selftest/`

| 文件 | 内容 |
|---|---|
| `dom.html` | 渲染后完整 DOM |
| `result.json` | 结构化结果(verdict / errors / 统计) |
| `shot.png` | 截图备份(视觉确认需求请改用 page-screenshot 正式截图) |

退出码:`0` = ok,`2` = 有问题(check_errors / empty_dom)
