# 應用情境停留 API 使用說明

## 📋 概述

本文檔說明如何使用應用情境停留 API 來追蹤用戶在智慧影音生成模組中的使用情況。

## 🔗 API 端點

```
POST https://rise.iii.org.tw/app_restful/public/index.php/api/customers/add/2
```

## 📊 參數說明

### 必填參數

| 參數名稱 | 中文名稱 | 類型 | 說明 | 範例 |
|---------|---------|------|------|------|
| `mode` | 資料類別 | varchar(10) | 固定參數值設定為 2 | `"2"` |
| `app_id` | 識別碼 | varchar(100) | 固定回傳 "114_光隼" | `"114_光隼"` |
| `action_id` | 情境種類 | varchar(100) | 情境種類，固定回傳，例如：新增分頁或離開頁面 | `"ai_audio_step1"` |
| `action_name` | 情境描述 | varchar(100) | 情境描述，固定回傳，例如：首頁、主題頁（主題）、搜尋結果頁（搜尋）... | `"基本資訊"` |
| `use_time` | 總使用時間 | varchar(100) | 從使用者進入此頁面至今，頁面所停留秒數 | `"0"` |
| `time` | 資料傳送時間 | int(11) | Unix timestamp, 從 1970年1月1日0時0分0秒起至現在的總秒數 | `1704700800` |
| `device_id` | 唯一識別碼 | varchar(100) | 唯一識別碼，可傳會員 ID、帳號等可區分會員之值即可 | `"91"` |
| `ip` | 使用者 IP | varchar(100) | 回傳使用者的 IP，例：111.111.111.111 | `"192.168.1.1"` |
| `view` | 使用手機或電腦 | varchar(10) | 回傳此 API 時使用手機或電腦，若是手機回傳 phone，是電腦則回傳 PC | `"phone"` 或 `"PC"` |
| `now_page` | 現在的頁面 | varchar(10) | 依照例如：首頁、主題頁、搜尋過濾選單、搜尋結果頁、產品細節頁、下單頁或結帳頁 | `"基本資訊"` |

## 🎯 已實施功能

### 1. 音頻創作追蹤 (`Audio.tsx`)

追蹤用戶在音頻創作流程中的步驟切換：

| 步驟 | action_id | action_name | now_page |
|-----|-----------|-------------|----------|
| 1 | `ai_audio_step1` | 基本資訊 | 基本資訊 |
| 2 | `ai_audio_step2` | 語音模型 | 語音模型 |
| 3 | `ai_audio_step3` | 情緒調整 | 情緒調整 |
| 4 | `ai_audio_step4` | 文案編輯 | 文案編輯 |
| 5 | `ai_audio_step5` | AI生成 | AI生成 |

**實施位置**：每次用戶點擊「下一步」按鈕時自動追蹤

### 2. 影片創作追蹤 (`VideoCreation.tsx`)

追蹤用戶在影片創作流程中的步驟切換：

| 步驟 | action_id | action_name | now_page |
|-----|-----------|-------------|----------|
| 1 | `video_creation_step1` | 影片標題 | 基本資訊 |
| 2 | `video_creation_step2` | 語音模型 | 語音模型 |
| 3 | `video_creation_step3` | 選擇素材 | 影像素材 |
| 4 | `video_creation_step4` | 影片情境 | 影片情境描述 |
| 5 | `video_creation_step5` | 生成影片 | AI生成 |

**實施位置**：每次用戶點擊「下一步」按鈕時自動追蹤

## 💻 程式碼使用範例

### 基本使用

```typescript
import { trackUsage } from '../services/usageTracking';

// 追蹤自定義事件
await trackUsage({
  action_id: 'custom_action',
  action_name: '自定義操作',
  now_page: '當前頁面',
  use_time: '60'  // 可選，預設為 "0"
});
```

### 音頻創作步驟追蹤

```typescript
import { trackAudioStep } from '../services/usageTracking';

// 追蹤音頻創作第1步
await trackAudioStep(1);
```

