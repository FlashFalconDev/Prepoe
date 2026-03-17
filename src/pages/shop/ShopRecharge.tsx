import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Wallet, CreditCard, X, Sparkles, Gift } from 'lucide-react';
import { api, API_ENDPOINTS, createOrder, keysGetBatchDetail } from '../../config/api';
import { memberLabelMap } from '../../config/terms';
import { useToast } from '../../hooks/useToast';

// 付款方式資訊
interface PaymentInfo {
  payment_type: string;
  payment_display: string;
}

// 儲值商品
interface KeyBatchInfo {
  id: number;
  title: string;
  key_type: string;
  valid_from: string | null;
  valid_to: string | null;
}

interface RechargeShopItem {
  item_pk: number;
  name: string;
  description: string;
  price: number;
  base_price?: number;
  is_active: boolean;
  sku: string;
  imgUrl?: string;
  tags?: string[];
  key_batches?: KeyBatchInfo[];
}

// 從批次詳情取得獎勵摘要文字
const getBatchRewardText = (batch: any): string => {
  const parts: string[] = [];
  const grants: any[] = (batch.action_json?.grants || []) as any[];
  const labelMap = memberLabelMap;
  const totals = grants.reduce<Record<string, number>>((acc, g) => {
    const key = (g.type || '').toLowerCase();
    if (key !== 'role') acc[key] = (acc[key] || 0) + (Number(g.amount ?? g.value) || 0);
    return acc;
  }, {});
  if (!totals.points && (batch.points || 0) > 0) totals.points = Number(batch.points);
  if (!totals.coins && (batch.coins || 0) > 0) totals.coins = Number(batch.coins);
  if (!totals.tokens && (batch.tokens || 0) > 0) totals.tokens = Number(batch.tokens);
  Object.entries(totals).forEach(([k, v]) => { if (v > 0) parts.push(`${labelMap[k] || k} +${v}`); });
  const etickets: any[] = batch.eticket_rewards || [];
  if (etickets.length > 0) parts.push(...etickets.map((r: any) => `${r.eticket_item_name || '票券'}×${r.quantity || 1}`));
  return parts.join('、');
};

