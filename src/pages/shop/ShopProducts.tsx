import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import {
  Search, Plus, Minus, ShoppingBag, X, Package, CreditCard,
  MapPin, Phone, User, MessageSquare, Coins,
  Truck, ChevronLeft, ChevronRight
} from 'lucide-react';
import {
  api,
  API_ENDPOINTS,
  createOrder,
  MemberCard,
  CreateOrderRequest,
  trackItemView,
  trackItemCart,
} from '../../config/api';
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

// 統一商品格式
interface ProductItem {
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
  options?: ItemOption[];
  point_discounts?: PointDiscount[];
  /** 零售商品：儲存溫層 RT | CS | freeze，預設 RT */
  temperature_storage?: 'RT' | 'CS' | 'freeze';
}

interface ItemOption {
  id: number;
  name: string;
  choices: OptionChoice[];
  is_required: boolean;
  max_selections: number;
}

interface OptionChoice {
  id: number;
  name: string;
  price_adjustment: number;
}

interface PointDiscount {
  point_type: string;
  points_required: number;
  discount_amount: number;
}

interface CartItem extends ProductItem {
  quantity: number;
  selectedOptions?: { [optionId: number]: number[] };
}

const ShopProducts: React.FC = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showSuccess, showError } = useToast();

  // 從 URL 路徑解析 clientSid: /shop/:clientSid/products
  const clientSid = location.pathname.split('/')[2];

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCartModal, setShowCartModal] = useState(false);
  const [detailProduct, setDetailProduct] = useState<ProductItem | null>(null);
  const [detailQuantity, setDetailQuantity] = useState(1);
  const [detailImageIndex, setDetailImageIndex] = useState(0);
  const [flyingProduct, setFlyingProduct] = useState<{ imgUrl: string; startX: number; startY: number } | null>(null);
  const detailAddBtnRef = useRef<HTMLButtonElement>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<string>('');

  // 配送資訊
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  // 金幣折抵
  const [memberCard, setMemberCard] = useState<MemberCard | null>(null);
  const [useCoins, setUseCoins] = useState(false);
  const [coinAmount, setCoinAmount] = useState(0);
  const [loadingMemberCard, setLoadingMemberCard] = useState(false);

  // 備註
  const [remark, setRemark] = useState('');


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
      loadProducts();
    }
  }, [clientSid]);

  // 從抽卡推薦、商品詳情等外部進入：add_sku + open_cart=1 時，加入該商品並開啟購物車/結帳畫面
  const addSkuHandledRef = useRef<string | null>(null);
  useEffect(() => {
    const addSku = searchParams.get('add_sku');
    const openCart = searchParams.get('open_cart') === '1';
    const addQty = Math.max(1, parseInt(searchParams.get('add_quantity') || '1', 10));
    if (!addSku || !openCart || products.length === 0 || addSkuHandledRef.current === addSku) return;
    const product = products.find((p: ProductItem) => p.sku === addSku);
    if (product) {
      addSkuHandledRef.current = addSku;
      setCart(prev => {
        const existing = prev.find(i => i.item_pk === product.item_pk);
        const delta = addQty;
        if (existing) {
          return prev.map(i =>
            i.item_pk === product.item_pk ? { ...i, quantity: i.quantity + delta } : i
          );
        }
        return [...prev, { ...product, quantity: delta }];
      });
      setShowCartModal(true);
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.delete('add_sku');
        next.delete('open_cart');
        next.delete('add_quantity');
        return next;
      }, { replace: true });
    }
  }, [products, searchParams, setSearchParams]);

  const loadProducts = async () => {
    if (hasLoadedRef.current || isLoadingRef.current) return;

    try {
      isLoadingRef.current = true;
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.SHOP_ITEMS, {
        params: {
          type: 'retail',
          client_sid: clientSid,
        }
      });

      if (response.data.items) {
        // 過濾出啟用的商品
        const availableItems = (response.data.items || []).filter(
          (item: ProductItem) => item.is_active
        );
        setProducts(availableItems);

        // 設置分類和標籤
        if (response.data.categorys) {
          setCategories(response.data.categorys);
        }
        if (response.data.tags) {
          setTags(response.data.tags);
        }
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
      console.error('載入商品失敗:', error);
      if (error.response?.status !== 401) {
        showError(error.response?.data?.message);
      }
      setProducts([]);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
      hasLoadedRef.current = true;
    }
  };

  // 載入會員卡資料（取得金幣餘額與折抵配置，需帶 client_sid）
  const loadMemberCard = useCallback(async (orderAmount?: number) => {
    if (!clientSid) return;
    try {
      setLoadingMemberCard(true);
      const response = await api.get(API_ENDPOINTS.MEMBER_CARD, {
        params: {
          client_sid: clientSid,
          ...(orderAmount !== undefined && { order_amount: orderAmount }),
        },
      });
      if (response.data.success && response.data.data) {
        setMemberCard(response.data.data);
      }
    } catch {
      // 訪客或未綁定會員，不影響購買流程
    } finally {
      setLoadingMemberCard(false);
    }
  }, [clientSid]);

  // 打開購物車 Modal 時載入會員卡資料
  useEffect(() => {
    if (showCartModal && cart.length > 0) {
      const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      loadMemberCard(totalPrice);
    }
  }, [showCartModal, loadMemberCard]);

  // Coin 折抵計算
  const coinsPerTwd = memberCard?.coins_per_twd || 0;
  const coinEnabled = coinsPerTwd > 0 && (memberCard?.coins || 0) > 0;
  const userCoins = memberCard?.coins || 0;

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const maxRedeemCoins = memberCard?.coin_max_redeem_coins
    ? Math.min(memberCard.coin_max_redeem_coins, userCoins)
    : userCoins;
  const maxRedeemAmountTwd = memberCard?.coin_max_redeem_amount_twd
    ? Math.min(memberCard.coin_max_redeem_amount_twd, totalPrice)
    : totalPrice;
  const effectiveMaxCoins = Math.min(
    maxRedeemCoins,
    Math.floor(maxRedeemAmountTwd * coinsPerTwd)
  );

  const coinDiscountAmount = useCoins && coinsPerTwd > 0
    ? Math.floor(coinAmount / coinsPerTwd)
    : 0;
  const finalPrice = Math.max(0, totalPrice - coinDiscountAmount);

  const formatPrice = (price: number) => {
    return `NT$ ${price.toLocaleString()}`;
  };

  // 加入購物車（僅更新前端狀態）
  const addToCart = (item: ProductItem, quantityDelta: number = 1) => {
    setCart(prev => {
      const existing = prev.find(i => i.item_pk === item.item_pk);
      if (existing) {
        return prev.map(i =>
          i.item_pk === item.item_pk ? { ...i, quantity: i.quantity + quantityDelta } : i
        );
      }
      return [...prev, { ...item, quantity: quantityDelta }];
    });
  };

  // 加入購物車並記錄行為（MemberInterest: item_cart）
  const handleAddToCartWithTrack = (item: ProductItem, quantityDelta: number) => {
    if (quantityDelta <= 0) return;
    addToCart(item, quantityDelta);
    if (!clientSid) return;
    // 興趣紀錄僅統計「觸發次數」，每次加入購物車都視為 increment = 1
    void trackItemCart(clientSid, item.item_pk, 1).catch((error: any) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return;
      }
      console.warn('加入購物車追蹤失敗', error);
    });
  };

  // 從購物車移除
  const removeFromCart = (itemPk: number) => {
    setCart(prev => {
      const existing = prev.find(i => i.item_pk === itemPk);
      if (existing && existing.quantity > 1) {
        return prev.map(i =>
          i.item_pk === itemPk ? { ...i, quantity: i.quantity - 1 } : i
        );
      }
      return prev.filter(i => i.item_pk !== itemPk);
    });
  };

  // 完全移除某項目
  const removeItemFromCart = (itemPk: number) => {
    setCart(prev => prev.filter(item => item.item_pk !== itemPk));
  };

  // 取得購物車中某商品的數量
  const getCartQuantity = (itemPk: number) => {
    const item = cart.find(i => i.item_pk === itemPk);
    return item?.quantity || 0;
  };

  // 購物車總數量
  const getTotalItems = () => cart.reduce((sum, item) => sum + item.quantity, 0);

  // 處理 coin 輸入變更
  const handleCoinChange = (value: number) => {
    const clamped = Math.max(0, Math.min(value, effectiveMaxCoins));
    setCoinAmount(clamped);
  };

  // 快速設定最大 coin
  const handleUseMaxCoins = () => {
    setCoinAmount(effectiveMaxCoins);
  };

  // 結帳
  const handleCheckout = async () => {
    if (cart.length === 0) return;


    // 檢查付款方式（僅在需要付款時）
    if (finalPrice > 0 && !selectedPayment) {
      showError('請選擇付款方式');
      return;
    }

    try {
      setPurchasing(true);

      const orderData: CreateOrderRequest = {
        items: cart.map(item => ({
          item_pk: item.item_pk,
          quantity: item.quantity,
        })),
        payment_method: finalPrice > 0 ? selectedPayment : 'free',
        return_url: window.location.href,
      };

      // 帶入配送資訊
      const hasContactInfo = contactName.trim() || contactPhone.trim() || deliveryAddress.trim();
      if (hasContactInfo) {
        orderData.consume_method = {
          method: 'shipping',
          ...(contactName.trim() && { name: contactName.trim() }),
          ...(contactPhone.trim() && { phone: contactPhone.trim() }),
          ...(deliveryAddress.trim() && { address: deliveryAddress.trim() }),
        };
      }

      // 帶入金幣折抵
      if (useCoins && coinAmount > 0 && coinDiscountAmount > 0) {
        orderData.use_coins = coinAmount;
        orderData.total_coins_used = coinAmount;
        orderData.coins_discount_amount = coinDiscountAmount;
      }

      // 帶入備註
      if (remark.trim()) {
        orderData.remark = remark.trim();
      }

      const response = await createOrder(orderData);

      if (response.success) {
        // 如果有支付 HTML，直接跳轉付款頁面
        if (response.payment_html) {
          console.log('💳 收到支付 HTML，準備跳轉付款頁面');
          setShowCartModal(false);
          redirectToPayment(response.payment_html);
        } else {
          showSuccess(response.message || '訂單已送出！');
          setCart([]);
          setShowCartModal(false);
          // 重置表單
          setUseCoins(false);
          setCoinAmount(0);
          setRemark('');
          loadProducts();
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

  // 篩選邏輯
  const filteredItems = products.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = selectedCategory === 'all' ||
      item.category === selectedCategory ||
      item.tags?.includes(selectedCategory);

    return matchSearch && matchCategory;
  });

  // 建立分類選項（只顯示 API 返回的分類）
  const categoryOptions = [
    { id: 'all', name: '全部' },
    ...categories.map(cat => ({ id: cat, name: cat }))
  ];

  return (
    <div className="flex flex-col h-full">
      {/* 搜尋列 */}
      <div className="sticky top-[57px] bg-gray-50 z-20 px-4 py-3">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜尋商品..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* 分類標籤 */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
          {categoryOptions.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === category.id
                  ? 'bg-green-500 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-green-300'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* 商品列表 */}
      <div className="flex-1 p-4 pb-24">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-square bg-gray-200"></div>
                <div className="p-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {filteredItems.map((item) => {
              const quantity = getCartQuantity(item.item_pk);

              return (
                <div
                  key={item.item_pk}
                  className="bg-white rounded-xl overflow-hidden shadow-sm"
                >
                  {/* 可點擊進入詳情：圖片 + 標題區 */}
                  <div
                    className="cursor-pointer hover:opacity-95 transition-opacity"
                    onClick={() => {
                      setDetailProduct(item);
                      setDetailQuantity(1);
                      setDetailImageIndex(0);
                      if (clientSid) {
                        void trackItemView(clientSid, item.item_pk).catch((error: any) => {
                          if (error?.response?.status === 401 || error?.response?.status === 403) {
                            return;
                          }
                          console.warn('商品瀏覽追蹤失敗', error);
                        });
                      }
                    }}
                  >
                    <div className="relative aspect-square bg-gray-100">
                      {item.imgUrl ? (
                        <img
                          src={item.imgUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-green-50">
                          <Package size={32} className="text-green-300" />
                        </div>
                      )}
                    </div>
                    <div className="p-3 pt-2">
                      <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
                        {item.name}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-1 mb-2">
                        {item.description}
                      </p>
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {item.tags.slice(0, 2).map((tag, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 bg-green-50 text-green-600 text-xs rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {item.point_discounts && item.point_discounts.length > 0 && (
                        <p className="text-xs text-orange-600 mb-2">
                          {item.point_discounts[0].points_required} 點折 ${item.point_discounts[0].discount_amount}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 價格與加入購物車：獨立區塊，不觸發導航 */}
                  <div className="px-3 pb-3 pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-bold text-green-600">
                          {formatPrice(item.price)}
                        </span>
                        <span className="text-xs text-gray-400">/{item.unit}</span>
                      </div>

                      {/* 數量控制 */}
                      {quantity > 0 ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => removeFromCart(item.item_pk)}
                            className="w-6 h-6 flex items-center justify-center bg-gray-100 text-gray-600 rounded-full"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-5 text-center text-sm font-medium">{quantity}</span>
                          <button
                            onClick={() => handleAddToCartWithTrack(item, 1)}
                            className="w-6 h-6 flex items-center justify-center bg-green-500 text-white rounded-full"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAddToCartWithTrack(item, 1)}
                          className="w-7 h-7 flex items-center justify-center bg-green-500 text-white rounded-full hover:bg-green-600"
                        >
                          <Plus size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">找不到符合的商品</p>
          </div>
        )}
      </div>

      {/* 飛入購物車動畫 */}
      {flyingProduct && (
        <div
          className="fixed z-[60] w-12 h-12 rounded-lg overflow-hidden border-2 border-green-500 shadow-lg pointer-events-none"
          style={
            {
              '--fly-start-x': `${flyingProduct.startX}px`,
              '--fly-start-y': `${flyingProduct.startY}px`,
              animation: 'fly-to-cart 0.45s ease-in forwards',
            } as React.CSSProperties
          }
        >
          {flyingProduct.imgUrl ? (
            <img src={flyingProduct.imgUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-green-100 flex items-center justify-center">
              <Package size={24} className="text-green-500" />
            </div>
          )}
        </div>
      )}

      {/* 浮動購物車按鈕 */}
      {cart.length > 0 && (
        <button
          onClick={() => setShowCartModal(true)}
          className="fixed right-4 bottom-24 w-14 h-14 bg-green-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-green-600 transition-colors z-30"
        >
          <ShoppingBag size={24} />
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

            {/* 購物車內容（可滾動區域） */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cart.length > 0 ? (
                <>
                  {/* 商品列表 */}
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={item.item_pk} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center overflow-hidden">
                          {item.imgUrl ? (
                            <img src={item.imgUrl} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package size={20} className="text-green-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm truncate">{item.name}</h4>
                          <p className="text-sm text-green-600 font-bold">{formatPrice(item.price)}</p>
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
                            className="w-7 h-7 flex items-center justify-center bg-green-500 text-white rounded-full"
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

                  {/* 配送資訊 */}
                  <div className="bg-gray-50 rounded-xl p-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Truck size={16} />
                      配送資訊
                    </h4>
                    <div className="space-y-2">
                      <div className="relative">
                        <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="收件人姓名"
                          className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      <div className="relative">
                        <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="tel"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          placeholder="聯絡電話"
                          className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      <div className="relative">
                        <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          placeholder="配送地址"
                          className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 金幣折抵 */}
                  {coinEnabled && (
                    <div className="bg-amber-50 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-amber-800 flex items-center gap-2">
                          <Coins size={16} className="text-amber-600" />
                          {COIN_LABEL}折抵
                        </h4>
                        <span className="text-xs text-amber-600">
                          餘額：{userCoins.toLocaleString()} {COIN_LABEL}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={useCoins}
                            onChange={(e) => {
                              setUseCoins(e.target.checked);
                              if (!e.target.checked) setCoinAmount(0);
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                        </label>
                        <span className="text-sm text-gray-600">使用{COIN_LABEL}折抵</span>
                      </div>
                      {useCoins && (
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={coinAmount || ''}
                              onChange={(e) => handleCoinChange(Number(e.target.value))}
                              placeholder={`輸入${COIN_LABEL}數量`}
                              min={0}
                              max={effectiveMaxCoins}
                              className="flex-1 px-3 py-2 bg-white border border-amber-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                            />
                            <button
                              onClick={handleUseMaxCoins}
                              className="px-3 py-2 bg-amber-500 text-white text-xs font-medium rounded-lg hover:bg-amber-600 transition-colors whitespace-nowrap"
                            >
                              最大折抵
                            </button>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-amber-600">
                              匯率：{coinsPerTwd} {COIN_LABEL} = NT$ 1
                            </span>
                            {coinDiscountAmount > 0 && (
                              <span className="text-amber-700 font-medium">
                                折抵 NT$ {coinDiscountAmount.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 備註 */}
                  <div className="bg-gray-50 rounded-xl p-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <MessageSquare size={16} />
                      訂單備註
                    </h4>
                    <textarea
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                      placeholder="備註事項（選填）"
                      rows={2}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    />
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <ShoppingBag size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">購物車是空的</p>
                </div>
              )}
            </div>

            {/* 付款方式選擇 & 結帳區域 */}
            {cart.length > 0 && (
              <div className="p-4 border-t border-gray-200 bg-white space-y-3">
                {/* 付款方式選擇 */}
                {finalPrice > 0 && paymentInfo.length > 0 && (
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
                                ? 'bg-green-500 text-white'
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

                {/* 價格明細 */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">共 {getTotalItems()} 件商品</span>
                    <span className="text-gray-700">{formatPrice(totalPrice)}</span>
                  </div>
                  {useCoins && coinDiscountAmount > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-amber-600">{COIN_LABEL}折抵（{coinAmount.toLocaleString()} {COIN_LABEL}）</span>
                      <span className="text-amber-600">-NT$ {coinDiscountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                    <span className="text-gray-700 font-medium">
                      {useCoins && coinDiscountAmount > 0 ? '應付金額' : '合計'}
                    </span>
                    <span className="text-xl font-bold text-green-600">{formatPrice(finalPrice)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={purchasing || (finalPrice > 0 && !selectedPayment)}
                  className="w-full py-3 bg-green-500 text-white font-medium rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {purchasing ? '處理中...' : '前往結帳'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 商品詳情彈窗 */}
      {detailProduct && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
          onClick={() => setDetailProduct(null)}
        >
          <div
            className="bg-white rounded-t-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 truncate flex-1 mr-2">{detailProduct.name}</h3>
              <button
                onClick={() => setDetailProduct(null)}
                className="p-1.5 hover:bg-gray-100 rounded-full flex-shrink-0"
              >
                <X size={22} className="text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* 圖片輪播 */}
              <div className="relative bg-gray-50">
                <div className="aspect-video max-w-lg mx-auto relative overflow-hidden">
                  {(() => {
                    const images = detailProduct.imgUrl_list?.length
                      ? detailProduct.imgUrl_list
                      : detailProduct.imgUrl
                        ? [detailProduct.imgUrl]
                        : [];
                    return images.length > 0 ? (
                      <>
                        <img
                          src={images[detailImageIndex]}
                          alt={detailProduct.name}
                          className="w-full h-full object-cover"
                        />
                        {images.length > 1 && (
                          <>
                            <button
                              onClick={() => setDetailImageIndex((i) => (i - 1 + images.length) % images.length)}
                              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center text-gray-700"
                            >
                              <ChevronLeft size={18} />
                            </button>
                            <button
                              onClick={() => setDetailImageIndex((i) => (i + 1) % images.length)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center text-gray-700"
                            >
                              <ChevronRight size={18} />
                            </button>
                            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                              {images.map((_, i) => (
                                <button
                                  key={i}
                                  onClick={() => setDetailImageIndex(i)}
                                  className={`w-1.5 h-1.5 rounded-full transition-colors ${i === detailImageIndex ? 'bg-green-500' : 'bg-white/70'}`}
                                />
                              ))}
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-green-50">
                        <Package size={48} className="text-green-300" />
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* 商品說明 */}
              <div className="p-4">
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-xl font-bold text-green-600">{formatPrice(detailProduct.price)}</span>
                  <span className="text-sm text-gray-400">/{detailProduct.unit}</span>
                </div>
                {detailProduct.tags && detailProduct.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {detailProduct.tags.map((tag, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-green-50 text-green-600 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="pt-3 border-t border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">商品說明</h4>
                  <div className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                    {detailProduct.description}
                  </div>
                </div>
              </div>
            </div>

            {/* 底部：數量 + 加入購物車 */}
            <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setDetailQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                  >
                    <Minus size={18} />
                  </button>
                  <span className="w-8 text-center font-medium">{detailQuantity}</span>
                  <button
                    onClick={() => setDetailQuantity((q) => q + 1)}
                    className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                <button
                  ref={detailAddBtnRef}
                  onClick={() => {
                    const rect = detailAddBtnRef.current?.getBoundingClientRect();
                    const startX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
                    const startY = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
                    const imgUrl = detailProduct.imgUrl_list?.[0] ?? detailProduct.imgUrl ?? '';
                    handleAddToCartWithTrack(detailProduct, detailQuantity);
                    setDetailProduct(null);
                    setFlyingProduct({ imgUrl, startX, startY });
                    showSuccess(`已加入購物車 x${detailQuantity}`);
                    setTimeout(() => setFlyingProduct(null), 450);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 text-white font-medium rounded-xl hover:bg-green-600 transition-colors"
                >
                  <ShoppingBag size={20} />
                  加入購物車
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ShopProducts;
