# 导出 Figma 注意事项

> 本文档说明使用 AXhub / Figma 插件把本项目页面复制到 Figma 时必须遵守的规范与流程，避免出现元素丢失、样式错乱等问题。

---

## 一、设计原则

项目页面在设计阶段已**默认保证 AXhub 复制无忧**：

1. **毛玻璃效果**用 `.glass` 工具类实现（半透明白底 + 阴影），**不依赖** `backdrop-filter`，AXhub 能 100% 完整复制。
2. **滚动条**已在 `app-common.css` 全局隐藏，鼠标滚轮 / Page Down 仍可滚动，仅视觉上不显示。
3. **页面宽度**统一为 `max-width: 375px`，与 UI 设计基准对齐。

**结论**：复制 Figma **不需要任何特殊操作**，直接打开页面 → AXhub 复制 → 粘贴即可。

---

## 二、标准导出流程

1. 打开目标 HTML 页面（**无需** 加 `?nofx=1`）。
2. （强烈建议）开启 DevTools 设备模拟器：F12 → Ctrl+Shift+M → 选 iPhone 6/7/8（375×667），强制浏览器以 375 宽度渲染。
3. 启动 AXhub，框选目标区域，点击复制。
4. 粘贴到 Figma，调整尺寸即可。

---

## 三、禁止事项

| 禁止 | 说明 |
|---|---|
| ❌ 在 HTML 内直接写 `backdrop-filter` | 必须用 `.glass` 工具类，AXhub 会丢失带 backdrop-filter 的元素 |
| ❌ 使用 `max-width: 430px`（或其他非 375） | 全部移动端页面已统一 375，再出现即为回归 |
| ❌ 装饰元素 `left + width > 375` | AXhub 会读到 DOM 实际宽度并触发缩放，导致 Figma 节点变 360 |

---

## 四、推荐做法

| 推荐 | 说明 |
|---|---|
| ✅ 毛玻璃统一用 `.glass` 工具类 | 自动 AXhub 友好 |
| ✅ DevTools 模拟 iPhone 6/7/8 (375×667) | 强制渲染宽度，避免尺寸浮动 |
| ✅ 复制前自查页面是否有横向滚动条 | 打开 DevTools Console 跑 `document.body.scrollWidth` 验证 |
| ✅ 复制后在 Figma 手动加 Background Blur（可选） | 如需还原毛玻璃视觉效果 |

---

## 五、相关文件

| 文件 | 作用 |
|---|---|
| `03-高保真页面/components/app-common.css` | `.glass` 工具类、全局滚动条隐藏 |
| `03-高保真页面/components/app-common.js` | 公共脚本（项目切换器等），无 Figma 导出相关逻辑 |

---

## 六、版本记录

| 日期 | 版本 | 变更 |
|---|---|---|
| 2026-07-16 | V2.0 | 全面简化：放弃 `backdrop-filter`，`.glass` 改为半透明白底+阴影；滚动条全局隐藏；删除 `?nofx=1` 机制、`export-check.js`、URL 参数检测。复制 Figma 零操作 |
| 2026-07-16 | V1.0 | 首次建立规范：`.glass` 工具类 + `?nofx=1` URL 开关 + 自检脚本三件套 |

---

**最后更新：2026-07-16**
