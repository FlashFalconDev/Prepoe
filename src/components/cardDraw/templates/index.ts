// CardDraw 模板索引
import BaseTemplate from './BaseTemplate';
import Flex01Template from './Flex01Template';

// 模板映射表
export const CARD_DRAW_TEMPLATES = {
  base: BaseTemplate,
  flex_01: Flex01Template,
  // 未來可新增更多模板：
  // modern: ModernTemplate,
  // classic: ClassicTemplate,
} as const;

// 模板名稱類型
export type CardDrawTemplateName = keyof typeof CARD_DRAW_TEMPLATES;

// 預設模板
export const DEFAULT_TEMPLATE: CardDrawTemplateName = 'base';

// 取得模板元件
export const getTemplate = (templateName?: string) => {
  if (templateName && templateName in CARD_DRAW_TEMPLATES) {
    return CARD_DRAW_TEMPLATES[templateName as CardDrawTemplateName];
  }
  return CARD_DRAW_TEMPLATES[DEFAULT_TEMPLATE];
};

export { BaseTemplate, Flex01Template };
