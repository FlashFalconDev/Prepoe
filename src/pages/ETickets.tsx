import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Ticket, TrendingUp, Users, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import ConfirmDialog from '../components/ConfirmDialog';
import { api, API_ENDPOINTS } from '../config/api';
import { AI_COLORS } from '../constants/colors';

// 票券類型定義
interface ETicketItem {
  id: number;
  name: string;
  description: string;
  base_price: string;
  sku: string;
  is_active: boolean;
  ticket_type: 'discount' | 'exchange' | 'admission' | 'gift' | 'topup';
  ticket_type_display: string;
  discount_type?: 'percentage' | 'fixed';
  discount_value?: string;
  topup_type?: 'points' | 'coins' | 'tokens' | 'bonus' | 'coins_special' | 'spread_quota';
  topup_type_display?: string;
  topup_amount?: number;
  auto_use_setting?: 'manual' | 'on_receive' | 'on_transfer';
  target_spread?: number | null;
  target_spread_name?: string;
  applicable_tags?: string[];
  min_purchase_amount?: string;
  max_discount_amount?: string;
  validity_type: 'dynamic' | 'fixed';
  valid_days?: number;
  valid_start_date?: string;
  valid_end_date?: string;
  is_transferable: boolean;
  max_transfer_times?: number;
  total_stock: number;
  issued_count: number;
  used_count: number;
  available_stock: number;
  usage_limit_per_member?: number;
  created_at: string;
  updated_at: string;
}

// 統計資料定義
interface Statistics {
  total_eticket_items: number;
  active_eticket_items: number;
  total_issued: number;
  active_tickets: number;
  used_tickets: number;
  expired_tickets: number;
  cancelled_tickets: number;
}

