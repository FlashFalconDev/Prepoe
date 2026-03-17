// FlexCarouselView - Flex Carousel 呈現元件（支援卡牌抽取）
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Star, AlertCircle, Coins, Gift } from 'lucide-react';
import { DrawnCard, CardsData, FlexCarousel, FlexBubble, FlexHeroLayered, CardsLayer, InputLayer, RecommendedItem, RecommendedPerson, getRecommendedItemShopPath } from './types';
import LayeredImageView, { ButtonActionHandlers, InputHandlers, PostActionResult, PostSuccessData, audioManager } from './LayeredImageView';
import { api, API_BASE, API_ENDPOINTS, getMemberCard, type MemberCard } from '../../config/api';
import { COIN_LABEL } from '../../config/terms';
import { useToast } from '../../hooks/useToast';

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
  // 卡片比例（從外部傳入，避免等待圖片載入）
  initialAspectRatio?: string;
  // 抽卡樣式：'flex_01' 中心放大效果，'flex_02' / 'base' 規矩樣式，'flex_03' 拖拉選牌
  cardDrawStyle?: 'flex_01' | 'flex_02' | 'flex_03' | 'base';
  // 解說樣式：'d_01' 預設解說樣式
  detailStyle?: 'd_01' | 'd_02';
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
  initialAspectRatio,
  cardDrawStyle = 'flex_02', // 預設使用規矩樣式
  detailStyle = 'd_01', // 預設解說樣式
}) => {
  // 是否使用 flex_01 的中心放大效果
  const useCenterEnlarge = cardDrawStyle === 'flex_01';
  // 是否使用 flex_03 的拖拉選牌模式
  const useDragSelect = cardDrawStyle === 'flex_03';

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
  // 優先使用傳入的 aspectRatio，否則預設 '3/4'
  const [cardAspectRatio, setCardAspectRatio] = useState<string>(initialAspectRatio || '3/4');
  // flex_01 樣式：追蹤中心卡牌索引
  const [centerCardIndex, setCenterCardIndex] = useState<number>(Math.floor(DECK_SIZE / 2));

  // ===== flex_03 拖拉選牌相關狀態 =====
  const scatterAreaRef = useRef<HTMLDivElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  // 隨機卡牌位置（每張卡的 x, y, rotation）- 使用像素座標
  const [scatteredPositions, setScatteredPositions] = useState<Array<{ x: number; y: number; rotation: number; isPixel?: boolean }>>([]);
  // 當前拖拉的卡牌索引
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  // 拖拉偏移量
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  // 當前拖拉位置
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  // 已選中的卡牌（放入底部選牌區的）
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  // 是否在放置區域上方
  const [isOverDropZone, setIsOverDropZone] = useState(false);
  // 剛放開的卡牌索引（用於平滑過渡）
  const [justReleasedIndex, setJustReleasedIndex] = useState<number | null>(null);
  // 剛放開時的像素位置
  const [releasePosition, setReleasePosition] = useState<{ x: number; y: number } | null>(null);
  // 追蹤每張已選卡牌的翻牌狀態（用於翻牌動畫）
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());

  const totalCardsNeeded = cards.length;
  const cardsDrawnCount = drawnCardIndices.length;

  useEffect(() => {
    if (cards.length > 0) {
      const firstCard = cards[0];

      // 只在沒有傳入 initialAspectRatio 時才從圖片偵測
      if (!initialAspectRatio) {
        const img = new Image();
        img.onload = () => {
          const ratio = `${img.naturalWidth}/${img.naturalHeight}`;
          setCardAspectRatio(ratio);
        };
        img.src = firstCard.image_url;
      }

      // 預載其他卡牌圖片
      cards.slice(1).forEach((card) => {
        const preloadImg = new Image();
        preloadImg.src = card.image_url;
      });
    }
  }, [cards, initialAspectRatio]);

  // ===== flex_03 拖拉選牌：初始化隨機位置 =====
  useEffect(() => {
    if (useDragSelect && scatteredPositions.length === 0) {
      // 生成隨機散落位置（用百分比，避免超出邊界）
      const positions = Array.from({ length: DECK_SIZE }).map(() => ({
        x: 10 + Math.random() * 70, // 10% ~ 80%
        y: 5 + Math.random() * 45,  // 5% ~ 50%
        rotation: -30 + Math.random() * 60, // -30° ~ +30°
      }));
      setScatteredPositions(positions);
    }
  }, [useDragSelect, scatteredPositions.length]);

  // ===== flex_03 拖拉選牌：翻牌動畫 =====
  useEffect(() => {
    if (useDragSelect && selectedCards.length > 0) {
      const lastSelectedIdx = selectedCards.length - 1;
      // 延遲 100ms 後開始翻牌
      const timer = setTimeout(() => {
        setFlippedCards(prev => new Set([...prev, lastSelectedIdx]));
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [useDragSelect, selectedCards.length]);

  // ===== flex_03 拖拉選牌：處理拖拉開始 =====
  const handleDragStart = (index: number, clientX: number, clientY: number) => {
    if (selectedCards.includes(index)) return; // 已選中的卡牌不能再拖拉

    const cardElement = document.querySelector(`[data-scatter-card="${index}"]`) as HTMLElement;
    if (cardElement) {
      const rect = cardElement.getBoundingClientRect();
      // 計算點擊位置相對於卡牌左上角的偏移
      setDragOffset({
        x: clientX - rect.left,
        y: clientY - rect.top,
      });
      setDragPosition({ x: clientX, y: clientY });
      setDraggingIndex(index);

      // 清除 justReleased 狀態（如果正在過渡中又開始拖拉）
      if (justReleasedIndex === index) {
        setJustReleasedIndex(null);
        setReleasePosition(null);
      }
    }
  };

  // ===== flex_03 拖拉選牌：處理拖拉移動 =====
  const handleDragMove = (clientX: number, clientY: number) => {
    if (draggingIndex === null) return;

    setDragPosition({ x: clientX, y: clientY });

    // 檢查是否在放置區域上方
    if (dropZoneRef.current) {
      const dropRect = dropZoneRef.current.getBoundingClientRect();
      const isOver = clientX >= dropRect.left && clientX <= dropRect.right &&
                     clientY >= dropRect.top && clientY <= dropRect.bottom;
      setIsOverDropZone(isOver);
    }
  };

  // ===== flex_03 拖拉選牌：處理拖拉結束 =====
  const handleDragEnd = () => {
    if (draggingIndex === null) return;

    const currentDraggingIndex = draggingIndex;

    if (isOverDropZone && selectedCards.length < totalCardsNeeded) {
      // 放入選牌區
      const newSelected = [...selectedCards, currentDraggingIndex];
      setSelectedCards(newSelected);
      setDrawnCardIndices(prev => [...prev, currentDraggingIndex]);

      // 檢查是否已選完所有需要的牌
      if (newSelected.length >= totalCardsNeeded) {
        // 等待翻牌動畫完成（100ms 延遲 + 700ms 翻牌動畫）+ 500ms 停頓
        setTimeout(() => {
          setPhase('showing');
          onAllCardsDrawn();
        }, 1300);
      }
    } else {
      // 不在放置區，更新卡牌位置為放開的位置
      if (scatterAreaRef.current) {
        const areaRect = scatterAreaRef.current.getBoundingClientRect();
        // 計算放開時相對於容器的像素位置
        const relativeX = dragPosition.x - dragOffset.x - areaRect.left;
        const relativeY = dragPosition.y - dragOffset.y - areaRect.top;

        // 限制在合理範圍內
        const clampedX = Math.max(0, Math.min(areaRect.width - 90, relativeX));
        const clampedY = Math.max(0, Math.min(areaRect.height - 120, relativeY));

        // 設置放開位置（用於平滑過渡）
        setReleasePosition({ x: clampedX, y: clampedY });
        setJustReleasedIndex(currentDraggingIndex);

        // 更新散落位置（使用像素座標）
        setScatteredPositions(prev => {
          const newPositions = [...prev];
          newPositions[currentDraggingIndex] = {
            x: clampedX,
            y: clampedY,
            rotation: 0,
            isPixel: true, // 標記使用像素座標
          };
          return newPositions;
        });

        // 延遲清除 justReleasedIndex，讓過渡完成
        setTimeout(() => {
          setJustReleasedIndex(null);
          setReleasePosition(null);
        }, 50);
      }
    }

    setDraggingIndex(null);
    setIsOverDropZone(false);
  };

  // ===== flex_03 拖拉選牌：觸控/滑鼠事件處理 =====
  useEffect(() => {
    if (!useDragSelect) return;

    const handleMouseMove = (e: MouseEvent) => handleDragMove(e.clientX, e.clientY);
    const handleMouseUp = () => handleDragEnd();
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const handleTouchEnd = () => handleDragEnd();

    if (draggingIndex !== null) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [useDragSelect, draggingIndex, isOverDropZone, selectedCards, totalCardsNeeded, dragPosition, dragOffset]);

  const checkScrollButtons = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 10);

      // flex_01 樣式：計算當前中心卡牌索引
      if (useCenterEnlarge) {
        const deckCards = container.querySelectorAll('[data-deck-card]');
        const containerRect = container.getBoundingClientRect();
        const containerCenter = containerRect.left + containerRect.width / 2;

        let closestIndex = 0;
        let closestDistance = Infinity;

        deckCards.forEach((card, index) => {
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

    // 單張卡牌時放大 1.5 倍 - 使用寬度 + aspectRatio 確保比例正確
    const isSingleCard = totalCards === 1;
    const showingCardWidthClass = isSingleCard
      ? 'w-[150px] md:w-[180px]'  // 1.5x 寬度
      : 'w-[100px] md:w-[120px]';  // 原始寬度

    // ===== d_01 解說樣式（預設）：卡牌 + 文字說明 =====
    if (detailStyle === 'd_01') {
      return (
        <div
          className={`h-full w-full ${bgClass} flex flex-col overflow-hidden cursor-pointer relative`}
          onClick={handleNextStep}
        >
          {/* 當前卡牌大圖（與抽牌階段預覽位置一致） */}
          <div className="px-3 pt-16 mb-3 flex justify-center shrink-0">
            <div
              className={`${showingCardWidthClass} rounded-xl overflow-hidden shadow-lg`}
              style={{ aspectRatio: cardAspectRatio }}
            >
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

    // ===== d_02 解說樣式：全螢幕沉浸式 =====
    // 特色：卡牌置中放大、背景模糊、文字疊加、暖金色調
    if (detailStyle === 'd_02') {
      return (
        <div
          className="h-full w-full relative overflow-hidden cursor-pointer"
          onClick={handleNextStep}
        >
          {/* 背景：卡牌模糊放大 */}
          <div className="absolute inset-0">
            <img
              src={currentCard.image_url}
              alt=""
              className="w-full h-full object-cover scale-125 blur-2xl opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80" />
          </div>

          {/* 主要內容 */}
          <div className="relative h-full flex flex-col items-center justify-start px-4 pt-16 pb-8">
            {/* 位置標籤 - 卡牌上方（與卡牌一起排版） */}
            {currentCard.position_title && (
              <div className="text-center mb-4">
                <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-amber-500/30 to-orange-500/30 text-amber-200 rounded-full text-sm font-medium border border-amber-400/40 backdrop-blur-sm">
                  {currentCard.position_title}
                </span>
              </div>
            )}

            {/* 卡牌大圖 - 置中 */}
            <div className="relative mb-4">
              {/* 光暈效果 */}
              <div className="absolute inset-0 -m-4 bg-gradient-to-r from-amber-400/20 via-orange-400/30 to-amber-400/20 rounded-3xl blur-xl" />
              <div
                className="relative w-[180px] md:w-[220px] rounded-2xl overflow-hidden shadow-2xl ring-2 ring-amber-400/50"
                style={{ aspectRatio: cardAspectRatio }}
              >
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

            {/* 卡牌名稱 */}
            <h3 className="text-2xl md:text-3xl font-bold text-white text-center mb-1 drop-shadow-lg">
              {currentCard.card_title}
            </h3>

            {/* 位置描述 */}
            {currentCard.position_desc && (
              <p className="text-amber-200/80 text-sm text-center mb-4 drop-shadow">
                {currentCard.position_desc}
              </p>
            )}

            {/* 解釋文字 - 半透明卡片 */}
            {currentCard.interpretation && (
              <div className="w-full max-w-md">
                <div className="bg-black/40 backdrop-blur-md rounded-2xl p-5 border border-amber-400/20">
                  <div className="max-h-[200px] overflow-y-auto">
                    <p className="text-white/90 text-base leading-relaxed whitespace-pre-wrap text-center">
                      {totalPages > 1 ? currentSegment : currentCard.interpretation}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 分頁指示器（多頁時顯示） */}
            {totalPages > 1 && (
              <div className="flex gap-2 mt-4">
                {interpretationSegments.map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      idx === interpretationPage
                        ? 'bg-amber-400 w-6'
                        : idx < interpretationPage
                        ? 'bg-amber-400/60'
                        : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* 多張卡牌時顯示進度 */}
            {totalCards > 1 && (
              <div className="absolute bottom-20 left-0 right-0 flex justify-center gap-3">
                {cards.map((card, idx) => (
                  <div
                    key={idx}
                    className={`w-10 h-14 rounded-lg overflow-hidden transition-all duration-300 ${
                      idx === currentCardIndex
                        ? 'ring-2 ring-amber-400 scale-110'
                        : idx < currentCardIndex
                        ? 'opacity-60 grayscale'
                        : 'opacity-40'
                    }`}
                  >
                    <img
                      src={card.image_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* 底部提示 */}
            <div className="absolute bottom-6 left-0 right-0 text-center">
              <span className={`text-sm ${isLastPageWaiting ? 'text-amber-300 font-medium animate-pulse' : 'text-white/50'}`}>
                {isLastPageWaiting
                  ? (isLastBubble ? '✨ 請點擊按鈕繼續' : '⏳ 請稍候...')
                  : '點擊繼續 →'}
              </span>
            </div>
          </div>
        </div>
      );
    }

    // 預設 fallback 到 d_01
    return (
      <div
        className={`h-full w-full ${bgClass} flex flex-col overflow-hidden cursor-pointer relative`}
        onClick={handleNextStep}
      >
        <div className="flex-1 flex items-center justify-center">
          <p className="text-white">未知的解說樣式: {detailStyle}</p>
        </div>
      </div>
    );
  }

  // ===== 抽牌畫面 =====
  const currentPosition = getCardForPosition(cardsDrawnCount);

  // 單張卡牌時放大 1.5 倍（抽牌預覽區）- 使用寬度 + aspectRatio 確保比例正確
  const isSingleCardDrawing = totalCardsNeeded === 1;
  const previewCardWidthClass = isSingleCardDrawing
    ? 'w-[150px] md:w-[180px]'  // 1.5x 寬度
    : 'w-[100px] md:w-[120px]';  // 原始寬度

  // ===== flex_03 拖拉選牌模式 =====
  if (useDragSelect) {
    return (
      <div className={`h-full w-full ${bgClass} flex flex-col overflow-hidden select-none`}>
        {/* 頂部選牌區域（放置區） */}
        <div
          ref={dropZoneRef}
          className={`
            shrink-0 min-h-[200px] md:min-h-[240px] p-4 pt-8
            border-b-2 transition-all duration-300
            ${isOverDropZone
              ? 'bg-cyan-500/20 border-cyan-400'
              : 'bg-slate-800/50 border-slate-600/50'}
          `}
        >
          <div className="flex justify-center gap-4 flex-wrap items-center h-full">
            {/* 已選中的卡牌 */}
            {Array.from({ length: totalCardsNeeded }).map((_, idx) => {
              const selectedIndex = selectedCards[idx];
              const card = selectedIndex !== undefined ? getCardForPosition(idx) : null;
              const isSelected = selectedIndex !== undefined;
              const isFlipped = flippedCards.has(idx);

              if (isSelected && card) {
                return (
                  <div
                    key={idx}
                    className="w-[100px] md:w-[120px]"
                    style={{ perspective: '1000px' }}
                  >
                    <div
                      className="relative w-full transition-transform duration-700"
                      style={{
                        aspectRatio: cardAspectRatio,
                        transformStyle: 'preserve-3d',
                        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                      }}
                    >
                      {/* 卡背 */}
                      <div
                        className="absolute inset-0 rounded-xl overflow-hidden shadow-lg border-2 border-slate-600/50"
                        style={{ backfaceVisibility: 'hidden' }}
                      >
                        <img
                          src={cardBackImage}
                          alt="卡背"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {/* 卡面 */}
                      <div
                        className="absolute inset-0 rounded-xl overflow-hidden shadow-lg border-2 border-cyan-400/60"
                        style={{
                          backfaceVisibility: 'hidden',
                          transform: 'rotateY(180deg)',
                        }}
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
                    </div>
                  </div>
                );
              }

              // 未選中的佔位
              return (
                <div
                  key={idx}
                  className={`
                    w-[100px] md:w-[120px] rounded-xl border-2 border-dashed
                    flex items-center justify-center transition-all duration-300
                    ${isOverDropZone ? 'border-cyan-400 bg-cyan-400/10' : 'border-blue-400/30 bg-slate-800/30'}
                  `}
                  style={{ aspectRatio: cardAspectRatio }}
                >
                  <span className={`text-lg ${isOverDropZone ? 'text-cyan-400' : 'text-blue-400/40'}`}>
                    {isOverDropZone ? '↑' : '?'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 散落卡牌區域 */}
        <div
          ref={scatterAreaRef}
          className="flex-1 relative overflow-hidden"
        >
          {/* 提示文字 */}
          <div className="absolute top-4 left-0 right-0 text-center z-10 pointer-events-none">
            <p className="text-cyan-300/80 text-sm">
              {selectedCards.length < totalCardsNeeded
                ? `拖拉卡牌到上方選牌區（${selectedCards.length}/${totalCardsNeeded}）`
                : '選牌完成！'}
            </p>
          </div>

          {/* 散落的卡牌 */}
          {scatteredPositions.map((pos, index) => {
            const isSelected = selectedCards.includes(index);
            const isDragging = draggingIndex === index;
            const isJustReleased = justReleasedIndex === index;

            if (isSelected) return null; // 已選中的卡牌不顯示在散落區

            // 計算位置
            let leftValue: string | number;
            let topValue: string | number;

            if (isDragging) {
              // 拖拉中：使用 fixed 定位的視窗座標
              leftValue = dragPosition.x - dragOffset.x;
              topValue = dragPosition.y - dragOffset.y;
            } else if (isJustReleased && releasePosition) {
              // 剛放開：使用放開時的像素座標
              leftValue = releasePosition.x;
              topValue = releasePosition.y;
            } else if (pos.isPixel) {
              // 已經使用像素座標的卡牌
              leftValue = pos.x;
              topValue = pos.y;
            } else {
              // 初始百分比座標
              leftValue = `${pos.x}%`;
              topValue = `${pos.y}%`;
            }

            return (
              <div
                key={index}
                data-scatter-card={index}
                className={`
                  absolute cursor-grab active:cursor-grabbing
                  ${isDragging ? 'z-50 shadow-2xl' : 'z-10 hover:scale-105 hover:z-20'}
                `}
                style={{
                  left: leftValue,
                  top: topValue,
                  transform: isDragging ? 'scale(1.1) rotate(0deg)' : `rotate(${pos.rotation}deg)`,
                  position: isDragging ? 'fixed' : 'absolute',
                  touchAction: 'none',
                }}
                onMouseDown={(e) => handleDragStart(index, e.clientX, e.clientY)}
                onTouchStart={(e) => {
                  if (e.touches.length > 0) {
                    handleDragStart(index, e.touches[0].clientX, e.touches[0].clientY);
                  }
                }}
              >
                <div
                  className="w-[90px] md:w-[110px] rounded-lg shadow-xl overflow-hidden border-2 border-slate-600/50"
                  style={{ aspectRatio: cardAspectRatio }}
                >
                  <img
                    src={cardBackImage}
                    alt="卡背"
                    className="w-full h-full object-cover pointer-events-none"
                    draggable={false}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full w-full ${bgClass} flex flex-col overflow-hidden`}>

      {/* 抽牌進度預覽 */}
      {totalCardsNeeded > 0 && (
        <div className="px-3 pt-16 mb-3 shrink-0">
          <div className="flex justify-center gap-3 flex-wrap">
            {Array.from({ length: totalCardsNeeded }).map((_, idx) => {
              const card = idx < cardsDrawnCount ? getCardForPosition(idx) : null;
              const isDrawn = idx < cardsDrawnCount;

              // 已抽出的卡牌 - 使用寬度 + aspectRatio 確保比例正確
              if (isDrawn && card) {
                return (
                  <div
                    key={idx}
                    className={`${previewCardWidthClass} rounded-xl overflow-hidden shadow-lg`}
                    style={{ aspectRatio: cardAspectRatio }}
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

              // 未抽出的佔位 - 使用寬度 + aspectRatio 確保比例正確
              return (
                <div
                  key={idx}
                  className={`${previewCardWidthClass} rounded-xl border-2 border-dashed border-blue-400/30 flex items-center justify-center bg-slate-800/30`}
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
            className={`flex overflow-x-auto scrollbar-hide ${useCenterEnlarge ? 'gap-2 px-8 py-4' : 'gap-3 px-16 py-8'}`}
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {Array.from({ length: DECK_SIZE }).map((_, deckIndex) => {
              const isDrawn = drawnCardIndices.includes(deckIndex);
              const isFlipping = flippingIndex === deckIndex;
              const drawOrder = drawnCardIndices.indexOf(deckIndex);
              const cardData = drawOrder >= 0 ? getCardForPosition(drawOrder) : null;

              // flex_01 樣式：計算與中心的距離（用於縮放效果）
              const distanceFromCenter = Math.abs(deckIndex - centerCardIndex);
              const isCenter = deckIndex === centerCardIndex;
              // 縮放係數：中心 1.0，每遠離一格縮小 0.1，最小 0.7
              const scaleMultiplier = useCenterEnlarge
                ? Math.max(0.7, 1 - distanceFromCenter * 0.1)
                : 1;

              return (
                <div
                  key={deckIndex}
                  data-deck-card
                  onClick={() => handleDeckCardClick(deckIndex)}
                  className={`
                    flex-shrink-0 relative cursor-pointer transition-all duration-300 transform-gpu
                    ${isDrawn && !isFlipping ? 'opacity-0 scale-75 pointer-events-none' : ''}
                    ${isFlipping ? 'z-30 scale-110' : ''}
                    ${flippingIndex !== null && !isFlipping ? 'opacity-30 scale-95 pointer-events-none' : ''}
                    ${!useCenterEnlarge && !isFlipping ? 'hover:-translate-y-4 hover:scale-105' : ''}
                  `}
                  style={{
                    scrollSnapAlign: 'center',
                    perspective: '1000px',
                    // flex_01 樣式：根據與中心的距離縮放
                    ...(useCenterEnlarge && !isFlipping && !isDrawn ? {
                      transform: `scale(${scaleMultiplier})`,
                      zIndex: isCenter ? 20 : 10 - distanceFromCenter,
                    } : {}),
                  }}
                >
                    <div
                      className={`relative transition-transform duration-700 ${useCenterEnlarge ? 'w-[100px] md:w-[120px]' : 'w-[85px] md:w-[100px]'}`}
                      style={{
                        aspectRatio: cardAspectRatio,
                        transformStyle: 'preserve-3d',
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
  // Input 圖層處理器
  inputHandlers?: InputHandlers;
  // 卡片比例（從外部傳入，避免等待圖片載入）
  initialAspectRatio?: string;
  // 抽卡樣式
  cardDrawStyle?: 'flex_01' | 'flex_02' | 'flex_03' | 'base';
  // 解說樣式
  detailStyle?: 'd_01' | 'd_02';
  // 取得表單資料（供 POST 動作使用）
  getFormData?: () => FormData;
  // 推薦頁專用（當 body.content === 'recommended' 時顯示）
  recommendedItem?: RecommendedItem;
  recommendedPerson?: RecommendedPerson;
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
  inputHandlers,
  initialAspectRatio,
  cardDrawStyle = 'flex_02',
  detailStyle = 'd_01',
  getFormData,
  recommendedItem,
  recommendedPerson,
}) => {
  const navigate = useNavigate();
  const heroFlex = bubble.hero?.flex ?? 1;
  const bodyFlex = bubble.body?.flex ?? 1;
  const footerFlex = bubble.footer?.flex ?? 0;
  const cardBackImage = cardStyle || DEFAULT_CARD_BACK;

  // 推薦頁（body.content === 'recommended'）
  const isRecommendedPage = bubble.body?.content === 'recommended';

  // 判斷 hero 類型
  const isLayeredHero = bubble.hero?.type === 'layered';

  // 判斷卡牌內容來源
  // 1. body.content === 'cards'
  // 2. hero.layers 中有 type: 'cards' 的圖層
  const isCardContentInBody = bubble.body?.content === 'cards';
  const hasCardsLayerInHero = isLayeredHero &&
    (bubble.hero as FlexHeroLayered).layers?.some(layer => layer.type === 'cards');

  // 推薦頁專用 UI（抽牌結果最後一頁）
  if (isRecommendedPage && (recommendedItem || recommendedPerson)) {
    const itemImg = recommendedItem?.image_url || recommendedItem?.thumbnail_url;
    const personImg = recommendedPerson?.image_url;
    return (
      <div className="h-full w-full flex flex-col bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 overflow-y-auto">
        <div className="flex-1 flex flex-col p-4 sm:p-6 max-w-lg mx-auto w-full">
          <h3 className="text-lg font-semibold text-white/90 text-center mb-4">為你推薦</h3>

          {/* 上方：推薦商品 - 大圖為主 */}
          {recommendedItem && (
            <button
              type="button"
              onClick={() => navigate(getRecommendedItemShopPath(recommendedItem, { openCart: true }))}
              className="w-full rounded-xl overflow-hidden bg-white/5 border border-white/15 hover:bg-white/10 transition-colors text-left mb-0"
            >
              <div className="w-full aspect-[4/3] bg-white/5">
                {itemImg ? (
                  <img src={itemImg} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/30">
                    <Gift size={48} />
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium line-clamp-2 text-sm leading-snug">{recommendedItem.name}</p>
                  <p className="text-purple-300 text-sm mt-1">NT$ {recommendedItem.base_price}</p>
                </div>
                <ChevronRight className="text-white/70 flex-shrink-0" size={20} />
              </div>
            </button>
          )}

          {/* 區隔：推薦老師區塊 */}
          {recommendedPerson && (
            <div className="mt-6 pt-5 border-t border-white/15">
              <p className="text-white/50 text-xs font-medium mb-3">推薦老師</p>
              <button
                type="button"
                onClick={() => navigate(`/client/provider/${recommendedPerson.slug}`)}
                className="w-full flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-left"
              >
                <div className="w-14 h-14 flex-shrink-0 rounded-full overflow-hidden bg-white/10 ring-2 ring-white/20">
                  {personImg ? (
                    <img src={personImg} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/30">
                      <Star size={24} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm">{recommendedPerson.name}</p>
                </div>
                <ChevronRight className="text-white/60 flex-shrink-0" size={20} />
              </button>
            </div>
          )}

          <p className="text-white/50 text-xs text-center mt-5">點擊前往查看</p>
        </div>
      </div>
    );
  }

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
        initialAspectRatio={initialAspectRatio}
        cardDrawStyle={cardDrawStyle}
        detailStyle={detailStyle}
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
                backaudio: (bubble.hero as FlexHeroLayered).backaudio,
                layers: (bubble.hero as FlexHeroLayered).layers,
              }}
              className="absolute inset-0"
              cardsRenderer={cardsRenderer}
              buttonHandlers={buttonHandlers}
              inputHandlers={inputHandlers}
              getFormData={getFormData}
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
              initialAspectRatio={initialAspectRatio}
              cardDrawStyle={cardDrawStyle}
              detailStyle={detailStyle}
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

// 表單資料類型
export type FormData = Record<string, string>;
export type FormErrors = Record<string, string | undefined>;

// FlexCarouselView Props
export interface FlexCarouselViewProps {
  flex: FlexCarousel;
  cards?: CardsData;
  cardStyle?: string;
  variable?: Record<string, string>; // 模板變數，如 { explores: '/flex/prepoe/frWWvZ' }
  onComplete?: () => void;
  // 抽卡樣式：'flex_01' 中心放大效果，'flex_02' / 'base' 規矩樣式
  cardDrawStyle?: 'flex_01' | 'flex_02' | 'flex_03' | 'base';
  // 解說樣式：'d_01' 預設解說樣式，'d_02' 未來擴充
  detailStyle?: 'd_01' | 'd_02';
  // 表單相關
  onFormChange?: (formData: FormData) => void;  // 表單值變更時觸發
  onFormSubmit?: (formData: FormData) => void;  // 表單提交時觸發（搭配 submit 按鈕）
  initialFormData?: FormData;                   // 初始表單值
  serverFormData?: FormData;                    // 伺服器回傳的表單資料（如 session_id 等），POST 時會一起帶上
  // POST 動作處理器（外部傳入，用於處理 API 請求）
  onPost?: (uri: string, formData: FormData) => Promise<PostActionResult>;
  // 抽牌結果的推薦商品／推薦人（有內容時會在最後一頁後多一頁顯示）
  recommended_item?: RecommendedItem;
  recommended_person?: RecommendedPerson;
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
// 建立「推薦頁」專用 bubble（body.content === 'recommended'，由 FullScreenBubble 特別渲染）
const createRecommendedBubble = (): FlexBubble => ({
  type: 'bubble',
  body: { content: 'recommended' },
});

const FlexCarouselView: React.FC<FlexCarouselViewProps> = ({
  flex,
  cards: initialCards,
  cardStyle,
  variable,
  onComplete,
  cardDrawStyle = 'flex_02', // 預設使用規矩樣式
  detailStyle = 'd_01', // 預設解說樣式
  onFormChange,
  onFormSubmit,
  initialFormData = {},
  serverFormData: initialServerFormData = {},
  onPost,
  recommended_item,
  recommended_person,
}) => {
  const navigate = useNavigate();

  // ===== 動態資料 state（可由 POST 成功後更新）=====
  const [currentFlex, setCurrentFlex] = useState<FlexCarousel>(flex);
  const [cards, setCards] = useState<CardsData | undefined>(initialCards);
  const [currentServerFormData, setCurrentServerFormData] = useState<FormData>(initialServerFormData);

  // 替換模板變數後的 flex 資料
  const processedFlex = variable ? replaceTemplateVariables(currentFlex, variable) as FlexCarousel : currentFlex;

  // 有卡牌內容且有推薦資料時，在最後多一頁「推薦」bubble
  const effectiveFlex = React.useMemo<FlexCarousel>(() => {
    const hasContent = (initialCards?.content?.length ?? 0) > 0;
    const hasRecommended = !!(recommended_item || recommended_person);
    if (!hasContent || !hasRecommended) return processedFlex;
    return {
      ...processedFlex,
      contents: [...processedFlex.contents, createRecommendedBubble()],
    };
  }, [processedFlex, initialCards?.content?.length, recommended_item, recommended_person]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [completedCardBubbles, setCompletedCardBubbles] = useState<Set<number>>(new Set());
  // 冷卻機制：記錄哪些 bubble 正在冷卻中
  const [cooldownBubbles, setCooldownBubbles] = useState<Set<number>>(new Set());
  // AI 載入狀態
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiLoadingText, setAILoadingText] = useState('AI 解讀中...');

  // AI 加購狀態
  const [addonInfo, setAddonInfo] = useState<{ need_addon: boolean; price: number; session_id: number } | null>(null);
  const [addonMemberCard, setAddonMemberCard] = useState<MemberCard | null>(null);
  const [purchasingAddon, setPurchasingAddon] = useState(false);
  const { showSuccess, showError } = useToast();

  // ===== 表單狀態管理 =====
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // 驗證單一欄位
  const validateField = (layer: InputLayer, value: string): string | undefined => {
    const { validation, label, name } = layer;
    if (!validation) return undefined;

    const fieldName = label || name;

    if (validation.required && !value.trim()) {
      return validation.errorMessage || `${fieldName} 為必填欄位`;
    }

    if (validation.minLength && value.length < validation.minLength) {
      return validation.errorMessage || `${fieldName} 至少需要 ${validation.minLength} 個字元`;
    }

    if (validation.maxLength && value.length > validation.maxLength) {
      return validation.errorMessage || `${fieldName} 不能超過 ${validation.maxLength} 個字元`;
    }

    if (validation.pattern) {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(value)) {
        return validation.errorMessage || `${fieldName} 格式不正確`;
      }
    }

    if (validation.min !== undefined && layer.inputType === 'number') {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue < validation.min) {
        return validation.errorMessage || `${fieldName} 不能小於 ${validation.min}`;
      }
    }

    if (validation.max !== undefined && layer.inputType === 'number') {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue > validation.max) {
        return validation.errorMessage || `${fieldName} 不能大於 ${validation.max}`;
      }
    }

    return undefined;
  };

  // 從 flex 中取得所有 input layers
  const getAllInputLayers = (): InputLayer[] => {
    const inputs: InputLayer[] = [];
    effectiveFlex.contents.forEach(bubble => {
      if (bubble.hero?.type === 'layered') {
        const layered = bubble.hero as FlexHeroLayered;
        layered.layers?.forEach(layer => {
          if (layer.type === 'input') {
            inputs.push(layer as InputLayer);
          }
        });
      }
    });
    return inputs;
  };

  // 取得指定 bubble 的 input layers（用於頁面級別驗證）
  const getInputLayersForBubble = (bubbleIndex: number): InputLayer[] => {
    const inputs: InputLayer[] = [];
    const bubble = effectiveFlex.contents[bubbleIndex];
    if (bubble?.hero?.type === 'layered') {
      const layered = bubble.hero as FlexHeroLayered;
      layered.layers?.forEach(layer => {
        if (layer.type === 'input') {
          inputs.push(layer as InputLayer);
        }
      });
    }
    return inputs;
  };

  // 處理表單欄位變更
  const handleFormChange = (name: string, value: string) => {
    const newFormData = { ...formData, [name]: value };
    setFormData(newFormData);

    // 即時驗證
    const inputLayers = getAllInputLayers();
    const inputLayer = inputLayers.find(l => l.name === name);
    if (inputLayer) {
      const error = validateField(inputLayer, value);
      setFormErrors(prev => ({ ...prev, [name]: error }));
    }

    // 通知外部
    onFormChange?.(newFormData);
  };

  // 取得表單欄位值
  const getFormValue = (name: string): string => {
    return formData[name] || '';
  };

  // 取得表單欄位錯誤
  const getFormError = (name: string): string | undefined => {
    return formErrors[name];
  };

  // 驗證所有欄位（用於 POST 提交前）
  const validateAllFields = (): { isValid: boolean; errors: FormErrors } => {
    const inputLayers = getAllInputLayers();
    const errors: FormErrors = {};
    let isValid = true;

    inputLayers.forEach(layer => {
      const value = formData[layer.name] || '';
      const error = validateField(layer, value);
      if (error) {
        errors[layer.name] = error;
        isValid = false;
      }
    });

    setFormErrors(errors);
    return { isValid, errors };
  };

  // 驗證當前頁面的必填欄位（用於頁面導航前）
  // 如果當前頁面有必填欄位未填寫，將阻止導航到下一頁
  const validateCurrentPageFields = (): { isValid: boolean; errors: FormErrors } => {
    const inputLayers = getInputLayersForBubble(currentIndex);
    const errors: FormErrors = {};
    let isValid = true;

    inputLayers.forEach(layer => {
      const value = formData[layer.name] || '';
      const error = validateField(layer, value);
      if (error) {
        errors[layer.name] = error;
        isValid = false;
      }
    });

    // 只更新當前頁面欄位的錯誤，保留其他頁面的錯誤狀態
    setFormErrors(prev => {
      const newErrors = { ...prev };
      // 清除當前頁面欄位的舊錯誤
      inputLayers.forEach(layer => {
        delete newErrors[layer.name];
      });
      // 加入新的錯誤
      return { ...newErrors, ...errors };
    });

    return { isValid, errors };
  };

  // 建立 inputHandlers
  const inputHandlers: InputHandlers = {
    onChange: handleFormChange,
    getValue: getFormValue,
    getError: getFormError,
  };

  // 取得當前表單資料（供 POST 動作使用）
  // 會合併伺服器回傳的 serverFormData（如 session_id）與使用者輸入的 formData
  const getFormData = (): FormData => {
    return { ...currentServerFormData, ...formData };
  };

  const minSwipeDistance = 50;
  const totalBubbles = effectiveFlex.contents.length;

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
    effectiveFlex.contents.forEach((bubble) => {
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
      const bubble = effectiveFlex.contents[i];
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
    const currentBubble = effectiveFlex.contents[currentIndex];
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
    const currentBubble = effectiveFlex.contents[currentIndex];
    const hasCardContent = bubbleHasCards(currentBubble);
    const isCompleted = completedCardBubbles.has(currentIndex);
    return hasCardContent && !isCompleted;
  };

  // 檢查是否有任何 bubble 包含 cards（用於判斷是否為單向流程）
  const hasAnyCardsBubble = effectiveFlex.contents.some(bubble => bubbleHasCards(bubble));

  // 檢查目標 index 之前是否有已完成的 cards bubble（單向流程不允許回頭）
  const canGoBackTo = (targetIndex: number) => {
    // 如果沒有 cards bubble，可以自由切換
    if (!hasAnyCardsBubble) return true;
    // 如果有 cards bubble，只能往前不能往後
    return targetIndex >= currentIndex;
  };

  // 取得 bubble 的 backaudio URL
  const getBubbleBackaudio = (bubbleIndex: number): string | undefined => {
    const bubble = effectiveFlex.contents[bubbleIndex];
    if (!bubble?.hero) return undefined;
    if (bubble.hero.type === 'layered') {
      return (bubble.hero as FlexHeroLayered).backaudio;
    }
    return undefined;
  };

  // 導航到指定頁面，並播放目標頁面的音訊（應在用戶手勢上下文中呼叫）
  const navigateToWithAudio = (targetIndex: number) => {
    // 取得目標頁面的 backaudio 並播放
    const targetBackaudio = getBubbleBackaudio(targetIndex);
    if (targetBackaudio) {
      audioManager.play(targetBackaudio);
    } else {
      // 目標頁面沒有音訊，停止當前播放
      audioManager.stop();
    }
    setCurrentIndex(targetIndex);
  };

  const handleCardDrawComplete = () => {
    const bubbleIndex = currentIndex;
    const currentBubble = effectiveFlex.contents[bubbleIndex];
    const cooldownTime = currentBubble?.cooldown;
    const nextBubbleIndex = bubbleIndex + 1;
    const nextBubble = nextBubbleIndex < totalBubbles ? effectiveFlex.contents[nextBubbleIndex] : undefined;
    const nextBubbleHasButtons = bubbleHasButtons(nextBubble);

    setCompletedCardBubbles(prev => new Set([...prev, bubbleIndex]));

    // 檢查當前 bubble 的 cards 圖層是否有 action
    const cardsLayer = (currentBubble?.hero as FlexHeroLayered)?.layers?.find(
      (layer): layer is CardsLayer => layer.type === 'cards'
    );
    const cardsAction = cardsLayer?.action;

    // 如果 cards 圖層有 action，執行該動作（使用與 buttonHandlers 相同的邏輯）
    if (cardsAction) {
      // 使用短延遲讓使用者看到完成狀態
      setTimeout(async () => {
        switch (cardsAction.type) {
          case 'uri': {
            const uri = cardsAction.uri;
            const openInNewTab = cardsAction.openInNewTab;
            if (openInNewTab) {
              window.open(uri, '_blank');
            } else if (uri.startsWith('/')) {
              navigate(uri);
            } else {
              window.location.href = uri;
            }
            break;
          }
          case 'next':
            if (bubbleIndex < totalBubbles - 1) {
              setCurrentIndex(nextBubbleIndex);
            }
            break;
          case 'prev':
            if (bubbleIndex > 0) {
              setCurrentIndex(bubbleIndex - 1);
            }
            break;
          case 'goto':
            if (cardsAction.index >= 0 && cardsAction.index < totalBubbles) {
              setCurrentIndex(cardsAction.index);
            }
            break;
          case 'post': {
            // POST 動作：使用與按鈕相同的邏輯
            const formData = getFormData();
            const result = await buttonHandlers.onPost?.(cardsAction.uri, formData);
            if (result?.success) {
              // 如果有 successAction，執行該動作
              if (cardsAction.successAction) {
                const successAction = cardsAction.successAction;
                if (successAction.type === 'uri') {
                  if (successAction.openInNewTab) {
                    window.open(successAction.uri, '_blank');
                  } else if (successAction.uri.startsWith('/')) {
                    navigate(successAction.uri);
                  } else {
                    window.location.href = successAction.uri;
                  }
                } else if (successAction.type === 'next') {
                  buttonHandlers.onNext?.();
                } else if (successAction.type === 'prev') {
                  buttonHandlers.onPrev?.();
                } else if (successAction.type === 'goto') {
                  buttonHandlers.onGoto?.(successAction.index);
                }
              }
              // 如果沒有 successAction 但有回傳資料，呼叫 onPostSuccess 更新畫面
              else if (result.data && buttonHandlers.onPostSuccess) {
                buttonHandlers.onPostSuccess(result.data);
              }
              // 如果都沒有，預設跳到下一頁
              else {
                buttonHandlers.onNext?.();
              }
            }
            break;
          }
          case 'ai': {
            // AI 動作：等同於 POST 到 AI submit API
            const aiUri = `${API_BASE}/cardhack/api/ai/submit/`;
            const formData = getFormData();

            // 顯示載入狀態
            setAILoadingText(cardsAction.loadingText || 'AI 解讀中...');
            setIsAILoading(true);

            try {
              const result = await buttonHandlers.onPost?.(aiUri, formData);
              if (result?.success) {
                // 如果有 successAction，執行該動作
                if (cardsAction.successAction) {
                  const successAction = cardsAction.successAction;
                  if (successAction.type === 'uri') {
                    if (successAction.openInNewTab) {
                      window.open(successAction.uri, '_blank');
                    } else if (successAction.uri.startsWith('/')) {
                      navigate(successAction.uri);
                    } else {
                      window.location.href = successAction.uri;
                    }
                  } else if (successAction.type === 'next') {
                    buttonHandlers.onNext?.();
                  } else if (successAction.type === 'prev') {
                    buttonHandlers.onPrev?.();
                  } else if (successAction.type === 'goto') {
                    buttonHandlers.onGoto?.(successAction.index);
                  }
                }
                // 如果回傳有 flex_deck，用 onPostSuccess 更新畫面
                else if (result.data?.flex_deck && buttonHandlers.onPostSuccess) {
                  buttonHandlers.onPostSuccess(result.data);
                }
                // 其他情況（沒有 successAction 也沒有 flex_deck），預設跳到下一頁
                else {
                  buttonHandlers.onNext?.();
                }
              } else if (!result?.success && result?.data?.need_addon && buttonHandlers.onNeedAddon) {
                // 需要加購 AI 解釋
                buttonHandlers.onNeedAddon({
                  need_addon: result.data.need_addon!,
                  price: result.data.price!,
                  session_id: result.data.session_id!,
                });
              }
            } finally {
              setIsAILoading(false);
            }
            break;
          }
          case 'postback':
            buttonHandlers.onPostback?.(cardsAction.data);
            break;
        }
      }, 500);
      return;
    }

    // 如果下一個 bubble 有按鈕，不要自動跳轉，讓使用者透過按鈕導航
    if (nextBubbleHasButtons) {
      // 但仍然需要跳到下一頁（只是不做後續的自動導航）
      if (bubbleIndex < totalBubbles - 1) {
        // 使用短延遲讓使用者看到完成狀態
        setTimeout(() => {
          // 注意：這裡是 setTimeout 內，不在用戶手勢上下文
          // 但下一頁有按鈕，用戶會點擊按鈕觸發音訊
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

  // 手動導航函數（箭頭按鈕、滑動）- 在用戶手勢上下文中播放音訊
  const goToNext = () => {
    if (isCurrentBubbleLocked()) return;
    // 檢查當前頁面的必填欄位是否都已填寫
    const { isValid } = validateCurrentPageFields();
    if (!isValid) return;
    if (currentIndex < totalBubbles - 1) {
      navigateToWithAudio(currentIndex + 1);
    }
  };

  const goToPrev = () => {
    // 如果有 cards bubble，不允許回上一步
    if (hasAnyCardsBubble) return;
    if (currentIndex > 0) {
      navigateToWithAudio(currentIndex - 1);
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

  const currentBubble = effectiveFlex.contents[currentIndex];

  // 防止 currentIndex 越界
  if (!currentBubble) {
    return null;
  }

  const isLocked = isCurrentBubbleLocked(); // 禁止滑動/點擊導航
  const hideUI = isInCardFlow(); // 只有卡牌流程中才隱藏 UI
  // 卡牌資料（可能在 body 或 hero）
  const cardsForBubble = bubbleHasCards(currentBubble) ? cards?.content : undefined;
  const resolvedCardStyle = cards?.style || cardStyle;
  // 卡片比例：將 "449:449" 格式轉換為 "449/449" 格式（CSS aspect-ratio 需要斜線）
  const resolvedAspectRatio = cards?.aspectRatio?.replace(':', '/');
  const isLastBubble = currentIndex === totalBubbles - 1;
  const currentFlexStepBase = calculateStepsBefore(currentIndex);

  // 處理按鈕導航（帶冷卻檢查和頁面驗證）
  // 重要：此函數在用戶手勢上下文中呼叫，可以播放音訊
  // skipValidation: 用於回上一頁時跳過驗證（往回不需要驗證當前頁面）
  const handleButtonNavigate = (targetIndex: number, skipValidation: boolean = false) => {
    const fromBubble = effectiveFlex.contents[currentIndex];
    const cooldownTime = fromBubble?.cooldown;

    // 如果當前 bubble 正在冷卻中，不允許導航
    if (cooldownBubbles.has(currentIndex)) return;

    // 往前導航時（targetIndex > currentIndex），檢查當前頁面的必填欄位
    if (!skipValidation && targetIndex > currentIndex) {
      const { isValid } = validateCurrentPageFields();
      if (!isValid) return;
    }

    // 在用戶手勢上下文中播放目標頁面的音訊
    const targetBackaudio = getBubbleBackaudio(targetIndex);
    if (targetBackaudio) {
      audioManager.play(targetBackaudio);
    } else {
      audioManager.stop();
    }

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

  // AI 加購：處理 need_addon 回調
  const handleNeedAddon = (data: { need_addon: boolean; price: number; session_id: number }) => {
    setAddonInfo(data);
    // 載入會員卡金幣資訊
    getMemberCard(data.price).then(res => {
      if (res.success) setAddonMemberCard(res.data);
    }).catch(() => {});
  };

  // AI 加購：確認購買（addon-order/create 共用 create_order 流程 → 重新呼叫 AI Submit）
  const handleAddonPurchase = async () => {
    if (!addonInfo || !addonMemberCard) return;
    const coinsPerTwd = addonMemberCard.coins_per_twd || 0;
    const totalCoinsNeeded = Math.ceil(addonInfo.price * coinsPerTwd);
    if (addonMemberCard.coins < totalCoinsNeeded) {
      showError(`${COIN_LABEL}不足`);
      return;
    }
    setPurchasingAddon(true);
    try {
      // 建立加購訂單（後端共用 create_order 流程，自動組 items）
      const orderRes = await api.post(API_ENDPOINTS.CARDHACK_AI_ADDON_ORDER_CREATE, {
        session_id: addonInfo.session_id,
        payment_method: 'Free',
        use_coins: totalCoinsNeeded,
        coins_discount_amount: addonInfo.price,
      });
      const orderData = orderRes.data;

      if (!orderData.success) {
        showError(orderData.message || '建立訂單失敗');
        return;
      }

      // 重新呼叫 AI Submit
      showSuccess(orderData.message || '購買成功！');
      setAddonInfo(null);

      const aiUri = `${API_BASE}/cardhack/api/ai/submit/`;
      const formData = getFormData();
      const aiResult = await onPost?.(aiUri, formData);
      if (aiResult?.success) {
        if (aiResult.data?.flex_deck) {
          setCurrentFlex(aiResult.data.flex_deck as FlexCarousel);
          setCurrentIndex(0);
          setCompletedCardBubbles(new Set());
          setCooldownBubbles(new Set());
        } else if (currentIndex < totalBubbles - 1) {
          setCurrentIndex(prev => prev + 1);
        }
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || '購買過程中發生錯誤';
      showError(errMsg);
    } finally {
      setPurchasingAddon(false);
    }
  };

  // 按鈕動作處理器 - 用於 ButtonLayer
  // 注意：按鈕是有 button 圖層頁面的唯一導航方式，不受 isLocked 限制
  // 不定義 onUri，讓 LayeredImageView 的默認邏輯處理（會自動檢測內部路徑並使用 onNavigate）
  const buttonHandlers: ButtonActionHandlers = {
    onNext: () => {
      if (cooldownBubbles.has(currentIndex)) return;
      if (currentIndex < totalBubbles - 1) {
        // handleButtonNavigate 會自動驗證當前頁面欄位
        handleButtonNavigate(currentIndex + 1);
      }
    },
    onPrev: () => {
      // 只有沒有 cards bubble 時才允許往回
      if (cooldownBubbles.has(currentIndex)) return;
      if (!hasAnyCardsBubble && currentIndex > 0) {
        // 回上一頁不需要驗證當前頁面
        handleButtonNavigate(currentIndex - 1, true);
      }
    },
    onGoto: (index: number) => {
      if (cooldownBubbles.has(currentIndex)) return;
      // 確保 index 在有效範圍內
      if (index >= 0 && index < totalBubbles) {
        // 如果有 cards bubble，只能往前不能往後
        if (hasAnyCardsBubble && index < currentIndex) return;
        // 往回跳轉時跳過驗證（skipValidation 會自動判斷）
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
    onPost: async (uri: string, data: FormData): Promise<PostActionResult> => {
      // 提交前驗證所有必填欄位
      const { isValid, errors } = validateAllFields();
      if (!isValid) {
        // 找到第一個錯誤訊息
        const firstError = Object.values(errors).find(e => e);
        return { success: false, message: firstError || '請填寫所有必填欄位' };
      }

      // 使用外部傳入的 onPost 處理器
      if (onPost) {
        return await onPost(uri, data);
      }
      // 如果沒有提供 onPost，回傳錯誤
      console.warn('onPost 處理器未定義');
      return { success: false, message: 'onPost 處理器未定義' };
    },
    // AI 加購回調
    onNeedAddon: handleNeedAddon,
    // POST 成功後用新資料更新畫面（當沒有 successAction 時觸發）
    onPostSuccess: (data) => {
      console.log('[onPostSuccess] 收到資料:', data);

      // 更新 cards
      if (data.cards) {
        console.log('[onPostSuccess] 更新 cards');
        setCards(data.cards as CardsData);
      }
      // 更新 flex_deck（如果有新的 flex_deck，重置到第一頁）
      if (data.flex_deck) {
        console.log('[onPostSuccess] 更新 flex_deck，重置到第一頁');
        setCurrentFlex(data.flex_deck as FlexCarousel);
        // 重置相關狀態
        setCurrentIndex(0);
        setCompletedCardBubbles(new Set());
        setCooldownBubbles(new Set());
      } else {
        // 沒有新的 flex_deck，跳到下一頁
        console.log('[onPostSuccess] 沒有新 flex_deck，跳到下一頁');
        if (currentIndex < totalBubbles - 1) {
          setCurrentIndex(prev => prev + 1);
        }
      }
      // 更新 serverFormData
      if (data.form_data) {
        const newServerFormData: FormData = {};
        Object.entries(data.form_data).forEach(([key, value]) => {
          newServerFormData[key] = String(value);
        });
        setCurrentServerFormData(prev => ({ ...prev, ...newServerFormData }));
      }
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
        inputHandlers={inputHandlers}
        initialAspectRatio={resolvedAspectRatio}
        cardDrawStyle={cardDrawStyle}
        detailStyle={detailStyle}
        getFormData={getFormData}
        recommendedItem={recommended_item}
        recommendedPerson={recommended_person}
      />

      {/* AI 載入覆蓋層 */}
      {isAILoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            {/* 旋轉的載入動畫 */}
            <div className="relative">
              <div className="w-16 h-16 border-4 border-white/20 rounded-full" />
              <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-white rounded-full animate-spin" />
            </div>
            {/* 載入文字 */}
            <p className="text-white text-lg font-medium animate-pulse">
              {aiLoadingText}
            </p>
          </div>
        </div>
      )}

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

      {/* 頁面指示器 - 卡牌流程中隱藏，有按鈕頁面仍顯示但禁止點擊，只有一頁時隱形 */}
      {!hideUI && (
        <div className={`absolute top-3 left-3 right-3 z-20 ${totalBubbles === 1 ? 'invisible' : ''}`}>
          <div className="flex gap-1">
            {effectiveFlex.contents.map((bubble, index) => {
              // 如果有 cards bubble，只能往前不能往後點擊
              // 如果當前頁面被鎖定（有按鈕），也禁止點擊
              const canClickTo = !isLocked && (hasAnyCardsBubble
                ? index >= currentIndex // 有 cards 時只能點擊當前或之後的
                : true); // 沒有 cards 時可以自由點擊

              // 處理頁面指示器點擊，往前導航時需驗證
              const handleIndicatorClick = () => {
                if (!canClickTo) return;
                // 往前導航時檢查當前頁面欄位
                if (index > currentIndex) {
                  const { isValid } = validateCurrentPageFields();
                  if (!isValid) return;
                }
                navigateToWithAudio(index);
              };

              return (
                <button
                  key={index}
                  onClick={handleIndicatorClick}
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

      {/* AI 加購彈窗 */}
      {addonInfo && (() => {
        const cpt = addonMemberCard?.coins_per_twd || 0;
        const totalCoins = Math.ceil(addonInfo.price * cpt);
        const userCoins = addonMemberCard?.coins || 0;
        const canAfford = userCoins >= totalCoins;

        return (
          <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-950 border border-purple-500/20 rounded-2xl p-6 max-w-[360px] w-full">
              {/* 標題 */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-400/20 to-orange-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle size={32} className="text-amber-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">需要加購 AI 解釋</h2>
                <p className="text-purple-200 text-sm">此次解讀需要使用{COIN_LABEL}購買</p>
              </div>

              {/* 金幣購買區塊 */}
              {addonMemberCard && cpt > 0 ? (
                <div className="bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-400/20 rounded-xl p-4 mb-6">
                  <h3 className="text-amber-400 text-sm font-medium mb-3 flex items-center gap-2">
                    <Coins size={16} />
                    使用{COIN_LABEL}購買
                  </h3>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-white text-sm font-medium">AI 深度解析</p>
                      <p className="text-purple-300 text-xs mt-0.5">NT$ {addonInfo.price}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-amber-400 font-bold">{totalCoins.toLocaleString()} {COIN_LABEL}</p>
                      <p className="text-purple-400 text-xs">餘額：{userCoins.toLocaleString()}</p>
                    </div>
                  </div>
                  {canAfford ? (
                    <button
                      onClick={handleAddonPurchase}
                      disabled={purchasingAddon}
                      className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {purchasingAddon ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                          購買中...
                        </>
                      ) : (
                        <>
                          <Coins size={16} />
                          使用需扣除 {totalCoins.toLocaleString()} {COIN_LABEL}
                        </>
                      )}
                    </button>
                  ) : (
                    <p className="text-center text-purple-400 text-sm">
                      {COIN_LABEL}不足（需要 {totalCoins.toLocaleString()}，餘額 {userCoins.toLocaleString()}）
                    </p>
                  )}
                </div>
              ) : !addonMemberCard ? (
                <div className="bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-400/20 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-center gap-2 py-3">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-400 border-t-transparent" />
                    <span className="text-purple-300 text-sm">載入{COIN_LABEL}資訊...</span>
                  </div>
                </div>
              ) : null}

              {/* 返回按鈕 */}
              <button
                onClick={() => setAddonInfo(null)}
                disabled={purchasingAddon}
                className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors disabled:opacity-50"
              >
                取消
              </button>
            </div>
          </div>
        );
      })()}

    </div>
  );
};

export default FlexCarouselView;
export { CardDrawArea, FullScreenBubble };
