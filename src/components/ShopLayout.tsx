import React, { useState, useEffect, createContext, useContext, useRef, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Newspaper, ShoppingBag, UtensilsCrossed, Ticket, User, X, LogIn, Gift } from 'lucide-react';
import { api, API_ENDPOINTS } from '../config/api';

// 會員卡資料介面
interface MemberCardData {
  id: number;
  card_id: string;
  exp: number;
  points: number;
  coins: number;
  tokens: number;
  email: string;
  phone: string;
  nick_name: string;
  birthday: string | null;
  gender: string;
  address: string;
  mdt_add: string | null;
  client_info: {
    id: number;
    name: string | null;
  };
  member_info: {
    id: number | null;
    name: string | null;
  } | null;
}

// Shop Context 用於共享會員卡資料
interface ShopContextType {
  memberCard: MemberCardData | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  refreshMemberCard: () => Promise<void>;
}

const ShopContext = createContext<ShopContextType>({
  memberCard: null,
  isLoggedIn: false,
  isLoading: true,
  refreshMemberCard: async () => {},
});

export const useShopContext = () => useContext(ShopContext);

interface ShopLayoutProps {
  children: React.ReactNode;
}

interface ShopInfo {
  client_sid: string;
  client_name: string;
  company_name: string;
  logo_url?: string;
}

const ShopLayout: React.FC<ShopLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clientSid } = useParams();
  const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null);
  const [memberCard, setMemberCard] = useState<MemberCardData | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginBanner, setShowLoginBanner] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // 防止重複請求
  const hasLoadedRef = useRef(false);
  const isLoadingRef = useRef(false);

  // 載入會員卡資料
  const loadMemberCard = useCallback(async (forceRefresh = false) => {
    // 防止重複請求
    if (!forceRefresh && (hasLoadedRef.current || isLoadingRef.current)) {
      return;
    }

    // 強制刷新時重置 banner dismissed 狀態
    if (forceRefresh) {
      setBannerDismissed(false);
    }

    try {
      isLoadingRef.current = true;
      setIsLoading(true);
      const response = await api.get(API_ENDPOINTS.MEMBER_CARD, {
        params: {
          client_sid: clientSid,
        }
      });

      if (response.data.success && response.data.data) {
        setMemberCard(response.data.data);
        setIsLoggedIn(true);
        setShowLoginBanner(false);
      } else {
        // 未登入
        setMemberCard(null);
        setIsLoggedIn(false);
        // forceRefresh 時強制顯示 banner
        if (forceRefresh || !bannerDismissed) {
          setShowLoginBanner(true);
        }
      }
      hasLoadedRef.current = true;
    } catch (error: any) {
      // 401 或其他錯誤表示未登入
      setMemberCard(null);
      setIsLoggedIn(false);
      // forceRefresh 時強制顯示 banner
      if (forceRefresh || !bannerDismissed) {
        setShowLoginBanner(true);
      }
      hasLoadedRef.current = true;
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [clientSid, bannerDismissed]);

  useEffect(() => {
    // 從 sessionStorage 讀取商店資訊（如果有的話）
    const shopData = sessionStorage.getItem('current_shop_info');
    if (shopData) {
      setShopInfo(JSON.parse(shopData));
    } else {
      // 預設使用 URL 中的 clientSid
      setShopInfo({
        client_sid: clientSid || '',
        client_name: clientSid || '',
        company_name: clientSid || '',
      });
    }

    // 載入會員卡資料
    if (clientSid && !hasLoadedRef.current && !isLoadingRef.current) {
      loadMemberCard();
    }
  }, [clientSid, loadMemberCard]);

  // 關閉登入提示
  const dismissBanner = () => {
    setShowLoginBanner(false);
    setBannerDismissed(true);
  };

  // 前往登入
  const goToLogin = () => {
    navigate('/login', { state: { from: location } });
  };

  const menuItems = [
    {
      id: 'home',
      label: '最新資訊',
      icon: Newspaper,
      path: `/shop/${clientSid}`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      activeColor: 'text-blue-600',
    },
    {
      id: 'products',
      label: '商品商城',
      icon: ShoppingBag,
      path: `/shop/${clientSid}/products`,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      activeColor: 'text-green-600',
    },
    {
      id: 'food',
      label: '美食點餐',
      icon: UtensilsCrossed,
      path: `/shop/${clientSid}/food`,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      activeColor: 'text-orange-600',
    },
    {
      id: 'tickets',
      label: '票券商城',
      icon: Ticket,
      path: `/shop/${clientSid}/tickets`,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      activeColor: 'text-purple-600',
    },
    {
      id: 'member',
      label: '會員中心',
      icon: User,
      path: `/shop/${clientSid}/member`,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
      activeColor: 'text-pink-600',
    },
  ];

  const isActivePath = (path: string) => {
    // 特殊處理首頁路徑（完全匹配）
    if (path === `/shop/${clientSid}`) {
      return location.pathname === path;
    }
    // 其他路徑使用前綴匹配
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // 取得當前頁面標題
  const getPageTitle = () => {
    const currentItem = menuItems.find(item => isActivePath(item.path));
    return currentItem?.label || '會員商城';
  };

  const contextValue: ShopContextType = {
    memberCard,
    isLoggedIn,
    isLoading,
    refreshMemberCard: () => loadMemberCard(true),
  };

  return (
    <ShopContext.Provider value={contextValue}>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Mobile Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-30">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <div className="flex items-center gap-3">
              {shopInfo?.logo_url ? (
                <img
                  src={shopInfo.logo_url}
                  alt={shopInfo.company_name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {(shopInfo?.company_name || clientSid || 'S').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-base font-semibold text-gray-900">
                  {shopInfo?.company_name || clientSid}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isLoggedIn && memberCard && (
                <div className="flex items-center gap-1 px-2 py-1 bg-purple-50 rounded-full">
                  <Gift size={14} className="text-purple-600" />
                  <span className="text-xs font-medium text-purple-600">
                    {memberCard.points} 點
                  </span>
                </div>
              )}
              <span className="text-sm font-medium text-gray-600">
                {getPageTitle()}
              </span>
            </div>
          </div>
        </header>

        {/* 登入提示 Banner */}
        {showLoginBanner && (
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-3 relative">
            <div className="max-w-lg mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Gift size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">
                    登入後可享有更多會員福利
                  </p>
                  <p className="text-white/80 text-xs mt-0.5">
                    累積點數、專屬優惠、會員價格
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={goToLogin}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white text-purple-600 text-sm font-medium rounded-full hover:bg-gray-100 transition-colors"
                >
                  <LogIn size={14} />
                  登入
                </button>
                <button
                  onClick={dismissBanner}
                  className="p-1 text-white/80 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 pb-20">
          <div className="max-w-lg mx-auto">
            {children}
          </div>
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-bottom">
          <div className="max-w-lg mx-auto">
            <div className="flex justify-around">
              {menuItems.map((item) => {
                const isActive = isActivePath(item.path);
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.path)}
                    className={`flex flex-col items-center py-2 px-2 flex-1 transition-colors ${
                      isActive ? item.activeColor : 'text-gray-400'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg transition-colors ${
                      isActive ? item.bgColor : ''
                    }`}>
                      <Icon size={20} />
                    </div>
                    <span className={`text-xs mt-1 ${isActive ? 'font-semibold' : 'font-medium'}`}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      </div>
    </ShopContext.Provider>
  );
};

export default ShopLayout;
