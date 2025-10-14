# ImagePlaceholder 组件

## 概述
`ImagePlaceholder` 是一个通用的图片占位符组件，用于在图片未上传时显示"等待图片上传"的状态，替代传统的默认图片。

## 功能特性
- 🖼️ 支持多种图片类型：头像、链接图标、封面图片、通用图片
- 📏 支持多种尺寸：sm、md、lg、xl
- 🎨 可自定义样式和类名
- 🖱️ 支持点击事件（如触发文件选择）
- 🔄 悬停效果和过渡动画
- 📱 响应式设计

## 使用方法

### 基本用法
```tsx
import ImagePlaceholder from '../components/ImagePlaceholder';

// 头像占位符
<ImagePlaceholder type="avatar" size="xl" />

// 链接图标占位符
<ImagePlaceholder type="link" size="md" />

// 封面图片占位符
<ImagePlaceholder type="cover" size="xl" />
```

### 带点击事件
```tsx
<ImagePlaceholder
  type="avatar"
  size="xl"
  onClick={() => document.getElementById('file-input')?.click()}
  className="w-24 h-24 rounded-full"
/>
```

### 自定义样式
```tsx
<ImagePlaceholder
  type="link"
  size="md"
  className="w-10 h-10 border-2 border-primary-300"
  showUploadIcon={false}
/>
```

## Props 说明

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `type` | `'avatar' \| 'link' \| 'cover' \| 'general'` | - | 图片类型，影响显示的图标和文字 |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | 组件尺寸，影响图标大小和是否显示文字 |
| `className` | `string` | `''` | 额外的CSS类名 |
| `onClick` | `() => void` | - | 点击事件处理函数 |
| `showUploadIcon` | `boolean` | `true` | 是否显示上传图标（仅在lg和xl尺寸时显示） |

## 尺寸规格

| 尺寸 | 宽度 | 高度 | 图标大小 | 显示文字 | 显示上传图标 |
|------|------|------|----------|----------|--------------|
| `sm` | 32px | 32px | 16px | ❌ | ❌ |
| `md` | 40px | 40px | 20px | ❌ | ❌ |
| `lg` | 64px | 64px | 32px | ✅ | ✅ |
| `xl` | 96px | 96px | 48px | ✅ | ✅ |

## 类型说明

| 类型 | 图标 | 文字 | 适用场景 |
|------|------|------|----------|
| `avatar` | 👤 User | "上傳頭像" | 用户头像、个人照片 |
| `link` | 🔗 Link | "上傳圖示" | 链接图标、按钮图标 |
| `cover` | 🖼️ Image | "上傳封面" | 文章封面、卡片封面 |
| `general` | 🖼️ Image | "上傳圖片" | 通用图片占位符 |

## 样式定制

组件使用 Tailwind CSS 类名，支持以下样式定制：

- **基础样式**：虚线边框、灰色背景、圆角
- **悬停效果**：边框颜色变化、背景色变化、文字颜色变化
- **过渡动画**：所有样式变化都有平滑过渡效果
- **响应式**：支持不同屏幕尺寸的适配

## 使用场景

### 1. 名片编辑表单
- 个人头像上传占位符
- 链接图标上传占位符

### 2. 文章编辑
- 封面图片上传占位符

### 3. 预览卡片
- 头像显示占位符
- 链接图标显示占位符

### 4. 其他表单
- 任何需要图片上传的字段

## 注意事项

1. **点击事件**：如果需要触发文件选择，请确保传入正确的 `onClick` 函数
2. **样式覆盖**：使用 `className` 属性可以覆盖默认样式
3. **尺寸一致性**：建议在同一个界面中使用一致的尺寸规格
4. **无障碍性**：组件包含适当的 `title` 属性，提供屏幕阅读器支持

## 更新日志

- **v1.0.0**：初始版本，支持基本的图片占位符功能
- 支持多种图片类型和尺寸
- 响应式设计和悬停效果
- 完整的 TypeScript 类型支持 