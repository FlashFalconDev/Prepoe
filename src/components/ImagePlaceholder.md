# ImagePlaceholder 組件

## 概述
`ImagePlaceholder` 是一個 React 組件，用於在圖片未上傳或不可用時顯示佔位符圖示。它支援多種類型和尺寸，並可以根據使用場景自定義樣式。

## 功能特點
- 🎨 支援多種圖片類型（頭像、連結、封面、通用）
- 📏 支援多種尺寸（sm、md、lg、xl）
- 🖱️ 可點擊觸發上傳功能
- 🎯 支援預覽模式（無背景、無邊框、純圖示）
- 🔄 響應式設計和過渡動畫
- 🎨 可自定義樣式和類名

## Props

### 必需 Props
- `type`: 圖片類型
  - `'avatar'` - 頭像類型
  - `'link'` - 連結圖示類型
  - `'cover'` - 封面圖片類型
  - `'general'` - 通用圖片類型

### 可選 Props
- `size`: 尺寸大小（預設：`'md'`）
  - `'sm'` - 小尺寸 (32x32px)
  - `'md'` - 中等尺寸 (40x40px)
  - `'lg'` - 大尺寸 (64x64px)
  - `'xl'` - 超大尺寸 (96x96px)
- `className`: 自定義 CSS 類名
- `onClick`: 點擊事件處理函數
- `showUploadIcon`: 是否顯示上傳圖示（預設：`true`）
- `preview`: 是否為預覽模式（預設：`false`）
- `iconColor`: 圖示顏色（預設：使用組件內建顏色）

## 使用方式

### 基本用法
```tsx
import ImagePlaceholder from './ImagePlaceholder';

// 基本頭像佔位符
<ImagePlaceholder type="avatar" size="lg" />

// 連結圖示佔位符
<ImagePlaceholder type="link" size="md" />

// 封面圖片佔位符
<ImagePlaceholder type="cover" size="xl" />
```

### 帶點擊事件
```tsx
<ImagePlaceholder
  type="avatar"
  size="xl"
  onClick={() => document.getElementById('file-input')?.click()}
  className="cursor-pointer"
/>
```

### 預覽模式
```tsx
// 預覽模式下只顯示圖示，無背景、無邊框、無文字
<ImagePlaceholder
  type="link"
  size="md"
  preview={true}
  className="w-10 h-10"
/>
```

### 自定義圖示顏色
```tsx
// 使用自定義顏色
<ImagePlaceholder
  type="avatar"
  size="lg"
  iconColor="#6366f1"
/>

// 預覽模式下與按鍵文字顏色保持一致
<ImagePlaceholder
  type="link"
  size="md"
  preview={true}
  iconColor={profile.button_text_color || '#6b7280'}
/>
```

## 樣式特點

### 正常模式
- 圓角邊框
- 虛線邊框樣式
- 淺灰色背景
- 懸停效果（邊框和背景色變化）
- 支援文字標籤（lg 和 xl 尺寸）
- 支援上傳圖示（lg 和 xl 尺寸）

### 預覽模式
- 純圖示顯示
- 無背景色
- 無邊框
- 無文字標籤
- 無上傳圖示
- 保持尺寸和圖示顏色

## 實際應用場景

### 1. 名片編輯表單
```tsx
// 個人資料圖片
{profile_picture_url ? (
  <img src={profile_picture_url} alt="Profile" className="w-24 h-24 rounded-full" />
) : (
  <ImagePlaceholder
    type="avatar"
    size="xl"
    className="w-24 h-24 rounded-full"
    onClick={() => document.getElementById('profile-picture-input')?.click()}
  />
)}

// 連結圖示
{link.icon_url ? (
  <img src={link.icon_url} alt="Link icon" className="w-10 h-10 rounded-lg" />
) : (
  <ImagePlaceholder
    type="link"
    size="md"
    className="w-10 h-10"
    onClick={() => document.getElementById(`link-icon-input-${index}`)?.click()}
  />
)}
```

### 2. 文章編輯器
```tsx
// 文章封面圖片
{coverImage ? (
  <img src={coverImage} alt="封面圖片" className="w-full aspect-video rounded-xl" />
) : (
  <ImagePlaceholder
    type="cover"
    size="xl"
    className="w-full aspect-video"
    onClick={() => coverImageRef.current?.click()}
  />
)}
```

### 3. 名片預覽
```tsx
// 預覽模式下的佔位符（無背景、無邊框）
{profile.profile_picture_url ? (
  <img src={profile.profile_picture_url} alt={profile.name} className="w-32 h-32 rounded-full" />
) : (
  <ImagePlaceholder
    type="avatar"
    size="xl"
    className="w-32 h-32 rounded-full"
    preview={true}
    iconColor={profile.text_color || '#111827'}
  />
)}

// 連結圖示與按鍵文字顏色保持一致
{link.icon_url ? (
  <img src={link.icon_url} alt={link.title} className="w-10 h-10 rounded-lg object-cover" />
) : (
  <ImagePlaceholder
    type="link"
    size="md"
    className="w-10 h-10"
    preview={true}
    iconColor={profile.button_text_color || '#6b7280'}
  />
)}
```

## 技術實現

### 組件結構
- 使用 TypeScript 進行類型安全
- 響應式設計，支援不同尺寸
- 條件渲染，根據 props 動態調整樣式
- 支援自定義 CSS 類名覆蓋

### 樣式系統
- 使用 Tailwind CSS 進行樣式管理
- 支援懸停效果和過渡動畫
- 響應式尺寸系統
- 可自定義的顏色主題

### 事件處理
- 支援點擊事件回調
- 可選的點擊功能（用於觸發文件上傳）
- 無障礙支援（title 屬性）

## 最佳實踐

1. **尺寸選擇**：根據容器大小選擇合適的尺寸
2. **類型選擇**：根據用途選擇對應的圖示類型
3. **預覽模式**：在預覽場景下使用 `preview={true}` 獲得純淨的圖示顯示
4. **樣式自定義**：使用 `className` 進行樣式覆蓋和調整
5. **交互設計**：為可點擊的佔位符添加適當的視覺反饋

## 更新日誌

### v1.2.0
- 新增 `iconColor` 屬性支援
- 支援自定義圖示顏色
- 預覽模式下可與按鍵文字顏色保持一致

### v1.1.0
- 新增 `preview` 屬性支援
- 預覽模式下移除背景、邊框和文字
- 優化預覽模式的樣式表現

### v1.0.0
- 初始版本發布
- 支援多種類型和尺寸
- 支援點擊事件和自定義樣式 