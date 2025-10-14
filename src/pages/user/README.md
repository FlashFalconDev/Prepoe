# 活動報名頁面

## 功能概述

`EventJoin.tsx` 是一個完整的活動報名表頁面，允許用戶通過 SKU 參數訪問特定活動並完成報名。

## 路由配置

頁面路徑：`/user/event/join/:sku`

其中 `:sku` 是活動的唯一識別碼，用於載入對應的活動資訊。

## 主要功能

### 1. 活動資訊顯示
- 活動名稱、描述、時間、地點
- 活動主圖展示
- 活動標籤
- 報名狀態和參與人數
- 活動價格

### 2. 報名表單
- **基本資訊**：姓名、電子郵件、聯絡電話（必填）
- **公司資訊**：公司名稱、職稱（選填）
- **特殊需求**：飲食限制、其他需求（選填）
- **同意條款**：活動條款和隱私政策（必填）

### 3. 表單驗證
- 必填欄位檢查
- 電子郵件格式驗證
- 同意條款確認

### 4. 報名流程
- 表單提交前確認
- 報名狀態顯示
- 成功/失敗訊息處理

## API 端點

### 獲取活動資訊
```
GET /itemevent/api/events_sku/{sku}/
```

### 提交報名
```
POST /itemevent/api/events/join/{sku}/submit/
```

## 使用方式

### 1. 直接訪問
```
https://yourdomain.com/user/event/join/EVENT_SKU_123
```

### 2. 程式化跳轉
```typescript
import { createEventJoinUrl } from '../../config/api';

const joinUrl = createEventJoinUrl('EVENT_SKU_123');
navigate(joinUrl);
```

### 3. 在活動管理中添加報名連結
```typescript
// 在 ActivitySettings.tsx 中添加報名連結按鈕
<button
  onClick={() => {
    const joinUrl = createEventJoinUrl(event.sku);
    window.open(joinUrl, '_blank');
  }}
  className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg"
>
  報名連結
</button>
```

## 技術特點

### 1. 響應式設計
- 支援桌面和行動裝置
- 雙欄佈局（活動資訊 + 報名表單）

### 2. 狀態管理
- 載入狀態處理
- 表單提交狀態
- 錯誤處理和用戶反饋

### 3. 用戶體驗
- 拖拽上傳支援
- 即時表單驗證
- 確認對話框
- 成功/失敗提示

## 自定義配置

### 1. 表單欄位
可以在 `EventRegistrationData` 介面中添加或修改欄位：

```typescript
export interface EventRegistrationData {
  name: string;
  email: string;
  phone: string;
  company?: string;
  position?: string;
  // 添加新欄位
  emergency_contact?: string;
  dietary_restrictions?: string;
  special_requirements?: string;
  agree_terms: boolean;
  agree_privacy: boolean;
}
```

### 2. 驗證規則
在 `handleSubmit` 函數中添加自定義驗證邏輯：

```typescript
// 添加電話號碼格式驗證
if (!/^[\d\-\+\(\)\s]+$/.test(formData.phone)) {
  showError('電話格式錯誤', '請輸入有效的電話號碼');
  return;
}
```

### 3. 樣式主題
使用 Tailwind CSS 類別自定義外觀：

```typescript
// 修改主按鈕樣式
className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
```

## 注意事項

1. **SKU 參數**：確保活動有對應的 SKU 值
2. **API 權限**：報名 API 通常不需要用戶登入
3. **表單安全**：實施適當的 CSRF 保護
4. **資料驗證**：後端也需要實施相同的驗證邏輯
5. **錯誤處理**：妥善處理網路錯誤和 API 錯誤

## 未來擴展

1. **支付整合**：添加線上支付功能
2. **報名確認**：發送確認郵件或簡訊
3. **報名管理**：允許用戶查看和取消報名
4. **社交分享**：添加活動分享功能
5. **多語言支援**：國際化支援
