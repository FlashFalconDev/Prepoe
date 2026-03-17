// LayeredImageView - 層疊圖片呈現元件
import React, { useRef, useState, useEffect } from 'react';
import { LayeredImage, Layer, ImageLayer, CardsLayer, TextLayer, ButtonLayer, AudioLayer, InputLayer, LayerAnchor, TextSize, ButtonAction, ButtonNavigationAction, ButtonPostAction, ButtonAIAction } from './types';
import { Play, Pause, Volume2, ChevronLeft, ChevronRight } from 'lucide-react';
import { API_BASE } from '../../config/api';

// POST 成功後回傳的資料結構（用於更新畫面）
export interface PostSuccessData {
  cards?: {
    content: Array<{
      card_title: string;
      image_url: string;
      position_title?: string | null;
      position_desc?: string;
      interpretation?: string;
    }>;
    style?: string;
    aspectRatio?: string;
    template?: string;
    template_details?: string;
  };
  form_data?: Record<string, string | number>;
  flex_deck?: {
    type: 'carousel';
    contents: unknown[];
  };
  // AI 加購相關欄位
  need_addon?: boolean;
  price?: number;
  session_id?: number;
}

// POST 動作結果
export interface PostActionResult {
  success: boolean;
  message?: string;
  data?: PostSuccessData;  // POST 成功後的資料（用於更新 cards、flex_deck 等）
}

// 按鈕動作處理器
export interface ButtonActionHandlers {
  onNext?: () => void;
  onPrev?: () => void;
  onGoto?: (index: number) => void;
  onUri?: (uri: string) => void;
  onPostback?: (data: string) => void;
  onNavigate?: (path: string) => void; // 站內導航（使用 React Router）
  onPost?: (uri: string, formData: Record<string, string>) => Promise<PostActionResult>; // 表單提交
  onPostSuccess?: (data: PostSuccessData) => void; // POST 成功後用新資料更新畫面
  onNeedAddon?: (data: { need_addon: boolean; price: number; session_id: number }) => void; // AI 加購回調
}

// 輸入欄位處理器
export interface InputHandlers {
  onChange?: (name: string, value: string) => void;
  getValue?: (name: string) => string;
  getError?: (name: string) => string | undefined;
}

interface LayeredImageViewProps {
  data: LayeredImage;
  className?: string;
  // Cards 圖層渲染所需的 props
  cardsRenderer?: (layer: CardsLayer) => React.ReactNode;
  // Button 圖層動作處理器
  buttonHandlers?: ButtonActionHandlers;
  // Input 圖層處理器
  inputHandlers?: InputHandlers;
  // 取得表單資料（供 POST 動作使用）
  getFormData?: () => Record<string, string>;
}

// 根據錨點計算 transform 偏移
// 預設 'top-left'：圖層左上角對齊到指定位置（從起點開始算）
const getAnchorTransform = (anchor: LayerAnchor = 'top-left'): string => {
  switch (anchor) {
    case 'top-left':
      return 'translate(0%, 0%)';
    case 'top-center':
      return 'translate(-50%, 0%)';
    case 'top-right':
      return 'translate(-100%, 0%)';
    case 'center-left':
      return 'translate(0%, -50%)';
    case 'center':
      return 'translate(-50%, -50%)';
    case 'center-right':
      return 'translate(-100%, -50%)';
    case 'bottom-left':
      return 'translate(0%, -100%)';
    case 'bottom-center':
      return 'translate(-50%, -100%)';
    case 'bottom-right':
      return 'translate(-100%, -100%)';
    default:
      return 'translate(0%, 0%)'; // 預設 top-left
  }
};

// 將位置值轉換為 CSS 值
// 數字 → 百分比（如 50 → "50%"）
// 字串 → 直接使用（如 "10px" → "10px"）
const getPositionStyle = (value: number | string): string => {
  if (typeof value === 'string') return value;
  return `${value}%`;
};

// 文字尺寸對應表（對應 Tailwind 的 text-* 大小）
const textSizeMap: Record<TextSize, string> = {
  'xs': '0.75rem',    // 12px
  'sm': '0.875rem',   // 14px
  'md': '1rem',       // 16px
  'lg': '1.125rem',   // 18px
  'xl': '1.25rem',    // 20px
  '2xl': '1.5rem',    // 24px
  '3xl': '1.875rem',  // 30px
  '4xl': '2.25rem',   // 36px
};

