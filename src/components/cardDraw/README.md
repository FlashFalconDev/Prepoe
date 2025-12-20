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

層疊式 Hero 支援 `background` 背景圖 + `layers` 圖層陣列。

```typescript
interface FlexHeroLayered {
  type: 'layered';
  background: string;         // 背景圖 URL
  backgroundSize?: 'cover' | 'contain' | 'fill';  // 預設 'cover'
  backgroundPosition?: BackgroundPosition;        // 預設 'top'
  layers: Layer[];            // 圖層陣列（支援 image/cards 類型）
  flex?: number;              // 比例權重
}
```

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

## 完整範例

```json
{
  "success": true,
  "message": "抽牌成功",
  "data": {
    "session_id": 521,
    "card_style": "https://example.com/card_back.png",
    "cards": {
      "content": [
        {
          "card_title": "內疚",
          "image_url": "https://example.com/card1.png",
          "position_title": null,
          "position_desc": "",
          "interpretation": "第一頁解說...|第二頁解說..."
        },
        {
          "card_title": "絕望",
          "image_url": "https://example.com/card2.png",
          "position_title": null,
          "position_desc": "",
          "interpretation": "解說內容..."
        }
      ],
      "style": "https://example.com/card_back.png",
      "template": "flex_01"
    },
    "flex": {
      "type": "carousel",
      "contents": [
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
              { "type": "text", "text": "塔羅占卜", "weight": "bold", "size": "sm" }
            ],
            "paddingAll": "13px"
          }
        },
        {
          "type": "bubble",
          "hero": {
            "type": "image",
            "url": "https://example.com/ending.jpg"
          },
          "body": {
            "type": "box",
            "layout": "vertical",
            "contents": [
              { "type": "text", "text": "感謝您的參與", "weight": "bold", "size": "sm" },
              { "type": "text", "text": "期待下次為你服務", "size": "xs", "color": "#8c8c8c" }
            ],
            "paddingAll": "13px"
          }
        }
      ]
    }
  }
}
```

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
  background: string;                           // 底圖 URL
  backgroundSize?: 'cover' | 'contain' | 'fill'; // 底圖填充模式，預設 'cover'
  backgroundPosition?: BackgroundPosition;       // 底圖對齊位置，預設 'top'
  layers: Layer[];                              // 圖層陣列
}

// 統一圖層類型（可擴展）
type Layer = ImageLayer | CardsLayer | TextLayer;

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
  text: string;                   // 文字內容
  position: {
    x: number;                    // X 位置（百分比 0-100）
    y: number;                    // Y 位置（百分比 0-100）
    anchor?: LayerAnchor;         // 錨點，預設 'top-left'
  };
  style?: {
    size?: TextSize | number;     // 字體大小（預設尺寸或 px 數值）
    weight?: 'normal' | 'medium' | 'semibold' | 'bold';  // 字重
    color?: string;               // 文字顏色（預設白色）
    align?: 'left' | 'center' | 'right';  // 文字對齊
    maxWidth?: number;            // 最大寬度（百分比，超過換行）
    lineHeight?: number;          // 行高（倍數，如 1.5）
    shadow?: boolean | string;    // 文字陰影
    stroke?: {                    // 文字描邊
      color?: string;
      width?: number;
    };
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
  ButtonAction,         // 按鈕動作類型
  TextSize,             // 文字尺寸類型
  LayerType,            // 圖層類型 ('image' | 'cards' | 'text' | 'button')
  LayerAnchor,
  BackgroundPosition
} from '../components/cardDraw';
```
