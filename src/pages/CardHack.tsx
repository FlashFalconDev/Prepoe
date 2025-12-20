import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Layers, Eye, EyeOff, Sparkles, X, RotateCcw } from 'lucide-react';
import { AI_COLORS } from '../constants/colors';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import { api, API_ENDPOINTS } from '../config/api';
import CardDeckFormSimple from '../components/CardDeckFormSimple';

interface Deck {
  id: number;
  name: string;
  description: string;
  is_public: boolean;
  card_count: number;
  card_style?: string;
  code?: string;
  created_at: string;
  updated_at: string;
}

const CardHack: React.FC = () => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
  const [showDrawModal, setShowDrawModal] = useState(false);
  const [drawingDeck, setDrawingDeck] = useState<Deck | null>(null);
  const { showSuccess, showError } = useToast();
  const { confirm } = useConfirm();

  // 載入卡組列表
  const loadDecks = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.CARDHACK_DECKS);
      if (response.data.success) {
        setDecks(response.data.data);
      } else {
        showError('載入卡組失敗');
      }
    } catch (error: any) {
      console.error('載入卡組錯誤:', error);
      showError(error.response?.data?.message || '載入卡組時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDecks();
  }, []);

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
        loadDecks();
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

  // 開啟創建表單
  const handleCreate = () => {
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
    loadDecks();
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
        deckId={editingDeck?.id}
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
                key={deck.id}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-pink-200"
              >
                {/* Deck Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 ${AI_COLORS.bg} rounded-xl flex items-center justify-center`}>
                    <Layers size={24} className={AI_COLORS.text} />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTestDraw(deck)}
                      className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="測試抽卡"
                    >
                      <Sparkles size={16} />
                    </button>
                    <button
                      onClick={() => handleEdit(deck)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="編輯"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(deck.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="刪除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Deck Info */}
                <h3 className="text-lg font-bold text-gray-900 mb-2">{deck.name}</h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{deck.description || '無描述'}</p>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Layers size={14} />
                    <span>{deck.card_count} 張牌</span>
                  </div>
                  <div className="flex items-center gap-1">
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

                {/* Footer */}
                <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
                  更新於 {new Date(deck.updated_at).toLocaleDateString('zh-TW')}
                </div>
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

  // 預設卡背圖片
  const cardBackImage = deck.card_style || 'https://fflinebotstatic.s3.ap-northeast-1.amazonaws.com/default_records/card_style/default_card_back.png';

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
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.CARDHACK_DECK_CARDS(deck.id));
      if (response.data.success) {
        const cardsData = response.data.data.cards || response.data.data || [];
        setAllCards(cardsData);
        // 隨機選 3 張不重複的卡
        shuffleAndPick(cardsData);
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
            <div className="p-8">
              <div className="flex justify-center items-end gap-4 md:gap-6 mb-12 min-h-[280px]">
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
                        ${isSelected ? 'z-20 -translate-y-16 scale-110' : 'hover:-translate-y-4 hover:scale-105'}
                        ${selectedCard !== null && !isSelected ? 'opacity-30 scale-90 translate-y-4' : ''}
                      `}
                      style={{
                        perspective: '1000px',
                        animationDelay: isShuffling ? `${i * 100}ms` : '0ms',
                      }}
                    >
                      <div
                        className="relative w-32 h-48 md:w-40 md:h-60 transition-transform duration-700"
                        style={{
                          transformStyle: 'preserve-3d',
                          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                        }}
                      >
                        {/* 卡背 */}
                        <div
                          className="absolute inset-0 rounded-xl shadow-2xl overflow-hidden border-2 border-yellow-400/50"
                          style={{
                            backfaceVisibility: 'hidden',
                          }}
                        >
                          <img
                            src={cardBackImage}
                            alt="卡背"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/160x240/6366f1/ffffff?text=Card';
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles className="text-yellow-300/60" size={36} />
                          </div>
                        </div>

                        {/* 卡面 */}
                        <div
                          className="absolute inset-0 rounded-xl shadow-2xl overflow-hidden border-2 border-yellow-400 bg-gradient-to-br from-purple-600 to-indigo-700"
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
                    <div className="relative w-48 h-72 md:w-56 md:h-80 rounded-xl shadow-2xl overflow-hidden border-2 border-yellow-400">
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
                            className={`w-12 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                              selectedImageIndex === idx
                                ? 'border-yellow-400 scale-110'
                                : 'border-white/30 opacity-60 hover:opacity-100'
                            }`}
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