// 文字圖層元件
const TextLayerView: React.FC<{ layer: TextLayer }> = ({ layer }) => {
  const {
    text,
    position,
    size,
    style = {},
    typewriter,
    rotation = 0,
    opacity = 1,
    zIndex = 1,
  } = layer;

  // 分頁相關狀態
  const [pages, setPages] = useState<string[]>([text]);
  const [currentPage, setCurrentPage] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [isPaginated, setIsPaginated] = useState(false);

  // 打字機效果狀態
  const currentPageText = pages[currentPage] || '';
  const [displayedText, setDisplayedText] = useState(typewriter?.enabled ? '' : currentPageText);
  const [isTyping, setIsTyping] = useState(false);
  const typewriterRef = useRef<NodeJS.Timeout | null>(null);
  const charIndexRef = useRef(0);

  // 計算分頁（當文字超出容器時）
  useEffect(() => {
    if (!typewriter?.paginate || !size?.height || !containerRef.current) {
      setPages([text]);
      setCurrentPage(0);
      setIsPaginated(false);
      return;
    }

    // 導航元素佔用的空間
    const navPaddingLeft = 32; // px - 左右箭頭按鈕寬度
    const navPaddingRight = 32;
    const navPaddingTop = 20; // px - 頂部指示器高度（含間距）

    // 計算可用寬度（扣掉導航按鈕空間）
    const availableWidth = containerRef.current.clientWidth - navPaddingLeft - navPaddingRight;

    // 建立測量用的隱藏元素
    const measureDiv = document.createElement('div');
    measureDiv.style.cssText = `
      position: absolute;
      visibility: hidden;
      width: ${availableWidth}px;
      font-size: ${typeof style.fontSize === 'number' ? `${style.fontSize}px` : textSizeMap[style.fontSize || 'md']};
      font-weight: ${style.weight === 'bold' ? 700 : style.weight === 'semibold' ? 600 : style.weight === 'medium' ? 500 : 400};
      line-height: ${style.lineHeight || 1.4};
      letter-spacing: ${style.letterSpacing ? `${style.letterSpacing}px` : 'normal'};
      white-space: pre-wrap;
      word-break: break-word;
      padding: ${typeof style.padding === 'number' ? `${style.padding}px` : style.padding || '0'};
    `;
    document.body.appendChild(measureDiv);

    // 計算可用高度（扣掉頂部指示器空間）
    const containerHeight = containerRef.current.clientHeight - navPaddingTop;
    const newPages: string[] = [];
    let remainingText = text;

    while (remainingText.length > 0) {
      let low = 1;
      let high = remainingText.length;
      let bestFit = 0;

      // 二分搜尋找出能放入容器的最多文字
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        measureDiv.textContent = remainingText.slice(0, mid);

        if (measureDiv.scrollHeight <= containerHeight) {
          bestFit = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }

      if (bestFit === 0) {
        // 至少放一個字
        bestFit = 1;
      }

      // 嘗試在斷點處分頁（避免斷在字中間）
      if (bestFit < remainingText.length) {
        const searchRange = remainingText.slice(0, bestFit);
        // 找最後一個換行或標點符號
        const breakPoints = ['\n', '。', '！', '？', '，', '、', '.', '!', '?', ',', ' '];
        let breakIndex = -1;
        for (const bp of breakPoints) {
          const idx = searchRange.lastIndexOf(bp);
          if (idx > breakIndex && idx > bestFit * 0.5) {
            breakIndex = idx + 1; // 包含斷點字元
          }
        }
        if (breakIndex > 0) {
          bestFit = breakIndex;
        }
      }

      newPages.push(remainingText.slice(0, bestFit));
      remainingText = remainingText.slice(bestFit).trimStart();
    }

    document.body.removeChild(measureDiv);

    setPages(newPages);
    setCurrentPage(0);
    setIsPaginated(newPages.length > 1);
  }, [text, size?.height, style.fontSize, style.weight, style.lineHeight, style.letterSpacing, style.padding, typewriter?.paginate]);

  // 打字機效果
  useEffect(() => {
    const pageText = pages[currentPage] || '';

    if (!typewriter?.enabled) {
      setDisplayedText(pageText);
      setIsTyping(false);
      return;
    }

    const speed = typewriter.speed ?? 50;
    const delay = currentPage === 0 ? (typewriter.delay ?? 0) : 0; // 只有第一頁有延遲

    // 重置狀態
    setDisplayedText('');
    setIsTyping(true);
    charIndexRef.current = 0;

    // 延遲開始
    const startTimeout = setTimeout(() => {
      const typeNextChar = () => {
        if (charIndexRef.current < pageText.length) {
          charIndexRef.current++;
          setDisplayedText(pageText.slice(0, charIndexRef.current));
          typewriterRef.current = setTimeout(typeNextChar, speed);
        } else {
          setIsTyping(false);
        }
      };
      typeNextChar();
    }, delay);

    return () => {
      clearTimeout(startTimeout);
      if (typewriterRef.current) {
        clearTimeout(typewriterRef.current);
      }
    };
  }, [pages, currentPage, typewriter?.enabled, typewriter?.speed, typewriter?.delay]);

  // 點擊處理：跳過打字或下一頁
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!typewriter?.enabled) return;

    if (isTyping) {
      // 打字中：跳過打字，顯示完整當頁文字
      if (typewriterRef.current) {
        clearTimeout(typewriterRef.current);
      }
      setDisplayedText(pages[currentPage] || '');
      setIsTyping(false);
    } else if (isPaginated && currentPage < pages.length - 1) {
      // 打字完成且還有下一頁：換頁
      setCurrentPage(prev => prev + 1);
    }
  };

  // 上一頁
  const handlePrevPage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  // 下一頁
  const handleNextPage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentPage < pages.length - 1) {
      setCurrentPage(prev => prev + 1);
    }
  };

  // 字體大小（支援舊版 size 和新版 fontSize）
  const fontSizeValue = style.fontSize;
  const fontSize = typeof fontSizeValue === 'number'
    ? `${fontSizeValue}px`
    : textSizeMap[fontSizeValue || 'md'];

  // 字重對應
  const fontWeightMap = {
    'normal': 400,
    'medium': 500,
    'semibold': 600,
    'bold': 700,
  };

  // 文字陰影
  const getTextShadow = () => {
    if (!style.shadow) return undefined;
    if (typeof style.shadow === 'string') return style.shadow;
    return '0 2px 4px rgba(0,0,0,0.5)';
  };

  // 文字描邊
  const getTextStroke = () => {
    if (!style.stroke) return {};
    const { color = '#000', width = 1 } = style.stroke;
    return {
      WebkitTextStroke: `${width}px ${color}`,
    };
  };

  // 垂直對齊
  const getVerticalAlignStyle = () => {
    if (!size?.height || !style.verticalAlign) return {};
    const alignMap = {
      'top': 'flex-start',
      'center': 'center',
      'bottom': 'flex-end',
    };
    return {
      display: 'flex',
      alignItems: alignMap[style.verticalAlign],
    };
  };

  // 內邊距
  const getPadding = () => {
    if (!style.padding) return undefined;
    if (typeof style.padding === 'number') return `${style.padding}px`;
    return style.padding;
  };

  // 計算 transform
  const anchorTransform = getAnchorTransform(position.anchor);
  const rotateTransform = rotation !== 0 ? ` rotate(${rotation}deg)` : '';
  const fullTransform = `${anchorTransform}${rotateTransform}`;

  // 打字機效果時需要可點擊（打字中或有下一頁）
  const isClickable = typewriter?.enabled && (isTyping || (isPaginated && currentPage < pages.length - 1));

  // 顯示導航按鈕：有分頁、不在打字中、且有上一頁或下一頁可導航
  const showNavigation = isPaginated && !isTyping && typewriter?.enabled;
  const canGoPrev = currentPage > 0;
  const canGoNext = currentPage < pages.length - 1;

  // 導航按鈕尺寸（用於計算 padding）
  const navButtonSize = 32; // px - 按鈕直徑
  const indicatorHeight = 20; // px - 頂部指示器高度（含間距）

  // 計算文字區域的額外 padding（避開導航元素）
  // 注意：只要有分頁就一直保持 padding，避免打字中和打字後格式不一致
  const getNavigationPadding = () => {
    if (!isPaginated || !typewriter?.enabled) return {};
    return {
      paddingTop: `${indicatorHeight}px`,
      paddingLeft: `${navButtonSize}px`,
      paddingRight: `${navButtonSize}px`,
    };
  };

  return (
    <div
      ref={containerRef}
      className={`absolute ${isClickable ? 'cursor-pointer' : ''}`}
      style={{
        left: getPositionStyle(position.x),
        top: getPositionStyle(position.y),
        width: size?.width ? `${size.width}%` : 'auto',
        height: size?.height ? `${size.height}%` : 'auto',
        transform: fullTransform,
        opacity,
        zIndex,
        overflow: 'hidden',
        background: style.background,
        borderRadius: style.borderRadius ? `${style.borderRadius}px` : undefined,
        ...getVerticalAlignStyle(),
      }}
      onClick={isClickable ? handleClick : undefined}
    >
      {/* 文字內容區域 */}
      <div
        ref={textRef}
        className="whitespace-pre-wrap h-full"
        style={{
          fontSize,
          fontWeight: fontWeightMap[style.weight || 'normal'],
          color: style.color || '#ffffff',
          textAlign: style.textAlign || style.align || 'left',
          lineHeight: style.lineHeight || 1.4,
          letterSpacing: style.letterSpacing ? `${style.letterSpacing}px` : undefined,
          textShadow: getTextShadow(),
          wordBreak: 'break-word',
          padding: getPadding(),
          ...getNavigationPadding(),
          ...getTextStroke(),
        }}
      >
        {displayedText}
        {/* 打字中顯示游標 */}
        {isTyping && <span className="animate-pulse">|</span>}
      </div>

      {/* 分頁導航 - 左右箭頭（與 FlexCarousel 風格一致） */}
      {showNavigation && canGoPrev && (
        <button
          onClick={handlePrevPage}
          className="absolute left-1 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-black/30 hover:bg-black/50 active:scale-95 transition-all pointer-events-auto"
        >
          <ChevronLeft className="text-white" size={18} />
        </button>
      )}
      {showNavigation && canGoNext && (
        <button
          onClick={handleNextPage}
          className="absolute right-1 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-black/30 hover:bg-black/50 active:scale-95 transition-all pointer-events-auto"
        >
          <ChevronRight className="text-white" size={18} />
        </button>
      )}

      {/* 頁面指示器 - 頂部長條（與 FlexCarousel 風格一致） */}
      {showNavigation && (
        <div className="absolute top-1 left-8 right-8 z-10 pointer-events-auto">
          <div className="flex gap-0.5">
            {pages.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentPage(index);
                }}
                className={`
                  h-0.5 flex-1 rounded-full transition-all duration-300 cursor-pointer
                  ${index === currentPage
                    ? 'bg-white'
                    : index < currentPage
                    ? 'bg-white/70'
                    : 'bg-white/30'
                  }
                `}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// 按鈕圖層元件
interface ButtonLayerViewProps {
  layer: ButtonLayer;
  handlers?: ButtonActionHandlers;
  getFormData?: () => Record<string, string>; // 取得表單資料
}

const ButtonLayerView: React.FC<ButtonLayerViewProps> = ({ layer, handlers, getFormData }) => {
  const [isLoading, setIsLoading] = useState(false);

  const {
    label,
    action,
    position,
    size,
    style = {},
    disabled = false,
    opacity = 1,
    zIndex = 1,
  } = layer;

  // 字體大小
  const fontSizeValue = style.fontSize;
  const fontSize = typeof fontSizeValue === 'number'
    ? `${fontSizeValue}px`
    : textSizeMap[fontSizeValue || 'md'];

  // 字重對應
  const fontWeightMap = {
    'normal': 400,
    'medium': 500,
    'semibold': 600,
    'bold': 700,
  };

  // 按鈕樣式
  const getButtonStyle = () => {
    const variant = style.variant || 'solid';
    const color = style.color || '#3b82f6'; // 預設藍色
    const textColor = style.textColor || (variant === 'solid' ? '#ffffff' : color);

    const baseStyle: React.CSSProperties = {
      backgroundColor: variant === 'solid' ? color : 'transparent',
      color: textColor,
      border: variant === 'outline' ? `2px solid ${color}` : 'none',
      borderRadius: style.borderRadius ? `${style.borderRadius}px` : '8px',
      padding: style.padding || '8px 16px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      transition: 'all 0.2s ease',
      fontSize,
      fontWeight: fontWeightMap[style.fontWeight || 'medium'],
    };

    // 陰影
    if (style.shadow) {
      baseStyle.boxShadow = typeof style.shadow === 'string'
        ? style.shadow
        : '0 4px 6px rgba(0, 0, 0, 0.1)';
    }

    return baseStyle;
  };

  // 執行導航動作（供 successAction 使用）
  const executeNavigationAction = (navAction: ButtonNavigationAction) => {
    switch (navAction.type) {
      case 'uri':
        if (handlers?.onUri) {
          handlers.onUri(navAction.uri);
        } else {
          const openInNewTab = navAction.openInNewTab !== false;
          if (openInNewTab) {
            window.open(navAction.uri, '_blank', 'noopener,noreferrer');
          } else {
            const isInternalPath = navAction.uri.startsWith('/') && !navAction.uri.startsWith('//');
            if (isInternalPath && handlers?.onNavigate) {
              handlers.onNavigate(navAction.uri);
            } else {
              window.location.href = navAction.uri;
            }
          }
        }
        break;
      case 'next':
        handlers?.onNext?.();
        break;
      case 'prev':
        handlers?.onPrev?.();
        break;
      case 'goto':
        handlers?.onGoto?.(navAction.index);
        break;
      case 'postback':
        handlers?.onPostback?.(navAction.data);
        break;
    }
  };

  // 處理 POST 動作
  const handlePostAction = async (postAction: ButtonPostAction) => {
    if (!handlers?.onPost) {
      console.warn('onPost handler 未定義');
      return;
    }

    setIsLoading(true);
    try {
      const formData = getFormData?.() || {};
      const result = await handlers.onPost(postAction.uri, formData);

      console.log('[POST] result:', result);
      console.log('[POST] postAction.successAction:', postAction.successAction);
      console.log('[POST] result.data:', result.data);
      console.log('[POST] handlers.onPostSuccess:', !!handlers.onPostSuccess);

      if (result.success) {
        // 如果有指定 successAction，執行該動作
        if (postAction.successAction) {
          console.log('[POST] 執行 successAction');
          executeNavigationAction(postAction.successAction);
        }
        // 如果沒有 successAction 但有回傳資料，呼叫 onPostSuccess 更新畫面
        else if (result.data && handlers.onPostSuccess) {
          console.log('[POST] 執行 onPostSuccess，更新畫面資料');
          handlers.onPostSuccess(result.data);
        }
        // 如果都沒有，預設跳到下一頁
        else {
          console.log('[POST] 沒有 successAction 也沒有 data，執行 onNext');
          handlers?.onNext?.();
        }
      }
      // 錯誤由 onPost 內部處理（使用 toast）
    } finally {
      setIsLoading(false);
    }
  };

  // 處理 AI 動作（簡化版 POST，自動使用 AI submit API）
  const handleAIAction = async (aiAction: ButtonAIAction) => {
    if (!handlers?.onPost) {
      console.warn('onPost handler 未定義');
      return;
    }

    setIsLoading(true);
    try {
      // AI 動作：自動使用 AI submit API
      const aiUri = `${API_BASE}/cardhack/api/ai/submit/`;
      const formData = getFormData?.() || {};
      const result = await handlers.onPost(aiUri, formData);

      console.log('[AI] result:', result);
      console.log('[AI] aiAction.successAction:', aiAction.successAction);

      if (result.success) {
        // 如果有指定 successAction，執行該動作
        if (aiAction.successAction) {
          console.log('[AI] 執行 successAction');
          executeNavigationAction(aiAction.successAction);
        }
        // 如果回傳有 flex_deck，呼叫 onPostSuccess 更新畫面
        else if (result.data?.flex_deck && handlers.onPostSuccess) {
          console.log('[AI] 有 flex_deck，執行 onPostSuccess 更新畫面');
          handlers.onPostSuccess(result.data);
        }
        // 其他情況（沒有 successAction 也沒有 flex_deck），預設跳到下一頁
        else {
          console.log('[AI] 沒有 successAction 也沒有 flex_deck，執行 onNext');
          handlers?.onNext?.();
        }
      } else if (!result.success && result.data?.need_addon && handlers.onNeedAddon) {
        // 需要加購 AI 解釋
        console.log('[AI] 需要加購 AI 解釋', result.data);
        handlers.onNeedAddon({
          need_addon: result.data.need_addon!,
          price: result.data.price!,
          session_id: result.data.session_id!,
        });
      }
      // 其餘錯誤由 onPost 內部處理（使用 toast）
    } finally {
      setIsLoading(false);
    }
  };

  // 處理點擊
  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || isLoading) return;

    // POST 動作
    if (action.type === 'post') {
      await handlePostAction(action);
      return;
    }

    // AI 動作（簡化版 POST）
    if (action.type === 'ai') {
      await handleAIAction(action);
      return;
    }

    // 導航動作
    executeNavigationAction(action);
  };

  // 計算 transform
  const anchorTransform = getAnchorTransform(position.anchor);

  // 計算尺寸：字串直接用（如 "40px"），數字當百分比
  const getSizeStyle = (value: number | string | undefined) => {
    if (!value) return 'auto';
    if (typeof value === 'string') return value; // "40px" 等直接用
    return `${value}%`; // 數字當百分比
  };

  // 取得顯示的按鈕文字
  const getDisplayLabel = () => {
    if (isLoading && (action.type === 'post' || action.type === 'ai')) {
      // 優先使用 action.loadingText，若無則嘗試從 successAction 中取得（相容舊版 API）
      const loadingText = action.loadingText ||
        (action.successAction && 'loadingText' in action.successAction
          ? (action.successAction as unknown as { loadingText?: string }).loadingText
          : undefined);
      if (loadingText) {
        return loadingText;
      }
    }
    return label;
  };

  return (
    <button
      className="absolute flex items-center justify-center gap-2"
      style={{
        left: getPositionStyle(position.x),
        top: getPositionStyle(position.y),
        width: getSizeStyle(size?.width),
        height: getSizeStyle(size?.height),
        transform: anchorTransform,
        opacity: isLoading ? opacity * 0.7 : opacity,
        zIndex,
        ...getButtonStyle(),
        cursor: isLoading ? 'wait' : (disabled ? 'not-allowed' : 'pointer'),
      }}
      onClick={handleClick}
      disabled={disabled || isLoading}
    >
      {/* Loading 動畫 */}
      {isLoading && (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {style.icon && style.iconPosition !== 'right' && !isLoading && (
        <img src={style.icon} alt="" className="w-5 h-5" />
      )}
      {getDisplayLabel()}
      {style.icon && style.iconPosition === 'right' && !isLoading && (
        <img src={style.icon} alt="" className="w-5 h-5" />
      )}
    </button>
  );
};

// 音訊圖層元件
const AudioLayerView: React.FC<{ layer: AudioLayer }> = ({ layer }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const {
    url,
    position,
    size,
    style = {},
    autoplay = false,
    loop = false,
    opacity = 1,
    zIndex = 1,
  } = layer;

  // 計算錨點 transform
  const anchorTransform = getAnchorTransform(position.anchor);

  // 計算寬度
  const getWidthStyle = () => {
    if (!size?.width) return '60%';
    if (typeof size.width === 'string') return size.width;
    return `${size.width}%`;
  };

  // 播放/暫停切換
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // 時間格式化
  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 進度條點擊跳轉
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = percent * duration;
  };

  // 主色調（統一使用 hex 格式）
  const primaryColor = style.color || '#3b82f6';
  const bgColor = style.backgroundColor || '#FFFFFFE6'; // 白色 90% 透明度
  const borderRadius = style.borderRadius ?? 12;

  // 處理錯誤
  const handleError = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    console.error('Audio 載入失敗:', url, e);
  };

  return (
    <div
      className="absolute"
      style={{
        left: getPositionStyle(position.x),
        top: getPositionStyle(position.y),
        width: getWidthStyle(),
        transform: anchorTransform,
        opacity,
        zIndex,
      }}
    >
      {/* 隱藏的 audio 元素 */}
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        crossOrigin="anonymous"
        autoPlay={autoplay}
        loop={loop}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onError={handleError}
      />

      {/* 播放器 UI */}
      <div
        className="flex items-center gap-3 px-4 py-3 shadow-lg"
        style={{
          backgroundColor: bgColor,
          borderRadius: `${borderRadius}px`,
        }}
      >
        {/* 播放/暫停按鈕 */}
        <button
          onClick={togglePlay}
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105"
          style={{
            backgroundColor: primaryColor,
            color: '#ffffff',
          }}
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
        </button>

        {/* 進度區域 */}
        <div className="flex-1 min-w-0">
          {/* 進度條 */}
          <div
            className="h-2 rounded-full cursor-pointer overflow-hidden"
            style={{ backgroundColor: `${primaryColor}20` }}
            onClick={handleProgressClick}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: duration ? `${(currentTime / duration) * 100}%` : '0%',
                backgroundColor: primaryColor,
              }}
            />
          </div>

          {/* 時間顯示 */}
          <div className="flex justify-between text-xs mt-1" style={{ color: '#6b7280' }}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* 音量圖示 */}
        <Volume2 size={18} className="flex-shrink-0" style={{ color: '#9ca3af' }} />
      </div>
    </div>
  );
};

