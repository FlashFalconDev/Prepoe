# CardHack 需求單 API 規格文件

## 概述

需求單模式用於批量生成卡牌圖片。用戶提交需求單後，後端在背景逐張處理，用戶可隨時查詢進度。

---

## API 端點總覽

| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | `/cardhack/api/orders/` | 取得使用者的所有需求單 |
| POST | `/cardhack/api/orders/create/` | 建立新需求單 |
| GET | `/cardhack/api/orders/{order_id}/` | 取得需求單詳情 |
| GET | `/cardhack/api/orders/{order_id}/status/` | 輕量查詢進度 (用於輪詢) |
| POST | `/cardhack/api/orders/{order_id}/cancel/` | 取消需求單 |
| POST | `/cardhack/api/orders/{order_id}/cards/{card_index}/retry/` | 重試單張卡牌 |
| POST | `/cardhack/api/orders/{order_id}/retry-failed/` | 重試所有失敗卡牌 |

---

## 1. 建立需求單

### Request

```
POST /cardhack/api/orders/create/
Content-Type: application/json
```

```json
{
  "deck_name": "我的塔羅牌",
  "deck_description": "神秘風格的塔羅牌組",
  "category": "tarot",
  "style": {
    "art_style": "fantasy",
    "color_palette": ["#9333ea", "#eab308", "#1e1b4b"],
    "border_style": "golden",
    "lora_style": "E05",
    "custom_prompt_suffix": "with mystical aura and golden particles"
  },
  "cards": [
    {
      "name": "The Fool",
      "name_cn": "愚者",
      "category": "major",
      "number": 0,
      "keywords": ["新開始", "冒險", "天真"],
      "base_prompt": "A young traveler standing at cliff edge, carrying a small bag, a white dog beside them, looking up at the sky with innocent joy"
    },
    {
      "name": "The Magician",
      "name_cn": "魔術師",
      "category": "major",
      "number": 1,
      "keywords": ["創造", "意志", "技巧"],
      "base_prompt": "A powerful magician at an altar with the four suits (wand, cup, sword, pentacle), one hand raised to sky, one pointing to earth"
    }
    // ... 其他卡牌
  ]
}
```

### Request 欄位說明

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `deck_name` | string | Y | 卡組名稱 |
| `deck_description` | string | N | 卡組描述 |
| `category` | enum | Y | 類別: `tarot`, `playing`, `rune`, `angel`, `custom` |
| `style.art_style` | enum | Y | 藝術風格: `watercolor`, `digital`, `vintage`, `minimalist`, `fantasy`, `realistic` |
| `style.color_palette` | array | Y | 色票陣列 (hex)，例如 `["#9333ea", "#eab308", "#1e1b4b"]`，1-5 個顏色 |
| `style.border_style` | enum | Y | 邊框: `golden`, `silver`, `none`, `ornate`, `simple` |
| `style.lora_style` | string | N | 材質風格 LORA: `E01`~`E12` 或 `null`，詳見下方 LORA_STYLES 說明 |
| `style.custom_prompt_suffix` | string | N | 額外的風格描述，會附加到每張卡牌的 prompt |
| `cards` | array | Y | 卡牌列表 |
| `cards[].name` | string | Y | 卡牌英文名 |
| `cards[].name_cn` | string | Y | 卡牌中文名 |
| `cards[].category` | string | N | 卡牌分類 (如 major/minor) |
| `cards[].number` | number | N | 卡牌編號 |
| `cards[].keywords` | array | N | 關鍵字列表 |
| `cards[].base_prompt` | string | Y | 基礎圖片生成 prompt |

### LORA_STYLES 材質風格說明

| ID | 名稱 | triggers | 說明 |
|----|------|----------|------|
| `E01` | 液體流動紋理 | liquid blue, liquid gold, movement, wavy | 適合：水元素、流動感、財富、情感相關牌組 |
| `E02` | 彩色散景光暈 | bokeh, colorful, illumination, light trails | 適合：光明、喜悅、神聖、啟蒙相關牌組 |
| `E03` | 模糊金色調 | blurred dark gold, blurred gold | 適合：財富、豐收、神秘相關牌組 |
| `E04` | 金色bokeh最密集 | detailed dark gold, gold bokeh | 適合：成功、榮耀、勝利相關牌組 |
| `E05` | 史詩細節豐富 | epic details, gold details, very detailed | 適合：史詩、傳統、北歐神話相關牌組 |
| `E06` | 深棕藍綠色調 | brown, dark brown, dark blue green | 適合：大地、森林、自然相關牌組 |
| `E07` | 科幻未來感 | futurist, abstract, alien, sci-fi, energy | 適合：科幻、未來、能量相關牌組 |
| `E08` | 印象派油畫 | impressionist, oil painting, warm tones | 適合：藝術、溫暖、情感相關牌組 |
| `E09` | 陽光金色光線 | sunlight, golden rays, atmospheric | 適合：光明、希望、覺醒相關牌組 |
| `E10` | 幾何極簡主義 | geometric, architecture, minimalism | 適合：極簡、現代、平衡相關牌組 |
| `E11` | 宇宙星空 | black space, planet, cosmic view | 適合：宇宙、命運、神秘相關牌組 |
| `E12` | 火燒雲夕陽 | sunset, vibrant clouds, fiery sky | 適合：變化、熱情、力量相關牌組 |

