// 預設卡牌資料匯出

export * from './tarotCards';
export * from './playingCards';
export * from './runeCards';
export * from './angelNumbers';
export * from './crystalOracleCards';

// 統一的卡牌類型
export type DeckCategory = 'tarot' | 'playing_cards' | 'rune' | 'angel_numbers' | 'crystal_oracle' | 'tarot_test' | 'custom';

// 類別資訊
import { TAROT_DECK_INFO, ALL_TAROT_CARDS } from './tarotCards';
import { PLAYING_DECK_INFO, ALL_PLAYING_CARDS } from './playingCards';
import { RUNE_DECK_INFO, ELDER_FUTHARK_RUNES } from './runeCards';
import { ANGEL_DECK_INFO, ANGEL_NUMBERS } from './angelNumbers';
import { CRYSTAL_ORACLE_DECK_INFO, CRYSTAL_ORACLE_CARDS } from './crystalOracleCards';

// 測試用塔羅牌 (只有 2 張)
export const TAROT_TEST_CARDS = ALL_TAROT_CARDS.slice(0, 2);

export const TAROT_TEST_DECK_INFO = {
  id: 'tarot_test',
  name: 'Tarot Test',
  nameCN: '塔羅測試版',
  description: '測試用，只有 2 張塔羅牌',
  totalCards: 2,
  categories: [
    { id: 'test', name: '測試', count: 2 },
  ],
};

// 自訂類別資訊
export const CUSTOM_DECK_INFO = {
  id: 'custom',
  name: 'Custom Deck',
  nameCN: '自建卡組',
  description: '透過 AI 對話引導，設計專屬的卡牌類別和內容',
  totalCards: 0,
  categories: [],
};

// 所有類別資訊
export const DECK_CATEGORIES: Record<DeckCategory, typeof TAROT_DECK_INFO | typeof CUSTOM_DECK_INFO> = {
  tarot: TAROT_DECK_INFO,
  playing_cards: PLAYING_DECK_INFO,
  rune: RUNE_DECK_INFO,
  angel_numbers: ANGEL_DECK_INFO,
  crystal_oracle: CRYSTAL_ORACLE_DECK_INFO,
  tarot_test: TAROT_TEST_DECK_INFO,
  custom: CUSTOM_DECK_INFO,
};

// 取得類別的卡牌資料
export const getDeckCards = (category: DeckCategory) => {
  switch (category) {
    case 'tarot':
      return ALL_TAROT_CARDS;
    case 'playing_cards':
      return ALL_PLAYING_CARDS;
    case 'rune':
      return ELDER_FUTHARK_RUNES;
    case 'angel_numbers':
      return ANGEL_NUMBERS;
    case 'crystal_oracle':
      return CRYSTAL_ORACLE_CARDS;
    case 'tarot_test':
      return TAROT_TEST_CARDS;
    default:
      return [];
  }
};

// 統一的卡牌模板介面
export interface CardTemplate {
  id: string;
  name: string;
  nameCN: string;
  defaultPrompt: string;
  // 卡牌分類資訊
  category?: string;  // 卡牌所屬分類 (如大阿爾克那、小阿爾克那)
  number?: number;    // 卡牌編號
  // 生成狀態
  generatedImageUrl?: string;
  generationStatus: 'pending' | 'generating' | 'completed' | 'failed';
  // 額外資訊
  keywords?: string[];
  meaning?: string;
}

// 將原始資料轉換為統一的卡牌模板格式
export const convertToCardTemplates = (category: DeckCategory): CardTemplate[] => {
  switch (category) {
    case 'tarot':
      return ALL_TAROT_CARDS.map(card => ({
        id: card.id,
        name: card.name,
        nameCN: card.nameCN,
        defaultPrompt: card.defaultPrompt,
        category: card.category,
        number: card.number,
        generationStatus: 'pending' as const,
        keywords: card.keywords,
      }));
    case 'playing_cards':
      return ALL_PLAYING_CARDS.map(card => ({
        id: card.id,
        name: card.name,
        nameCN: card.nameCN,
        defaultPrompt: card.defaultPrompt,
        generationStatus: 'pending' as const,
        keywords: card.keywords,
      }));
    case 'rune':
      return ELDER_FUTHARK_RUNES.map(card => ({
        id: card.id,
        name: card.name,
        nameCN: card.nameCN,
        defaultPrompt: card.defaultPrompt,
        generationStatus: 'pending' as const,
        keywords: card.keywords,
        meaning: card.meaningCN,
      }));
    case 'angel_numbers':
      return ANGEL_NUMBERS.map(card => ({
        id: card.id,
        name: card.number,
        nameCN: card.title,
        defaultPrompt: card.defaultPrompt,
        generationStatus: 'pending' as const,
        keywords: card.keywords,
        meaning: card.interpretations?.[0]?.content,
      }));
    case 'crystal_oracle':
      return CRYSTAL_ORACLE_CARDS.map(card => ({
        id: card.id,
        name: card.name,
        nameCN: card.nameCN,
        defaultPrompt: card.defaultPrompt,
        generationStatus: 'pending' as const,
        keywords: card.keywords,
        meaning: card.interpretations?.[0]?.content,
      }));
    case 'tarot_test':
      return TAROT_TEST_CARDS.map(card => ({
        id: card.id,
        name: card.name,
        nameCN: card.nameCN,
        defaultPrompt: card.defaultPrompt,
        category: card.category,
        number: card.number,
        generationStatus: 'pending' as const,
        keywords: card.keywords,
      }));
    default:
      return [];
  }
};
