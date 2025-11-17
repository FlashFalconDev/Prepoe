import React, { useState, useEffect } from 'react';
import { X, MessageSquare } from 'lucide-react';
import { getReferrerOrders, type ReferrerOrder } from '../config/api';
import { useToast } from '../hooks/useToast';
import { AI_COLORS } from '../constants/colors';

interface ReferrerOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: number;
  itemName: string;
}

const ReferrerOrdersModal: React.FC<ReferrerOrdersModalProps> = ({ isOpen, onClose, itemId, itemName }) => {
  const [orders, setOrders] = useState<ReferrerOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReferrer, setSelectedReferrer] = useState<string>('all');
  const [remarkModalOpen, setRemarkModalOpen] = useState(false);
  const [selectedRemark, setSelectedRemark] = useState<string>('');
  const { showError } = useToast();

  useEffect(() => {
    if (isOpen && itemId) {
      loadOrders();
    }
  }, [isOpen, itemId]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await getReferrerOrders(itemId);
      if (response.success) {
        setOrders(response.data);
      } else {
        showError('載入失敗', response.message || '無法載入推薦訂單');
      }
    } catch (error: any) {
      showError('載入失敗', error.message || '載入推薦訂單時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

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

  // 格式化金額
  const formatAmount = (amount: number) => {
    return `NT$ ${amount.toLocaleString()}`;
  };

  // 取得訂單狀態顏色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      case 'refunded':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  // 獲取所有推薦人列表
  const getReferrers = () => {
    const referrers = new Set<number>();
    orders.forEach(order => {
      if (order.referrer_member_card_id !== null) {
        referrers.add(order.referrer_member_card_id);
      }
    });
    return Array.from(referrers).sort((a, b) => a - b);
  };

  // 按推薦人分組統計
  const getReferrerStats = () => {
    const stats: { [key: string]: { count: number; paidCount: number; totalRevenue: number } } = {};

    orders.forEach(order => {
      const referrerId = order.referrer_member_card_id?.toString() || 'none';

      if (!stats[referrerId]) {
        stats[referrerId] = { count: 0, paidCount: 0, totalRevenue: 0 };
      }

      stats[referrerId].count++;
      if (order.status === 'paid') {
        stats[referrerId].paidCount++;
        stats[referrerId].totalRevenue += order.payment_amount;
      }
    });

    return stats;
  };

  // 篩選訂單
  const filteredOrders = selectedReferrer === 'all'
    ? orders
    : selectedReferrer === 'none'
    ? orders.filter(o => o.referrer_member_card_id === null)
    : orders.filter(o => o.referrer_member_card_id?.toString() === selectedReferrer);

  const referrers = getReferrers();
  const referrerStats = getReferrerStats();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* 標題列 */}
        <div className={`${AI_COLORS.bg} p-6 flex items-center justify-between`}>
          <div>
            <h3 className="text-xl font-semibold text-white">訂單列表</h3>
            <p className="text-sm text-white text-opacity-90 mt-1">{itemName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* 內容區域 */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${AI_COLORS.border} mx-auto mb-4`}></div>
                <p className="text-gray-600">載入中...</p>
              </div>
            </div>
          )}

          {!loading && orders.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <i className="ri-shopping-cart-line text-6xl"></i>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">暫無訂單</h4>
              <p className="text-gray-500">此活動尚未有訂單記錄</p>
            </div>
          )}

          {!loading && orders.length > 0 && (
            <div className="space-y-4">
              {/* 推薦人篩選器 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <i className="ri-filter-line mr-1"></i>
                  按推薦人篩選
                </label>
                <select
                  value={selectedReferrer}
                  onChange={(e) => setSelectedReferrer(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">全部推薦人 ({orders.length} 筆訂單)</option>
                  <option value="none">
                    無推薦人 ({referrerStats['none']?.count || 0} 筆訂單)
                  </option>
                  {referrers.map(referrerId => (
                    <option key={referrerId} value={referrerId.toString()}>
                      推薦人 ID: {referrerId} ({referrerStats[referrerId.toString()]?.count || 0} 筆訂單)
                    </option>
                  ))}
                </select>
              </div>

              {/* 統計資訊 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">
                    {selectedReferrer !== 'all' ? '篩選訂單數' : '總訂單數'}
                  </div>
                  <div className="text-2xl font-bold text-blue-600">{filteredOrders.length}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">已付款訂單</div>
                  <div className="text-2xl font-bold text-green-600">
                    {filteredOrders.filter(o => o.status === 'paid').length}
                  </div>
                </div>
                <div className={`${AI_COLORS.bgLight} rounded-lg p-4`}>
                  <div className="text-sm text-gray-600 mb-1">總收入</div>
                  <div className={`text-2xl font-bold ${AI_COLORS.text}`}>
                    {formatAmount(filteredOrders.filter(o => o.status === 'paid').reduce((sum, o) => sum + o.payment_amount, 0))}
                  </div>
                </div>
              </div>

              {/* 推薦人排行榜 (只在查看全部時顯示) */}
              {selectedReferrer === 'all' && referrers.length > 0 && (
                <div className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <i className="ri-trophy-line text-yellow-500" style={{ fontSize: '18px' }}></i>
                    推薦人排行榜（按收入排名）
                  </h4>
                  <div className="space-y-2">
                    {referrers
                      .map(id => ({
                        id,
                        ...referrerStats[id.toString()]
                      }))
                      .sort((a, b) => b.totalRevenue - a.totalRevenue)
                      .slice(0, 5)
                      .map((referrer, index) => (
                        <div key={referrer.id} className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              index === 0 ? 'bg-yellow-400 text-white' :
                              index === 1 ? 'bg-gray-300 text-gray-700' :
                              index === 2 ? 'bg-orange-400 text-white' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">推薦人 ID: {referrer.id}</div>
                              <div className="text-xs text-gray-500">
                                {referrer.count} 筆訂單 · {referrer.paidCount} 筆已付款
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-bold ${AI_COLORS.text}`}>{formatAmount(referrer.totalRevenue)}</div>
                            <div className="text-xs text-gray-500">總收入</div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* 訂單列表 */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        訂單編號
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        狀態
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        原價
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        折扣
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        實付金額
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        會員卡 ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        推薦人 ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        建立時間
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        備註
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.sn}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                            {order.status_display}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatAmount(order.total_amount)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-red-600 text-right">
                          {order.discount_amount > 0 ? `-${formatAmount(order.discount_amount)}` : '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                          {formatAmount(order.payment_amount)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.member_card_id}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.referrer_member_card_id || '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDateTime(order.created_at)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          {order.remark && order.remark.trim() !== '' ? (
                            <button
                              onClick={() => {
                                setSelectedRemark(order.remark);
                                setRemarkModalOpen(true);
                              }}
                              className={`p-2 ${AI_COLORS.text} hover:bg-orange-50 rounded-lg transition-colors`}
                              title="查看備註"
                            >
                              <MessageSquare size={18} />
                            </button>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* 底部按鈕 */}
        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            關閉
          </button>
        </div>
      </div>

      {/* 備註彈跳視窗 */}
      {remarkModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]" onClick={() => setRemarkModalOpen(false)}>
          <div className="bg-white rounded-xl max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className={`${AI_COLORS.bg} p-4 flex items-center justify-between rounded-t-xl`}>
              <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                <MessageSquare size={20} />
                訂單備註
              </h4>
              <button
                onClick={() => setRemarkModalOpen(false)}
                className="p-1 text-white hover:bg-white hover:bg-opacity-20 rounded transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="bg-gray-50 rounded-lg p-4 min-h-[100px] max-h-[300px] overflow-y-auto">
                <p className="text-gray-700 whitespace-pre-wrap">{selectedRemark}</p>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setRemarkModalOpen(false)}
                className={`px-6 py-2 ${AI_COLORS.bg} text-white rounded-lg hover:opacity-90 transition-opacity`}
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferrerOrdersModal;
