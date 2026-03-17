// CardDraw 模組匯出
export * from './types';
export * from './templates';
export { default as FlexCarouselView, CardDrawArea, FullScreenBubble } from './FlexCarouselView';
export type { FlexCarouselViewProps, FormData, FormErrors } from './FlexCarouselView';
export { default as LayeredImageView, audioManager } from './LayeredImageView';
export type { ButtonActionHandlers, InputHandlers, PostActionResult } from './LayeredImageView';

// ===== 共用工具函數 =====

// 抽卡樣式類型
export type CardDrawStyleType = 'flex_01' | 'flex_02' | 'flex_03' | 'base';

/**
 * 根據 template 值決定抽卡樣式
 * - flex_01: 中心卡牌放大效果
 * - flex_02 / base: 規矩的抽卡樣式（預設）
 * - flex_03: 拖拉選牌模式
 *
 * @param template - API 回傳的 template 值（可能來自 drawResult.template 或 drawResult.cards?.template）
 * @returns CardDrawStyleType
 */
export const getCardDrawStyle = (template?: string): CardDrawStyleType => {
  if (template === 'flex_01') return 'flex_01';
  if (template === 'flex_03') return 'flex_03';
  if (template === 'base') return 'base';
  return 'flex_02'; // 預設樣式
};

/**
 * 從 DrawResult 中取得 template 值
 * 支援兩種來源：drawResult.template 或 drawResult.cards?.template
 *
 * @param drawResult - API 回傳的抽卡結果
 * @returns template 字串或 undefined
 */
export const getTemplateFromResult = (drawResult: { template?: string; cards?: { template?: string } }): string | undefined => {
  return drawResult.template || drawResult.cards?.template;
};

// 解說樣式類型
export type DetailStyleType = 'd_01' | 'd_02';

/**
 * 根據 template_details 值決定解說樣式
 * - d_01: 預設解說樣式（卡牌 + 文字說明）
 * - d_02: 未來擴充
 *
 * @param templateDetails - API 回傳的 template_details 值
 * @returns DetailStyleType
 */
export const getDetailStyle = (templateDetails?: string): DetailStyleType => {
  if (templateDetails === 'd_02') return 'd_02';
  return 'd_01'; // 預設樣式
};
