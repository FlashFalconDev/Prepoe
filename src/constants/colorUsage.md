# 色彩使用指南

## AI 相關色彩使用（橙色主題）

### 基本用法
```tsx
import { AI_COLORS } from '../constants/colors';

// 圖標
<Bot size={16} className={AI_COLORS.icon} />

// 背景
<div className={AI_COLORS.bg}>AI 內容</div>

// 按鈕
<button className={AI_COLORS.button}>AI 按鈕</button>

// 狀態指示
<span className={AI_COLORS.status}>AI 狀態</span>
```

### 漸變背景
```tsx
// AI 漸變（橙色到紅色）
<div className="bg-gradient-to-r from-orange-500 to-red-500">
// 或使用 Tailwind 配置
<div className="bg-gradient-ai-primary">
```

### 替換規則

#### 舊的硬編碼 → 新的變數
- `text-orange-600` → `AI_COLORS.text`
- `bg-orange-200` → `AI_COLORS.bg`
- `bg-orange-50` → `AI_COLORS.bgLight`
- `hover:bg-orange-300` → `AI_COLORS.bgHover`
- `bg-orange-600 hover:bg-orange-700` → `AI_COLORS.button`

#### 漸變替換
- `from-orange-500 to-red-500` → `bg-gradient-ai-primary`
- `from-red-400 to-orange-600` → `bg-gradient-ai-reverse`

## 色彩層級

### 主要色彩 (Primary)
- 用於主要按鈕、連結、重要元素
- 對應 `primary-*` 系列

### AI 色彩 (AI)
- 用於 AI 相關功能
- 對應 `ai-*` 系列
- 與 `purple-*` 系列相同，但語義更明確

### 功能色彩 (Functions)
- 用於特定功能狀態
- 包含完整的樣式組合
