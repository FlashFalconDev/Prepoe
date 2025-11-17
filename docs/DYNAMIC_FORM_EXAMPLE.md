# 動態表單系統 - 範例配置

## 完整範例：創業高峰會活動

這是一個包含所有功能的完整範例，展示如何配置動態表單。

```json
{
  "sku": "EVENT_1761530532_f0f77a2d",
  "name": "2025 創業高峰會",
  "description": "為期兩天的創業者盛會",
  "base_price": 1000,
  "start_time": "2025-11-20T10:00:00",
  "end_time": "2025-11-20T17:00:00",
  "location": "台北國際會議中心",
  "form_fields": [
    {
      "id": "name",
      "type": "text",
      "label": "姓名",
      "placeholder": "請輸入您的姓名",
      "required": true,
      "order": 1
    },
    {
      "id": "email",
      "type": "email",
      "label": "電子郵件",
      "placeholder": "example@email.com",
      "required": true,
      "order": 2,
      "validation": {
        "pattern": "^[^@]+@[^@]+\\.[^@]+$",
        "errorMessage": "請輸入有效的電子郵件地址"
      }
    },
    {
      "id": "phone",
      "type": "tel",
      "label": "聯絡電話",
      "placeholder": "0912345678",
      "required": true,
      "order": 3,
      "validation": {
        "pattern": "^09\\d{8}$",
        "errorMessage": "請輸入有效的手機號碼（09開頭共10碼）"
      }
    },
    {
      "id": "company",
      "type": "text",
      "label": "公司名稱",
      "placeholder": "請輸入公司名稱",
      "required": false,
      "order": 4
    },
    {
      "id": "workshops",
      "type": "checkbox",
      "label": "工作坊場次選擇（最多選3場）",
      "required": true,
      "order": 5,
      "multiSelectConfig": {
        "minSelection": 1,
        "maxSelection": 3
      },
      "options": [
        {
          "value": "workshop_ai",
          "label": "AI 應用實務（10:00-12:00）",
          "price": 0
        },
        {
          "value": "workshop_marketing",
          "label": "數位行銷策略（13:00-15:00）",
          "price": 0
        },
        {
          "value": "workshop_brand",
          "label": "品牌建立工作坊（15:30-17:30）",
          "price": 0
        },
        {
          "value": "workshop_finance",
          "label": "創業財務管理（18:00-20:00）",
          "price": 0
        },
        {
          "value": "workshop_social",
          "label": "社群媒體經營（20:30-22:00）",
          "price": 0
        }
      ]
    },
    {
      "id": "ticket_type",
      "type": "radio",
      "label": "票種選擇",
      "required": true,
      "order": 6,
      "options": [
        {
          "value": "general",
          "label": "一般票",
          "price": 0
        },
        {
          "value": "vip",
          "label": "VIP票（含晚宴）",
          "price": 500
        }
      ]
    },
    {
      "id": "day_trip",
      "type": "radio",
      "label": "加購一日遊",
      "required": false,
      "order": 7,
      "options": [
        {
          "value": "no",
          "label": "不參加",
          "price": 0
        },
        {
          "value": "yes",
          "label": "參加一日遊（+500元）",
          "price": 500,
          "conditionalFields": [
            {
              "id": "id_number",
              "type": "text",
              "label": "身分證字號",
              "placeholder": "請輸入身分證字號",
              "required": true,
              "order": 1,
              "validation": {
                "pattern": "^[A-Z][12]\\d{8}$",
                "errorMessage": "請輸入有效的身分證字號"
              }
            },
            {
              "id": "trip_meal",
              "type": "radio",
              "label": "一日遊餐食選擇",
              "required": true,
              "order": 2,
              "options": [
                {
                  "value": "meat",
                  "label": "葷食",
                  "price": 0
                },
                {
                  "value": "vegetarian",
                  "label": "素食",
                  "price": 50
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "meal_preference",
      "type": "radio",
      "label": "會議期間餐食",
      "required": true,
      "order": 8,
      "options": [
        {
          "value": "meat",
          "label": "葷食",
          "price": 0
        },
        {
          "value": "vegetarian",
          "label": "素食",
          "price": 30
        },
        {
          "value": "vegan",
          "label": "全素",
          "price": 50
        }
      ]
    },
    {
      "id": "merchandise",
      "type": "checkbox",
      "label": "活動週邊商品（選購）",
      "required": false,
      "order": 9,
      "multiSelectConfig": {
        "maxSelection": 5
      },
      "options": [
        {
          "value": "tshirt_s",
          "label": "活動T恤 (S)",
          "price": 200
        },
        {
          "value": "tshirt_m",
          "label": "活動T恤 (M)",
          "price": 200
        },
        {
          "value": "tshirt_l",
          "label": "活動T恤 (L)",
          "price": 200
        },
        {
          "value": "cap",
          "label": "活動帽子",
          "price": 150
        },
        {
          "value": "bag",
          "label": "環保袋",
          "price": 100
        },
        {
          "value": "bottle",
          "label": "保溫瓶",
          "price": 300
        }
      ]
    },
    {
      "id": "dietary_restrictions",
      "type": "textarea",
      "label": "特殊飲食需求說明",
      "placeholder": "如有過敏原或其他特殊飲食需求，請在此說明",
      "required": false,
      "order": 10
    },
    {
      "id": "special_requirements",
      "type": "textarea",
      "label": "其他特殊需求",
      "placeholder": "如需協助或有其他特殊需求，請說明",
      "required": false,
      "order": 11
    },
    {
      "id": "agree_terms",
      "type": "boolean",
      "label": "我同意活動條款和相關規定",
      "required": true,
      "order": 98
    },
    {
      "id": "agree_privacy",
      "type": "boolean",
      "label": "我同意隱私政策和個人資料處理方式",
      "required": true,
      "order": 99
    }
  ]
}
```