### Response (成功)

```json
{
  "success": true,
  "data": {
    "order_id": 12345,
    "status": "pending",
    "deck_name": "我的塔羅牌",
    "total_cards": 78,
    "estimated_minutes": 39,
    "created_at": "2026-01-05T10:30:00Z",
    "message": "需求單已建立，將在背景開始生成"
  }
}
```

### Response (失敗)

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_TOKENS",
    "message": "Token 餘額不足，需要 7800 tokens，目前餘額 1000 tokens"
  }
}
```

---

## 2. 取得需求單列表

### Request

```
GET /cardhack/api/orders/
```

Query Parameters:
- `status` (optional): 篩選狀態 (`pending`, `processing`, `completed`, `partial`, `cancelled`)
- `page` (optional): 分頁頁碼
- `page_size` (optional): 每頁數量 (預設 20)

### Response

```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "order_id": 12345,
        "deck_name": "我的塔羅牌",
        "category": "tarot",
        "status": "processing",
        "progress": {
          "total": 78,
          "completed": 45,
          "failed": 2,
          "pending": 31
        },
        "created_at": "2026-01-05T10:30:00Z",
        "updated_at": "2026-01-05T10:45:00Z"
      },
      {
        "order_id": 12344,
        "deck_name": "撲克牌",
        "category": "playing",
        "status": "completed",
        "progress": {
          "total": 54,
          "completed": 54,
          "failed": 0,
          "pending": 0
        },
        "created_at": "2026-01-04T15:00:00Z",
        "updated_at": "2026-01-04T15:30:00Z",
        "deck_id": 789
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total_pages": 1,
      "total_count": 2
    }
  }
}
```

---

## 3. 取得需求單詳情

### Request

```
GET /cardhack/api/orders/{order_id}/
```

### Response

```json
{
  "success": true,
  "data": {
    "order_id": 12345,
    "deck_name": "我的塔羅牌",
    "deck_description": "神秘風格的塔羅牌組",
    "category": "tarot",
    "status": "processing",
    "style": {
      "art_style": "fantasy",
      "color_palette": ["#9333ea", "#eab308", "#1e1b4b"],
      "border_style": "golden",
      "custom_prompt_suffix": "with mystical aura"
    },
    "progress": {
      "total": 78,
      "completed": 45,
      "failed": 2,
      "pending": 31
    },
    "cards": [
      {
        "index": 0,
        "name": "The Fool",
        "name_cn": "愚者",
        "status": "completed",
        "image_url": "https://cdn.example.com/cards/12345/0.png",
        "generated_at": "2026-01-05T10:31:00Z"
      },
      {
        "index": 1,
        "name": "The Magician",
        "name_cn": "魔術師",
        "status": "completed",
        "image_url": "https://cdn.example.com/cards/12345/1.png",
        "generated_at": "2026-01-05T10:31:30Z"
      },
      {
        "index": 2,
        "name": "The High Priestess",
        "name_cn": "女祭司",
        "status": "failed",
        "error_message": "Image generation timeout",
        "failed_at": "2026-01-05T10:32:00Z"
      },
      {
        "index": 3,
        "name": "The Empress",
        "name_cn": "皇后",
        "status": "generating",
        "started_at": "2026-01-05T10:45:00Z"
      },
      {
        "index": 4,
        "name": "The Emperor",
        "name_cn": "皇帝",
        "status": "pending"
      }
      // ... 其他卡牌
    ],
    "tokens_used": 4500,
    "tokens_estimated": 7800,
    "created_at": "2026-01-05T10:30:00Z",
    "updated_at": "2026-01-05T10:45:00Z",
    "deck_id": null
  }
}
```

### Card Status 說明

| Status | 說明 |
|--------|------|
| `pending` | 等待生成 |
| `generating` | 正在生成中 |
| `completed` | 生成完成 |
| `failed` | 生成失敗 |

### Order Status 說明

| Status | 說明 |
|--------|------|
| `pending` | 需求單已建立，等待排程 |
| `processing` | 正在處理中 |
| `completed` | 全部生成完成 |
| `partial` | 部分完成 (有失敗的卡牌) |
| `cancelled` | 已取消 |

---

## 4. 輕量查詢進度 (用於輪詢)

### Request

```
GET /cardhack/api/orders/{order_id}/status/
```

### Response

```json
{
  "success": true,
  "data": {
    "order_id": 12345,
    "status": "processing",
    "progress": {
      "total": 78,
      "completed": 45,
      "failed": 2,
      "pending": 31
    },
    "current_card": {
      "index": 46,
      "name_cn": "權杖三"
    },
    "updated_at": "2026-01-05T10:45:00Z"
  }
}
```

**建議輪詢間隔**: 5 秒

---

## 5. 取消需求單

### Request

```
POST /cardhack/api/orders/{order_id}/cancel/
```

### Response (成功)

```json
{
  "success": true,
  "data": {
    "order_id": 12345,
    "status": "cancelled",
    "message": "需求單已取消，已生成 45 張卡牌",
    "refunded_tokens": 3300
  }
}
```

### Response (失敗)

```json
{
  "success": false,
  "error": {
    "code": "CANNOT_CANCEL",
    "message": "需求單已完成，無法取消"
  }
}
```

---

## 6. 重試單張卡牌

### Request

```
POST /cardhack/api/orders/{order_id}/cards/{card_index}/retry/
```

### Response

```json
{
  "success": true,
  "data": {
    "order_id": 12345,
    "card_index": 2,
    "name_cn": "女祭司",
    "status": "pending",
    "message": "已加入重試佇列"
  }
}
```

---

## 7. 重試所有失敗卡牌

### Request

```
POST /cardhack/api/orders/{order_id}/retry-failed/
```

### Response

```json
{
  "success": true,
  "data": {
    "order_id": 12345,
    "retried_count": 2,
    "cards": [
      { "index": 2, "name_cn": "女祭司" },
      { "index": 15, "name_cn": "惡魔" }
    ],
    "message": "已將 2 張失敗卡牌加入重試佇列"
  }
}
```

---

## 後端處理流程建議

### 1. 建立需求單時

```
1. 驗證用戶 token 餘額是否足夠 (cards.length * TOKENS_PER_CARD)
2. 預扣 tokens (或建立預扣記錄)
3. 建立 Order 記錄 (status = pending)
4. 建立 OrderCard 記錄 (status = pending for all)
5. 將 Order 加入生成佇列
6. 返回 order_id 給前端
```

### 2. 背景生成流程

```
Queue Worker:
1. 從佇列取出 Order
2. 更新 Order status = processing
3. 逐張處理 cards:
   a. 更新 card status = generating
   b. 組合完整 prompt:
      - base_prompt (卡牌基礎描述)
      - + style prompt (根據 art_style, color_palette)
      - + border prompt (根據 border_style)
      - + custom_prompt_suffix
   c. 呼叫 AI 圖片生成 API
   d. 成功:
      - 儲存圖片到 CDN
      - 更新 card status = completed, image_url
   e. 失敗:
      - 更新 card status = failed, error_message
   f. 扣除 tokens (成功才扣)
