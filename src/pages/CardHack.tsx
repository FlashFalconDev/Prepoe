import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit3, Trash2, Layers, Eye, EyeOff, Sparkles, X, RotateCcw, Wand2, Loader2, CheckCircle2, AlertCircle, LayoutGrid } from 'lucide-react';
import { AI_COLORS } from '../constants/colors';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import { api, API_ENDPOINTS } from '../config/api';
import CardDeckFormSimple from '../components/CardDeckFormSimple';
import SpreadManagerModal from '../components/SpreadManagerModal';

interface Deck {
  id: number | null;
  order_id: number | null;
  order_code: string | null;
  name: string;
  description: string;
  is_public: boolean;
  card_count: number;
  total_cards: number | null;
  card_style?: string;
  code?: string;
  created_at: string;
  updated_at: string;
  // 生成狀態相關
  is_generating: boolean;
  generation_status: 'pending' | 'processing' | 'completed' | 'failed';
  generation_status_display: string;
  progress_percentage: number;
  completed_cards: number | null;
  failed_cards: number | null;
}

const CardHack: React.FC = () => {
  const navigate = useNavigate();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
  const [showDrawModal, setShowDrawModal] = useState(false);
  const [drawingDeck, setDrawingDeck] = useState<Deck | null>(null);
  const [showCreateOptions, setShowCreateOptions] = useState(false);
  const [showSpreadModal, setShowSpreadModal] = useState(false);
  const [spreadDeck, setSpreadDeck] = useState<Deck | null>(null);
  const { showSuccess, showError } = useToast();
  const { confirm } = useConfirm();
  const hasFetched = useRef(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 載入卡組列表，回傳是否還有生成中的卡組
  const loadDecks = async (force = false, silent = false): Promise<boolean> => {
    if (!force && hasFetched.current) return false;
    hasFetched.current = true;

    try {
      if (!silent) setLoading(true);
      const response = await api.get(API_ENDPOINTS.CARDHACK_DECKS);
      if (response.data.success) {
        const newDecks: Deck[] = response.data.data || [];

        // 詳細記錄每個卡組的生成狀態
        console.log('[CardHack] 載入卡組列表:', newDecks.map(d => ({
          id: d.id,
          name: d.name,
          is_generating: d.is_generating,
          generation_status: d.generation_status,
          progress: d.progress_percentage,
          completed_cards: d.completed_cards,
          card_count: d.card_count,
          total: d.total_cards,
          // 判斷結果
          shouldBeComplete: d.total_cards && d.total_cards > 0 && (d.completed_cards === d.total_cards || d.card_count >= d.total_cards)
        })));

        // 關鍵：只看 is_generating 欄位來決定是否繼續輪詢
        const stillGenerating = newDecks.some(deck => deck.is_generating === true);
        const generatingCount = newDecks.filter(deck => deck.is_generating === true).length;
        console.log('[CardHack] 還在生成中:', stillGenerating, '| 生成中數量:', generatingCount);

        // 如果後端說沒有生成中的任務，直接修改資料，把 processing 狀態的卡組標記為完成
        // 這樣就不需要另一個 state 來追蹤
        let finalDecks = newDecks;
        if (!stillGenerating) {
          finalDecks = newDecks.map(deck => {
            // 如果 is_generating 是 false，但 status 還是 processing，直接改成 completed
            if (deck.is_generating === false &&
                deck.generation_status === 'processing') {
              console.log('[CardHack] 強制標記卡組為完成:', deck.id ?? deck.order_id, deck.name);
              return {
                ...deck,
                generation_status: 'completed' as const,
              };
            }
            return deck;
          });
        }

        setDecks(finalDecks);
        return stillGenerating;
      } else if (!silent) {
        showError('載入卡組失敗');
      }
    } catch (error: any) {
      console.error('載入卡組錯誤:', error);
      if (!silent) {
        showError(error.response?.data?.message || '載入卡組時發生錯誤');
      }
    } finally {
      if (!silent) setLoading(false);
    }
    return false;
  };

  useEffect(() => {
    loadDecks();
  }, []);

  // 計算是否有生成中的卡組
  // 核心邏輯：只看 is_generating 欄位（後端的權威判斷）
  // loadDecks 會在後端說沒有生成中時，把 processing 狀態改成 completed
  const isGenerating = (deck: Deck): boolean => {
    // 明確完成或失敗的不算生成中
    if (deck.generation_status === 'completed' || deck.generation_status === 'failed') {
      return false;
    }
    // 只看後端的 is_generating 欄位
    return deck.is_generating === true;
  };

  const hasGeneratingDecks = decks.some(isGenerating);

  // 追蹤生成中的卡組 ID + 狀態，用於偵測變化
  const generatingDeckIds = decks.filter(isGenerating).map(d => `${d.id}:${d.generation_status}:${d.progress_percentage}`).join(',');

  // 自動輪詢：當有生成中的卡組時，每 12 秒刷新一次
  useEffect(() => {
    // 清除舊的輪詢
    if (pollIntervalRef.current) {
      clearTimeout(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    if (!hasGeneratingDecks) {
      console.log('[CardHack] 沒有生成中的卡組，停止輪詢');
      return;
    }

    console.log('[CardHack] 開始輪詢，生成中的卡組:', generatingDeckIds);

    // 開始輪詢
    const poll = async () => {
      console.log('[CardHack] 執行輪詢...');
      const stillGenerating = await loadDecks(true, true);
      console.log('[CardHack] 輪詢結果，還在生成:', stillGenerating);

      // 如果還在生成中，繼續輪詢
      if (stillGenerating) {
        pollIntervalRef.current = setTimeout(poll, 12000);
      } else {
        // 生成完成，清除輪詢
        // loadDecks 已經處理了資料轉換（把 is_generating:false 但 status:processing 的改成 completed）
        console.log('[CardHack] 生成完成，停止輪詢');
        pollIntervalRef.current = null;
      }
    };

    // 12 秒後開始第一次輪詢
    pollIntervalRef.current = setTimeout(poll, 12000);

    return () => {
      if (pollIntervalRef.current) {
        clearTimeout(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [generatingDeckIds]); // 使用 generatingDeckIds 作為依賴，這樣當生成狀態變化時會重新設置輪詢

  // 刪除卡組
  const handleDelete = async (deckId: number) => {
    const confirmed = await confirm({
      title: '確認刪除',
      message: '確定要刪除此卡組嗎？此操作無法復原，所有相關的牌卡也會被刪除。',
    });

    if (!confirmed) return;

    try {
      const response = await api.delete(API_ENDPOINTS.CARDHACK_DECK_DETAIL(deckId));
      if (response.data.success) {
        showSuccess('卡組刪除成功');
        loadDecks(true);
      } else {
        showError('刪除失敗');
      }
    } catch (error: any) {
      console.error('刪除卡組錯誤:', error);
      showError(error.response?.data?.message || '刪除卡組時發生錯誤');
    }
  };

  // 開啟編輯表單
  const handleEdit = (deck: Deck) => {
    setEditingDeck(deck);
    setShowForm(true);
  };

  // 開啟創建選項
  const handleCreate = () => {
    setShowCreateOptions(true);
  };

  // 使用嚮導創建
  const handleWizardCreate = () => {
    setShowCreateOptions(false);
    navigate('/provider/creator/cardhack/wizard');
  };

  // 手動創建
  const handleManualCreate = () => {
    setShowCreateOptions(false);
    setEditingDeck(null);
    setShowForm(true);
  };

  // 關閉表單
  const handleCloseForm = () => {
    setShowForm(false);
    setEditingDeck(null);
  };

  // 開啟抽卡測試
  const handleTestDraw = (deck: Deck) => {
    if (deck.card_count < 1) {
      showError('卡組中沒有牌卡，請先新增牌卡');
      return;
    }
    setDrawingDeck(deck);
    setShowDrawModal(true);
  };

  // 表單提交成功
  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingDeck(null);
    loadDecks(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${AI_COLORS.border} mx-auto mb-4`}></div>
          <p className="text-gray-600">載入卡組中...</p>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <CardDeckFormSimple
        deckId={editingDeck?.id ?? undefined}
        onSuccess={handleFormSuccess}
        onCancel={handleCloseForm}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">我的卡組</h1>
          </div>
          <button
            onClick={handleCreate}
            className={`${AI_COLORS.button} px-6 py-3 rounded-xl flex items-center gap-2 hover:scale-105 transition-transform`}
          >
            <Plus size={20} />
            <span>創建卡組</span>
          </button>
        </div>

        {/* Deck List */}
        {decks.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <div className={`w-16 h-16 ${AI_COLORS.bg} rounded-full flex items-center justify-center mx-auto mb-4`}>
              <Layers size={32} className={AI_COLORS.text} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">尚無卡組</h3>
            <p className="text-gray-600 mb-6">創建您的第一個塔羅牌卡組</p>
            <button
              onClick={handleCreate}
              className={`${AI_COLORS.button} px-6 py-3 rounded-xl inline-flex items-center gap-2`}
            >
              <Plus size={20} />
              <span>創建卡組</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {decks.map((deck) => (
              <div
                key={deck.id || deck.order_id}
                className={`bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border-2 ${
                  isGenerating(deck)
                    ? 'border-orange-300 bg-gradient-to-br from-white to-orange-50'
                    : 'border-transparent hover:border-pink-200'
                }`}
              >
                {/* Deck Header */}
                <div className="flex items-start justify-between mb-4">
                  {/* 卡背圖片堆疊效果 */}
                  <div className="relative w-14 h-[72px]">
                    {/* 底層卡片 - 第三張 */}
                    <div className="absolute top-0 left-2 w-11 h-16 rounded-md shadow-sm overflow-hidden transform rotate-6 bg-gray-200">
                      {deck.card_style ? (
                        <img src={deck.card_style} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full ${AI_COLORS.bg} flex items-center justify-center`}>
                          <Layers size={14} className={AI_COLORS.text} />
                        </div>
                      )}
                    </div>
                    {/* 中層卡片 - 第二張 */}
                    <div className="absolute top-1 left-1 w-11 h-16 rounded-md shadow-sm overflow-hidden transform -rotate-3 bg-gray-200">
                      {deck.card_style ? (
                        <img src={deck.card_style} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full ${AI_COLORS.bg} flex items-center justify-center`}>
                          <Layers size={14} className={AI_COLORS.text} />
                        </div>
                      )}
                    </div>
                    {/* 頂層卡片 - 第一張 */}
                    <div className="absolute top-2 left-0 w-11 h-16 rounded-md shadow-md overflow-hidden bg-gray-200">
                      {deck.card_style ? (
                        <img src={deck.card_style} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full ${AI_COLORS.bg} flex items-center justify-center`}>
                          <Layers size={16} className={AI_COLORS.text} />
                        </div>
                      )}
                      {/* 生成中的遮罩和旋轉圖標 */}
                      {isGenerating(deck) && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Loader2 size={18} className="text-white animate-spin" />
                        </div>
                      )}
                      {/* 失敗狀態 */}
                      {!isGenerating(deck) && deck.generation_status === 'failed' && (
                        <div className="absolute inset-0 bg-red-500/40 flex items-center justify-center">
                          <AlertCircle size={18} className="text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* 設定牌陣 */}
                    {!isGenerating(deck) && deck.id && (
                      <button
                        onClick={() => {
                          setSpreadDeck(deck);
                          setShowSpreadModal(true);
                        }}
                        className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        title="設定牌陣"
                      >
                        <LayoutGrid size={16} />
                      </button>
                    )}
                    {/* 只有非生成中且有 id 的卡組才能測試抽卡 */}
                    {!isGenerating(deck) && deck.id && (
                      <button
                        onClick={() => handleTestDraw(deck)}
                        className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="測試抽卡"
                      >
                        <Sparkles size={16} />
                      </button>
                    )}
                    {/* 只有有 id 的卡組才能編輯 */}
                    {deck.id && (
                      <button
                        onClick={() => handleEdit(deck)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="編輯"
                      >
                        <Edit3 size={16} />
                      </button>
                    )}
                    {deck.id && (
                      <button
                        onClick={() => handleDelete(deck.id!)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="刪除"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Deck Info */}
                <h3 className="text-lg font-bold text-gray-900 mb-2">{deck.name}</h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{deck.description || '無描述'}</p>

                {/* 生成進度區塊 */}
                {isGenerating(deck) && deck.total_cards && (
                  <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-orange-700 flex items-center gap-1.5">
                        <Loader2 size={14} className="animate-spin" />
                        {deck.generation_status_display}
                      </span>
                      <span className="text-sm font-bold text-orange-600">
                        {deck.progress_percentage.toFixed(0)}%
                      </span>
                    </div>
                    {/* 進度條 */}
                    <div className="h-2 bg-orange-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500"
                        style={{ width: `${deck.progress_percentage}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-orange-600">
                      <span>
                        已完成 {deck.completed_cards ?? 0} / {deck.total_cards} 張
                      </span>
                      {(deck.failed_cards ?? 0) > 0 && (
                        <span className="text-red-500 flex items-center gap-1">
                          <AlertCircle size={12} />
                          失敗 {deck.failed_cards} 張
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Stats - 生成中時隱藏，避免與進度區塊重複 */}
                {!isGenerating(deck) && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Layers size={14} />
                      <span>{deck.card_count} 張牌</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {deck.generation_status === 'completed' && (
                        <CheckCircle2 size={14} className="text-green-500 mr-1" />
                      )}
                      {deck.is_public ? (
                        <>
                          <Eye size={14} className="text-green-600" />
                          <span className="text-green-600">公開</span>
                        </>
                      ) : (
                        <>
                          <EyeOff size={14} className="text-gray-500" />
                          <span className="text-gray-500">私人</span>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Footer - 生成中時隱藏 */}
                {!isGenerating(deck) && (
                  <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
                    更新於 {new Date(deck.updated_at).toLocaleDateString('zh-TW')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 抽卡測試彈窗 */}
      {showDrawModal && drawingDeck && (
        <CardDrawModal
          deck={drawingDeck}
          onClose={() => {
            setShowDrawModal(false);
            setDrawingDeck(null);
          }}
        />
      )}

      {/* 牌陣管理彈窗 */}
      {spreadDeck && (
        <SpreadManagerModal
          isOpen={showSpreadModal}
          onClose={() => {
            setShowSpreadModal(false);
            setSpreadDeck(null);
          }}
          deck={{ id: spreadDeck.id!, name: spreadDeck.name }}
        />
      )}

      {/* 創建方式選擇彈窗 */}
      {showCreateOptions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">選擇創建方式</h3>
              <button
                onClick={() => setShowCreateOptions(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="space-y-3">
              {/* 嚮導創建 */}
              <button
                onClick={handleWizardCreate}
                className={`w-full p-4 border-2 rounded-xl text-left hover:border-orange-400 transition-all group`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 ${AI_COLORS.bg} rounded-xl group-hover:${AI_COLORS.bgHover} transition-colors`}>
                    <Wand2 className={AI_COLORS.text} size={24} />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">嚮導創建</div>
                    <div className="text-sm text-gray-500">使用 AI 輔助，選擇預設類別快速建立</div>
                  </div>
                </div>
              </button>

              {/* 手動創建 */}
              <button
                onClick={handleManualCreate}
                className="w-full p-4 border-2 rounded-xl text-left hover:border-gray-400 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-xl group-hover:bg-gray-200 transition-colors">
                    <Plus className="text-gray-600" size={24} />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">手動創建</div>
                    <div className="text-sm text-gray-500">從空白開始，完全自訂所有內容</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 抽卡測試彈窗元件
interface CardDrawModalProps {
  deck: Deck;
  onClose: () => void;
}

interface Interpretation {
  id: number;
  title: string;
  content: string;
  numerator: number; // 權重
}

interface CardImage {
  id: number;
  url: string;
  caption: string;
  interpretations?: Interpretation[];
}

interface DeckCardData {
  id: number;
  title: string;
  images: CardImage[];
}

const CardDrawModal: React.FC<CardDrawModalProps> = ({ deck, onClose }) => {
  const [allCards, setAllCards] = useState<DeckCardData[]>([]);
  const [displayCards, setDisplayCards] = useState<number[]>([0, 1, 2]); // 顯示的三張卡索引
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [isShuffling, setIsShuffling] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showResult, setShowResult] = useState(false); // 是否顯示結果畫面
  const [selectedImageIndex, setSelectedImageIndex] = useState(0); // 多圖時選擇的圖片索引
  const [selectedInterpretation, setSelectedInterpretation] = useState<Interpretation | null>(null); // 隨機選中的解釋
  const [loadingInterpretation, setLoadingInterpretation] = useState(false); // 載入解釋中
  const [needsCardBackScale, setNeedsCardBackScale] = useState(false); // 卡背是否需要縮放
  const [contentAspectRatio, setContentAspectRatio] = useState<string>('2/3'); // 內容卡牌的比例
  const [contentRatioValue, setContentRatioValue] = useState<number>(2 / 3); // 內容卡牌比例數值
  const hasFetchedCards = useRef(false);
  const contentRatioLoaded = useRef(false);
  const cardBackRatioRef = useRef<number | null>(null); // 卡背圖片比例

  // 預設卡背圖片
  const cardBackImage = deck.card_style || 'https://fflinebotstatic.s3.ap-northeast-1.amazonaws.com/default_records/card_style/default_card_back.png';

  // 檢查內容卡牌圖片比例（用第一張卡的圖片作為標準）
  const handleContentImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (contentRatioLoaded.current) return;
    contentRatioLoaded.current = true;
    
    const img = e.currentTarget;
    const ratio = img.naturalWidth / img.naturalHeight;
    setContentRatioValue(ratio);
    // 轉換為 CSS aspect-ratio 格式
    setContentAspectRatio(`${img.naturalWidth}/${img.naturalHeight}`);
  };

  // 檢查卡背圖片比例
  const handleCardBackLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    cardBackRatioRef.current = img.naturalWidth / img.naturalHeight;
    // 重新計算是否需要縮放
    const ratioDiff = Math.abs(cardBackRatioRef.current - contentRatioValue) / contentRatioValue;
    setNeedsCardBackScale(ratioDiff > 0.05);
  };

  // 當內容比例更新時，重新計算卡背是否需要縮放
  useEffect(() => {
    if (cardBackRatioRef.current !== null) {
      const ratioDiff = Math.abs(cardBackRatioRef.current - contentRatioValue) / contentRatioValue;
      setNeedsCardBackScale(ratioDiff > 0.05);
    }
  }, [contentRatioValue]);

  // 根據權重隨機選取（通用函數）
  const weightedRandomSelect = <T,>(items: T[], getWeight: (item: T) => number): number => {
    if (items.length === 0) return 0;
    if (items.length === 1) return 0;

    const weights = items.map(getWeight);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    if (totalWeight === 0) return 0;

    let random = Math.random() * totalWeight;
    for (let i = 0; i < weights.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return i;
      }
    }

    return items.length - 1;
  };

  // 根據權重隨機選取圖片索引
  const getWeightedRandomImageIndex = (images: CardImage[]): number => {
    return weightedRandomSelect(images, (img) => {
      if (!img.interpretations || img.interpretations.length === 0) {
        return 1;
      }
      return img.interpretations.reduce((sum, interp) => sum + (interp.numerator || 1), 0);
    });
  };

  // 根據權重隨機選取解釋索引
  const getWeightedRandomInterpretationIndex = (interpretations: Interpretation[]): number => {
    return weightedRandomSelect(interpretations, (interp) => interp.numerator || 1);
  };

  // 載入卡牌資料
  useEffect(() => {
    loadCards();
  }, [deck.id]);

  const loadCards = async () => {
    if (hasFetchedCards.current) return;
    hasFetchedCards.current = true;
    
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.CARDHACK_DECK_CARDS(deck.id!));
      if (response.data.success) {
        const cardsData = response.data.data.cards || response.data.data || [];
        setAllCards(cardsData);
        // 隨機選 3 張不重複的卡
        shuffleAndPick(cardsData);
        
        // 預載入第一張卡的圖片來取得內容比例
        if (cardsData.length > 0 && cardsData[0].images?.length > 0) {
          const firstImageUrl = cardsData[0].images[0].url;
          const img = new Image();
          img.onload = () => {
            if (!contentRatioLoaded.current) {
              contentRatioLoaded.current = true;
              const ratio = img.naturalWidth / img.naturalHeight;
              setContentRatioValue(ratio);
              setContentAspectRatio(`${img.naturalWidth}/${img.naturalHeight}`);
            }
          };
          img.src = firstImageUrl;
        }
      }
    } catch (error) {
      console.error('載入卡牌失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  // 隨機選取 3 張不重複的卡
  const shuffleAndPick = (cards: DeckCardData[]) => {
    if (cards.length === 0) return;

    const indices = Array.from({ length: cards.length }, (_, i) => i);
    // Fisher-Yates 洗牌
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    // 取前 3 張（或全部，如果少於 3 張）
    setDisplayCards(indices.slice(0, Math.min(3, cards.length)));
  };

  // 載入圖片的解釋
  const loadInterpretations = async (imageId: number) => {
    try {
      setLoadingInterpretation(true);
      const response = await api.get(API_ENDPOINTS.CARDHACK_INTERPRETATIONS(imageId));
      if (response.data.success && response.data.data.length > 0) {
        const interpretations: Interpretation[] = response.data.data;
        // 根據權重隨機選取一個解釋
        const randomIndex = getWeightedRandomInterpretationIndex(interpretations);
        setSelectedInterpretation(interpretations[randomIndex] || interpretations[0]);
      } else {
        setSelectedInterpretation(null);
      }
    } catch (error) {
      console.error('載入解釋失敗:', error);
      setSelectedInterpretation(null);
    } finally {
      setLoadingInterpretation(false);
    }
  };

  // 翻牌動畫
  const handleCardClick = async (index: number) => {
    if (isShuffling || selectedCard !== null || loading) return;

    setSelectedCard(index);
    setFlippedCards(new Set([index]));

    // 根據權重隨機選取要顯示的圖片
    const card = allCards[displayCards[index]];
    if (card && card.images && card.images.length > 0) {
      const randomImageIndex = getWeightedRandomImageIndex(card.images);
      setSelectedImageIndex(randomImageIndex);

      // 取得選中圖片的 ID，呼叫 API 載入解釋
      const selectedImage = card.images[randomImageIndex];
      if (selectedImage?.id) {
        loadInterpretations(selectedImage.id);
      } else {
        setSelectedInterpretation(null);
      }
    } else {
      setSelectedImageIndex(0);
      setSelectedInterpretation(null);
    }

    // 延遲顯示結果畫面
    setTimeout(() => {
      setShowResult(true);
    }, 800);
  };

  // 重新洗牌
  const handleShuffle = () => {
    setIsShuffling(true);
    setFlippedCards(new Set());
    setSelectedCard(null);
    setShowResult(false);
    setSelectedImageIndex(0);
    setSelectedInterpretation(null);

    // 洗牌動畫
    setTimeout(() => {
      shuffleAndPick(allCards);
      setIsShuffling(false);
    }, 600);
  };

  // 取得選中卡牌的資料
  const getSelectedCardData = (): DeckCardData | null => {
    if (selectedCard === null) return null;
    return allCards[displayCards[selectedCard]] || null;
  };


  // 取得卡牌要顯示的圖片 URL（如果是選中的卡牌，顯示隨機選中的圖片）
  const getCardImage = (cardIndex: number): string | null => {
    const card = allCards[displayCards[cardIndex]];
    if (card && card.images && card.images.length > 0) {
      // 如果是選中的卡牌，顯示隨機選中的圖片
      if (selectedCard === cardIndex) {
        return card.images[selectedImageIndex]?.url || card.images[0].url;
      }
      return card.images[0].url;
    }
    return null;
  };

  // 取得卡牌名稱
  const getCardTitle = (cardIndex: number): string => {
    const card = allCards[displayCards[cardIndex]];
    return card?.title || '未命名';
  };

  // 載入中畫面
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-b from-purple-900 to-indigo-900 rounded-2xl p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-purple-200">載入卡牌中...</p>
        </div>
      </div>
    );
  }

  // 沒有卡牌
  if (allCards.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-b from-purple-900 to-indigo-900 rounded-2xl p-12 text-center">
          <Layers size={48} className="text-purple-400 mx-auto mb-4" />
          <p className="text-purple-200 mb-4">此卡組尚無牌卡</p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-colors"
          >
            關閉
          </button>
        </div>
      </div>
    );
  }

  const selectedCardData = getSelectedCardData();

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-purple-900 to-indigo-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-xl font-bold text-white">{deck.name}</h3>
            <p className="text-purple-300 text-sm">
              {showResult ? '你抽到的牌' : '選擇一張牌，揭示你的命運'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* 內容區域 */}
        <div className="flex-1 overflow-y-auto">
          {!showResult ? (
            /* 選牌階段 */
            <div className="p-4 sm:p-6 md:p-8">
              <div className="flex justify-center items-end gap-2 sm:gap-3 md:gap-6 mb-8 md:mb-12 min-h-[210px] sm:min-h-[250px] md:min-h-[295px]">
                {displayCards.map((_, i) => {
                  const isFlipped = flippedCards.has(i);
                  const isSelected = selectedCard === i;

                  return (
                    <div
                      key={i}
                      onClick={() => handleCardClick(i)}
                      className={`
                        relative cursor-pointer transition-all duration-700 transform-gpu
                        ${isShuffling ? 'animate-bounce' : ''}
                        ${isSelected ? 'z-20 -translate-y-8 sm:-translate-y-12 md:-translate-y-16 scale-110' : 'hover:-translate-y-2 sm:hover:-translate-y-3 md:hover:-translate-y-4 hover:scale-105'}
                        ${selectedCard !== null && !isSelected ? 'opacity-30 scale-90 translate-y-4' : ''}
                      `}
                      style={{
                        perspective: '1000px',
                        animationDelay: isShuffling ? `${i * 100}ms` : '0ms',
                      }}
                    >
                      <div
                        className="relative w-24 sm:w-28 md:w-40 transition-transform duration-700"
                        style={{
                          aspectRatio: contentAspectRatio,
                          transformStyle: 'preserve-3d',
                          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                        }}
                      >
                        {/* 卡背 */}
                        <div
                          className="absolute inset-0 shadow-2xl rounded-lg overflow-hidden border-2 border-yellow-400/50 bg-gradient-to-br from-purple-600 to-indigo-700"
                          style={{
                            backfaceVisibility: 'hidden',
                          }}
                        >
                          <img
                            src={cardBackImage}
                            alt="卡背"
                            className={`w-full h-full object-cover ${needsCardBackScale ? 'scale-[1.15]' : ''}`}
                            onLoad={handleCardBackLoad}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/160x240/6366f1/ffffff?text=Card';
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <Sparkles className="text-yellow-300/60" size={36} />
                          </div>
                        </div>

                        {/* 卡面 */}
                        <div
                          className="absolute inset-0 rounded-lg sm:rounded-xl shadow-2xl overflow-hidden border-2 border-yellow-400 bg-gradient-to-br from-purple-600 to-indigo-700"
                          style={{
                            backfaceVisibility: 'hidden',
                            transform: 'rotateY(180deg)',
                          }}
                        >
                          {getCardImage(i) ? (
                            <img
                              src={getCardImage(i)!}
                              alt={getCardTitle(i)}
                              className="w-full h-full object-cover"
                              onLoad={handleContentImageLoad}
                            />
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-3">
                              <Sparkles className="mb-2" size={36} />
                              <span className="text-base font-bold text-center">{getCardTitle(i)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 提示文字 */}
              <div className="text-center mb-6">
                {selectedCard === null ? (
                  <p className="text-purple-200 text-lg">點擊選擇一張牌</p>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-yellow-300">
                    <Sparkles size={20} />
                    <span className="font-medium">正在揭示...</span>
                  </div>
                )}
              </div>

              {/* 操作按鈕 */}
              <div className="flex justify-center gap-4">
                <button
                  onClick={handleShuffle}
                  disabled={isShuffling || selectedCard !== null}
                  className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors disabled:opacity-50"
                >
                  <RotateCcw size={18} className={isShuffling ? 'animate-spin' : ''} />
                  重新洗牌
                </button>
              </div>
            </div>
          ) : (
            /* 結果顯示階段 */
            <div className="p-6">
              {selectedCardData && (
                <div className="flex flex-col md:flex-row gap-6">
                  {/* 卡片圖片 */}
                  <div className="flex-shrink-0 flex flex-col items-center">
                    <div 
                      className="relative w-48 md:w-56 rounded-xl shadow-2xl overflow-hidden border-2 border-yellow-400"
                      style={{ aspectRatio: contentAspectRatio }}
                    >
                      {selectedCardData.images.length > 0 ? (
                        <img
                          src={selectedCardData.images[selectedImageIndex]?.url || selectedCardData.images[0].url}
                          alt={selectedCardData.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-600 to-indigo-700 flex flex-col items-center justify-center text-white">
                          <Sparkles size={48} className="mb-3" />
                          <span className="text-xl font-bold">{selectedCardData.title}</span>
                        </div>
                      )}
                    </div>

                    {/* 多圖切換 */}
                    {selectedCardData.images.length > 1 && (
                      <div className="flex gap-2 mt-4">
                        {selectedCardData.images.map((img, idx) => (
                          <button
                            key={img.id}
                            onClick={() => setSelectedImageIndex(idx)}
                            className="w-12 rounded-lg overflow-hidden border-2 transition-all"
                            style={{ 
                              aspectRatio: contentAspectRatio,
                              borderColor: selectedImageIndex === idx ? 'rgb(250, 204, 21)' : 'rgba(255, 255, 255, 0.3)',
                              transform: selectedImageIndex === idx ? 'scale(1.1)' : 'scale(1)',
                              opacity: selectedImageIndex === idx ? 1 : 0.6,
                            }}
                          >
                            <img src={img.url} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 說明文字 */}
                  <div className="flex-1 text-white">
                    <h4 className="text-2xl font-bold mb-4 flex items-center gap-2">
                      <Sparkles className="text-yellow-400" size={24} />
                      {selectedCardData.title}
                    </h4>

                    {/* 牌義解釋（隨機選中的一個） */}
                    {loadingInterpretation ? (
                      <div className="p-4 bg-white/10 rounded-xl flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-400 mr-3"></div>
                        <span className="text-purple-200">載入解釋中...</span>
                      </div>
                    ) : selectedInterpretation ? (
                      <div className="p-4 bg-white/10 rounded-xl">
                        {selectedInterpretation.title && (
                          <h5 className="text-yellow-300 font-semibold mb-2">
                            {selectedInterpretation.title}
                          </h5>
                        )}
                        <p className="text-purple-200 whitespace-pre-wrap text-sm leading-relaxed">
                          {selectedInterpretation.content}
                        </p>
                      </div>
                    ) : (
                      <div className="mb-4 p-4 bg-white/5 rounded-xl border border-white/10">
                        <p className="text-purple-300 text-sm">
                          這張牌目前沒有解釋文字。
                        </p>
                      </div>
                    )}

                    {/* 操作按鈕 */}
                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={handleShuffle}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
                      >
                        <RotateCcw size={18} />
                        再抽一次
                      </button>
                      <button
                        onClick={onClose}
                        className="px-5 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-colors"
                      >
                        完成
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 卡組資訊 */}
        <div className="px-6 py-4 border-t border-white/10 text-center flex-shrink-0">
          <p className="text-purple-400 text-xs">
            卡組共 {deck.card_count} 張牌 · 測試模式
          </p>
        </div>
      </div>
    </div>
  );
};

export default CardHack;
