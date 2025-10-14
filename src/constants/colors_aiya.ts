// 色彩常數定義
export const COLORS = {
  // 主要品牌色彩
  primary: {
    50: '#f5f3ff',
    100: '#ede9fe', 
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#8b5cf6',
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
  },
  
  // AI 相關色彩（基於 #DECACD 和 #F7F3F4）
  ai: {
    primary: '#DECACD',      // 主色調
    light: '#F7F3F4',        // 淺色版本
    lighter: '#F7F3F4',      // 更淺版本
    dark: '#C4A8AB',         // 深色版本
    text: '#DECACD',         // 文字顏色
    bg: '#F7F3F4',           // 背景顏色
    bgHover: '#E6D5D8',      // 懸停背景
    bgLight: '#F7F3F4',      // 淺背景
  },
  
  // 漸變色彩
  gradients: {
    ai: 'from-pink-200 to-pink-300',
    aiReverse: 'from-pink-300 to-pink-200',
    primary: 'from-blue-500 to-indigo-600',
    primaryHover: 'from-blue-600 to-indigo-700',
  },
  
  // 功能色彩
  functions: {
    ai: {
      icon: 'text-pink-300',
      bg: 'bg-pink-50',
      bgHover: 'bg-pink-100',
      bgLight: 'bg-pink-25',
      text: 'text-pink-400',
      textDark: 'text-pink-500',
      textLight: 'text-pink-300',
      border: 'border-pink-100',
      button: 'bg-pink-300 hover:bg-pink-400',
    }
  }
} as const;

// Tailwind 類別對應
export const AI_COLORS = {
  // 圖標顏色
  icon: 'text-pink-300',
  iconLight: 'text-pink-200',
  
  // 背景顏色
  bg: 'bg-pink-50',
  bgLight: 'bg-pink-25',
  bgHover: 'bg-pink-100',
  bgDark: 'bg-pink-300',
  
  // 文字顏色
  text: 'text-pink-400',
  textLight: 'text-pink-300',
  textDark: 'text-pink-500',
  textWhite: 'text-white',
  
  // 邊框顏色
  border: 'border-pink-100',
  borderHover: 'border-pink-200',
  
  // 按鈕樣式
  button: 'bg-pink-300 hover:bg-pink-400 text-white',
  buttonOutline: 'border-pink-300 text-pink-400 hover:bg-pink-300 hover:text-white',
  
  // 狀態指示
  status: 'bg-pink-50 text-pink-500',
  statusCompleted: 'bg-pink-50 text-pink-500',
  
  // 漸變
  gradient: 'bg-gradient-to-r from-pink-200 to-pink-300',
  gradientReverse: 'bg-gradient-to-br from-pink-300 to-pink-200',
} as const;

// 使用範例和說明
export const COLOR_USAGE = {
  ai: {
    description: 'AI 相關功能使用',
    examples: [
      'AI 助手圖標',
      'AI 按鈕',
      'AI 狀態指示',
      'AI 相關卡片背景'
    ]
  }
} as const;
