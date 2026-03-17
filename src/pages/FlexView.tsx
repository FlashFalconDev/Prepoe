import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Coins, Wallet, CreditCard, Gift, LogIn, X, ChevronRight, Sparkles } from 'lucide-react';
import { FlexCarouselView, CardsData, FlexCarousel, getCardDrawStyle, getDetailStyle, PostActionResult, FormData } from '../components/cardDraw';
import LoadingScreen, { LoadingStyle } from '../components/LoadingScreen';
import { api, API_ENDPOINTS, createOrder, keysGetBatchDetail, type MemberCard } from '../config/api';
import { COIN_LABEL, memberLabelMap } from '../config/terms';
import { useToast } from '../hooks/useToast';

// FlexView 資料結構（API 回傳格式）
interface FlexData {
  session_id?: number;
  cards?: CardsData;
  flex_deck: FlexCarousel;
  variable?: Record<string, string>;
  form_data?: Record<string, string | number>;
}

// 資格被擋時 API 回傳的可購買項目（與後端 payable_items 一致）
interface PayableItem {
  item_pk: number;
  name: string;
  base_price: number;
  sku?: string;
  grant_tag_code?: string;
  grant_valid_days?: number;
  client_sid?: string;
}

// 資格被擋時的 payload（後端依 FLEXWEB_QUALIFICATION_BLOCKED_SPEC 回傳）
interface BlockedPayload {
  payable_items: PayableItem[];
  require_login?: boolean;
  message_key?: string;
  next_reset_at?: string | null;
  member_card?: MemberCard | null;
}

