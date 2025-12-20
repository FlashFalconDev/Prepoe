import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { CardDrawTemplateProps, DrawnCard } from '../types';

// 牌組數量（用於展示的蓋牌數量）
const DECK_SIZE = 15;

const BaseTemplate: React.FC<CardDrawTemplateProps> = ({
  drawResult,
  cardBackImage,
  cardAspectRatio,
  onRestart,
  drawnCardIndices,
  setDrawnCardIndices,
  flippingIndex,
  setFlippingIndex,
  allCardsDrawn,
  setAllCardsDrawn,
}) => {
  // 結果頁面狀態
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [interpretationPage, setInterpretationPage] = useState(0);

  // 滾動相關
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

  // 滾動到左邊
  const scrollLeft = () => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  // 滾動到右邊
  const scrollRight = () => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  // 監聽滾動
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollButtons);
      checkScrollButtons();
      return () => container.removeEventListener('scroll', checkScrollButtons);
    }
  }, [allCardsDrawn]);

  // 點擊牌組中的卡牌
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

  // 取得當前要抽的卡牌資料
  const getCardForPosition = (positionIndex: number): DrawnCard | null => {
    if (positionIndex >= drawResult.cards.content.length) {
      return null;
    }
    return drawResult.cards.content[positionIndex];
  };

  // 處理重新開始
  const handleRestart = () => {
    setSelectedCardIndex(null);
    setInterpretationPage(0);
    onRestart();
  };

  // 所有牌都抽完 - 結果畫面
  if (allCardsDrawn) {
    const selectedCard = selectedCardIndex !== null ? drawResult.cards.content[selectedCardIndex] : null;

    // 計算解釋的分頁內容
    const interpretationSegments = selectedCard?.interpretation?.split('|').map(s => s.trim()).filter(s => s) || [];
    const totalPages = interpretationSegments.length;
    const currentSegment = interpretationSegments[interpretationPage] || '';

    // 處理卡牌選擇
    const handleCardSelect = (idx: number) => {
      if (selectedCardIndex === idx) {
        setSelectedCardIndex(null);
      } else {
        setSelectedCardIndex(idx);
        setInterpretationPage(0);
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-indigo-900 to-purple-950 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-yellow-400/50"></div>
            <Sparkles className="text-yellow-400" size={24} />
            <h1 className="text-2xl font-bold text-white">抽牌結果</h1>
            <Sparkles className="text-yellow-400" size={24} />
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-yellow-400/50"></div>
          </div>
          <p className="text-purple-300 text-sm">共抽取 {drawResult.cards.content.length} 張牌</p>
        </div>

        {/* 卡牌預覽區 */}
        <div className="px-4 mb-4">
          <div className="flex justify-center gap-4 flex-wrap">
            {drawResult.cards.content.map((card, idx) => (
              <div
                key={idx}
                onClick={() => handleCardSelect(idx)}
                className={`h-36 md:h-44 rounded-xl shadow-lg overflow-hidden transition-all duration-300 cursor-pointer
                  ${selectedCardIndex === idx
                    ? 'border-4 border-yellow-400 ring-4 ring-yellow-400/30 scale-105'
                    : 'border-2 border-yellow-400/50 hover:border-yellow-400 hover:scale-105'
                  }`}
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
            ))}
          </div>
        </div>

        {/* 說明區域 */}
        <div className="flex-1 flex flex-col px-4 py-2 min-h-0">
          {selectedCard ? (
            <div className="max-w-lg mx-auto w-full bg-white/10 backdrop-blur-sm rounded-2xl p-6 flex flex-col flex-1 min-h-0">
              {selectedCard.position_title && (
                <div className="text-center mb-4 flex-shrink-0">
                  <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 text-yellow-300 rounded-full text-sm font-medium border border-yellow-400/30">
                    {selectedCard.position_title}
                  </span>
                </div>
              )}

              <h3 className="text-xl font-bold text-white text-center mb-3 flex-shrink-0">{selectedCard.card_title}</h3>

              {selectedCard.position_desc && (
                <p className="text-purple-300 text-sm text-center mb-4 flex-shrink-0">{selectedCard.position_desc}</p>
              )}

              {selectedCard.interpretation ? (
                <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex flex-col flex-1 min-h-0">
                  <div className="flex-1 overflow-y-auto min-h-0">
                    <p className="text-purple-200 text-sm leading-relaxed whitespace-pre-wrap">
                      {totalPages > 1 ? currentSegment : selectedCard.interpretation}
                    </p>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/10 flex-shrink-0">
                      <button
                        onClick={() => setInterpretationPage(p => Math.max(0, p - 1))}
                        disabled={interpretationPage === 0}
                        className={`px-4 py-1.5 rounded-lg text-sm transition-all ${
                          interpretationPage === 0
                            ? 'text-purple-500 cursor-not-allowed'
                            : 'text-purple-200 hover:bg-white/10'
                        }`}
                      >
                        上一步
                      </button>

                      <span className="text-purple-400 text-xs">
                        {interpretationPage + 1} / {totalPages}
                      </span>

                      <button
                        onClick={() => setInterpretationPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={interpretationPage >= totalPages - 1}
                        className={`px-4 py-1.5 rounded-lg text-sm transition-all ${
                          interpretationPage >= totalPages - 1
                            ? 'text-purple-500 cursor-not-allowed'
                            : 'text-purple-200 hover:bg-white/10'
                        }`}
                      >
                        下一步
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center flex items-center justify-center flex-1">
                  <p className="text-purple-400 text-sm">此牌暫無詳細解釋</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="text-yellow-400" size={28} />
              </div>
              <p className="text-purple-200 text-lg mb-2">點擊上方卡牌查看說明</p>
              <p className="text-purple-400 text-sm">選擇任意一張牌了解詳細牌義</p>
            </div>
          )}
        </div>

        {/* 底部操作按鈕 */}
        <div className="p-4 border-t border-white/5">
          <div className="flex justify-center">
            <button
              onClick={handleRestart}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-xl transition-all shadow-lg hover:shadow-purple-500/25"
            >
              <RotateCcw size={20} />
              重新抽牌
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 當前要抽的位置資訊
  const currentPosition = getCardForPosition(cardsDrawnCount);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-indigo-900 to-purple-950 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="h-px w-8 bg-gradient-to-r from-transparent to-purple-400/50"></div>
          <p className="text-purple-400 text-sm tracking-wider">
            第 {cardsDrawnCount + 1} / {totalCardsNeeded} 張
          </p>
          <div className="h-px w-8 bg-gradient-to-l from-transparent to-purple-400/50"></div>
        </div>
        {currentPosition && (
          <>
            <h2 className="text-2xl font-bold text-white mb-1">
              {currentPosition.position_title}
            </h2>
            {currentPosition.position_desc && (
              <p className="text-purple-300 text-sm">{currentPosition.position_desc}</p>
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
                  className="h-36 md:h-44 rounded-xl shadow-lg border-2 border-yellow-400/50 overflow-hidden transition-all duration-300"
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
                  className="h-36 md:h-44 rounded-xl border-2 border-dashed border-purple-400/30 flex items-center justify-center transition-all duration-300"
                  style={{ aspectRatio: cardAspectRatio }}
                >
                  <span className="text-purple-400/50 text-lg">?</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 主要抽牌區域 */}
      <div className="flex-1 flex flex-col justify-center">
        {/* 可滾動的牌組區域 */}
        <div className="relative">
          {canScrollLeft && (
            <button
              onClick={scrollLeft}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {canScrollRight && (
            <button
              onClick={scrollRight}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all"
            >
              <ChevronRight size={24} />
            </button>
          )}

          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-purple-900 to-transparent z-10 pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-purple-900 to-transparent z-10 pointer-events-none"></div>

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
                      className="absolute inset-0 rounded-xl shadow-xl overflow-hidden border-2 border-yellow-400/30 hover:border-yellow-400/60 transition-colors"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <img
                        src={cardBackImage}
                        alt="卡背"
                        className="w-full h-full object-cover scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity">
                        <div className="absolute inset-0 bg-gradient-to-t from-yellow-400/20 to-transparent" />
                      </div>
                    </div>

                    {/* 卡面 */}
                    <div
                      className="absolute inset-0 rounded-xl shadow-2xl overflow-hidden border-2 border-yellow-400"
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
          <p className="text-purple-200 text-lg">
            {flippingIndex !== null ? '揭示命運...' : '請選擇一張牌'}
          </p>
          <p className="text-purple-400 text-sm mt-1">
            {flippingIndex === null ? '左右滑動瀏覽牌組，點擊選擇' : ''}
          </p>
        </div>
      </div>

      {/* 底部進度指示 */}
      <div className="p-4 border-t border-white/5">
        <div className="flex justify-center gap-3">
          {Array.from({ length: totalCardsNeeded }).map((_, index) => (
            <div
              key={index}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                index < cardsDrawnCount
                  ? 'bg-yellow-400 shadow-lg shadow-yellow-400/50'
                  : index === cardsDrawnCount
                  ? 'bg-purple-400 animate-pulse scale-125'
                  : 'bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>

      {/* 隱藏滾動條的樣式 */}
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

export default BaseTemplate;
