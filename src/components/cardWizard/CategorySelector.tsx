import React, { useState, useEffect, useRef } from 'react';
import { Sun, Gem, Flame, Flower2, Plus, Check, FlaskConical, GalleryHorizontalEnd, X, Loader2, ChevronLeft, ChevronRight, Sparkles, Diamond } from 'lucide-react';
import { AI_COLORS } from '../../constants/colors';
import { DeckCategory, DECK_CATEGORIES } from '../../data/cardPresets';
import { api, API_ENDPOINTS } from '../../config/api';

// 檢查是否為開發環境
const isDev = import.meta.env.DEV || window.location.hostname.startsWith('react');

interface CategorySelectorProps {
  selectedCategory: DeckCategory | null;
  onSelect: (category: DeckCategory) => void;
}

// 類別圖標對應 - 使用與卡牌相關的圖標
const CATEGORY_ICONS: Record<DeckCategory, React.ReactNode> = {
  tarot: <Sun size={32} />,           // 塔羅牌 - 太陽象徵神秘與啟示
  playing_cards: <Gem size={32} />,   // 撲克牌 - 鑽石代表四種花色之一
  rune: <Flame size={32} />,          // 盧恩符文 - 火焰象徵北歐神話力量
  angel_numbers: <Flower2 size={32} />, // 天使數字 - 花朵象徵天使的祝福
  crystal_oracle: <Diamond size={32} />, // 水晶神諭 - 鑽石象徵水晶能量
  tarot_test: <FlaskConical size={32} />, // 測試版 - 燒杯代表實驗
  custom: <Plus size={32} />,
};

// 類別顏色對應
const CATEGORY_COLORS: Record<DeckCategory, { bg: string; border: string; text: string; iconBg: string }> = {
  tarot: {
    bg: 'bg-purple-50',
    border: 'border-purple-200 hover:border-purple-400',
    text: 'text-purple-600',
    iconBg: 'bg-purple-100',
  },
  playing_cards: {
    bg: 'bg-red-50',
    border: 'border-red-200 hover:border-red-400',
    text: 'text-red-600',
    iconBg: 'bg-red-100',
  },
  rune: {
    bg: 'bg-slate-50',
    border: 'border-slate-200 hover:border-slate-400',
    text: 'text-slate-600',
    iconBg: 'bg-slate-100',
  },
  angel_numbers: {
    bg: 'bg-amber-50',
    border: 'border-amber-200 hover:border-amber-400',
    text: 'text-amber-600',
    iconBg: 'bg-amber-100',
  },
  crystal_oracle: {
    bg: 'bg-teal-50',
    border: 'border-teal-200 hover:border-teal-400',
    text: 'text-teal-600',
    iconBg: 'bg-teal-100',
  },
  tarot_test: {
    bg: 'bg-green-50',
    border: 'border-green-200 hover:border-green-400',
    text: 'text-green-600',
    iconBg: 'bg-green-100',
  },
  custom: {
    bg: 'bg-gray-50',
    border: 'border-gray-200 hover:border-gray-400 border-dashed',
    text: 'text-gray-600',
    iconBg: 'bg-gray-100',
  },
};

// 樣本圖片介面
interface SampleImage {
  deck_name: string;
  style: {
    style_template?: string;
    lora_style?: string;
    color_palette?: string[];
    custom_prompt_suffix?: string;
  };
  image_url: string;
}

// 風格模板代號對照表
const STYLE_TEMPLATE_NAMES: Record<string, string> = {
  'S01': '黑暗超現實',
  'S02': '奇幻水彩',
  'S03': '賽博龐克',
  'S04': '古典油畫',
  'S05': '日式浮世繪',
  'S06': '宇宙星雲',
  'S07': '中華傳統',
  'S08': '古希臘',
  'S09': '宮崎駿',
  'S10': '剪紙藝術',
  'S11': '黏土玩偶',
  'S12': '日本動漫',
};

