import React, { useState, useEffect } from 'react';
import { X, CreditCard, Loader } from 'lucide-react';
import { payOrder, MyOrder, OrderPaymentInfo } from '../config/api';
import { useToast } from '../hooks/useToast';
import { AI_COLORS } from '../constants/colors';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: MyOrder | null;
  onPaymentSuccess?: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, order, onPaymentSuccess }) => {
  const [paymentMethods, setPaymentMethods] = useState<OrderPaymentInfo[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [paying, setPaying] = useState(false);
  const { showError, showSuccess } = useToast();

  useEffect(() => {
    if (isOpen && order && order.payment_info) {
      console.log('💳 [PaymentModal] 載入付款方式');
      console.log('💳 [PaymentModal] 訂單資訊:', {
        order_id: order.order_id,
        order_sn: order.order_sn,
        payment_info: order.payment_info
      });

      // 直接使用訂單中的 payment_info
      setPaymentMethods(order.payment_info);

      // 預設選擇第一個可用的付款方式
      if (order.payment_info.length > 0) {
        setSelectedMethod(order.payment_info[0].payment_type);
      }

      console.log('✅ [PaymentModal] 付款方式載入成功:', order.payment_info);
    }
  }, [isOpen, order]);

  const handlePayment = async () => {
    if (!order || !selectedMethod) {
      showError('請選擇付款方式', '請先選擇一個付款方式');
      return;
    }

    try {
      setPaying(true);
      console.log('💳 [PaymentModal] 執行付款:', { orderId: order.order_id, method: selectedMethod });

      const response = await payOrder(order.order_id, selectedMethod);

      if (response.success) {
        console.log('✅ [PaymentModal] 付款 API 響應:', response);

        // 處理付款 HTML（藍新支付等第三方支付）
        if (response.payment_html) {
          console.log('📄 [PaymentModal] 開啟付款 HTML 表單');

          // 在新視窗中開啟付款頁面
          const paymentWindow = window.open('', '_blank');
          if (paymentWindow) {
            paymentWindow.document.write(response.payment_html);
            paymentWindow.document.close();

            showSuccess('付款處理中', '付款視窗已開啟，請完成付款');

            // 關閉付款彈窗並重新載入訂單
            if (onPaymentSuccess) {
              onPaymentSuccess();
            }
            onClose();
          } else {
            showError('無法開啟付款視窗', '請允許彈出視窗或檢查瀏覽器設定');
          }
        }
        // 處理付款 URL（LINE Pay 等）
        else if (response.data?.payment_url) {
          console.log('🔗 [PaymentModal] 跳轉到付款 URL:', response.data.payment_url);
          showSuccess('付款成功', '正在跳轉到付款頁面...');
          window.location.href = response.data.payment_url;
        }
        // 無需付款或已完成
        else {
          showSuccess('處理成功', '訂單已處理');
          if (onPaymentSuccess) {
            onPaymentSuccess();
          }
          onClose();
        }
      } else {
        showError('付款失敗', response.message || '執行付款時發生錯誤');
      }
    } catch (error: any) {
      console.error('❌ [PaymentModal] 執行付款失敗:', error);
      showError('付款失敗', error.message || '執行付款時發生錯誤');
    } finally {
      setPaying(false);
    }
  };

  const formatAmount = (amount: number) => {
    return `NT$ ${amount.toLocaleString()}`;
  };

  const getPaymentMethodIcon = (methodType: string) => {
    // 根據付款方式類型返回對應的圖標
    switch (methodType) {
      case 'ECPay':
        return '🏪';
      case 'LINEPay':
        return '💚';
      case 'NewebPay':
        return '💳';
      case 'CreditCard':
        return '💳';
      default:
        return '💰';
    }
  };

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full overflow-hidden">
        {/* 標題列 */}
        <div className={`${AI_COLORS.bg} p-6 flex items-center justify-between`}>
          <div>
            <h3 className="text-xl font-semibold text-white">選擇付款方式</h3>
            <p className="text-sm text-white text-opacity-90 mt-1">訂單編號：{order.order_sn}</p>
          </div>
          <button
            onClick={onClose}
            disabled={paying}
            className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* 訂單資訊 */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">訂單狀態</span>
            <span className={`px-2 py-1 text-xs rounded-full ${
              order.status === 'paid' ? 'bg-green-100 text-green-700' :
              order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {order.status_display}
            </span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">訂單金額</span>
            <span className="text-sm font-medium text-gray-900">{formatAmount(order.total_amount)}</span>
          </div>
          {order.discount_amount > 0 && (
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">折扣金額</span>
              <span className="text-sm font-medium text-red-600">-{formatAmount(order.discount_amount)}</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <span className="text-base font-semibold text-gray-900">應付金額</span>
            <span className={`text-lg font-bold ${AI_COLORS.text}`}>{formatAmount(order.payment_amount)}</span>
          </div>
        </div>

        {/* 付款方式列表 */}
        <div className="p-6">
          {paymentMethods.length === 0 && (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 text-sm">暫無可用的付款方式</p>
            </div>
          )}

          {paymentMethods.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700 mb-3">請選擇付款方式：</p>
              {paymentMethods.map((method) => (
                <label
                  key={method.payment_type}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedMethod === method.payment_type
                      ? `${AI_COLORS.border} bg-orange-50`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.payment_type}
                    checked={selectedMethod === method.payment_type}
                    onChange={(e) => setSelectedMethod(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center flex-1">
                    <span className="text-2xl mr-3">{getPaymentMethodIcon(method.payment_type)}</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{method.payment_display}</div>
                    </div>
                    {selectedMethod === method.payment_type && (
                      <div className={`w-5 h-5 rounded-full ${AI_COLORS.bg} flex items-center justify-center`}>
                        <i className="ri-check-line text-white text-sm"></i>
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* 底部按鈕 */}
        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            disabled={paying}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            取消
          </button>
          <button
            onClick={handlePayment}
            disabled={!selectedMethod || paying}
            className={`flex-1 px-4 py-2 ${AI_COLORS.button} text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
          >
            {paying ? (
              <>
                <Loader className="animate-spin h-4 w-4" />
                處理中...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4" />
                確認付款
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
