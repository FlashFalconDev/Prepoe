import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Calendar, MapPin, Users, DollarSign, CheckCircle, XCircle, Clock } from 'lucide-react';
import { getMyOrders, MyOrder, MyOrderEventDetail, MyOrderParticipant } from '../config/api';
import { useToast } from '../hooks/useToast';
import { AI_COLORS } from '../constants/colors';
import PaymentModal from './PaymentModal';

interface MyOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MyOrdersModal: React.FC<MyOrdersModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<MyOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const { showError } = useToast();

  // 付款彈窗狀態
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<MyOrder | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadOrders();
    }
  }, [isOpen, currentPage]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        page_size: 10
      };

      console.log('📋 [MyOrdersModal] 開始載入訂單，參數:', params);
      const response = await getMyOrders(params);
      console.log('📋 [MyOrdersModal] API 回應:', response);

      if (response.success) {
        console.log('✅ [MyOrdersModal] 訂單載入成功，數量:', response.data.orders.length);
        setOrders(response.data.orders);
        setTotalPages(response.data.pagination.total_pages);
      } else {
        console.error('❌ [MyOrdersModal] 訂單載入失敗:', response.message);
        showError('載入失敗', response.message || '無法載入訂單資料');
      }
    } catch (error: any) {
      console.error('❌ [MyOrdersModal] 載入訂單時發生錯誤:', error);
      showError('載入失敗', error.message || '載入訂單時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  // 處理付款按鈕點擊
  const handlePaymentClick = (order: MyOrder) => {
    console.log('💳 [MyOrdersModal] 開啟付款彈窗');
    console.log('訂單資訊:', {
      order_id: order.order_id,
      order_sn: order.order_sn,
      total_amount: order.total_amount,
      payment_amount: order.payment_amount,
      status: order.status
    });

    setSelectedOrderForPayment(order);
    setIsPaymentModalOpen(true);
  };

  // 付款成功後重新載入訂單列表
  const handlePaymentSuccess = () => {
    console.log('✅ [MyOrdersModal] 付款成功，重新載入訂單');
    loadOrders();
  };

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

  const formatAmount = (amount: number) => {
    return `NT$ ${amount.toLocaleString()}`;
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'paid':
        return {
          bg: 'bg-green-100',
          text: 'text-green-700',
          icon: <CheckCircle className="w-4 h-4" />
        };
      case 'pending':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-700',
          icon: <Clock className="w-4 h-4" />
        };
      case 'cancelled':
      case 'refunded':
        return {
          bg: 'bg-red-100',
          text: 'text-red-700',
          icon: <XCircle className="w-4 h-4" />
        };
      case 'completed':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-700',
          icon: <CheckCircle className="w-4 h-4" />
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-700',
          icon: <Clock className="w-4 h-4" />
        };
    }
  };

  const toggleOrderExpand = (orderId: number) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  if (!isOpen) return null;

  // 渲染列表視圖內容
  const renderListView = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${AI_COLORS.border} mx-auto mb-4`}></div>
            <p className="text-gray-600">載入中...</p>
          </div>
        </div>
      );
    }

    if (orders.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <i className="ri-calendar-line text-6xl"></i>
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">暫無訂單</h4>
          <p className="text-gray-500">您還沒有參與任何活動</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.order_id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {/* 訂單頭部 */}
            <div
              className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => toggleOrderExpand(order.order_id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-600">訂單編號:</span>
                      <span className="text-sm font-semibold text-gray-900">{order.order_sn}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const style = getStatusStyle(order.status);
                        return (
                          <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${style.bg} ${style.text}`}>
                            {style.icon}
                            {order.status_display}
                          </span>
                        );
                      })()}
                      <span className="text-xs text-gray-500">{formatDateTime(order.created_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 mb-1">實付金額</div>
                  <div className={`text-lg font-bold ${AI_COLORS.text}`}>
                    {formatAmount(order.payment_amount)}
                  </div>
                  {order.discount_amount > 0 && (
                    <div className="text-xs text-gray-500 line-through">
                      {formatAmount(order.total_amount)}
                    </div>
                  )}
                </div>
                <i className={`ri-arrow-${expandedOrderId === order.order_id ? 'up' : 'down'}-s-line text-gray-400 text-xl`}></i>
              </div>
            </div>

            {/* 訂單詳情 */}
            {expandedOrderId === order.order_id && (
              <div className="p-4 border-t border-gray-200">
                <div className="space-y-4">
                  {order.events.map((event) => (
                    <div key={event.event_order_detail_id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex gap-4">
                        {event.event_images.length > 0 && event.event_images[0].url && (
                          <img
                            src={event.event_images[0].url}
                            alt={event.event_name}
                            className="w-32 h-32 object-cover rounded-lg"
                          />
                        )}

                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">{event.event_name}</h4>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{event.event_description}</p>

                          <div className="grid grid-cols-2 gap-3 text-sm">
                            {event.selected_date && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <Calendar className="w-4 h-4" />
                                <span>{event.selected_date}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-gray-600">
                              <Users className="w-4 h-4" />
                              <span>{event.participant_count} 人</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <DollarSign className="w-4 h-4" />
                              <span>{formatAmount(event.subtotal)}</span>
                            </div>
                          </div>

                          {event.special_requests && (
                            <div className="mt-3 text-sm">
                              <span className="text-gray-600">特殊需求: </span>
                              <span className="text-gray-800">{event.special_requests}</span>
                            </div>
                          )}

                          {/* 操作按鈕 */}
                          <div className="mt-4 flex gap-2">
                            <button
                              onClick={() => navigate(`/client/event/join/${event.event_sku}`)}
                              className={`flex-1 px-4 py-2 ${AI_COLORS.button} text-white rounded-lg hover:opacity-90 transition-opacity text-sm flex items-center justify-center gap-2`}
                            >
                              <i className="ri-information-line" style={{ fontSize: '16px' }}></i>
                              {order.status === 'paid' ? '活動詳情' : '活動介紹'}
                            </button>

                            {order.status === 'paid' && (
                              <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center justify-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                活動報到
                              </button>
                            )}

                            {order.status === 'pending' && (
                              <button
                                onClick={() => handlePaymentClick(order)}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center justify-center gap-2"
                              >
                                <DollarSign className="w-4 h-4" />
                                來去付費
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 參與者列表 */}
                      {event.participants.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h5 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            參與者名單
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {event.participants.map((participant) => (
                              <div key={participant.id} className="bg-white rounded-lg p-3 border border-gray-200">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium text-gray-900">{participant.name}</div>
                                    {participant.email && (
                                      <div className="text-xs text-gray-500">{participant.email}</div>
                                    )}
                                    {participant.phone && (
                                      <div className="text-xs text-gray-500">{participant.phone}</div>
                                    )}
                                    {participant.binding_code && (
                                      <div className="text-xs text-gray-500 mt-1">
                                        綁定碼: <span className="font-mono">{participant.binding_code}</span>
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    {participant.is_checked_in ? (
                                      <div className="flex flex-col items-center">
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                        <span className="text-xs text-green-600 mt-1">已報到</span>
                                        {participant.check_in_time && (
                                          <span className="text-xs text-gray-400 mt-1">
                                            {formatDateTime(participant.check_in_time)}
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="flex flex-col items-center">
                                        <Clock className="w-5 h-5 text-gray-400" />
                                        <span className="text-xs text-gray-500 mt-1">未報到</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* 分頁 */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一頁
            </button>
            <span className="text-sm text-gray-600">
              第 {currentPage} / {totalPages} 頁
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一頁
            </button>
          </div>
        )}
      </div>
    );
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col" style={{ minHeight: '500px' }}>
        {/* 標題列 */}
        <div className={`${AI_COLORS.bg} p-6 flex items-center justify-between`}>
          <div>
            <h3 className="text-xl font-semibold text-white">我的活動訂單</h3>
            <p className="text-sm text-white text-opacity-90 mt-1">查看已報名的活動和訂單狀態</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* 內容區域 */}
        <div className="p-6 overflow-y-auto flex-1" style={{ backgroundColor: '#f9fafb' }}>
          {renderListView()}
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

      {/* 付款彈窗 */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedOrderForPayment(null);
        }}
        order={selectedOrderForPayment}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default MyOrdersModal;
