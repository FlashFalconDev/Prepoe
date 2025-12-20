// CardDraw 共用類型定義

// API 回傳的卡牌資料
export interface DrawnCard {
  card_title: string;
  image_url: string;
  position_title: string | null;
  position_desc: string;
  interpretation?: string; // 牌義解釋
}

export interface CardsData {
  content: DrawnCard[];
  style?: string; // 卡背圖片
  template?: string; // 模板名稱
}

// ===== LayeredImage 類型定義 =====

// 圖層位置錨點
export type LayerAnchor =
  | 'top-left' | 'top-center' | 'top-right'
  | 'center-left' | 'center' | 'center-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

// 圖層類型
export type LayerType = 'image' | 'cards' | 'text' | 'button' | 'audio';

// 圖片圖層
export interface ImageLayer {
  type: 'image';
  id?: string;                    // 圖層 ID（可選，用於識別）
  url: string;                    // 圖片 URL
  position: {
    x: number;                    // X 位置（百分比 0-100）
    y: number;                    // Y 位置（百分比 0-100）
    anchor?: LayerAnchor;         // 錨點位置，預設 'top-left'
  };
  size?: {
    width?: number;               // 寬度（百分比，相對於容器）
    height?: number;              // 高度（百分比，相對於容器）
    scale?: number;               // 縮放比例（1 = 100%）
  };
  rotation?: number;              // 旋轉角度（度）
  opacity?: number;               // 透明度（0-1）
  zIndex?: number;                // 層級順序
}

// 卡牌抽取圖層
export interface CardsLayer {
  type: 'cards';
  id?: string;                    // 圖層 ID（可選）
  opacity?: number;               // 透明度（0-1）
  zIndex?: number;                // 層級順序
}

// 文字圖層尺寸
export type TextSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';

// 文字圖層
export interface TextLayer {
  type: 'text';
  id?: string;                    // 圖層 ID（可選）
  text: string;                   // 文字內容（支援 \n 換行）
  position: {
    x: number;                    // X 位置（百分比 0-100）
    y: number;                    // Y 位置（百分比 0-100）
    anchor?: LayerAnchor;         // 錨點位置，預設 'top-left'
  };
  // 文字區域大小（定義文字框的邊界）
  size?: {
    width?: number;               // 寬度（百分比 0-100），設定後文字會在此寬度內換行
    height?: number;              // 高度（百分比 0-100），可選，超出會被截斷
  };
  style?: {
    fontSize?: TextSize | number; // 字體大小（預設尺寸或 px 數值）
    weight?: 'normal' | 'medium' | 'semibold' | 'bold';  // 字重
    color?: string;               // 文字顏色（預設白色）
    align?: 'left' | 'center' | 'right';  // 文字對齊
    verticalAlign?: 'top' | 'center' | 'bottom';  // 垂直對齊（需設定 height）
    lineHeight?: number;          // 行高（倍數，如 1.5）
    letterSpacing?: number;       // 字間距（px）
    shadow?: boolean | string;    // 文字陰影（true 使用預設陰影，或自訂 CSS）
    stroke?: {                    // 文字描邊
      color?: string;
      width?: number;
    };
    padding?: number | string;    // 內邊距（px 或 CSS 值）
    background?: string;          // 背景顏色（可選，用於除錯或設計）
    borderRadius?: number;        // 圓角（px）
  };
  rotation?: number;              // 旋轉角度（度）
  opacity?: number;               // 透明度（0-1）
  zIndex?: number;                // 層級順序
}

// 按鈕動作類型
export type ButtonAction =
  | { type: 'uri'; uri: string; openInNewTab?: boolean; }  // 開啟網址（預設新視窗，openInNewTab: false 則原視窗）
  | { type: 'next'; }                                // 下一頁
  | { type: 'prev'; }                                // 上一頁
  | { type: 'goto'; index: number; }                 // 跳轉到指定頁
  | { type: 'postback'; data: string; };             // 回傳資料（未來擴充）

