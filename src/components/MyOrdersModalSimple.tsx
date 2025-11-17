import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getMyOrders } from '../config/api';
import { useToast } from '../hooks/useToast';
import { AI_COLORS } from '../constants/colors';

interface MyOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MyOrdersModalSimple: React.FC<MyOrdersModalProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderCount, setOrderCount] = useState(0);
  const { showError } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadOrders();
    }
  }, [isOpen]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📋 [Simple] 開始載入訂單');
      const response = await getMyOrders({ page: 1, page_size: 10 });
      console.log('📋 [Simple] API 回應:', response);

      if (response.success) {
        setOrderCount(response.data.orders.length);
        console.log('✅ [Simple] 訂單載入成功，數量:', response.data.orders.length);
      } else {
        setError(response.message || '無法載入訂單資料');
        showError('載入失敗', response.message || '無法載入訂單資料');
      }
    } catch (error: any) {
      console.error('❌ [Simple] 載入訂單時發生錯誤:', error);
      setError(error.message || '載入訂單時發生錯誤');
      showError('載入失敗', error.message || '載入訂單時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* 標題列 */}
        <div className={`${AI_COLORS.bg} p-6 flex items-center justify-between`}>
          <h3 className="text-xl font-semibold text-white">測試：我的活動訂單</h3>
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
            <div className="text-center py-12">
              <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${AI_COLORS.border} mx-auto mb-4`}></div>
              <p className="text-gray-600">載入中...</p>
            </div>
          )}

          {!loading && error && (
            <div className="text-center py-12">
              <p className="text-red-600 mb-2">載入失敗</p>
              <p className="text-gray-500">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <div className="text-center py-12">
              <p className="text-green-600 text-lg font-semibold mb-2">載入成功！</p>
              <p className="text-gray-700">找到 {orderCount} 筆訂單</p>
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
    </div>
  );
};

export default MyOrdersModalSimple;
