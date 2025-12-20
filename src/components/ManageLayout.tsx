import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Key, ShoppingCart, Layers, Ticket, Menu, X, ArrowLeft } from 'lucide-react';
import { AI_COLORS } from '../constants/colors';

interface ManageLayoutProps {
  children: React.ReactNode;
}

interface SelectedClient {
  managed_client_id: number;
  managed_client_sid: string;
  managed_client_name: string;
  company_name: string;
}

const ManageLayout: React.FC<ManageLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clientSid } = useParams();
  const [selectedClient, setSelectedClient] = useState<SelectedClient | null>(null);

  useEffect(() => {
    // 從 sessionStorage 讀取選擇的客戶資訊
    const clientData = sessionStorage.getItem('selected_manage_client');
    if (clientData) {
      setSelectedClient(JSON.parse(clientData));
    }
  }, []);

  const menuItems = [
    {
      id: 'dashboard',
      label: '戰情儀表板',
      icon: Menu,
      path: `/manage/${clientSid}`,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
    {
      id: 'keys',
      label: '金鑰設定',
      icon: Key,
      path: `/manage/${clientSid}/keys`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      id: 'shop',
      label: '商城設定',
      icon: ShoppingCart,
      path: `/manage/${clientSid}/shop`,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      id: 'cards',
      label: '卡牌關聯',
      icon: Layers,
      path: `/manage/${clientSid}/cards`,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      id: 'etickets',
      label: '電子票券',
      icon: Ticket,
      path: `/manage/${clientSid}/etickets`,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  const isActivePath = (path: string) => {
    // 特殊處理戰情儀表板路徑（完全匹配）
    if (path === `/manage/${clientSid}`) {
      return location.pathname === path;
    }
    // 其他路徑使用前綴匹配
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // 取得當前頁面標題
  const getPageTitle = () => {
    const currentItem = menuItems.find(item => isActivePath(item.path));
    return currentItem?.label || '管理系統';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 md:hidden">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">{getPageTitle()}</h1>
          {selectedClient && (
            <span className="text-xs text-gray-600 truncate max-w-[150px]">
              {selectedClient.company_name}
            </span>
          )}
        </div>
      </header>

      {/* Desktop Sidebar */}
      <nav className="hidden md:flex md:flex-col md:w-64 md:bg-white md:border-r md:border-gray-200 md:min-h-screen">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <button
              onClick={() => navigate('/manage')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="text-sm">返回選擇</span>
            </button>
            {selectedClient && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">
                  {selectedClient.company_name}
                </h2>
                <p className="text-sm text-gray-600">{selectedClient.managed_client_name}</p>
              </div>
            )}
          </div>

          {/* Menu Items */}
          <div className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const isActive = isActivePath(item.path);
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? `${item.bgColor} ${item.color}`
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              管理模式
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="flex justify-around">
          {menuItems.map((item) => {
            const isActive = isActivePath(item.path);
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center py-2 px-3 transition-colors ${
                  isActive ? item.color : 'text-gray-600'
                }`}
              >
                <Icon size={20} />
                <span className="text-xs mt-1 font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default ManageLayout;
