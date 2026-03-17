### LINE OA 管理與擴增功能相關 API 彙整

本文件整理 `LINE OA 管理` 畫面及其「擴增功能」底下所有前端有呼叫到的 API，方便後續檢查權限與邏輯是否正確。

---

## 1. LINE OA 管理主畫面（`PrivateDomain.tsx`）

**畫面位置**
- 路由：`/private-domain`（實際以 `App.tsx` 設定為準）
- 組件：`src/pages/PrivateDomain.tsx`

**使用中的 API**

- **取得 CSRF Token**
  - **Method**: `GET`
  - **URL**: `API_ENDPOINTS.CSRF` → `{{API_BASE}}/api/csrf/`
  - **呼叫位置**:
    - `fetchPlatforms()`：在打 `CHAT_PLATFORMS_MY` 前先嘗試拿 CSRF
    - `fetchManagedContent()`：在打 `LINE_MANAGED_CONTENT` 前先嘗試拿 CSRF
    - `handleCreateOA()`：建立 LINE Bot 前先嘗試拿 CSRF
    - `handleUpdateBot()`：更新 LINE Bot 前先嘗試拿 CSRF
  - **用途**: 取回 CSRF cookie，供後續 `POST/PUT` 等請求加上 `X-CSRFToken`。

- **取得目前登入者可用的客服平台列表**
  - **Method**: `GET`
  - **URL**: `API_ENDPOINTS.CHAT_PLATFORMS_MY` → `{{API_BASE}}/chatplatform/api/platforms/my_platforms/`
  - **呼叫位置**: `fetchPlatforms()`
  - **用途**: 取得「關聯客服助手的平台」下拉選單內容（`platforms`），讓 LINE Bot 可以綁定到某個客服平台。
  - **前端權限邏輯**: 僅依賴後端回傳列表，前端沒有再做額外角色判斷。

- **取得 LINE 管理內容（含可管理公司 / Bot 列表）**
  - **Method**: `GET`
  - **URL**: `API_ENDPOINTS.LINE_MANAGED_CONTENT` → `{{API_BASE}}/line/api/managed_content/`
  - **呼叫位置**:
    - `fetchManagedContent()`（`PrivateDomain.tsx`）
    - `loadManagedClients()`（`src/pages/manage/ManageSelector.tsx`）
  - **用途**:
    - 回傳：
      - 目前會員卡資訊（`member_card_id`, `member_info`）
      - `managed_clients`: 每個可管理的公司/品牌（含角色 `role`, `role_display`, 模組啟用狀態 `modules.*`，底下的 LINE Bot 列表 `bots`…）
      - `summary`: Bot / 會員數統計
    - `PrivateDomain` 主要用來：
      - 畫面上列出公司卡片與底下的 LINE Bot 列表
      - 顯示角色徽章（`client.role_display`）
      - 決定「已使用：X / community_count」等使用量
      - 作為「擴增功能」彈窗的來源（`extendClient`）
    - `ManageSelector` 用來產生可選擇的「要進入管理系統的公司」清單。
  - **前端權限邏輯**:
    - 前端完全依賴後端回傳的 `managed_clients` 與 `role`；只在 UI 上顯示角色，沒有額外限制哪些角色可以看到哪些公司。
    - 是否可以看到「擴增功能」按鈕完全由後端決定是否把該 `managed_client` 回傳。

- **建立 LINE Bot（新增 LINE OA）**
  - **Method**: `POST`
  - **URL**: `API_ENDPOINTS.LINE_CREATE_BOT` → `{{API_BASE}}/line/api/create_bot/`
  - **呼叫位置**: `handleCreateOA()`
  - **Request Body（部份）**:
    - `bot_name`, `bot_bid`, `bot_token`, `bot_sec`, `liffid`
    - `color_1`, `color_2`
    - 公司資訊：`co_sn`, `co_add`, `co_tel`, `co_name`, `co_email`
    - 關聯客服平台：`platform_id`（可為 `null`）
  - **前端權限邏輯**:
    - 僅透過 `FeatureGate feature="community_count"` + 使用量上限（`managedContent.total_managed_clients >= featureFlag.community_count`）來決定「新增 LINE OA」按鈕是否可點。
    - 沒有依 `role` 做限制，授權完全依賴後端。

