import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Upload, Save, Layers, ChevronDown, ChevronUp } from 'lucide-react';
import { AI_COLORS } from '../constants/colors';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import ConfirmDialog from './ConfirmDialog';
import { api, API_ENDPOINTS, uploadFile } from '../config/api';

interface Interpretation {
  id?: number;
  language: string;
  title: string;
  content: string;
  numerator: number;
}

interface CardImage {
  id?: number;
  url?: string;
  caption: string; // 圖片說明 (單一)
  interpretations: Interpretation[]; // 牌義解釋 (多個)
  static_record_id?: number; // Static_Usage_Record 的 pk，用於關聯上傳的文件
}

interface DeckCard {
  id?: number;
  title: string;
  order_index: number;
  images: CardImage[];
}

interface Tag {
  id: number;
  name: string;
}

interface CardDeckFormSimpleProps {
  deckId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

const CardDeckFormSimple: React.FC<CardDeckFormSimpleProps> = ({ deckId, onSuccess, onCancel }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [cards, setCards] = useState<DeckCard[]>([]);
  const [expandedCardId, setExpandedCardId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viewingImage, setViewingImage] = useState<{ cardIndex: number; imageIndex: number } | null>(null);
  const [loadingInterpretations, setLoadingInterpretations] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<number | null>(null); // 記錄正在上傳圖片的卡牌索引

  const { showSuccess, showError } = useToast();
  const { confirm, isOpen, options, handleConfirm, handleCancel } = useConfirm();

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

      // 1. 載入卡組基本資料
      const deckResponse = await api.get(API_ENDPOINTS.CARDHACK_DECK_DETAIL(deckId));
      console.log('卡組詳情 API 回應:', deckResponse.data);

      if (deckResponse.data.success) {
        const deck = deckResponse.data.data;
        console.log('卡組資料:', deck);
        setName(deck.name || '');
        setDescription(deck.description || '');
        setIsPublic(deck.is_public || false);
        setSelectedTags(deck.tags?.map((t: Tag) => t.id) || []);
      }

      // 2. 載入卡牌列表（獨立 API）
      const cardsResponse = await api.get(API_ENDPOINTS.CARDHACK_DECK_CARDS(deckId));
      console.log('卡牌列表 API 回應:', cardsResponse.data);

      if (cardsResponse.data.success) {
        // 根據您提供的 API 格式: { success: true, data: { cards: [...] } }
        const responseData = cardsResponse.data.data;
        const cardsData = responseData.cards || responseData || [];
        console.log('卡牌資料:', cardsData);

        // 轉換卡牌資料,不預先載入 interpretations
        const transformedCards = cardsData.map((card: any) => ({
          id: card.id,
          title: card.title || '',
          order_index: card.order_index || 0,
          images: (card.images || []).map((img: any) => ({
            id: img.id,
            url: img.url,
            caption: img.caption || '',
            interpretations: [] // 初始為空,點擊時才載入
          }))
        }));

        setCards(transformedCards);
      }
    } catch (error: any) {
      console.error('載入卡組失敗:', error);
      console.error('錯誤詳情:', error.response?.data);
      showError('載入卡組失敗');
    } finally {
      setLoading(false);
    }
  };

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

  const handleAddCard = () => {
    const newCard: DeckCard = {
      title: '',
      order_index: cards.length,
      images: []
    };
    setCards([...cards, newCard]);
  };

  const handleDeleteCard = async (index: number) => {
    const card = cards[index];
    console.log('準備刪除卡牌:', { index, card, deckId });

    // 如果卡牌已存在於後端,需要先確認刪除
    // 注意：根據 API 文件，刪除卡牌不需要 deckId
    if (card.id) {
      console.log('開始呼叫確認對話框');
      const confirmed = await confirm({
        title: '確認刪除',
        message: `確定要刪除卡牌「${card.title || '未命名'}」嗎？此操作無法復原。`,
      });
      console.log('確認對話框回應:', confirmed);

      if (!confirmed) {
        console.log('用戶取消刪除');
        return;
      }

      try {
        console.log(`刪除後端卡牌: cardId=${card.id}`);
        // 根據 API 文件: /cards/<card_id>/delete/ + POST
        const response = await api.post(API_ENDPOINTS.CARDHACK_DECK_CARD_DELETE(card.id));
        console.log('刪除 API 回應:', response.data);
        showSuccess('卡牌刪除成功');
      } catch (error: any) {
        console.error('刪除卡牌失敗:', error);
        showError(error.response?.data?.message || '刪除卡牌失敗');
        return;
      }
    } else {
      console.log('刪除未儲存的卡牌');
    }

    // 從本地狀態中移除卡牌,並重新計算 order_index
    const newCards = cards
      .filter((_, i) => i !== index)
      .map((card, newIndex) => ({
        ...card,
        order_index: newIndex // 重新計算順序
      }));

    console.log('更新後的卡牌列表:', newCards);
    setCards(newCards);

    // 如果刪除的卡牌正在展開,關閉展開狀態
    if (expandedCardId === index) {
      setExpandedCardId(null);
    } else if (expandedCardId !== null && expandedCardId > index) {
      // 如果刪除的卡牌在展開卡牌之前,需要調整 expandedCardId
      setExpandedCardId(expandedCardId - 1);
    }
  };

  const updateCard = (index: number, updates: Partial<DeckCard>) => {
    const newCards = [...cards];
    newCards[index] = { ...newCards[index], ...updates };
    setCards(newCards);
  };

  const handleImageUpload = async (cardIndex: number, file: File) => {
    setUploadingImage(cardIndex); // 設置載入狀態
    try {
      // 1. 上傳圖片文件
      const uploadResponse = await uploadFile(file);
      if (!uploadResponse.success) {
        throw new Error('文件上傳失敗');
      }

      const card = cards[cardIndex];

      // 2. 如果卡牌已存在於後端，立即創建圖片記錄
      if (card.id) {
        const imageData = {
          url: uploadResponse.data.url,
          caption: '',
          static_record_id: uploadResponse.data.Static_Usage_Record_pk
        };

        const imageResponse = await api.post(
          API_ENDPOINTS.CARDHACK_CARD_IMAGE_CREATE(card.id),
          imageData
        );

        if (imageResponse.data.success) {
          const newImage: CardImage = {
            id: imageResponse.data.data.id,
            url: uploadResponse.data.url,
            caption: '',
            interpretations: []
          };

          updateCard(cardIndex, {
            images: [...card.images, newImage]
          });
          showSuccess('圖片上傳並保存成功');
        } else {
          throw new Error('創建圖片記錄失敗');
        }
      } else {
        // 如果卡牌尚未保存，先暫存圖片 URL 和 static_record_id，等儲存時再創建記錄
        const newImage: CardImage = {
          url: uploadResponse.data.url,
          caption: '',
          interpretations: [],
          static_record_id: uploadResponse.data.Static_Usage_Record_pk
        };

        updateCard(cardIndex, {
          images: [...card.images, newImage]
        });
        showSuccess('圖片上傳成功，請記得儲存卡組');
      }
    } catch (error: any) {
      console.error('圖片上傳失敗:', error);
      showError(error.message || '圖片上傳失敗');
    } finally {
      setUploadingImage(null); // 清除載入狀態
    }
  };

  // 點擊圖片時載入牌義解釋
  const handleViewImage = async (cardIndex: number, imageIndex: number) => {
    const image = cards[cardIndex].images[imageIndex];

    // 如果已經載入過 interpretations 或沒有 image id,直接顯示
    if (image.interpretations.length > 0 || !image.id) {
      setViewingImage({ cardIndex, imageIndex });
      return;
    }

    // 否則先載入 interpretations
    try {
      setLoadingInterpretations(true);
      const interpResponse = await api.get(`/cardhack/api/images/${image.id}/interpretations/`);

      if (interpResponse.data.success) {
        const interpretations = interpResponse.data.data || [];

        // 更新該圖片的 interpretations
        const newCards = [...cards];
        newCards[cardIndex].images[imageIndex].interpretations = interpretations;
        setCards(newCards);

        setViewingImage({ cardIndex, imageIndex });
      } else {
        setViewingImage({ cardIndex, imageIndex });
      }
    } catch (error) {
      console.error(`載入圖片 ${image.id} 的牌義解釋失敗:`, error);
      // 即使載入失敗也顯示,只是沒有 interpretations
      setViewingImage({ cardIndex, imageIndex });
    } finally {
      setLoadingInterpretations(false);
    }
  };

  const handleDeleteImage = async (cardIndex: number, imageIndex: number) => {
    const card = cards[cardIndex];
    const image = card.images[imageIndex];

    // 確認刪除
    const confirmed = await confirm({
      title: '確認刪除',
      message: '確定要刪除此圖片嗎？此操作無法復原。',
    });

    if (!confirmed) {
      return;
    }

    try {
      // 如果圖片有 id，呼叫後端 API 刪除
      if (image.id) {
        await api.post(API_ENDPOINTS.CARDHACK_CARD_IMAGE_DELETE(image.id));
        showSuccess('圖片刪除成功');
      } else {
        // 新上傳但未儲存的圖片，直接從本地移除
        showSuccess('圖片已移除');
      }

      // 從本地狀態中移除圖片
      const newImages = card.images.filter((_, i) => i !== imageIndex);
      updateCard(cardIndex, { images: newImages });
    } catch (error: any) {
      console.error('圖片刪除失敗:', error);
      showError(error.response?.data?.message || '圖片刪除失敗');
    }
  };

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
        // 根據 API 文件: /decks/<deck_id>/update/ + POST
        const response = await api.post(API_ENDPOINTS.CARDHACK_DECK_UPDATE(deckId), deckData);
        if (!response.data.success) {
          throw new Error('更新卡組失敗');
        }
      } else {
        const response = await api.post(API_ENDPOINTS.CARDHACK_DECK_CREATE, deckData);
        if (!response.data.success) {
          throw new Error('創建卡組失敗');
        }
        savedDeckId = response.data.data.id;
      }

      // 2. 儲存所有卡牌
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];

        const cardData = {
          title: card.title.trim(),
          order_index: i,
          is_active: true
        };

        let savedCardId = card.id;
        if (card.id) {
          // 更新現有卡牌 - 根據 API 文件: /cards/<card_id>/update/ + POST
          await api.post(API_ENDPOINTS.CARDHACK_DECK_CARD_UPDATE(card.id), cardData);
        } else {
          // 創建新卡牌
          const response = await api.post(API_ENDPOINTS.CARDHACK_DECK_CARD_CREATE(savedDeckId!), cardData);
          savedCardId = response.data.data.id;
        }

        // 3. 儲存圖片和牌義解釋
        for (const image of card.images) {
          let imageId = image.id;

          // 如果圖片沒有 ID，需要先創建圖片記錄
          if (!imageId) {
            try {
              console.log(`創建新圖片記錄: cardId=${savedCardId}, url=${image.url}, static_record_id=${image.static_record_id}`);
              const imageData = {
                url: image.url,
                caption: image.caption || '',
                static_record_id: image.static_record_id  // 必須包含此欄位
              };

              const imageResponse = await api.post(
                API_ENDPOINTS.CARDHACK_CARD_IMAGE_CREATE(savedCardId!),
                imageData
              );

              if (imageResponse.data.success) {
                imageId = imageResponse.data.data.id;
                console.log(`成功創建圖片記錄，ID: ${imageId}`);
              } else {
                console.error('創建圖片記錄失敗:', imageResponse.data);
                continue; // 跳過這張圖片
              }
            } catch (err: any) {
              console.error('創建圖片記錄時發生錯誤:', err);
              continue; // 跳過這張圖片
            }
          }

          // 4. 儲存牌義解釋（掛在圖片下）
          for (const interp of image.interpretations) {
            if (!interp.title.trim() && !interp.content.trim()) continue; // 跳過空內容

            const interpData = {
              language: interp.language,
              title: interp.title,
              content: interp.content,
              numerator: interp.numerator
            };

            try {
              if (interp.id) {
                // 更新解釋 - 根據 API 文件: /interpretations/<interp_id>/update/ + POST
                await api.post(
                  API_ENDPOINTS.CARDHACK_INTERPRETATION_UPDATE(interp.id),
                  interpData
                );
                console.log(`成功更新解釋 ${interp.id}`);
              } else {
                // 創建解釋 - 根據 API 文件: /images/<image_id>/interpretations/create/ + POST
                // 注意：使用 imageId 變數（可能是新創建的）而不是 image.id
                const interpResponse = await api.post(
                  API_ENDPOINTS.CARDHACK_INTERPRETATION_CREATE(imageId!),
                  interpData
                );
                console.log(`成功創建解釋:`, interpResponse.data);
              }
            } catch (err: any) {
              console.error(`儲存解釋失敗:`, err);
              // 繼續處理其他解釋，不中斷整個儲存流程
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
                  placeholder="例：宇宙訊息"
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
                <label className="block text-sm font-medium text-gray-700">
                  卡牌列表 ({cards.length} 張)
                </label>
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
                  <div key={card.id || `new-card-${cardIndex}`} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* 卡牌標題列 */}
                    <div className="flex items-center gap-3 p-4 bg-gray-50">
                      <Layers size={18} className="text-pink-600" />
                      <input
                        type="text"
                        value={card.title}
                        onChange={(e) => updateCard(cardIndex, { title: e.target.value })}
                        className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                        placeholder="卡牌名稱 (例：Kin 131)"
                      />
                      <button
                        onClick={() => setExpandedCardId(expandedCardId === cardIndex ? null : cardIndex)}
                        className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg"
                      >
                        {expandedCardId === cardIndex ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                      <button
                        onClick={() => handleDeleteCard(cardIndex)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* 展開的卡牌圖片 */}
                    {expandedCardId === cardIndex && (
                      <div className="p-4 border-t border-gray-200">
                        <div className="mb-3">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            卡牌樣式 ({card.images.length} 種)
                          </label>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          {card.images.map((image, imageIndex) => (
                            <div key={imageIndex} className="relative">
                              {/* 可點擊的圖片卡片 */}
                              <button
                                onClick={() => handleViewImage(cardIndex, imageIndex)}
                                className="relative border-2 border-gray-200 rounded-lg p-2 bg-white hover:border-pink-500 hover:shadow-lg transition-all w-full group"
                              >
                                <img
                                  src={image.url}
                                  alt={image.caption || `圖片 ${imageIndex + 1}`}
                                  className="w-full aspect-square object-cover rounded-lg"
                                />
                                {image.caption && (
                                  <div className="mt-2 text-xs text-gray-700 text-center truncate">{image.caption}</div>
                                )}
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all flex items-center justify-center">
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm font-medium">
                                    點擊查看詳情
                                  </div>
                                </div>
                              </button>

                              {/* 刪除按鈕 */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteImage(cardIndex, imageIndex);
                                }}
                                className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors z-10"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}

                          {/* 上傳新圖片 */}
                          <label className={`aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors ${
                            uploadingImage === cardIndex
                              ? 'border-pink-500 bg-pink-50 cursor-wait'
                              : 'border-gray-300 cursor-pointer hover:border-pink-500 hover:bg-pink-50'
                          }`}>
                            {uploadingImage === cardIndex ? (
                              <>
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600 mb-2"></div>
                                <span className="text-xs text-pink-600">上傳中...</span>
                              </>
                            ) : (
                              <>
                                <Upload size={24} className="text-gray-400 mb-2" />
                                <span className="text-xs text-gray-600">上傳圖片</span>
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={uploadingImage === cardIndex}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload(cardIndex, file);
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {cards.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <Layers size={48} className="text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-4">尚未新增任何卡牌</p>
                    <button
                      onClick={handleAddCard}
                      className={`${AI_COLORS.button} px-4 py-2 rounded-lg inline-flex items-center gap-2`}
                    >
                      <Plus size={16} />
                      新增第一張卡牌
                    </button>
                  </div>
                )}
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

      {/* 圖片詳情 Modal */}
      {viewingImage !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {(() => {
              const { cardIndex, imageIndex } = viewingImage;
              const card = cards[cardIndex];
              const image = card.images[imageIndex];

              return (
                <>
                  {/* Header */}
                  <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">圖片詳情 - {card.title}</h3>
                    <button
                      onClick={() => setViewingImage(null)}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-6">
                    {/* 圖片預覽 */}
                    <div className="flex justify-center">
                      <img
                        src={image.url}
                        alt={image.caption}
                        className="max-w-full max-h-96 object-contain rounded-lg shadow-lg"
                      />
                    </div>

                    {/* 圖片標題 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">圖片標題</label>
                      <input
                        type="text"
                        value={image.caption}
                        onChange={(e) => {
                          const newCards = [...cards];
                          newCards[cardIndex].images[imageIndex].caption = e.target.value;
                          setCards(newCards);
                        }}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2"
                        placeholder="輸入圖片標題"
                      />
                    </div>

                    {/* 牌義解釋 */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-base font-semibold text-gray-900">
                          牌義解釋 ({image.interpretations.length})
                        </h4>
                        <button
                          onClick={() => {
                            const newCards = [...cards];
                            newCards[cardIndex].images[imageIndex].interpretations = [
                              ...newCards[cardIndex].images[imageIndex].interpretations,
                              {
                                language: 'zh-TW',
                                title: '',
                                content: '',
                                numerator: 1
                              }
                            ];
                            setCards(newCards);
                          }}
                          className={`flex items-center gap-2 ${AI_COLORS.button} px-4 py-2 rounded-lg text-sm`}
                        >
                          <Plus size={16} />
                          新增解釋
                        </button>
                      </div>

                      {loadingInterpretations ? (
                        <div className="text-center py-8">
                          <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${AI_COLORS.border} mx-auto mb-2`}></div>
                          <p className="text-sm text-gray-600">載入牌義解釋中...</p>
                        </div>
                      ) : image.interpretations.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                          <p className="text-gray-500">尚無牌義解釋</p>
                          <p className="text-xs text-gray-400 mt-1">點擊上方「新增解釋」按鈕開始添加</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {image.interpretations.map((interp, interpIndex) => (
                            <div key={interpIndex} className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">解釋 {interpIndex + 1}</span>
                                <button
                                  onClick={async () => {
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
                                    const newCards = [...cards];
                                    newCards[cardIndex].images[imageIndex].interpretations =
                                      newCards[cardIndex].images[imageIndex].interpretations.filter((_, i) => i !== interpIndex);
                                    setCards(newCards);
                                  }}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>

                              <input
                                type="text"
                                value={interp.title}
                                onChange={(e) => {
                                  const newCards = [...cards];
                                  newCards[cardIndex].images[imageIndex].interpretations[interpIndex].title = e.target.value;
                                  setCards(newCards);
                                }}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                placeholder="解釋標題 (例：正位、逆位)"
                              />

                              <textarea
                                value={interp.content}
                                onChange={(e) => {
                                  const newCards = [...cards];
                                  newCards[cardIndex].images[imageIndex].interpretations[interpIndex].content = e.target.value;
                                  setCards(newCards);
                                }}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                placeholder="詳細解釋內容..."
                                rows={4}
                              />

                              <div className="flex gap-3">
                                <div className="flex-1">
                                  <label className="block text-xs font-medium text-gray-700 mb-1">語言</label>
                                  <select
                                    value={interp.language}
                                    onChange={(e) => {
                                      const newCards = [...cards];
                                      newCards[cardIndex].images[imageIndex].interpretations[interpIndex].language = e.target.value;
                                      setCards(newCards);
                                    }}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                  >
                                    <option value="zh-TW">繁體中文</option>
                                    <option value="zh-CN">简体中文</option>
                                    <option value="en">English</option>
                                    <option value="ja">日本語</option>
                                  </select>
                                </div>
                                <div className="w-24">
                                  <label className="block text-xs font-medium text-gray-700 mb-1">加權</label>
                                  <input
                                    type="number"
                                    value={interp.numerator}
                                    onChange={(e) => {
                                      const newCards = [...cards];
                                      newCards[cardIndex].images[imageIndex].interpretations[interpIndex].numerator =
                                        parseInt(e.target.value) || 1;
                                      setCards(newCards);
                                    }}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    min="1"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex justify-end">
                    <button
                      onClick={() => setViewingImage(null)}
                      className={`${AI_COLORS.button} px-6 py-2 rounded-lg`}
                    >
                      完成
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

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

export default CardDeckFormSimple;
