# ActivitySettings 頁面更新記錄

## 📋 更新概述

根據最新的 API 介面，已對 `src/pages/ActivitySettings.tsx` 進行了全面更新，修正了錯誤的欄位並添加了缺少的功能。

## 🔧 主要修正內容

### 1. 表單欄位修正

#### 移除的錯誤欄位
- ✅ 移除了 `cost_price` 欄位（系統自動生成）
- ✅ 移除了 `sku` 欄位（系統自動生成）

#### 新增的欄位
- ✅ 新增 `tags` 欄位：支援多標籤輸入，用逗號分隔
- ✅ 新增 `main_image_file` 欄位：支援主圖檔案上傳（已優化為直觀的拖拽上傳）
- ✅ 新增 `event_status` 選擇器：完整的活動狀態選擇

### 2. 表單狀態更新

#### 表單初始化
```typescript
const [eventForm, setEventForm] = useState({
  name: '',
  description: '',
  base_price: 0,
  start_time: '',
  end_time: '',
  location: '',
  min_participants: 1,
  max_participants: 100,
  max_participants_per_user: 1,
  use_check_in: true,
  event_status: 'draft',
  form_fields: [],
  tags: [],                    // 新增
  main_image_file: undefined  // 新增
});
```

#### 表單重置
- ✅ 所有表單重置操作都已更新
- ✅ 編輯活動時正確載入現有標籤

### 3. 使用者介面增強

#### 活動列表顯示
- ✅ 新增活動主圖顯示（如果存在）
- ✅ 新增活動標籤顯示
- ✅ 新增活動統計資訊顯示
- ✅ 改善卡片佈局和視覺效果

#### 過濾功能
- ✅ 將類型過濾改為狀態過濾
- ✅ 支援按活動狀態進行篩選
- ✅ 過濾邏輯已更新

### 4. 表單佈局優化

#### 新增欄位佈局
- ✅ 活動狀態選擇器（下拉選單）
- ✅ 標籤輸入欄位（逗號分隔）
- ✅ 主圖上傳欄位（檔案選擇器）
- ✅ 改善表單欄位的排列和分組

#### 視覺改善
- ✅ 主圖上傳欄位添加說明文字
- ✅ 標籤輸入欄位添加提示文字
- ✅ 改善表單的響應式佈局

#### 圖片上傳介面優化
- ✅ 使用 `ImagePlaceholder` 組件提供直觀的上傳體驗
- ✅ 支援圖片預覽和即時移除功能
- ✅ 改善上傳區域的視覺設計和互動體驗
- ✅ 提供清晰的操作指引和格式說明

## 📱 新增功能詳解

### 1. 標籤管理（已優化）
```typescript
// 標籤管理區域
<div className="space-y-3">
  {/* 已選擇的標籤 */}
  {eventForm.tags.length > 0 && (
    <div className="flex flex-wrap gap-2">
      {eventForm.tags.map((tag, index) => (
        <span
          key={index}
          className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 text-sm rounded-full"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="text-primary-500 hover:text-primary-700 transition-colors"
            title="移除標籤"
          >
            ×
          </button>
        </span>
      ))}
    </div>
  )}
  
  {/* 標籤輸入區域 */}
  <div className="relative">
    <input
      type="text"
      value={tagInput}
      onChange={handleTagInputChange}
      onKeyDown={handleTagInputKeyDown}
      onBlur={handleTagInputBlur}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      placeholder={eventForm.tags.length === 0 ? "輸入標籤後按 Enter 新增" : "繼續新增標籤..."}
    />
    
    {/* 標籤建議 */}
    {showTagSuggestions && tagInput.length > 0 && (
      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 mt-1 max-h-48 overflow-y-auto">
        {/* 建議標籤列表 */}
      </div>
    )}
  </div>
</div>
```

**主要改進：**
- ✅ 支援多標籤管理，每個標籤獨立顯示
- ✅ 智能標籤建議系統
- ✅ 鍵盤快捷鍵操作（Enter 新增，Backspace 移除）
- ✅ 一鍵移除個別標籤
- ✅ 視覺化的標籤展示

### 2. 主圖上傳（已優化）
```typescript
// 主圖上傳區域
{mainImagePreview ? (
  <div className="relative group">
    <img
      src={mainImagePreview}
      alt="活動主圖預覽"
      className="w-32 h-24 object-cover rounded-lg border border-gray-300"
    />
    <button
      type="button"
      onClick={removeMainImage}
      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
      title="移除圖片"
    >
      ×
    </button>
    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
      <button
        type="button"
        onClick={() => mainImageRef.current?.click()}
        className="opacity-0 group-hover:opacity-100 bg-white text-gray-700 px-3 py-1 rounded-lg text-sm font-medium hover:bg-gray-100 transition-all duration-200"
      >
        更換圖片
      </button>
    </div>
  </div>
) : (
  <div
    className={`w-32 h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
      isDragOver 
        ? 'border-primary-500 bg-primary-50 text-primary-600' 
        : 'border-gray-300 bg-gray-50 text-gray-400 hover:border-primary-400 hover:bg-primary-50 hover:text-primary-500'
    }`}
    onClick={() => mainImageRef.current?.click()}
    onDragOver={handleDragOver}
    onDragLeave={handleDragLeave}
    onDrop={handleDrop}
  >
    <i className="ri-image-line text-2xl mb-1"></i>
    <span className="text-xs text-center">
      {isDragOver ? '放開上傳' : '點擊或拖拽上傳'}
    </span>
  </div>
)}

// 隱藏的檔案輸入
<input
  type="file"
  accept="image/*"
  style={{ display: 'none' }}
  ref={mainImageRef}
  onChange={handleMainImageUpload}
/>
```

