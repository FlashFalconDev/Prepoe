# Flexweb 資格被擋時 API 輸出規格

當 flexweb API 因「資格不符」（例如需登入、抽牌次數已用完等）而無法回傳 `flex_deck` 時，後端會改回傳 `payable_items` 等欄位。為讓前端能呈現「直接選擇要購買的內容並進行付款」的流程（含金幣餘額、NT$／金幣價格、儲值、返回），請依下列方式調整輸出。

## 目前行為（資格被擋）

```json
{
  "success": true,
  "message": "獲取成功",
  "data": {
    "payable_items": [
      {
        "item_pk": 1465,
        "name": "59方案",
        "base_price": 59.0,
        "sku": "recharge_1773783348_2a16a7fe",
        "grant_tag_code": "59閱讀",
        "grant_valid_days": 1,
        "client_sid": "prepoe"
      }
    ],
    "require_login": true,
    "message_key": "請登入並確認資格"
  }
}
```

前端需要額外資訊才能顯示：

- 提示文案（例如「您的抽牌次數已用完」）
- 下次重置時間（若有）
- **已登入時**：會員金幣餘額、金幣折抵比例與上限，才能顯示「餘額: 1,288」「NT$ 15」「75 金幣」「使用需扣除 75 金幣」等

## 建議輸出調整

### 1. 維持既有欄位

- `success`, `message`, `data.payable_items`, `data.require_login`, `data.message_key` 保持不變。

### 2. 資格被擋時「一律」可帶的選用欄位（不論是否登入）

| 欄位 | 類型 | 說明 |
|------|------|------|
| `message_key` | string | 已有。前端可對應成提示文案（如「請登入並確認資格」「您的抽牌次數已用完」）。 |
| `next_reset_at` | string \| null | 選填。下次重置時間（ISO 8601），前端可顯示「下次重置: YYYY年MM月DD日」。 |

### 3. 已登入時「必須」額外回傳的會員／金幣資訊

當請求為**已驗證（有 session）**時，請在 `data` 中**額外**回傳會員卡／金幣資訊，前端才能顯示餘額與金幣購買區塊。

**做法一（建議）：在 `data` 內加上 `member_card`**

結構與現有「會員卡 API」回傳的 `data` 一致，例如：

```json
{
  "success": true,
  "message": "獲取成功",
  "data": {
    "payable_items": [ ... ],
    "require_login": false,
    "message_key": "您的抽牌次數已用完",
    "next_reset_at": "2026-03-10T00:00:00+08:00",
    "member_card": {
      "id": 9492,
      "card_id": "9492F",
      "exp": 0,
      "points": 100,
      "coins": 1288,
      "tokens": 0,
      "coins_per_twd": 5,
      "coin_max_redeem_coins": 75,
      "coin_max_redeem_amount_twd": 15.0,
      "client_info": { "id": 106, "name": null },
      "member_info": { "id": 8, "name": "Ethan Lee" }
    }
  }
}
```

前端會用到的欄位：

- `coins`：餘額（顯示「餘額: 1,288」）
- `coins_per_twd`：N 金幣 = 1 元（0 表示未開放金幣折抵）
- `coin_max_redeem_coins` / `coin_max_redeem_amount_twd`：顯示單筆可折抵金幣與 NT$ 上限（可選）
- `member_info`：顯示用（可選）

**做法二：在 `data` 內加上精簡的 `member_info`**

若不想帶完整 `member_card`，至少需提供：

- `coins` (number)
- `coins_per_twd` (number，0 = 不顯示金幣購買)
- 選填：`coin_max_redeem_coins`, `coin_max_redeem_amount_twd`, `card_id`, 顯示名稱等

前端會依 `data.member_card` 或 `data.member_info` 是否存在且含 `coins`／`coins_per_twd` 來決定是否顯示金幣購買區塊。

### 4. 情境對照

| 情境 | require_login | 建議 data 內容 |
|------|----------------|----------------|
| 未登入，需先登入 | true | `payable_items`, `message_key`；**不要**帶 `member_card` |
| 已登入，資格不足（例如次數用完） | false（或可不帶） | `payable_items`, `message_key`, 選填 `next_reset_at`, **必須**帶 `member_card`（或等價的 `member_info`） |

這樣前端即可：

1. 顯示「您的抽牌次數已用完」與「下次重置」。
2. 列出 `payable_items`（名稱、NT$、金幣價）。
3. 顯示「餘額: xxx」與「使用需扣除 xx 金幣」按鈕。
4. 提供儲值、返回等操作。

## 總結

- **資格被擋且未登入**：維持現有 `payable_items` + `require_login: true`，不帶 `member_card`。
- **資格被擋且已登入**：同樣回傳 `payable_items`，並**額外回傳 `member_card`**（或具 `coins`、`coins_per_twd` 的 `member_info`），以及選填 `next_reset_at`、`message_key`，即可滿足「直接選擇要購買的內容並進行付款」的介面需求。
