# 如何驗證追蹤 API 是否成功

## 🎯 三種驗證方法

---

## 方法 1：Console 日誌（推薦新手）

### 步驟

1. **打開瀏覽器開發工具**
   - Windows: `F12` 或 `Ctrl + Shift + I`
   - Mac: `Cmd + Option + I`

2. **切換到 Console 標籤**

3. **執行操作**
   - 進入音頻創作或影片創作頁面
   - 點擊「下一步」按鈕

4. **查看日誌輸出**

### ✅ 成功的日誌

```javascript
使用情境追蹤 API 回應: {"status":"success","message":"Customer Added 2"}
```

### ❌ 失敗的日誌

```javascript
使用情境追蹤失敗: 400 {"status":"error","message":"錯誤原因"}
// 或
發送使用情境追蹤時發生錯誤: Error: Network Error
```

---

## 方法 2：Network 請求（推薦進階用戶）

### 步驟

1. **打開開發工具** (F12)

2. **切換到 Network 標籤**

3. **（可選）篩選請求**
   - 在篩選框輸入：`rise.iii.org.tw`
   - 或輸入：`customers`

4. **執行操作**
   - 點擊「下一步」

5. **查看請求列表**
   - 找到 URL 包含 `/customers/add/2` 的請求
   - 點擊該請求查看詳情

### ✅ 成功的請求

#### General（概要）
```
Request URL: https://rise.iii.org.tw/app_restful/public/index.php/api/customers/add/2
Request Method: POST
Status Code: 200 OK
```

#### Request Payload（請求參數）
```
mode: 2
app_id: 114_光隼
action_id: ai_audio_step2
action_name: 語音模型
use_time: 0
time: 1704700800
device_id: 91
ip: 192.168.1.1
view: phone
now_page: 語音模型
```

#### Response（回應）
```json
{
  "status": "success",
  "message": "Customer Added 2"
}
```

### ❌ 失敗的請求

#### General（概要）
```
Status Code: 400 Bad Request
```
或
```
Status Code: 500 Internal Server Error
```

#### Response（回應）
```json
{
  "status": "error",
  "message": "缺少必要參數"
}
```

---

## 方法 3：使用 Console 直接測試（開發者用）

### 手動測試追蹤函數

在 Console 中直接執行：

```javascript
// 測試音頻步驟追蹤
const { trackAudioStep } = await import('/src/services/usageTracking.ts');
await trackAudioStep(1);
```

或

```javascript
// 測試影片步驟追蹤
const { trackVideoCreationStep } = await import('/src/services/usageTracking.ts');
await trackVideoCreationStep(1);
```

---

## 🔍 詳細的 Network 檢查清單

點擊 Network 中的請求後，可以查看：

### Headers（標頭）

#### General
- ✅ Request URL 正確
- ✅ Request Method 是 POST
- ✅ Status Code 是 200

#### Request Headers
- ✅ Content-Type: `application/x-www-form-urlencoded`

### Payload（載荷）

#### Form Data
確認以下參數都有值：
- ✅ `mode`: "2"
- ✅ `app_id`: "114_光隼"
- ✅ `action_id`: 例如 "ai_audio_step1"
- ✅ `action_name`: 例如 "基本資訊"
- ✅ `use_time`: "0"
- ✅ `time`: Unix timestamp（數字）
- ✅ `device_id`: 用戶 ID（數字）
- ✅ `ip`: IP 地址
- ✅ `view`: "phone" 或 "PC"
- ✅ `now_page`: 頁面名稱

### Response（回應）

#### Response Body
```json
{
  "status": "success",
  "message": "Customer Added 2"
}
```

---

## 🐛 常見問題排查

### 問題 1：沒有看到任何日誌

**可能原因**：
- Console 被清除了
- 日誌被篩選隱藏了

**解決方法**：
1. 取消所有 Console 篩選
2. 確認 Console 的 Log level 包含 "Info"
3. 重新執行操作

### 問題 2：看到 "device_id" 是空的

**可能原因**：
- 用戶未登入
- localStorage 中沒有 user 資訊

**解決方法**：
1. 確認已登入系統
2. 在 Console 執行檢查：
```javascript
const user = JSON.parse(localStorage.getItem('user'));
console.log('用戶資訊:', user);
```

### 問題 3：請求返回 400 錯誤

**可能原因**：
- 必要參數缺失
- 參數格式錯誤

**解決方法**：
1. 檢查 Network → Payload，確認所有參數都有值
2. 檢查 Response，查看具體錯誤訊息

### 問題 4：請求返回 500 錯誤

