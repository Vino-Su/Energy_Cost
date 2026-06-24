---
name: frontend-architecture-lessons
description: 前端开发架构经验教训——从车辆资产管理页面开发中总结的规范与避免再犯的问题
metadata:
  type: feedback
---

## 规则1：新建页面必须使用Common.initLayout统一布局，禁止自定义侧边栏

**Why:** 车辆资产管理列表页初期使用自定义sidebar HTML和样式，导致：内容与导航栏重叠、菜单结构不一致、图标无法统一去除、页面间无法跳转。所有页面共享common.js的侧边栏配置，修改一处即可全局生效。

**How to apply:** 新建页面时，HTML结构必须是 `<div class="layout"> > aside.sidebar#sidebar + div.main-area > div#header + div.content`，并通过 `Common.initLayout({sidebarId, activeMenuId, headerId, breadcrumbs})` 渲染侧边栏和头部。严禁在页面内自定义sidebar样式和HTML。

## 规则2：侧边栏菜单配置必须严格参照01-需求文档/页面框架.md

**Why:** 曾因自行脑补菜单结构（运营管理、财务管理等），导致与页面框架.md定义的5组菜单（车辆管理/调拨管理/运行管理/退出管理/系统管理）不一致。一级模块字体比二级还小，也未按框架要求展示空分组的占位提示。

**How to apply:** 修改common.js的menuConfig时，逐项对照页面框架.md的菜单结构，包括分组名称、菜单项名称、层级关系、空分组占位。一级模块（分组标题）字体必须明显大于二级菜单项。

## 规则3：模拟数据必须参考01-需求文档/示例数据参考.md，并与已开发页面数据衔接

**Why:** 生成模拟数据时凭空编造了"清洗车A型""华南项目组"等数据，与示例数据参考.md中的"高压清洗车""华东运营中心"不一致，也与车辆建档页面的数据无法衔接。

**How to apply:** 所有模拟数据的车架号、车型名称、车牌号、项目名称、人员名称等，必须从示例数据参考.md中取值，确保列表页→详情页→建档页的数据可追溯一致。

## 规则4：菜单项必须配置href跳转链接，已开发页面相互可达

**Why:** 列表页与详情页之间无法通过导航栏切换跳转，菜单项href为`javascript:;`空链接，导致用户无法在不同模块间导航。

**How to apply:** common.js中menuConfig的每个已开发页面项必须配置正确的href值（如`车辆建档-列表页.html`）。未开发的页面保持href为空字符串，渲染时自动使用`javascript:;`。

## 规则5：开发前先审视已有代码架构，不要脱离已有模式自行发挥

**Why:** 车辆资产管理列表页脱离了建档列表页的布局模式（Common.initLayout + common.css），自行定义了sidebar样式和main-content结构，导致布局重叠、风格不一致。

**How to apply:** 每次开发新页面前，先阅读已有页面的代码结构，识别布局模式、CSS引用、JS调用方式，确保新页面与已有页面在架构层面完全一致。如有差异需有充分理由。