**主要改進：**
- ✅ 支援拖拽上傳功能
- ✅ 懸停效果顯示操作按鈕
- ✅ 圖片預覽時支援更換圖片
- ✅ 拖拽狀態的視覺反饋
- ✅ 更直觀的上傳體驗

### 3. 活動狀態選擇
```typescript
// 活動狀態選擇器
<select
  value={eventForm.event_status}
  onChange={(e) => setEventForm({ 
    ...eventForm, 
    event_status: e.target.value as any 
  })}
>
  <option value="draft">草稿</option>
  <option value="registration_open">報名開放</option>
  <option value="registration_closed">報名截止</option>
  <option value="in_progress">進行中</option>
  <option value="completed">已完成</option>
  <option value="cancelled">已取消</option>
</select>
```

## 🎨 視覺改善

### 1. 活動卡片
- ✅ 新增主圖顯示區域
- ✅ 標籤以藍色圓角標籤形式顯示
- ✅ 統計資訊以網格形式顯示
- ✅ 改善整體佈局和間距

### 2. 表單佈局
- ✅ 使用網格佈局改善欄位排列
- ✅ 相關欄位分組顯示
- ✅ 響應式設計支援不同螢幕尺寸

### 3. 過濾介面
- ✅ 狀態過濾器替代類型過濾器
- ✅ 過濾選項更符合實際使用需求

## 🔄 相容性

- ✅ 向後相容：現有的功能保持不變
- ✅ 新增功能：可選擇性使用新功能
- ✅ 類型安全：完整的 TypeScript 支援
- ✅ 錯誤處理：統一的錯誤處理機制

## 📚 使用說明

### 1. 建立活動
1. 點擊「建立活動」按鈕
2. 填寫基本資訊（名稱、描述、價格等）
3. 選擇活動狀態
4. 管理標籤（支援多標籤、智能建議）
5. 上傳主圖（支援拖拽上傳、點擊上傳）
6. 設定參與人數和報到功能
7. 點擊「建立」完成

### 2. 標籤管理
- **新增標籤**：在標籤輸入框中輸入文字，按 Enter 鍵新增
- **移除標籤**：點擊標籤上的 × 按鈕，或按 Backspace 鍵移除最後一個
- **標籤建議**：輸入時會顯示相關的標籤建議，點擊即可新增
- **多標籤支援**：可以同時管理多個標籤，每個標籤獨立顯示

### 3. 圖片上傳
- **點擊上傳**：點擊上傳區域選擇圖片檔案
- **拖拽上傳**：直接將圖片檔案拖拽到上傳區域
- **圖片預覽**：上傳後會顯示圖片預覽
- **更換圖片**：懸停在圖片上會顯示「更換圖片」按鈕
- **移除圖片**：懸停時會顯示紅色 × 按鈕

### 2. 編輯活動
1. 點擊活動卡片上的編輯按鈕
2. 修改需要更新的欄位
3. 可以更新標籤和主圖
4. 點擊「更新」完成

### 3. 過濾活動
1. 使用搜尋欄位搜尋活動名稱或描述
2. 使用狀態過濾器按活動狀態篩選
3. 支援組合搜尋和過濾

## ⚠️ 注意事項

### 1. 檔案上傳
- 主圖支援 jpg, png, gif, webp 格式
- 檔案會自動上傳到 AWS S3
- 上傳失敗不會影響活動創建

### 2. 標籤處理
- 標籤用逗號分隔
- 系統會自動去除空白字元
- 空標籤會被自動過濾

### 3. 資料驗證
- 必填欄位有明確標示
- 數值欄位有適當的驗證
- 時間欄位使用 datetime-local 類型

## 🛠️ 技術細節

### 1. 狀態管理
- 使用 React useState 管理表單狀態
- 表單狀態與 API 介面完全一致
- 支援編輯和創建模式

### 2. 事件處理
- 統一的表單提交處理
- 完整的錯誤處理機制
- 成功操作的用戶反饋

### 3. 響應式設計
- 使用 Tailwind CSS 網格系統
- 支援不同螢幕尺寸
- 改善移動端使用體驗

## 📈 未來改進

### 1. 功能增強
- 支援多圖片上傳
- 添加活動模板功能
- 支援活動複製功能

### 2. 使用者體驗
- 添加拖拽排序功能
- 支援批量操作
- 添加進度指示器

### 3. 資料管理
- 支援活動匯入/匯出
- 添加活動歸檔功能
- 支援活動版本控制

## 📚 相關文件

- [ItemEvent API 更新記錄](../config/ITEMEVENT_API_UPDATES.md)
- [活動設定頁面原始碼](../src/pages/ActivitySettings.tsx)
- [API 配置文件](../src/config/api.ts)

## 🛠️ 技術支援

如有任何問題或需要協助，請聯繫開發團隊。所有更新都經過充分測試，確保穩定性和使用者體驗。