const ShopRecharge: React.FC = () => {
  const location = useLocation();
  const { showSuccess, showError } = useToast();

  // 從 URL 路徑解析 clientSid: /shop/:clientSid/recharge
  const clientSid = location.pathname.split('/')[2];

  const [items, setItems] = useState<RechargeShopItem[]>([]);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // 購買流程
  const [selectedItem, setSelectedItem] = useState<RechargeShopItem | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [purchasing, setPurchasing] = useState(false);

  // 直接跳轉付款頁面（避免被 LINE 等 App 阻擋彈出視窗）
  const redirectToPayment = (html: string) => {
    document.open();
    document.write(html);
    document.close();
    const form = document.querySelector('form');
    if (form) form.submit();
  };

  // 防止重複請求
  const hasLoadedRef = useRef(false);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    if (clientSid && !hasLoadedRef.current && !isLoadingRef.current) {
      loadItems();
    }
  }, [clientSid]);

  const loadItems = async () => {
    if (hasLoadedRef.current || isLoadingRef.current) return;

    try {
      isLoadingRef.current = true;
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.SHOP_ITEMS, {
        params: { type: 'recharge', client_sid: clientSid },
      });

      if (response.data.items) {
        const availableItems = (response.data.items || []).filter(
          (item: RechargeShopItem) => item.is_active && item.key_batches && item.key_batches.length > 0
        );
        // 取得每個批次的詳細獎勵內容
        const allBatchIds = availableItems.flatMap((item: RechargeShopItem) => (item.key_batches || []).map(b => b.id));
        if (allBatchIds.length > 0) {
          const details = await Promise.allSettled(allBatchIds.map(id => keysGetBatchDetail(id)));
          const detailMap: Record<number, any> = {};
          details.forEach((result, idx) => {
            if (result.status === 'fulfilled' && result.value) {
              const detail = result.value?.data?.batch || result.value?.batch || result.value?.data || result.value;
              if (detail && typeof detail === 'object') detailMap[allBatchIds[idx]] = detail;
            }
          });
          availableItems.forEach((item: RechargeShopItem) => {
            (item.key_batches || []).forEach((batch: any) => {
              if (detailMap[batch.id]) Object.assign(batch, detailMap[batch.id]);
            });
          });
        }
        setItems(availableItems);

        if (response.data.payment_info) {
          setPaymentInfo(response.data.payment_info);
          if (response.data.payment_info.length > 0) {
            setSelectedPayment(response.data.payment_info[0].payment_type);
          }
        }
      } else if (response.data.success === false) {
        showError(response.data.message);
      }
    } catch (error: any) {
      console.error('載入儲值商品失敗:', error);
      if (error.response?.status !== 401) {
        showError(error.response?.data?.message);
      }
      setItems([]);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
      hasLoadedRef.current = true;
    }
  };

  const getItemPrice = (item: RechargeShopItem) => {
    return item.price ?? item.base_price ?? 0;
  };

  const formatPrice = (price: number) => {
    if (price === 0) return '免費';
    return `NT$ ${price.toLocaleString()}`;
  };

  // 開啟購買確認
  const handleBuyClick = (item: RechargeShopItem) => {
    setSelectedItem(item);
    if (paymentInfo.length > 0 && !selectedPayment) {
      setSelectedPayment(paymentInfo[0].payment_type);
    }
  };

  // 結帳
  const handleCheckout = async () => {
    if (!selectedItem) return;

    const price = getItemPrice(selectedItem);

    if (price > 0 && !selectedPayment) {
      showError('請選擇付款方式');
      return;
    }

    try {
      setPurchasing(true);
      const orderData = {
        items: [{ item_pk: selectedItem.item_pk, quantity: 1 }],
        payment_method: price > 0 ? selectedPayment : 'free',
        return_url: window.location.href,
      };

      const response = await createOrder(orderData);

      if (response.success) {
        if (response.payment_html) {
          setSelectedItem(null);
          redirectToPayment(response.payment_html);
        } else {
          showSuccess(response.message || '儲值成功！');
          setSelectedItem(null);
          // 重新載入商品
          hasLoadedRef.current = false;
          loadItems();
        }
      } else {
        showError(response.message || '購買失敗');
      }
    } catch (error: any) {
      console.error('購買失敗:', error);
      showError(error.response?.data?.message || '購買過程中發生錯誤');
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 頁面內容 */}
      <div className="flex-1 p-4 pb-24">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden animate-pulse">
                <div className="h-24 bg-gray-200"></div>
                <div className="p-4">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="space-y-4">
            {items.map((item) => {
              const price = getItemPrice(item);
              return (
                <div
                  key={item.item_pk}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* 商品頭部 */}
                  <div className="bg-gradient-to-r from-amber-500 to-yellow-500 p-4 text-white relative overflow-hidden">
                    {/* 裝飾 */}
                    <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full"></div>
                    <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-white/10 rounded-full"></div>

                    <div className="relative flex items-start justify-between">
                      <div>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/20 rounded-full text-xs mb-2">
                          <Sparkles size={12} />
                          儲值方案
                        </span>
                        <h3 className="text-lg font-bold mb-1">{item.name}</h3>
                        <p className="text-2xl font-bold">
                          {formatPrice(price)}
                        </p>
                      </div>
                      {item.imgUrl ? (
                        <img src={item.imgUrl} alt={item.name} className="w-12 h-12 rounded-lg object-cover opacity-80" />
                      ) : (
                        <Wallet size={40} className="opacity-30" />
                      )}
                    </div>
                  </div>

                  {/* 商品詳情 */}
                  <div className="p-4">
                    {item.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                    )}

                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {item.tags.map((tag, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-amber-50 text-amber-600 text-xs rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {item.key_batches && item.key_batches.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {item.key_batches.map((batch) => (
                          <span key={batch.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full border border-green-200">
                            <Gift size={11} />
                            {getBatchRewardText(batch) || batch.title}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-amber-600">
                        {formatPrice(price)}
                      </span>
                      <button
                        onClick={() => handleBuyClick(item)}
                        className="px-5 py-2 bg-amber-600 text-white text-sm font-medium rounded-full hover:bg-amber-700 transition-colors flex items-center gap-1.5"
                      >
                        <Wallet size={16} />
                        立即購買
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Wallet size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 mb-2">目前沒有可購買的儲值方案</p>
            <p className="text-sm text-gray-400">敬請期待更多方案！</p>
          </div>
        )}
      </div>

      {/* 購買確認 Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-2xl w-full max-w-lg max-h-[85vh] flex flex-col animate-slide-up">
            {/* Modal 標題 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">確認購買</h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X size={24} className="text-gray-500" />
              </button>
            </div>

            {/* 商品資訊 */}
            <div className="p-4">
              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl mb-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 flex items-center justify-center flex-shrink-0">
                  {selectedItem.imgUrl ? (
                    <img src={selectedItem.imgUrl} alt={selectedItem.name} className="w-full h-full rounded-lg object-cover" />
                  ) : (
                    <Wallet size={20} className="text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 text-sm">{selectedItem.name}</h4>
                  {selectedItem.description && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{selectedItem.description}</p>
                  )}
                </div>
                <span className="text-lg font-bold text-amber-600 flex-shrink-0">
                  {formatPrice(getItemPrice(selectedItem))}
                </span>
              </div>

              {/* 購買獎勵 */}
              {selectedItem.key_batches && selectedItem.key_batches.length > 0 && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl">
                  <h4 className="text-xs font-medium text-green-700 mb-1.5 flex items-center gap-1.5">
                    <Gift size={14} />
                    購買後可獲得
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedItem.key_batches.map((batch: KeyBatchInfo) => (
                      <span key={batch.id} className="px-2 py-0.5 bg-white text-green-700 text-xs rounded-full border border-green-200">
                        {getBatchRewardText(batch) || batch.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 付款方式選擇 */}
              {getItemPrice(selectedItem) > 0 && paymentInfo.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <CreditCard size={16} />
                    選擇付款方式
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {paymentInfo.map((payment) => (
                      <button
                        key={payment.payment_type}
                        onClick={() => setSelectedPayment(payment.payment_type)}
                        className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                          selectedPayment === payment.payment_type
                            ? 'bg-amber-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {payment.payment_display}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 確認按鈕 */}
              <button
                onClick={handleCheckout}
                disabled={purchasing || (getItemPrice(selectedItem) > 0 && !selectedPayment)}
                className="w-full py-3 bg-amber-600 text-white font-medium rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {purchasing ? '處理中...' : getItemPrice(selectedItem) === 0 ? '免費領取' : '確認付款'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopRecharge;