- **更新 LINE Bot**
  - **Method**: `PUT`
  - **URL**: `API_ENDPOINTS.LINE_UPDATE_BOT(bot_bid)` → `{{API_BASE}}/line/api/update_bot/{bot_bid}/`
  - **呼叫位置**: `handleUpdateBot()`
  - **Request Body（部份）**: 與建立時相似，同樣包含公司資訊與 `platform_id`。
  - **前端權限邏輯**:
    - 針對 `Bot basic ID`（`bot_bid`）多了一層 UI 限制：
      - 若 `(editingBot.user_count || editingBotClient.member_count) > 0`，欄位被 disable，且顯示提示「當人數大於0時，Bot basic ID 不可修改」。
    - 其餘欄位（token、顏色、公司資訊等）沒有前端角色限制。

- **Rich Menu 相關（從 LINE OA 卡片右上角「Menu」按鈕進入）**
  - 由 `RichMenuEditor` + `richMenuApi` 觸發，詳見後面第 5 節。

---

## 2. 擴增功能入口（`PrivateDomain.tsx` → `ManageSelector` / `Manage*`）

**入口 UI**
- 每個 `managed_client` 卡片右上角有一顆「擴增功能」按鈕：
  - 點擊後開啟彈窗，顯示：
    - 「金鑰設定」
    - 「成就觸發」
    - 「儲值設定」
    - 「商城設定（即將推出）」※目前 disabled，無 API 呼叫
    - 「卡牌關聯（即將推出）」※目前 disabled，無 API 呼叫
    - 「電子票券」（導向 `/manage`）

**擴增功能彈窗本身不直接打 API**，但會依不同按鈕開啟下列模組（這些模組才會實際呼叫 API）：

- 「金鑰設定」→ `KeysManagerModal`
- 「成就觸發」→ `TriggerManagerModal`
- 「儲值設定」→ `RechargeManagerModal`
- 「電子票券」→ `navigate('/manage')`，再透過：
  - `ManageSelector` 使用 `LINE_MANAGED_CONTENT`
  - `ManageLayout` + 各種 `Manage*` 頁面（目前只有 `ManageDashboard` / `ManageKeys` 有實作）

`extendClient` 傳入上述三個 Modal 時，會帶入：
- `managed_client_id`
- `managed_client_sid`
- `managed_client_name` / `company_info.co_name`
- `role`（用於金鑰設定中的管理權限判斷）

---

## 3. 金鑰設定（`KeysManagerModal.tsx` & `ManageKeys.tsx`）

### 3.1 主要 API（`src/config/api.ts`）

- **建立金鑰批次**
  - **Function**: `keysCreateBatch(payload: KeyBatchCreatePayload)`
  - **Method**: `POST`
  - **URL**: `API_ENDPOINTS.KEYS_BATCH_CREATE` → `{{API_BASE}}/keys/api/batches/create/`
  - **主要欄位**（部分）:
    - `mode`: `'unique' | 'event' | 'achievement'`
    - 贈與內容：`points`, `coins`, `tokens`, `role`, `eticket_rewards`
    - `managed_client_id`
    - `days`, `count`, `code_len`, `max_uses`, `event_code`…視 `mode` 而定。

- **金鑰批次列表**
  - **Function**: `keysListBatches(params)`
  - **Method**: `GET`
  - **URL**: `API_ENDPOINTS.KEYS_BATCH_LIST` → `{{API_BASE}}/keys/api/batches/`
  - **Query 參數**: `page`, `page_size`, `managed_client_id`

- **金鑰批次詳情 / 金鑰清單**
  - **Function**: `keysGetBatchDetail(batchId, params?)`
  - **Method**: `GET`
  - **URL**: `API_ENDPOINTS.KEYS_BATCH_DETAIL(batchId)` → `{{API_BASE}}/keys/api/batches/{batchId}/`
  - **Query 參數**:
    - `status`: `'available' | 'used' | 'all'`（前端在多處使用）

- **取得可選的電子票券商品（用於金鑰贈與）**
  - **Function**: `keysGetEticketItems({ managed_client_id })`
  - **Method**: `GET`
  - **URL**: `API_ENDPOINTS.KEYS_ETICKET_ITEMS` → `{{API_BASE}}/keys/api/eticket-items/`

> 註：還有 `keysExportBatch`, `keysRedeem`, `keysMyRedemptions`, `keysMarkUsed` 等 API，但在本區塊 UI 目前只直接用到 `keysGetBatchDetail` 下載 CSV，不主動呼叫 `keysExportBatch`。

### 3.2 呼叫位置與用途

