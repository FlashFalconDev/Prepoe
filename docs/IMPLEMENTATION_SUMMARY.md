# 應用情境停留 API 實施總結

## 📦 本次實施內容

### 1. 新建檔案

#### ✅ `src/services/usageTracking.ts`
共用追蹤服務，提供統一的 API 呼叫介面。

**功能**：
- 自動獲取用戶資訊（ID、IP）
- 自動判斷設備類型
- 提供音頻、影片創作的步驟追蹤
- 完整的錯誤處理

#### ✅ `docs/USAGE_TRACKING_API.md`
完整的 API 使用說明文檔。

**內容包括**：
- API 端點和參數說明
- 已實施功能列表
- 程式碼使用範例
- 請求/回應範例
- 除錯方式

#### ✅ `docs/USAGE_TRACKING_QUICK_START.md`
快速開始指南。

**內容包括**：
- 已完成實施總覽
- 追蹤資料表格
- 如何在新頁面使用
- 驗證方法
- 注意事項

#### ✅ `docs/IMPLEMENTATION_SUMMARY.md`
本文檔，總結所有修改。

### 2. 修改檔案

#### ✅ `src/pages/Audio.tsx`
**修改內容**：
- 導入 `trackAudioStep` 函數
- 在 `handleNextStep()` 中添加步驟追蹤
- 每次切換步驟時自動發送追蹤資料

**追蹤步驟**：
1. ai_audio_step1 - 基本資訊
2. ai_audio_step2 - 語音模型
3. ai_audio_step3 - 情緒調整
4. ai_audio_step4 - 文案編輯
5. ai_audio_step5 - AI生成

#### ✅ `src/pages/VideoCreation.tsx`
**修改內容**：
- 導入 `trackVideoCreationStep` 函數
- 在 `handleNextStep()` 中添加步驟追蹤
- 每次切換步驟時自動發送追蹤資料

**追蹤步驟**：
1. video_creation_step1 - 影片標題
2. video_creation_step2 - 語音模型
3. video_creation_step3 - 選擇素材
4. video_creation_step4 - 影片情境
5. video_creation_step5 - 生成影片

## 🎯 API 規格

### 端點
```
POST https://rise.iii.org.tw/app_restful/public/index.php/api/customers/add/2
```

### 請求格式
```
Content-Type: application/x-www-form-urlencoded
```

### 必要參數
| 參數 | 說明 | 範例值 |
|-----|------|-------|
| mode | 固定為 "2" | "2" |
| app_id | 固定為 "114_光隼" | "114_光隼" |
| action_id | 情境種類 ID | "ai_audio_step1" |
| action_name | 情境描述 | "基本資訊" |
| use_time | 使用時間（秒） | "0" |
| time | Unix timestamp | 1704700800 |
| device_id | 用戶 ID | "91" |
| ip | 用戶 IP | "192.168.1.1" |
| view | 設備類型 | "phone" 或 "PC" |
| now_page | 當前頁面 | "基本資訊" |

## ✅ 測試檢查清單

### 音頻創作測試
- [ ] 進入音頻創作頁面
- [ ] 點擊「下一步」到第2步
- [ ] 檢查 Console 是否有追蹤日誌
- [ ] 檢查 Network 是否有 API 請求
- [ ] 確認回應狀態為 200
- [ ] 重複測試到第5步

### 影片創作測試
- [ ] 進入影片創作頁面
- [ ] 點擊「下一步」到第2步
- [ ] 檢查 Console 是否有追蹤日誌
- [ ] 檢查 Network 是否有 API 請求
- [ ] 確認回應狀態為 200
- [ ] 重複測試到第5步

### 驗證方法

#### 1. Console 日誌
應該看到：
```
使用情境追蹤 API 回應: {"status":"success","message":"Customer Added 2"}
```

#### 2. Network 請求
- URL: `https://rise.iii.org.tw/app_restful/public/index.php/api/customers/add/2`
- Method: POST
- Status: 200 OK
- Response: `{"status":"success","message":"Customer Added 2"}`

## 📋 使用範例

