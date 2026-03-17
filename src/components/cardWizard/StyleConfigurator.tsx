import React, { useState } from 'react';
import { Palette, Brush, Type, Plus, Layers, X, Check, ChevronRight } from 'lucide-react';
import { AI_COLORS } from '../../constants/colors';
import { DeckCategory, DECK_CATEGORIES } from '../../data/cardPresets';

// 從主頁面引入類型
type LoraStyleId = 'E01' | 'E02' | 'E03' | 'E04' | 'E05' | 'E06' | 'E07' | 'E08' | 'E09' | 'E10' | 'E11' | 'E12' | '';
type StyleTemplateId = 'S01' | 'S02' | 'S03' | 'S04' | 'S05' | 'S06' | 'S07' | 'S08' | 'S09' | 'S10' | 'S11' | 'S12';

interface DeckStyle {
  styleTemplate: StyleTemplateId;  // 藝術風格模板
  colorPalette: string[];  // 色票陣列
  loraStyle: LoraStyleId;  // 材質風格 LORA
  customPromptSuffix: string;
}

interface StyleConfiguratorProps {
  style: DeckStyle;
  deckName: string;
  deckDescription: string;
  category: DeckCategory | null;
  onChange: (updates: { style?: Partial<DeckStyle>; deckName?: string; deckDescription?: string }) => void;
}

// 藝術風格模板選項
const STYLE_TEMPLATES: { id: StyleTemplateId; name: string; description: string }[] = [
  { id: 'S01', name: '黑暗超現實', description: '🌑 神秘黑暗、電影質感、煙霧粒子效果' },
  { id: 'S02', name: '奇幻水彩', description: '🎨 柔和水彩、夢幻暈染、藝術手繪感' },
  { id: 'S03', name: '賽博龐克', description: '🌃 霓虹光影、科技未來、都市夜景' },
  { id: 'S04', name: '古典油畫', description: '🖼️ 文藝復興、巴洛克光影、博物館級' },
  { id: 'S05', name: '日式浮世繪', description: '🌸 東方美學、線條藝術、和風禪意' },
  { id: 'S06', name: '宇宙星雲', description: '🌌 深空星系、星雲光芒、宇宙奧秘' },
  { id: 'S07', name: '中華傳統', description: '🏮 水墨丹青、東方神韻、華夏古風' },
  { id: 'S08', name: '古希臘', description: '🏛️ 大理石雕塑、神話史詩、奧林匹斯榮光' },
  { id: 'S09', name: '宮崎駿', description: '🍃 吉卜力工作室、溫暖治癒、奇幻自然' },
  { id: 'S10', name: '剪紙藝術', description: '✂️ 傳統剪紙、精細鏤空、吉祥圖案' },
  { id: 'S11', name: '黏土玩偶', description: '🎭 定格動畫、手作質感、童趣立體' },
  { id: 'S12', name: '日本動漫', description: '⚡ 熱血動畫、華麗特效、經典二次元' },
];

// 預設色調選項
const PRESET_PALETTES = [
  { id: 'mystical', name: '神秘紫金', colors: ['#9333ea', '#eab308', '#1e1b4b'] },
  { id: 'warm', name: '暖色調', colors: ['#ef4444', '#f97316', '#facc15'] },
  { id: 'cool', name: '冷色調', colors: ['#3b82f6', '#8b5cf6', '#06b6d4'] },
  { id: 'earth', name: '大地色', colors: ['#78716c', '#a3e635', '#854d0e'] },
  { id: 'monochrome', name: '黑白灰', colors: ['#000000', '#6b7280', '#ffffff'] },
  { id: 'vibrant', name: '繽紛彩虹', colors: ['#ef4444', '#22c55e', '#3b82f6'] },
];

