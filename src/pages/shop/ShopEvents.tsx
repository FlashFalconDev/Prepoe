import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Search, ChevronRight, Lock } from 'lucide-react';
import { api, API_ENDPOINTS, getEventStatusDisplay } from '../../config/api';
import { useToast } from '../../hooks/useToast';

/** 課程活動項目（list API type=event 每筆含 event_status、event_status_display） */
interface EventItem {
  item_pk: number;
  name: string;
  description: string;
  unit: string;
  price: number;
  is_active: boolean;
  sku: string;
  tags: string[];
  imgUrl?: string;
  imgUrl_list?: string[];
  category?: string;
  event_status?: string;
  event_status_display?: string;
}

const ShopEvents: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showError } = useToast();
  const clientSid = location.pathname.split('/')[2];

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  /** 狀態篩選：與 /client/event 一致，選項精簡，預設報名開放，所有狀態在最後 */
  const [filterStatus, setFilterStatus] = useState<string>('registration_open');
  /** 標籤分類：與 /client/event 一致，依 item.tags 篩選 */
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const isLoadingRef = useRef(false);

  /** 狀態選項：與後端參數表一致，報名開放預設，所有狀態在最後 */
  const statusOptions = [
    { value: 'registration_open', label: '報名開放' },
    { value: 'registration_closed', label: '報名截止' },
    { value: 'full', label: '已額滿' },
    { value: 'in_progress', label: '活動進行中' },
    { value: 'finished', label: '活動結束' },
    { value: 'cancelled', label: '活動取消' },
    { value: 'all', label: '所有狀態' },
  ];

  /** 從列表取得所有標籤類別（與 /client/event 的 getAvailableCategories 一致） */
  const getAvailableCategories = (): string[] => {
    const set = new Set<string>();
    events.forEach((item) => {
      (item.tags || []).forEach((t) => set.add(t));
    });
    return Array.from(set).sort();
  };

  /** 依選擇的狀態呼叫 API 帶 event_status，加快載入、減少資料量；切換狀態時重新載入 */
  useEffect(() => {
    if (!clientSid) return;
    loadEvents();
  }, [clientSid, filterStatus]);

  const loadEvents = async () => {
    if (isLoadingRef.current) return;
    try {
      isLoadingRef.current = true;
      setLoading(true);
      const params: Record<string, string> = {
        type: 'event',
        client_sid: clientSid!,
      };
      if (filterStatus !== 'all') {
        params.event_status = filterStatus;
      }
      const response = await api.get(API_ENDPOINTS.SHOP_ITEMS, { params });
      if (response.data.items) {
        const list = (response.data.items || []).filter(
          (item: EventItem) => item.is_active
        );
        setEvents(list);
      } else {
        setEvents([]);
      }
    } catch (error: any) {
      if (error.response?.status !== 401) {
        showError(error.response?.data?.message || '載入課程活動失敗');
      }
      setEvents([]);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  };

  /** 列表 API 已帶 event_status，僅 registration_open 為可報名（full 為額滿由後端排除或同列為不可報名） */
  const canRegister = (item: EventItem) => item.event_status === 'registration_open';

  const formatPrice = (price: number) => {
    if (price === 0) return '免費';
    return `NT$ ${price.toFixed(0)}`;
  };

  /** Shop 為客戶站點，報名留在 /shop/:clientSid/event/join/:sku，不導向平台 /client/event */
  const goToEventJoin = (sku: string) => {
    navigate(`/shop/${clientSid}/event/join/${sku}`);
  };

  /** 依狀態、標籤分類、搜尋篩選（狀態值與後端參數表一致） */
  const filteredEvents = events.filter((item) => {
    const status = item.event_status || '';
    const matchesStatus = filterStatus === 'all' || status === filterStatus;
    const matchesCategory =
      selectedCategory === 'all' ||
      (item.tags && item.tags.includes(selectedCategory));
    const matchSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesCategory && matchSearch;
  });

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-[57px] bg-gray-50 z-20 px-4 py-3 border-b border-gray-200 space-y-3">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜尋課程活動..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
        {/* 狀態 + 標籤分類：與 /client/event 一致，兩支 select */}
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="flex-1 min-w-0 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex-1 min-w-0 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="all">所有類別</option>
            {getAvailableCategories().map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 p-4 pb-24">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl overflow-hidden animate-pulse"
              >
                <div className="h-40 bg-gray-200" />
                <div className="p-4">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="space-y-4">
            {filteredEvents.map((item) => {
              const open = canRegister(item);
              const statusLabel =
                item.event_status_display ||
                getEventStatusDisplay(item.event_status || '');

              return (
                <div
                  key={item.item_pk}
                  className={`bg-white rounded-xl overflow-hidden shadow-sm transition-shadow ${
                    open ? 'hover:shadow-md' : 'opacity-90'
                  }`}
                >
                  <div className="relative aspect-[2/1] bg-gradient-to-br from-amber-400 to-orange-500">
                    {item.imgUrl ? (
                      <img
                        src={item.imgUrl}
                        alt={item.name}
                        className={`w-full h-full object-cover ${!open ? 'grayscale' : ''}`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Calendar size={48} className="text-white/50" />
                      </div>
                    )}
                    <div className={`absolute inset-0 ${open ? 'bg-black/20' : 'bg-black/40'}`} />
                    <div className="absolute top-3 right-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                          open
                            ? 'bg-green-500/90 text-white'
                            : 'bg-gray-600/90 text-white'
                        }`}
                      >
                        {open ? (
                          <>
                            <Calendar size={12} />
                            可報名
                          </>
                        ) : (
                          <>
                            <Lock size={12} />
                            {statusLabel || '已結束'}
                          </>
                        )}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/20 rounded-full text-xs mb-1">
                        <Calendar size={12} />
                        課程活動
                      </span>
                      <h3 className="font-bold text-lg line-clamp-1">{item.name}</h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {item.description}
                    </p>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-lg font-bold text-amber-600">
                        {formatPrice(item.price)}
                      </span>
                      {open ? (
                        <button
                          onClick={() => goToEventJoin(item.sku)}
                          className="flex items-center gap-1 px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors"
                        >
                          立即報名
                          <ChevronRight size={16} />
                        </button>
                      ) : (
                        <button
                          className="flex items-center gap-1 px-4 py-2 bg-gray-200 text-gray-500 text-sm font-medium rounded-lg cursor-not-allowed"
                          disabled
                          title={statusLabel}
                        >
                          <Lock size={14} />
                          {statusLabel || '已結束'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">
              {searchTerm
                ? '沒有符合的課程活動'
                : filterStatus === 'all'
                  ? '目前沒有課程活動'
                  : '目前沒有符合此狀態的課程活動'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopEvents;