// 輸入欄位圖層元件
interface InputLayerViewProps {
  layer: InputLayer;
  handlers?: InputHandlers;
}

const InputLayerView: React.FC<InputLayerViewProps> = ({ layer, handlers }) => {
  const {
    inputType,
    name,
    label,
    placeholder,
    defaultValue = '',
    position,
    size,
    options = [],
    rows = 3,
    validation,
    style = {},
    disabled = false,
    opacity = 1,
    zIndex = 1,
  } = layer;

  // 取得當前值和錯誤
  const value = handlers?.getValue?.(name) ?? defaultValue;
  const error = handlers?.getError?.(name);

  // 樣式處理
  const fontSize = typeof style.fontSize === 'number'
    ? `${style.fontSize}px`
    : textSizeMap[style.fontSize || 'md'];

  const inputStyle: React.CSSProperties = {
    fontSize,
    color: style.color || '#333333',
    backgroundColor: style.backgroundColor || '#FFFFFFEE',
    borderRadius: `${style.borderRadius ?? 8}px`,
    border: `1px solid ${error ? '#ef4444' : (style.borderColor || '#d1d5db')}`,
    padding: style.padding || '12px 16px',
    width: '100%',
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  // placeholder 樣式（透過 CSS 變數）
  const placeholderColor = style.placeholderColor || '#9ca3af';

  // 計算位置
  const anchorTransform = getAnchorTransform(position.anchor);
  const widthStyle = size?.width ? `${size.width}%` : '80%';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    handlers?.onChange?.(name, e.target.value);
  };

  // 渲染輸入元素
  const renderInput = () => {
    const commonProps = {
      name,
      value,
      onChange: handleChange,
      placeholder,
      disabled,
      style: inputStyle,
      className: 'focus:ring-2 focus:ring-blue-500/50',
    };

    switch (inputType) {
      case 'textarea':
        return (
          <textarea
            {...commonProps}
            rows={rows}
            maxLength={validation?.maxLength}
            style={{
              ...inputStyle,
              resize: 'none',
              minHeight: size?.height ? `${size.height}%` : undefined,
            }}
          />
        );

      case 'select':
        return (
          <select {...commonProps} style={{ ...inputStyle, cursor: 'pointer' }}>
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'number':
        return (
          <input
            {...commonProps}
            type="number"
            min={validation?.min}
            max={validation?.max}
          />
        );

      case 'email':
        return <input {...commonProps} type="email" />;

      case 'tel':
        return <input {...commonProps} type="tel" />;

      case 'date':
        return <input {...commonProps} type="date" />;

      case 'text':
      default:
        return (
          <input
            {...commonProps}
            type="text"
            maxLength={validation?.maxLength}
          />
        );
    }
  };

  return (
    <div
      className="absolute"
      style={{
        left: getPositionStyle(position.x),
        top: getPositionStyle(position.y),
        width: widthStyle,
        transform: anchorTransform,
        opacity,
        zIndex,
        // placeholder 顏色透過 CSS 變數
        // @ts-expect-error CSS variable
        '--placeholder-color': placeholderColor,
      }}
    >
      {/* 標籤 */}
      {label && (
        <label
          className="block mb-2 font-medium"
          style={{
            color: style.labelColor || '#ffffff',
            fontSize,
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          }}
        >
          {label}
          {validation?.required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}

      {/* 輸入欄位 */}
      <style>
        {`
          [style*="--placeholder-color"]::placeholder,
          [style*="--placeholder-color"] input::placeholder,
          [style*="--placeholder-color"] textarea::placeholder {
            color: var(--placeholder-color);
          }
        `}
      </style>
      {renderInput()}

      {/* 錯誤訊息 */}
      {error && (
        <p className="mt-1 text-sm text-red-400" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
          {error}
        </p>
      )}
    </div>
  );
};

// 圖片圖層元件
const ImageLayerView: React.FC<{ layer: ImageLayer }> = ({ layer }) => {
  const {
    url,
    position,
    size,
    rotation = 0,
    opacity = 1,
    zIndex = 1,
  } = layer;

  // 計算縮放
  const scale = size?.scale ?? 1;
  const widthStyle = size?.width ? `${size.width}%` : 'auto';
  const heightStyle = size?.height ? `${size.height}%` : 'auto';

  // 計算 transform
  const anchorTransform = getAnchorTransform(position.anchor);
  const rotateTransform = rotation !== 0 ? ` rotate(${rotation}deg)` : '';
  const scaleTransform = scale !== 1 ? ` scale(${scale})` : '';
  const fullTransform = `${anchorTransform}${rotateTransform}${scaleTransform}`;

  return (
    <img
      src={url}
      alt=""
      className="absolute pointer-events-none"
      style={{
        left: getPositionStyle(position.x),
        top: getPositionStyle(position.y),
        width: widthStyle,
        height: heightStyle,
        transform: fullTransform,
        opacity,
        zIndex,
        objectFit: 'contain',
      }}
      draggable={false}
    />
  );
};

// 通用圖層渲染
interface LayerViewProps {
  layer: Layer;
  cardsRenderer?: (layer: CardsLayer) => React.ReactNode;
  buttonHandlers?: ButtonActionHandlers;
  inputHandlers?: InputHandlers;
  getFormData?: () => Record<string, string>; // 取得表單資料（供 POST 動作使用）
}

const LayerView: React.FC<LayerViewProps> = ({ layer, cardsRenderer, buttonHandlers, inputHandlers, getFormData }) => {
  // 根據圖層類型渲染
  if (layer.type === 'cards') {
    // Cards 圖層使用外部傳入的渲染器
    if (cardsRenderer) {
      return (
        <div
          className="absolute inset-0"
          style={{
            opacity: layer.opacity ?? 1,
            zIndex: layer.zIndex ?? 1,
          }}
        >
          {cardsRenderer(layer)}
        </div>
      );
    }
    return null;
  }

  // Image 圖層
  if (layer.type === 'image') {
    return <ImageLayerView layer={layer} />;
  }

  // Text 圖層
  if (layer.type === 'text') {
    return <TextLayerView layer={layer} />;
  }

  // Button 圖層
  if (layer.type === 'button') {
    return <ButtonLayerView layer={layer} handlers={buttonHandlers} getFormData={getFormData} />;
  }

  // Audio 圖層
  if (layer.type === 'audio') {
    return <AudioLayerView layer={layer} />;
  }

  // Input 圖層
  if (layer.type === 'input') {
    return <InputLayerView layer={layer} handlers={inputHandlers} />;
  }

  return null;
};

// 判斷 URL 是否為影片格式
const isVideoUrl = (url: string): boolean => {
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowerUrl.includes(ext));
};

// 背景媒體元件（支援圖片和影片）
interface BackgroundMediaProps {
  url: string;
  backgroundSize?: 'cover' | 'contain' | 'fill';
  backgroundPosition?: string;
}

const BackgroundMedia: React.FC<BackgroundMediaProps> = ({
  url,
  backgroundSize = 'cover',
  backgroundPosition = 'top',
}) => {
  const isVideo = isVideoUrl(url);

  // 背景尺寸樣式
  const bgSizeStyle = {
    cover: 'cover',
    contain: 'contain',
    fill: '100% 100%',
  }[backgroundSize];

  // 影片背景
  if (isVideo) {
    // 影片 object-fit 對應
    const objectFitStyle = {
      cover: 'cover' as const,
      contain: 'contain' as const,
      fill: 'fill' as const,
    }[backgroundSize];

    // 影片 object-position 對應
    const objectPositionStyle = backgroundPosition || 'top';

    return (
      <video
        className="absolute inset-0 w-full h-full"
        src={url}
        autoPlay
        loop
        muted
        playsInline
        style={{
          objectFit: objectFitStyle,
          objectPosition: objectPositionStyle,
        }}
      />
    );
  }

  // 圖片背景
  return (
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: `url(${url})`,
        backgroundSize: bgSizeStyle,
        backgroundPosition: backgroundPosition,
        backgroundRepeat: 'no-repeat',
      }}
    />
  );
};