// 材質風格 LORA 選項
const LORA_STYLES: { id: LoraStyleId; name: string; description: string }[] = [
  { id: '', name: '不使用', description: '不套用材質風格' },
  { id: 'E01', name: '液體流動紋理', description: '🌊 適合：水元素、流動感、財富、情感相關牌組' },
  { id: 'E02', name: '彩色散景光暈', description: '✨ 適合：光明、喜悅、神聖、啟蒙相關牌組' },
  { id: 'E03', name: '模糊金色調', description: '🟡 適合：財富、豐收、神秘相關牌組' },
  { id: 'E04', name: '金色bokeh最密集', description: '⭐ 適合：成功、榮耀、勝利相關牌組' },
  { id: 'E05', name: '史詩細節豐富', description: '🏛️ 適合：史詩、傳統、北歐神話相關牌組' },
  { id: 'E06', name: '深棕藍綠色調', description: '🟤 適合：大地、森林、自然相關牌組' },
  { id: 'E07', name: '科幻未來感', description: '🚀 適合：科幻、未來、能量相關牌組' },
  { id: 'E08', name: '印象派油畫', description: '🎨 適合：藝術、溫暖、情感相關牌組' },
  { id: 'E09', name: '陽光金色光線', description: '☀️ 適合：光明、希望、覺醒相關牌組' },
  { id: 'E10', name: '幾何極簡主義', description: '📐 適合：極簡、現代、平衡相關牌組' },
  { id: 'E11', name: '宇宙星空', description: '🌌 適合：宇宙、命運、神秘相關牌組' },
  { id: 'E12', name: '火燒雲夕陽', description: '🌅 適合：變化、熱情、力量相關牌組' },
];

// 取得匹配的預設色盤 ID
const getMatchingPresetId = (colors: string[]) => {
  const preset = PRESET_PALETTES.find(p =>
    p.colors.length === colors.length &&
    p.colors.every((c, i) => c.toLowerCase() === colors[i]?.toLowerCase())
  );
  return preset?.id || null;
};

// 選擇彈窗組件
interface SelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const SelectModal: React.FC<SelectModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 彈窗內容 */}
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl max-h-[85vh] flex flex-col animate-slide-up sm:animate-fade-in">
        {/* 標題列 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* 選項內容 - 可滾動 */}
        <div className="overflow-y-auto flex-1 p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