const ETickets: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { confirm, isOpen, options, handleConfirm, handleCancel } = useConfirm();

  // 檢查當前路由，判斷是否在管理模式下
  const isManageMode = window.location.pathname.startsWith('/manage/');
  const clientSid = isManageMode ? window.location.pathname.split('/')[2] : null;
  const baseUrl = isManageMode ? `/manage/${clientSid}/etickets` : '/provider/etickets';

  // 狀態管理
  const [etickets, setEtickets] = useState<ETicketItem[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<boolean | 'all'>('all');

  // 載入票券列表
  const loadETickets = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterType !== 'all') {
        params.ticket_type = filterType;
      }
      if (filterActive !== 'all') {
        params.is_active = filterActive;
      }
      // 管理模式下加入 manage_client_sid
      if (isManageMode && clientSid) {
        params.manage_client_sid = clientSid;
      }

      const response = await api.get(API_ENDPOINTS.ETICKETS, { params });
      if (response.data.success) {
        setEtickets(response.data.data);
      } else {
        showError(response.data.message || '載入票券失敗');
      }
    } catch (error: any) {
      console.error('載入票券失敗:', error);
      showError(error.response?.data?.message || '載入票券失敗');
    } finally {
      setLoading(false);
    }
  };

  // 載入統計資料
  const loadStatistics = async () => {
    try {
      const params: any = {};
      // 管理模式下加入 manage_client_sid
      if (isManageMode && clientSid) {
        params.manage_client_sid = clientSid;
      }
      const response = await api.get(API_ENDPOINTS.ETICKET_STATISTICS, { params });
      if (response.data.success) {
        setStatistics(response.data.data);
      } else {
        showError(response.data.message || '載入統計資料失敗');
      }
    } catch (error: any) {
      console.error('載入統計失敗:', error);
      showError(error.response?.data?.message || '載入統計資料失敗');
    }
  };

  // 刪除票券
  const handleDelete = async (eticket: ETicketItem) => {
    const confirmed = await confirm({
      title: '確認刪除',
      message: `確定要刪除票券「${eticket.name}」嗎？此操作無法復原。`,
      type: 'danger',
    });

    if (!confirmed) return;

    try {
      const data: any = {};
      // 管理模式下加入 manage_client_sid
      if (isManageMode && clientSid) {
        data.manage_client_sid = clientSid;
      }
      const response = await api.post(API_ENDPOINTS.ETICKET_DELETE(eticket.id), data);
      if (response.data.success) {
        showSuccess('票券刪除成功');
        loadETickets();
        loadStatistics();
      } else {
        showError(response.data.message || '刪除票券失敗');
      }
    } catch (error: any) {
      console.error('刪除票券失敗:', error);
      showError(error.response?.data?.message || '刪除票券失敗');
    }
  };

  // 初始化載入
  useEffect(() => {
    loadETickets();
    loadStatistics();
  }, [filterType, filterActive]);

  // 票券類型標籤顏色
  const getTicketTypeColor = (type: string, topupType?: string) => {
    // 牌陣次數票券使用橘色
    if (type === 'topup' && topupType === 'spread_quota') {
      return 'bg-orange-100 text-orange-700';
    }
    switch (type) {
      case 'discount':
        return 'bg-blue-100 text-blue-700';
      case 'exchange':
        return 'bg-green-100 text-green-700';
      case 'admission':
        return 'bg-purple-100 text-purple-700';
      case 'gift':
        return 'bg-pink-100 text-pink-700';
      case 'topup':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // 取得票券類型顯示文字
  const getTicketTypeDisplay = (eticket: ETicketItem) => {
    if (eticket.ticket_type === 'topup' && eticket.topup_type === 'spread_quota') {
      return '牌陣次數';
    }
    return eticket.ticket_type_display;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">電子票券管理</h1>
              <p className="text-gray-600 text-sm mt-1">建立和管理電子折扣券、兌換券、入場券等票券</p>
            </div>
            <button
              onClick={() => navigate(`${baseUrl}/create`)}
              className={`flex items-center gap-2 ${AI_COLORS.button} px-4 py-2 rounded-lg text-white font-medium`}
            >
              <Plus size={20} />
              建立票券
            </button>
          </div>

          {/* 統計卡片 */}
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">票券商品</p>
                    <p className="text-2xl font-bold text-gray-900">{statistics.total_eticket_items}</p>
                  </div>
                  <Ticket className="text-purple-600" size={32} />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">已發放</p>
                    <p className="text-2xl font-bold text-gray-900">{statistics.total_issued}</p>
                  </div>
                  <TrendingUp className="text-blue-600" size={32} />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">可使用</p>
                    <p className="text-2xl font-bold text-green-600">{statistics.active_tickets}</p>
                  </div>
                  <Users className="text-green-600" size={32} />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">已使用</p>
                    <p className="text-2xl font-bold text-gray-900">{statistics.used_tickets}</p>
                  </div>
                  <DollarSign className="text-orange-600" size={32} />
                </div>
              </div>
            </div>
          )}

          {/* 篩選器 */}
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <div className="flex gap-4 flex-wrap">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">票券類型</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">全部</option>
                  <option value="discount">折扣券</option>
                  <option value="exchange">兌換券</option>
                  <option value="admission">入場券</option>
                  <option value="gift">贈品券</option>
                  <option value="topup">點數卡</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">狀態</label>
                <select
                  value={filterActive === 'all' ? 'all' : filterActive ? 'active' : 'inactive'}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFilterActive(value === 'all' ? 'all' : value === 'active');
                  }}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">全部</option>
                  <option value="active">啟用</option>
                  <option value="inactive">停用</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 票券列表 */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : etickets.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Ticket className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">尚無票券</h3>
            <p className="text-gray-600 mb-4">開始建立您的第一個電子票券</p>
            <button
              onClick={() => navigate(`${baseUrl}/create`)}
              className={`${AI_COLORS.button} px-6 py-2 rounded-lg text-white font-medium`}
            >
              建立票券
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {etickets.map((eticket) => (
              <div key={eticket.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4">
                {/* 票券頭部 */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{eticket.name}</h3>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getTicketTypeColor(eticket.ticket_type, eticket.topup_type)}`}>
                      {getTicketTypeDisplay(eticket)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`${baseUrl}/edit/${eticket.id}`)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(eticket)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* 票券資訊 */}
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{eticket.description}</p>

                {/* 牌陣次數票券額外資訊 */}
                {eticket.ticket_type === 'topup' && eticket.topup_type === 'spread_quota' && (
                  <div className="mb-3 p-2 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-orange-600">🎴</span>
                      <span className="text-gray-700">
                        {eticket.topup_amount} 次抽牌
                      </span>
                    </div>
                    {eticket.target_spread_name && (
                      <p className="text-xs text-gray-500 mt-1">
                        適用牌陣：{eticket.target_spread_name}
                      </p>
                    )}
                    {!eticket.target_spread && eticket.applicable_tags && eticket.applicable_tags.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        適用標籤：{eticket.applicable_tags.join(', ')}
                      </p>
                    )}
                    {!eticket.target_spread && (!eticket.applicable_tags || eticket.applicable_tags.length === 0) && (
                      <p className="text-xs text-gray-500 mt-1">
                        適用：所有公開牌陣
                      </p>
                    )}
                  </div>
                )}

                {/* 統計資訊 */}
                <div className="grid grid-cols-3 gap-2 mb-3 pb-3 border-b border-gray-200">
                  <div>
                    <p className="text-xs text-gray-600">庫存</p>
                    <p className="font-semibold text-gray-900">{eticket.available_stock}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">已發放</p>
                    <p className="font-semibold text-gray-900">{eticket.issued_count}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">已使用</p>
                    <p className="font-semibold text-gray-900">{eticket.used_count}</p>
                  </div>
                </div>

                {/* 狀態 */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium ${eticket.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                    {eticket.is_active ? '● 啟用中' : '● 已停用'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 確認對話框 */}
      <ConfirmDialog
        isOpen={isOpen}
        title={options.title || ''}
        message={options.message}
        confirmText={options.confirmText}
        cancelText={options.cancelText}
        type={options.type}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default ETickets;
