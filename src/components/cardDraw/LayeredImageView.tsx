// LayeredImageView - 層疊圖片呈現元件
import React, { useRef, useState } from 'react';
import { LayeredImage, Layer, ImageLayer, CardsLayer, TextLayer, ButtonLayer, AudioLayer, LayerAnchor, TextSize, ButtonAction } from './types';
import { Play, Pause, Volume2 } from 'lucide-react';

// 按鈕動作處理器
export interface ButtonActionHandlers {
  onNext?: () => void;
  onPrev?: () => void;
  onGoto?: (index: number) => void;
  onUri?: (uri: string) => void;
  onPostback?: (data: string) => void;
  onNavigate?: (path: string) => void; // 站內導航（使用 React Router）
}

interface LayeredImageViewProps {
  data: LayeredImage;
  className?: string;
  // Cards 圖層渲染所需的 props
  cardsRenderer?: (layer: CardsLayer) => React.ReactNode;
  // Button 圖層動作處理器
  buttonHandlers?: ButtonActionHandlers;
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
    rotation = 0,
    opacity = 1,
    zIndex = 1,
  } = layer;

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
    // 預設陰影
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

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        width: size?.width ? `${size.width}%` : 'auto',
        height: size?.height ? `${size.height}%` : 'auto',
        transform: fullTransform,
        opacity,
        zIndex,
        overflow: size?.height ? 'hidden' : undefined,
        background: style.background,
        borderRadius: style.borderRadius ? `${style.borderRadius}px` : undefined,
        padding: getPadding(),
        ...getVerticalAlignStyle(),
      }}
    >
      <div
        className="whitespace-pre-wrap"
        style={{
          fontSize,
          fontWeight: fontWeightMap[style.weight || 'normal'],
          color: style.color || '#ffffff',
          textAlign: style.align || 'left',
          lineHeight: style.lineHeight || 1.4,
          letterSpacing: style.letterSpacing ? `${style.letterSpacing}px` : undefined,
          textShadow: getTextShadow(),
          wordBreak: 'break-word',
          ...getTextStroke(),
        }}
      >
        {text}
      </div>
    </div>
  );
};

// 按鈕圖層元件
interface ButtonLayerViewProps {
  layer: ButtonLayer;
  handlers?: ButtonActionHandlers;
}

const ButtonLayerView: React.FC<ButtonLayerViewProps> = ({ layer, handlers }) => {
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

  // 處理點擊
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;

    switch (action.type) {
      case 'uri':
        if (handlers?.onUri) {
          handlers.onUri(action.uri);
        } else {
          // openInNewTab 預設為 true（新視窗），設為 false 則在原視窗開啟
          const openInNewTab = action.openInNewTab !== false;
          if (openInNewTab) {
            window.open(action.uri, '_blank', 'noopener,noreferrer');
          } else {
            // 判斷是否為站內路徑（以 / 開頭但不是 //）
            const isInternalPath = action.uri.startsWith('/') && !action.uri.startsWith('//');
            if (isInternalPath && handlers?.onNavigate) {
              // 使用 React Router 進行 SPA 內部跳轉，避免白畫面
              handlers.onNavigate(action.uri);
            } else {
              // 外部網址使用 location.href
              window.location.href = action.uri;
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
        handlers?.onGoto?.(action.index);
        break;
      case 'postback':
        handlers?.onPostback?.(action.data);
        break;
    }
  };

  // 計算 transform
  const anchorTransform = getAnchorTransform(position.anchor);

  // 計算尺寸：字串直接用（如 "40px"），數字當百分比
  const getSizeStyle = (value: number | string | undefined) => {
    if (!value) return 'auto';
    if (typeof value === 'string') return value; // "40px" 等直接用
    return `${value}%`; // 數字當百分比
  };

  return (
    <button
      className="absolute flex items-center justify-center gap-2"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        width: getSizeStyle(size?.width),
        height: getSizeStyle(size?.height),
        transform: anchorTransform,
        opacity,
        zIndex,
        ...getButtonStyle(),
      }}
      onClick={handleClick}
      disabled={disabled}
    >
      {style.icon && style.iconPosition !== 'right' && (
        <img src={style.icon} alt="" className="w-5 h-5" />
      )}
      {label}
      {style.icon && style.iconPosition === 'right' && (
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
        left: `${position.x}%`,
        top: `${position.y}%`,
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
        left: `${position.x}%`,
        top: `${position.y}%`,
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
}

const LayerView: React.FC<LayerViewProps> = ({ layer, cardsRenderer, buttonHandlers }) => {
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
    return <ButtonLayerView layer={layer} handlers={buttonHandlers} />;
  }

  // Audio 圖層
  if (layer.type === 'audio') {
    return <AudioLayerView layer={layer} />;
  }

  return null;
};

// LayeredImageView 主元件
const LayeredImageView: React.FC<LayeredImageViewProps> = ({ data, className = '', cardsRenderer, buttonHandlers }) => {
  const { background, backgroundSize = 'cover', backgroundPosition = 'top', layers } = data;

  // 根據 zIndex 排序圖層
  const sortedLayers = [...layers].sort((a, b) => (a.zIndex ?? 1) - (b.zIndex ?? 1));

  // 背景尺寸樣式 - 使用 CSS background 確保正確填滿
  const bgSizeStyle = {
    cover: 'cover',      // 適配窄邊，填滿容器（可能裁切）
    contain: 'contain',  // 適配寬邊，完整顯示（可能留白）
    fill: '100% 100%',   // 拉伸填滿
  }[backgroundSize];

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* 底圖 - 使用 background-image 確保適配窄邊填滿 */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${background})`,
          backgroundSize: bgSizeStyle,
          backgroundPosition: backgroundPosition, // 預設對齊上邊
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* 圖層 */}
      {sortedLayers.map((layer, index) => (
        <LayerView key={layer.id || index} layer={layer} cardsRenderer={cardsRenderer} buttonHandlers={buttonHandlers} />
      ))}
    </div>
  );
};

export default LayeredImageView;
