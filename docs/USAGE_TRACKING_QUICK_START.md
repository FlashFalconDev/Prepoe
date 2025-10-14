# 應用情境停留 API - 快速開始

## ✅ 已完成的實施

### 1. 建立共用服務 (`src/services/usageTracking.ts`)

提供以下函數：
- `trackUsage()` - 通用追蹤函數
- `trackAudioStep()` - 音頻創作步驟追蹤
- `trackVideoStep()` - 影片創作步驟追蹤（Video.tsx 用）
- `trackVideoCreationStep()` - 影片創作步驟追蹤（VideoCreation.tsx 用）
- `trackPageVisit()` - 頁面訪問追蹤

### 2. 已整合頁面

#### ✅ 音頻創作 (`src/pages/Audio.tsx`)
- 每次點擊「下一步」時自動追蹤
- 追蹤 5 個步驟：基本資訊 → 語音模型 → 情緒調整 → 文案編輯 → AI生成

#### ✅ 影片創作 (`src/pages/VideoCreation.tsx`)
- 每次點擊「下一步」時自動追蹤
- 追蹤 5 個步驟：影片標題 → 語音模型 → 選擇素材 → 影片情境 → 生成影片

## 📋 追蹤資料總覽

### 音頻創作步驟

| 步驟 | action_id | action_name | now_page |
|:---:|-----------|-------------|----------|
| 1️⃣ | `ai_audio_step1` | 基本資訊 | 基本資訊 |
| 2️⃣ | `ai_audio_step2` | 語音模型 | 語音模型 |
| 3️⃣ | `ai_audio_step3` | 情緒調整 | 情緒調整 |
| 4️⃣ | `ai_audio_step4` | 文案編輯 | 文案編輯 |
| 5️⃣ | `ai_audio_step5` | AI生成 | AI生成 |

### 影片創作步驟

| 步驟 | action_id | action_name | now_page |
|:---:|-----------|-------------|----------|
| 1️⃣ | `video_creation_step1` | 影片標題 | 基本資訊 |
| 2️⃣ | `video_creation_step2` | 語音模型 | 語音模型 |
| 3️⃣ | `video_creation_step3` | 選擇素材 | 影像素材 |
| 4️⃣ | `video_creation_step4` | 影片情境 | 影片情境描述 |
| 5️⃣ | `video_creation_step5` | 生成影片 | AI生成 |

## 🚀 如何在新頁面使用

### 步驟 1：導入追蹤函數

```typescript
import { trackUsage, trackPageVisit } from '../services/usageTracking';
```

### 步驟 2：在適當時機調用

```typescript
// 方式 1：追蹤自定義事件
await trackUsage({
  action_id: 'my_feature_action',
  action_name: '我的功能操作',
  now_page: '我的頁面'
});

// 方式 2：追蹤頁面訪問
await trackPageVisit('設定頁面');
```

## 🔍 如何驗證追蹤是否成功

### 1. 開啟瀏覽器開發工具 (F12)

### 2. 切換到 Console 標籤

查看是否有以下日誌：
```
使用情境追蹤 API 回應: {"status":"success","message":"Customer Added 2"}
```

### 3. 切換到 Network 標籤

1. 篩選 `rise.iii.org.tw`
2. 找到 `customers/add/2` 請求
3. 查看 **Status**: 應該是 `200 OK`
4. 查看 **Payload**: 確認參數正確
5. 查看 **Response**: 應該包含成功訊息

## ⚙️ 自動傳送的參數

以下參數會自動處理，無需手動設定：

| 參數 | 來源 | 說明 |
|-----|------|------|
| `mode` | 固定值 | `"2"` |
| `app_id` | 固定值 | `"114_光隼"` |
| `device_id` | localStorage | 用戶 ID |
| `ip` | localStorage | 用戶 IP 地址 |
| `view` | navigator.userAgent | 自動判斷 `"phone"` 或 `"PC"` |
| `time` | Date.now() | Unix timestamp |
| `use_time` | 預設值 | `"0"` |

## 📊 API 回應說明

### ✅ 成功回應 (Status Code: 200)

```json
{
  "status": "success",
  "message": "Customer Added 2"
}
```

### ❌ 失敗回應 (Status Code: 400)

```json
{
  "status": "error",
  "message": "錯誤訊息"
}
```

## 💡 注意事項

1. ⚠️ 追蹤失敗不會影響主功能運作
2. ⚠️ 請勿在短時間內重複追蹤相同事件
3. ⚠️ 確保用戶已登入（localStorage 有用戶資訊）
4. ✅ 追蹤函數是異步的，使用 `await` 等待完成
5. ✅ 錯誤會自動記錄到 console，便於除錯

## 📄 完整文檔

詳細說明請參閱：[USAGE_TRACKING_API.md](./USAGE_TRACKING_API.md)

---

**建立日期**: 2025-01-07  
**狀態**: ✅ 已完成並測試

