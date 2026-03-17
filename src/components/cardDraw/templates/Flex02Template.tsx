import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Star, AlertCircle, Coins } from 'lucide-react';
import { CardDrawTemplateProps, DrawnCard, getRecommendedItemShopPath } from '../types';
import { useToast } from '../../../hooks/useToast';
import { COIN_LABEL } from '../../../config/terms';

// 牌組數量（用於展示的蓋牌數量）
const DECK_SIZE = 15;

/**
 * Flex02 模板 - 深藍神秘風格 + 規矩抽牌
 * 特點：
 * 1. 深藍色漸層背景（同 flex_01）
 * 2. 抽牌區採用規矩的橫向滾動牌組（同 base）
 * 3. 單向流程 - 沒有重新抽牌
 * 4. 解釋可往前或上一步（第一張牌第一頁時停用上一步）
 * 5. 結果頁不顯示標題文字
 */
const Flex02Template: React.FC<CardDrawTemplateProps> = ({
  drawResult,
  cardBackImage,
  cardAspectRatio,
  drawnCardIndices,
  setDrawnCardIndices,
  flippingIndex,
  setFlippingIndex,
  allCardsDrawn,
  setAllCardsDrawn,
  recommended_item,
  recommended_person,
  ai_interpretation,
  onAiSubmit,
  userQuestion,
  addonInfo,
  addonMemberCard,
  onAddonPurchase,
}) => {
  const navigate = useNavigate();
  const { showError } = useToast();
  // 結果頁面狀態 - 自動從第一張開始，不讓使用者選擇
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [interpretationPage, setInterpretationPage] = useState(0);
  const [isLastPageWaiting, setIsLastPageWaiting] = useState(false); // 最後一頁等待狀態
  const [showRecommendedPage, setShowRecommendedPage] = useState(false); // 是否顯示推薦頁
  // AI 解說流程
  const [showAiInputScreen, setShowAiInputScreen] = useState(false);
  const [showAiResultScreen, setShowAiResultScreen] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResultText, setAiResultText] = useState('');
  const [aiSubmitting, setAiSubmitting] = useState(false);
  const [addonPurchasing, setAddonPurchasing] = useState(false);

  // 抽牌區滾動相關
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // 需要抽的牌數
  const totalCardsNeeded = drawResult.cards.content.length;
  // 已抽的牌數
  const cardsDrawnCount = drawnCardIndices.length;

  // 檢查滾動狀態
  const checkScrollButtons = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 10);
    }
  };

  const scrollLeft = () => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollButtons);
      checkScrollButtons();
      return () => container.removeEventListener('scroll', checkScrollButtons);
    }
  }, []);

  const handleDeckCardClick = (deckIndex: number) => {
    if (flippingIndex !== null || drawnCardIndices.includes(deckIndex) || cardsDrawnCount >= totalCardsNeeded) {
      return;
    }

    setFlippingIndex(deckIndex);

    setTimeout(() => {
      setDrawnCardIndices((prev) => {
        const newIndices = [...prev, deckIndex];
        if (newIndices.length >= totalCardsNeeded) {
          setTimeout(() => {
            setAllCardsDrawn(true);
          }, 500);
        }
        return newIndices;
      });
      setFlippingIndex(null);
    }, 800);
  };

  const getCardForPosition = (positionIndex: number): DrawnCard | null => {
    if (positionIndex >= drawResult.cards.content.length) {
      return null;
    }
    return drawResult.cards.content[positionIndex];
  };

  // 只能往前 - 自動從第一張走到最後一張
  const handleNextStep = () => {
    // 如果在最後一頁等待狀態，不做任何事（已經是最後一頁）
    if (isLastPageWaiting) {
      return;
    }

    const currentCard = drawResult.cards.content[currentCardIndex];
    const interpretationSegments = currentCard?.interpretation?.split('|').map(s => s.trim()).filter(s => s) || [];
    const totalPages = interpretationSegments.length;

    if (interpretationPage < totalPages - 1) {
      // 還有下一頁解釋
      setInterpretationPage(p => p + 1);
    } else if (currentCardIndex < drawResult.cards.content.length - 1) {
      // 進入下一張卡牌
      setCurrentCardIndex(idx => idx + 1);
      setInterpretationPage(0);
    } else {
      // 最後一張牌的最後一頁：有 AI 則先 AI 解說，否則有推薦則推薦頁，否則等待
      if (ai_interpretation?.ai_is_active && onAiSubmit) {
        setShowAiInputScreen(true);
      } else if (recommended_item || recommended_person) {
        setShowRecommendedPage(true);
      } else {
        setIsLastPageWaiting(true);
      }
    }
  };

  // 上一步（第一張牌第一頁時不可用）
  const handlePrevStep = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentCardIndex === 0 && interpretationPage === 0) return;
    if (interpretationPage > 0) {
      setInterpretationPage(p => p - 1);
    } else {
      const prevCard = drawResult.cards.content[currentCardIndex - 1];
      const prevPages = prevCard?.interpretation?.split('|').map(s => s.trim()).filter(s => s).length || 1;
      setCurrentCardIndex(idx => idx - 1);
      setInterpretationPage(prevPages - 1);
    }
  };

  // 有 userQuestion 時自動呼叫 AI
  useEffect(() => {
    if (!allCardsDrawn || !showAiInputScreen || !ai_interpretation?.ai_is_active || !onAiSubmit) return;
    const q = userQuestion?.trim();
    if (!q) return;
    let cancelled = false;
    setAiSubmitting(true);
    const sessionId = drawResult.session_id ?? (drawResult.form_data?.session_id as number);
    if (!sessionId) return;
    onAiSubmit({ session_id: sessionId, note: q })
      .then((r) => {
        if (cancelled) return;
        if (r?.success) {
          setAiResultText(r.data?.interpretation || 'AI 解讀完成');
          setShowAiInputScreen(false);
          setShowAiResultScreen(true);
        } else if (r?.need_addon) {
          // 需加購，addonInfo 由 CardDraw 設定
        } else {
          showError('AI 解讀失敗，請稍後再試');
        }
      })
      .catch(() => { if (!cancelled) showError('網路錯誤，請稍後再試'); })
      .finally(() => { if (!cancelled) setAiSubmitting(false); });
    return () => { cancelled = true; };
  }, [allCardsDrawn, showAiInputScreen, userQuestion, ai_interpretation?.ai_is_active, onAiSubmit, drawResult.session_id, drawResult.form_data?.session_id]);

  // ===== AI 加購彈窗（共用區塊）=====
  const renderAddonModal = () => {
    if (!addonInfo || !onAddonPurchase) return null;
    const coinsPerTwd = addonMemberCard?.coins_per_twd || 0;
    const totalCoinsNeeded = Math.ceil(addonInfo.price * coinsPerTwd);
    const userCoins = addonMemberCard?.coins || 0;
    const canAfford = userCoins >= totalCoinsNeeded;
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl p-6 max-w-sm w-full border border-cyan-400/20 shadow-xl">
          <div className="flex flex-col items-center mb-4">
            <div className="w-14 h-14 rounded-full bg-amber-500/20 flex items-center justify-center mb-3">
              <AlertCircle className="w-8 h-8 text-amber-400" />
            </div>
            <h3 className="text-lg font-bold text-white">需要加購 AI 解釋</h3>
            <p className="text-cyan-300/80 text-sm mt-1">
              {addonInfo.price > 0 ? `此次解讀需使用${COIN_LABEL}購買` : '請先加購 AI 解釋'}
            </p>
          </div>
          {addonMemberCard && coinsPerTwd > 0 && (
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 mb-4">
              <div className="flex items-center gap-2 text-amber-400 text-sm font-medium mb-3">
                <Coins className="w-4 h-4" />
                使用{COIN_LABEL}購買
              </div>
              <div className="flex justify-between text-sm mb-3">
                <div>
                  <p className="text-white font-medium">AI 深度解析</p>
                  <p className="text-cyan-300/80 text-xs">NT$ {addonInfo.price}</p>
                </div>
                <div className="text-right">
                  <p className="text-amber-400 font-semibold">{totalCoinsNeeded.toLocaleString()} {COIN_LABEL}</p>
                  <p className="text-cyan-300/80 text-xs">餘額：{userCoins.toLocaleString()}</p>
                </div>
              </div>
              {canAfford ? (
                <button
                  type="button"
                  onClick={async () => {
                    setAddonPurchasing(true);
                    try {
                      const r = await onAddonPurchase(aiQuestion.trim() || userQuestion || '');
                      if (r?.interpretation) {
                        setAiResultText(r.interpretation);
                        setShowAiInputScreen(false);
                        setShowAiResultScreen(true);
                      }
                    } finally {
                      setAddonPurchasing(false);
                    }
                  }}
                  disabled={addonPurchasing}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addonPurchasing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      購買中...
                    </>
                  ) : (
                    <>
                      <Coins className="w-4 h-4" />
                      使用 {totalCoinsNeeded.toLocaleString()} {COIN_LABEL} 購買
                    </>
                  )}
                </button>
              ) : (
                <p className="text-cyan-300/80 text-sm text-center">
                  {COIN_LABEL}不足（需要 {totalCoinsNeeded.toLocaleString()}，餘額 {userCoins.toLocaleString()}）
                </p>
              )}
            </div>
          )}
          {!addonMemberCard && (
            <div className="rounded-xl bg-cyan-500/10 border border-cyan-400/20 p-4 flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-cyan-300 text-sm">載入{COIN_LABEL}資訊...</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ===== AI 輸入畫面（無 userQuestion 時顯示）=====
  if (allCardsDrawn && showAiInputScreen && ai_interpretation?.ai_is_active && onAiSubmit) {
    if (userQuestion?.trim()) {
      return (
        <>
          <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 flex flex-col justify-center p-6">
            <div className="flex items-center justify-center gap-2 text-cyan-400/90">
              <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <span>AI 解讀中...</span>
            </div>
          </div>
          {renderAddonModal()}
        </>
      );
    }
    const handleAiSubmit = async () => {
      const q = aiQuestion.trim();
      if (!q) { showError('請輸入想要詢問的內容'); return; }
      setAiSubmitting(true);
      try {
        const sessionId = drawResult.session_id ?? (drawResult.form_data?.session_id as number);
        if (!sessionId) { showError('缺少 session_id'); setAiSubmitting(false); return; }
        const r = await onAiSubmit({ session_id: sessionId, note: q });
        if (r?.success) {
          setAiResultText(r.data?.interpretation || 'AI 解讀完成');
          setShowAiInputScreen(false);
          setShowAiResultScreen(true);
        } else if (r?.need_addon) {
          // 需加購，addonInfo 由 CardDraw 設定，會顯示加購彈窗
        } else {
          showError('AI 解讀失敗，請稍後再試');
        }
      } catch {
        showError('網路錯誤，請稍後再試');
      } finally {
        setAiSubmitting(false);
      }
    };
    return (
      <>
        <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 flex flex-col overflow-y-auto">
          <div className="flex-1 flex flex-col justify-center p-6 max-w-lg mx-auto w-full">
            <h3 className="text-lg font-semibold text-cyan-400/90 text-center mb-4">請輸入想要詢問的內容</h3>
            <textarea
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
              placeholder="在此輸入您的問題，AI 將為您解讀..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-cyan-400/20 text-white placeholder-cyan-400/40 focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 outline-none resize-none text-sm"
              disabled={aiSubmitting}
            />
            <button
              type="button"
              onClick={handleAiSubmit}
              disabled={aiSubmitting || !aiQuestion.trim()}
              className="mt-4 w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center justify-center gap-2"
            >
              {aiSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  AI 解讀中...
                </>
              ) : (
                '送出'
              )}
            </button>
          </div>
        </div>
        {renderAddonModal()}
      </>
    );
  }

  // ===== AI 解說結果畫面（點擊後進入推薦頁或完成）=====
  if (allCardsDrawn && showAiResultScreen) {
    const hasRecommended = !!(recommended_item || recommended_person);
    return (
      <div
        className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 flex flex-col overflow-y-auto cursor-pointer"
        onClick={() => {
          if (hasRecommended) {
            setShowAiResultScreen(false);
            setShowRecommendedPage(true);
          } else {
            setIsLastPageWaiting(true);
          }
        }}
      >
        <div className="flex-1 flex flex-col p-6 max-w-lg mx-auto w-full">
          <h3 className="text-lg font-semibold text-cyan-400/90 text-center mb-4">AI 解讀</h3>
          <div className="flex-1 p-4 rounded-xl bg-white/5 border border-cyan-400/20">
            <p className="text-cyan-100 text-sm leading-relaxed whitespace-pre-wrap">{aiResultText}</p>
          </div>
          <p className="text-cyan-400/60 text-xs text-center mt-4">
            {hasRecommended ? '點擊畫面前往推薦' : '點擊完成占卜'}
          </p>
        </div>
      </div>
    );
  }

  // ===== 推薦頁（最後一張後，有推薦商品/推薦人時顯示）=====
  if (allCardsDrawn && showRecommendedPage && (recommended_item || recommended_person)) {
    const itemImg = recommended_item?.image_url || recommended_item?.thumbnail_url;
    const personImg = recommended_person?.image_url;
    const handleBack = () => {
      setShowRecommendedPage(false);
      if (ai_interpretation?.ai_is_active && onAiSubmit) {
        setShowAiResultScreen(true);
      }
    };
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 flex flex-col overflow-y-auto">
        <div className="flex-1 flex flex-col p-4 sm:p-6 max-w-lg mx-auto w-full">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-1.5 text-cyan-400/90 hover:text-cyan-300 text-sm"
            >
              <ChevronLeft size={18} />
              上一步
            </button>
            <h3 className="text-lg font-semibold text-cyan-400/90 flex-1 text-center -ml-12">為你推薦</h3>
            <div className="w-16" />
          </div>

          {/* 上方：推薦商品 - 大圖為主 */}
          {recommended_item && (
            <button
              type="button"
              onClick={() => navigate(getRecommendedItemShopPath(recommended_item, { openCart: true }))}
              className="w-full rounded-xl overflow-hidden bg-white/5 border border-cyan-400/20 hover:bg-white/10 transition-colors text-left"
            >
              <div className="w-full aspect-[4/3] bg-white/5">
                {itemImg ? (
                  <img src={itemImg} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-cyan-400/30">
                    <Star size={48} />
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium line-clamp-2 text-sm leading-snug">{recommended_item.name}</p>
                  <p className="text-cyan-300 text-sm mt-1">NT$ {recommended_item.base_price}</p>
                </div>
                <ChevronRight className="text-cyan-400/70 flex-shrink-0" size={20} />
              </div>
            </button>
          )}

          {/* 區隔：推薦老師區塊 */}
          {recommended_person && (
            <div className="mt-6 pt-5 border-t border-cyan-400/15">
              <p className="text-cyan-400/60 text-xs font-medium mb-3">推薦老師</p>
              <button
                type="button"
                onClick={() => navigate(`/client/provider/${recommended_person.slug}`)}
                className="w-full flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-cyan-400/10 transition-colors text-left"
              >
                <div className="w-14 h-14 flex-shrink-0 rounded-full overflow-hidden bg-white/10 ring-2 ring-cyan-400/20">
                  {personImg ? (
                    <img src={personImg} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-cyan-400/30">
                      <Star size={24} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm">{recommended_person.name}</p>
                </div>
                <ChevronRight className="text-cyan-400/60 flex-shrink-0" size={20} />
              </button>
            </div>
          )}

          <p className="text-cyan-400/60 text-xs text-center mt-5">點擊前往查看</p>
        </div>
      </div>
    );
  }

  // ===== 結果畫面（所有牌都抽完）- 點擊任意地方前進 =====
  if (allCardsDrawn) {
    const currentCard = drawResult.cards.content[currentCardIndex];
    const interpretationSegments = currentCard?.interpretation?.split('|').map(s => s.trim()).filter(s => s) || [];
    const totalPages = interpretationSegments.length;
    const currentSegment = interpretationSegments[interpretationPage] || '';
    const totalCards = drawResult.cards.content.length;

    // 計算總步數：每張牌的解釋頁數總和
    const totalSteps = drawResult.cards.content.reduce((sum, card) => {
      const pages = card.interpretation?.split('|').map(s => s.trim()).filter(s => s).length || 1;
      return sum + pages;
    }, 0);

    // 計算當前步數（從 0 開始）
    let currentStep = 0;
    for (let i = 0; i < currentCardIndex; i++) {
      const pages = drawResult.cards.content[i].interpretation?.split('|').map(s => s.trim()).filter(s => s).length || 1;
      currentStep += pages;
    }
    currentStep += interpretationPage; // 不加 1，讓索引從 0 開始

    return (
      <div
        className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 flex flex-col overflow-hidden cursor-pointer relative"
        onClick={handleNextStep}
      >
        {/* 卡牌進度指示 */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between">
            <div onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={currentCardIndex === 0 && interpretationPage === 0}
                className={`flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg transition-colors ${
                  currentCardIndex === 0 && interpretationPage === 0
                    ? 'text-cyan-400/30 cursor-not-allowed'
                    : 'text-cyan-400 hover:bg-cyan-400/10'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                上一步
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-px w-8 bg-gradient-to-r from-transparent to-cyan-400/50"></div>
              <p className="text-cyan-400 text-sm tracking-wider">
                第 {currentCardIndex + 1} / {totalCards} 張牌
              </p>
              <div className="h-px w-8 bg-gradient-to-l from-transparent to-cyan-400/50"></div>
            </div>
            <div className="w-16" />
          </div>
        </div>

        {/* 當前卡牌大圖 */}
        <div className="px-4 py-4 flex justify-center">
          <div
            className="h-48 md:h-56 rounded-xl shadow-lg overflow-hidden border-4 border-cyan-400 ring-4 ring-cyan-400/30"
            style={{ aspectRatio: cardAspectRatio }}
          >
            <img
              src={currentCard.image_url}
              alt={currentCard.card_title}
              className="w-full h-full object-cover scale-110"
              onError={(e) => {
                (e.target as HTMLImageElement).src = cardBackImage;
              }}
            />
          </div>
        </div>

        {/* 說明區域 */}
        <div className="flex-1 flex flex-col px-4 py-2 min-h-0">
          <div className="max-w-lg mx-auto w-full bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 flex flex-col flex-1 min-h-0 border border-cyan-400/20">
            {currentCard.position_title && (
              <div className="text-center mb-4 flex-shrink-0">
                <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 text-cyan-300 rounded-full text-sm font-medium border border-cyan-400/30">
                  {currentCard.position_title}
                </span>
              </div>
            )}

            <h3 className="text-xl font-bold text-white text-center mb-3 flex-shrink-0">{currentCard.card_title}</h3>

            {currentCard.position_desc && (
              <p className="text-blue-300 text-sm text-center mb-4 flex-shrink-0">{currentCard.position_desc}</p>
            )}

            {currentCard.interpretation ? (
              <div className="p-4 bg-slate-900/50 rounded-xl border border-cyan-400/10 flex flex-col flex-1 min-h-0">
                <div className="flex-1 overflow-y-auto min-h-0">
                  <p className="text-blue-100 text-sm leading-relaxed whitespace-pre-wrap">
                    {totalPages > 1 ? currentSegment : currentCard.interpretation}
                  </p>
                </div>

                {/* 底部提示 */}
                <div className="flex items-center justify-center pt-3 mt-3 border-t border-cyan-400/20 flex-shrink-0">
                  <span className={`text-xs ${isLastPageWaiting ? 'text-cyan-300 font-medium animate-pulse' : 'text-cyan-400/60'}`}>
                    {isLastPageWaiting ? '✨ 點擊完成占卜' : '點擊畫面任意處繼續'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-900/50 rounded-xl border border-cyan-400/10 flex flex-col flex-1 min-h-0">
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-blue-400/60 text-sm">此牌暫無詳細解釋</p>
                </div>
                <div className="flex items-center justify-center pt-3 mt-3 border-t border-cyan-400/20 flex-shrink-0">
                  <span className={`text-xs ${isLastPageWaiting ? 'text-cyan-300 font-medium animate-pulse' : 'text-cyan-400/60'}`}>
                    {isLastPageWaiting ? '✨ 點擊完成占卜' : '點擊畫面任意處繼續'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 底部進度指示 - 下方點點 */}
        <div className="p-4 border-t border-cyan-400/10">
          <div className="flex justify-center gap-3">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div
                key={index}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  isLastPageWaiting
                    ? 'bg-cyan-400 shadow-lg shadow-cyan-400/50' // 最後一頁全亮
                    : index < currentStep
                    ? 'bg-cyan-400 shadow-lg shadow-cyan-400/50' // 已完成
                    : index === currentStep
                    ? 'bg-cyan-400 shadow-lg shadow-cyan-400/50 scale-125' // 當前（也亮著）
                    : 'bg-slate-600' // 未完成
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ===== 抽牌畫面 - 規矩的橫向滾動牌組（同 base） =====
  const currentPosition = getCardForPosition(cardsDrawnCount);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="h-px w-8 bg-gradient-to-r from-transparent to-cyan-400/50"></div>
          <p className="text-cyan-400 text-sm tracking-wider">
            第 {cardsDrawnCount + 1} / {totalCardsNeeded} 張
          </p>
          <div className="h-px w-8 bg-gradient-to-l from-transparent to-cyan-400/50"></div>
        </div>
        {currentPosition && (
          <>
            <h2 className="text-2xl font-bold text-white mb-1">
              {currentPosition.position_title}
            </h2>
            {currentPosition.position_desc && (
              <p className="text-blue-300 text-sm">{currentPosition.position_desc}</p>
            )}
          </>
        )}
      </div>

      {/* 抽牌進度預覽 - 使用寬度+aspect-ratio 確保比例正確 */}
      {totalCardsNeeded > 0 && (
        <div className="px-4 mb-4">
          <div className="flex justify-center gap-4 flex-wrap">
            {Array.from({ length: totalCardsNeeded }).map((_, idx) => {
              const card = idx < cardsDrawnCount ? getCardForPosition(idx) : null;
              const isDrawn = idx < cardsDrawnCount;

              return isDrawn && card ? (
                <div
                  key={idx}
                  className="w-24 md:w-28 rounded-xl shadow-lg border-2 border-cyan-400/40 overflow-hidden transition-all duration-300"
                  style={{ aspectRatio: cardAspectRatio }}
                >
                  <img
                    src={card.image_url}
                    alt={card.card_title}
                    className="w-full h-full object-cover scale-110"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = cardBackImage;
                    }}
                  />
                </div>
              ) : (
                <div
                  key={idx}
                  className="w-24 md:w-28 rounded-xl border-2 border-dashed border-blue-400/30 flex items-center justify-center transition-all duration-300 bg-slate-800/30"
                  style={{ aspectRatio: cardAspectRatio }}
                >
                  <span className="text-blue-400/40 text-lg">?</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 主要抽牌區域 - 規矩的橫向滾動牌組 */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="relative">
          {canScrollLeft && (
            <button
              onClick={scrollLeft}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-slate-800/50 hover:bg-slate-700/50 backdrop-blur-sm rounded-full flex items-center justify-center text-cyan-400 transition-all border border-cyan-400/30"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {canScrollRight && (
            <button
              onClick={scrollRight}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-slate-800/50 hover:bg-slate-700/50 backdrop-blur-sm rounded-full flex items-center justify-center text-cyan-400 transition-all border border-cyan-400/30"
            >
              <ChevronRight size={24} />
            </button>
          )}

          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-slate-900 to-transparent z-10 pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-slate-900 to-transparent z-10 pointer-events-none"></div>

          <div
            ref={scrollContainerRef}
            className="flex gap-3 overflow-x-auto scrollbar-hide px-16 py-8"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {Array.from({ length: DECK_SIZE }).map((_, deckIndex) => {
              const isDrawn = drawnCardIndices.includes(deckIndex);
              const isFlipping = flippingIndex === deckIndex;
              const drawOrder = drawnCardIndices.indexOf(deckIndex);
              const cardData = drawOrder >= 0 ? getCardForPosition(drawOrder) : null;

              return (
                <div
                  key={deckIndex}
                  onClick={() => handleDeckCardClick(deckIndex)}
                  className={`
                    flex-shrink-0 relative cursor-pointer transition-all duration-500 transform-gpu
                    ${isDrawn && !isFlipping ? 'opacity-0 scale-75 pointer-events-none' : ''}
                    ${isFlipping ? 'z-30 scale-110' : 'hover:-translate-y-4 hover:scale-105'}
                    ${flippingIndex !== null && !isFlipping ? 'opacity-30 scale-95 pointer-events-none' : ''}
                  `}
                  style={{
                    scrollSnapAlign: 'center',
                    perspective: '1000px',
                  }}
                >
                  <div
                    className="relative h-32 md:h-36 transition-transform duration-700"
                    style={{
                      aspectRatio: cardAspectRatio,
                      transformStyle: 'preserve-3d',
                      transform: isFlipping ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    }}
                  >
                    {/* 卡背 */}
                    <div
                      className="absolute inset-0 rounded-xl shadow-xl overflow-hidden border-2 border-cyan-400/30 hover:border-cyan-400/60 transition-colors"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <img
                        src={cardBackImage}
                        alt="卡背"
                        className="w-full h-full object-cover scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent" />
                      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity">
                        <div className="absolute inset-0 bg-gradient-to-t from-cyan-400/20 to-transparent" />
                      </div>
                    </div>

                    {/* 卡面 */}
                    <div
                      className="absolute inset-0 rounded-xl shadow-2xl overflow-hidden border-2 border-cyan-400"
                      style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                      }}
                    >
                      {cardData && (
                        <img
                          src={cardData.image_url}
                          alt={cardData.card_title}
                          className="w-full h-full object-cover scale-110"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = cardBackImage;
                          }}
                        />
                      )}
                      {!cardData && currentPosition && (
                        <img
                          src={currentPosition.image_url}
                          alt={currentPosition.card_title}
                          className="w-full h-full object-cover scale-110"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = cardBackImage;
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 提示文字 */}
        <div className="text-center mt-6 px-4">
          <p className="text-blue-100 text-lg">
            {flippingIndex !== null ? '揭示命運...' : '請選擇一張牌'}
          </p>
          <p className="text-blue-400/60 text-sm mt-1">
            {flippingIndex === null ? '左右滑動瀏覽牌組，點擊選擇' : ''}
          </p>
        </div>
      </div>

      {/* 底部進度指示 */}
      <div className="p-4 border-t border-cyan-400/10">
        <div className="flex justify-center gap-3">
          {Array.from({ length: totalCardsNeeded }).map((_, index) => (
            <div
              key={index}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                index < cardsDrawnCount
                  ? 'bg-cyan-400 shadow-lg shadow-cyan-400/50'
                  : index === cardsDrawnCount
                  ? 'bg-blue-400 animate-pulse scale-125'
                  : 'bg-slate-600'
              }`}
            />
          ))}
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default Flex02Template;
