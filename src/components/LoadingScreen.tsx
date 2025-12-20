// LoadingScreen - 通用載入畫面元件
import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

// 載入風格類型
export type LoadingStyle = 'tarot' | 'neutral' | 'minimal';

interface LoadingScreenProps {
  style?: LoadingStyle;
  title?: string;
  subtitle?: string;
  className?: string;
  backgroundColor?: string; // 自訂背景顏色（支援 hex 如 'ADAEC2' 或 '#ADAEC2'）
}

// 根據背景色計算文字顏色（深色背景用淺色文字，淺色背景用深色文字）
const getContrastTextColor = (bgColor: string): { primary: string; secondary: string } => {
  // 移除 # 前綴
  const hex = bgColor.replace('#', '');

  // 轉換為 RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // 計算亮度（YIQ 公式）
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  // 亮度 > 128 為淺色背景，使用深色文字
  if (brightness > 128) {
    return { primary: '#374151', secondary: '#6B7280' }; // gray-700, gray-500
  } else {
    return { primary: '#F3F4F6', secondary: '#9CA3AF' }; // gray-100, gray-400
  }
};

// 根據背景色計算 spinner 顏色
const getSpinnerColors = (bgColor: string): { ring: string; accent: string } => {
  const hex = bgColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  if (brightness > 128) {
    return { ring: 'rgba(0,0,0,0.15)', accent: '#475569' }; // 淺色背景用深色 spinner
  } else {
    return { ring: 'rgba(255,255,255,0.2)', accent: '#E5E7EB' }; // 深色背景用淺色 spinner
  }
};

// 塔羅風格載入畫面（原本的設計）
const TarotLoading: React.FC<{ title?: string; subtitle?: string; backgroundColor?: string }> = ({
  title = '正在洗牌中...',
  subtitle = '請靜心冥想您的問題',
  backgroundColor,
}) => {
  // 如果有自訂背景色，使用自適應文字顏色
  if (backgroundColor) {
    const bgHex = backgroundColor.startsWith('#') ? backgroundColor : `#${backgroundColor}`;
    const textColors = getContrastTextColor(bgHex);
    const spinnerColors = getSpinnerColors(bgHex);

    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: bgHex }}
      >
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div
              className="absolute inset-0 animate-spin rounded-full border-4 border-transparent"
              style={{ borderTopColor: spinnerColors.accent, borderRightColor: `${spinnerColors.accent}50` }}
            ></div>
            <div
              className="absolute inset-2 animate-spin rounded-full border-4 border-transparent"
              style={{
                borderBottomColor: spinnerColors.accent,
                borderLeftColor: `${spinnerColors.accent}50`,
                animationDirection: 'reverse',
                animationDuration: '1.5s'
              }}
            ></div>
            <Sparkles className="absolute inset-0 m-auto" style={{ color: spinnerColors.accent }} size={32} />
          </div>
          <p className="text-lg" style={{ color: textColors.primary }}>{title}</p>
          <p className="text-sm mt-2" style={{ color: textColors.secondary }}>{subtitle}</p>
        </div>
      </div>
    );
  }

  // 預設塔羅風格
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-indigo-900 to-purple-950 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-yellow-400 border-r-yellow-400/50"></div>
          <div
            className="absolute inset-2 animate-spin rounded-full border-4 border-transparent border-b-purple-400 border-l-purple-400/50"
            style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
          ></div>
          <Sparkles className="absolute inset-0 m-auto text-yellow-400" size={32} />
        </div>
        <p className="text-purple-200 text-lg">{title}</p>
        <p className="text-purple-400 text-sm mt-2">{subtitle}</p>
      </div>
    </div>
  );
};

// 中性風格載入畫面
const NeutralLoading: React.FC<{ title?: string; subtitle?: string; backgroundColor?: string }> = ({
  title = '載入中...',
  subtitle,
  backgroundColor,
}) => {
  // 如果有自訂背景色
  if (backgroundColor) {
    const bgHex = backgroundColor.startsWith('#') ? backgroundColor : `#${backgroundColor}`;
    const textColors = getContrastTextColor(bgHex);
    const spinnerColors = getSpinnerColors(bgHex);

    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: bgHex }}
      >
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div
              className="absolute inset-0 animate-spin rounded-full border-4"
              style={{ borderColor: spinnerColors.ring, borderTopColor: spinnerColors.accent }}
            ></div>
            <Loader2 className="absolute inset-0 m-auto animate-pulse" style={{ color: spinnerColors.accent }} size={28} />
          </div>
          <p className="text-lg font-medium" style={{ color: textColors.primary }}>{title}</p>
          {subtitle && <p className="text-sm mt-2" style={{ color: textColors.secondary }}>{subtitle}</p>}
        </div>
      </div>
    );
  }

  // 預設中性風格
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-slate-300 border-t-slate-600"></div>
          <Loader2 className="absolute inset-0 m-auto text-slate-500 animate-pulse" size={28} />
        </div>
        <p className="text-slate-700 text-lg font-medium">{title}</p>
        {subtitle && <p className="text-slate-500 text-sm mt-2">{subtitle}</p>}
      </div>
    </div>
  );
};

// 極簡風格載入畫面
const MinimalLoading: React.FC<{ title?: string; subtitle?: string; backgroundColor?: string }> = ({
  title = '載入中...',
  subtitle,
  backgroundColor,
}) => {
  // 如果有自訂背景色
  if (backgroundColor) {
    const bgHex = backgroundColor.startsWith('#') ? backgroundColor : `#${backgroundColor}`;
    const textColors = getContrastTextColor(bgHex);
    const spinnerColors = getSpinnerColors(bgHex);

    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: bgHex }}
      >
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4">
            <div
              className="w-full h-full animate-spin rounded-full border-3"
              style={{ borderColor: spinnerColors.ring, borderTopColor: spinnerColors.accent }}
            ></div>
          </div>
          <p className="text-base" style={{ color: textColors.primary }}>{title}</p>
          {subtitle && <p className="text-sm mt-1" style={{ color: textColors.secondary }}>{subtitle}</p>}
        </div>
      </div>
    );
  }

  // 預設極簡風格
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4">
          <div className="w-full h-full animate-spin rounded-full border-3 border-gray-200 border-t-gray-600"></div>
        </div>
        <p className="text-gray-700 text-base">{title}</p>
        {subtitle && <p className="text-gray-400 text-sm mt-1">{subtitle}</p>}
      </div>
    </div>
  );
};

// 主元件
const LoadingScreen: React.FC<LoadingScreenProps> = ({
  style = 'neutral',
  title,
  subtitle,
  className = '',
  backgroundColor,
}) => {
  const wrapperClass = className ? `${className}` : '';

  switch (style) {
    case 'tarot':
      return (
        <div className={wrapperClass}>
          <TarotLoading title={title} subtitle={subtitle} backgroundColor={backgroundColor} />
        </div>
      );
    case 'minimal':
      return (
        <div className={wrapperClass}>
          <MinimalLoading title={title} subtitle={subtitle} backgroundColor={backgroundColor} />
        </div>
      );
    case 'neutral':
    default:
      return (
        <div className={wrapperClass}>
          <NeutralLoading title={title} subtitle={subtitle} backgroundColor={backgroundColor} />
        </div>
      );
  }
};

export default LoadingScreen;
