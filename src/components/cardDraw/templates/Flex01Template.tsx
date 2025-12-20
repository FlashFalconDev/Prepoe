import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { CardDrawTemplateProps, DrawnCard } from '../types';

// 牌組數量（用於展示的蓋牌數量）
const DECK_SIZE = 15;

/**
 * Flex01 模板 - 深藍神秘風格
 * 特點：
 * 1. 深藍色漸層背景（區別於 base 的紫色）
 * 2. 單向流程 - 沒有重新抽牌
 * 3. 解釋只能往前，不能回頭
 * 4. 結果頁不顯示標題文字
 */
const Flex01Template: React.FC<CardDrawTemplateProps> = ({
  drawResult,
  cardBackImage,
  cardAspectRatio,
  drawnCardIndices,
  setDrawnCardIndices,
  flippingIndex,
  setFlippingIndex,
  allCardsDrawn,
  setAllCardsDrawn,
}) => {
  // 結果頁面狀態 - 自動從第一張開始，不讓使用者選擇
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [interpretationPage, setInterpretationPage] = useState(0);
  const [isLastPageWaiting, setIsLastPageWaiting] = useState(false); // 最後一頁等待狀態

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
      // 最後一張牌的最後一頁，進入等待狀態
      setIsLastPageWaiting(true);
    }
  };

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
          <div className="flex items-center justify-center gap-2">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-cyan-400/50"></div>
            <p className="text-cyan-400 text-sm tracking-wider">
              第 {currentCardIndex + 1} / {totalCards} 張牌
            </p>
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-cyan-400/50"></div>
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

  // ===== 抽牌畫面 =====
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

      {/* 抽牌進度預覽 */}
      {totalCardsNeeded > 0 && (
        <div className="px-4 mb-4">
          <div className="flex justify-center gap-4 flex-wrap">
            {Array.from({ length: totalCardsNeeded }).map((_, idx) => {
              const card = idx < cardsDrawnCount ? getCardForPosition(idx) : null;
              const isDrawn = idx < cardsDrawnCount;

              return isDrawn && card ? (
                <div
                  key={idx}
                  className="h-36 md:h-44 rounded-xl shadow-lg border-2 border-cyan-400/40 overflow-hidden transition-all duration-300"
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
                  className="h-36 md:h-44 rounded-xl border-2 border-dashed border-blue-400/30 flex items-center justify-center transition-all duration-300 bg-slate-800/30"
                  style={{ aspectRatio: cardAspectRatio }}
                >
                  <span className="text-blue-400/40 text-lg">?</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 主要抽牌區域 */}
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

export default Flex01Template;