4. 所有卡牌處理完畢:
   - 若全部成功: Order status = completed
   - 若有失敗: Order status = partial
5. 建立對應的 Deck 和 DeckCards (如果全部成功或允許部分完成)
```

### 3. Prompt 組合範例

```python
def build_full_prompt(card, style):
    # 基礎描述
    prompt = card['base_prompt']

    # 藝術風格
    style_prompts = {
        'watercolor': 'watercolor painting style, soft edges, flowing colors',
        'digital': 'digital art, clean lines, vibrant colors',
        'vintage': 'vintage illustration, aged paper texture, muted colors',
        'minimalist': 'minimalist design, simple shapes, limited color palette',
        'fantasy': 'fantasy art style, magical atmosphere, rich details',
        'realistic': 'photorealistic, highly detailed, lifelike'
    }
    prompt += f', {style_prompts.get(style["art_style"], "")}'

    # 色調 (使用色票陣列)
    # style["color_palette"] 是一個 hex 色票陣列，例如 ['#9333ea', '#eab308', '#1e1b4b']
    if style.get('color_palette') and len(style['color_palette']) > 0:
        color_desc = ', '.join(style['color_palette'])
        prompt += f', color scheme using {color_desc}'

    # 邊框
    border_prompts = {
        'golden': 'ornate golden frame border',
        'silver': 'elegant silver frame border',
        'ornate': 'highly decorative baroque frame',
        'simple': 'thin simple line border',
        'none': ''
    }
    if style['border_style'] != 'none':
        prompt += f', {border_prompts.get(style["border_style"], "")}'

    # 自定義後綴
    if style.get('custom_prompt_suffix'):
        prompt += f', {style["custom_prompt_suffix"]}'

    return prompt
