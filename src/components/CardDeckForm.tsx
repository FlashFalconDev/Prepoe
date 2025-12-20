import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Upload, Save, Image as ImageIcon, FileText } from 'lucide-react';
import { AI_COLORS } from '../constants/colors';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import ConfirmDialog from './ConfirmDialog';
import { api, API_ENDPOINTS, uploadFile } from '../config/api';

interface Interpretation {
  id?: number;
  title: string;
  content: string;
  numerator: number;
  language: string;
}

interface CardImage {
  id?: number;
  image_url?: string; // 這是顯示用的 URL
  image_url_pk?: number; // StaticUsageRecord 的 pk
  caption: string;
  numerator: number;
  interpretations: Interpretation[]; // 解釋掛在圖片下
}

interface DeckCard {
  id?: number;
  title: string;
  order_index: number;
  is_active: boolean;
  images: CardImage[];
}

interface Tag {
  id: number;
  name: string;
}

interface CardDeckFormProps {
  deckId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

const CardDeckForm: React.FC<CardDeckFormProps> = ({ deckId, onSuccess, onCancel }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [cards, setCards] = useState<DeckCard[]>([]);
  const [expandedCardIndex, setExpandedCardIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const { showSuccess, showError } = useToast();
  const { confirm, isOpen, options, handleConfirm, handleCancel } = useConfirm();

  // 載入標籤列表
  useEffect(() => {
    loadTags();
    if (deckId) {
      loadDeck();
    }
  }, [deckId]);

  const loadTags = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.CARDHACK_TAGS);
      if (response.data.success) {
        setAvailableTags(response.data.data);
      }
    } catch (error) {
      console.error('載入標籤失敗:', error);
    }
  };

  const loadDeck = async () => {
    if (!deckId) return;

    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.CARDHACK_DECK_DETAIL(deckId));
      if (response.data.success) {
        const deck = response.data.data;
        setName(deck.name);
        setDescription(deck.description || '');
        setIsPublic(deck.is_public);
        setSelectedTags(deck.tags?.map((t: Tag) => t.id) || []);

        // 載入卡牌列表
        const cardsResponse = await api.get(API_ENDPOINTS.CARDHACK_DECK_CARDS(deckId));
        if (cardsResponse.data.success) {
          setCards(cardsResponse.data.data || []);
        }
      }
    } catch (error) {
      console.error('載入卡組失敗:', error);
      showError('載入卡組失敗');
    } finally {
      setLoading(false);
    }
  };

  // 新增標籤
  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    try {
      const response = await api.post(API_ENDPOINTS.CARDHACK_TAG_CREATE, {
        name: newTagName.trim()
      });
      if (response.data.success) {
        const newTag = response.data.data;
        setAvailableTags([...availableTags, newTag]);
        setSelectedTags([...selectedTags, newTag.id]);
        setNewTagName('');
        showSuccess('標籤創建成功');
      }
    } catch (error: any) {
      showError(error.response?.data?.message || '創建標籤失敗');
    }
  };

  // 新增卡牌
  const handleAddCard = () => {
    const newCard: DeckCard = {
      title: '',
      order_index: cards.length,
      is_active: true,
      images: []
    };
    setCards([...cards, newCard]);
    setExpandedCardIndex(cards.length);
  };

  // 刪除卡牌
  const handleDeleteCard = async (index: number) => {
    const card = cards[index];

    if (card.id) {
      const confirmed = await confirm({
        title: '確認刪除',
        message: '確定要刪除此卡牌嗎？此操作無法復原。',
      });
      if (!confirmed) return;

      try {
        await api.delete(API_ENDPOINTS.CARDHACK_DECK_CARD_DELETE(card.id));
        showSuccess('卡牌刪除成功');
      } catch (error) {
        showError('刪除卡牌失敗');
        return;
      }
    }

    const newCards = cards.filter((_, i) => i !== index);
    setCards(newCards);
    if (expandedCardIndex === index) {
      setExpandedCardIndex(null);
    }
  };

  // 更新卡牌資訊
  const updateCard = (index: number, updates: Partial<DeckCard>) => {
    const newCards = [...cards];
    newCards[index] = { ...newCards[index], ...updates };
    setCards(newCards);
  };

  // 新增圖片到卡牌
  const handleAddImage = (cardIndex: number) => {
    const newImage: CardImage = {
      caption: '',
      numerator: 1,
      interpretations: [] // 初始化解釋陣列
    };
    const card = cards[cardIndex];
    updateCard(cardIndex, {
      images: [...card.images, newImage]
    });
  };

  // 上傳圖片
  const handleImageUpload = async (cardIndex: number, imageIndex: number, file: File) => {
    try {
      const uploadResponse = await uploadFile(file);
      if (uploadResponse.success) {
        const card = cards[cardIndex];
        const newImages = [...card.images];
        newImages[imageIndex] = {
          ...newImages[imageIndex],
          image_url_pk: uploadResponse.data.Static_Usage_Record_pk,
          image_url: uploadResponse.data.url
        };
        updateCard(cardIndex, { images: newImages });
        showSuccess('圖片上傳成功');
      }
    } catch (error) {
      showError('圖片上傳失敗');
    }
  };

  // 刪除圖片
  const handleDeleteImage = (cardIndex: number, imageIndex: number) => {
    const card = cards[cardIndex];
    const newImages = card.images.filter((_, i) => i !== imageIndex);
    updateCard(cardIndex, { images: newImages });
  };

  // 新增牌義解釋（到圖片）
  const handleAddInterpretation = (cardIndex: number, imageIndex: number) => {
    const newInterpretation: Interpretation = {
      title: '',
      content: '',
      numerator: 1,
      language: 'zh-TW'
    };
    const card = cards[cardIndex];
    const newImages = [...card.images];
    newImages[imageIndex].interpretations = [...newImages[imageIndex].interpretations, newInterpretation];
    updateCard(cardIndex, { images: newImages });
  };

  // 更新牌義解釋
  const updateInterpretation = (cardIndex: number, imageIndex: number, interpIndex: number, updates: Partial<Interpretation>) => {
    const card = cards[cardIndex];
    const newImages = [...card.images];
    const newInterpretations = [...newImages[imageIndex].interpretations];
    newInterpretations[interpIndex] = { ...newInterpretations[interpIndex], ...updates };
    newImages[imageIndex].interpretations = newInterpretations;
    updateCard(cardIndex, { images: newImages });
  };

  // 刪除牌義解釋
  const handleDeleteInterpretation = async (cardIndex: number, imageIndex: number, interpIndex: number) => {
    const card = cards[cardIndex];
    const interp = card.images[imageIndex].interpretations[interpIndex];
    
    // 如果解釋已存在於後端（有 id），則呼叫 API 刪除
    if (interp.id) {
      const confirmed = await confirm({
        title: '確認刪除',
        message: '確定要刪除此牌義解釋嗎？此操作無法復原。',
        confirmText: '刪除',
        cancelText: '取消',
        type: 'danger'
      });
      if (!confirmed) return;

      try {
        const response = await api.post(API_ENDPOINTS.CARDHACK_INTERPRETATION_DELETE(interp.id));
        if (!response.data.success) {
          showError(response.data.message || '刪除解釋失敗');
          return;
        }
        showSuccess('解釋已刪除');
      } catch (error: any) {
        console.error('刪除解釋失敗:', error);
        showError(error.response?.data?.message || '刪除解釋失敗');
        return;
      }
    }
    
    // 從本地 state 移除
    const newImages = [...card.images];
    newImages[imageIndex].interpretations = newImages[imageIndex].interpretations.filter((_, i) => i !== interpIndex);
    updateCard(cardIndex, { images: newImages });
  };

  // 儲存卡組
  const handleSave = async () => {
    if (!name.trim()) {
      showError('請輸入卡組名稱');
      return;
    }

    // 驗證卡牌
    const emptyCards = cards.filter(card => !card.title.trim());
    if (emptyCards.length > 0) {
      showError('請填寫所有卡牌的名稱');
      return;
    }

    // 驗證每張卡牌至少有一張圖片
    const cardsWithoutImages = cards.filter(card => card.title.trim() && card.images.length === 0);
    if (cardsWithoutImages.length > 0) {
      const cardNames = cardsWithoutImages.map(card => card.title).join('、');
      showError(`以下卡牌至少需要一張圖片：${cardNames}`);
      return;
    }

    try {
      setSaving(true);

      // 1. 創建或更新卡組
      const deckData = {
        name: name.trim(),
        description: description.trim(),
        is_public: isPublic,
        tag_ids: selectedTags
      };

      let savedDeckId = deckId;
      if (deckId) {
        // 更新卡組
        const response = await api.put(API_ENDPOINTS.CARDHACK_DECK_UPDATE(deckId), deckData);
        if (!response.data.success) {
          throw new Error('更新卡組失敗');
        }
      } else {
        // 創建卡組
        const response = await api.post(API_ENDPOINTS.CARDHACK_DECK_CREATE, deckData);
        if (!response.data.success) {
          throw new Error('創建卡組失敗');
        }
        savedDeckId = response.data.data.id;
      }

      // 2. 儲存卡牌
      for (const card of cards) {
        if (!card.title.trim()) continue;

        const cardData = {
          title: card.title.trim(),
          order_index: card.order_index,
          is_active: card.is_active
        };

        let savedCardId = card.id;
        if (card.id) {
          // 更新卡牌
          await api.put(API_ENDPOINTS.CARDHACK_DECK_CARD_UPDATE(card.id), cardData);
        } else {
          // 創建卡牌
          const response = await api.post(API_ENDPOINTS.CARDHACK_DECK_CARD_CREATE(savedDeckId!), cardData);
          savedCardId = response.data.data.id;
        }

        // 3. 儲存圖片和牌義解釋
        for (const image of card.images) {
          if (!image.image_url_pk) continue; // 跳過未上傳的圖片

          const imageData = {
            image_url_pk: image.image_url_pk, // 這是 StaticUsageRecord 的 pk
            caption: image.caption,
            numerator: image.numerator
          };

          let savedImageId = image.id;
          if (image.id) {
            // 更新圖片（如果 API 支援）
            // await api.put(API_ENDPOINTS.CARDHACK_CARD_IMAGE_UPDATE(...), imageData);
          } else {
            // 創建圖片
            const imageResponse = await api.post(
              API_ENDPOINTS.CARDHACK_CARD_IMAGE_CREATE(savedCardId!),
              imageData
            );
            savedImageId = imageResponse.data.data.id;
          }

          // 4. 儲存牌義解釋（掛在圖片下）
          for (const interp of image.interpretations) {
            if (!interp.content.trim()) continue;

            const interpData = {
              image_id: savedImageId, // 關聯到圖片
              title: interp.title,
              content: interp.content,
              numerator: interp.numerator,
              language: interp.language
            };

            if (interp.id) {
              // 更新解釋
              await api.put(
                API_ENDPOINTS.CARDHACK_INTERPRETATION_UPDATE(interp.id),
                interpData
              );
            } else {
              // 創建解釋
              await api.post(
                API_ENDPOINTS.CARDHACK_INTERPRETATION_CREATE(savedImageId!),
                interpData
              );
            }
          }
        }
      }

      showSuccess(deckId ? '卡組更新成功' : '卡組創建成功');
      onSuccess();
    } catch (error: any) {
      console.error('儲存卡組失敗:', error);
      showError(error.response?.data?.message || '儲存失敗');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${AI_COLORS.border} mx-auto mb-4`}></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
              {deckId ? '編輯卡組' : '創建卡組'}
            </h2>
            <button onClick={onCancel} className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100">
              <X size={24} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* 基本資訊 */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">卡組名稱 *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="例：韋特塔羅牌"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">描述</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="簡單描述這副牌卡的特色..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                />
                <label htmlFor="isPublic" className="text-sm text-gray-700">公開此卡組</label>
              </div>
            </div>

            {/* 標籤選擇 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">標籤</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {availableTags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => {
                      if (selectedTags.includes(tag.id)) {
                        setSelectedTags(selectedTags.filter(id => id !== tag.id));
                      } else {
                        setSelectedTags([...selectedTags, tag.id]);
                      }
                    }}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      selectedTags.includes(tag.id)
                        ? 'bg-pink-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateTag()}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="新增標籤..."
                />
                <button
                  onClick={handleCreateTag}
                  className={`${AI_COLORS.button} px-4 py-2 rounded-lg text-sm`}
                >
                  新增
                </button>
              </div>
            </div>

            {/* 卡牌列表 */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">卡牌 ({cards.length})</label>
                <button
                  onClick={handleAddCard}
                  className={`flex items-center gap-2 ${AI_COLORS.button} px-4 py-2 rounded-lg text-sm`}
                >
                  <Plus size={16} />
                  新增卡牌
                </button>
              </div>

              <div className="space-y-3">
                {cards.map((card, cardIndex) => (
                  <div key={cardIndex} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* 卡牌標題列 */}
                    <div
                      className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100"
                      onClick={() => setExpandedCardIndex(expandedCardIndex === cardIndex ? null : cardIndex)}
                    >
                      <input
                        type="text"
                        value={card.title}
                        onChange={(e) => {
                          e.stopPropagation();
                          updateCard(cardIndex, { title: e.target.value });
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm mr-3"
                        placeholder="卡牌名稱 (例：愚者 The Fool)"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCard(cardIndex);
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* 展開的卡牌詳情 */}
                    {expandedCardIndex === cardIndex && (
                      <div className="p-4 space-y-4 border-t border-gray-200">
                        {/* 圖片區域 */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-700">卡牌圖片</label>
                            <button
                              onClick={() => handleAddImage(cardIndex)}
                              className="text-sm text-pink-600 hover:text-pink-700 flex items-center gap-1"
                            >
                              <Plus size={14} />
                              新增圖片
                            </button>
                          </div>
                          <div className="space-y-4">
                            {card.images.map((image, imageIndex) => (
                              <div key={imageIndex} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
                                {/* 圖片上傳區域 */}
                                <div>
                                  {image.image_url ? (
                                    <img
                                      src={image.image_url}
                                      alt={image.caption}
                                      className="w-full h-48 object-cover rounded"
                                    />
                                  ) : (
                                    <div className="w-full h-48 bg-gray-100 rounded flex items-center justify-center border-2 border-dashed border-gray-300">
                                      <label className="cursor-pointer flex flex-col items-center gap-2 text-gray-500">
                                        <Upload size={32} />
                                        <span className="text-sm">上傳圖片</span>
                                        <input
                                          type="file"
                                          accept="image/*"
                                          className="hidden"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleImageUpload(cardIndex, imageIndex, file);
                                          }}
                                        />
                                      </label>
                                    </div>
                                  )}
                                </div>

                                {/* 圖片說明 */}
                                <input
                                  type="text"
                                  value={image.caption}
                                  onChange={(e) => {
                                    const newImages = [...card.images];
                                    newImages[imageIndex].caption = e.target.value;
                                    updateCard(cardIndex, { images: newImages });
                                  }}
                                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
                                  placeholder="圖片說明"
                                />

                                {/* 牌義解釋（掛在圖片下） */}
                                <div className="border-t border-gray-300 pt-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-medium text-gray-700">此圖片的牌義解釋</label>
                                    <button
                                      onClick={() => handleAddInterpretation(cardIndex, imageIndex)}
                                      className="text-xs text-pink-600 hover:text-pink-700 flex items-center gap-1"
                                    >
                                      <Plus size={12} />
                                      新增解釋
                                    </button>
                                  </div>
                                  <div className="space-y-2">
                                    {image.interpretations.map((interp, interpIndex) => (
                                      <div key={interpIndex} className="border border-gray-300 rounded-lg p-2 space-y-2 bg-white">
                                        <input
                                          type="text"
                                          value={interp.title}
                                          onChange={(e) => updateInterpretation(cardIndex, imageIndex, interpIndex, { title: e.target.value })}
                                          className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                                          placeholder="解釋標題 (例：正位、逆位)"
                                        />
                                        <textarea
                                          value={interp.content}
                                          onChange={(e) => updateInterpretation(cardIndex, imageIndex, interpIndex, { content: e.target.value })}
                                          rows={2}
                                          className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                                          placeholder="詳細解釋..."
                                        />
                                        <button
                                          onClick={() => handleDeleteInterpretation(cardIndex, imageIndex, interpIndex)}
                                          className="text-xs text-red-600 hover:text-red-700"
                                        >
                                          刪除解釋
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* 刪除圖片按鈕 */}
                                <button
                                  onClick={() => handleDeleteImage(cardIndex, imageIndex)}
                                  className="w-full text-sm text-red-600 hover:text-red-700 py-1"
                                >
                                  刪除此圖片
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
            <button
              onClick={onCancel}
              disabled={saving}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center gap-2 ${AI_COLORS.button} px-6 py-2 rounded-lg disabled:opacity-50`}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>儲存中...</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>儲存</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 確認對話框 */}
      <ConfirmDialog
        isOpen={isOpen}
        title={options.title || ''}
        message={options.message}
        confirmText={options.confirmText}
        cancelText={options.cancelText}
        type={options.type}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default CardDeckForm;
