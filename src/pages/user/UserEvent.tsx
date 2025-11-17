import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../contexts/AuthContext';
import { getEventSkuList, createEventJoinUrl, ItemEventItem } from '../../config/api';
import { AI_COLORS } from '../../constants/colors';

const UserEvent: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { user } = useAuth();
  
  // 狀態管理
  const [events, setEvents] = useState<ItemEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // 載入活動列表
  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await getEventSkuList();
      if (response.success) {
        const eventsData = response.data.events;
        if (Array.isArray(eventsData)) {
          setEvents(eventsData);
        } else {
          setEvents([]);
        }
      } else {
        showError('載入失敗', response.message);
      }
    } catch (error: any) {
      showError('載入失敗', error.message || '無法載入活動資料');
    } finally {
      setLoading(false);
    }
  };

  // 初始化載入
  useEffect(() => {
    loadEvents();
  }, []);

  // 過濾活動
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterType === 'all' || event.event_status === filterType;
    const matchesCategory = selectedCategory === 'all' || 
                           (event.item_tags && event.item_tags.some((tag: any) => tag.name === selectedCategory));
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // 格式化時間
  const formatDateTime = (dateTime: string) => {
    try {
      return new Date(dateTime).toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateTime;
    }
  };

  // 計算活動即時狀態(根據開始/結束時間)
  const getEventRealTimeStatus = (event: ItemEventItem): {
    status: string;
    displayText: string;
    canRegister: boolean;
  } => {
    const now = new Date();
    const startTime = new Date(event.start_time);
    const endTime = new Date(event.end_time);

    // 活動已結束
    if (now > endTime) {
      return {
        status: 'ended',
        displayText: '活動結束',
        canRegister: false
      };
    }

    // 活動進行中(已開始但未結束)
    if (now >= startTime && now <= endTime) {
      return {
        status: 'in_progress',
        displayText: '活動進行中',
        canRegister: false
      };
    }

    // 活動尚未開始 - 根據後端狀態判斷
    if (event.event_status === 'registration_open') {
      return {
        status: 'registration_open',
        displayText: '報名開放',
        canRegister: true
      };
    }

    // 其他狀態(報名截止、草稿等)
    return {
      status: event.event_status,
      displayText: event.event_status_display,
      canRegister: false
    };
  };

  // 複製報名連結
  const handleCopyJoinLink = async (event: ItemEventItem) => {
    try {
      if (!event.sku) {
        showError('無法複製連結', '此活動尚未設定 SKU，無法生成報名連結');
        return;
      }

      // 如果使用者已登入，則在連結中加入 referrer 參數（使用 member_card）
      const joinUrl = createEventJoinUrl(event.sku, user?.member_card);
      
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(joinUrl);
        showSuccess('連結已複製', '報名連結已複製到剪貼簿');
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = joinUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
          showSuccess('連結已複製', '報名連結已複製到剪貼簿');
        } catch (err) {
          showError('複製失敗', '無法自動複製，請手動複製連結');
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (error: any) {
      showError('複製失敗', error.message || '複製過程中發生錯誤');
    }
  };

  // 直接跳轉到報名頁面
  const handleJoinEvent = (event: ItemEventItem) => {
    if (!event.sku) {
      showError('無法報名', '此活動尚未設定 SKU，無法進行報名');
      return;
    }

    // 使用相對路徑進行導航,不使用完整 URL
    navigate(`/client/event/join/${event.sku}`);
  };

  // 獲取所有可用的標籤類別
  const getAvailableCategories = () => {
    const categories = new Set<string>();
    events.forEach(event => {
      if (event.item_tags) {
        event.item_tags.forEach((tag: any) => categories.add(tag.name));
      }
    });
    return Array.from(categories);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* 搜尋和篩選 */}
        <div className="mb-6 flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" style={{ fontSize: '20px' }}></i>
              <input
                type="text"
                placeholder="搜尋活動名稱或描述..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">所有狀態</option>
              <option value="registration_open">報名開放</option>
              <option value="registration_closed">報名截止</option>
              <option value="in_progress">進行中</option>
              <option value="completed">已完成</option>
            </select>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">所有類別</option>
              {getAvailableCategories().map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 載入狀態 */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${AI_COLORS.border} mx-auto mb-4`}></div>
              <p className="text-gray-600">載入活動資料中...</p>
            </div>
          </div>
        )}
        
        {/* 無資料狀態 */}
        {!loading && filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <i className="ri-calendar-line text-6xl"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">暫無活動</h3>
            <p className="text-gray-500">目前沒有符合條件的活動，請稍後再來查看</p>
          </div>
        )}
         
        {/* 活動列表 */}
        {!loading && filteredEvents.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <div key={event.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                {/* 活動主圖 */}
                {event.main_image && (
                  <div className="relative h-48 bg-gray-100">
                    <img
                      src={event.main_image.url}
                      alt={event.name}
                      className="w-full h-full object-cover"
                    />
                    {/* 活動狀態標籤 */}
                    <div className="absolute top-3 right-3">
                      {(() => {
                        const realTimeStatus = getEventRealTimeStatus(event);
                        return (
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            realTimeStatus.status === 'registration_open' ? 'bg-green-100 text-green-700' :
                            realTimeStatus.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                            realTimeStatus.status === 'ended' ? 'bg-gray-100 text-gray-700' :
                            realTimeStatus.status === 'registration_closed' ? 'bg-yellow-100 text-yellow-700' :
                            realTimeStatus.status === 'completed' ? `${AI_COLORS.bgLight} ${AI_COLORS.textDark}` :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {realTimeStatus.displayText}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                )}
                
                {/* 活動資訊 */}
                <div className="p-6 flex flex-col flex-1">
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2">{event.name}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2">{event.description}</p>
                  </div>
                  
                  {/* 活動詳情 */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <i className="ri-calendar-line" style={{ fontSize: '14px' }}></i>
                      <span>{formatDateTime(event.start_time)} - {formatDateTime(event.end_time)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <i className="ri-user-line" style={{ fontSize: '14px' }}></i>
                      <span>{event.min_participants} - {event.max_participants} 人</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <i className="ri-money-dollar-circle-line" style={{ fontSize: '14px' }}></i>
                      <span>NT$ {event.base_price}</span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <i className="ri-map-pin-line" style={{ fontSize: '14px' }}></i>
                        <span>{event.location}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* 活動標籤 */}
                  {event.item_tags && event.item_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {event.item_tags.map((tag: any, index: number) => (
                        <span key={index} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* 操作按鈕 - 固定在底部 */}
                  <div className="flex gap-2 mt-auto">
                    {(() => {
                      const realTimeStatus = getEventRealTimeStatus(event);
                      return (
                        <>
                          <button
                            onClick={() => handleJoinEvent(event)}
                            disabled={!realTimeStatus.canRegister}
                            className={`flex-1 px-4 py-2 ${AI_COLORS.button} rounded-xl disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm`}
                          >
                            {realTimeStatus.canRegister ? '立即報名' :
                             realTimeStatus.status === 'ended' ? '活動結束' :
                             realTimeStatus.status === 'in_progress' ? '進行中' :
                             '報名截止'}
                          </button>

                          <button
                            onClick={() => handleCopyJoinLink(event)}
                            className="px-3 py-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="複製報名連結"
                          >
                            <i className="ri-link" style={{ fontSize: '16px' }}></i>
                          </button>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserEvent;
