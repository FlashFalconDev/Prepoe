import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { Ticket, Clock, Tag, Gift, Percent, Search, ShoppingCart, Plus, Minus, X, CreditCard } from 'lucide-react';
import { api, API_ENDPOINTS, createOrder } from '../../config/api';
import { COIN_LABEL } from '../../config/terms';
import { useToast } from '../../hooks/useToast';

// 付款方式資訊（Item API 規格：vendor_code / display_name；相容舊欄位 payment_type / payment_display）
interface PaymentInfo {
  vendor_code?: string;
  display_name?: string;
  payment_type?: string;
  payment_display?: string;
  data?: Record<string, unknown>;
  icon?: string | null;
  requires_options?: boolean;
}

// 票券商品資訊 (來自 eticket_info)
interface EticketInfo {
  ticket_type: 'discount' | 'exchange' | 'topup';
  ticket_type_display: string;
  discount_type?: 'percentage' | 'fixed';
  discount_value?: number;
  exchange_code?: string;
  topup_type?: string;
  topup_amount?: number;
  auto_use_setting: 'manual' | 'on_receive' | 'on_transfer';
  min_purchase_amount?: number;
  max_discount_amount?: number;
  applicable_tags?: string[];
  validity_type: 'dynamic' | 'fixed';
  valid_days?: number;
  valid_start_date?: string;
  valid_end_date?: string;
  is_transferable: boolean;
  max_transfer_times?: number;
  total_stock: number;
  issued_count: number;
  used_count: number;
  available_stock: number | null;
  usage_limit_per_member?: number;
}

// 統一商品格式
interface ShopItem {
  item_pk: number;
  name: string;
  description: string;
  unit: string;
  price: number;
  is_active: boolean;
  sku: string;
  tags: string[];
  imgUrl?: string;
  imgUrl_list?: string[];
  category?: string;
  eticket_info: EticketInfo;
}

interface CartItem extends ShopItem {
  quantity: number;
}