**可能原因**：
- 後端伺服器錯誤
- API 端點問題

**解決方法**：
1. 確認 API 端點 URL 正確
2. 聯繫後端團隊檢查伺服器狀態

### 問題 5：看不到 Network 請求

**可能原因**：
- Network 標籤未保留日誌
- 請求在切換標籤前就完成了

**解決方法**：
1. 在 Network 標籤勾選 "Preserve log"（保留日誌）
2. 清除現有請求（垃圾桶圖標）
3. 重新執行操作

---

## 📊 驗證流程圖

```
開始
  ↓
打開開發工具 (F12)
  ↓
切換到 Console 標籤
  ↓
執行操作（點擊下一步）
  ↓
查看 Console
  ↓
有看到成功訊息？
  ├─ YES → ✅ 追蹤成功！
  └─ NO → 切換到 Network 標籤
           ↓
         找到 customers/add/2 請求
           ↓
         Status Code 是 200？
           ├─ YES → 檢查 Response 內容
           │         ↓
           │       status: "success"？
           │         ├─ YES → ✅ 追蹤成功！
           │         └─ NO → ❌ API 返回錯誤
           │
           └─ NO → ❌ 請求失敗
                   ↓
                 查看錯誤訊息
                   ↓
                 參考「常見問題排查」
```

---

## 🎬 實際測試範例

### 範例 1：測試音頻創作第1步

1. 進入音頻創作頁面
2. F12 打開開發工具
3. 切換到 Console
4. 點擊「下一步」（從步驟1到步驟2）
5. 應該看到：

```javascript
使用情境追蹤 API 回應: {"status":"success","message":"Customer Added 2"}
```

### 範例 2：測試影片創作完整流程

1. 進入影片創作頁面
2. F12 打開開發工具
3. 勾選 Network 的 "Preserve log"
4. 切換到 Console
5. 依次點擊每個「下一步」
6. 應該看到 5 次成功訊息（步驟 1→2, 2→3, 3→4, 4→5, 完成）
7. 切換到 Network
8. 應該看到 5 個 `/customers/add/2` 請求，全部 Status 200

---

## 🎯 快速檢查表

複製此檢查表用於測試：

### 音頻創作追蹤檢查
- [ ] 打開 F12 開發工具
- [ ] 切換到 Console 標籤
- [ ] 進入音頻創作頁面
- [ ] 點擊「下一步」到步驟 2
- [ ] Console 顯示成功訊息
- [ ] 繼續到步驟 3
- [ ] Console 再次顯示成功訊息
- [ ] 切換到 Network 標籤
- [ ] 找到 2 個 `customers/add/2` 請求
- [ ] 所有請求 Status 都是 200

### 影片創作追蹤檢查
- [ ] 打開 F12 開發工具
- [ ] 切換到 Console 標籤
- [ ] 進入影片創作頁面
- [ ] 點擊「下一步」到步驟 2
- [ ] Console 顯示成功訊息
- [ ] 繼續到步驟 3
- [ ] Console 再次顯示成功訊息
- [ ] 切換到 Network 標籤
- [ ] 找到 2 個 `customers/add/2` 請求
- [ ] 所有請求 Status 都是 200

---

## 💡 專業提示

### 提示 1：保留日誌
在 Network 和 Console 標籤都勾選 "Preserve log"，這樣頁面刷新時不會丟失日誌。

### 提示 2：使用篩選
在 Console 中輸入 `追蹤` 或 `tracking` 來只顯示追蹤相關的日誌。

### 提示 3：複製請求為 cURL
在 Network 中右鍵點擊請求 → Copy → Copy as cURL，可以在終端機重現請求。

### 提示 4：查看時間戳
檢查每個請求的 `time` 參數，確認是當前時間（Unix timestamp）。

### 提示 5：比對 action_id
確認每個步驟的 `action_id` 符合預期：
- 步驟 2: `ai_audio_step2` 或 `video_creation_step2`
- 步驟 3: `ai_audio_step3` 或 `video_creation_step3`
- 以此類推

---

## 📞 需要幫助？

如果遇到問題：

1. **檢查完整文檔**：
   - [USAGE_TRACKING_API.md](./USAGE_TRACKING_API.md)
   - [USAGE_TRACKING_QUICK_START.md](./USAGE_TRACKING_QUICK_START.md)

2. **常見錯誤**：參考本文「常見問題排查」章節

3. **提供資訊**：
   - Console 的完整錯誤訊息
   - Network 請求的 Status Code
   - Payload 中的參數值
   - Response 中的錯誤訊息

---

**最後更新**: 2025-01-07  
**版本**: 1.0.0