// 按鈕圖層
export interface ButtonLayer {
  type: 'button';
  id?: string;                    // 圖層 ID（可選）
  label: string;                  // 按鈕文字
  action: ButtonAction;           // 按鈕動作
  position: {
    x: number;                    // X 位置（百分比 0-100）
    y: number;                    // Y 位置（百分比 0-100）
    anchor?: LayerAnchor;         // 錨點位置，預設 'top-left'
  };
  size?: {
    width?: number | string;      // 寬度（數字=百分比，字串如 "120px"=像素）
    height?: number | string;     // 高度（數字=百分比，字串如 "40px"=像素）
  };
  style?: {
    variant?: 'solid' | 'outline' | 'ghost';  // 按鈕樣式
    color?: string;               // 主色（背景或邊框）
    textColor?: string;           // 文字顏色
    fontSize?: TextSize | number; // 字體大小
    fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold';
    borderRadius?: number;        // 圓角（px）
    padding?: string;             // 內邊距
    shadow?: boolean | string;    // 陰影
    icon?: string;                // 圖標 URL（可選）
    iconPosition?: 'left' | 'right';  // 圖標位置
  };
  disabled?: boolean;             // 是否禁用
  opacity?: number;               // 透明度（0-1）
  zIndex?: number;                // 層級順序
}

// 音訊圖層
export interface AudioLayer {
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

// 統一圖層類型（可擴展）
export type Layer = ImageLayer | CardsLayer | TextLayer | ButtonLayer | AudioLayer;

// 背景位置類型
export type BackgroundPosition =
  | 'top' | 'center' | 'bottom'
  | 'left' | 'right'
  | 'top left' | 'top right' | 'bottom left' | 'bottom right';

// 層疊圖片結構
export interface LayeredImage {
  type: 'layered';
  background: string;             // 底圖 URL
  backgroundSize?: 'cover' | 'contain' | 'fill';  // 底圖填充模式
  backgroundPosition?: BackgroundPosition;        // 底圖對齊位置，預設 'top'
  layers: Layer[];                // 圖層陣列
}

// ===== LINE Flex Message 類型定義 =====

// Hero Image 類型
export interface FlexHeroImage {
  type: 'image';
  url: string;
  size?: string;
  aspectMode?: string;
  aspectRatio?: string;
  flex?: number;
}

// Hero Layered 類型（支援層疊圖片 + 卡牌抽取）
// layers 陣列可包含 image 或 cards 類型的圖層
export interface FlexHeroLayered {
  type: 'layered';
  background: string;                       // 底圖 URL
  backgroundSize?: 'cover' | 'contain' | 'fill';  // 預設 'cover'
  backgroundPosition?: BackgroundPosition;  // 預設 'top'
  layers: Layer[];                          // 圖層陣列（image/cards）
  flex?: number;
}

// Hero 可以是 image 或 layered
export type FlexHero = FlexHeroImage | FlexHeroLayered;

export interface FlexBubble {
  type: 'bubble';
  size?: string;
  hero?: FlexHero;
  body?: {
    content?: string; // 'cards' 表示這裡要放卡牌內容
    flex?: number;
    type?: string;
    layout?: string;
    contents?: unknown[];
    spacing?: string;
    paddingAll?: string;
  };
  footer?: {
    flex?: number;
    type?: string;
    layout?: string;
    contents?: unknown[];
    spacing?: string;
    paddingAll?: string;
  };
  // 冷卻設定（毫秒）- 此 bubble 完成後等待指定時間才能繼續導航
  cooldown?: number;
}

export interface FlexCarousel {
  type: 'carousel';
  contents: FlexBubble[];
}

export interface DrawResult {
  session_id: number;
  cards: CardsData;
  template?: string; // 'base' = 基本模板（預設），可能會有其他模板
  flex_deck?: FlexCarousel; // LINE Flex Message 結構（原名 flex，已改為 flex_deck）
  variable?: Record<string, string>; // 模板變數，如 { explores: '/flex/prepoe/frWWvZ' }
}

// 模板元件的 Props
export interface CardDrawTemplateProps {
  drawResult: DrawResult;
  cardBackImage: string;
  cardAspectRatio: string;
  onRestart: () => void;
  // 抽卡流程狀態
  drawnCardIndices: number[];
  setDrawnCardIndices: React.Dispatch<React.SetStateAction<number[]>>;
  flippingIndex: number | null;
  setFlippingIndex: React.Dispatch<React.SetStateAction<number | null>>;
  allCardsDrawn: boolean;
  setAllCardsDrawn: React.Dispatch<React.SetStateAction<boolean>>;
}
