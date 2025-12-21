import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ticket,
  Clock,
  Tag,
  Gift,
  Percent,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  X,
  CreditCard,
  QrCode,
  AlertCircle,
  CheckCircle,
  Copy,
  ArrowRight,
  Send,
  Coins,
  Store,
  Wallet
} from 'lucide-react';
import { api, API_ENDPOINTS, createOrder } from '../../config/api';
import { useToast } from '../../hooks/useToast';
import { AI_COLORS } from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';

// ==================== 類型定義 ====================

// 付款方式資訊
interface PaymentInfo {
  payment_type: string;
  payment_display: string;
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

// 票券項目資訊（嵌套物件）
interface EticketItem {
  id: number;
  name: string;
  ticket_type: 'discount' | 'exchange' | 'topup';
  ticket_type_display: string;
  discount_type: 'percentage' | 'fixed' | null;
  discount_value: string | null;
  topup_type: string | null;
  topup_amount: number | null;
  is_transferable: boolean;
}

// 會員持有的票券
interface MyTicket {
  id: number;
  ticket_number: string;
  qr_code_url: string;
  status: 'active' | 'used' | 'expired' | 'cancelled';
  status_display: string;
  eticket_item: EticketItem;
  valid_from: string;
  valid_until: string;
  source: string;
  source_display: string;
  transfer_count: number;
  can_transfer: boolean;
  used_at: string | null;
  used_order_sn: string | null;
  actual_discount_amount: string;
  created_at: string;
}

// ==================== 工具函數 ====================

const getTicketTypeIcon = (type: string) => {
  switch (type) {
    case 'discount':
      return <Percent size={16} className="text-red-500" />;
    case 'exchange':
      return <Gift size={16} className="text-green-500" />;
    case 'topup':
      return <Coins size={16} className="text-yellow-500" />;
    default:
      return <Ticket size={16} className="text-gray-500" />;
  }
};

const getTicketBgGradient = (type: string, status?: string) => {
  if (status && status !== 'active') {
    return 'from-gray-400 to-gray-500';
  }
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

const formatPrice = (price: number) => {
  if (price === 0) return '免費';
  return `NT$ ${price.toFixed(0)}`;
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

// ==================== 票券商城組件 ====================

const TicketShop: React.FC<{
  clientSid: string;
}> = ({ clientSid }) => {
  const { showSuccess, showError } = useToast();

  const [tickets, setTickets] = useState<ShopItem[]>([]);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCartModal, setShowCartModal] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<string>('');

  const hasLoadedRef = useRef(false);
  const isLoadingRef = useRef(false);

  // 直接跳轉付款頁面
  const redirectToPayment = (html: string) => {
    document.open();
    document.write(html);
    document.close();
    const form = document.querySelector('form');
    if (form) form.submit();
  };

  useEffect(() => {
    if (!hasLoadedRef.current && !isLoadingRef.current) {
      loadTickets();
    }
  }, [clientSid]);

  const loadTickets = async () => {
    if (hasLoadedRef.current || isLoadingRef.current) return;

    try {
      isLoadingRef.current = true;
      setLoading(true);

      // 構建請求參數，如果有 clientSid 才傳入
      const params: Record<string, string> = { type: 'eticket' };
      if (clientSid) {
        params.client_sid = clientSid;
      }

      const response = await api.get(API_ENDPOINTS.SHOP_ITEMS, { params });

      if (response.data.items) {
        const availableTickets = (response.data.items || []).filter(
          (item: ShopItem) =>
            item.is_active &&
            (item.eticket_info.available_stock === null || item.eticket_info.available_stock > 0)
        );
        setTickets(availableTickets);

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
      console.error('載入票券失敗:', error);
      if (error.response?.status !== 401) {
        showError(error.response?.data?.message || '載入票券失敗');
      }
      setTickets([]);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
      hasLoadedRef.current = true;
    }
  };

  // 購物車操作
  const addToCart = (item: ShopItem) => {
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
  };

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

  const removeItemFromCart = (itemPk: number) => {
    setCart(prev => prev.filter(item => item.item_pk !== itemPk));
  };

  const getCartQuantity = (itemPk: number) => {
    const item = cart.find(i => i.item_pk === itemPk);
    return item?.quantity || 0;
  };

  const getTotalItems = () => cart.reduce((sum, item) => sum + item.quantity, 0);
  const getTotalPrice = () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // 結帳
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    const totalPrice = getTotalPrice();

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
      };

      const response = await createOrder(orderData);

      if (response.success) {
        if (response.payment_html) {
          setShowCartModal(false);
          redirectToPayment(response.payment_html);
        } else {
          showSuccess(response.message || '購買成功！票券已加入您的帳戶');
          setCart([]);
          setShowCartModal(false);
          hasLoadedRef.current = false;
          loadTickets();
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
          return `${amount} 金幣`;
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
    <div className="flex flex-col">
      {/* 搜尋列 */}
      <div className="px-4 py-3 bg-white border-b border-gray-100">
        <div className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜尋票券..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                  ? AI_COLORS.button
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                    <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full"></div>
                    <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-white/10 rounded-full"></div>

                    <div className="relative flex items-start justify-between">
                      <div>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/20 rounded-full text-xs mb-2">
                          {getTicketTypeIcon(eticketInfo.ticket_type)}
                          {eticketInfo.ticket_type_display}
                        </span>
                        <h3 className="text-lg font-bold mb-1">{item.name}</h3>
                        <p className="text-2xl font-bold">{getTicketValue(eticketInfo)}</p>
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
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className={`text-xl font-bold ${AI_COLORS.text}`}>
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
                              className={`w-8 h-8 flex items-center justify-center ${AI_COLORS.bgDark} text-white rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              <Plus size={16} />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => addToCart(item)}
                            className={`px-4 py-1.5 ${AI_COLORS.button} text-sm font-medium rounded-full flex items-center gap-1`}
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
          className={`fixed right-4 bottom-24 w-14 h-14 ${AI_COLORS.bgDark} text-white rounded-full shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity z-30`}
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
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">購物車</h3>
              <button onClick={() => setShowCartModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X size={24} className="text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {cart.length > 0 ? (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.item_pk} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${getTicketBgGradient(item.eticket_info.ticket_type)} flex items-center justify-center`}>
                        <Ticket size={20} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm truncate">{item.name}</h4>
                        <p className={`text-sm ${AI_COLORS.text} font-bold`}>{formatPrice(item.price)}</p>
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
                          className={`w-7 h-7 flex items-center justify-center ${AI_COLORS.bgDark} text-white rounded-full`}
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

            {cart.length > 0 && (
              <div className="p-4 border-t border-gray-200 bg-white space-y-4">
                {getTotalPrice() > 0 && paymentInfo.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <CreditCard size={16} />
                      選擇付款方式
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {paymentInfo.map((payment) => (
                        <button
                          key={payment.payment_type}
                          onClick={() => setSelectedPayment(payment.payment_type)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            selectedPayment === payment.payment_type
                              ? AI_COLORS.button
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {payment.payment_display}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">共 {getTotalItems()} 張票券</span>
                  <span className={`text-xl font-bold ${AI_COLORS.text}`}>{formatPrice(getTotalPrice())}</span>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={purchasing || (getTotalPrice() > 0 && !selectedPayment)}
                  className={`w-full py-3 ${AI_COLORS.button} font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
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

// ==================== 我的票券組件 ====================

const MyTicketsTab: React.FC<{
  clientSid: string;
}> = ({ clientSid }) => {
  const { showSuccess, showError } = useToast();

  const [tickets, setTickets] = useState<MyTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('active');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<MyTicket | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showUseModal, setShowUseModal] = useState(false);
  const [usingTicket, setUsingTicket] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState('');

  useEffect(() => {
    loadTickets();
  }, [clientSid, selectedStatus]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (clientSid) {
        params.client_sid = clientSid;
      }
      if (selectedStatus !== 'all') {
        params.status = selectedStatus;
      }

      const response = await api.get(API_ENDPOINTS.MY_ETICKETS, { params });
      if (response.data.success) {
        setTickets(response.data.data || []);
      } else {
        showError(response.data.message || '載入票券失敗');
      }
    } catch (error: any) {
      console.error('載入票券失敗:', error);
      if (error.response?.status !== 401) {
        showError(error.response?.data?.message || '載入票券失敗');
      }
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  // 使用點數卡
  const handleUseTopupTicket = async (ticket: MyTicket) => {
    if (ticket.eticket_item.ticket_type !== 'topup' || ticket.status !== 'active') return;

    try {
      setUsingTicket(ticket.ticket_number);
      const requestData: Record<string, string> = {};
      if (clientSid) {
        requestData.client_sid = clientSid;
      }
      const response = await api.post(API_ENDPOINTS.MY_ETICKET_USE(ticket.ticket_number), requestData);

      if (response.data.success) {
        showSuccess(response.data.message || '兌換成功');
        loadTickets();
      } else {
        showError(response.data.message || '兌換失敗');
      }
    } catch (error: any) {
      console.error('使用票券失敗:', error);
      showError(error.response?.data?.message || '使用失敗');
    } finally {
      setUsingTicket(null);
    }
  };

  // 使用兌換券
  const handleUseExchangeTicket = async () => {
    if (!selectedTicket || selectedTicket.eticket_item.ticket_type !== 'exchange') return;

    try {
      setUsingTicket(selectedTicket.ticket_number);
      const requestData: Record<string, string> = { verify_code: verifyCode };
      if (clientSid) {
        requestData.client_sid = clientSid;
      }
      const response = await api.post(API_ENDPOINTS.MY_ETICKET_USE(selectedTicket.ticket_number), requestData);

      if (response.data.success) {
        showSuccess(response.data.message || '兌換成功');
        setShowUseModal(false);
        setVerifyCode('');
        setSelectedTicket(null);
        loadTickets();
      } else {
        showError(response.data.message || '兌換失敗');
      }
    } catch (error: any) {
      console.error('使用票券失敗:', error);
      showError(error.response?.data?.message || '使用失敗');
    } finally {
      setUsingTicket(null);
    }
  };

  const getStatusBadge = (status: string, statusDisplay: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
            <CheckCircle size={12} />
            {statusDisplay}
          </span>
        );
      case 'used':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
            <CheckCircle size={12} />
            {statusDisplay}
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs">
            <AlertCircle size={12} />
            {statusDisplay}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">
            {statusDisplay}
          </span>
        );
    }
  };

  const getTicketValue = (ticket: MyTicket) => {
    const item = ticket.eticket_item;
    if (item.ticket_type === 'discount') {
      if (item.discount_type === 'fixed') {
        return `折抵 $${parseFloat(item.discount_value || '0').toFixed(0)}`;
      } else {
        const discountPercent = parseFloat(item.discount_value || '0');
        return `${(100 - discountPercent) / 10} 折`;
      }
    } else if (item.ticket_type === 'topup') {
      // 根據 topup_type 顯示不同單位
      const amount = item.topup_amount || 0;
      switch (item.topup_type) {
        case 'spread_quota':
          return `${amount} 次`;
        case 'points':
          return `${amount} 積分`;
        case 'coins':
        case 'coins_special':
          return `${amount} 金幣`;
        case 'tokens':
          return `${amount} 代幣`;
        default:
          return `${amount} 積分`;
      }
    } else if (item.ticket_type === 'exchange') {
      return '兌換券';
    }
    return '';
  };

  const isExpiringSoon = (validUntil: string) => {
    if (!validUntil) return false;
    const now = new Date();
    const expiry = new Date(validUntil);
    const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 7 && daysLeft > 0;
  };

  const copyTicketNumber = (ticketNumber: string) => {
    navigator.clipboard.writeText(ticketNumber);
    showSuccess('票券號碼已複製');
  };

  const statusFilters = [
    { id: 'active', label: '可使用' },
    { id: 'used', label: '已使用' },
    { id: 'expired', label: '已過期' },
    { id: 'all', label: '全部' },
  ];

  const typeFilters = [
    { id: 'all', label: '全部', icon: Ticket },
    { id: 'discount', label: '折扣券', icon: Percent },
    { id: 'exchange', label: '兌換券', icon: Gift },
    { id: 'topup', label: '點數卡', icon: Coins },
  ];

  const filteredTickets = tickets.filter(ticket => {
    const name = ticket.eticket_item?.name || '';
    const number = ticket.ticket_number || '';
    const search = searchTerm.toLowerCase();
    const matchSearch = name.toLowerCase().includes(search) || number.toLowerCase().includes(search);
    const matchType = selectedType === 'all' || ticket.eticket_item?.ticket_type === selectedType;
    return matchSearch && matchType;
  });

  const openUseModal = (ticket: MyTicket) => {
    setSelectedTicket(ticket);
    setVerifyCode('');
    if (ticket.eticket_item.ticket_type === 'exchange') {
      setShowUseModal(true);
    } else if (ticket.eticket_item.ticket_type === 'discount') {
      setShowQRModal(true);
    }
  };

  return (
    <div className="flex flex-col">
      {/* 搜尋與篩選 */}
      <div className="px-4 py-3 bg-white border-b border-gray-100">
        <div className="relative mb-3">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜尋票券..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        {/* 類型篩選 */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {typeFilters.map((filter) => {
            const Icon = filter.icon;
            return (
              <button
                key={filter.id}
                onClick={() => setSelectedType(filter.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedType === filter.id
                    ? AI_COLORS.button
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Icon size={14} />
                {filter.label}
              </button>
            );
          })}
        </div>

        {/* 狀態篩選 */}
        <div className="flex gap-2 overflow-x-auto pt-2 scrollbar-hide">
          {statusFilters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setSelectedStatus(filter.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedStatus === filter.id
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* 票券列表 */}
      <div className="flex-1 p-4">
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
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.ticket_number}
                className={`bg-white rounded-xl overflow-hidden shadow-sm ${
                  ticket.status === 'active' ? 'hover:shadow-md' : 'opacity-75'
                } transition-shadow`}
              >
                {/* 票券頭部 */}
                <div className={`bg-gradient-to-r ${getTicketBgGradient(ticket.eticket_item.ticket_type, ticket.status)} p-4 text-white relative overflow-hidden`}>
                  <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full"></div>
                  <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-white/10 rounded-full"></div>

                  <div className="relative flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                          {getTicketTypeIcon(ticket.eticket_item.ticket_type)}
                          {ticket.eticket_item.ticket_type_display}
                        </span>
                        {getStatusBadge(ticket.status, ticket.status_display)}
                      </div>
                      <h3 className="text-lg font-bold mb-1">{ticket.eticket_item.name}</h3>
                      <p className="text-2xl font-bold">{getTicketValue(ticket)}</p>
                    </div>
                    {ticket.status === 'active' && (
                      <button
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setShowQRModal(true);
                        }}
                        className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                      >
                        <QrCode size={28} />
                      </button>
                    )}
                  </div>
                </div>

                {/* 票券詳情 */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 rounded-lg">
                    <span className="text-xs text-gray-500">票券號碼：</span>
                    <span className="text-sm font-mono font-medium text-gray-700">{ticket.ticket_number}</span>
                    <button
                      onClick={() => copyTicketNumber(ticket.ticket_number)}
                      className="ml-auto p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Copy size={14} />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      有效期限：{formatDate(ticket.valid_until)}
                    </span>
                    {isExpiringSoon(ticket.valid_until) && ticket.status === 'active' && (
                      <span className="text-orange-600 font-medium">即將到期</span>
                    )}
                  </div>

                  {/* 操作按鈕 */}
                  {ticket.status === 'active' && (
                    <div className="flex gap-2">
                      {ticket.eticket_item.ticket_type === 'topup' && (
                        <button
                          onClick={() => handleUseTopupTicket(ticket)}
                          disabled={usingTicket === ticket.ticket_number}
                          className="flex-1 py-2.5 bg-yellow-500 text-white text-sm font-medium rounded-xl hover:bg-yellow-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {usingTicket === ticket.ticket_number ? '處理中...' : (
                            <>
                              <ArrowRight size={16} />
                              立即兌換
                            </>
                          )}
                        </button>
                      )}

                      {ticket.eticket_item.ticket_type === 'exchange' && (
                        <button
                          onClick={() => openUseModal(ticket)}
                          className="flex-1 py-2.5 bg-green-500 text-white text-sm font-medium rounded-xl hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                        >
                          <QrCode size={16} />
                          使用兌換
                        </button>
                      )}

                      {ticket.eticket_item.ticket_type === 'discount' && (
                        <button
                          onClick={() => openUseModal(ticket)}
                          className="flex-1 py-2.5 bg-red-500 text-white text-sm font-medium rounded-xl hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                        >
                          <Percent size={16} />
                          查看使用方式
                        </button>
                      )}

                      {ticket.can_transfer && ticket.eticket_item.is_transferable && (
                        <button
                          onClick={() => showSuccess('轉讓功能開發中')}
                          className="px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                        >
                          <Send size={16} />
                          轉讓
                        </button>
                      )}
                    </div>
                  )}

                  {ticket.status === 'used' && ticket.used_at && (
                    <p className="text-xs text-gray-400">
                      使用時間：{formatDate(ticket.used_at)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Ticket size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 mb-2">
              {selectedStatus === 'active' ? '目前沒有可使用的票券' : '沒有符合條件的票券'}
            </p>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {showQRModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden">
            <div className={`bg-gradient-to-r ${getTicketBgGradient(selectedTicket.eticket_item.ticket_type, selectedTicket.status)} p-4 text-white`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold">{selectedTicket.eticket_item.name}</h3>
                <button
                  onClick={() => {
                    setShowQRModal(false);
                    setSelectedTicket(null);
                  }}
                  className="p-1 hover:bg-white/20 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-2xl font-bold">{getTicketValue(selectedTicket)}</p>
            </div>

            <div className="p-6">
              <div className="bg-gray-50 rounded-xl p-6 mb-4 flex items-center justify-center">
                {selectedTicket.qr_code_url ? (
                  <img src={selectedTicket.qr_code_url} alt="QR Code" className="w-48 h-48" />
                ) : (
                  <div className="w-48 h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                    <QrCode size={64} className="text-gray-400" />
                  </div>
                )}
              </div>

              <div className="text-center mb-4">
                <p className="text-sm text-gray-500 mb-1">票券號碼</p>
                <p className="text-lg font-mono font-bold text-gray-900">{selectedTicket.ticket_number}</p>
              </div>

              <div className="text-center text-sm text-gray-500">
                <p>請出示此 QR Code 給店員掃描</p>
                <p>有效期限：{formatDate(selectedTicket.valid_until)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 兌換券使用 Modal */}
      {showUseModal && selectedTicket && selectedTicket.eticket_item.ticket_type === 'exchange' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden">
            <div className={`bg-gradient-to-r ${getTicketBgGradient(selectedTicket.eticket_item.ticket_type, selectedTicket.status)} p-4 text-white`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold">{selectedTicket.eticket_item.name}</h3>
                <button
                  onClick={() => {
                    setShowUseModal(false);
                    setSelectedTicket(null);
                    setVerifyCode('');
                  }}
                  className="p-1 hover:bg-white/20 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-lg">使用兌換券</p>
            </div>

            <div className="p-6">
              <div className="bg-gray-50 rounded-xl p-4 mb-4 flex items-center justify-center">
                {selectedTicket.qr_code_url ? (
                  <img src={selectedTicket.qr_code_url} alt="QR Code" className="w-40 h-40" />
                ) : (
                  <div className="w-40 h-40 bg-gray-200 rounded-lg flex items-center justify-center">
                    <QrCode size={48} className="text-gray-400" />
                  </div>
                )}
              </div>

              <p className="text-center text-sm text-gray-500 mb-4">
                請出示 QR Code 給店員掃描，或輸入店員提供的驗證碼
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">店員驗證碼</label>
                <input
                  type="text"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.toUpperCase())}
                  placeholder="請輸入店員提供的驗證碼"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-center text-lg font-mono tracking-widest focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  maxLength={8}
                />
              </div>

              <button
                onClick={handleUseExchangeTicket}
                disabled={!verifyCode || usingTicket === selectedTicket.ticket_number}
                className="w-full py-3 bg-green-500 text-white font-medium rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {usingTicket === selectedTicket.ticket_number ? '處理中...' : '確認兌換'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== 主頁面組件 ====================

const TicketCenter: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'shop' | 'my'>('shop');

  // 從 localStorage 或環境變數獲取 client_sid
  const clientSid = localStorage.getItem('client_sid') || import.meta.env.VITE_CLIENT_SID || '';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto">
        {/* 頁面標題 */}
        <div className="bg-white px-4 py-4 border-b border-gray-100">
          <h1 className="text-xl font-bold text-gray-900">票券中心</h1>
        </div>

        {/* Tab 切換 */}
        <div className="bg-white px-4 py-3 border-b border-gray-100">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('shop')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors ${
                activeTab === 'shop'
                  ? AI_COLORS.button
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Store size={18} />
              票券商城
            </button>
            <button
              onClick={() => setActiveTab('my')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors ${
                activeTab === 'my'
                  ? AI_COLORS.button
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Wallet size={18} />
              我的票券
            </button>
          </div>
        </div>

        {/* Tab 內容 */}
        {activeTab === 'shop' ? (
          <TicketShop clientSid={clientSid} />
        ) : (
          <MyTicketsTab clientSid={clientSid} />
        )}
      </div>
    </div>
  );
};

export default TicketCenter;