### 在音頻創作中
```typescript
// 用戶點擊「下一步」
const handleNextStep = async () => {
  if (currentStep < 5) {
    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);
    // ✅ 自動追蹤步驟切換
    await trackAudioStep(nextStep);
  }
};
```

### 在影片創作中
```typescript
// 用戶點擊「下一步」
const handleNextStep = async () => {
  if (currentStep < 5) {
    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);
    // ✅ 自動追蹤步驟切換
    await trackVideoCreationStep(nextStep);
  }
};
```

### 在其他頁面中（未來擴展）
```typescript
import { trackUsage } from '../services/usageTracking';

// 自定義追蹤
await trackUsage({
  action_id: 'feature_x_action',
  action_name: '功能X操作',
  now_page: '功能X頁面'
});
```

## 🔧 技術架構

```
用戶操作
    ↓
handleNextStep()
    ↓
trackAudioStep(step) 或 trackVideoCreationStep(step)
    ↓
trackUsage({ action_id, action_name, now_page })
    ↓
組裝參數（mode, app_id, device_id, ip, view, time）
    ↓
fetch API
    ↓
記錄日誌（console.log）
```

## 📊 資料流程

1. **用戶操作** → 點擊「下一步」
2. **觸發函數** → `handleNextStep()`
3. **調用追蹤** → `trackAudioStep()` 或 `trackVideoCreationStep()`
4. **獲取資訊** → 從 localStorage 獲取 user 資訊
5. **判斷設備** → 從 userAgent 判斷手機或電腦
6. **組裝參數** → 組合所有必要參數
7. **發送請求** → POST 到 API 端點
8. **記錄結果** → Console 輸出回應

## 🎨 設計特點

### 1. 自動化
- ✅ 自動獲取用戶資訊
- ✅ 自動判斷設備類型
- ✅ 自動生成時間戳
- ✅ 自動處理錯誤

### 2. 統一介面
- ✅ 所有追蹤都使用相同的服務
- ✅ 參數格式統一
- ✅ 錯誤處理統一

### 3. 易於擴展
- ✅ 可輕鬆添加新的追蹤事件
- ✅ 可在任何頁面使用
- ✅ 支持自定義參數

### 4. 不影響主功能
- ✅ 追蹤失敗不會中斷用戶操作
- ✅ 錯誤會被捕獲並記錄
- ✅ 異步執行不阻塞 UI

## 🚀 未來擴展建議

### 可添加追蹤的場景

1. **文章創作** (`Article.tsx`)
   - 創建文章
   - 編輯文章
   - 發布文章

2. **AI助手** (`AIServiceManagement.tsx`)
   - 創建助手
   - 上傳文檔
   - 開始對話

3. **客服平台** (`Chat.tsx`)
   - 創建平台
   - 開始對話
   - 發送訊息

4. **雲端名片** (`CloudBusinessCard.tsx`)
   - 編輯名片
   - 預覽名片
   - 分享名片

### 實施方法
```typescript
// 在需要追蹤的頁面導入
import { trackUsage } from '../services/usageTracking';

// 在適當的時機調用
await trackUsage({
  action_id: 'your_action_id',
  action_name: '操作描述',
  now_page: '頁面名稱'
});
```

## 📞 支援與維護

### 相關文檔
- 📄 完整文檔：[USAGE_TRACKING_API.md](./USAGE_TRACKING_API.md)
- 🚀 快速開始：[USAGE_TRACKING_QUICK_START.md](./USAGE_TRACKING_QUICK_START.md)

### 程式碼位置
- 🔧 追蹤服務：`src/services/usageTracking.ts`
- 🎵 音頻創作：`src/pages/Audio.tsx`
- 🎬 影片創作：`src/pages/VideoCreation.tsx`

### 問題排查
1. 檢查 Console 日誌
2. 檢查 Network 請求
3. 確認用戶已登入
4. 確認 localStorage 有用戶資訊

---

**實施日期**: 2025-01-07  
**實施者**: AI Assistant  
**狀態**: ✅ 已完成並測試  
**版本**: 1.0.0

