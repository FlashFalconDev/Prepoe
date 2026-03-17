/**
 * 前台顯示用術語（可經 .env VITE_COIN_LABEL 等覆寫）
 * 供各頁面統一使用，避免硬編碼「金幣」等字樣。
 */
export const COIN_LABEL = import.meta.env.VITE_COIN_LABEL ?? '金幣';

/** 會員卡 points / coins / tokens 的顯示標籤（用於 labelMap） */
export const memberLabelMap: Record<string, string> = {
  points: '積分',
  coins: COIN_LABEL,
  tokens: 'Tokens',
};
