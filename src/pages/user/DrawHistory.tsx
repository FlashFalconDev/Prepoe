import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Compass
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api, API_ENDPOINTS } from '../../config/api';
import { AI_COLORS } from '../../constants/colors';
import { useToast } from '../../hooks/useToast';

// 類型定義
interface DrawCard {
  card_title: string;
  image_url: string;
  position_title: string;
  position_desc: string;
  interpretation: string;
  explores?: string;
}

interface DrawSession {
  id: number;
  deck_name: string;
  spread_name: string;
  note: string;
  cards_count: number;
  cards: DrawCard[];
  created_at: string;
}

interface DrawHistoryResponse {
  success: boolean;
  data: {
    sessions: DrawSession[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
  message: string;
}

// 單張卡片組件
const CardItem: React.FC<{ card: DrawCard; index: number }> = ({ card, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  const handleExplore = () => {
    if (card.explores) {
      navigate(card.explores);
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
      <div className="flex items-start gap-3">
        {/* 卡片圖片 */}
        <div className="w-16 h-24 flex-shrink-0 bg-gray-200 rounded-md overflow-hidden">
          {card.image_url ? (
            <img
              src={card.image_url}
              alt={card.card_title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <CreditCard size={24} className="text-gray-400" />
            </div>
          )}
        </div>

        {/* 卡片資訊 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 ${AI_COLORS.bgDark} text-white text-xs rounded-full`}>
              {card.position_title}
            </span>
          </div>
          <h4 className="font-semibold text-gray-900 text-sm mb-1">
            {card.card_title}
          </h4>
          <p className="text-xs text-gray-500 mb-2">
            {card.position_desc}
          </p>

          {/* 按鈕區域 */}
          <div className="flex items-center gap-3">
            {/* 解讀按鈕 */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`flex items-center gap-1 text-xs ${AI_COLORS.text} hover:opacity-80 transition-opacity`}
            >
              {isExpanded ? '收起解讀' : '查看解讀'}
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {/* 探索按鈕 */}
            {card.explores && (
              <button
                onClick={handleExplore}
                className={`flex items-center gap-1 text-xs ${AI_COLORS.button} px-2 py-1 rounded-full transition-colors`}
              >
                <Compass size={14} />
                探索
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 解讀內容 */}
      {isExpanded && card.interpretation && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {card.interpretation}
          </p>
        </div>
      )}
    </div>
  );
};

// 抽卡紀錄卡片組件
const DrawSessionCard: React.FC<{ session: DrawSession }> = ({ session }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* 標題區塊 */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 ${AI_COLORS.bg} rounded-xl flex items-center justify-center`}>
              <Sparkles size={24} className={AI_COLORS.text} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {session.deck_name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{session.spread_name}</span>
                <span>•</span>
                <span>{session.cards_count} 張牌</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Calendar size={12} />
                <span>{formatDate(session.created_at)}</span>
              </div>
            </div>
            {isExpanded ? (
              <ChevronUp size={20} className="text-gray-400" />
            ) : (
              <ChevronDown size={20} className="text-gray-400" />
            )}
          </div>
        </div>

        {/* 備註 */}
        {session.note && (
          <div className="mt-2 text-sm text-gray-600">
            {session.note}
          </div>
        )}
      </div>

      {/* 展開的卡片列表 */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="pt-4 space-y-3">
            {session.cards.map((card, index) => (
              <CardItem key={index} card={card} index={index} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// 主頁面組件
const DrawHistory: React.FC = () => {
  const [sessions, setSessions] = useState<DrawSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const { showToast } = useToast();

  // 載入抽卡紀錄
  const loadDrawHistory = async (page: number = 1) => {
    setLoading(true);
    try {
      const response = await api.get<DrawHistoryResponse>(
        API_ENDPOINTS.CARDHACK_DRAW_HISTORY,
        { params: { page, page_size: 10 } }
      );

      if (response.data.success) {
        setSessions(response.data.data.sessions);
        setTotalPages(response.data.data.total_pages);
        setTotalCount(response.data.data.total);
        setCurrentPage(response.data.data.page);
      } else {
        showToast({ type: 'error', title: response.data.message || '載入失敗' });
      }
    } catch (error) {
      console.error('載入抽卡紀錄失敗:', error);
      showToast({ type: 'error', title: '載入抽卡紀錄失敗' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrawHistory(1);
  }, []);

  // 處理分頁
  const handlePageChange = (page: number) => {
    loadDrawHistory(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* 頁面標題 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">抽卡紀錄</h1>
          <p className="text-gray-500 text-sm">
            共 {totalCount} 次抽卡紀錄
          </p>
        </div>

        {/* 內容區域 */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="flex flex-col items-center justify-center">
              <div className={`animate-spin rounded-full h-10 w-10 border-b-2 ${AI_COLORS.border} mb-4`}></div>
              <p className="text-gray-500">載入中...</p>
            </div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="flex flex-col items-center justify-center text-center">
              <div className={`w-16 h-16 ${AI_COLORS.bg} rounded-full flex items-center justify-center mb-4`}>
                <CreditCard size={32} className={AI_COLORS.text} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">尚無抽卡紀錄</h3>
              <p className="text-gray-500 text-sm">
                您還沒有進行過任何抽卡，去試試看吧！
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* 抽卡紀錄列表 */}
            <div className="space-y-4">
              {sessions.map((session) => (
                <DrawSessionCard key={session.id} session={session} />
              ))}
            </div>

            {/* 分頁控制 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>

                <span className="px-4 py-2 text-sm text-gray-600">
                  第 {currentPage} 頁，共 {totalPages} 頁
                </span>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DrawHistory;
