# ItemEvent 活動管理系統 API 更新記錄

## 📋 更新概述

根據最新的 API 文件，已對 `src/config/api.ts` 中的活動管理系統相關配置進行了全面更新和修正。

## 🔧 主要修正內容

### 1. 介面更新

#### ItemEventItem 介面
- ✅ 移除了 `cost_price` 和 `sku` 欄位（系統自動生成）
- ✅ 新增 `modules` 欄位：活動模組關聯列表
- ✅ 新增 `tags` 欄位：活動標籤列表
- ✅ 新增 `images` 欄位：活動圖片列表
- ✅ 新增 `main_image` 欄位：主圖資訊

#### ItemEventModuleAssignment 介面
- ✅ 新增 `module` 欄位：關聯的模組詳細資訊

#### 新增 ItemEventItemFormData 介面
- ✅ 專門用於建立和更新活動的介面
- ✅ 支援 `main_image_file` 檔案上傳
- ✅ 支援 `tags` 字串陣列或 JSON 字串格式

### 2. API 端點修正

#### 刪除活動端點
- ✅ 修正為：`/itemevent/api/events/{event_id}/delete/`
- ✅ 符合 API 文件規範

### 3. API 函數增強

#### 檔案上傳支援
- ✅ `createItemEventItem`：支援 multipart/form-data 上傳
- ✅ `updateItemEventItem`：支援 multipart/form-data 上傳
- ✅ 自動檢測檔案並切換到 FormData 模式
- ✅ 支援標籤陣列轉換為 JSON 字串

#### 新增輔助函數
- ✅ `canDeleteEvent`：檢查活動是否可以刪除
- ✅ `getEventStatusDisplay`：獲取活動狀態顯示文字
- ✅ `isEventActive`：檢查活動是否正在進行
- ✅ `canRegisterEvent`：檢查活動是否可以報名

## 📱 前端使用範例

### 建立活動（含圖片上傳）
```typescript
import { createItemEventItem } from '@/config/api';

const eventData = {
  name: '週年慶活動',
  description: '慶祝週年慶的特別活動',
  base_price: 100.00,
  start_time: '2024-01-01T10:00:00+08:00',
  end_time: '2024-01-01T18:00:00+08:00',
  location: '台北市',
  min_participants: 1,
  max_participants: 100,
  max_participants_per_user: 2,
  use_check_in: true,
  event_status: 'draft',
  form_fields: [],
  tags: ['熱門活動', '限時優惠'],
  main_image_file: fileInput.files[0] // File 物件
};

const response = await createItemEventItem(eventData);
```

### 更新活動
```typescript
import { updateItemEventItem } from '@/config/api';

const updateData = {
  name: '更新後的活動名稱',
  tags: ['新標籤1', '新標籤2'],
  main_image_file: newImageFile // 可選的新圖片
};

const response = await updateItemEventItem(eventId, updateData);
```

### 刪除活動
```typescript
import { deleteItemEventItem, canDeleteEvent } from '@/config/api';

// 檢查是否可以刪除
if (canDeleteEvent(event)) {
  const response = await deleteItemEventItem(event.id);
  if (response.success) {
    console.log('活動刪除成功');
  }
} else {
  console.log('此活動已有相關訂單，無法刪除');
}
```

### 檢查活動狀態
```typescript
import { 
  getEventStatusDisplay, 
  isEventActive, 
  canRegisterEvent 
} from '@/config/api';

// 獲取狀態顯示文字
const statusText = getEventStatusDisplay(event.event_status);

// 檢查是否正在進行
const isActive = isEventActive(event);

// 檢查是否可以報名
const canRegister = canRegisterEvent(event);
```

## ⚠️ 重要注意事項

### 1. 檔案上傳
- 主圖檔案會自動上傳到 AWS S3
- 支援 jpg, png, gif, webp 等格式
- 圖片會自動壓縮和優化

### 2. 標籤處理
- 前端傳送字串陣列：`['標籤1', '標籤2']`
- 系統會自動在 Item 應用中創建對應標籤
- 支援隱藏標籤功能

### 3. 刪除限制
- 如果活動已有相關訂單，無法刪除
- 刪除操作不可逆，會同時刪除相關資料

### 4. HTTP 方法
- **GET**: 讀取資料
- **POST**: 新增資料
- **PUT**: 更新資料
- **DELETE**: 刪除資料

## 🔄 相容性

- ✅ 向後相容：現有的 API 調用無需修改
- ✅ 新增功能：可選擇性使用新功能
- ✅ 類型安全：完整的 TypeScript 支援
- ✅ 錯誤處理：統一的錯誤回應格式

## 📚 相關文件

- [ItemEvent 活動管理系統 API 文件](../docs/ACTIVITY_SETTINGS_README.md)
- [活動設定頁面](../src/pages/ActivitySettings.tsx)
- [API 配置文件](../src/config/api.ts)

## 🛠️ 技術支援

如有任何問題或需要協助，請聯繫開發團隊。所有 API 都經過充分測試，確保穩定性和安全性。