- **`src/components/keys/KeysManagerModal.tsx`**
  - `keysListBatches`：
    - 在「已建立列表」分頁載入批次（依 `managed_client_id` 過濾）。
  - `keysGetBatchDetail`：
    - `handleGetOne`：取一組 `status='available'` 的金鑰，顯示在「金鑰資訊」彈窗。
    - `handleDownload`：取得完整 `key_items` + `redemptions`，自組 CSV 檔下載。
    - `handleViewUsedKeys`：取 `status='used'` 清單顯示於「已使用金鑰列表」。
  - `keysGetEticketItems`：
    - 在建立批次時載入可選的「電子票券獎勵」列表（依 `managed_client_id` 過濾）。
  - `keysCreateBatch`：
    - `handleCreate`：建立新的金鑰批次（含 points / coins / tokens / role / eticket_rewards）。

- **`src/pages/manage/ManageKeys.tsx`**
  - 再次使用 `keysListBatches` / `keysGetBatchDetail` 做「金鑰設定」完整頁面：
    - 列出所有批次與統計。
    - 取得單一未使用金鑰（顯示 QRCode）。
    - 匯出 CSV。
    - 查看已使用金鑰列表。

### 3.3 前端權限與角色邏輯

- `KeysManagerModal`:
  - 接收 `userRole`（來自 `extendClient.role` 或在 `ManageKeys` 強制傳入 `'admin'`）。
  - **`isAdmin` 判斷**：
    - `const isAdmin = userRole === 'admin' || user?.is_superuser;`
    - 僅用來決定是否顯示 `Tokens` 欄位。
  - 其他操作（建立批次、下載、取用金鑰）**前端沒有再做角色限制**，僅依賴後端的權限檢查。

---

## 4. 成就觸發（`TriggerManagerModal.tsx`）

### 4.1 主要 API

- **條件觸發列表**
  - **Function**: `keysListTriggers({ managed_client_id, batch_id?, trigger_type?, is_active? })`
  - **Method**: `GET`
  - **URL**: `API_ENDPOINTS.KEYS_TRIGGERS_LIST` → `{{API_BASE}}/keys/api/triggers/`

- **條件觸發詳情**
  - **Function**: `keysGetTriggerDetail(triggerId, { managed_client_id })`
  - **Method**: `GET`
  - **URL**: `API_ENDPOINTS.KEYS_TRIGGER_DETAIL(triggerId)` → `{{API_BASE}}/keys/api/triggers/{triggerId}/`

- **建立條件觸發**
  - **Function**: `keysCreateTrigger(payload: KeyTriggerCreatePayload)`
  - **Method**: `POST`
  - **URL**: `API_ENDPOINTS.KEYS_TRIGGERS_CREATE` → `{{API_BASE}}/keys/api/triggers/create/`

- **更新條件觸發**
  - **Function**: `keysUpdateTrigger(triggerId, payload)`
  - **Method**: `PATCH`
  - **URL**: `API_ENDPOINTS.KEYS_TRIGGER_DETAIL(triggerId)` → `{{API_BASE}}/keys/api/triggers/{triggerId}/`

- **刪除條件觸發**
  - **Function**: `keysDeleteTrigger(triggerId, { managed_client_id })`
  - **Method**: `DELETE`
  - **URL**: `API_ENDPOINTS.KEYS_TRIGGER_DETAIL(triggerId)` → `{{API_BASE}}/keys/api/triggers/{triggerId}/`

- **金鑰批次列表 / 詳情（只取 `ACHIEVEMENT` 類型）**
  - 同 3.1 的 `keysListBatches` / `keysGetBatchDetail`。

### 4.2 呼叫位置與用途

- `fetchTriggers()`：
  - 使用 `keysListTriggers({ managed_client_id })` 取得所有觸發條件清單。
- `fetchAllBatches()`：
  - 使用 `keysListBatches` 取得所有批次，再對 `ACHIEVEMENT` 類型逐一呼叫 `keysGetBatchDetail` 補齊贈與內容。
- `enrichMissingBatchRewards()`：
  - 對列表中無對應 batch 資訊的觸發，呼叫 `keysGetTriggerDetail` 取得內含的 `batch` 物件。
- `handleCreate()`：
  - 根據 UI 選擇組出 `KeyTriggerCreatePayload`，呼叫 `keysCreateTrigger` 建立新觸發。
- `handleToggle()`：
  - 呼叫 `keysUpdateTrigger(triggerId, { managed_client_id, is_active: !currentActive })` 切換啟用/停用。
- `handleDelete()`：
  - 呼叫 `keysDeleteTrigger(triggerId, { managed_client_id })` 刪除觸發。

### 4.3 前端權限與角色邏輯

