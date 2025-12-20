import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Clock, MapPin, Plus, Minus, ShoppingBag, X, UtensilsCrossed, CreditCard } from 'lucide-react';
import { api, API_ENDPOINTS, createOrder } from '../../config/api';
import { useToast } from '../../hooks/useToast';

// 付款方式資訊
interface PaymentInfo {
  payment_type: string;
  payment_display: string;
}

// 統一商品格式
interface FoodItem {
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

interface CartItem extends FoodItem {
  quantity: number;
  selectedOptions?: { [optionId: number]: number[] }; // optionId -> choiceIds
}

const ShopFood: React.FC = () => {
  const location = useLocation();
  const { showSuccess, showError } = useToast();

  // 從 URL 路徑解析 clientSid: /shop/:clientSid/food
  const clientSid = location.pathname.split('/')[2];

  const [menuItems, setMenuItems] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
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
      loadMenu();
    }
  }, [clientSid]);

  const loadMenu = async () => {
    if (hasLoadedRef.current || isLoadingRef.current) return;

    try {
      isLoadingRef.current = true;
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.SHOP_ITEMS, {
        params: {
          type: 'food',
          client_sid: clientSid,
        }
      });

      if (response.data.items) {
        // 過濾出啟用的商品
        const availableItems = (response.data.items || []).filter(
          (item: FoodItem) => item.is_active
        );
        setMenuItems(availableItems);

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
            setSelectedPayment(response.data.payment_info[0].payment_type);
          }
        }
      } else if (response.data.success === false) {
        showError(response.data.message);
      }
    } catch (error: any) {
      console.error('載入菜單失敗:', error);
      if (error.response?.status !== 401) {
        showError(error.response?.data?.message);
      }
      setMenuItems([]);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
      hasLoadedRef.current = true;
    }
  };

  const formatPrice = (price: number) => {
    return `NT$ ${price}`;
  };

  // 加入購物車
  const addToCart = (item: FoodItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.item_pk === item.item_pk);
      if (existing) {
        return prev.map(i =>
          i.item_pk === item.item_pk ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
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
      };

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
          loadMenu();
        }
      } else {
        showError(response.message || '訂購失敗');
      }
    } catch (error: any) {
      console.error('訂購失敗:', error);
      showError(error.response?.data?.message || '訂購過程中發生錯誤');
    } finally {
      setPurchasing(false);
    }
  };

  // 篩選邏輯
  const filteredItems = menuItems.filter(item => {
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
      {/* 店家資訊 */}
      <div className="bg-white px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-gray-400" />
            <span className="text-sm text-gray-600">內用 / 外帶</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-gray-400" />
            <span className="text-sm text-gray-600">約 15-20 分鐘</span>
          </div>
        </div>
      </div>

      {/* 搜尋列 */}
      <div className="sticky top-[57px] bg-gray-50 z-20 px-4 py-3">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜尋餐點..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-orange-300'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* 菜單列表 */}
      <div className="flex-1 p-4 pb-24">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="space-y-3">
            {filteredItems.map((item) => {
              const quantity = getCartQuantity(item.item_pk);

              return (
                <div
                  key={item.item_pk}
                  className="bg-white rounded-xl p-4 shadow-sm"
                >
                  <div className="flex gap-4">
                    {/* 圖片 */}
                    <div className="relative w-24 h-24 flex-shrink-0">
                      {item.imgUrl ? (
                        <img
                          src={item.imgUrl}
                          alt={item.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full bg-orange-50 rounded-lg flex items-center justify-center">
                          <UtensilsCrossed size={24} className="text-orange-300" />
                        </div>
                      )}
                    </div>

                    {/* 資訊 */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 mb-1">{item.name}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                        {item.description}
                      </p>

                      {/* 標籤 */}
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {item.tags.slice(0, 3).map((tag, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 bg-orange-50 text-orange-600 text-xs rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* 點數折扣 */}
                      {item.point_discounts && item.point_discounts.length > 0 && (
                        <p className="text-xs text-green-600 mb-2">
                          可用 {item.point_discounts[0].points_required} 點折 ${item.point_discounts[0].discount_amount}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-baseline gap-1">
                          <span className="text-base font-bold text-orange-600">
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
                                className="w-8 h-8 flex items-center justify-center bg-orange-500 text-white rounded-full hover:bg-orange-600"
                              >
                                <Plus size={16} />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => addToCart(item)}
                              className="px-4 py-1.5 bg-orange-500 text-white text-sm font-medium rounded-full hover:bg-orange-600 flex items-center gap-1"
                            >
                              <Plus size={14} />
                              加入
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <UtensilsCrossed size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">找不到符合的餐點</p>
          </div>
        )}
      </div>

      {/* 浮動購物車按鈕 */}
      {cart.length > 0 && (
        <button
          onClick={() => setShowCartModal(true)}
          className="fixed right-4 bottom-24 w-14 h-14 bg-orange-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-orange-600 transition-colors z-30"
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

            {/* 購物車內容 */}
            <div className="flex-1 overflow-y-auto p-4">
              {cart.length > 0 ? (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.item_pk} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center overflow-hidden">
                        {item.imgUrl ? (
                          <img src={item.imgUrl} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <UtensilsCrossed size={20} className="text-orange-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm truncate">{item.name}</h4>
                        <p className="text-sm text-orange-600 font-bold">{formatPrice(item.price)}</p>
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
                          className="w-7 h-7 flex items-center justify-center bg-orange-500 text-white rounded-full"
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
                  <ShoppingBag size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">購物車是空的</p>
                </div>
              )}
            </div>

            {/* 付款方式選擇 & 結帳區域 */}
            {cart.length > 0 && (
              <div className="p-4 border-t border-gray-200 bg-white space-y-4">
                {/* 付款方式選擇 */}
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
                              ? 'bg-orange-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {payment.payment_display}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 價格與結帳按鈕 */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">共 {getTotalItems()} 件商品</span>
                  <span className="text-xl font-bold text-orange-600">{formatPrice(getTotalPrice())}</span>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={purchasing || (getTotalPrice() > 0 && !selectedPayment)}
                  className="w-full py-3 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {purchasing ? '處理中...' : '前往結帳'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default ShopFood;
