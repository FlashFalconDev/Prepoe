# Flex Carousel View 使用說明

## 概述

FlexCarouselView 是一個基於 LINE Flex Message 格式設計的全螢幕輪播元件，支援：
- 多頁切換（類似 IG Stories）
- 卡牌抽取互動
- 自訂版面配置（hero/body/footer flex 比例）

## 路由

```
/flex/:clientSid/:code
```

範例：`/flex/flashfalcon/ABC123`

---

## API 回傳格式

```typescript
interface APIResponse {
  success: boolean;
  message: string;
  data: {
    session_id?: number;
    card_style?: string;      // 卡背圖片 URL
    cards?: CardsData;        // 卡牌資料（可選）
    flex: FlexCarousel;       // Flex Message 結構
  }
}
```

---

## 資料結構說明

### 1. FlexCarousel（主結構）

```typescript
interface FlexCarousel {
  type: 'carousel';
  contents: FlexBubble[];     // 多個 bubble 組成輪播
}
```

### 2. FlexBubble（單一頁面）

```typescript
interface FlexBubble {
  type: 'bubble';
  size?: 'nano' | 'micro' | 'kilo' | 'mega' | 'giga';
  hero?: FlexImage;           // 頂部圖片區
  body?: FlexBox;             // 中間內容區
  footer?: FlexBox;           // 底部區域
  cooldown?: number;          // 冷卻時間（毫秒），頁面完成後延遲導航
}
```

#### cooldown 冷卻機制

`cooldown` 用於控制頁面完成後的延遲導航時間，常用於：
- 讓使用者有足夠時間閱讀內容
- 配合按鈕頁面，確保使用者注意到重要按鈕

```json
{
  "type": "bubble",
  "cooldown": 3000,
  "hero": { ... }
}
```

**注意**：
- 單位為毫秒（3000 = 3 秒）
- 冷卻期間會阻止導航操作
- 按鈕點擊時，會在 cooldown 結束後才跳轉到目標頁面

### 3. FlexHero（頂部區域）

Hero 支援兩種類型：

#### 3.1 FlexHeroImage（一般圖片）

```typescript
interface FlexHeroImage {
  type: 'image';
  url: string;
  size?: string;              // 'full' | 其他
  aspectMode?: 'cover' | 'fit';
  aspectRatio?: string;       // 例如 '320:213'
  flex?: number;              // 比例權重，預設 1
}
```

#### 3.2 FlexHeroLayered（層疊圖片 + 圖層系統）

層疊式 Hero 支援 `background` 背景圖/影片 + `layers` 圖層陣列。

```typescript
interface FlexHeroLayered {
  type: 'layered';
  background: string;         // 背景 URL（支援圖片或影片）
  backgroundSize?: 'cover' | 'contain' | 'fill';  // 預設 'cover'
  backgroundPosition?: BackgroundPosition;        // 預設 'top'
  backaudio?: string;         // 🎵 背景音樂 URL（自動播放、循環）
  layers: Layer[];            // 圖層陣列（支援 image/cards/text/button/audio 類型）
  flex?: number;              // 比例權重
}
```

**背景媒體支援**：
- **圖片**：jpg, png, gif, webp 等
- **影片**：mp4, webm, ogg, mov（自動播放、靜音、循環）