- Modal 的 `managedClientId` 直接來自 `extendClient.managed_client_id`。
- 前端 **沒有檢查 `role`**，只要能打開「擴增功能」就可以新增 / 刪除 / 切換條件觸發，實際授權交給後端。

---

## 5. 儲值設定（`RechargeManagerModal.tsx`）

### 5.1 儲值商品相關 API

- **取得儲值商品列表**
  - **Function**: `rechargeListItems()`
  - **Method**: `GET`
  - **URL**: `API_ENDPOINTS.SHOP_ITEMS` → `{{API_BASE}}/item/api/items/`
  - **Query 參數**: `type=recharge`

- **建立儲值商品**
  - **Function**: `rechargeCreateItem(payload: RechargeItemCreatePayload)`
  - **Method**: `POST`
  - **URL**: `{{API_BASE}}/item/api/create_item/`（直接字串，不透過 `API_ENDPOINTS`）

- **啟用 / 停用儲值商品**
  - **Function**: `rechargeToggleActive(itemId, isActive)`
  - **Method**: `POST`
  - **URL**: `{{API_BASE}}/item/api/active_item/`
  - **Body**: `{ item_pk: itemId, is_active: isActive }`

### 5.2 金鑰條件觸發部分

同第 4 節的 Keys Trigger API，被用來設定「購買某儲值商品後，自動發放某個成就金鑰批次」：

- `keysListTriggers({ managed_client_id, trigger_type: 'product_purchase' })`
- `keysCreateTrigger`（`trigger_type: 'product_purchase'`, `item_info_ids: [item.item_pk]`）
- `keysUpdateTrigger` / `keysDeleteTrigger`
- `keysListBatches` / `keysGetBatchDetail` / `keysGetTriggerDetail` 用於載入、補齊 ACHIEVEMENT 批次資訊。

### 5.3 呼叫位置與用途

- `fetchItems()` → `rechargeListItems()`：
  - 載入所有儲值商品列表。
- `handleCreateItem()` → `rechargeCreateItem()`：
  - 建立新的儲值商品。
- `handleToggleItem()` → `rechargeToggleActive()`：
  - 切換儲值商品啟用/停用。
- `fetchTriggers()` / `fetchAllBatches()` / `enrichMissingBatchRewards()`：
  - 同成就觸發，載入目前已對應到「儲值商品」的触發條件。
- `handleCreateTrigger()`：
  - 建立「購買觸發」，綁定儲值商品與 ACHIEVEMENT 批次。

### 5.4 前端權限與角色邏輯

- 同樣依 `managedClientId` 判斷操作範圍，前端沒有依 `role` 區分誰可以建立儲值商品或購買觸發。
- 商品啟用/停用、觸發啟用/停用、刪除操作都沒有額外角色判斷，授權交由後端處理。

---

## 6. 管理系統 / 電子票券相關（`ManageSelector`、`ManageLayout`、`ManageDashboard`、`ManageKeys`）

- **客戶選擇頁：`src/pages/manage/ManageSelector.tsx`**
  - API：
    - `api.get(API_ENDPOINTS.LINE_MANAGED_CONTENT)`（同上）
  - 用途：
    - 顯示所有 `managed_clients`，讓使用者選擇要進入哪一個公司的管理系統。
    - 選擇後把基本資訊存進 `sessionStorage['selected_manage_client']`，再導向 `/manage/{clientSid}`。

- **管理主殼：`src/components/ManageLayout.tsx`**
  - **不直接呼叫 API**，只讀取 `sessionStorage['selected_manage_client']` 並提供側邊選單：
    - 「戰情儀表板」→ `/manage/{clientSid}`
    - 「金鑰設定」→ `/manage/{clientSid}/keys`
    - 「商城設定」→ `/manage/{clientSid}/shop`（目前尚未實作頁面）
    - 「卡牌關聯」→ `/manage/{clientSid}/cards`（尚未實作）
    - 「電子票券」→ `/manage/{clientSid}/etickets`（尚未實作）

- **戰情儀表板：`src/pages/manage/ManageDashboard.tsx`**
  - 目前 **使用假資料**，有一行被註解掉的示意：
    - `// const response = await api.get(API_ENDPOINTS.MANAGE_DASHBOARD_STATS(clientSid));`
  - `API_ENDPOINTS` 內目前 **沒有 `MANAGE_DASHBOARD_STATS` 定義**，因此這段尚未接上真實 API。

- **金鑰設定頁：`src/pages/manage/ManageKeys.tsx`**
  - 主要使用的 API 與 `KeysManagerModal` 相同（見第 3 節）。

---