// ===== 背景音樂管理器（全域單例）=====
// 使用全域單例來管理背景音樂，確保頁面切換時可以在用戶手勢上下文中播放新音訊
class BackgroundAudioManager {
  private static instance: BackgroundAudioManager;
  private audio: HTMLAudioElement | null = null;
  private currentUrl: string = '';
  private isPlaying: boolean = false;
  private hasUserInteracted: boolean = false; // 追蹤用戶是否已互動過
  private pendingUrl: string = ''; // 等待播放的 URL

  private constructor() {
    // 建立全域 audio 元素
    if (typeof window !== 'undefined') {
      this.audio = new Audio();
      this.audio.loop = true;
      this.audio.preload = 'auto';

      // 監聽播放狀態
      this.audio.addEventListener('play', () => {
        this.isPlaying = true;
        this.hasUserInteracted = true; // 播放成功表示已有用戶互動
        console.log('背景音樂開始播放:', this.currentUrl);
      });
      this.audio.addEventListener('pause', () => {
        this.isPlaying = false;
      });
      this.audio.addEventListener('ended', () => {
        this.isPlaying = false;
      });

      // 全域監聯用戶互動，一旦有互動就嘗試播放等待中的音樂
      const handleFirstInteraction = () => {
        if (!this.hasUserInteracted && this.pendingUrl) {
          this.hasUserInteracted = true;
          this.play(this.pendingUrl);
        }
      };

      document.addEventListener('click', handleFirstInteraction, { capture: true });
      document.addEventListener('touchstart', handleFirstInteraction, { capture: true });
    }
  }

