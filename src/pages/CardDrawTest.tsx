import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Sparkles, X, LogIn } from 'lucide-react';
import { api, API_ENDPOINTS } from '../config/api';
import { DrawResult, getTemplate, DEFAULT_TEMPLATE, FlexCarouselView } from '../components/cardDraw';
import LoadingScreen, { LoadingStyle } from '../components/LoadingScreen';

// 預設卡背圖片
const DEFAULT_CARD_BACK = 'https://fflinebotstatic.s3.ap-northeast-1.amazonaws.com/default_records/card_style/default_card_back.png';

/**
 * CardDrawTest - 測試用抽卡頁面（使用舊版 API）
 * 路由：/card_test/:clientSid/:spreadCode
 * API：CARDHACK_DRAW_CREATE
 */
const CardDrawTest: React.FC = () => {
  const { spreadCode } = useParams<{ clientSid: string; spreadCode: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // 從 URL 查詢參數讀取載入風格：?loading=tarot | neutral | minimal
  // 預設為 'tarot'（保留原有的塔羅風格）
  const loadingStyleParam = searchParams.get('loading') as LoadingStyle | null;
  const loadingStyle: LoadingStyle = ['tarot', 'neutral', 'minimal'].includes(loadingStyleParam || '')
    ? (loadingStyleParam as LoadingStyle)
    : 'tarot';

  // 從 URL 查詢參數讀取背景顏色：?color=ADAEC2 或 ?color=%23ADAEC2
  const backgroundColor = searchParams.get('color') || undefined;

  // 從 URL 查詢參數讀取載入提示文字：?text=載入中...
  const loadingText = searchParams.get('text') || undefined;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needLogin, setNeedLogin] = useState(false);
  const [drawResult, setDrawResult] = useState<DrawResult | null>(null);

  // 抽卡流程狀態（傳給模板元件）
  const [drawnCardIndices, setDrawnCardIndices] = useState<number[]>([]);
  const [flippingIndex, setFlippingIndex] = useState<number | null>(null);
  const [allCardsDrawn, setAllCardsDrawn] = useState(false);

  // 記錄上一次呼叫的 spreadCode，用於判斷是否需要重新呼叫 API
  const lastSpreadCodeRef = useRef<string | undefined>(undefined);

  // 動態卡牌比例
  const [cardAspectRatio, setCardAspectRatio] = useState<string>('3/4');

  // 卡背圖片
  const cardBackImage = drawResult?.cards?.style || DEFAULT_CARD_BACK;

  // 呼叫抽卡 API（舊版）
  const performDraw = async (forceRefresh = false) => {
    if (!spreadCode) {
      setError('缺少牌陣代碼');
      setLoading(false);
      return;
    }

    // 如果 spreadCode 相同且已經呼叫過，不重複呼叫（除非 forceRefresh）
    if (lastSpreadCodeRef.current === spreadCode && !forceRefresh) {
      return;
    }
    lastSpreadCodeRef.current = spreadCode;

    try {
      setLoading(true);
      setError(null);

      const response = await api.post(API_ENDPOINTS.CARDHACK_DRAW_CREATE(spreadCode));

      if (response.data.success) {
        // template 在 cards 物件裡面
        const template = response.data.data?.cards?.template;

        const resultData = {
          ...response.data.data,
          template: template,
        };

        setDrawResult(resultData);
        setNeedLogin(false);
      } else {
        if (response.data.error === 'Authentication required') {
          setNeedLogin(true);
        } else {
          setError(response.data.message || '抽牌失敗');
        }
      }
    } catch (err: any) {
      console.error('抽牌失敗:', err);
      if (err.response?.status === 401 || err.response?.data?.error === 'Authentication required') {
        setNeedLogin(true);
      } else {
        setError(err.response?.data?.message || '抽牌時發生錯誤');
      }
    } finally {
      setLoading(false);
    }
  };

  // 跳轉到登入頁面
  const goToLogin = () => {
    localStorage.setItem('login_redirect', location.pathname);
    navigate('/login', { state: { from: location } });
  };

  // 重新抽牌
  const handleRestart = () => {
    setDrawResult(null);
    setDrawnCardIndices([]);
    setFlippingIndex(null);
    setAllCardsDrawn(false);
    performDraw(true);
  };

  useEffect(() => {
    // 當 spreadCode 改變時，重置所有狀態並重新呼叫 API
    if (lastSpreadCodeRef.current !== spreadCode) {
      setDrawResult(null);
      setDrawnCardIndices([]);
      setFlippingIndex(null);
      setAllCardsDrawn(false);
      setError(null);
      setNeedLogin(false);
      setLoading(true);
    }
    performDraw();
  }, [spreadCode]);

  // 預載入所有牌的圖片，並計算卡牌比例
  useEffect(() => {
    if (drawResult?.cards.content && drawResult.cards.content.length > 0) {
      const firstCard = drawResult.cards.content[0];
      const img = new Image();
      img.onload = () => {
        const ratio = `${img.naturalWidth}/${img.naturalHeight}`;
        setCardAspectRatio(ratio);
      };
      img.src = firstCard.image_url;

      // 預載入其他牌的圖片
      drawResult.cards.content.slice(1).forEach((card) => {
        const preloadImg = new Image();
        preloadImg.src = card.image_url;
      });
    }
  }, [drawResult]);

  // 載入中畫面 - 根據 loadingStyle、backgroundColor 和 loadingText 顯示
  if (loading) {
    return (
      <LoadingScreen
        style={loadingStyle}
        title={loadingText || (loadingStyle === 'tarot' ? '正在洗牌中...' : '載入中...')}
        subtitle={loadingStyle === 'tarot' ? '請靜心冥想您的問題' : '請稍候'}
        backgroundColor={backgroundColor}
      />
    );
  }

  // 需要登入畫面
  if (needLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-indigo-900 to-purple-950 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles size={40} className="text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">開始你的占卜之旅</h2>
          <p className="text-purple-200 mb-6">
            請先登入以開啟神秘的塔羅牌陣，<br />
            揭示屬於你的命運指引
          </p>
          <button
            onClick={goToLogin}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-xl transition-all font-medium shadow-lg"
          >
            <LogIn size={20} />
            登入開始抽牌
          </button>
          <p className="text-purple-400 text-xs mt-4">
            登入後即可免費體驗占卜服務
          </p>
        </div>
      </div>
    );
  }

  // 錯誤畫面
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <X size={32} className="text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">抽牌失敗</h2>
          <p className="text-purple-200 mb-6">{error}</p>
          <button
            onClick={handleRestart}
            className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-colors"
          >
            重新嘗試
          </button>
        </div>
      </div>
    );
  }

  // 沒有結果
  if (!drawResult) {
    return null;
  }

  // 如果 API 回傳 flex_deck，使用 FlexCarouselView
  if (drawResult.flex_deck) {
    return (
      <FlexCarouselView
        flex={drawResult.flex_deck}
        cards={drawResult.cards}
        cardStyle={drawResult.cards?.style}
        variable={drawResult.variable}
        onComplete={handleRestart}
      />
    );
  }

  // 否則使用傳統模板系統
  const templateName = drawResult.template || DEFAULT_TEMPLATE;
  const TemplateComponent = getTemplate(templateName);

  return (
    <TemplateComponent
      drawResult={drawResult}
      cardBackImage={cardBackImage}
      cardAspectRatio={cardAspectRatio}
      onRestart={handleRestart}
      drawnCardIndices={drawnCardIndices}
      setDrawnCardIndices={setDrawnCardIndices}
      flippingIndex={flippingIndex}
      setFlippingIndex={setFlippingIndex}
      allCardsDrawn={allCardsDrawn}
      setAllCardsDrawn={setAllCardsDrawn}
    />
  );
};

export default CardDrawTest;