## 價格計算範例

假設用戶填寫：
- 基本票價：NT$ 1,000
- VIP票：+NT$ 500
- 一日遊：+NT$ 500
  - 一日遊素食：+NT$ 50
- 會議素食：+NT$ 30
- T恤 (M)：+NT$ 200
- 環保袋：+NT$ 100

**總計：NT$ 2,380**

費用明細會自動顯示：
```
基本費用              NT$ 1,000
票種選擇: VIP票        NT$ 500
加購一日遊: 參加      NT$ 500
  一日遊餐食: 素食     NT$ 50
會議期間餐食: 素食     NT$ 30
週邊商品: T恤 (M)     NT$ 200
週邊商品: 環保袋       NT$ 100
─────────────────────────
總計                  NT$ 2,380
```

## 欄位類型說明

### 1. text / email / tel / number
基本輸入欄位
```json
{
  "id": "name",
  "type": "text",
  "label": "姓名",
  "placeholder": "請輸入姓名",
  "required": true,
  "order": 1,
  "validation": {
    "min": 2,
    "max": 50,
    "errorMessage": "姓名長度需在2-50字之間"
  }
}
```

### 2. textarea
多行文字輸入
```json
{
  "id": "special_requirements",
  "type": "textarea",
  "label": "特殊需求",
  "placeholder": "請說明您的需求",
  "required": false,
  "order": 10
}
```

### 3. select
下拉選單
```json
{
  "id": "shirt_size",
  "type": "select",
  "label": "T恤尺寸",
  "required": true,
  "order": 5,
  "options": [
    { "value": "s", "label": "S", "price": 0 },
    { "value": "m", "label": "M", "price": 0 },
    { "value": "l", "label": "L", "price": 0 }
  ]
}
```

### 4. radio
單選按鈕
```json
{
  "id": "meal",
  "type": "radio",
  "label": "餐食選擇",
  "required": true,
  "order": 6,
  "options": [
    { "value": "meat", "label": "葷食", "price": 0 },
    { "value": "vegetarian", "label": "素食", "price": 50 }
  ]
}
```