### 影片創作步驟追蹤

```typescript
import { trackVideoCreationStep } from '../services/usageTracking';

// 追蹤影片創作第3步
await trackVideoCreationStep(3);
```

### 頁面訪問追蹤

```typescript
import { trackPageVisit } from '../services/usageTracking';

// 追蹤頁面訪問
await trackPageVisit('設定頁面');
```

## 📝 API 請求範例

### 請求格式

```http
POST https://rise.iii.org.tw/app_restful/public/index.php/api/customers/add/2
Content-Type: application/x-www-form-urlencoded

mode=2&app_id=114_%E5%85%89%E9%9A%BC&action_id=ai_audio_step1&action_name=%E5%9F%BA%E6%9C%AC%E8%B3%87%E8%A8%8A&use_time=0&time=1704700800&device_id=91&ip=192.168.1.1&view=phone&now_page=%E5%9F%BA%E6%9C%AC%E8%B3%87%E8%A8%8A
```

### 成功回應

```json
{
  "status": "success",
  "message": "Customer Added 2"
}
```

- **Status Code**: 200

### 失敗回應

```json
{
  "status": "error",
  "message": "錯誤訊息"
}
```

- **Status Code**: 400 或其他錯誤代碼

## 🔧 技術實作

### 服務檔案：`src/services/usageTracking.ts`

這個服務提供了統一的追蹤功能：

- ✅ 自動從 `localStorage` 獲取用戶資訊
- ✅ 自動判斷設備類型（手機/電腦）
- ✅ 自動生成 Unix timestamp
- ✅ 處理 URL-encoded 格式轉換
- ✅ 錯誤處理和日誌記錄

### 已整合頁面

1. ✅ **音頻創作** (`src/pages/Audio.tsx`)
   - 在 `handleNextStep` 函數中調用 `trackAudioStep()`
   
2. ✅ **影片創作** (`src/pages/VideoCreation.tsx`)
   - 在 `handleNextStep` 函數中調用 `trackVideoCreationStep()`

## 📈 資料流程

```
用戶操作 → 觸發步驟切換 → 調用追蹤函數 → 組裝參數 → 發送 API 請求 → 記錄日誌
```

## 🎨 最佳實踐

### 1. 何時追蹤？

- ✅ 用戶完成重要操作時
- ✅ 用戶切換步驟時
- ✅ 用戶進入新頁面時
- ❌ 不要在每個小動作都追蹤（避免過多請求）

### 2. 命名規範

- `action_id`: 使用小寫英文和底線，例如：`ai_audio_step1`
- `action_name`: 使用中文描述，簡潔明瞭
- `now_page`: 使用中文頁面名稱

### 3. 錯誤處理

追蹤函數已經包含錯誤處理，不會影響主要功能流程：

```typescript
try {
  await trackAudioStep(nextStep);
} catch (error) {
  // 錯誤會被內部捕獲，不影響用戶操作
  console.error('追蹤失敗:', error);
}
```

## 🐛 除錯方式

### 1. 檢查 Console 日誌

在瀏覽器開發工具的 Console 中查看：

```
使用情境追蹤 API 回應: {"status":"success","message":"Customer Added 2"}
```

### 2. 檢查 Network 請求

在 Network 標籤中篩選 `rise.iii.org.tw` 請求，查看：
- 請求參數是否正確
- 回應狀態碼
- 回應內容

### 3. 檢查用戶資訊

確認 `localStorage` 中有用戶資訊：

```javascript
const user = JSON.parse(localStorage.getItem('user'));
console.log('用戶 ID:', user.id);
console.log('用戶 IP:', user.ip_address);
```

## 📞 聯絡資訊

如有問題或需要協助，請聯繫：
- 限關資料
- 版權所有
- 翻印必究

---

**最後更新日期**: 2025-01-07
**維護者**: 資策會數位研發部 FIND 團隊管理

