# 加油上报 OCR 版本页面开发任务

## 任务信息
- **任务名称**：新增加油上报 OCR 版本高保真页面并集成到导航入口
- **目标文件**：`03-高保真页面/fuel-report-ocr.html`、`index.html`、`03-高保真页面/layout.html`
- **状态**：completed
- **创建时间**：2026-06-25
- **完成时间**：2026-06-26

## 需求摘要
新增一个独立的加油上报 OCR 版本页面，通过 OCR 识别交易凭证和里程照片自动填充表单字段，并集成到项目导航入口。

## 关键变更点
1. 新增 `fuel-report-ocr.html`：OCR 识别交易凭证与里程照片，自动填充表单
2. 交易凭证限 1 张，识别后自动填充：关联油卡、加油时间、单价、加油量、金额
3. 里程照片限 1 张，识别后自动填充当前里程数
4. 移除支付方式和支付照片字段
5. 加油金额以 OCR 识别结果为准
6. `index.html` APP 端区域新增「加油上报（OCR）」入口
7. `layout.html` 移动端原型侧边栏新增「加油上报（OCR）」导航项

## 检查清单
- [x] 读取需求文档与现有页面
- [x] 完成需求分析与评审
- [x] 创建任务跟踪
- [x] 编写 fuel-report-ocr.html
- [x] 自测验证（375px/414px/768px）
- [x] 截图到 07-bugs
- [x] 备份到 06-备份
- [x] 更新 README.md
- [x] 集成到 index.html
- [x] 集成到 layout.html
- [x] 汇总完成报告

## 截图记录
- 375px 初始状态：`07-bugs/fuel-report-ocr_2026-06-25_114255.png`
- 375px 完整视图：`07-bugs/fuel-report-ocr-full_2026-06-25_114312.png`
- 375px OCR 识别成功状态：`07-bugs/fuel-report-ocr-demo_2026-06-25_114510.png`
- 414px 完整视图：`07-bugs/fuel-report-ocr-414_2026-06-25_114545.png`
- 768px 完整视图：`07-bugs/fuel-report-ocr-768_2026-06-25_114552.png`
- 默认提示文字：`07-bugs/fuel-report-ocr-hint_2026-06-25_115325.png`
- 上传后提示隐藏状态：`07-bugs/fuel-report-ocr-hint-demo_2026-06-25_115413.png`
- index.html 集成效果：`07-bugs/index-with-ocr_2026-06-26_013844.png`
- layout.html 集成效果：`07-bugs/layout-with-ocr_2026-06-26_013909.png`

## 备份记录
- `06-备份/backup_20260625_194622`
