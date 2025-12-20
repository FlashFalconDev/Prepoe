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
  
  // AI 相關色彩（橙色系）
  ai: {
    primary: '#ea580c',      // orange-600
    light: '#fed7aa',        // orange-200
    lighter: '#fff7ed',      // orange-50
    dark: '#c2410c',         // orange-700
    text: '#ea580c',         // orange-600
    bg: '#fed7aa',           // orange-200
    bgHover: '#fdba74',      // orange-300
    bgLight: '#fff7ed',      // orange-50
  },
  
  // 漸變色彩
  gradients: {
    ai: 'from-orange-500 to-red-500',
    aiReverse: 'from-red-400 to-orange-600',
    primary: 'from-blue-500 to-indigo-600',
    primaryHover: 'from-blue-600 to-indigo-700',
  },
  
  // 功能色彩
  functions: {
    ai: {
      icon: 'text-orange-600',
      bg: 'bg-orange-200',
      bgHover: 'bg-orange-300',
      bgLight: 'bg-orange-50',
      text: 'text-orange-600',
      textDark: 'text-orange-700',
      textLight: 'text-orange-600',
      border: 'border-orange-300',
      button: 'bg-orange-600 hover:bg-orange-700',
    }
  }
} as const;

// Tailwind 類別對應
export const AI_COLORS = {
  // 圖標顏色
  icon: 'text-orange-600',
  iconLight: 'text-orange-500',
  
  // 背景顏色
  bg: 'bg-orange-200',
  bgLight: 'bg-orange-50',
  bgHover: 'bg-orange-300',
  bgDark: 'bg-orange-600',
  
  // 文字顏色
  text: 'text-orange-600',
  textLight: 'text-orange-500',
  textDark: 'text-orange-700',
  textWhite: 'text-white',
  
  // 邊框顏色
  border: 'border-orange-300',
  borderHover: 'border-orange-400',
  
  // 按鈕樣式
  button: 'bg-orange-600 hover:bg-orange-700 text-white',
  buttonOutline: 'border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white',
  
  // 狀態指示
  status: 'bg-orange-200 text-orange-700',
  statusCompleted: 'bg-orange-200 text-orange-700',
  
  // 漸變
  gradient: 'bg-gradient-to-r from-orange-500 to-red-500',
  gradientReverse: 'bg-gradient-to-br from-red-400 to-orange-600',
} as const;

// 增強版顏色（用於 Audio 等進階功能頁面）
export const ENHANCED_COLORS = {
  // 圖標顏色
  icon: 'text-orange-600',
  iconLight: 'text-orange-500',

  // 背景顏色
  bg: 'bg-orange-200',
  bgLight: 'bg-orange-50',
  bgLighter: 'bg-orange-100',
  bgHover: 'bg-orange-300',
  bgDark: 'bg-orange-600',

  // 文字顏色
  text: 'text-orange-600',
  textLight: 'text-orange-500',
  textDark: 'text-orange-700',
  textWhite: 'text-white',

  // 邊框顏色
  border: 'border-orange-300',
  borderLight: 'border-orange-200',
  borderHover: 'border-orange-400',

  // 按鈕樣式
  button: 'bg-orange-600 hover:bg-orange-700 text-white',
  buttonOutline: 'border-2 border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white',
  buttonGradient: 'bg-gradient-to-r from-orange-500 to-red-500 text-white',

  // 狀態指示
  status: 'bg-orange-200 text-orange-700',
  statusCompleted: 'bg-orange-200 text-orange-700',
  statusSelected: 'bg-orange-100 text-orange-700',

  // 漸變
  gradient: 'bg-gradient-to-r from-orange-500 to-red-500',
  gradientLight: 'bg-gradient-to-br from-orange-100 to-red-100',
  gradientReverse: 'bg-gradient-to-br from-red-400 to-orange-600',

  // Hover 狀態
  hover: {
    border: 'hover:border-orange-400',
    bg: 'hover:bg-orange-50',
    shadow: 'hover:shadow-orange-200',
  },
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
