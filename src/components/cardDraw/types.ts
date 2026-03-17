// CardDraw 共用類型定義
import type { MemberCard } from '../../config/api';

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
  template?: string; // 抽卡模板名稱 (flex_01, flex_02, flex_03, base)
  template_details?: string; // 解說模板名稱 (d_01, d_02, ...)，預設 d_01
  aspectRatio?: string; // 卡片比例（如 '3/4'、'2/3' 等），若未提供則從圖片載入
}

// ===== LayeredImage 類型定義 =====

// 圖層位置錨點
export type LayerAnchor =
  | 'top-left' | 'top-center' | 'top-right'
  | 'center-left' | 'center' | 'center-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

// 圖層類型
export type LayerType = 'image' | 'cards' | 'text' | 'button' | 'audio' | 'input';

// 輸入欄位類型
export type InputType = 'text' | 'textarea' | 'number' | 'email' | 'tel' | 'date' | 'select';

// 位置值類型（數字=百分比，字串=CSS值如 "10px"）
export type PositionValue = number | string;

// 圖片圖層
export interface ImageLayer {
  type: 'image';
  id?: string;                    // 圖層 ID（可選，用於識別）
  url: string;                    // 圖片 URL
  position: {
    x: PositionValue;             // X 位置（數字=百分比 0-100，字串=CSS值如 "10px"）
    y: PositionValue;             // Y 位置（數字=百分比 0-100，字串=CSS值如 "10px"）
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
  action?: ButtonAction;          // 卡牌動畫完成後執行的動作
}

// 文字圖層尺寸
export type TextSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';

// 打字機效果設定
export interface TypewriterConfig {
  enabled: true;                  // 啟用打字機效果
  speed?: number;                 // 打字速度（毫秒/字），預設 50
  delay?: number;                 // 開始延遲（毫秒），預設 0
  paginate?: boolean;             // 啟用自動分頁（文字超出容器時分頁顯示，點擊換頁）
}

// 文字圖層
export interface TextLayer {
  type: 'text';
  id?: string;                    // 圖層 ID（可選）
  text: string;                   // 文字內容（支援 \n 換行）
  position: {
    x: PositionValue;             // X 位置（數字=百分比 0-100，字串=CSS值如 "10px"）
    y: PositionValue;             // Y 位置（數字=百分比 0-100，字串=CSS值如 "10px"）
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
    textAlign?: 'left' | 'center' | 'right';  // 文字對齊（align 的別名）
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
  typewriter?: TypewriterConfig;  // 打字機效果（點擊任意處可跳過）
  rotation?: number;              // 旋轉角度（度）
  opacity?: number;               // 透明度（0-1）
  zIndex?: number;                // 層級順序
}

// 按鈕動作類型（不含 post，用於 successAction）
export type ButtonNavigationAction =
  | { type: 'uri'; uri: string; openInNewTab?: boolean; }  // 開啟網址（預設新視窗，openInNewTab: false 則原視窗）
  | { type: 'next'; }                                // 下一頁
  | { type: 'prev'; }                                // 上一頁
  | { type: 'goto'; index: number; }                 // 跳轉到指定頁
  | { type: 'postback'; data: string; };             // 回傳資料（未來擴充）

// POST 動作類型（表單提交）
export interface ButtonPostAction {
  type: 'post';
  uri: string;                              // POST 請求的 API 路徑
  loadingText?: string;                     // 提交中顯示的文字（如 "提交中..."）
  successAction?: ButtonNavigationAction;   // 成功後執行的動作（next/goto/uri）
}

// AI 動作類型（簡化版 POST，自動使用 AI submit API）
export interface ButtonAIAction {
  type: 'ai';
  loadingText?: string;                     // 提交中顯示的文字（如 "AI 解析中..."）
  successAction?: ButtonNavigationAction;   // 成功後執行的動作（next/goto/uri）
}

// 按鈕動作類型（完整版，包含 post 和 ai）
export type ButtonAction = ButtonNavigationAction | ButtonPostAction | ButtonAIAction;

// 按鈕圖層
export interface ButtonLayer {
  type: 'button';
  id?: string;                    // 圖層 ID（可選）
  label: string;                  // 按鈕文字
  action: ButtonAction;           // 按鈕動作
  position: {
    x: PositionValue;             // X 位置（數字=百分比 0-100，字串=CSS值如 "10px"）
    y: PositionValue;             // Y 位置（數字=百分比 0-100，字串=CSS值如 "10px"）
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
    x: PositionValue;             // X 位置（數字=百分比 0-100，字串=CSS值如 "10px"）
    y: PositionValue;             // Y 位置（數字=百分比 0-100，字串=CSS值如 "10px"）
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

// 輸入欄位圖層
export interface InputLayer {
  type: 'input';
  id?: string;                        // 圖層 ID（可選）
  inputType: InputType;             // 輸入類型
  name: string;                     // 表單欄位名稱（提交用）
  label?: string;                   // 顯示標籤
  placeholder?: string;             // 佔位文字
  defaultValue?: string;            // 預設值
  position: {
    x: PositionValue;               // X 位置（數字=百分比 0-100，字串=CSS值如 "10px"）
    y: PositionValue;               // Y 位置（數字=百分比 0-100，字串=CSS值如 "10px"）
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

// 統一圖層類型（可擴展）
export type Layer = ImageLayer | CardsLayer | TextLayer | ButtonLayer | AudioLayer | InputLayer;

// 背景位置類型
export type BackgroundPosition =
  | 'top' | 'center' | 'bottom'
  | 'left' | 'right'
  | 'top left' | 'top right' | 'bottom left' | 'bottom right';

// 層疊圖片結構
export interface LayeredImage {
  type: 'layered';
  background: string;             // 底圖 URL（支援圖片或影片）
  backgroundSize?: 'cover' | 'contain' | 'fill';  // 底圖填充模式
  backgroundPosition?: BackgroundPosition;        // 底圖對齊位置，預設 'top'
  backaudio?: string;             // 背景音樂 URL（自動播放、循環）
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
  background: string;                       // 底圖 URL（支援圖片或影片）
  backgroundSize?: 'cover' | 'contain' | 'fill';  // 預設 'cover'
  backgroundPosition?: BackgroundPosition;  // 預設 'top'
  backaudio?: string;                       // 背景音樂 URL（自動播放、循環）
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

// 抽牌結果中的推薦商品（如票券/好禮）
export interface RecommendedItem {
  id: number;
  name: string;
  base_price: number;
  sku: string;
  image_url?: string;
  thumbnail_url?: string | null;
  /** 所屬公司 client_sid，用於開啟對應 shop */
  client_sid?: string;
  /** 商品類型：retail, eticket, event, food, booking, recharge, spread, ai_interpretation */
  item_type?: string;
}

/** 依推薦商品內容回傳對應 shop 路徑（依 client_sid + item_type）；可選直接加入購物車並開啟結帳畫面 */
export function getRecommendedItemShopPath(
  item: RecommendedItem,
  options?: { openCart?: boolean }
): string {
  const openCart = options?.openCart && item.sku;
  let path: string;
  let canAddToCart = false;
  if (item.client_sid) {
    const sid = item.client_sid;
    switch (item.item_type) {
      case 'event':
        path = item.sku ? `/shop/${sid}/event/join/${item.sku}` : `/shop/${sid}/events`;
        break;
      case 'eticket':
        path = `/shop/${sid}/tickets`;
        canAddToCart = true;
        break;
      case 'recharge':
        path = `/shop/${sid}/recharge`;
        break;
      case 'retail':
      case 'food':
      case 'booking':
      case 'spread':
      case 'ai_interpretation':
      default:
        path = `/shop/${sid}/products`;
        canAddToCart = true;
        break;
    }
  } else {
    path = `/client/event/join/${item.sku}`;
  }
  if (openCart && canAddToCart) {
    const params = new URLSearchParams();
    params.set('add_sku', item.sku);
    params.set('open_cart', '1');
    return `${path}?${params.toString()}`;
  }
  return path;
}

// 抽牌結果中的推薦老師/推薦人
export interface RecommendedPerson {
  id: number;
  name: string;
  slug: string;
  image_url?: string;
}

export interface AiInterpretation {
  ai_is_active?: boolean;
}

export interface DrawResult {
  session_id: number;
  cards: CardsData;
  template?: string; // 'base' = 基本模板（預設），可能會有其他模板
  flex_deck?: FlexCarousel; // LINE Flex Message 結構（原名 flex，已改為 flex_deck）
  variable?: Record<string, string>; // 模板變數，如 { explores: '/flex/prepoe/frWWvZ' }
  form_data?: Record<string, string | number>; // 伺服器回傳的表單資料（如 session_id），POST 時會一起帶上
  recommended_item?: RecommendedItem;
  recommended_person?: RecommendedPerson;
  ai_interpretation?: AiInterpretation; // 啟用 AI 時需先問問題
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
  // 推薦頁（有內容時在最後一張後多一頁，由模板自行渲染）
  recommended_item?: RecommendedItem;
  recommended_person?: RecommendedPerson;
  // AI 解說（啟用時在推薦頁前顯示 AI 解說）
  ai_interpretation?: AiInterpretation;
  onAiSubmit?: (formData: Record<string, string>) => Promise<{ success: boolean; need_addon?: boolean; data?: { interpretation?: string } }>;
  userQuestion?: string; // 一進來已問過的問題，跳過抽卡後的 AI 輸入
  // AI 加購（need_addon 時由 CardDraw 傳入）
  addonInfo?: { need_addon: boolean; price: number; session_id: number } | null;
  addonMemberCard?: MemberCard | null;
  onAddonPurchase?: (note: string) => Promise<{ interpretation: string } | null>;
}
