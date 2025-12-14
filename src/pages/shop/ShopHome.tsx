import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Bell, ChevronRight, Megaphone, Gift, Calendar, Star } from 'lucide-react';
import { api, API_ENDPOINTS } from '../../config/api';

interface NewsItem {
  id: number;
  title: string;
  summary: string;
  image_url?: string;
  category: 'announcement' | 'promotion' | 'event' | 'news';
  created_at: string;
  is_pinned: boolean;
}

const ShopHome: React.FC = () => {
  const { clientSid } = useParams();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNews();
  }, [clientSid]);

  const loadNews = async () => {
    try {
      setLoading(true);
      // TODO: 實際 API 呼叫
      // const response = await api.get(API_ENDPOINTS.SHOP_NEWS, {
      //   params: { shop_client_sid: clientSid }
      // });

      // 模擬資料
      setNews([
        {
          id: 1,
          title: '🎉 新會員首購優惠',
          summary: '即日起加入會員，首次購物享 9 折優惠！',
          category: 'promotion',
          created_at: '2025-12-10',
          is_pinned: true,
        },
        {
          id: 2,
          title: '📢 營業時間調整公告',
          summary: '12/31 除夕當天營業時間調整為 10:00-18:00',
          category: 'announcement',
          created_at: '2025-12-09',
          is_pinned: false,
        },
        {
          id: 3,
          title: '🎄 聖誕限定商品上架',
          summary: '精選聖誕禮盒、限量甜點，送禮自用兩相宜！',
          category: 'event',
          created_at: '2025-12-08',
          is_pinned: false,
        },
      ]);
    } catch (error) {
      console.error('載入最新資訊失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: NewsItem['category']) => {
    switch (category) {
      case 'announcement':
        return <Megaphone size={16} className="text-blue-500" />;
      case 'promotion':
        return <Gift size={16} className="text-red-500" />;
      case 'event':
        return <Calendar size={16} className="text-purple-500" />;
      default:
        return <Bell size={16} className="text-gray-500" />;
    }
  };

  const getCategoryLabel = (category: NewsItem['category']) => {
    switch (category) {
      case 'announcement':
        return '公告';
      case 'promotion':
        return '優惠';
      case 'event':
        return '活動';
      default:
        return '資訊';
    }
  };

  const getCategoryColor = (category: NewsItem['category']) => {
    switch (category) {
      case 'announcement':
        return 'bg-blue-100 text-blue-700';
      case 'promotion':
        return 'bg-red-100 text-red-700';
      case 'event':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* 快捷功能區 */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { icon: Gift, label: '優惠券', color: 'text-red-500', bgColor: 'bg-red-50' },
          { icon: Star, label: '積分', color: 'text-yellow-500', bgColor: 'bg-yellow-50' },
          { icon: Calendar, label: '活動', color: 'text-purple-500', bgColor: 'bg-purple-50' },
          { icon: Bell, label: '通知', color: 'text-blue-500', bgColor: 'bg-blue-50' },
        ].map((item, index) => (
          <button
            key={index}
            className="flex flex-col items-center p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
          >
            <div className={`p-2 rounded-full ${item.bgColor} mb-2`}>
              <item.icon size={20} className={item.color} />
            </div>
            <span className="text-xs text-gray-600 font-medium">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Banner 區域 */}
      <div className="mb-6">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white">
          <h2 className="text-lg font-bold mb-2">歡迎來到 {clientSid}</h2>
          <p className="text-sm opacity-90 mb-4">探索更多精彩商品與優惠</p>
          <button className="bg-white text-purple-600 px-4 py-2 rounded-full text-sm font-semibold hover:bg-gray-100 transition-colors">
            立即探索
          </button>
        </div>
      </div>

      {/* 最新資訊 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">最新資訊</h3>
          <button className="text-sm text-purple-600 font-medium flex items-center gap-1">
            查看全部
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="space-y-3">
          {news.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start gap-3">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    {getCategoryIcon(item.category)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(item.category)}`}>
                      {getCategoryLabel(item.category)}
                    </span>
                    {item.is_pinned && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                        置頂
                      </span>
                    )}
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1 line-clamp-1">
                    {item.title}
                  </h4>
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {item.summary}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {item.created_at}
                  </p>
                </div>
                <ChevronRight size={20} className="text-gray-300 flex-shrink-0" />
              </div>
            </div>
          ))}
        </div>

        {news.length === 0 && (
          <div className="bg-white rounded-xl p-8 text-center">
            <Bell size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">目前沒有最新資訊</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopHome;