const StyleConfigurator: React.FC<StyleConfiguratorProps> = ({
  style,
  deckName,
  deckDescription,
  category,
  onChange,
}) => {
  const categoryInfo = category ? DECK_CATEGORIES[category] : null;
  const [editingColorIndex, setEditingColorIndex] = useState<number | null>(null);
  const [showStyleModal, setShowStyleModal] = useState(false);
  const [showLoraModal, setShowLoraModal] = useState(false);
  const [showColorModal, setShowColorModal] = useState(false);
  const matchingPresetId = getMatchingPresetId(style.colorPalette);

  // 取得當前選中的風格資訊
  const currentStyle = STYLE_TEMPLATES.find(t => t.id === style.styleTemplate);
  const currentLora = LORA_STYLES.find(l => l.id === style.loraStyle);
  const currentPalette = PRESET_PALETTES.find(p => p.id === matchingPresetId);

  // 選擇預設色盤
  const handlePresetSelect = (colors: string[]) => {
    onChange({ style: { colorPalette: [...colors] } });
    setEditingColorIndex(null);
  };

  // 更新單一顏色
  const handleColorChange = (index: number, color: string) => {
    const newPalette = [...style.colorPalette];
    newPalette[index] = color;
    onChange({ style: { colorPalette: newPalette } });
  };

  // 新增顏色
  const handleAddColor = () => {
    if (style.colorPalette.length < 5) {
      onChange({ style: { colorPalette: [...style.colorPalette, '#888888'] } });
    }
  };

  // 移除顏色
  const handleRemoveColor = (index: number) => {
    if (style.colorPalette.length > 1) {
      const newPalette = style.colorPalette.filter((_, i) => i !== index);
      onChange({ style: { colorPalette: newPalette } });
      setEditingColorIndex(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 標題 */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">設計風格</h2>
        <p className="text-gray-500 text-sm">
          自訂卡組名稱和視覺風格
        </p>
      </div>

      {/* 卡組基本資訊 */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Type size={16} />
          卡組資訊
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">卡組名稱</label>
            <input
              type="text"
              value={deckName}
              onChange={(e) => onChange({ deckName: e.target.value })}
              placeholder="輸入卡組名稱"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">類別</label>
            <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-600">
              {categoryInfo?.nameCN || '未選擇'} ({categoryInfo?.totalCards || 0} 張)
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">描述（選填）</label>
            <textarea
              value={deckDescription}
              onChange={(e) => onChange({ deckDescription: e.target.value })}
              placeholder="輸入卡組描述"
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all resize-none"
            />
          </div>
        </div>
      </div>

      {/* 風格設定 - 使用選擇器按鈕 */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Brush size={16} />
          風格設定
        </h3>

        {/* 藝術風格選擇器 */}
        <button
          onClick={() => setShowStyleModal(true)}
          className="w-full p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${AI_COLORS.bgLight}`}>
              <Brush size={20} className={AI_COLORS.text} />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-gray-900">藝術風格</div>
              <div className="text-sm text-gray-500">
                {currentStyle ? `${currentStyle.name}` : '選擇風格'}
              </div>
            </div>
          </div>
          <ChevronRight size={20} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
        </button>

        {/* 色調風格選擇器 */}
        <button
          onClick={() => setShowColorModal(true)}
          className="w-full p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-purple-100 to-amber-100">
              <Palette size={20} className="text-purple-600" />
            </div>
            <div className="text-left flex-1">
              <div className="text-sm font-medium text-gray-900">色調風格</div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {style.colorPalette.slice(0, 4).map((color, i) => (
                    <div
                      key={i}
                      className="w-4 h-4 rounded-full border border-gray-200"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-500">
                  {currentPalette ? currentPalette.name : '自訂色票'}
                </span>
              </div>
            </div>
          </div>
          <ChevronRight size={20} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
        </button>

        {/* 材質風格選擇器 */}
        <button
          onClick={() => setShowLoraModal(true)}
          className="w-full p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-100 to-cyan-100">
              <Layers size={20} className="text-blue-600" />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-gray-900">材質風格</div>
              <div className="text-sm text-gray-500">
                {currentLora ? currentLora.name : '選擇材質'}
              </div>
            </div>
          </div>
          <ChevronRight size={20} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
        </button>
      </div>

      {/* 自訂提示詞 */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">
          額外風格描述（選填）
        </h3>
        <textarea
          value={style.customPromptSuffix}
          onChange={(e) => onChange({ style: { customPromptSuffix: e.target.value } })}
          placeholder="例如：加入星空元素、使用柔和光線、帶有神秘感..."
          rows={2}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all resize-none"
        />
        <p className="text-xs text-gray-400">
          這段描述會附加到每張卡牌的 AI 生成提示詞中
        </p>
      </div>

      {/* 藝術風格選擇彈窗 */}
      <SelectModal
        isOpen={showStyleModal}
        onClose={() => setShowStyleModal(false)}
        title="選擇藝術風格"
      >
        <div className="grid grid-cols-1 gap-2">
          {STYLE_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => {
                onChange({ style: { styleTemplate: template.id } });
                setShowStyleModal(false);
              }}
              className={`
                p-3 rounded-xl border-2 text-left transition-all flex items-center justify-between
                ${style.styleTemplate === template.id
                  ? `${AI_COLORS.border} ${AI_COLORS.bgLight}`
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <div>
                <div className="font-medium text-gray-900">{template.name}</div>
                <div className="text-sm text-gray-500">{template.description}</div>
              </div>
              {style.styleTemplate === template.id && (
                <Check size={20} className={AI_COLORS.text} />
              )}
            </button>
          ))}
        </div>
      </SelectModal>

      {/* 色調風格選擇彈窗 */}
      <SelectModal
        isOpen={showColorModal}
        onClose={() => setShowColorModal(false)}
        title="選擇色調風格"
      >
        <div className="space-y-4">
          {/* 預設色盤 */}
          <div className="grid grid-cols-1 gap-2">
            {PRESET_PALETTES.map((palette) => (
              <button
                key={palette.id}
                onClick={() => {
                  handlePresetSelect(palette.colors);
                  setShowColorModal(false);
                }}
                className={`
                  p-3 rounded-xl border-2 text-left transition-all flex items-center justify-between
                  ${matchingPresetId === palette.id
                    ? `${AI_COLORS.border} ${AI_COLORS.bgLight}`
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    {palette.colors.map((color, i) => (
                      <div
                        key={i}
                        className="w-6 h-6 rounded-full border border-gray-200"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="font-medium text-gray-900">{palette.name}</div>
                </div>
                {matchingPresetId === palette.id && (
                  <Check size={20} className={AI_COLORS.text} />
                )}
              </button>
            ))}
          </div>

          {/* 自訂色票 */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">自訂色票</span>
              {!matchingPresetId && (
                <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                  使用中
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {style.colorPalette.map((color, index) => (
                <div key={index} className="relative group">
                  <button
                    onClick={() => setEditingColorIndex(editingColorIndex === index ? null : index)}
                    className={`
                      w-10 h-10 rounded-lg border-2 transition-all cursor-pointer
                      ${editingColorIndex === index ? 'ring-2 ring-orange-400 border-orange-400' : 'border-gray-300 hover:border-gray-400'}
                    `}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                  {/* 移除按鈕 */}
                  {style.colorPalette.length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemoveColor(index); }}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      ×
                    </button>
                  )}
                  {/* 色票選擇器 */}
                  {editingColorIndex === index && (
                    <div className="absolute top-12 left-0 z-10 bg-white rounded-lg shadow-lg border border-gray-200 p-2">
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => handleColorChange(index, e.target.value)}
                        className="w-24 h-24 cursor-pointer border-0"
                      />
                      <div className="mt-2">
                        <input
                          type="text"
                          value={color}
                          onChange={(e) => handleColorChange(index, e.target.value)}
                          className="w-24 px-2 py-1 text-xs border border-gray-200 rounded text-center font-mono"
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {/* 新增色票按鈕 */}
              {style.colorPalette.length < 5 && (
                <button
                  onClick={handleAddColor}
                  className="w-10 h-10 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 flex items-center justify-center text-gray-400 hover:text-gray-500 transition-colors"
                  title="新增顏色"
                >
                  <Plus size={18} />
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-3">
              點擊色塊可自選顏色，最多 5 個色票
            </p>
          </div>
        </div>
      </SelectModal>

      {/* 材質風格選擇彈窗 */}
      <SelectModal
        isOpen={showLoraModal}
        onClose={() => setShowLoraModal(false)}
        title="選擇材質風格"
      >
        <div className="grid grid-cols-1 gap-2">
          {LORA_STYLES.map((lora) => (
            <button
              key={lora.id || 'none'}
              onClick={() => {
                onChange({ style: { loraStyle: lora.id } });
                setShowLoraModal(false);
              }}
              className={`
                p-3 rounded-xl border-2 text-left transition-all flex items-center justify-between
                ${style.loraStyle === lora.id
                  ? `${AI_COLORS.border} ${AI_COLORS.bgLight}`
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <div>
                <div className="font-medium text-gray-900">{lora.name}</div>
                <div className="text-sm text-gray-500">{lora.description}</div>
              </div>
              {style.loraStyle === lora.id && (
                <Check size={20} className={AI_COLORS.text} />
              )}
            </button>
          ))}
        </div>
      </SelectModal>

      {/* CSS 動畫 */}
      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes fade-in {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default StyleConfigurator;
