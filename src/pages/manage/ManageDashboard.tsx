import React, { useState, useEffect } from 'react';
import { Users, ShoppingCart, Ticket, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import { api, API_ENDPOINTS } from '../../config/api';
import { AI_COLORS } from '../../constants/colors';

interface DashboardStats {
  total_members: number;
  total_orders: number;
  total_etickets: number;
  active_etickets: number;
  total_revenue: string;
  this_month_orders: number;
  this_month_revenue: string;
  pending_orders: number;
}

interface SelectedClient {
  managed_client_id: number;
  managed_client_sid: string;
  managed_client_name: string;
  company_name: string;
}

const ManageDashboard: React.FC = () => {
  const { clientSid } = useParams();
  const { showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [selectedClient, setSelectedClient] = useState<SelectedClient | null>(null);

  useEffect(() => {
    // 從 sessionStorage 讀取選擇的客戶資訊
    const clientData = sessionStorage.getItem('selected_manage_client');
    if (clientData) {
      setSelectedClient(JSON.parse(clientData));
    }
  }, []);

  // 載入戰情統計資料
  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      // 這裡暫時使用模擬資料，實際應該調用後端 API
      // const response = await api.get(API_ENDPOINTS.MANAGE_DASHBOARD_STATS(clientSid));

      // 模擬資料
      setTimeout(() => {
        setStats({
          total_members: 1234,
          total_orders: 567,
          total_etickets: 45,
          active_etickets: 32,
          total_revenue: '1,234,567',
          this_month_orders: 89,
          this_month_revenue: '123,456',
          pending_orders: 12,
        });
        setLoading(false);
      }, 500);
    } catch (error: any) {
      console.error('載入統計資料失敗:', error);
      showError(error.response?.data?.message || '載入統計資料失敗');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardStats();
  }, [clientSid]);

  const statCards = [
    {
      title: '總會員數',
      value: stats?.total_members || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: '+12%',
      changeType: 'increase',
    },
    {
      title: '總訂單數',
      value: stats?.total_orders || 0,
      icon: ShoppingCart,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: '+8%',
      changeType: 'increase',
    },
    {
      title: '電子票券',
      value: `${stats?.active_etickets || 0}/${stats?.total_etickets || 0}`,
      icon: Ticket,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      subtitle: '啟用/總數',
    },
    {
      title: '總營收',
      value: `NT$ ${stats?.total_revenue || 0}`,
      icon: DollarSign,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      change: '+15%',
      changeType: 'increase',
    },
    {
      title: '本月訂單',
      value: stats?.this_month_orders || 0,
      icon: Calendar,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100',
      subtitle: `NT$ ${stats?.this_month_revenue || 0}`,
    },
    {
      title: '待處理訂單',
      value: stats?.pending_orders || 0,
      icon: TrendingUp,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      change: '-3',
      changeType: 'decrease',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 pb-20 md:pb-6">
        {/* Header - Hidden on mobile (shown in header) */}
        <div className="mb-6 hidden md:block">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">戰情儀表板</h1>
          {selectedClient && (
            <p className="text-gray-600 text-sm">
              {selectedClient.company_name} - {selectedClient.managed_client_name}
            </p>
          )}
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
              {statCards.map((card, index) => {
                const Icon = card.icon;
                return (
                  <div
                    key={index}
                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 md:p-6"
                  >
                    <div className="flex items-center justify-between mb-3 md:mb-4">
                      <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg ${card.bgColor} flex items-center justify-center`}>
                        <Icon className={card.color} size={20} />
                      </div>
                      {card.change && (
                        <span
                          className={`text-xs md:text-sm font-medium ${
                            card.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {card.change}
                        </span>
                      )}
                    </div>
                    <h3 className="text-gray-600 text-xs md:text-sm font-medium mb-1">{card.title}</h3>
                    <p className="text-lg md:text-2xl font-bold text-gray-900 mb-1">{card.value}</p>
                    {card.subtitle && (
                      <p className="text-xs md:text-sm text-gray-500">{card.subtitle}</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Recent Activity */}
            <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">最近活動</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <ShoppingCart className="text-green-600" size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">新訂單 #12345</p>
                      <p className="text-sm text-gray-500">5 分鐘前</p>
                    </div>
                  </div>
                  <span className="text-green-600 font-medium">NT$ 1,200</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Users className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">新會員註冊</p>
                      <p className="text-sm text-gray-500">15 分鐘前</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <Ticket className="text-purple-600" size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">票券已使用</p>
                      <p className="text-sm text-gray-500">30 分鐘前</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ManageDashboard;