const ShopTickets: React.FC = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showSuccess, showError } = useToast();

  // 從 URL 路徑解析 clientSid: /shop/:clientSid/tickets
  const clientSid = location.pathname.split('/')[2];

  const [tickets, setTickets] = useState<ShopItem[]>([]);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCartModal, setShowCartModal] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<string>('');

  // 直接跳轉付款頁面（避免被 LINE 等 App 阻擋彈出視窗）
  const redirectToPayment = (html: string) => {
    document.open();
    document.write(html);
    document.close();

    const form = document.querySelector('form');
    if (form) {
      console.log('✅ 找到支付表單，自動提交');
      form.submit();
    }
  };

  // 防止重複請求
  const hasLoadedRef = useRef(false);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    if (clientSid && !hasLoadedRef.current && !isLoadingRef.current) {
      loadTickets();
    }
  }, [clientSid]);

  // 從抽卡推薦等外部進入：add_sku + open_cart=1 時，加入該票券並開啟購物車/結帳畫面
  const addSkuHandledRef = useRef<string | null>(null);
  useEffect(() => {
    const addSku = searchParams.get('add_sku');
    const openCart = searchParams.get('open_cart') === '1';
    if (!addSku || !openCart || tickets.length === 0 || addSkuHandledRef.current === addSku) return;
    const item = tickets.find((t: ShopItem) => t.sku === addSku);
    if (item) {
      addSkuHandledRef.current = addSku;
      setCart(prev => {
        const existing = prev.find(cartItem => cartItem.item_pk === item.item_pk);
        if (existing) {
          const availableStock = item.eticket_info.available_stock;
          const usageLimit = item.eticket_info.usage_limit_per_member;
          const maxQty = Math.min(
            availableStock !== null ? availableStock : Infinity,
            usageLimit && usageLimit > 0 ? usageLimit : Infinity
          );
          if (existing.quantity >= maxQty) {
            showError(`此票券最多只能購買 ${maxQty} ${item.unit}`);
            return prev;
          }
          return prev.map(cartItem =>
            cartItem.item_pk === item.item_pk ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
          );
        }
        return [...prev, { ...item, quantity: 1 }];
      });
      setShowCartModal(true);
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.delete('add_sku');
        next.delete('open_cart');
        return next;
      }, { replace: true });
    }
  }, [tickets, searchParams, setSearchParams, showError]);

  const loadTickets = async () => {
    if (hasLoadedRef.current || isLoadingRef.current) return;

    try {
      isLoadingRef.current = true;
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.SHOP_ITEMS, {
        params: {
          type: 'eticket',
          client_sid: clientSid,
        }
      });

      if (response.data.items) {
        // 過濾出有庫存且啟用的票券
        const availableTickets = (response.data.items || []).filter(
          (item: ShopItem) =>
            item.is_active &&
            (item.eticket_info.available_stock === null || item.eticket_info.available_stock > 0)
        );
        setTickets(availableTickets);

        // 設置付款方式
        if (response.data.payment_info) {
          setPaymentInfo(response.data.payment_info);
          if (response.data.payment_info.length > 0) {
            const first = response.data.payment_info[0];
            setSelectedPayment(first.vendor_code ?? first.payment_type ?? '');
          }
        }
      } else if (response.data.success === false) {
        showError(response.data.message);
      }
    } catch (error: any) {
      console.error('載入票券失敗:', error);
      if (error.response?.status !== 401) {
        showError(error.response?.data?.message);
      }
      setTickets([]);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
      hasLoadedRef.current = true;
    }
  };

  // 加入購物車
  const addToCart = (item: ShopItem) => {
    setCart(prev => {
      const existing = prev.find(cartItem => cartItem.item_pk === item.item_pk);
      if (existing) {
        // 檢查是否超過庫存或每人限購
        const availableStock = item.eticket_info.available_stock;
        const usageLimit = item.eticket_info.usage_limit_per_member;
        const maxQty = Math.min(
          availableStock !== null ? availableStock : Infinity,
          usageLimit && usageLimit > 0 ? usageLimit : Infinity
        );
        if (existing.quantity >= maxQty) {
          showError(`此票券最多只能購買 ${maxQty} ${item.unit}`);
          return prev;
        }
        return prev.map(cartItem =>
          cartItem.item_pk === item.item_pk ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  // 從購物車移除
  const removeFromCart = (itemPk: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.item_pk === itemPk);
      if (existing && existing.quantity > 1) {
        return prev.map(item =>
          item.item_pk === itemPk ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
      return prev.filter(item => item.item_pk !== itemPk);
    });
  };

  // 完全移除某項目
  const removeItemFromCart = (itemPk: number) => {
    setCart(prev => prev.filter(item => item.item_pk !== itemPk));
  };

  // 取得購物車中某票券的數量
  const getCartQuantity = (itemPk: number) => {
    const item = cart.find(i => i.item_pk === itemPk);
    return item?.quantity || 0;
  };

  // 購物車總數量
  const getTotalItems = () => cart.reduce((sum, item) => sum + item.quantity, 0);

  // 購物車總金額
  const getTotalPrice = () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // 結帳
  const handleCheckout = async () => {
    if (cart.length === 0) return;

    const totalPrice = getTotalPrice();

    // 檢查付款方式（僅在需要付款時）
    if (totalPrice > 0 && !selectedPayment) {
      showError('請選擇付款方式');
      return;
    }

    try {
      setPurchasing(true);

      const orderData = {
        items: cart.map(item => ({
          item_pk: item.item_pk,
          quantity: item.quantity,
        })),
        payment_method: totalPrice > 0 ? selectedPayment : 'free',
        return_url: window.location.href,
      };

      const response = await createOrder(orderData);

      if (response.success) {
        // 如果有支付 HTML，直接跳轉付款頁面
        if (response.payment_html) {
          console.log('💳 收到支付 HTML，準備跳轉付款頁面');
          setShowCartModal(false);
          redirectToPayment(response.payment_html);
        } else {
          // 免費或無需支付
          showSuccess(response.message || '購買成功！票券已加入您的帳戶');
          setCart([]);
          setShowCartModal(false);
          loadTickets(); // 重新載入票券（更新庫存）
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

  const formatPrice = (price: number) => {
    if (price === 0) return '免費';
    return `NT$ ${price.toFixed(0)}`;
  };

  const getTicketTypeIcon = (type: string) => {
    switch (type) {
      case 'discount':
        return <Percent size={16} className="text-red-500" />;
      case 'exchange':
        return <Gift size={16} className="text-green-500" />;
      case 'topup':
        return <Tag size={16} className="text-yellow-500" />;
      default:
        return <Ticket size={16} className="text-gray-500" />;
    }
  };

  const getTicketBgGradient = (type: string) => {
    switch (type) {
      case 'discount':
        return 'from-red-500 to-pink-500';
      case 'exchange':
        return 'from-green-500 to-teal-500';
      case 'topup':
        return 'from-yellow-500 to-orange-500';
      default:
        return 'from-purple-500 to-pink-500';
    }
  };

  const getTicketValue = (eticketInfo: EticketInfo) => {
    if (eticketInfo.ticket_type === 'discount') {
      if (eticketInfo.discount_type === 'fixed') {
        return `折抵 $${(eticketInfo.discount_value || 0).toFixed(0)}`;
      } else {
        const discountPercent = eticketInfo.discount_value || 0;
        return `${(100 - discountPercent) / 10} 折`;
      }
    } else if (eticketInfo.ticket_type === 'topup') {
      // 根據 topup_type 顯示不同單位
      const amount = eticketInfo.topup_amount || 0;
      switch (eticketInfo.topup_type) {
        case 'spread_quota':
          return `${amount} 次`;
        case 'points':
          return `${amount} 積分`;
        case 'coins':
        case 'coins_special':
          return `${amount} ${COIN_LABEL}`;
        case 'tokens':
          return `${amount} 代幣`;
        default:
          return `${amount} 積分`;
      }
    } else if (eticketInfo.ticket_type === 'exchange') {
      return '兌換商品';
    }
    return '';
  };

  const typeFilters = [
    { id: 'all', label: '全部' },
    { id: 'discount', label: '折扣券' },
    { id: 'exchange', label: '兌換券' },
    { id: 'topup', label: '點數卡' },
  ];

  const filteredTickets = tickets.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = selectedType === 'all' || item.eticket_info.ticket_type === selectedType;
    return matchSearch && matchType;
  });

  return (
    <div className="flex flex-col h-full">
      {/* 搜尋列 */}
      <div className="sticky top-[57px] bg-gray-50 z-20 px-4 py-3 border-b border-gray-200">
        <div className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜尋票券..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* 類型篩選 */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {typeFilters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setSelectedType(filter.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedType === filter.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-purple-300'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* 票券列表 */}
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
        ) : filteredTickets.length > 0 ? (
          <div className="space-y-4">
            {filteredTickets.map((item) => {
              const quantity = getCartQuantity(item.item_pk);
              const eticketInfo = item.eticket_info;
              const availableStock = eticketInfo.available_stock;
              const usageLimit = eticketInfo.usage_limit_per_member;
              const maxQty = Math.min(
                availableStock !== null ? availableStock : Infinity,
                usageLimit && usageLimit > 0 ? usageLimit : Infinity
              );

              return (
                <div
                  key={item.item_pk}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* 票券頭部 */}
                  <div className={`bg-gradient-to-r ${getTicketBgGradient(eticketInfo.ticket_type)} p-4 text-white relative overflow-hidden`}>
                    {/* 裝飾圓形 */}
                    <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full"></div>
                    <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-white/10 rounded-full"></div>

                    <div className="relative flex items-start justify-between">
                      <div>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/20 rounded-full text-xs mb-2">
                          {getTicketTypeIcon(eticketInfo.ticket_type)}
                          {eticketInfo.ticket_type_display}
                        </span>
                        <h3 className="text-lg font-bold mb-1">{item.name}</h3>
                        <p className="text-2xl font-bold">
                          {getTicketValue(eticketInfo)}
                        </p>
                      </div>
                      {item.imgUrl ? (
                        <img src={item.imgUrl} alt={item.name} className="w-12 h-12 rounded-lg object-cover opacity-80" />
                      ) : (
                        <Ticket size={40} className="opacity-30" />
                      )}
                    </div>
                  </div>

                  {/* 票券詳情 */}
                  <div className="p-4">
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {eticketInfo.validity_type === 'dynamic'
                          ? `領取後 ${eticketInfo.valid_days} 天內有效`
                          : `${eticketInfo.valid_start_date} ~ ${eticketInfo.valid_end_date}`
                        }
                      </span>
                      {availableStock !== null && (
                        <span>剩餘 {availableStock} {item.unit}</span>
                      )}
                      {usageLimit && usageLimit > 0 && (
                        <span>每人限 {usageLimit} {item.unit}</span>
                      )}
                    </div>

                    {/* 適用標籤 */}
                    {eticketInfo.applicable_tags && eticketInfo.applicable_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {eticketInfo.applicable_tags.map((tag, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-purple-50 text-purple-600 text-xs rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* 折扣券顯示使用條件 */}
                    {eticketInfo.ticket_type === 'discount' && eticketInfo.min_purchase_amount && eticketInfo.min_purchase_amount > 0 && (
                      <p className="text-xs text-orange-600 mb-3">
                        * 消費滿 NT$ {eticketInfo.min_purchase_amount.toFixed(0)} 可使用
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-purple-600">
                          {formatPrice(item.price)}
                        </span>
                        <span className="text-xs text-gray-400">/ {item.unit}</span>
                      </div>

                      {/* 數量控制 */}
                      <div className="flex items-center gap-2">
                        {quantity > 0 ? (
                          <>
                            <button
                              onClick={() => removeFromCart(item.item_pk)}
                              className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200"
                            >
                              <Minus size={16} />
                            </button>
                            <span className="w-6 text-center font-medium">{quantity}</span>
                            <button
                              onClick={() => addToCart(item)}
                              disabled={quantity >= maxQty}
                              className="w-8 h-8 flex items-center justify-center bg-purple-600 text-white rounded-full hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Plus size={16} />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => addToCart(item)}
                            className="px-4 py-1.5 bg-purple-600 text-white text-sm font-medium rounded-full hover:bg-purple-700 flex items-center gap-1"
                          >
                            <Plus size={14} />
                            加入
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Ticket size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 mb-2">目前沒有可購買的票券</p>
            <p className="text-sm text-gray-400">敬請期待更多優惠！</p>
          </div>
        )}
      </div>

      {/* 浮動購物車按鈕 */}
      {cart.length > 0 && (
        <button
          onClick={() => setShowCartModal(true)}
          className="fixed right-4 bottom-24 w-14 h-14 bg-purple-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-purple-700 transition-colors z-30"
        >
          <ShoppingCart size={24} />
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {getTotalItems()}
          </span>
        </button>
      )}

      {/* 購物車 Modal */}
      {showCartModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-2xl w-full max-w-lg max-h-[85vh] flex flex-col animate-slide-up">
            {/* Modal 標題 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">購物車</h3>
              <button
                onClick={() => setShowCartModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X size={24} className="text-gray-500" />
              </button>
            </div>

            {/* 購物車內容 */}
            <div className="flex-1 overflow-y-auto p-4">
              {cart.length > 0 ? (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.item_pk} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${getTicketBgGradient(item.eticket_info.ticket_type)} flex items-center justify-center`}>
                        {item.imgUrl ? (
                          <img src={item.imgUrl} alt={item.name} className="w-full h-full rounded-lg object-cover" />
                        ) : (
                          <Ticket size={20} className="text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm truncate">{item.name}</h4>
                        <p className="text-sm text-purple-600 font-bold">{formatPrice(item.price)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => removeFromCart(item.item_pk)}
                          className="w-7 h-7 flex items-center justify-center bg-white text-gray-600 rounded-full border border-gray-200"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-5 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => addToCart(item)}
                          className="w-7 h-7 flex items-center justify-center bg-purple-600 text-white rounded-full"
                        >
                          <Plus size={14} />
                        </button>
                        <button
                          onClick={() => removeItemFromCart(item.item_pk)}
                          className="ml-1 p-1 text-gray-400 hover:text-red-500"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShoppingCart size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">購物車是空的</p>
                </div>
              )}
            </div>

            {/* 付款方式選擇 & 結帳區域 */}
            {cart.length > 0 && (
              <div className="p-4 border-t border-gray-200 bg-white space-y-4">
                {/* 付款方式選擇（僅在總價大於 0 且有付款方式時顯示） */}
                {getTotalPrice() > 0 && paymentInfo.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <CreditCard size={16} />
                      選擇付款方式
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {paymentInfo.map((payment) => {
                        const code = payment.vendor_code ?? payment.payment_type ?? '';
                        const label = payment.display_name ?? payment.payment_display ?? code;
                        return (
                          <button
                            key={code}
                            onClick={() => setSelectedPayment(code)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              selectedPayment === code
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 價格與結帳按鈕 */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">共 {getTotalItems()} 張票券</span>
                  <span className="text-xl font-bold text-purple-600">{formatPrice(getTotalPrice())}</span>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={purchasing || (getTotalPrice() > 0 && !selectedPayment)}
                  className="w-full py-3 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {purchasing ? '處理中...' : getTotalPrice() === 0 ? '免費領取' : '前往結帳'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default ShopTickets;
