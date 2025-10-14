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

// 擴增模式專用顏色（紫粉漸變系）
export const ENHANCED_COLORS = {
  // 圖標顏色
  icon: 'text-purple-600',
  iconLight: 'text-purple-500',

  // 背景顏色
  bg: 'bg-purple-200',
  bgLight: 'bg-purple-50',
  bgLighter: 'bg-purple-100',
  bgHover: 'bg-purple-300',
  bgDark: 'bg-purple-600',

  // 文字顏色
  text: 'text-purple-600',
  textLight: 'text-purple-500',
  textDark: 'text-purple-700',
  textBold: 'text-purple-800',
  textWhite: 'text-white',

  // 邊框顏色
  border: 'border-purple-500',
  borderLight: 'border-purple-300',
  borderLighter: 'border-purple-200',
  borderHover: 'border-purple-400',

  // 按鈕樣式
  button: 'bg-purple-600 hover:bg-purple-700 text-white',
  buttonGradient: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white',
  buttonOutline: 'border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white',

  // 漸變背景
  gradient: 'bg-gradient-to-r from-purple-500 to-pink-500',
  gradientLight: 'bg-gradient-to-br from-purple-100 to-pink-100',
  gradientTo: 'from-purple-50 to-pink-50',

  // 狀態指示
  status: 'bg-purple-200 text-purple-700',
  statusSelected: 'bg-purple-500 text-white',
  statusBadge: 'bg-green-100 text-green-700',

  // 懸停效果
  hover: {
    bg: 'hover:bg-purple-50',
    border: 'hover:border-purple-500',
    shadow: 'hover:shadow-lg',
  }
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
