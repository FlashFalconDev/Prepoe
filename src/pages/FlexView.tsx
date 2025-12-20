import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { FlexCarouselView, CardsData, FlexCarousel } from '../components/cardDraw';
import LoadingScreen, { LoadingStyle } from '../components/LoadingScreen';
import { api, API_ENDPOINTS } from '../config/api';

// FlexView 資料結構（API 回傳格式）
interface FlexData {
  session_id?: number;
  cards?: CardsData;
  flex_deck: FlexCarousel;
  variable?: Record<string, string>; // 模板變數
}

const FlexView: React.FC = () => {
  const { clientSid, code } = useParams<{ clientSid: string; code: string }>();
  const [searchParams] = useSearchParams();
  const [flexData, setFlexData] = useState<FlexData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 從 URL 查詢參數讀取載入風格：?loading=tarot | neutral | minimal
  // 預設為 'neutral'（FlexView 是通用頁面，使用中性風格）
  const loadingStyleParam = searchParams.get('loading') as LoadingStyle | null;
  const loadingStyle: LoadingStyle = ['tarot', 'neutral', 'minimal'].includes(loadingStyleParam || '')
    ? (loadingStyleParam as LoadingStyle)
    : 'neutral';

  // 從 URL 查詢參數讀取背景顏色：?color=ADAEC2 或 ?color=%23ADAEC2
  const backgroundColor = searchParams.get('color') || undefined;

  // 從 URL 查詢參數讀取載入提示文字：?text=載入中...
  const loadingText = searchParams.get('text') || undefined;

  useEffect(() => {
    const loadData = async () => {
      if (!code) {
        setError('缺少必要參數');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await api.get(API_ENDPOINTS.FLEXWEB_BY_CODE(code));
        if (response.data.success) {
          setFlexData(response.data.data);
        } else {
          setError(response.data.message || '載入失敗');
        }
      } catch (err: any) {
        console.error('FlexView 載入失敗:', err);
        setError(err.response?.data?.message || '載入時發生錯誤');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [code]);

  // 載入中 - 根據 loadingStyle、backgroundColor 和 loadingText 顯示
  if (loading) {
    return <LoadingScreen style={loadingStyle} title={loadingText} backgroundColor={backgroundColor} />;
  }

  // 錯誤狀態
  if (error) {
    return (
      <div className="h-screen w-screen bg-white flex items-center justify-center">
        <div className="text-center text-gray-600">
          <p className="text-lg mb-2 text-red-500">{error}</p>
          <p className="text-gray-400 text-sm">code: {code}</p>
        </div>
      </div>
    );
  }

  // 沒有資料
  if (!flexData || !flexData.flex_deck?.contents?.length) {
    return (
      <div className="h-screen w-screen bg-white flex items-center justify-center">
        <div className="text-center text-gray-600">
          <p className="text-lg mb-2">找不到內容</p>
          <p className="text-gray-400 text-sm">code: {code}</p>
        </div>
      </div>
    );
  }

  // 使用共用的 FlexCarouselView 元件
  return (
    <FlexCarouselView
      flex={flexData.flex_deck}
      cards={flexData.cards}
      cardStyle={flexData.cards?.style}
      variable={flexData.variable}
    />
  );
};

export default FlexView;