  static getInstance(): BackgroundAudioManager {
    if (!BackgroundAudioManager.instance) {
      BackgroundAudioManager.instance = new BackgroundAudioManager();
    }
    return BackgroundAudioManager.instance;
  }

  // 播放指定 URL 的音訊
  play(url: string): void {
    if (!this.audio) return;

    // 記錄待播放的 URL（用於用戶互動後重試）
    this.pendingUrl = url;

    // 如果 URL 相同且正在播放，不做任何事
    if (this.currentUrl === url && this.isPlaying) {
      return;
    }

    // 如果 URL 不同，切換音源
    if (this.currentUrl !== url) {
      this.audio.pause();
      this.audio.src = url;
      this.currentUrl = url;
    }

    // 嘗試播放（LINE 環境會成功，一般瀏覽器第一次可能失敗）
    this.audio.play()
      .then(() => {
        console.log('背景音樂播放成功');
        this.hasUserInteracted = true;
      })
      .catch(err => {
        // 播放失敗，保留 pendingUrl 等待用戶互動後重試
        console.warn('背景音樂自動播放被阻擋（等待用戶互動）:', err.message);
      });
  }

  // 強制播放（用於已確認有用戶互動的情境）
  forcePlay(url: string): void {
    if (!this.audio) return;

    this.pendingUrl = url;

    if (this.currentUrl !== url) {
      this.audio.pause();
      this.audio.src = url;
      this.currentUrl = url;
    }

    this.audio.play().catch(() => {});
  }

