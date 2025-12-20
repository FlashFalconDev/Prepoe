// FlexCarouselView - Flex Carousel 呈現元件（支援卡牌抽取）
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { DrawnCard, CardsData, FlexCarousel, FlexBubble, FlexHeroLayered, CardsLayer } from './types';
import LayeredImageView, { ButtonActionHandlers } from './LayeredImageView';

// LINE Flex Message 內容類型
interface FlexIcon {
  type: 'icon';
  size?: string;
  url: string;
}

interface FlexText {
  type: 'text';
  text: string;
  weight?: 'regular' | 'bold';
  size?: string;
  color?: string;
  wrap?: boolean;
  margin?: string;
  flex?: number;
  align?: string;
}

interface FlexBox {
  type: 'box';
  layout: 'vertical' | 'horizontal' | 'baseline';
  contents: (FlexIcon | FlexText | FlexBox)[];
  content?: string;
  spacing?: string;
  paddingAll?: string;
  margin?: string;
  flex?: number;
}

// 將 LINE Flex size 轉為 Tailwind class
const getSizeClass = (size?: string): string => {
  switch (size) {
    case 'xxs': return 'text-xs';
    case 'xs': return 'text-sm';
    case 'sm': return 'text-base';
    case 'md': return 'text-lg';
    case 'lg': return 'text-xl';
    case 'xl': return 'text-2xl';
    case 'xxl': return 'text-3xl';
    case '3xl': return 'text-4xl';
    case '4xl': return 'text-5xl';
    case '5xl': return 'text-6xl';
    default: return 'text-lg';
  }
};