### 5. checkbox（多選）
```json
{
  "id": "interests",
  "type": "checkbox",
  "label": "興趣領域",
  "required": false,
  "order": 7,
  "options": [
    { "value": "tech", "label": "科技", "price": 0 },
    { "value": "business", "label": "商業", "price": 0 },
    { "value": "design", "label": "設計", "price": 0 }
  ]
}
```

### 6. checkbox（多選 + 數量限制）
```json
{
  "id": "workshops",
  "type": "checkbox",
  "label": "工作坊選擇（最多3場）",
  "required": true,
  "order": 8,
  "multiSelectConfig": {
    "minSelection": 1,
    "maxSelection": 3
  },
  "options": [...]
}
```

### 7. boolean
同意條款等
```json
{
  "id": "agree_terms",
  "type": "boolean",
  "label": "我同意活動條款",
  "required": true,
  "order": 99
}
```

### 8. 條件顯示欄位
選擇特定選項後才顯示子欄位
```json
{
  "id": "need_accommodation",
  "type": "radio",
  "label": "是否需要住宿",
  "required": true,
  "order": 10,
  "options": [
    {
      "value": "no",
      "label": "不需要",
      "price": 0
    },
    {
      "value": "yes",
      "label": "需要住宿",
      "price": 800,
      "conditionalFields": [
        {
          "id": "room_type",
          "type": "radio",
          "label": "房型選擇",
          "required": true,
          "order": 1,
          "options": [
            { "value": "single", "label": "單人房", "price": 0 },
            { "value": "double", "label": "雙人房", "price": 200 }
          ]
        },
        {
          "id": "check_in_date",
          "type": "text",
          "label": "入住日期",
          "required": true,
          "order": 2
        }
      ]
    }
  ]
}
```

## 驗證規則

### pattern（正則表達式）
```json
{
  "validation": {
    "pattern": "^09\\d{8}$",
    "errorMessage": "請輸入有效的手機號碼"
  }
}
```

### min / max（長度或數值限制）
```json
{
  "validation": {
    "min": 2,
    "max": 50,
    "errorMessage": "長度需在2-50字之間"
  }
}
```

## 注意事項

1. **order 欄位**：決定顯示順序，建議：
   - 基本資訊：1-10
   - 選擇項目：11-90
   - 同意條款：98-99

2. **required 欄位**：
   - `true`：必填
   - `false`：選填

3. **價格計算**：
   - 所有選項的價格都是**累加**到 `base_price`
   - 多選項目會累加所有選中的價格

4. **條件欄位**：
   - 只在父選項被選中時顯示
   - 驗證也只在顯示時才執行
   - 可以多層巢狀

5. **系統保留欄位 ID**（建議使用）：
   - `name`：姓名
   - `email`：電子郵件
   - `phone`：電話
   - `agree_terms`：同意條款
   - `agree_privacy`：同意隱私政策
   - `payment_type`：付款方式（系統自動處理）

## API 整合

後端 API `/itemevent/api/events_sku/{sku}/` 需要回傳完整的 `form_fields` 陣列。

前端會自動：
1. 根據 `form_fields` 渲染動態表單
2. 計算總價格
3. 驗證表單欄位
4. 提交時將資料扁平化

提交的資料格式：
```json
{
  "name": "Poker",
  "email": "poker@example.com",
  "phone": "0912345678",
  "workshops": ["workshop_ai", "workshop_marketing"],
  "ticket_type": "vip",
  "day_trip": "yes",
  "id_number": "A123456789",
  "trip_meal": "vegetarian",
  "meal_preference": "vegetarian",
  "merchandise": ["tshirt_m", "bag"],
  "agree_terms": true,
  "agree_privacy": true,
  "payment_type": "LINEPay"
}
```