  // 停止播放
  stop(): void {
    if (!this.audio) return;
    this.audio.pause();
    this.audio.currentTime = 0;
    this.currentUrl = '';
    this.pendingUrl = '';
    this.isPlaying = false;
  }

  // 暫停播放
  pause(): void {
    if (!this.audio) return;
    this.audio.pause();
  }

  // 取得當前播放狀態
  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  // 取得當前播放的 URL
  getCurrentUrl(): string {
    return this.currentUrl;
  }

  // 檢查是否已有用戶互動
  getHasUserInteracted(): boolean {
    return this.hasUserInteracted;
  }
}

// 匯出全域音訊管理器實例
export const audioManager = BackgroundAudioManager.getInstance();

// 背景音樂元件
// 策略：
// 1. 頁面載入後立即嘗試自動播放（LINE 環境會成功）
// 2. 一般瀏覽器第一次會被阻擋，全域 AudioManager 會監聽用戶互動後重試
// 3. 頁面切換時，因為已經有過互動，可以直接播放新音樂
interface BackgroundAudioProps {
  url: string;
}

const BackgroundAudio: React.FC<BackgroundAudioProps> = ({ url }) => {
  // 頁面載入或 URL 改變時，立即嘗試播放
  useEffect(() => {
    // 立即嘗試播放（LINE 環境會成功，一般瀏覽器第一次會失敗但會記錄 pendingUrl）
    audioManager.play(url);
  }, [url]);

  // 元件卸載時不停止音樂（讓音樂在頁面切換時繼續播放）
  // 音樂只有在 FlexCarouselView 完全卸載或沒有 backaudio 時才停止

  return null; // 不需要渲染 audio 元素，使用全域管理器
};

// LayeredImageView 主元件
const LayeredImageView: React.FC<LayeredImageViewProps> = ({ data, className = '', cardsRenderer, buttonHandlers, inputHandlers, getFormData }) => {
  const { background, backgroundSize = 'cover', backgroundPosition = 'top', backaudio, layers } = data;

  // 根據 zIndex 排序圖層
  const sortedLayers = [...layers].sort((a, b) => (a.zIndex ?? 1) - (b.zIndex ?? 1));

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* 背景音樂 - 自動播放、循環 */}
      {backaudio && <BackgroundAudio url={backaudio} />}

      {/* 底圖 - 支援圖片和影片 */}
      <BackgroundMedia
        url={background}
        backgroundSize={backgroundSize}
        backgroundPosition={backgroundPosition}
      />

      {/* 圖層 */}
      {sortedLayers.map((layer, index) => (
        <LayerView key={layer.id || index} layer={layer} cardsRenderer={cardsRenderer} buttonHandlers={buttonHandlers} inputHandlers={inputHandlers} getFormData={getFormData} />
      ))}
    </div>
  );
};

export default LayeredImageView;