// 渲染 Flex 內容
const renderFlexContent = (content: FlexIcon | FlexText | FlexBox, key: number): React.ReactNode => {
  if (content.type === 'icon') {
    const isGoldStar = content.url.includes('gold_star');
    const isGrayStar = content.url.includes('gray_star');

    if (isGoldStar || isGrayStar) {
      return (
        <Star
          key={key}
          size={content.size === 'xs' ? 16 : content.size === 'sm' ? 20 : 24}
          className={isGoldStar ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 fill-gray-300'}
        />
      );
    }

    return (
      <img
        key={key}
        src={content.url}
        alt=""
        className={`inline-block ${content.size === 'xs' ? 'w-4 h-4' : content.size === 'sm' ? 'w-5 h-5' : 'w-6 h-6'}`}
      />
    );
  }

  if (content.type === 'text') {
    const alignClass = content.align === 'center' ? 'text-center w-full' : content.align === 'end' ? 'text-right' : '';

    return (
      <span
        key={key}
        className={`
          ${getSizeClass(content.size)}
          ${content.weight === 'bold' ? 'font-bold' : 'font-normal'}
          ${content.wrap ? 'break-words' : 'whitespace-nowrap'}
          ${content.margin === 'md' ? 'ml-3' : content.margin === 'sm' ? 'ml-2' : ''}
          ${alignClass}
        `}
        style={{
          color: content.color || 'inherit',
          flex: content.flex !== undefined ? content.flex : undefined
        }}
      >
        {content.text}
      </span>
    );
  }

  if (content.type === 'box') {
    const layoutClass = content.layout === 'vertical'
      ? 'flex flex-col'
      : content.layout === 'horizontal'
      ? 'flex flex-row'
      : 'flex flex-row items-baseline';

    const spacingClass = content.spacing === 'sm'
      ? 'gap-2'
      : content.spacing === 'md'
      ? 'gap-3'
      : content.spacing === 'lg'
      ? 'gap-4'
      : '';

    return (
      <div
        key={key}
        className={`${layoutClass} ${spacingClass}`}
        style={{
          padding: content.paddingAll || undefined,
          flex: content.flex !== undefined ? content.flex : undefined
        }}
      >
        {content.contents.map((item, idx) => renderFlexContent(item, idx))}
      </div>
    );
  }

  return null;
};

// 預設卡背圖片
const DEFAULT_CARD_BACK = 'https://fflinebotstatic.s3.ap-northeast-1.amazonaws.com/default_records/card_style/default_card_back.png';

// 牌組數量（增加到 25 張，確保左右不會露出不完整的牌）
const DECK_SIZE = 25;

// 抽卡區元件 Props
interface CardDrawAreaProps {
  cards: DrawnCard[];
  cardBackImage: string;
  onAllCardsDrawn: () => void;
  onComplete: () => void;
  isLastBubble?: boolean; // 是否是 flex carousel 的最後一個 bubble
  // 整個 flex carousel 的進度資訊
  totalFlexSteps?: number; // 整個 flex 的總步數
  currentFlexStepBase?: number; // 當前 bubble 之前的步數
  // 背景透明（用於 layered hero 時，讓底圖顯示）
  transparentBackground?: boolean;
}

// 抽卡區元件 - 完整的抽卡流程
const CardDrawArea: React.FC<CardDrawAreaProps> = ({
  cards,
  cardBackImage,
  onAllCardsDrawn,
  onComplete,
  isLastBubble = false,
  totalFlexSteps,
  currentFlexStepBase = 0,
  transparentBackground = false,
}) => {
  // 背景樣式：透明或預設漸層
  const bgClass = transparentBackground
    ? 'bg-transparent'
    : 'bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900';
  const [phase, setPhase] = useState<'drawing' | 'showing' | 'completed'>('drawing');
  const [drawnCardIndices, setDrawnCardIndices] = useState<number[]>([]);
  const [flippingIndex, setFlippingIndex] = useState<number | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [interpretationPage, setInterpretationPage] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(true);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [cardAspectRatio, setCardAspectRatio] = useState<string>('3/4');
  const [centerCardIndex, setCenterCardIndex] = useState(Math.floor((DECK_SIZE - 1) / 2));

  const totalCardsNeeded = cards.length;
  const cardsDrawnCount = drawnCardIndices.length;

  useEffect(() => {
    if (cards.length > 0) {
      const firstCard = cards[0];
      const img = new Image();
      img.onload = () => {
        const ratio = `${img.naturalWidth}/${img.naturalHeight}`;
        setCardAspectRatio(ratio);
      };
      img.src = firstCard.image_url;

      cards.slice(1).forEach((card) => {
        const preloadImg = new Image();
        preloadImg.src = card.image_url;
      });
    }
  }, [cards]);

  const checkScrollButtons = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 10);

      // 計算目前在視窗中央的卡牌
      const containerRect = container.getBoundingClientRect();
      const containerCenter = containerRect.left + containerRect.width / 2;
      const cards = container.querySelectorAll('[data-deck-card]');
      let closestIndex = Math.floor((DECK_SIZE - 1) / 2);
      let closestDistance = Infinity;

      cards.forEach((card, index) => {
        const cardRect = card.getBoundingClientRect();
        const cardCenter = cardRect.left + cardRect.width / 2;
        const distance = Math.abs(cardCenter - containerCenter);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      setCenterCardIndex(closestIndex);
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
      // 初始化時滾動到中間位置
      const middleScroll = (container.scrollWidth - container.clientWidth) / 2;
      container.scrollLeft = middleScroll;
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
            setPhase('showing');
            onAllCardsDrawn();
          }, 500);
        }
        return newIndices;
      });
      setFlippingIndex(null);
    }, 800);
  };

  const getCardForPosition = (positionIndex: number): DrawnCard | null => {
    if (positionIndex >= cards.length) {
      return null;
    }
    return cards[positionIndex];
  };

  // 是否已經到達最後一頁（等待用戶確認完成）- 只有在 isLastBubble 時才會使用
  const [isLastPageWaiting, setIsLastPageWaiting] = useState(false);

  const handleNextStep = () => {
    // 如果已經在最後一頁等待狀態
    if (isLastPageWaiting) {
      // 如果是最後一個 bubble，等待按鈕操作（不自動完成）
      if (isLastBubble) {
        return;
      } else {
        // 不是最後一個 bubble，完成並跳到下一個
        onComplete();
        return;
      }
    }

    const currentCard = cards[currentCardIndex];
    const interpretationSegments = currentCard?.interpretation?.split('|').map(s => s.trim()).filter(s => s) || [];
    const totalPages = interpretationSegments.length;

    if (interpretationPage < totalPages - 1) {
      // 還有更多解釋頁面
      setInterpretationPage(p => p + 1);
    } else if (currentCardIndex < cards.length - 1) {
      // 還有更多卡牌
      setCurrentCardIndex(idx => idx + 1);
      setInterpretationPage(0);
    } else {
      // 到達最後一頁，進入等待狀態並通知完成
      setIsLastPageWaiting(true);
      onComplete(); // 通知 FlexCarouselView 這個 bubble 完成了
    }
  };

  // ===== 解說畫面 - 點擊任意地方前進 =====
  if (phase === 'showing') {
    const currentCard = cards[currentCardIndex];
    const interpretationSegments = currentCard?.interpretation?.split('|').map(s => s.trim()).filter(s => s) || [];
    const totalPages = interpretationSegments.length;
    const currentSegment = interpretationSegments[interpretationPage] || '';
    const totalCards = cards.length;

    // 計算卡牌內的步數：每張牌的解釋頁數總和
    const cardSteps = cards.reduce((sum, card) => {
      const pages = card.interpretation?.split('|').map(s => s.trim()).filter(s => s).length || 1;
      return sum + pages;
    }, 0);

    // 計算當前在卡牌內的步數（從 0 開始）
    let currentCardStep = 0;
    for (let i = 0; i < currentCardIndex; i++) {
      const pages = cards[i].interpretation?.split('|').map(s => s.trim()).filter(s => s).length || 1;
      currentCardStep += pages;
    }
    currentCardStep += interpretationPage; // 不加 1，讓索引從 0 開始

    // 如果有傳入整個 flex 的進度資訊，則使用整個 flex 的進度
    const displayTotalSteps = totalFlexSteps || cardSteps;
    const displayCurrentStep = currentFlexStepBase + currentCardStep;

    // 單張卡牌時放大 1.5 倍
    const isSingleCard = totalCards === 1;
    const cardSizeClass = isSingleCard
      ? 'w-[201px] h-72 md:w-[231px] md:h-[317px]'  // 1.5x: 134*1.5=201, 192*1.5=288(h-72), 154*1.5=231, 211*1.5≈317
      : 'w-[134px] h-48 md:w-[154px] md:h-[211px]';  // 原始大小

    return (
      <div
        className={`h-full w-full ${bgClass} flex flex-col overflow-hidden cursor-pointer relative`}
        onClick={handleNextStep}
      >
        {/* 當前卡牌大圖（與抽牌階段預覽位置一致） */}
        <div className="px-3 pt-16 mb-3 flex justify-center shrink-0">
          <div className={`${cardSizeClass} rounded-xl overflow-hidden shadow-lg`}>
            <img
              src={currentCard.image_url}
              alt={currentCard.card_title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = cardBackImage;
              }}
            />
          </div>
        </div>

        {/* 說明區域 */}
        <div className="flex-1 flex flex-col px-3 py-2 min-h-0 overflow-hidden">
          <div className="w-full bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 flex flex-col flex-1 min-h-0 border border-cyan-400/20">
            {currentCard.position_title && (
              <div className="text-center mb-2 shrink-0">
                <span className="inline-block px-3 py-1 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 text-cyan-300 rounded-full text-xs font-medium border border-cyan-400/30">
                  {currentCard.position_title}
                </span>
              </div>
            )}

            <h3 className="text-lg font-bold text-white text-center mb-2 shrink-0">{currentCard.card_title}</h3>

            {currentCard.position_desc && (
              <p className="text-blue-300 text-xs text-center mb-3 shrink-0">{currentCard.position_desc}</p>
            )}

            {currentCard.interpretation ? (
              <div className="p-3 bg-slate-900/50 rounded-lg border border-cyan-400/10 flex flex-col flex-1 min-h-0">
                <div className="flex-1 overflow-y-auto min-h-0">
                  <p className="text-blue-100 text-sm leading-relaxed whitespace-pre-wrap">
                    {totalPages > 1 ? currentSegment : currentCard.interpretation}
                  </p>
                </div>

                {/* 底部提示 */}
                <div className="flex items-center justify-center pt-2 mt-2 border-t border-cyan-400/20 shrink-0">
                  <span className={`text-xs ${isLastPageWaiting ? 'text-cyan-300 font-medium animate-pulse' : 'text-cyan-400/60'}`}>
                    {isLastPageWaiting
                      ? (isLastBubble ? '✨ 請點擊按鈕繼續' : '⏳ 請稍候...')
                      : '點擊畫面任意處繼續'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-900/50 rounded-lg border border-cyan-400/10 flex flex-col flex-1 min-h-0">
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-blue-400/60 text-sm">此牌暫無詳細解釋</p>
                </div>
                <div className="flex items-center justify-center pt-2 mt-2 border-t border-cyan-400/20 shrink-0">
                  <span className={`text-xs ${isLastPageWaiting ? 'text-cyan-300 font-medium animate-pulse' : 'text-cyan-400/60'}`}>
                    {isLastPageWaiting
                      ? (isLastBubble ? '✨ 請點擊按鈕繼續' : '⏳ 請稍候...')
                      : '點擊畫面任意處繼續'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    );
  }

  // ===== 抽牌畫面 =====
  const currentPosition = getCardForPosition(cardsDrawnCount);

  // 單張卡牌時放大 1.5 倍（抽牌預覽區）
  const isSingleCardDrawing = totalCardsNeeded === 1;
  const previewCardSizeClass = isSingleCardDrawing
    ? 'w-[201px] h-72 md:w-[231px] md:h-[317px]'  // 1.5x
    : 'w-[134px] h-48 md:w-[154px] md:h-[211px]';  // 原始大小

  return (
    <div className={`h-full w-full ${bgClass} flex flex-col overflow-hidden`}>

      {/* 抽牌進度預覽 */}
      {totalCardsNeeded > 0 && (
        <div className="px-3 pt-16 mb-3 shrink-0">
          <div className="flex justify-center gap-3 flex-wrap">
            {Array.from({ length: totalCardsNeeded }).map((_, idx) => {
              const card = idx < cardsDrawnCount ? getCardForPosition(idx) : null;
              const isDrawn = idx < cardsDrawnCount;

              // 已抽出的卡牌
              if (isDrawn && card) {
                return (
                  <div
                    key={idx}
                    className={`${previewCardSizeClass} rounded-xl overflow-hidden shadow-lg`}
                  >
                    <img
                      src={card.image_url}
                      alt={card.card_title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = cardBackImage;
                      }}
                    />
                  </div>
                );
              }

              // 未抽出的佔位
              return (
                <div
                  key={idx}
                  className={`${previewCardSizeClass} rounded-xl border-2 border-dashed border-blue-400/30 flex items-center justify-center bg-slate-800/30`}
                >
                  <span className="text-blue-400/40 text-lg">?</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 主要抽牌區域 */}
      <div className="flex-1 flex flex-col justify-start min-h-0">
        {/* 提示文字（在上下卡牌中間） */}
        <div className="text-center py-12 px-4 shrink-0">
          <p className="text-stone-600 text-lg">
            {flippingIndex !== null ? '揭示命運...' : '左右滑動並依直覺點選一張牌卡'}
          </p>
        </div>

        <div className="relative">
          {canScrollLeft && (
            <button
              onClick={scrollLeft}
              className="absolute left-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-slate-800/50 hover:bg-slate-700/50 backdrop-blur-sm rounded-full flex items-center justify-center text-cyan-400 transition-all border border-cyan-400/30"
            >
              <ChevronLeft size={20} />
            </button>
          )}

          {canScrollRight && (
            <button
              onClick={scrollRight}
              className="absolute right-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-slate-800/50 hover:bg-slate-700/50 backdrop-blur-sm rounded-full flex items-center justify-center text-cyan-400 transition-all border border-cyan-400/30"
            >
              <ChevronRight size={20} />
            </button>
          )}

          {/* 左右漸層遮罩（遮住不完整的牌面） */}
          {!transparentBackground && (
            <>
              <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent z-10 pointer-events-none"></div>
              <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-slate-900 via-slate-900/80 to-transparent z-10 pointer-events-none"></div>
            </>
          )}

          <div
            ref={scrollContainerRef}
            className="flex overflow-x-auto scrollbar-hide pt-4 pb-8 items-end justify-start"
            style={{
              scrollSnapType: 'x mandatory',
              paddingLeft: 'calc(50% - 52px)',  // 置中：視窗一半 - 卡牌寬度一半
              paddingRight: 'calc(50% - 52px)',
            }}
          >
            {Array.from({ length: DECK_SIZE }).map((_, deckIndex) => {
              const isDrawn = drawnCardIndices.includes(deckIndex);
              const isFlipping = flippingIndex === deckIndex;
              const drawOrder = drawnCardIndices.indexOf(deckIndex);
              const cardData = drawOrder >= 0 ? getCardForPosition(drawOrder) : null;

              // 動態中心卡牌效果：只有正中間那張
              const isCenterCard = deckIndex === centerCardIndex;
              const scaleValue = isCenterCard ? 1.15 : 1.0;
              const translateY = isCenterCard ? 12 : 0;

              return (
                <div
                  key={deckIndex}
                  data-deck-card
                  onClick={() => handleDeckCardClick(deckIndex)}
                  className={`
                    flex-shrink-0 relative cursor-pointer
                    ${isDrawn && !isFlipping ? 'opacity-0 pointer-events-none' : ''}
                    ${isFlipping ? 'z-30' : ''}
                    ${flippingIndex !== null && !isFlipping ? 'opacity-30 pointer-events-none' : ''}
                  `}
                  style={{
                    scrollSnapAlign: 'center',
                    // 固定間距：每張牌佔用相同空間，放大不影響佈局
                    width: '104px',  // 卡牌寬度
                    marginRight: '12px',  // 固定間距
                  }}
                >
                  {/* 內層容器處理縮放和位移，不影響外層佈局 */}
                  <div
                    className="transition-transform duration-200 ease-out origin-bottom"
                    style={{
                      transform: isFlipping ? 'none' : `translateY(${translateY}px) scale(${scaleValue})`,
                    }}
                  >
                    <div
                      className="relative h-[138px] md:h-[161px] transition-transform duration-700"
                      style={{
                        aspectRatio: cardAspectRatio,
                        transformStyle: 'preserve-3d',
                        perspective: '1000px',
                        transform: isFlipping ? 'rotateY(180deg)' : 'rotateY(0deg)',
                      }}
                    >
                    {/* 卡背 */}
                    <div
                      className="absolute inset-0 rounded-lg shadow-xl overflow-hidden"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <img
                        src={cardBackImage}
                        alt="卡背"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent" />
                    </div>

                    {/* 卡面 */}
                    <div
                      className="absolute inset-0 rounded-lg shadow-2xl overflow-hidden"
                      style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                      }}
                    >
                      {cardData && (
                        <img
                          src={cardData.image_url}
                          alt={cardData.card_title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = cardBackImage;
                          }}
                        />
                      )}
                      {!cardData && currentPosition && (
                        <img
                          src={currentPosition.image_url}
                          alt={currentPosition.card_title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = cardBackImage;
                          }}
                        />
                      )}
                    </div>
                  </div>
                  </div>
                </div>
              );
            })}
          </div>
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

// 全螢幕 Bubble 卡片元件
interface FullScreenBubbleProps {
  bubble: FlexBubble;
  cardStyle?: string;
  cards?: DrawnCard[];
  onCardDrawComplete?: () => void;
  isLastBubble?: boolean; // 是否是 flex carousel 的最後一個 bubble
  // 整個 flex carousel 的進度資訊
  totalFlexSteps?: number;
  currentFlexStepBase?: number;
  // Button 圖層導航處理器
  buttonHandlers?: ButtonActionHandlers;
}

const FullScreenBubble: React.FC<FullScreenBubbleProps> = ({
  bubble,
  cardStyle,
  cards,
  onCardDrawComplete,
  isLastBubble = false,
  totalFlexSteps,
  currentFlexStepBase = 0,
  buttonHandlers,
}) => {
  const heroFlex = bubble.hero?.flex ?? 1;
  const bodyFlex = bubble.body?.flex ?? 1;
  const footerFlex = bubble.footer?.flex ?? 0;
  const cardBackImage = cardStyle || DEFAULT_CARD_BACK;

  // 判斷 hero 類型
  const isLayeredHero = bubble.hero?.type === 'layered';

  // 判斷卡牌內容來源
  // 1. body.content === 'cards'
  // 2. hero.layers 中有 type: 'cards' 的圖層
  const isCardContentInBody = bubble.body?.content === 'cards';
  const hasCardsLayerInHero = isLayeredHero &&
    (bubble.hero as FlexHeroLayered).layers?.some(layer => layer.type === 'cards');

  // 創建卡牌渲染器（給 LayeredImageView 使用）
  // 在 layered hero 中渲染時，背景設為透明讓底圖顯示
  const cardsRenderer = (layer: CardsLayer) => {
    if (!cards || cards.length === 0) return null;
    return (
      <CardDrawArea
        cards={cards}
        cardBackImage={cardBackImage}
        onAllCardsDrawn={() => {}}
        onComplete={onCardDrawComplete || (() => {})}
        isLastBubble={isLastBubble}
        totalFlexSteps={totalFlexSteps}
        currentFlexStepBase={currentFlexStepBase}
        transparentBackground={true}
      />
    );
  };

  return (
    <div className="h-full w-full flex flex-col bg-white">
      {/* Hero - 支援 image 或 layered（含 cards 圖層） */}
      {bubble.hero && (
        <div
          className="relative overflow-hidden"
          style={{ flex: heroFlex }}
        >
          {isLayeredHero ? (
            // Layered Hero - 層疊圖片（可能包含 cards 圖層）
            <LayeredImageView
              data={{
                type: 'layered',
                background: (bubble.hero as FlexHeroLayered).background,
                backgroundSize: (bubble.hero as FlexHeroLayered).backgroundSize,
                backgroundPosition: (bubble.hero as FlexHeroLayered).backgroundPosition,
                layers: (bubble.hero as FlexHeroLayered).layers,
              }}
              className="absolute inset-0"
              cardsRenderer={cardsRenderer}
              buttonHandlers={buttonHandlers}
            />
          ) : (
            // Image Hero - 一般圖片
            <img
              src={(bubble.hero as { url: string }).url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
        </div>
      )}

      {/* Body - 只有在卡牌不在 hero 時才處理卡牌 */}
      {bubble.body && (
        <div
          className="overflow-hidden"
          style={{ flex: bodyFlex }}
        >
          {isCardContentInBody && !hasCardsLayerInHero && cards && cards.length > 0 ? (
            <CardDrawArea
              cards={cards}
              cardBackImage={cardBackImage}
              onAllCardsDrawn={() => {}}
              onComplete={onCardDrawComplete || (() => {})}
              isLastBubble={isLastBubble}
              totalFlexSteps={totalFlexSteps}
              currentFlexStepBase={currentFlexStepBase}
            />
          ) : (
            <div
              className={`h-full flex flex-col bg-white ${bubble.body.spacing === 'sm' ? 'gap-3' : 'gap-4'}`}
              style={{ padding: bubble.body.paddingAll || '16px' }}
            >
              {bubble.body.contents?.map((content, idx) => renderFlexContent(content as FlexIcon | FlexText | FlexBox, idx))}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      {bubble.footer && (
        <div
          className="bg-gray-800 shrink-0"
          style={{
            flex: footerFlex > 0 ? footerFlex : undefined,
            padding: bubble.footer.paddingAll || '12px'
          }}
        >
          <div className={`flex flex-col ${bubble.footer.spacing === 'sm' ? 'gap-2' : 'gap-3'}`}>
            {bubble.footer.contents?.map((content, idx) => renderFlexContent(content as FlexIcon | FlexText | FlexBox, idx))}
          </div>
        </div>
      )}
    </div>
  );
};

// FlexCarouselView Props
export interface FlexCarouselViewProps {
  flex: FlexCarousel;
  cards?: CardsData;
  cardStyle?: string;
  variable?: Record<string, string>; // 模板變數，如 { explores: '/flex/prepoe/frWWvZ' }
  onComplete?: () => void;
}

// 替換模板變數 {{variable_name}} -> 實際值
const replaceTemplateVariables = (obj: any, variables: Record<string, string>): any => {
  if (!obj || !variables || Object.keys(variables).length === 0) {
    return obj;
  }

  if (typeof obj === 'string') {
    // 替換 {{variable_name}} 格式的變數
    return obj.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return variables[varName] !== undefined ? variables[varName] : match;
    });
  }

  if (Array.isArray(obj)) {
    return obj.map(item => replaceTemplateVariables(item, variables));
  }

  if (typeof obj === 'object') {
    const result: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      result[key] = replaceTemplateVariables(obj[key], variables);
    }
    return result;
  }

  return obj;
};

// FlexCarouselView 主元件
const FlexCarouselView: React.FC<FlexCarouselViewProps> = ({
  flex,
  cards,
  cardStyle,
  variable,
  onComplete,
}) => {
  const navigate = useNavigate();

  // 替換模板變數後的 flex 資料
  const processedFlex = variable ? replaceTemplateVariables(flex, variable) as FlexCarousel : flex;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [completedCardBubbles, setCompletedCardBubbles] = useState<Set<number>>(new Set());
  // 冷卻機制：記錄哪些 bubble 正在冷卻中
  const [cooldownBubbles, setCooldownBubbles] = useState<Set<number>>(new Set());

  const minSwipeDistance = 50;
  const totalBubbles = processedFlex.contents.length;

  // 判斷 bubble 是否包含 cards（可能在 body 或 hero.layers）
  const bubbleHasCards = (bubble: FlexBubble | undefined): boolean => {
    if (!bubble) return false;
    const hasCardsInBody = bubble.body?.content === 'cards';
    const hasCardsInHeroLayers = bubble.hero?.type === 'layered' &&
      (bubble.hero as FlexHeroLayered).layers?.some(layer => layer.type === 'cards');
    return hasCardsInBody || hasCardsInHeroLayers;
  };

  // 判斷 bubble 是否包含 button 圖層（有按鈕的頁面不應允許滑動/點擊導航）
  const bubbleHasButtons = (bubble: FlexBubble | undefined): boolean => {
    if (!bubble) return false;
    if (bubble.hero?.type === 'layered') {
      return (bubble.hero as FlexHeroLayered).layers?.some(layer => layer.type === 'button') ?? false;
    }
    return false;
  };

  // 計算整個 flex 的總步數（cards bubble 的每個解說頁 + 其他 bubble 各一步）
  const calculateTotalFlexSteps = () => {
    let total = 0;
    processedFlex.contents.forEach((bubble) => {
      if (bubbleHasCards(bubble) && cards?.content) {
        // cards bubble：每張牌的解釋頁數
        total += cards.content.reduce((sum, card) => {
          const pages = card.interpretation?.split('|').map(s => s.trim()).filter(s => s).length || 1;
          return sum + pages;
        }, 0);
      } else {
        // 一般 bubble：各算一步
        total += 1;
      }
    });
    return total;
  };

  // 計算某個 bubble 之前的步數
  const calculateStepsBefore = (bubbleIndex: number) => {
    let steps = 0;
    for (let i = 0; i < bubbleIndex; i++) {
      const bubble = processedFlex.contents[i];
      if (bubbleHasCards(bubble) && cards?.content) {
        steps += cards.content.reduce((sum, card) => {
          const pages = card.interpretation?.split('|').map(s => s.trim()).filter(s => s).length || 1;
          return sum + pages;
        }, 0);
      } else {
        steps += 1;
      }
    }
    return steps;
  };

  const totalFlexSteps = calculateTotalFlexSteps();

  // 檢查當前 bubble 是否被鎖定導航（卡牌流程未完成，或有按鈕需要用戶點擊，或冷卻中）
  const isCurrentBubbleLocked = () => {
    const currentBubble = processedFlex.contents[currentIndex];
    const hasCardContent = bubbleHasCards(currentBubble);
    const isCompleted = completedCardBubbles.has(currentIndex);

    // 卡牌流程未完成時鎖定
    if (hasCardContent && !isCompleted) return true;

    // 有按鈕的頁面也鎖定導航（必須透過按鈕導航）
    if (bubbleHasButtons(currentBubble)) return true;

    // 當前 bubble 正在冷卻中
    if (cooldownBubbles.has(currentIndex)) return true;

    return false;
  };

  // 檢查當前是否在卡牌流程中（用於隱藏 UI 元素）
  const isInCardFlow = () => {
    const currentBubble = processedFlex.contents[currentIndex];
    const hasCardContent = bubbleHasCards(currentBubble);
    const isCompleted = completedCardBubbles.has(currentIndex);
    return hasCardContent && !isCompleted;
  };

  // 檢查是否有任何 bubble 包含 cards（用於判斷是否為單向流程）
  const hasAnyCardsBubble = processedFlex.contents.some(bubble => bubbleHasCards(bubble));

  // 檢查目標 index 之前是否有已完成的 cards bubble（單向流程不允許回頭）
  const canGoBackTo = (targetIndex: number) => {
    // 如果沒有 cards bubble，可以自由切換
    if (!hasAnyCardsBubble) return true;
    // 如果有 cards bubble，只能往前不能往後
    return targetIndex >= currentIndex;
  };

  const handleCardDrawComplete = () => {
    const bubbleIndex = currentIndex;
    const currentBubble = processedFlex.contents[bubbleIndex];
    const cooldownTime = currentBubble?.cooldown;
    const nextBubbleIndex = bubbleIndex + 1;
    const nextBubble = nextBubbleIndex < totalBubbles ? processedFlex.contents[nextBubbleIndex] : undefined;
    const nextBubbleHasButtons = bubbleHasButtons(nextBubble);

    setCompletedCardBubbles(prev => new Set([...prev, bubbleIndex]));

    // 如果下一個 bubble 有按鈕，不要自動跳轉，讓使用者透過按鈕導航
    if (nextBubbleHasButtons) {
      // 但仍然需要跳到下一頁（只是不做後續的自動導航）
      if (bubbleIndex < totalBubbles - 1) {
        // 使用短延遲讓使用者看到完成狀態
        setTimeout(() => {
          setCurrentIndex(nextBubbleIndex);
        }, 500);
      }
      return;
    }

    // 如果此 bubble 有設定 cooldown，啟動冷卻
    if (cooldownTime && cooldownTime > 0) {
      setCooldownBubbles(prev => new Set([...prev, bubbleIndex]));
      setTimeout(() => {
        setCooldownBubbles(prev => {
          const next = new Set(prev);
          next.delete(bubbleIndex);
          return next;
        });
        // 冷卻結束後自動跳到下一個
        if (bubbleIndex < totalBubbles - 1) {
          setCurrentIndex(bubbleIndex + 1);
        }
      }, cooldownTime);
    } else {
      // 沒有 cooldown，直接跳到下一個
      if (bubbleIndex < totalBubbles - 1) {
        setTimeout(() => {
          setCurrentIndex(prev => prev + 1);
        }, 1500);
      }
    }
  };

  const goToNext = () => {
    if (isCurrentBubbleLocked()) return;
    if (currentIndex < totalBubbles - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const goToPrev = () => {
    // 如果有 cards bubble，不允許回上一步
    if (hasAnyCardsBubble) return;
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe && !hasAnyCardsBubble) {
      // 只有沒有 cards bubble 時才允許往回滑
      goToPrev();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'ArrowLeft' && !hasAnyCardsBubble) {
        // 只有沒有 cards bubble 時才允許往回
        goToPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, totalBubbles, completedCardBubbles, hasAnyCardsBubble]);

  const currentBubble = processedFlex.contents[currentIndex];

  // 防止 currentIndex 越界
  if (!currentBubble) {
    return null;
  }

  const isLocked = isCurrentBubbleLocked(); // 禁止滑動/點擊導航
  const hideUI = isInCardFlow(); // 只有卡牌流程中才隱藏 UI
  // 卡牌資料（可能在 body 或 hero）
  const cardsForBubble = bubbleHasCards(currentBubble) ? cards?.content : undefined;
  const resolvedCardStyle = cards?.style || cardStyle;
  const isLastBubble = currentIndex === totalBubbles - 1;
  const currentFlexStepBase = calculateStepsBefore(currentIndex);

  // 處理按鈕導航（帶冷卻檢查）
  const handleButtonNavigate = (targetIndex: number) => {
    const fromBubble = processedFlex.contents[currentIndex];
    const cooldownTime = fromBubble?.cooldown;

    // 如果當前 bubble 正在冷卻中，不允許導航
    if (cooldownBubbles.has(currentIndex)) return;

    // 如果離開的 bubble 有 cooldown 設定，啟動冷卻後再跳轉
    if (cooldownTime && cooldownTime > 0) {
      setCooldownBubbles(prev => new Set([...prev, currentIndex]));
      setTimeout(() => {
        setCooldownBubbles(prev => {
          const next = new Set(prev);
          next.delete(currentIndex);
          return next;
        });
        setCurrentIndex(targetIndex);
      }, cooldownTime);
    } else {
      // 沒有 cooldown，直接跳轉
      setCurrentIndex(targetIndex);
    }
  };

  // 按鈕動作處理器 - 用於 ButtonLayer
  // 注意：按鈕是有 button 圖層頁面的唯一導航方式，不受 isLocked 限制
  // 不定義 onUri，讓 LayeredImageView 的默認邏輯處理（會自動檢測內部路徑並使用 onNavigate）
  const buttonHandlers: ButtonActionHandlers = {
    onNext: () => {
      if (cooldownBubbles.has(currentIndex)) return;
      if (currentIndex < totalBubbles - 1) {
        handleButtonNavigate(currentIndex + 1);
      }
    },
    onPrev: () => {
      // 只有沒有 cards bubble 時才允許往回
      if (cooldownBubbles.has(currentIndex)) return;
      if (!hasAnyCardsBubble && currentIndex > 0) {
        handleButtonNavigate(currentIndex - 1);
      }
    },
    onGoto: (index: number) => {
      if (cooldownBubbles.has(currentIndex)) return;
      // 確保 index 在有效範圍內
      if (index >= 0 && index < totalBubbles) {
        // 如果有 cards bubble，只能往前不能往後
        if (hasAnyCardsBubble && index < currentIndex) return;
        handleButtonNavigate(index);
      }
    },
    onPostback: (_data: string) => {
      // 未來擴充：可以在這裡處理 postback 事件
    },
    onNavigate: (path: string) => {
      // 站內導航使用 React Router，避免白畫面
      navigate(path);
    },
  };

  return (
    <div
      className="h-screen w-screen overflow-hidden relative"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* 主要內容 */}
      <FullScreenBubble
        bubble={currentBubble}
        cardStyle={resolvedCardStyle}
        cards={cardsForBubble}
        onCardDrawComplete={handleCardDrawComplete}
        totalFlexSteps={totalFlexSteps}
        currentFlexStepBase={currentFlexStepBase}
        isLastBubble={isLastBubble}
        buttonHandlers={buttonHandlers}
      />

      {/* 左箭頭 - 只有沒有 cards bubble 時才顯示 */}
      {currentIndex > 0 && !isLocked && !hasAnyCardsBubble && (
        <button
          onClick={goToPrev}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/30 hover:bg-black/50 active:scale-95 transition-all"
        >
          <ChevronLeft className="text-white" size={24} />
        </button>
      )}

      {/* 右箭頭 */}
      {currentIndex < totalBubbles - 1 && !isLocked && (
        <button
          onClick={goToNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/30 hover:bg-black/50 active:scale-95 transition-all"
        >
          <ChevronRight className="text-white" size={24} />
        </button>
      )}

      {/* 頁面指示器 - 卡牌流程中隱藏，有按鈕頁面仍顯示但禁止點擊 */}
      {!hideUI && (
        <div className="absolute top-3 left-3 right-3 z-20">
          <div className="flex gap-1">
            {processedFlex.contents.map((bubble, index) => {
              // 如果有 cards bubble，只能往前不能往後點擊
              // 如果當前頁面被鎖定（有按鈕），也禁止點擊
              const canClickTo = !isLocked && (hasAnyCardsBubble
                ? index >= currentIndex // 有 cards 時只能點擊當前或之後的
                : true); // 沒有 cards 時可以自由點擊

              return (
                <button
                  key={index}
                  onClick={() => canClickTo && setCurrentIndex(index)}
                  disabled={!canClickTo}
                  className={`
                    h-1 flex-1 rounded-full transition-all duration-300
                    ${index === currentIndex
                      ? 'bg-white'
                      : index < currentIndex
                      ? 'bg-white/70'
                      : 'bg-white/30'
                    }
                    ${!canClickTo ? 'cursor-not-allowed' : 'cursor-pointer'}
                  `}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* 頁碼 - 卡牌流程中隱藏 */}
      {!hideUI && (
        <div className="absolute top-8 right-3 z-20 px-2 py-1 rounded-full bg-black/40 text-white text-xs">
          {currentIndex + 1} / {totalBubbles}
        </div>
      )}
    </div>
  );
};

export default FlexCarouselView;
export { CardDrawArea, FullScreenBubble };
