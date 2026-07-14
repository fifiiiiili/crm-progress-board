# CRM 客户跟进进度管理面板

<p align="center">
  <strong>一个纯前端的客户跟进进度管理演示面板</strong><br/>
  基于 React 18 + Ant Design 5 + Vite 5，数据全部保存在浏览器 localStorage 中。
</p>

<p align="center">
  <a href="https://fifiiiiili.github.io/crm-progress-board/"><strong>🚀 在线演示</strong></a>
</p>

---

## ✨ 特性

- 📊 **9 张统计卡片**：客户总数 / 跟进中 / 待补材料 / 待审核 / 审核卡住 / 已开通 / 超 7 天未更新 / 手动新增 / 表格上传
- 🔍 **强筛选**：8 个下拉筛选维度 + 时间区间 + 关键词模糊搜索
- ➕ **新增客户**：完整表单校验 + 防重复识别
- 📥 **批量上传**：支持 `.xlsx / .xls / .csv`，带模板下载、字段校验、双去重预览
- 📤 **导出 Excel**：可选"当前筛选结果"或"全部数据"
- 🖼️ **聊天截图**：单条记录支持 5 张截图（客户端压缩），带说明、大图预览
- 🛡️ **数据保护**：表格上传的数据不可删（模拟真实运营场景的数据保护规则）
- 🔄 **一键重置**：随时恢复到初始 20 条演示数据

## 🎯 适用场景

这是一个**功能完整的界面演示 Demo**，适合：

- 💼 面试作品展示
- 📚 学习 React + Ant Design 大表格 CRUD 的完整实现
- 🎨 快速原型验证 CRM 类系统的交互设计
- 🔧 直接 fork 后接入你自己的后端

## 🚀 快速开始

```bash
# 安装依赖
pnpm install

# 本地开发
pnpm dev
# 打开 http://localhost:5173

# 生产构建
pnpm build

# 预览构建产物
pnpm preview
```

## 🏗️ 目录结构

```
src/
├── App.tsx                          # 根组件（Ant Design ConfigProvider）
├── main.tsx                         # 入口
├── main.css                         # 全局样式
├── api/
│   ├── customers.ts                 # 客户 CRUD（基于 localStorage）
│   ├── seed.ts                      # 20 条演示种子数据
│   ├── upload.ts                    # 图片压缩转 dataURL
│   └── index.ts                     # 统一导出
└── components/
    └── CustomerBoard/
        ├── index.tsx                # 主容器（顶部工具栏 + 装配所有子组件）
        ├── constants.ts             # 状态/卡点枚举 + 字段映射 + 类型定义
        ├── StatsCards.tsx           # 9 张统计卡片
        ├── FilterBar.tsx            # 搜索 + 筛选下拉区
        ├── CustomerTable.tsx        # 主数据表格 + 截图预览
        ├── CustomerForm.tsx         # 新增/编辑表单弹窗
        ├── BulkImportModal.tsx      # Excel 批量上传弹窗
        └── ScreenshotUpload.tsx     # 截图上传组件
```

## 💾 数据存储

- **存储位置**：浏览器 `localStorage`
  - `crm-progress-board:customers:v1` — 客户数据
  - `crm-progress-board:id-counter:v1` — 自增 ID
  - `crm-progress-board:seeded:v1` — 首次访问种子标记
- **隔离**：不同浏览器 / 隐私模式互相独立
- **重置**：顶部横幅右侧 → "重置演示数据" 按钮

## 🎨 换成真实后端？

如果你想接入自己的后端，只需要替换 `src/api/customers.ts` 里的函数体：

```typescript
// 保留同名函数签名，把 localStorage 换成 fetch 即可
export async function fetchAllCustomers(): Promise<CustomerRecord[]> {
  const res = await fetch('https://your-api.com/customers')
  return await res.json()
}
```

其他 6 个函数同理，业务组件层不需要改动。

## 📝 License

MIT