const FlexView: React.FC = () => {
  const { clientSid, code } = useParams<{ clientSid: string; code: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [flexData, setFlexData] = useState<FlexData | null>(null);
  const [blockedPayload, setBlockedPayload] = useState<BlockedPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();

  // 儲值 Modal
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [rechargeItems, setRechargeItems] = useState<any[]>([]);
  const [rechargePaymentInfo, setRechargePaymentInfo] = useState<{ payment_type: string; payment_display: string }[]>([]);
  const [rechargeLoading, setRechargeLoading] = useState(false);
  const [selectedRechargeItem, setSelectedRechargeItem] = useState<any | null>(null);
  const [selectedRechargePayment, setSelectedRechargePayment] = useState<string>('');
  const [rechargePurchasing, setRechargePurchasing] = useState(false);
  const [purchasingWithCoins, setPurchasingWithCoins] = useState(false);

  // 從 URL 查詢參數讀取載入風格：?loading=tarot | neutral | minimal
  // 預設為 'neutral'（FlexView 是通用頁面，使用中性風格）
  const loadingStyleParam = searchParams.get('loading') as LoadingStyle | null;
  const loadingStyle: LoadingStyle = ['tarot', 'neutral', 'minimal'].includes(loadingStyleParam || '')
    ? (loadingStyleParam as LoadingStyle)
    : 'neutral';

  // 從 URL 查詢參數讀取背景顏色：?color=ADAEC2 或 ?color=%23ADAEC2
  const backgroundColor = searchParams.get('color') || undefined;

  // 從 URL 查詢參數讀取載入提示文字：?text=載入中...
  const loadingText = searchParams.get('text') || undefined;

  const loadData = useCallback(async () => {
    if (!code) {
      setError('缺少必要參數');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setBlockedPayload(null);
    setFlexData(null);
    try {
      const response = await api.get(API_ENDPOINTS.FLEXWEB_BY_CODE(code));
      if (!response.data.success) {
        setError(response.data.message || '載入失敗');
        return;
      }
      const data = response.data.data;
      const hasFlexDeck = data?.flex_deck?.contents?.length;
      const hasPayableItems = Array.isArray(data?.payable_items) && data.payable_items.length > 0;

      if (hasFlexDeck) {
        setFlexData(data as FlexData);
        return;
      }
      if (hasPayableItems) {
        setBlockedPayload({
          payable_items: data.payable_items,
          require_login: data.require_login,
          message_key: data.message_key,
          next_reset_at: data.next_reset_at ?? null,
          member_card: data.member_card ?? null,
        });
        return;
      }
      setError('找不到內容');
    } catch (err: any) {
      console.error('FlexView 載入失敗:', err);
      setError(err.response?.data?.message || '載入時發生錯誤');
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 載入中 - 根據 loadingStyle、backgroundColor 和 loadingText 顯示
  if (loading) {
    return <LoadingScreen style={loadingStyle} title={loadingText} backgroundColor={backgroundColor} />;
  }

  // 錯誤狀態
  if (error) {
    return (
      <div className="h-screen w-screen bg-white flex items-center justify-center">
        <div className="text-center text-gray-600">
          <p className="text-lg mb-2 text-red-500">{error}</p>
          <p className="text-gray-400 text-sm">code: {code}</p>
        </div>
      </div>
    );
  }

  // 資格被擋：顯示可購買內容與付款（含金幣／儲值）
  if (blockedPayload) {
    const formatDate = (dateStr: string) => {
      return new Date(dateStr).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' });
    };
    const goToLogin = () => {
      localStorage.setItem('login_redirect', window.location.pathname);
      navigate('/login', { state: { from: { pathname: window.location.pathname } } });
    };

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
      return parts.join('、');
    };
    const loadRechargeItems = async () => {
      try {
        setRechargeLoading(true);
        const response = await api.get(API_ENDPOINTS.SHOP_ITEMS, { params: { type: 'recharge' } });
        if (response.data.items) {
          const filtered = (response.data.items || []).filter((i: any) => i.is_active && i.key_batches?.length > 0);
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
            if (response.data.payment_info.length > 0) setSelectedRechargePayment(response.data.payment_info[0].payment_type);
          }
        }
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
    const getRechargePrice = (item: any) => item.price ?? item.base_price ?? 0;
    const formatRechargePrice = (price: number) => price === 0 ? '免費' : `NT$ ${price.toLocaleString()}`;
    const redirectToPayment = (html: string) => {
      document.open();
      document.write(html);
      document.close();
      const form = document.querySelector('form');
      if (form) form.submit();
    };
    const handleRechargeCheckout = async () => {
      if (!selectedRechargeItem) return;
      const price = getRechargePrice(selectedRechargeItem);
      if (price > 0 && !selectedRechargePayment) {
        showError('請選擇付款方式');
        return;
      }
      try {
        setRechargePurchasing(true);
        const response = await createOrder({
          items: [{ item_pk: selectedRechargeItem.item_pk, quantity: 1 }],
          payment_method: price > 0 ? selectedRechargePayment : 'Free',
          return_url: window.location.href,
        });
        if (response.success) {
          if (response.payment_html) {
            setShowRechargeModal(false);
            redirectToPayment(response.payment_html);
          } else {
            showSuccess('儲值成功！');
            setShowRechargeModal(false);
            setSelectedRechargeItem(null);
            loadData();
          }
        } else {
          showError(response.message || '購買失敗');
        }
      } catch (err: any) {
        showError(err.response?.data?.message || '購買過程中發生錯誤');
      } finally {
        setRechargePurchasing(false);
      }
    };
    const handleCoinPurchase = async () => {
      const item = blockedPayload.payable_items[0];
      const memberCard = blockedPayload.member_card;
      if (!item || !memberCard) return;
      const coinsPerTwd = memberCard.coins_per_twd || 0;
      const basePrice = item.base_price || 0;
      const totalCoinsNeeded = Math.ceil(basePrice * coinsPerTwd);
      if (memberCard.coins < totalCoinsNeeded) {
        showError(`${COIN_LABEL}不足`);
        return;
      }
      try {
        setPurchasingWithCoins(true);
        const response = await createOrder({
          items: [{ item_pk: item.item_pk, quantity: 1 }],
          payment_method: 'Free',
          use_coins: totalCoinsNeeded,
          total_coins_used: totalCoinsNeeded,
          coins_discount_amount: basePrice,
          return_url: window.location.href,
        });
        if (response.success) {
          showSuccess('購買成功！正在重新載入...');
          setBlockedPayload(null);
          loadData();
        } else {
          showError(response.message || '購買失敗');
        }
      } catch (err: any) {
        showError(err.response?.data?.message || '購買過程中發生錯誤');
      } finally {
        setPurchasingWithCoins(false);
      }
    };

    const { payable_items, require_login, message_key, next_reset_at, member_card } = blockedPayload;
    const needLogin = require_login && !member_card;
    const firstItem = payable_items[0];
    const coinsPerTwd = member_card?.coins_per_twd ?? 0;
    const showCoinBlock = member_card && firstItem && coinsPerTwd > 0;
    const totalCoinsNeeded = firstItem && coinsPerTwd > 0 ? Math.ceil(firstItem.base_price * coinsPerTwd) : 0;
    const userCoins = member_card?.coins ?? 0;
    const canAfford = userCoins >= totalCoinsNeeded;

    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-indigo-900 to-purple-950 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-w-md w-full">
          <div className="text-center mb-6">
            <p className="text-purple-200 text-sm">
              {message_key || '您的抽牌次數已用完'}
              {next_reset_at && (
                <>
                  <br />
                  <span className="text-purple-300">下次重置：{formatDate(next_reset_at)}</span>
                </>
              )}
            </p>
          </div>

          {needLogin && (
            <div className="mb-6">
              <button
                onClick={goToLogin}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-xl transition-all font-medium"
              >
                <LogIn size={20} />
                登入並確認資格
              </button>
            </div>
          )}

          {showCoinBlock && firstItem && (
            <div className="bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-400/20 rounded-xl p-4 mb-6">
              <h3 className="text-amber-400 text-sm font-medium mb-3 flex items-center gap-2">
                <Coins size={16} />
                使用{COIN_LABEL}購買
              </h3>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-white text-sm font-medium">{firstItem.name}</p>
                  <p className="text-purple-300 text-xs mt-0.5">NT$ {firstItem.base_price}</p>
                </div>
                <div className="text-right">
                  <p className="text-amber-400 font-bold">{totalCoinsNeeded.toLocaleString()} {COIN_LABEL}</p>
                  <div className="flex items-center gap-1.5 justify-end">
                    <p className="text-purple-400 text-xs">餘額：{userCoins.toLocaleString()}</p>
                    <button
                      onClick={openRechargeModal}
                      className="px-1.5 py-0.5 text-[10px] bg-amber-500/20 text-amber-400 rounded border border-amber-400/30 hover:bg-amber-500/30 transition-colors"
                    >
                      儲值
                    </button>
                  </div>
                </div>
              </div>
              {canAfford ? (
                <button
                  onClick={handleCoinPurchase}
                  disabled={purchasingWithCoins}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 to-yellow-600 text-white font-medium rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {purchasingWithCoins ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      購買中...
                    </>
                  ) : (
                    <>
                      <Coins size={16} />
                      使用需扣除 {totalCoinsNeeded.toLocaleString()} {COIN_LABEL}
                    </>
                  )}
                </button>
              ) : (
                <div>
                  <p className="text-center text-purple-400 text-sm mb-3">
                    {COIN_LABEL}不足（需要 {totalCoinsNeeded.toLocaleString()}，餘額 {userCoins.toLocaleString()}）
                  </p>
                  <button
                    onClick={openRechargeModal}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 to-yellow-600 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Wallet size={16} />
                    前往儲值
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => navigate(-1)}
            disabled={purchasingWithCoins || rechargePurchasing}
            className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors disabled:opacity-50"
          >
            返回
          </button>
        </div>

        {showRechargeModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-purple-500/20 rounded-2xl w-full max-w-sm max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  {selectedRechargeItem && (
                    <button onClick={() => setSelectedRechargeItem(null)} className="text-purple-400 hover:text-white mr-1">
                      <ChevronRight size={18} className="rotate-180" />
                    </button>
                  )}
                  <Wallet size={18} className="text-amber-400" />
                  <h3 className="text-white font-bold">{selectedRechargeItem ? '確認儲值' : '選擇儲值方案'}</h3>
                </div>
                <button onClick={() => { setShowRechargeModal(false); setSelectedRechargeItem(null); }} className="p-1 hover:bg-white/10 rounded-full">
                  <X size={20} className="text-purple-400" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {selectedRechargeItem ? (
                  <div className="p-4">
                    <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-400/20 rounded-xl mb-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center flex-shrink-0">
                        <Sparkles size={16} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white text-sm">{selectedRechargeItem.name}</h4>
                        {selectedRechargeItem.description && (
                          <p className="text-xs text-purple-300 mt-0.5 truncate">{selectedRechargeItem.description}</p>
                        )}
                      </div>
                      <span className="text-lg font-bold text-amber-400 flex-shrink-0">
                        {formatRechargePrice(getRechargePrice(selectedRechargeItem))}
                      </span>
                    </div>
                    {selectedRechargeItem.key_batches?.length > 0 && (
                      <div className="mb-4 p-3 bg-green-500/10 border border-green-400/20 rounded-xl">
                        <h4 className="text-xs font-medium text-green-400 mb-1.5 flex items-center gap-1.5">
                          <Gift size={14} /> 購買後可獲得
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedRechargeItem.key_batches.map((batch: any) => (
                            <span key={batch.id} className="px-2 py-0.5 bg-green-500/10 text-green-400 text-xs rounded-full border border-green-400/20">
                              {getBatchRewardText(batch) || batch.title}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {getRechargePrice(selectedRechargeItem) > 0 && rechargePaymentInfo.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-purple-300 mb-2 flex items-center gap-2">
                          <CreditCard size={14} /> 付款方式
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {rechargePaymentInfo.map((p) => (
                            <button
                              key={p.payment_type}
                              onClick={() => setSelectedRechargePayment(p.payment_type)}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                                selectedRechargePayment === p.payment_type
                                  ? 'bg-amber-500 text-white border-amber-500'
                                  : 'bg-white/5 text-purple-300 border-white/10 hover:border-amber-400/50'
                              }`}
                            >
                              {p.payment_display || p.payment_type}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <button
                      onClick={handleRechargeCheckout}
                      disabled={rechargePurchasing || (getRechargePrice(selectedRechargeItem) > 0 && !selectedRechargePayment)}
                      className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {rechargePurchasing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                          處理中...
                        </>
                      ) : (
                        getRechargePrice(selectedRechargeItem) > 0 ? '確認付款' : '確認領取'
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="p-4">
                    {rechargeLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-400 border-t-transparent" />
                      </div>
                    ) : rechargeItems.length === 0 ? (
                      <p className="text-purple-300 text-sm text-center">暫無儲值方案</p>
                    ) : (
                      <div className="space-y-2">
                        {rechargeItems.map((item: any) => (
                          <button
                            key={item.id}
                            onClick={() => setSelectedRechargeItem(item)}
                            className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-left"
                          >
                            <span className="text-white text-sm font-medium">{item.name}</span>
                            <span className="text-amber-400 font-bold">{formatRechargePrice(getRechargePrice(item))}</span>
                            <ChevronRight size={18} className="text-purple-400" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 沒有資料（無 flex_deck 且非資格被擋）
  if (!flexData || !flexData.flex_deck?.contents?.length) {
    return (
      <div className="h-screen w-screen bg-white flex items-center justify-center">
        <div className="text-center text-gray-600">
          <p className="text-lg mb-2">找不到內容</p>
          <p className="text-gray-400 text-sm">code: {code}</p>
        </div>
      </div>
    );
  }

  // 使用共用函數取得 cardDrawStyle 和 detailStyle
  const cardDrawStyle = getCardDrawStyle(flexData.cards?.template);
  const detailStyle = getDetailStyle(flexData.cards?.template_details);

  // 處理 POST 表單提交
  const handlePost = async (uri: string, formData: FormData): Promise<PostActionResult> => {
    try {
      const response = await api.post(uri, formData);
      if (response.data.success) {
        // 回傳 data 裡的資料（包含 cards, form_data, flex_deck）
        // 這些資料會被 FlexCarouselView 的 onPostSuccess 用來更新畫面
        return { success: true, data: response.data.data };
      } else {
        if (!response.data.data?.need_addon) {
          showError(response.data.message || '提交失敗');
        }
        return { success: false, message: response.data.message, data: response.data.data };
      }
    } catch (err: any) {
      const errData = err.response?.data;
      if (errData?.data?.need_addon) {
        return { success: false, message: errData.message, data: errData.data };
      }
      const errorMessage = errData?.message || '網路錯誤，請稍後再試';
      showError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  // 將 form_data 轉換為字串格式（FormData 只接受 string）
  const serverFormData: FormData = {};
  if (flexData.form_data) {
    Object.entries(flexData.form_data).forEach(([key, value]) => {
      serverFormData[key] = String(value);
    });
  }

  // 使用共用的 FlexCarouselView 元件
  return (
    <FlexCarouselView
      flex={flexData.flex_deck}
      cards={flexData.cards}
      cardStyle={flexData.cards?.style}
      variable={flexData.variable}
      cardDrawStyle={cardDrawStyle}
      detailStyle={detailStyle}
      serverFormData={serverFormData}
      onPost={handlePost}
    />
  );
};

export default FlexView;
