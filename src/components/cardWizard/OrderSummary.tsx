import React, { useState } from 'react';
import { FileText, Sparkles, Clock, Coins, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { AI_COLORS } from '../../constants/colors';
import { DeckCategory, DECK_CATEGORIES, CardTemplate } from '../../data/cardPresets';

// 從主頁面引入類型
interface DeckStyle {
  styleTemplate: string;  // 藝術風格模板
  colorPalette: string[];  // 色票陣列
  loraStyle: string;  // 材質風格 LORA
  customPromptSuffix: string;
}

interface OrderSummaryProps {
  deckName: string;
  deckDescription: string;
  category: DeckCategory | null;
  style: DeckStyle;
  cards: CardTemplate[];
  isSubmitting: boolean;
  onSubmit: () => void;
}

// 風格名稱對應
const STYLE_NAMES: Record<string, Record<string, string>> = {
  styleTemplate: {
    'S01': '黑暗超現實',
    'S02': '奇幻水彩',
    'S03': '賽博龐克',
    'S04': '古典油畫',
    'S05': '日式浮世繪',
    'S06': '宇宙星雲',
  },
  loraStyle: {
    '': '不使用',
    'E01': '液體流動紋理',
    'E02': '彩色散景光暈',
    'E03': '模糊金色調',
    'E04': '金色bokeh最密集',
    'E05': '史詩細節豐富',
    'E06': '深棕藍綠色調',
    'E07': '科幻未來感',
    'E08': '印象派油畫',
    'E09': '陽光金色光線',
    'E10': '幾何極簡主義',
    'E11': '宇宙星空',
    'E12': '火燒雲夕陽',
  },
};

const OrderSummary: React.FC<OrderSummaryProps> = ({
  deckName,
  deckDescription,
  category,
  style,
  cards,
  isSubmitting,
  onSubmit,
}) => {
  const [showAllCards, setShowAllCards] = useState(false);
  const categoryInfo = category ? DECK_CATEGORIES[category] : null;

  // 預估資訊
  const estimatedTime = Math.ceil(cards.length * 0.5); // 假設每張 0.5 分鐘
  const estimatedTokens = cards.length * 100; // 假設每張 100 tokens

  // 顯示的卡牌（預設顯示前 10 張）
  const displayedCards = showAllCards ? cards : cards.slice(0, 10);
  const hasMoreCards = cards.length > 10;

  return (
    <div className="space-y-6">
      {/* 標題 */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">確認需求單</h2>
        <p className="text-gray-500">
          請確認以下資訊，提交後系統將在背景生成卡牌圖片
        </p>
      </div>

      {/* 摘要卡片 */}
      <div className={`p-5 rounded-2xl ${AI_COLORS.bgLight} border ${AI_COLORS.border}`}>
        <div className="flex items-start gap-4">
          <div className={`p-3 ${AI_COLORS.bg} rounded-xl`}>
            <FileText size={24} className={AI_COLORS.text} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{deckName}</h3>
            {deckDescription && (
              <p className="text-sm text-gray-600 mt-1">{deckDescription}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-3">
              <span className={`px-3 py-1 ${AI_COLORS.bg} ${AI_COLORS.text} rounded-full text-xs font-medium`}>
                {categoryInfo?.nameCN || '未知類別'}
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                {cards.length} 張卡牌
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 風格設定 */}
      <div className="p-5 bg-white rounded-2xl border border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-4">風格設定</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-gray-500 mb-1">藝術風格</div>
            <div className="font-medium text-gray-900">
              {STYLE_NAMES.styleTemplate[style.styleTemplate] || style.styleTemplate}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">色調</div>
            <div className="flex items-center gap-1.5">
              {style.colorPalette.map((color, i) => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-full border border-gray-200"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">材質風格</div>
            <div className="font-medium text-gray-900">
              {STYLE_NAMES.loraStyle[style.loraStyle] || '不使用'}
            </div>
          </div>
        </div>
        {style.customPromptSuffix && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="text-xs text-gray-500 mb-1">額外風格描述</div>
            <div className="text-sm text-gray-700">{style.customPromptSuffix}</div>
          </div>
        )}
      </div>

      {/* 預估資訊 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <Clock size={18} />
            <span className="text-sm font-medium">預估時間</span>
          </div>
          <div className="text-2xl font-bold text-blue-700">
            ~{estimatedTime} 分鐘
          </div>
          <div className="text-xs text-blue-500 mt-1">
            背景生成，不影響其他操作
          </div>
        </div>
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <Coins size={18} />
            <span className="text-sm font-medium">預估消耗</span>
          </div>
          <div className="text-2xl font-bold text-amber-700">
            ~{estimatedTokens.toLocaleString()}
          </div>
          <div className="text-xs text-amber-500 mt-1">
            AI 圖片生成 tokens
          </div>
        </div>
      </div>

      {/* 卡牌清單 */}
      <div className="p-5 bg-white rounded-2xl border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-900">卡牌清單</h4>
          <span className="text-sm text-gray-500">{cards.length} 張</span>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {displayedCards.map((card, index) => (
            <div
              key={card.id}
              className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
            >
              <span className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-500">
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {card.nameCN}
                </div>
                <div className="text-xs text-gray-400 truncate">
                  {card.name}
                </div>
              </div>
            </div>
          ))}
        </div>

        {hasMoreCards && (
          <button
            onClick={() => setShowAllCards(!showAllCards)}
            className="w-full mt-3 py-2 text-sm text-gray-600 hover:text-gray-900 flex items-center justify-center gap-1 transition-colors"
          >
            {showAllCards ? (
              <>
                收起 <ChevronUp size={16} />
              </>
            ) : (
              <>
                顯示全部 {cards.length} 張 <ChevronDown size={16} />
              </>
            )}
          </button>
        )}
      </div>

      {/* 注意事項 */}
      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
        <div className="flex items-start gap-3">
          <AlertCircle size={18} className="text-gray-400 mt-0.5" />
          <div className="text-sm text-gray-600">
            <p className="font-medium text-gray-700 mb-1">提交前請注意</p>
            <ul className="list-disc list-inside space-y-1 text-gray-500">
              <li>提交後無法取消，請確認設定無誤</li>
              <li>生成過程中您可以進行其他操作</li>
              <li>完成後會在「卡組管理」中顯示</li>
              <li>生成失敗的卡牌可以單獨重試</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 提交按鈕區域 */}
      <div className="pt-4">
        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className={`
            w-full py-4 ${AI_COLORS.button} rounded-xl
            flex items-center justify-center gap-2 text-lg font-medium
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all hover:shadow-lg
          `}
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              提交中...
            </>
          ) : (
            <>
              <Sparkles size={22} />
              確認提交需求單
            </>
          )}
        </button>
        <p className="text-center text-xs text-gray-400 mt-3">
          點擊提交後，系統將開始在背景生成 {cards.length} 張卡牌圖片
        </p>
      </div>
    </div>
  );
};

export default OrderSummary;
