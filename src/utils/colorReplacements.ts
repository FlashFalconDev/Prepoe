// 色彩替換工具
import { AI_COLORS } from '../constants/colors';

// 常見的紫色替換映射
export const PURPLE_REPLACEMENTS = {
  // 文字顏色
  'text-purple-600': AI_COLORS.text,
  'text-purple-500': AI_COLORS.textLight,
  'text-purple-700': AI_COLORS.textDark,
  
  // 背景顏色
  'bg-purple-100': AI_COLORS.bg,
  'bg-purple-50': AI_COLORS.bgLight,
  'bg-purple-200': AI_COLORS.bgHover,
  'bg-purple-600': AI_COLORS.bgDark,
  
  // 邊框顏色
  'border-purple-300': AI_COLORS.border,
  'border-purple-400': AI_COLORS.borderHover,
  'hover:border-purple-300': 'hover:border-ai-300',
  
  // 按鈕樣式
  'bg-purple-600 hover:bg-purple-700': AI_COLORS.button,
  'bg-purple-100 text-purple-700': AI_COLORS.status,
  
  // 漸變
  'from-purple-500 to-blue-500': 'from-purple-500 to-blue-500', // 保持原樣，因為這是漸變
  'from-blue-400 to-purple-600': 'from-blue-400 to-purple-600', // 保持原樣
} as const;

// 自動替換函數
export const replacePurpleColors = (className: string): string => {
  let result = className;
  
  Object.entries(PURPLE_REPLACEMENTS).forEach(([oldClass, newClass]) => {
    result = result.replace(new RegExp(oldClass, 'g'), newClass);
  });
  
  return result;
};

// 檢查是否包含紫色類別
export const hasPurpleColors = (className: string): boolean => {
  return /purple-\d+|ai-\d+/.test(className);
};

// 生成色彩使用報告
export const generateColorReport = (): string => {
  return `
色彩使用報告：
- 主要 AI 色彩：${AI_COLORS.text}
- 背景色彩：${AI_COLORS.bg}
- 按鈕樣式：${AI_COLORS.button}
- 狀態指示：${AI_COLORS.status}
`;
};