詳見下方 [LayeredImage 層疊圖片](#layeredimage-層疊圖片) 章節。

### 4. FlexBox（容器）

```typescript
interface FlexBox {
  type: 'box';
  layout: 'vertical' | 'horizontal' | 'baseline';
  contents: (FlexIcon | FlexText | FlexBox)[];
  content?: 'cards';          // ⭐ 特殊值：顯示卡牌抽取區
  flex?: number;              // 比例權重，預設 1
  spacing?: 'sm' | 'md' | 'lg';
  paddingAll?: string;        // 例如 '13px'
}
```

### 5. FlexText（文字）

```typescript
interface FlexText {
  type: 'text';
  text: string;
  weight?: 'regular' | 'bold';
  size?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  color?: string;             // HEX 色碼，例如 '#8c8c8c'
  wrap?: boolean;
  margin?: 'sm' | 'md';
  flex?: number;
  align?: 'start' | 'center' | 'end';
}
```

### 6. FlexIcon（圖示）

```typescript
interface FlexIcon {
  type: 'icon';
  url: string;
  size?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg';
}
```

### 7. CardsData（卡牌資料）

```typescript
interface CardsData {
  content: DrawnCard[];
  style?: string;             // 卡背圖片 URL
  template?: string;          // 模板名稱
}

interface DrawnCard {
  card_title: string;
  image_url: string;
  position_title: string | null;
  position_desc: string;
  interpretation?: string;    // 用 '|' 分隔多頁解說
}
```

---

## Flex 比例說明

`flex` 屬性控制各區域在全螢幕中佔據的比例：

```
hero.flex: 1, body.flex: 2  → 圖片佔 1/3，內容佔 2/3
hero.flex: 3, body.flex: 1  → 圖片佔 3/4，內容佔 1/4
footer.flex: 0              → footer 固定高度，不參與比例計算（預設）
```

如果不指定 `flex`，預設值為 1。

---

## 特殊功能：卡牌抽取

卡牌抽取可以放在兩個位置：

### 方式一：卡牌在 Body

當 `body.content = 'cards'` 時，Body 區域會顯示卡牌抽取介面。

```json
{
  "type": "bubble",
  "hero": {
    "type": "image",
    "url": "https://example.com/header.jpg",
    "flex": 1
  },
  "body": {
    "content": "cards",
    "flex": 3,
    "type": "box",
    "layout": "vertical",
    "contents": []
  },
  "footer": {
    "flex": 2,
    "type": "box",
    "layout": "vertical",
    "contents": [
      { "type": "text", "text": "塔羅占卜", "weight": "bold" }
    ]
  }
}
```

### 方式二：卡牌作為 Hero 圖層 ⭐ 推薦

使用 `hero.type = 'layered'`，在 `layers` 中加入 `type: 'cards'` 圖層。
卡牌會與其他圖層一起渲染，可自由控制 zIndex 順序。

```json
{
  "type": "bubble",
  "hero": {
    "type": "layered",
    "background": "https://example.com/mystical-bg.jpg",
    "backgroundSize": "cover",
    "backgroundPosition": "top",
    "layers": [
      {
        "type": "cards",
        "zIndex": 1
      }
    ],
    "flex": 3
  },
  "footer": {
    "flex": 1,
    "type": "box",
    "layout": "vertical",
    "contents": [
      { "type": "text", "text": "塔羅占卜", "weight": "bold", "size": "sm" }
    ],
    "paddingAll": "13px"
  }
}
```

### 方式三：卡牌 + 圖片圖層混合

可以在同一個 hero 中混合使用 `cards` 和 `image` 圖層：

```json
{
  "type": "bubble",
  "hero": {
    "type": "layered",
    "background": "https://example.com/bg.jpg",
    "layers": [
      {
        "type": "cards",
        "zIndex": 1
      },
      {
        "type": "image",
        "url": "https://example.com/overlay.png",
        "position": { "x": 50, "y": 10 },
        "size": { "width": 30 },
        "zIndex": 2
      }
    ],
    "flex": 3
  }
}
```

這種方式可以在卡牌上方疊加裝飾圖層。

### 卡牌抽取流程

1. 顯示牌堆（可左右滑動）
2. 用戶點擊卡牌進行抽取（翻牌動畫）
3. 抽完所有牌後，進入解說階段
4. 點擊畫面逐頁顯示解說（用 `|` 分隔多頁）
5. 解說完成後自動進入下一個 bubble

---

## 🌟 功能總覽

| 功能 | 說明 | 位置/屬性 |
|------|------|----------|
| **背景圖片** | 支援 jpg/png/gif/webp | `background` |
| **背景影片** | 支援 mp4/webm/ogg/mov，自動播放、靜音、循環 | `background` |
| **背景音樂** | 自動播放、循環的背景音樂，頁面切換時自動切換 | `backaudio` |
| **圖片圖層** | 可定位、旋轉、縮放的圖片 | `layers[].type: 'image'` |
| **文字圖層** | 支援多行、對齊、陰影、描邊等樣式 | `layers[].type: 'text'` |
| **按鈕圖層** | 支援導航、跳轉、開啟網址、表單提交等動作 | `layers[].type: 'button'` |
| **音訊圖層** | 帶 UI 的播放器，手動控制播放 | `layers[].type: 'audio'` |
| **輸入圖層** | 表單輸入欄位，支援文字、選單、日期等 | `layers[].type: 'input'` |
| **卡牌圖層** | 抽卡互動區域 | `layers[].type: 'cards'` |
| **抽卡樣式** | flex_01（中心放大）、flex_02（規矩）、flex_03（拖拉選牌） | `cards.template` |
| **解說樣式** | d_01（預設）、d_02（沉浸式） | `cards.template_details` |
| **頁面冷卻** | 頁面完成後延遲導航 | `bubble.cooldown` |
| **模板變數** | 動態替換 `{{variable}}` 值 | `variable` |

---

## 完整範例（含所有功能）

以下範例展示了一個完整的塔羅占卜流程，包含所有可用功能：

```json
{
  "success": true,
  "message": "抽牌成功",
  "data": {
    "session_id": 521,
    "cards": {
      "content": [
        {
          "card_title": "文殊菩薩",
          "image_url": "https://example.com/cards/manjushri.png",
          "position_title": "現況",
          "position_desc": "代表你目前的狀態",
          "interpretation": "文殊菩薩代表智慧與覺醒...|這張牌提醒你要以清明的心...|在面對困難時，保持內心的平靜..."
        },
        {
          "card_title": "觀音菩薩",
          "image_url": "https://example.com/cards/guanyin.png",
          "position_title": "建議",
          "position_desc": "給你的指引",
          "interpretation": "觀音菩薩代表慈悲與療癒..."
        }
      ],
      "style": "https://example.com/card_back.png",
      "template": "flex_02",
      "template_details": "d_02",
      "aspectRatio": "449/449"
    },
    "variable": {
      "explores": "/flex/prepoe/more-info"
    },
    "flex_deck": {
      "type": "carousel",
      "contents": [
        {
          "type": "bubble",
          "hero": {
            "type": "layered",
            "background": "https://example.com/video/intro.mp4",
            "backgroundSize": "cover",
            "backgroundPosition": "center",
            "backaudio": "https://example.com/audio/page1_bgm.mp3",
            "layers": [
              {
                "type": "image",
                "id": "logo",
                "url": "https://example.com/images/logo.png",
                "position": { "x": 50, "y": 5, "anchor": "top-center" },
                "size": { "width": 30 },
                "opacity": 0.9,
                "zIndex": 10
              },
              {
                "type": "text",
                "id": "title",
                "text": "文殊菩薩占卜",
                "position": { "x": 50, "y": 15, "anchor": "top-center" },
                "style": {
                  "fontSize": "2xl",
                  "weight": "bold",
                  "color": "#FFD700",
                  "textAlign": "center",
                  "shadow": "0 2px 8px rgba(0,0,0,0.8)"
                },
                "zIndex": 10
              },
              {
                "type": "cards",
                "zIndex": 1
              },
              {
                "type": "text",
                "id": "hint",
                "text": "請依直覺選擇一張牌",
                "position": { "x": 50, "y": 90, "anchor": "center" },
                "style": {
                  "fontSize": "sm",
                  "color": "#ffffff",
                  "textAlign": "center",
                  "shadow": true
                },
                "zIndex": 10
              }
            ],
            "flex": 1
          },
          "cooldown": 2000
        },
        {
          "type": "bubble",
          "hero": {
            "type": "layered",
            "background": "https://example.com/images/result_bg.jpg",
            "backgroundSize": "cover",
            "backaudio": "https://example.com/audio/page2_bgm.mp3",
            "layers": [
              {
                "type": "text",
                "text": "您的占卜結果",
                "position": { "x": 50, "y": 10, "anchor": "top-center" },
                "style": {
                  "fontSize": "xl",
                  "weight": "bold",
                  "color": "#ffffff",
                  "textAlign": "center"
                },
                "zIndex": 10
              },
              {
                "type": "audio",
                "url": "https://example.com/audio/interpretation.mp3",
                "position": { "x": 50, "y": 50, "anchor": "center" },
                "size": { "width": 80 },
                "style": {
                  "color": "#6366f1",
                  "backgroundColor": "#FFFFFFE6",
                  "borderRadius": 12
                },
                "zIndex": 10
              },
              {
                "type": "button",
                "label": "了解更多",
                "action": { "type": "uri", "uri": "{{explores}}", "openInNewTab": false },
                "position": { "x": 50, "y": 75, "anchor": "center" },
                "style": {
                  "variant": "solid",
                  "color": "#6366f1",
                  "fontSize": "md",
                  "fontWeight": "bold",
                  "borderRadius": 24,
                  "padding": "12px 32px",
                  "shadow": true
                },
                "zIndex": 10
              },
              {
                "type": "button",
                "label": "下一頁 →",
                "action": { "type": "next" },
                "position": { "x": 50, "y": 88, "anchor": "center" },
                "style": {
                  "variant": "outline",
                  "color": "#ffffff",
                  "fontSize": "sm"
                },
                "zIndex": 10
              }
            ],
            "flex": 1
          }
        },
        {
          "type": "bubble",
          "hero": {
            "type": "layered",
            "background": "https://example.com/images/ending_bg.jpg",
            "layers": [
              {
                "type": "text",
                "text": "感謝您的參與\n期待下次為您服務",
                "position": { "x": 50, "y": 40, "anchor": "center" },
                "size": { "width": 80 },
                "style": {
                  "fontSize": "xl",
                  "weight": "bold",
                  "color": "#ffffff",
                  "textAlign": "center",
                  "lineHeight": 1.8
                },
                "zIndex": 10
              },
              {
                "type": "button",
                "label": "再抽一次",
                "action": { "type": "goto", "index": 0 },
                "position": { "x": 50, "y": 70, "anchor": "center" },
                "style": {
                  "variant": "solid",
                  "color": "#10b981",
                  "fontSize": "lg",
                  "fontWeight": "bold",
                  "borderRadius": 30,
                  "padding": "14px 40px"
                },
                "zIndex": 10
              }
            ],
            "flex": 1
          }
        }
      ]
    }
  }
}
```

### 範例功能說明

| 頁面 | 使用功能 |
|------|----------|
| 第一頁 | 影片背景 + 背景音樂 + Logo圖片 + 標題文字 + 卡牌抽取 + 提示文字 + 冷卻機制 |
| 第二頁 | 圖片背景 + 不同的背景音樂 + 標題文字 + 音訊播放器 + 兩個按鈕（外連/下一頁）+ 模板變數 |
| 第三頁 | 圖片背景 + 多行文字 + 回到開頭按鈕 |

---

## 導航規則

| 模式 | 左右箭頭 | 滑動 | 點擊指示器 | 說明 |
|------|---------|------|-----------|------|
| 純展示（無 cards） | ✅ 雙向 | ✅ 雙向 | ✅ 自由跳轉 | 類似 IG Stories |
| 含 cards bubble | ❌ 隱藏 | ➡️ 單向 | ➡️ 只能往後 | 抽牌流程不可回頭 |
| cards 進行中 | ❌ 隱藏 | ❌ 禁止 | ❌ 隱藏 | 鎖定在抽牌流程 |

---

## 尺寸對照表

### 文字尺寸 (size → Tailwind)

| LINE size | Tailwind class | 實際大小 |
|-----------|---------------|---------|
| xxs | text-xs | 12px |
| xs | text-sm | 14px |
| sm | text-base | 16px |
| md | text-lg | 18px |
| lg | text-xl | 20px |
| xl | text-2xl | 24px |
| xxl | text-3xl | 30px |

### 圖示尺寸 (size)

| LINE size | 寬高 |
|-----------|-----|
| xs | 16px |
| sm | 20px |
| md+ | 24px |

---

## LayeredImage 層疊圖片

### 概述

LayeredImage 支援「底圖固定 + 多個圖層可定位」的功能，適用於：
- 合成結果圖（抽牌結果）
- 動態圖片組合
- 自訂位置的貼圖效果

### 資料結構

```typescript
interface LayeredImage {
  type: 'layered';
  background: string;                           // 底圖 URL（支援圖片或影片）
  backgroundSize?: 'cover' | 'contain' | 'fill'; // 底圖填充模式，預設 'cover'
  backgroundPosition?: BackgroundPosition;       // 底圖對齊位置，預設 'top'
  backaudio?: string;                           // 🎵 背景音樂 URL（自動播放、循環）
  layers: Layer[];                              // 圖層陣列
}

// 統一圖層類型（可擴展）
type Layer = ImageLayer | CardsLayer | TextLayer | ButtonLayer | AudioLayer;

// 圖片圖層
interface ImageLayer {
  type: 'image';
  id?: string;                    // 圖層 ID（可選）
  url: string;                    // 圖片 URL
  position: {
    x: number;                    // X 位置（百分比 0-100）
    y: number;                    // Y 位置（百分比 0-100）
    anchor?: LayerAnchor;         // 錨點，預設 'top-left'（從起點開始算）
  };
  size?: {
    width?: number;               // 寬度（百分比）
    height?: number;              // 高度（百分比）
    scale?: number;               // 縮放比例（1 = 100%）
  };
  rotation?: number;              // 旋轉角度（度）
  opacity?: number;               // 透明度（0-1）
  zIndex?: number;                // 層級順序
}

// 卡牌抽取圖層
interface CardsLayer {
  type: 'cards';
  id?: string;                    // 圖層 ID（可選）
  opacity?: number;               // 透明度（0-1）
  zIndex?: number;                // 層級順序
}

// 文字圖層
interface TextLayer {
  type: 'text';
  id?: string;                    // 圖層 ID（可選）
  text: string;                   // 文字內容（支援 \n 換行）
  position: {
    x: number;                    // X 位置（百分比 0-100）
    y: number;                    // Y 位置（百分比 0-100）
    anchor?: LayerAnchor;         // 錨點，預設 'top-left'
  };
  size?: {
    width?: number;               // 寬度（百分比 0-100），設定後文字會在此寬度內換行
    height?: number;              // 高度（百分比 0-100），可選，超出會被截斷
  };
  style?: {
    fontSize?: TextSize | number; // 字體大小（預設尺寸或 px 數值）
    weight?: 'normal' | 'medium' | 'semibold' | 'bold';  // 字重
    color?: string;               // 文字顏色（預設白色）
    align?: 'left' | 'center' | 'right';      // 文字對齊
    textAlign?: 'left' | 'center' | 'right';  // 文字對齊（align 的別名）
    verticalAlign?: 'top' | 'center' | 'bottom';  // 垂直對齊（需設定 height）
    lineHeight?: number;          // 行高（倍數，如 1.5）
    letterSpacing?: number;       // 字間距（px）
    shadow?: boolean | string;    // 文字陰影
    stroke?: {                    // 文字描邊
      color?: string;
      width?: number;
    };
    padding?: number | string;    // 內邊距（px 或 CSS 值）
    background?: string;          // 背景顏色（可選）
    borderRadius?: number;        // 圓角（px）
  };
  rotation?: number;              // 旋轉角度（度）
  opacity?: number;               // 透明度（0-1）
  zIndex?: number;                // 層級順序
}

type TextSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';

type LayerAnchor =
  | 'top-left' | 'top-center' | 'top-right'
  | 'center-left' | 'center' | 'center-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';
```

### 在 Flex Hero 中使用

```json
{
  "type": "bubble",
  "hero": {
    "type": "layered",
    "background": "https://example.com/bg.jpg",
    "backgroundSize": "cover",
    "layers": [
      {
        "url": "https://example.com/card1.png",
        "position": { "x": 25, "y": 50, "anchor": "center" },
        "size": { "width": 30 },
        "rotation": -5
      },
      {
        "url": "https://example.com/card2.png",
        "position": { "x": 50, "y": 50, "anchor": "center" },
        "size": { "width": 30 },
        "zIndex": 2
      },
      {
        "url": "https://example.com/card3.png",
        "position": { "x": 75, "y": 50, "anchor": "center" },
        "size": { "width": 30 },
        "rotation": 5
      }
    ],
    "flex": 2
  },
  "body": {
    "type": "box",
    "layout": "vertical",
    "contents": [
      { "type": "text", "text": "您的抽牌結果", "weight": "bold" }
    ],
    "flex": 1
  }
}
```

### 位置與錨點說明

- `position.x` / `position.y`：使用**百分比** (0-100)
  - `x: 0` = 左邊緣, `x: 50` = 中央, `x: 100` = 右邊緣
  - `y: 0` = 上邊緣, `y: 50` = 中央, `y: 100` = 下邊緣

- `anchor`：圖層的對齊基準點
  - `'top-left'`（預設）：圖層左上角對齊到指定位置，從起點開始算
  - `'center'`：圖層中心對齊到指定位置
  - `'bottom-right'`：圖層右下角對齊到指定位置

### 尺寸控制

```typescript
size: {
  width: 30,     // 圖層寬度佔容器 30%
  height: 40,    // 圖層高度佔容器 40%（可選）
  scale: 1.5     // 額外放大 1.5 倍
}
```

- 若只設定 `width`，高度會自動按圖片比例計算
- `scale` 會在 width/height 基礎上再進行縮放

### 範例：三張牌水平排列

```json
{
  "type": "layered",
  "background": "https://example.com/table.jpg",
  "layers": [
    {
      "id": "card-left",
      "type": "image",
      "url": "https://example.com/card1.png",
      "position": { "x": 20, "y": 50 },
      "size": { "width": 25 }
    },
    {
      "id": "card-center",
      "type": "image",
      "url": "https://example.com/card2.png",
      "position": { "x": 50, "y": 45 },
      "size": { "width": 25 },
      "zIndex": 2
    },
    {
      "id": "card-right",
      "type": "image",
      "url": "https://example.com/card3.png",
      "position": { "x": 80, "y": 50 },
      "size": { "width": 25 }
    }
  ]
}
```

### 範例：文字圖層

```json
{
  "type": "layered",
  "background": "https://example.com/bg.jpg",
  "layers": [
    {
      "type": "text",
      "text": "塔羅占卜",
      "position": { "x": 50, "y": 10, "anchor": "top-center" },
      "style": {
        "size": "2xl",
        "weight": "bold",
        "color": "#FFD700",
        "shadow": true
      },
      "zIndex": 10
    },
    {
      "type": "cards",
      "zIndex": 1
    },
    {
      "type": "text",
      "text": "點擊卡牌開始抽牌",
      "position": { "x": 50, "y": 85, "anchor": "center" },
      "style": {
        "size": "sm",
        "color": "#ffffff",
        "shadow": "0 2px 8px rgba(0,0,0,0.8)"
      },
      "zIndex": 10
    }
  ]
}
```

### 文字尺寸對照表

| TextSize | 實際大小 |
|----------|---------|
| xs | 12px |
| sm | 14px |
| md | 16px（預設）|
| lg | 18px |
| xl | 20px |
| 2xl | 24px |
| 3xl | 30px |
| 4xl | 36px |

也可直接使用數字指定 px 值：`"size": 28`

### 範例：按鈕圖層

```json
{
  "type": "layered",
  "background": "https://example.com/bg.jpg",
  "layers": [
    {
      "type": "button",
      "label": "開始占卜",
      "action": { "type": "next" },
      "position": { "x": 50, "y": 80, "anchor": "center" },
      "style": {
        "variant": "solid",
        "color": "#6366f1",
        "fontSize": "lg",
        "fontWeight": "bold",
        "borderRadius": 24,
        "padding": "12px 32px",
        "shadow": true
      },
      "zIndex": 10
    },
    {
      "type": "button",
      "label": "查看更多",
      "action": { "type": "uri", "uri": "https://example.com/more" },
      "position": { "x": 50, "y": 90, "anchor": "center" },
      "style": {
        "variant": "outline",
        "color": "#ffffff",
        "fontSize": "sm"
      },
      "zIndex": 10
    }
  ]
}
```

### 按鈕動作類型

| action.type | 說明 | 參數 |
|-------------|------|------|
| `uri` | 開啟網址 | `uri: string`, `openInNewTab?: boolean` |
| `next` | 下一頁 | 無 |
| `prev` | 上一頁 | 無 |
| `goto` | 跳轉到指定頁 | `index: number` (0-based) |
| `post` | 表單提交 | `uri: string`, `loadingText?: string`, `successAction?: ButtonNavigationAction` |
| `postback` | 回傳資料（未來擴充） | `data: string` |

#### URI 動作詳細說明

`uri` 動作支援 `openInNewTab` 參數控制開啟方式：

| openInNewTab | 行為 |
|--------------|------|
| `true`（預設） | 在新視窗/分頁開啟 |
| `false` | 在原視窗開啟（跳轉離開當前頁面） |

```json
// 新視窗開啟（預設）
"action": { "type": "uri", "uri": "https://example.com" }

// 明確指定新視窗
"action": { "type": "uri", "uri": "https://example.com", "openInNewTab": true }

// 原視窗開啟 - 外部網址
"action": { "type": "uri", "uri": "https://example.com", "openInNewTab": false }

// 原視窗開啟 - 站內路徑（保持在原網域）
"action": { "type": "uri", "uri": "/card/flashfalcon/lOWiTO", "openInNewTab": false }
```

**URI 格式說明**：
- 完整 URL（`https://...`）：跳轉到該外部網址
- 絕對路徑（`/path/to/page`）：在同網域內導航，適合站內跳轉

**站內跳轉優化**：
- 站內路徑（以 `/` 開頭）會自動使用 React Router 進行 SPA 內部跳轉
- 這樣可以避免頁面重新載入時的白畫面，提供更流暢的使用體驗
- 外部網址則使用 `window.location.href` 進行跳轉

#### POST 動作詳細說明

`post` 動作用於提交表單資料到 API。

```json
// 基本用法：提交後跳到下一頁
{
  "type": "button",
  "label": "提交",
  "action": {
    "type": "post",
    "uri": "/api/fortune/submit",
    "loadingText": "提交中...",
    "successAction": { "type": "next" }
  }
}

// 提交後跳轉到指定頁面
{
  "type": "button",
  "label": "送出問題",
  "action": {
    "type": "post",
    "uri": "/api/question/create",
    "loadingText": "處理中...",
    "successAction": { "type": "goto", "index": 3 }
  }
}

// 提交後開啟新頁面
{
  "type": "button",
  "label": "完成",
  "action": {
    "type": "post",
    "uri": "/api/complete",
    "loadingText": "完成中...",
    "successAction": { "type": "uri", "uri": "/result", "openInNewTab": false }
  }
}
```

**POST 動作屬性**：

| 屬性 | 說明 | 必填 |
|------|------|------|
| `uri` | API 路徑 | ✅ |
| `loadingText` | 提交中按鈕顯示的文字 | ❌ |
| `successAction` | 成功後執行的動作 | ❌ |

**successAction 類型**（與一般按鈕動作相同，但不支援 `post`）：
- `{ type: 'next' }` - 下一頁
- `{ type: 'prev' }` - 上一頁
- `{ type: 'goto', index: number }` - 跳轉到指定頁
- `{ type: 'uri', uri: string, openInNewTab?: boolean }` - 開啟網址

**錯誤處理**：
- POST 失敗時，錯誤訊息會透過現有的 toast 提醒系統顯示
- 按鈕會恢復到原始狀態，使用者可以重新提交

**使用 onPost 回調**：

```tsx
<FlexCarouselView
  flex={flexData}
  onPost={async (uri, formData) => {
    try {
      const response = await api.post(uri, formData);
      if (response.data.success) {
        showSuccess('提交成功');
        return { success: true, data: response.data };
      } else {
        showError(response.data.message || '提交失敗');
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      showError('網路錯誤，請稍後再試');
      return { success: false, message: '網路錯誤' };
    }
  }}
/>
```

### 按鈕樣式

| 屬性 | 說明 | 預設值 |
|------|------|--------|
| `variant` | 樣式類型：`'solid'` / `'outline'` / `'ghost'` | `'solid'` |
| `color` | 主色（背景或邊框） | `'#3b82f6'` |
| `textColor` | 文字顏色 | solid: `'#ffffff'`, outline/ghost: 同 color |
| `fontSize` | 字體大小（TextSize 或數字 px） | `'md'` |
| `fontWeight` | 字重：`'normal'` / `'medium'` / `'semibold'` / `'bold'` | `'medium'` |
| `borderRadius` | 圓角 (px) | `8` |
| `padding` | 內邊距 | `'8px 16px'` |
| `shadow` | 陰影（`true` 使用預設，或自訂 CSS） | `false` |
| `icon` | 圖標 URL | - |
| `iconPosition` | 圖標位置：`'left'` / `'right'` | `'left'` |

#### fontSize 格式

`fontSize` 支援兩種格式：

1. **預設尺寸字串**：`'xs'` | `'sm'` | `'md'` | `'lg'` | `'xl'` | `'2xl'` | `'3xl'` | `'4xl'`
2. **數字（px）**：直接指定像素值，如 `10`、`14`、`28`

```json
// 使用預設尺寸
"fontSize": "sm"

// 使用數字（10px）
"fontSize": 10
```

### 範例：音訊圖層

音訊圖層提供一個簡潔的播放器 UI，讓使用者可以手動控制播放。

```json
{
  "type": "layered",
  "background": "https://example.com/bg.jpg",
  "layers": [
    {
      "type": "audio",
      "url": "https://example.com/audio/background.mp3",
      "position": { "x": 50, "y": 80, "anchor": "center" },
      "size": { "width": 80 },
      "style": {
        "color": "#6366f1",
        "backgroundColor": "#FFFFFFE6",
        "borderRadius": 12
      },
      "zIndex": 10
    }
  ]
}
```

### 音訊圖層類型定義

```typescript
interface AudioLayer {
  type: 'audio';
  id?: string;                    // 圖層 ID（可選）
  url: string;                    // 音訊 URL
  position: {
    x: number;                    // X 位置（百分比 0-100）
    y: number;                    // Y 位置（百分比 0-100）
    anchor?: LayerAnchor;         // 錨點位置，預設 'top-left'
  };
  size?: {
    width?: number | string;      // 寬度（數字=百分比，字串如 "200px"=像素）
  };
  style?: {
    variant?: 'default' | 'minimal' | 'compact';  // 播放器樣式
    color?: string;               // 主色調
    backgroundColor?: string;     // 背景顏色
    borderRadius?: number;        // 圓角（px）
  };
  autoplay?: boolean;             // 自動播放（預設 false）
  loop?: boolean;                 // 循環播放（預設 false）
  opacity?: number;               // 透明度（0-1）
  zIndex?: number;                // 層級順序
}
```

### 音訊圖層樣式

| 屬性 | 說明 | 預設值 |
|------|------|--------|
| `color` | 主色調（播放按鈕、進度條） | `'#3b82f6'` |
| `backgroundColor` | 背景顏色 | `'#FFFFFFE6'`（白色 90% 透明度）|
| `borderRadius` | 圓角 (px) | `12` |

---

## 📝 輸入圖層 (Input Layer)

### 概述

輸入圖層用於在 Flex 頁面中建立表單欄位，讓使用者可以輸入資料。支援多種輸入類型，包含文字、數字、選單等。

### 範例：輸入圖層

```json
{
  "type": "layered",
  "background": "https://example.com/bg.jpg",
  "layers": [
    {
      "type": "input",
      "inputType": "text",
      "name": "fortune_content",
      "label": "占卜內容",
      "placeholder": "請輸入您想占卜的問題...",
      "position": { "x": 50, "y": 30, "anchor": "top-center" },
      "size": { "width": 80 },
      "validation": {
        "required": true,
        "minLength": 2,
        "maxLength": 200
      },
      "style": {
        "fontSize": "md",
        "backgroundColor": "#FFFFFFEE",
        "borderRadius": 8
      },
      "zIndex": 10
    },
    {
      "type": "input",
      "inputType": "select",
      "name": "category",
      "label": "占卜類型",
      "placeholder": "請選擇...",
      "options": [
        { "label": "愛情", "value": "love" },
        { "label": "事業", "value": "career" },
        { "label": "財運", "value": "money" }
      ],
      "position": { "x": 50, "y": 50, "anchor": "top-center" },
      "size": { "width": 80 },
      "zIndex": 10
    }
  ]
}
```

### 輸入圖層類型定義

```typescript
type InputType = 'text' | 'textarea' | 'number' | 'email' | 'tel' | 'date' | 'select';

interface InputLayer {
  type: 'input';
  inputType: InputType;             // 輸入類型
  name: string;                     // 表單欄位名稱（提交用）
  label?: string;                   // 顯示標籤
  placeholder?: string;             // 佔位文字
  defaultValue?: string;            // 預設值
  position: {
    x: number;                      // X 位置（百分比 0-100）
    y: number;                      // Y 位置（百分比 0-100）
    anchor?: LayerAnchor;           // 錨點位置，預設 'top-left'
  };
  size?: {
    width?: number;                 // 寬度（百分比 0-100）
    height?: number;                // 高度（百分比 0-100），textarea 專用
  };
  // select 專用
  options?: Array<{ label: string; value: string }>;
  // textarea 專用
  rows?: number;
  // 驗證規則
  validation?: {
    required?: boolean;             // 是否必填
    minLength?: number;             // 最小長度
    maxLength?: number;             // 最大長度
    min?: number;                   // 最小值（number 專用）
    max?: number;                   // 最大值（number 專用）
    pattern?: string;               // 正則表達式
    errorMessage?: string;          // 自訂錯誤訊息
  };
  style?: {
    fontSize?: TextSize | number;   // 字體大小
    color?: string;                 // 文字顏色
    backgroundColor?: string;       // 背景顏色
    borderRadius?: number;          // 圓角（px）
    borderColor?: string;           // 邊框顏色
    padding?: string;               // 內邊距
    labelColor?: string;            // 標籤顏色
    placeholderColor?: string;      // 佔位文字顏色
  };
  disabled?: boolean;               // 是否禁用
  opacity?: number;                 // 透明度（0-1）
  zIndex?: number;                  // 層級順序
}
```

### 輸入類型說明

| inputType | 說明 | 特殊屬性 |
|-----------|------|----------|
| `text` | 單行文字輸入 | `maxLength` |
| `textarea` | 多行文字輸入 | `rows`, `maxLength` |
| `number` | 數字輸入 | `min`, `max` |
| `email` | 電子郵件輸入 | 自動驗證格式 |
| `tel` | 電話號碼輸入 | - |
| `date` | 日期選擇器 | - |
| `select` | 下拉選單 | `options` |

### 表單狀態管理

FlexCarouselView 會自動管理表單狀態。可以透過以下 props 與外部互動：

```tsx
<FlexCarouselView
  flex={flexData}
  // 初始表單值
  initialFormData={{ fortune_content: '預設問題' }}
  // 表單值變更時觸發
  onFormChange={(formData) => console.log('表單變更:', formData)}
  // 表單提交時觸發（搭配 submit 類型按鈕）
  onFormSubmit={(formData) => console.log('表單提交:', formData)}
/>
```

### 驗證規則

輸入圖層支援即時驗證，當使用者輸入時會立即顯示錯誤訊息：

```json
{
  "validation": {
    "required": true,
    "minLength": 2,
    "maxLength": 200,
    "pattern": "^[a-zA-Z0-9]+$",
    "errorMessage": "只能輸入英文字母和數字"
  }
}
```

| 規則 | 說明 |
|------|------|
| `required` | 必填欄位 |
| `minLength` | 最小字元數 |
| `maxLength` | 最大字元數 |
| `min` / `max` | 數值範圍（number 專用） |
| `pattern` | 正則表達式驗證 |
| `errorMessage` | 自訂錯誤訊息 |

---

## 🎵 背景音樂 (backaudio)

### 概述

`backaudio` 是 LayeredImage 和 FlexHeroLayered 的一個屬性，用於設定頁面的背景音樂。背景音樂會自動播放並循環，不顯示任何 UI 控制項。

### 使用方式

```json
{
  "type": "bubble",
  "hero": {
    "type": "layered",
    "background": "https://example.com/bg.jpg",
    "backaudio": "https://example.com/audio/bgm.mp3",
    "layers": [
      { "type": "cards", "zIndex": 1 }
    ]
  }
}
```

### 頁面切換時的音訊處理

當 FlexCarousel 包含多個頁面，每個頁面可以有不同的 `backaudio`：

```json
{
  "type": "carousel",
  "contents": [
    {
      "type": "bubble",
      "hero": {
        "type": "layered",
        "background": "https://example.com/page1.jpg",
        "backaudio": "https://example.com/audio/page1.mp3",
        "layers": [...]
      }
    },
    {
      "type": "bubble",
      "hero": {
        "type": "layered",
        "background": "https://example.com/page2.jpg",
        "backaudio": "https://example.com/audio/page2.mp3",
        "layers": [...]
      }
    }
  ]
}
```

**行為說明**：
- 進入頁面時，自動播放該頁面的 `backaudio`
- 切換頁面時，自動切換到新頁面的音訊（在用戶手勢上下文中播放，確保瀏覽器允許）
- 如果目標頁面沒有 `backaudio`，則停止播放

### 音訊播放管理器 (audioManager)

為了解決瀏覽器自動播放限制，系統使用全域的 `audioManager` 來管理背景音樂：

```typescript
import { audioManager } from '../components/cardDraw';

// 播放指定音訊（應在用戶手勢上下文中呼叫）
audioManager.play('https://example.com/audio/bgm.mp3');

// 停止播放
audioManager.stop();

// 暫停播放
audioManager.pause();

// 取得當前播放狀態
audioManager.getIsPlaying();  // boolean

// 取得當前播放的 URL
audioManager.getCurrentUrl();  // string
```

**重要**：由於瀏覽器的自動播放政策，`audioManager.play()` 必須在用戶手勢（點擊、觸控）的事件處理器中呼叫才能成功。FlexCarouselView 已經自動處理這個問題。

---

## 🎬 影片背景

### 概述

LayeredImage 的 `background` 屬性支援影片格式，影片會自動播放、靜音、循環。

### 支援格式

- `.mp4`
- `.webm`
- `.ogg`
- `.mov`

### 使用方式

```json
{
  "type": "layered",
  "background": "https://example.com/video/bg.mp4",
  "backgroundSize": "cover",
  "backgroundPosition": "center",
  "layers": [
    { "type": "cards", "zIndex": 1 }
  ]
}
```

**影片背景特性**：
- 自動播放 (`autoPlay`)
- 靜音 (`muted`)
- 循環播放 (`loop`)
- 行內播放 (`playsInline`)
- 遵循 `backgroundSize` 和 `backgroundPosition` 設定

### 影片 + 背景音樂

可以同時使用影片背景和背景音樂：

```json
{
  "type": "layered",
  "background": "https://example.com/video/bg.mp4",
  "backaudio": "https://example.com/audio/bgm.mp3",
  "layers": [...]
}
```

這種組合適合需要視覺動態效果但又想要自訂背景音樂的場景。

---

### 獨立使用 LayeredImageView

```tsx
import { LayeredImageView, LayeredImage } from '../components/cardDraw';

const data: LayeredImage = {
  type: 'layered',
  background: 'https://example.com/bg.jpg',
  layers: [
    {
      url: 'https://example.com/overlay.png',
      position: { x: 50, y: 50 },
      size: { scale: 0.8 },
      opacity: 0.9
    }
  ]
};

<LayeredImageView data={data} className="w-full h-64" />
```

---

## 待實作功能

- [ ] 接入真實 API
- [x] Button 類型支援（跳轉/postback）✅
- [x] Audio 類型支援（播放器圖層）✅
- [x] Input 類型支援（表單輸入欄位）✅
- [x] 背景音樂 (backaudio) 支援 ✅
- [x] 影片背景支援 ✅
- [x] 頁面切換音訊處理 ✅
- [ ] 更多 LINE Flex Message 元件支援
- [ ] 自訂主題色彩
- [ ] 分享功能
- [ ] LayeredImage 動畫效果（進場/淡入）

---

## 元件匯出

```typescript
// 從 cardDraw 模組匯入
import {
  // 元件
  FlexCarouselView,
  CardDrawArea,
  FullScreenBubble,
  LayeredImageView,
  audioManager,         // 全域音訊管理器（背景音樂控制）

  // 類型
  FlexCarouselViewProps,
  FlexCarousel,
  FlexBubble,
  FlexHero,
  FlexHeroImage,
  FlexHeroLayered,
  CardsData,
  DrawnCard,
  LayeredImage,
  Layer,
  ImageLayer,           // 圖片圖層
  CardsLayer,           // 卡牌抽取圖層
  TextLayer,            // 文字圖層
  ButtonLayer,          // 按鈕圖層
  AudioLayer,           // 音訊圖層
  InputLayer,           // 輸入欄位圖層
  InputType,            // 輸入類型 ('text' | 'textarea' | 'number' | 'email' | 'tel' | 'date' | 'select')
  ButtonAction,         // 按鈕動作類型（包含 post）
  ButtonNavigationAction, // 導航動作類型（不含 post，用於 successAction）
  ButtonPostAction,     // POST 動作類型
  PostActionResult,     // POST 動作結果類型
  TextSize,             // 文字尺寸類型
  LayerType,            // 圖層類型 ('image' | 'cards' | 'text' | 'button' | 'audio' | 'input')
  LayerAnchor,
  BackgroundPosition,
  FormData,             // 表單資料類型
  FormErrors,           // 表單錯誤類型
  ButtonActionHandlers, // 按鈕動作處理器
  InputHandlers,        // 輸入欄位處理器

  // 工具函數
  getCardDrawStyle,     // 根據 template 取得抽卡樣式
  getDetailStyle,       // 根據 template_details 取得解說樣式
  getTemplateFromResult // 從 DrawResult 取得 template 值
} from '../components/cardDraw';
```