```

---

## 資料庫 Model 建議

### DeckOrder

```python
class DeckOrder(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    deck_name = models.CharField(max_length=100)
    deck_description = models.TextField(blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)

    # Style JSON
    style = models.JSONField()

    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    # Linked Deck (created after completion)
    deck = models.ForeignKey('Deck', null=True, blank=True, on_delete=models.SET_NULL)

    # Token tracking
    tokens_estimated = models.IntegerField(default=0)
    tokens_used = models.IntegerField(default=0)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

### OrderCard

```python
class OrderCard(models.Model):
    order = models.ForeignKey(DeckOrder, on_delete=models.CASCADE, related_name='cards')
    index = models.IntegerField()

    # Card info
    name = models.CharField(max_length=100)
    name_cn = models.CharField(max_length=100)
    category = models.CharField(max_length=50, blank=True)
    number = models.IntegerField(null=True)
    keywords = models.JSONField(default=list)
    base_prompt = models.TextField()

    # Generation status
    status = models.CharField(max_length=20, choices=CARD_STATUS_CHOICES, default='pending')
    image_url = models.URLField(blank=True)
    error_message = models.TextField(blank=True)

    # Timestamps
    started_at = models.DateTimeField(null=True)
    completed_at = models.DateTimeField(null=True)
    failed_at = models.DateTimeField(null=True)

    class Meta:
        ordering = ['index']
        unique_together = ['order', 'index']
```

---

## 前端 TypeScript 類型定義

這些類型已在前端定義，供後端參考：

```typescript
// 類別
type DeckCategory = 'tarot' | 'playing' | 'rune' | 'angel' | 'custom';

// 風格
interface DeckStyle {
  artStyle: 'watercolor' | 'digital' | 'vintage' | 'minimalist' | 'fantasy' | 'realistic';
  colorPalette: string[];  // 色票陣列 (hex)，例如 ['#9333ea', '#eab308', '#1e1b4b']
  borderStyle: 'golden' | 'silver' | 'none' | 'ornate' | 'simple';
  customPromptSuffix: string;
}

// 卡牌模板 (前端發送)
interface CardTemplate {
  id: string;
  name: string;
  nameCN: string;
  category?: string;
  number?: number;
  keywords: string[];
  defaultPrompt: string;
}

// 需求單卡牌 (後端回傳)
interface OrderCard {
  index: number;
  name: string;
  name_cn: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  image_url?: string;
  error_message?: string;
  generated_at?: string;
  started_at?: string;
  failed_at?: string;
}

// 需求單
interface DeckOrder {
  order_id: number;
  deck_name: string;
  deck_description: string;
  category: DeckCategory;
  status: 'pending' | 'processing' | 'completed' | 'partial' | 'cancelled';
  style: DeckStyle;
  progress: {
    total: number;
    completed: number;
    failed: number;
    pending: number;
  };
  cards: OrderCard[];
  tokens_used: number;
  tokens_estimated: number;
  created_at: string;
  updated_at: string;
  deck_id: number | null;
}
```

---

## 錯誤碼定義

| Code | HTTP Status | 說明 |
|------|-------------|------|
| `INSUFFICIENT_TOKENS` | 400 | Token 餘額不足 |
| `INVALID_CATEGORY` | 400 | 無效的卡牌類別 |
| `INVALID_STYLE` | 400 | 無效的風格設定 |
| `EMPTY_CARDS` | 400 | 卡牌列表為空 |
| `ORDER_NOT_FOUND` | 404 | 需求單不存在 |
| `CARD_NOT_FOUND` | 404 | 卡牌不存在 |
| `CANNOT_CANCEL` | 400 | 無法取消 (已完成或處理中) |
| `CANNOT_RETRY` | 400 | 無法重試 (非失敗狀態) |
| `GENERATION_ERROR` | 500 | 圖片生成服務錯誤 |

---

## 常數設定建議

```python
# Token 消耗
TOKENS_PER_CARD = 100  # 每張卡牌預估消耗

# 生成時間 (秒)
ESTIMATED_SECONDS_PER_CARD = 30

# 重試次數
MAX_RETRY_COUNT = 3

# 輪詢間隔建議 (秒)
RECOMMENDED_POLL_INTERVAL = 5
```