// 材質風格代號對照表
const LORA_STYLE_NAMES: Record<string, string> = {
  '': '無',
  'E01': '液體流動紋理',
  'E02': '彩色散景光暈',
  'E03': '模糊金色調',
  'E04': '金色 bokeh',
  'E05': '史詩細節豐富',
  'E06': '深棕藍綠色調',
  'E07': '科幻未來感',
  'E08': '印象派油畫',
  'E09': '陽光金色光線',
  'E10': '幾何極簡主義',
  'E11': '宇宙星空',
  'E12': '火燒雲夕陽',
};

// 取得風格模板名稱
const getStyleTemplateName = (id?: string): string => {
  if (!id) return '';
  return STYLE_TEMPLATE_NAMES[id] || id;
};

// 取得材質風格名稱
const getLoraStyleName = (id?: string): string => {
  if (!id) return '';
  return LORA_STYLE_NAMES[id] || id;
};

// 參考範本彈窗元件
interface SampleGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SampleGalleryModal: React.FC<SampleGalleryModalProps> = ({ isOpen, onClose }) => {
  const [samples, setSamples] = useState<SampleImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedImage, setSelectedImage] = useState<SampleImage | null>(null);
  const hasFetched = useRef(false);

  const loadSamples = async (pageNum: number) => {
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.CARDHACK_ORDER_SAMPLES, {
        params: { page: pageNum }
      });
      if (response.data.success) {
        setSamples(response.data.data.samples || []);
        setTotalPages(response.data.data.total_pages || 1);
        setPage(response.data.data.current_page || 1);
      }
    } catch (error) {
      console.error('載入範本失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !hasFetched.current) {
      hasFetched.current = true;
      loadSamples(1);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      hasFetched.current = false;
      setSelectedImage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-xl font-bold text-gray-900">參考範本</h3>
            <p className="text-sm text-gray-500">瀏覽其他用戶創建的卡牌作品</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className={`${AI_COLORS.text} animate-spin`} />
              <span className="ml-3 text-gray-500">載入中...</span>
            </div>
          ) : samples.length === 0 ? (
            <div className="text-center py-12">
              <GalleryHorizontalEnd size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">目前沒有範本可以顯示</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {samples.map((sample, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(sample)}
                  className="group relative aspect-[2/3] rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                >
                  <img
                    src={sample.image_url}
                    alt={sample.deck_name}
                    className="w-full h-full object-cover"
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-white text-sm font-medium truncate">{sample.deck_name}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-center gap-4 flex-shrink-0">
            <button
              onClick={() => loadSamples(page - 1)}
              disabled={page <= 1 || loading}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={20} className="text-gray-600" />
            </button>
            <span className="text-sm text-gray-600">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => loadSamples(page + 1)}
              disabled={page >= totalPages || loading}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={20} className="text-gray-600" />
            </button>
          </div>
        )}
      </div>

      {/* 圖片放大預覽 */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
            <img
              src={selectedImage.image_url}
              alt={selectedImage.deck_name}
              className="w-full rounded-xl shadow-2xl"
            />
            <div className="mt-4 text-center">
              <h4 className="text-white text-lg font-semibold">{selectedImage.deck_name}</h4>
              {/* 風格資訊 */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                {selectedImage.style?.style_template && (
                  <span className="px-3 py-1 bg-white/20 rounded-full text-white/90 text-sm">
                    {getStyleTemplateName(selectedImage.style.style_template)}
                  </span>
                )}
                {selectedImage.style?.lora_style && (
                  <span className="px-3 py-1 bg-white/20 rounded-full text-white/90 text-sm">
                    {getLoraStyleName(selectedImage.style.lora_style)}
                  </span>
                )}
              </div>
              {/* 色票 */}
              {selectedImage.style?.color_palette && selectedImage.style.color_palette.length > 0 && (
                <div className="flex items-center justify-center gap-1.5 mt-3">
                  {selectedImage.style.color_palette.map((color, idx) => (
                    <div
                      key={idx}
                      className="w-6 h-6 rounded-full border-2 border-white/30"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategory,
  onSelect,
}) => {
  const [showSampleModal, setShowSampleModal] = useState(false);
  // 測試版只在開發環境顯示
  const presetCategories: DeckCategory[] = isDev
    ? ['tarot', 'playing_cards', 'rune', 'angel_numbers', 'crystal_oracle', 'tarot_test']
    : ['tarot', 'playing_cards', 'rune', 'angel_numbers', 'crystal_oracle'];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">選擇卡牌類別</h2>
          <p className="text-gray-500">
            選擇預設類別快速開始，或自建專屬卡組
          </p>
        </div>
        {/* 參考範本按鈕 */}
        <button
          onClick={() => setShowSampleModal(true)}
          className={`flex items-center gap-2 px-4 py-2 ${AI_COLORS.bg} ${AI_COLORS.text} rounded-xl hover:${AI_COLORS.bgHover} transition-colors text-sm font-medium`}
          title="查看參考範本"
        >
          <GalleryHorizontalEnd size={18} />
          <span className="hidden sm:inline">參考範本</span>
        </button>
      </div>

      {/* 參考範本彈窗 */}
      <SampleGalleryModal
        isOpen={showSampleModal}
        onClose={() => setShowSampleModal(false)}
      />

      {/* 預設類別 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {presetCategories.map((category) => {
          const info = DECK_CATEGORIES[category];
          const colors = CATEGORY_COLORS[category];
          const isSelected = selectedCategory === category;

          return (
            <button
              key={category}
              onClick={() => onSelect(category)}
              className={`
                relative p-5 rounded-2xl border-2 text-left transition-all duration-200
                ${colors.bg} ${colors.border}
                ${isSelected ? 'ring-2 ring-orange-400 border-orange-400' : ''}
              `}
            >
              {/* 選中標記 */}
              {isSelected && (
                <div className={`absolute top-3 right-3 w-6 h-6 ${AI_COLORS.bgDark} rounded-full flex items-center justify-center`}>
                  <Check size={14} className="text-white" />
                </div>
              )}

              {/* 圖標 */}
              <div className={`w-14 h-14 ${colors.iconBg} rounded-xl flex items-center justify-center mb-4 ${colors.text}`}>
                {CATEGORY_ICONS[category]}
              </div>

              {/* 資訊 */}
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {info.nameCN}
              </h3>
              <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                {info.description}
              </p>

              {/* 數量標籤 */}
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 ${colors.iconBg} ${colors.text} rounded-full text-xs font-medium`}>
                  {info.totalCards} 張
                </span>
                {info.categories.slice(0, 3).map((cat: { id: string; name: string; count: number }) => (
                  <span key={cat.id} className="text-xs text-gray-400">
                    {cat.name}
                  </span>
                ))}
                {info.categories.length > 3 && (
                  <span className="text-xs text-gray-400">...</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* 自建類別 */}
      <div className="border-t border-gray-100 pt-6">
        <button
          onClick={() => onSelect('custom')}
          className={`
            w-full p-5 rounded-2xl border-2 text-left transition-all duration-200
            ${CATEGORY_COLORS.custom.bg} ${CATEGORY_COLORS.custom.border}
            ${selectedCategory === 'custom' ? 'ring-2 ring-orange-400 border-orange-400' : ''}
          `}
        >
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 ${CATEGORY_COLORS.custom.iconBg} rounded-xl flex items-center justify-center ${CATEGORY_COLORS.custom.text}`}>
              {CATEGORY_ICONS.custom}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                自建卡組
              </h3>
              <p className="text-sm text-gray-500">
                透過 AI 對話引導，設計專屬的卡牌類別和內容
              </p>
            </div>
            <div className="ml-auto">
              <span className={`px-3 py-1 ${AI_COLORS.bg} ${AI_COLORS.text} rounded-full text-xs font-medium`}>
                即將推出
              </span>
            </div>
          </div>
        </button>
      </div>

      {/* 選擇提示 */}
      {selectedCategory && selectedCategory !== 'custom' && (
        <div className={`p-4 ${AI_COLORS.bgLight} rounded-xl border ${AI_COLORS.border}`}>
          <div className="flex items-center gap-2">
            <Sparkles size={18} className={AI_COLORS.text} />
            <span className="text-sm text-gray-700">
              已選擇「{DECK_CATEGORIES[selectedCategory].nameCN}」，
              共 {DECK_CATEGORIES[selectedCategory].totalCards} 張卡牌。
              點擊「下一步」設計風格。
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategorySelector;
