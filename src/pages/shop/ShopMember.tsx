import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  User, CreditCard, Ticket, Heart, MapPin, Settings,
  ChevronRight, Bell, HelpCircle, LogOut, Star, Gift,
  QrCode, Clock, ShoppingBag, LogIn, Wallet, X, Sparkles
} from 'lucide-react';
import { api, API_ENDPOINTS, logout, createOrder, keysGetBatchDetail } from '../../config/api';
import { memberLabelMap } from '../../config/terms';
import { useShopContext } from '../../components/ShopLayout';
import { useToast } from '../../hooks/useToast';

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

const ShopMember: React.FC = () => {
  const { clientSid } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // 使用 ShopContext 取得會員卡資料
  const { memberCard, isLoggedIn, isLoading: contextLoading, refreshMemberCard } = useShopContext();
  const { showSuccess, showError } = useToast();
  const [loggingOut, setLoggingOut] = useState(false);

  // 票券數量
  const [ticketCount, setTicketCount] = useState<number>(0);
  const [loadingTickets, setLoadingTickets] = useState(false);

  // 儲值 Modal
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [rechargeItems, setRechargeItems] = useState<any[]>([]);
  const [rechargePaymentInfo, setRechargePaymentInfo] = useState<{ payment_type: string; payment_display: string }[]>([]);
  const [rechargeLoading, setRechargeLoading] = useState(false);
  const [selectedRechargeItem, setSelectedRechargeItem] = useState<any | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [purchasing, setPurchasing] = useState(false);

  // 防止重複請求
  const hasLoadedTicketsRef = useRef(false);
  const isLoadingTicketsRef = useRef(false);
  const hasLoadedRechargeRef = useRef(false);

  // 載入票券數量
  useEffect(() => {
    if (isLoggedIn && !hasLoadedTicketsRef.current && !isLoadingTicketsRef.current) {
      loadTicketCount();
    }
  }, [isLoggedIn]);

  const loadTicketCount = async () => {
    if (hasLoadedTicketsRef.current || isLoadingTicketsRef.current) return;

    try {
      isLoadingTicketsRef.current = true;
      setLoadingTickets(true);
      const response = await api.get(API_ENDPOINTS.MY_ETICKETS, {
        params: {
          client_sid: clientSid,
          status: 'active'  // 只統計可使用的票券
        }
      });

      if (response.data.success && Array.isArray(response.data.data)) {
        setTicketCount(response.data.data.length);
      } else {
        setTicketCount(0);
      }
      hasLoadedTicketsRef.current = true;
    } catch (error) {
      console.error('載入票券數量失敗:', error);
      setTicketCount(0);
      hasLoadedTicketsRef.current = true;
    } finally {
      setLoadingTickets(false);
      isLoadingTicketsRef.current = false;
    }
  };

  // 前往登入
  const goToLogin = () => {
    navigate('/login', { state: { from: location } });
  };

  // 登出
  const handleLogout = async () => {
    if (loggingOut) return;

    try {
      setLoggingOut(true);
      await logout();
      showSuccess('已成功登出');
      // 重新整理會員卡狀態
      await refreshMemberCard();
    } catch (error: any) {
      console.error('登出失敗:', error);
      showError('登出失敗，請稍後再試');
    } finally {
      setLoggingOut(false);
    }
  };

  // 儲值相關
  const loadRechargeItems = async () => {
    if (hasLoadedRechargeRef.current) return;
    try {
      setRechargeLoading(true);
      const response = await api.get(API_ENDPOINTS.SHOP_ITEMS, {
        params: { type: 'recharge', client_sid: clientSid },
      });
      if (response.data.items) {
        const filtered = (response.data.items || []).filter((i: any) => i.is_active && i.key_batches && i.key_batches.length > 0);
        // 取得每個批次的詳細獎勵內容
        const allBatchIds = filtered.flatMap((i: any) => (i.key_batches || []).map((b: any) => b.id));
        if (allBatchIds.length > 0) {
          const details = await Promise.allSettled(allBatchIds.map((id: number) => keysGetBatchDetail(id)));
          const detailMap: Record<number, any> = {};
          details.forEach((result, idx) => {
            if (result.status === 'fulfilled' && result.value) {
              const detail = result.value?.data?.batch || result.value?.batch || result.value?.data || result.value;
              if (detail && typeof detail === 'object') detailMap[allBatchIds[idx]] = detail;
            }
          });
          filtered.forEach((item: any) => {
            (item.key_batches || []).forEach((batch: any) => {
              if (detailMap[batch.id]) Object.assign(batch, detailMap[batch.id]);
            });
          });
        }
        setRechargeItems(filtered);
        if (response.data.payment_info) {
          setRechargePaymentInfo(response.data.payment_info);
          if (response.data.payment_info.length > 0) {
            setSelectedPayment(response.data.payment_info[0].payment_type);
          }
        }
      }
      hasLoadedRechargeRef.current = true;
    } catch {
      setRechargeItems([]);
    } finally {
      setRechargeLoading(false);
    }
  };

  const openRechargeModal = () => {
    setShowRechargeModal(true);
    setSelectedRechargeItem(null);
    loadRechargeItems();
  };

  const getItemPrice = (item: any) => item.price ?? item.base_price ?? 0;
  const formatPrice = (price: number) => price === 0 ? '免費' : `NT$ ${price.toLocaleString()}`;

  const redirectToPayment = (html: string) => {
    document.open();
    document.write(html);
    document.close();
    const form = document.querySelector('form');
    if (form) form.submit();
  };

  const handleRechargeCheckout = async () => {
    if (!selectedRechargeItem) return;
    const price = getItemPrice(selectedRechargeItem);
    if (price > 0 && !selectedPayment) {
      showError('請選擇付款方式');
      return;
    }
    try {
      setPurchasing(true);
      const response = await createOrder({
        items: [{ item_pk: selectedRechargeItem.item_pk, quantity: 1 }],
        payment_method: price > 0 ? selectedPayment : 'free',
        return_url: window.location.href,
      });
      if (response.success) {
        if (response.payment_html) {
          setShowRechargeModal(false);
          redirectToPayment(response.payment_html);
        } else {
          showSuccess(response.message || '儲值成功！');
          setShowRechargeModal(false);
          setSelectedRechargeItem(null);
          await refreshMemberCard();
        }
      } else {
        showError(response.message || '購買失敗');
      }
    } catch (error: any) {
      showError(error.response?.data?.message || '購買過程中發生錯誤');
    } finally {
      setPurchasing(false);
    }
  };

  const getLevelColor = (exp: number) => {
    if (exp >= 10000) return 'from-purple-400 to-purple-600'; // 白金
    if (exp >= 5000) return 'from-yellow-400 to-yellow-600';  // 金卡
    if (exp >= 1000) return 'from-gray-300 to-gray-500';      // 銀卡
    return 'from-blue-400 to-blue-600';                        // 一般
  };

  const getLevelName = (exp: number) => {
    if (exp >= 10000) return '白金會員';
    if (exp >= 5000) return '金卡會員';
    if (exp >= 1000) return '銀卡會員';
    return '一般會員';
  };

  const menuSections = [
    {
      title: '我的服務',
      items: [
        { icon: Ticket, label: '我的票券', badge: ticketCount, path: `/shop/${clientSid}/my-tickets` },
        { icon: ShoppingBag, label: '訂單紀錄', badge: null, path: `/shop/${clientSid}/member/orders` },
        { icon: MapPin, label: '常用地址', badge: null, path: `/shop/${clientSid}/member/addresses` },
      ],
    },
    {
      title: '帳戶設定',
      items: [
        { icon: User, label: '個人資料', badge: null, path: `/shop/${clientSid}/member/profile` },
        { icon: CreditCard, label: '付款方式', badge: null, path: `/shop/${clientSid}/member/payment` },
        { icon: Bell, label: '通知設定', badge: null, path: `/shop/${clientSid}/member/notifications` },
        { icon: Settings, label: '帳戶設定', badge: null, path: `/shop/${clientSid}/member/settings` },
      ],
    },
  ];

  if (contextLoading) {
    return (
      <div className="p-4">
        <div className="bg-white rounded-xl p-6 animate-pulse">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 未登入狀態
  if (!isLoggedIn) {
    return (
      <div className="p-4">
        <div className="bg-white rounded-xl p-8 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User size={40} className="text-gray-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">尚未登入</h2>
          <p className="text-sm text-gray-500 mb-6">登入後即可享受完整會員服務</p>
          <button
            onClick={goToLogin}
            className="w-full py-3 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
          >
            <LogIn size={18} />
            登入 / 註冊
          </button>
        </div>
      </div>
    );
  }

  // 會員名稱（優先使用 nick_name，其次使用 email 或 phone 的前半部分，或卡號）
  const displayName = memberCard?.nick_name ||
                      memberCard?.email?.split('@')[0] ||
                      (memberCard?.phone ? memberCard.phone.slice(0, 4) + '****' : null) ||
                      `會員 ${memberCard?.card_id}`;

  return (
    <div className="pb-4">
      {/* 會員卡片 */}
      <div className="p-4">
        <div className={`bg-gradient-to-br ${getLevelColor(memberCard?.exp || 0)} rounded-2xl p-5 text-white relative overflow-hidden`}>
          {/* 裝飾 */}
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full"></div>
          <div className="absolute -right-5 -bottom-5 w-20 h-20 bg-white/10 rounded-full"></div>

          <div className="relative">
            {/* 頭部 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full border-2 border-white/30 bg-white/20 flex items-center justify-center">
                  <User size={24} />
                </div>
                <div>
                  <h2 className="font-bold text-lg">{displayName}</h2>
                  <p className="text-sm opacity-80">{getLevelName(memberCard?.exp || 0)}</p>
                </div>
              </div>
              <button className="p-2 bg-white/20 rounded-full">
                <QrCode size={20} />
              </button>
            </div>

            {/* 數據 */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/20">
              <div className="text-center">
                <p className="text-2xl font-bold">{(memberCard?.points || 0).toLocaleString()}</p>
                <p className="text-xs opacity-80">積分</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold italic">{memberCard?.coins || 0}</p>
                <p className="text-xs opacity-80">{memberLabelMap.coins}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{ticketCount}</p>
                <p className="text-xs opacity-80">票券</p>
              </div>
            </div>

            {/* 儲值按鈕 */}
            <button
              onClick={openRechargeModal}
              className="w-full mt-4 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Wallet size={16} />
              儲值
            </button>
          </div>
        </div>
      </div>

      {/* 快捷功能 */}
      <div className="px-4 mb-4">
        <div className="bg-white rounded-xl p-4">
          <div className="grid grid-cols-4 gap-4">
            {[
              { icon: Clock, label: '待付款', count: 0 },
              { icon: ShoppingBag, label: '待出貨', count: 0 },
              { icon: Gift, label: '待收貨', count: 0 },
              { icon: Star, label: '待評價', count: 0 },
            ].map((item, index) => (
              <button key={index} className="flex flex-col items-center">
                <div className="relative mb-1">
                  <item.icon size={24} className="text-gray-600" />
                  {item.count > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {item.count}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-600">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 功能選單 */}
      <div className="px-4 space-y-4">
        {menuSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="bg-white rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-medium text-gray-500">{section.title}</h3>
            </div>
            <div>
              {section.items.map((item, itemIndex) => (
                <button
                  key={itemIndex}
                  onClick={() => item.path && navigate(item.path)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={20} className="text-gray-500" />
                    <span className="text-gray-700">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.badge != null && item.badge > 0 && (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-600 text-xs rounded-full">
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight size={18} className="text-gray-400" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* 登出按鈕 */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center justify-center gap-2 py-3 bg-white rounded-xl text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LogOut size={18} className={loggingOut ? 'animate-spin' : ''} />
          <span>{loggingOut ? '登出中...' : '登出'}</span>
        </button>
      </div>

      {/* 儲值 Modal */}
      {showRechargeModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => !selectedRechargeItem && setShowRechargeModal(false)}>
          <div className="bg-white rounded-t-2xl w-full max-w-lg max-h-[80vh] flex flex-col animate-slide-up" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                {selectedRechargeItem ? (
                  <button onClick={() => setSelectedRechargeItem(null)} className="text-gray-400 hover:text-gray-600 mr-1">
                    <ChevronRight size={20} className="rotate-180" />
                  </button>
                ) : (
                  <Wallet size={20} className="text-amber-600" />
                )}
                <h3 className="text-lg font-bold text-gray-900">
                  {selectedRechargeItem ? '確認付款' : '選擇儲值方案'}
                </h3>
              </div>
              <button onClick={() => { setShowRechargeModal(false); setSelectedRechargeItem(null); }} className="p-1 hover:bg-gray-100 rounded-full">
                <X size={22} className="text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {selectedRechargeItem ? (
                /* 付款確認 */
                <div className="p-4">
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl mb-4">
                    <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center flex-shrink-0">
                      <Sparkles size={18} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-sm">{selectedRechargeItem.name}</h4>
                      {selectedRechargeItem.description && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{selectedRechargeItem.description}</p>
                      )}
                    </div>
                    <span className="text-xl font-bold text-amber-600 flex-shrink-0">
                      {formatPrice(getItemPrice(selectedRechargeItem))}
                    </span>
                  </div>

                  {/* 購買獎勵 */}
                  {selectedRechargeItem.key_batches && selectedRechargeItem.key_batches.length > 0 && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl">
                      <h4 className="text-xs font-medium text-green-700 mb-1.5 flex items-center gap-1.5">
                        <Gift size={14} />
                        購買後可獲得
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedRechargeItem.key_batches.map((batch: any) => (
                          <span key={batch.id} className="px-2 py-0.5 bg-white text-green-700 text-xs rounded-full border border-green-200">
                            {getBatchRewardText(batch) || batch.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {getItemPrice(selectedRechargeItem) > 0 && rechargePaymentInfo.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <CreditCard size={16} className="text-gray-400" />
                        付款方式
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {rechargePaymentInfo.map((p) => (
                          <button
                            key={p.payment_type}
                            onClick={() => setSelectedPayment(p.payment_type)}
                            className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                              selectedPayment === p.payment_type
                                ? 'bg-amber-600 text-white border-amber-600'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-amber-300'
                            }`}
                          >
                            {p.payment_display}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleRechargeCheckout}
                    disabled={purchasing || (getItemPrice(selectedRechargeItem) > 0 && !selectedPayment)}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-yellow-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    {purchasing ? '處理中...' : getItemPrice(selectedRechargeItem) === 0 ? '免費領取' : '確認付款'}
                  </button>
                </div>
              ) : rechargeLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse"></div>
                  ))}
                </div>
              ) : rechargeItems.length > 0 ? (
                <div className="p-4 space-y-2.5">
                  {rechargeItems.map((item) => {
                    const price = getItemPrice(item);
                    return (
                      <button
                        key={item.item_pk}
                        onClick={() => setSelectedRechargeItem(item)}
                        className="w-full flex items-center gap-3 p-3.5 bg-white border border-gray-200 rounded-xl hover:border-amber-300 hover:shadow-sm transition-all text-left group"
                      >
                        <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                          {item.imgUrl ? (
                            <img src={item.imgUrl} alt={item.name} className="w-full h-full rounded-lg object-cover" />
                          ) : (
                            <Sparkles size={18} className="text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm">{item.name}</h4>
                          {item.description && (
                            <p className="text-xs text-gray-500 mt-0.5 truncate">{item.description}</p>
                          )}
                          {item.key_batches && item.key_batches.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.key_batches.map((batch: any) => (
                                <span key={batch.id} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-green-50 text-green-700 text-[10px] rounded-full border border-green-200">
                                  <Gift size={9} />
                                  {getBatchRewardText(batch) || batch.title}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-base font-bold text-amber-600">{formatPrice(price)}</span>
                          <ChevronRight size={16} className="text-gray-300 group-hover:text-amber-500 transition-colors" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Wallet size={40} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500 text-sm">目前沒有儲值方案</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopMember;
