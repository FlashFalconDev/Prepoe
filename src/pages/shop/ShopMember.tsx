import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  User, CreditCard, Ticket, Heart, MapPin, Settings,
  ChevronRight, Bell, HelpCircle, LogOut, Star, Gift,
  QrCode, Clock, ShoppingBag, LogIn
} from 'lucide-react';
import { api, API_ENDPOINTS, logout } from '../../config/api';
import { useShopContext } from '../../components/ShopLayout';
import { useToast } from '../../hooks/useToast';

const ShopMember: React.FC = () => {
  const { clientSid } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // 使用 ShopContext 取得會員卡資料
  const { memberCard, isLoggedIn, isLoading: contextLoading, refreshMemberCard } = useShopContext();
  const { showSuccess, showError } = useToast();
  const [loggingOut, setLoggingOut] = useState(false);

  // 票券數量
  const [ticketCount, setTicketCount] = useState<number>(0);
  const [loadingTickets, setLoadingTickets] = useState(false);

  // 防止重複請求
  const hasLoadedTicketsRef = useRef(false);
  const isLoadingTicketsRef = useRef(false);

  // 載入票券數量
  useEffect(() => {
    if (isLoggedIn && !hasLoadedTicketsRef.current && !isLoadingTicketsRef.current) {
      loadTicketCount();
    }
  }, [isLoggedIn]);

  const loadTicketCount = async () => {
    if (hasLoadedTicketsRef.current || isLoadingTicketsRef.current) return;

    try {
      isLoadingTicketsRef.current = true;
      setLoadingTickets(true);
      const response = await api.get(API_ENDPOINTS.MY_ETICKETS, {
        params: {
          client_sid: clientSid,
          status: 'active'  // 只統計可使用的票券
        }
      });

      if (response.data.success && Array.isArray(response.data.data)) {
        setTicketCount(response.data.data.length);
      } else {
        setTicketCount(0);
      }
      hasLoadedTicketsRef.current = true;
    } catch (error) {
      console.error('載入票券數量失敗:', error);
      setTicketCount(0);
      hasLoadedTicketsRef.current = true;
    } finally {
      setLoadingTickets(false);
      isLoadingTicketsRef.current = false;
    }
  };

  // 前往登入
  const goToLogin = () => {
    navigate('/login', { state: { from: location } });
  };

  // 登出
  const handleLogout = async () => {
    if (loggingOut) return;

    try {
      setLoggingOut(true);
      await logout();
      showSuccess('已成功登出');
      // 重新整理會員卡狀態
      await refreshMemberCard();
    } catch (error: any) {
      console.error('登出失敗:', error);
      showError('登出失敗，請稍後再試');
    } finally {
      setLoggingOut(false);
    }
  };

  const getLevelColor = (exp: number) => {
    if (exp >= 10000) return 'from-purple-400 to-purple-600'; // 白金
    if (exp >= 5000) return 'from-yellow-400 to-yellow-600';  // 金卡
    if (exp >= 1000) return 'from-gray-300 to-gray-500';      // 銀卡
    return 'from-blue-400 to-blue-600';                        // 一般
  };

  const getLevelName = (exp: number) => {
    if (exp >= 10000) return '白金會員';
    if (exp >= 5000) return '金卡會員';
    if (exp >= 1000) return '銀卡會員';
    return '一般會員';
  };

  const menuSections = [
    {
      title: '我的服務',
      items: [
        { icon: Ticket, label: '我的票券', badge: ticketCount, path: `/shop/${clientSid}/my-tickets` },
        { icon: ShoppingBag, label: '訂單紀錄', badge: null, path: `/shop/${clientSid}/member/orders` },
        { icon: Heart, label: '收藏清單', badge: null, path: `/shop/${clientSid}/member/favorites` },
        { icon: MapPin, label: '常用地址', badge: null, path: `/shop/${clientSid}/member/addresses` },
      ],
    },
    {
      title: '帳戶設定',
      items: [
        { icon: User, label: '個人資料', badge: null, path: `/shop/${clientSid}/member/profile` },
        { icon: CreditCard, label: '付款方式', badge: null, path: `/shop/${clientSid}/member/payment` },
        { icon: Bell, label: '通知設定', badge: null, path: `/shop/${clientSid}/member/notifications` },
        { icon: Settings, label: '帳戶設定', badge: null, path: `/shop/${clientSid}/member/settings` },
      ],
    },
    {
      title: '其他',
      items: [
        { icon: HelpCircle, label: '幫助中心', badge: null, path: `/shop/${clientSid}/help` },
        { icon: Star, label: '給我們評價', badge: null, path: null },
      ],
    },
  ];

  if (contextLoading) {
    return (
      <div className="p-4">
        <div className="bg-white rounded-xl p-6 animate-pulse">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 未登入狀態
  if (!isLoggedIn) {
    return (
      <div className="p-4">
        <div className="bg-white rounded-xl p-8 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User size={40} className="text-gray-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">尚未登入</h2>
          <p className="text-sm text-gray-500 mb-6">登入後即可享受完整會員服務</p>
          <button
            onClick={goToLogin}
            className="w-full py-3 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
          >
            <LogIn size={18} />
            登入 / 註冊
          </button>
        </div>

        {/* 未登入也顯示部分選單 */}
        <div className="mt-4 space-y-4">
          <div className="bg-white rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-medium text-gray-500">其他</h3>
            </div>
            <div>
              <button
                onClick={() => navigate(`/shop/${clientSid}/help`)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <HelpCircle size={20} className="text-gray-500" />
                  <span className="text-gray-700">幫助中心</span>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 會員名稱（優先使用 nick_name，其次使用 email 或 phone 的前半部分，或卡號）
  const displayName = memberCard?.nick_name ||
                      memberCard?.email?.split('@')[0] ||
                      (memberCard?.phone ? memberCard.phone.slice(0, 4) + '****' : null) ||
                      `會員 ${memberCard?.card_id}`;

  return (
    <div className="pb-4">
      {/* 會員卡片 */}
      <div className="p-4">
        <div className={`bg-gradient-to-br ${getLevelColor(memberCard?.exp || 0)} rounded-2xl p-5 text-white relative overflow-hidden`}>
          {/* 裝飾 */}
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full"></div>
          <div className="absolute -right-5 -bottom-5 w-20 h-20 bg-white/10 rounded-full"></div>

          <div className="relative">
            {/* 頭部 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full border-2 border-white/30 bg-white/20 flex items-center justify-center">
                  <User size={24} />
                </div>
                <div>
                  <h2 className="font-bold text-lg">{displayName}</h2>
                  <p className="text-sm opacity-80">{getLevelName(memberCard?.exp || 0)}</p>
                </div>
              </div>
              <button className="p-2 bg-white/20 rounded-full">
                <QrCode size={20} />
              </button>
            </div>

            {/* 數據 */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/20">
              <div className="text-center">
                <p className="text-2xl font-bold">{(memberCard?.points || 0).toLocaleString()}</p>
                <p className="text-xs opacity-80">積分</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold italic">{memberCard?.coins || 0}</p>
                <p className="text-xs opacity-80">金幣</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{ticketCount}</p>
                <p className="text-xs opacity-80">票券</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 快捷功能 */}
      <div className="px-4 mb-4">
        <div className="bg-white rounded-xl p-4">
          <div className="grid grid-cols-4 gap-4">
            {[
              { icon: Clock, label: '待付款', count: 0 },
              { icon: ShoppingBag, label: '待出貨', count: 0 },
              { icon: Gift, label: '待收貨', count: 0 },
              { icon: Star, label: '待評價', count: 0 },
            ].map((item, index) => (
              <button key={index} className="flex flex-col items-center">
                <div className="relative mb-1">
                  <item.icon size={24} className="text-gray-600" />
                  {item.count > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {item.count}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-600">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 功能選單 */}
      <div className="px-4 space-y-4">
        {menuSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="bg-white rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-medium text-gray-500">{section.title}</h3>
            </div>
            <div>
              {section.items.map((item, itemIndex) => (
                <button
                  key={itemIndex}
                  onClick={() => item.path && navigate(item.path)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={20} className="text-gray-500" />
                    <span className="text-gray-700">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.badge != null && item.badge > 0 && (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-600 text-xs rounded-full">
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight size={18} className="text-gray-400" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* 登出按鈕 */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center justify-center gap-2 py-3 bg-white rounded-xl text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LogOut size={18} className={loggingOut ? 'animate-spin' : ''} />
          <span>{loggingOut ? '登出中...' : '登出'}</span>
        </button>
      </div>
    </div>
  );
};

export default ShopMember;