## 7. Rich Menu 編輯器相關 API（`RichMenuEditor` + `richMenuApi`）

### 7.1 Rich Menu API（`API_ENDPOINTS`）

- `RICH_MENUS` → `{{API_BASE}}/line/api/rich-menus/`
- `RICH_MENU_CREATE` → `{{API_BASE}}/line/api/rich-menus/create/`
- `RICH_MENU_UPDATE(menuId)` → `{{API_BASE}}/line/api/rich-menus/{menuId}/update/`
- `RICH_MENU_UPDATE_AREAS(menuId)` → `{{API_BASE}}/line/api/rich-menus/{menuId}/update-areas/`
- `RICH_MENU_DEPLOY(menuId)` → `{{API_BASE}}/line/api/rich-menus/{menuId}/deploy/`
- `RICH_MENU_DELETE(menuId)` → `{{API_BASE}}/line/api/rich-menus/{menuId}/delete/`
- `RICH_MENU_TEMPLATES` → `{{API_BASE}}/line/api/rich-menus/templates/`

### 7.2 `richMenuApi` 封裝（`src/services/richMenuApi.ts`）

- `getRichMenus(clientSid)` → `GET {{RICH_MENUS}}?managed_client_sid={clientSid}`
- `createRichMenu(menuData)` → `POST {{RICH_MENU_CREATE}}`（JSON）
- `createRichMenuWithFiles(menuData, imageFiles)` → `POST {{RICH_MENU_CREATE}}`（`FormData` + 圖片）
- `updateRichMenu(menuId, updateData)` → `PUT {{RICH_MENU_UPDATE(menuId)}}`
- `updateRichMenuWithFiles(menuId, menuData, imageFiles)` → `POST {{RICH_MENU_UPDATE(menuId)}}`（`FormData` 更新圖片）
- `deployRichMenu(menuId, imageId?)` → `POST {{RICH_MENU_DEPLOY(menuId)}}`
- `addImage(menuId, imageData)` → `POST {{RICH_MENUS}}{{menuId}}/images/`
- `switchImage(menuId, imageId)` → `POST {{RICH_MENUS}}{{menuId}}/switch-image/`
- `deleteRichMenu(menuId)` → `DELETE {{RICH_MENU_DELETE(menuId)}}`
- `getTemplates()` → `GET {{RICH_MENU_TEMPLATES}}`
- `updateAreas(menuId, areas)` → `PUT {{RICH_MENU_UPDATE_AREAS(menuId)}}`
- `getRichMenuDetail(menuId)` → `GET {{RICH_MENUS}}{{menuId}}/`

### 7.3 檔案上傳 API（`fileUploadApi`）

- **上傳檔案 / 圖片**
  - **Function**: `fileUploadApi.uploadFile(file)` / `fileUploadApi.uploadImageFile(file)`
  - **Method**: `POST`
  - **URL**: `/api/upload/`（相對路徑，由後端路由處理）
  - **用途**: Rich Menu 圖片實際上在 `RichMenuEditor` 目前 **未直接呼叫這個 API**，而是將使用者選的本機檔案壓縮後，先以 `data:` 或 `blob:` URL 存在前端，最後由 `createRichMenuWithFiles` / `updateRichMenuWithFiles` 直接上傳圖片。
  - 這個 API 仍可被其他地方使用。

---

## 8. 其他與權限相關的前端行為總結

- **FeatureGate / 使用量限制**
  - `PrivateDomain` 被 `FeatureGate feature="community_count"` 包住，且「新增 LINE OA」按鈕受 `featureFlag.community_count` 與後端回傳的 `managedContent.total_managed_clients` 限制。

- **角色與權限**
  - `LINE_MANAGED_CONTENT` 回傳每個 `managed_client.role`，前端用來：
    - 顯示角色徽章。
    - 在 `KeysManagerModal` 計算 `isAdmin`（影響是否能看到 `Tokens` 欄位）。
  - 其他操作如：
    - 新增 / 更新 LINE Bot
    - 建立 / 刪除金鑰批次
    - 建立 / 刪除條件觸發
    - 建立 / 啟用 / 停用儲值商品
    - Rich Menu 建立 / 刪除 / 部署
  - **都沒有前端再做角色檢查**，完全依賴後端的 Session / 權限系統來限制哪些使用者可以成功呼叫這些 API。

以上為目前「LINE OA 管理」及其「擴增功能」底下所有實際有被前端呼叫到的 API 整理，可直接對照後端的權限設定檢查是否有缺少權限判斷或暴露過多操作能力的情況。

