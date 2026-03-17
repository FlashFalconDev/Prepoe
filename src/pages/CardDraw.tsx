import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Sparkles, X, LogIn, Ticket, Clock, ChevronRight, AlertCircle, Coins, Wallet, CreditCard, Gift } from 'lucide-react';
import { api, API_ENDPOINTS, getSpreadItemSkuList, getMemberCard, createOrder, keysGetBatchDetail, type SpreadItem, type MemberCard, type CreateOrderRequest } from '../config/api';
import { COIN_LABEL, memberLabelMap } from '../config/terms';
import { DrawResult, getTemplate, DEFAULT_TEMPLATE, FlexCarouselView, getTemplateFromResult, getCardDrawStyle, getDetailStyle, PostActionResult, FormData } from '../components/cardDraw';
import { useToast } from '../hooks/useToast';
import LoadingScreen, { LoadingStyle } from '../components/LoadingScreen';

// 預設卡背圖片
const DEFAULT_CARD_BACK = 'https://fflinebotstatic.s3.ap-northeast-1.amazonaws.com/default_records/card_style/default_card_back.png';

// Quota 使用資訊
interface QuotaUsed {
  used_reset: number;
  used_bonus: number;
  remaining_reset: number;
  remaining_bonus: number;
  remaining_total: number;
}

// 票券使用資訊
interface TicketUsed {
  ticket_number: string;
  ticket_name: string;
  bonus_added: number;
}

// 可用票券資訊
interface AvailableTicket {
  ticket_number: string;
  ticket_name: string;
  bonus_amount: number;
  valid_until: string;
}

// 次數不足時的資訊
interface InsufficientQuotaData {
  remaining_reset: number;
  remaining_bonus: number;
  remaining_total: number;
  next_reset_at?: string;
  available_tickets: AvailableTicket[];
}

/**
 * CardDraw - 抽卡頁面（使用 quota API）
 * 路由：/card/:clientSid/:spreadCode
 * API：CARDHACK_DRAW_QUOTA
 */
const CardDraw: React.FC = () => {
  const { spreadCode } = useParams<{ clientSid: string; spreadCode: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { showSuccess, showError } = useToast();

  // 從 URL 查詢參數讀取載入風格：?loading=tarot | neutral | minimal
  // 預設為 'tarot'（保留原有的塔羅風格）
  const loadingStyleParam = searchParams.get('loading') as LoadingStyle | null;
  const loadingStyle: LoadingStyle = ['tarot', 'neutral', 'minimal'].includes(loadingStyleParam || '')
    ? (loadingStyleParam as LoadingStyle)
    : 'tarot';

  // 從 URL 查詢參數讀取背景顏色：?color=ADAEC2 或 ?color=%23ADAEC2
  const backgroundColor = searchParams.get('color') || undefined;

  // 從 URL 查詢參數讀取載入提示文字：?text=載入中...
  const loadingText = searchParams.get('text') || undefined;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needLogin, setNeedLogin] = useState(false);
  const [drawResult, setDrawResult] = useState<DrawResult | null>(null);

  // 啟用 AI 時：一進來先問問題，question_submit 後再顯示抽卡
  const [userQuestion, setUserQuestion] = useState('');
  const [questionSubmitting, setQuestionSubmitting] = useState(false);
  const [questionSubmitted, setQuestionSubmitted] = useState(false);

  // Quota 相關狀態
  const [quotaUsed, setQuotaUsed] = useState<QuotaUsed | null>(null);
  const [ticketUsed, setTicketUsed] = useState<TicketUsed | null>(null);

  // 次數不足狀態
  const [insufficientQuota, setInsufficientQuota] = useState<InsufficientQuotaData | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [usingTicket, setUsingTicket] = useState(false);

  // 金幣購買狀態
  const [spreadItem, setSpreadItem] = useState<SpreadItem | null>(null);
  const [memberCard, setMemberCard] = useState<MemberCard | null>(null);
  const [purchasingWithCoins, setPurchasingWithCoins] = useState(false);

  // 儲值 Modal
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [rechargeItems, setRechargeItems] = useState<any[]>([]);
  const [rechargePaymentInfo, setRechargePaymentInfo] = useState<{ payment_type: string; payment_display: string }[]>([]);
  const [rechargeLoading, setRechargeLoading] = useState(false);
  const [selectedRechargeItem, setSelectedRechargeItem] = useState<any | null>(null);
  const [selectedRechargePayment, setSelectedRechargePayment] = useState<string>('');
  const [rechargePurchasing, setRechargePurchasing] = useState(false);

  // 抽卡流程狀態（傳給模板元件）
  const [drawnCardIndices, setDrawnCardIndices] = useState<number[]>([]);
  const [flippingIndex, setFlippingIndex] = useState<number | null>(null);
  const [allCardsDrawn, setAllCardsDrawn] = useState(false);

  // AI 加購（need_addon 時進入付費流程）
  const [addonInfo, setAddonInfo] = useState<{ need_addon: boolean; price: number; session_id: number } | null>(null);
  const [addonMemberCard, setAddonMemberCard] = useState<MemberCard | null>(null);
  const [purchasingAddon, setPurchasingAddon] = useState(false);

  // 記錄上一次呼叫的 spreadCode，用於判斷是否需要重新呼叫 API
  const lastSpreadCodeRef = useRef<string | undefined>(undefined);

  // 動態卡牌比例
  const [cardAspectRatio, setCardAspectRatio] = useState<string>('3/4');

  // 卡背圖片
  const cardBackImage = drawResult?.cards?.style || DEFAULT_CARD_BACK;

  // 呼叫抽卡 API（使用 quota API）
  const performDraw = async (forceRefresh = false, ticketNumber?: string) => {
    if (!spreadCode) {
      setError('缺少牌陣代碼');
      setLoading(false);
      return;
    }

    // 如果 spreadCode 相同且已經呼叫過，不重複呼叫（除非 forceRefresh 或使用票券）
    if (lastSpreadCodeRef.current === spreadCode && !forceRefresh && !ticketNumber) {
      return;
    }
    lastSpreadCodeRef.current = spreadCode;

    try {
      setLoading(true);
      setError(null);
      setQuotaUsed(null);
      setTicketUsed(null);
      setInsufficientQuota(null);

      // 構建請求參數
      const requestData: { ticket_number?: string; auto_use_ticket?: boolean } = {};
      if (ticketNumber) {
        requestData.ticket_number = ticketNumber;
      }

      const response = await api.post(API_ENDPOINTS.CARDHACK_DRAW_QUOTA(spreadCode), requestData);

      if (response.data.success) {
        // template 在 cards 物件裡面
        const template = response.data.data?.cards?.template;

        const resultData = {
          ...response.data.data,
          template: template,
        };

        setDrawResult(resultData);
        setNeedLogin(false);

        // 設置 quota 使用資訊
        if (response.data.data?.quota_used) {
          setQuotaUsed(response.data.data.quota_used);
        }

        // 設置票券使用資訊
        if (response.data.data?.ticket_used) {
          setTicketUsed(response.data.data.ticket_used);
        }
      } else {
        // 檢查是否為次數不足的情況
        if (response.data.data?.available_tickets !== undefined) {
          // 次數不足，顯示票券選擇介面
          setInsufficientQuota({
            remaining_reset: response.data.data.remaining_reset || 0,
            remaining_bonus: response.data.data.remaining_bonus || 0,
            remaining_total: response.data.data.remaining_total || 0,
            next_reset_at: response.data.data.next_reset_at,
            available_tickets: response.data.data.available_tickets || [],
          });
        } else if (response.data.error === 'Authentication required') {
          setNeedLogin(true);
        } else {
          setError(response.data.message || '抽牌失敗');
        }
      }
    } catch (err: any) {
      console.error('抽牌失敗:', err);
      if (err.response?.status === 401 || err.response?.data?.error === 'Authentication required') {
        setNeedLogin(true);
      } else {
        setError(err.response?.data?.message || '抽牌時發生錯誤');
      }
    } finally {
      setLoading(false);
      setUsingTicket(false);
    }
  };

  // 使用票券抽牌
  const handleUseTicket = async (ticketNumber: string) => {
    setSelectedTicket(ticketNumber);
    setUsingTicket(true);
    await performDraw(true, ticketNumber);
  };

  // 載入商品和會員卡資訊（用於金幣購買）
  const loadPurchaseInfo = async () => {
    try {
      const [itemsRes, cardRes] = await Promise.allSettled([
        getSpreadItemSkuList(1, 100),
        getMemberCard(),
      ]);

      if (itemsRes.status === 'fulfilled' && itemsRes.value.success) {
        const matched = itemsRes.value.data.items.find(
          (item: SpreadItem) => item.spread?.code === spreadCode
        );
        if (matched) {
          setSpreadItem(matched);
          // 用商品價格重新取得精確的金幣折抵配置
          if (matched.base_price > 0 && cardRes.status === 'fulfilled') {
            try {
              const cardWithAmount = await getMemberCard(matched.base_price);
              if (cardWithAmount.success && cardWithAmount.data) {
                setMemberCard(cardWithAmount.data);
                return;
              }
            } catch { /* fallback 使用初始結果 */ }
          }
        }
      }

      if (cardRes.status === 'fulfilled' && cardRes.value.success && cardRes.value.data) {
        setMemberCard(cardRes.value.data);
      }
    } catch (err) {
      console.error('載入購買資訊失敗:', err);
    }
  };

  // 當次數不足時載入購買資訊
  useEffect(() => {
    if (insufficientQuota && spreadCode) {
      loadPurchaseInfo();
    }
  }, [insufficientQuota, spreadCode]);

  // 金幣購買
  const handleCoinPurchase = async () => {
    if (!spreadItem || !memberCard) return;

    const coinsPerTwd = memberCard.coins_per_twd || 0;
    const basePrice = spreadItem.base_price || 0;
    const totalCoinsNeeded = Math.ceil(basePrice * coinsPerTwd);

    if (memberCard.coins < totalCoinsNeeded) {
      showError(`${COIN_LABEL}不足`);
      return;
    }

    try {
      setPurchasingWithCoins(true);
      const orderData: CreateOrderRequest = {
        items: [{ item_pk: spreadItem.item_pk || spreadItem.id, quantity: 1 }],
        payment_method: 'Free',
        use_coins: totalCoinsNeeded,
        total_coins_used: totalCoinsNeeded,
        coins_discount_amount: basePrice,
        return_url: window.location.href,
      };

      const response = await createOrder(orderData);
      if (response.success) {
        showSuccess('購買成功！正在重新抽牌...');
        // 購買成功，自動重新抽牌
        lastSpreadCodeRef.current = undefined;
        setInsufficientQuota(null);
        performDraw(true);
      } else {
        showError(response.message || '購買失敗');
      }
    } catch (err: any) {
      showError(err.response?.data?.message || '購買過程中發生錯誤');
    } finally {
      setPurchasingWithCoins(false);
    }
  };

  // 儲值相關
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
      const response = await api.get(API_ENDPOINTS.SHOP_ITEMS, {
        params: { type: 'recharge' },
      });
      if (response.data.items) {
        const filtered = (response.data.items || []).filter((i: any) => i.is_active && i.key_batches && i.key_batches.length > 0);
        // 取得批次詳細獎勵
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
            setSelectedRechargePayment(response.data.payment_info[0].payment_type);
          }
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
        payment_method: price > 0 ? selectedRechargePayment : 'free',
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
          // 重新載入會員卡取得更新後的金幣餘額
          loadPurchaseInfo();
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

  // 跳轉到登入頁面
  const goToLogin = () => {
    localStorage.setItem('login_redirect', location.pathname);
    navigate('/login', { state: { from: location } });
  };

  // 重新抽牌
  const handleRestart = () => {
    setDrawResult(null);
    setDrawnCardIndices([]);
    setFlippingIndex(null);
    setAllCardsDrawn(false);
    setQuotaUsed(null);
    setTicketUsed(null);
    setInsufficientQuota(null);
    setSelectedTicket(null);
    setUserQuestion('');
    setQuestionSubmitted(false);
    lastSpreadCodeRef.current = undefined;
    performDraw(true);
  };

  // 啟用 AI 時：question_submit 存問題到後端，再進入抽卡
  const handleQuestionSubmit = async () => {
    const q = userQuestion.trim();
    if (!q) {
      showError('請輸入想要詢問的內容');
      return;
    }
    if (!spreadCode) return;
    setQuestionSubmitting(true);
    try {
      const sessionId = drawResult?.session_id ?? drawResult?.form_data?.session_id;
      await api.post(API_ENDPOINTS.CARDHACK_QUESTION_SUBMIT, {
        spread_code: spreadCode,
        note: q,
        ...(sessionId != null && { session_id: Number(sessionId) }),
      });
      setQuestionSubmitted(true);
    } catch (err: any) {
      showError(err.response?.data?.message || '提交失敗，請稍後再試');
    } finally {
      setQuestionSubmitting(false);
    }
  };

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // 第一個 API（draw/quota）必須先呼叫，取得內容後才進行後續動作
  useEffect(() => {
    if (!spreadCode) return;
    // spreadCode 改變時重置狀態
    if (lastSpreadCodeRef.current !== spreadCode) {
      setDrawResult(null);
      setDrawnCardIndices([]);
      setFlippingIndex(null);
      setAllCardsDrawn(false);
      setError(null);
      setNeedLogin(false);
      setUserQuestion('');
      setQuestionSubmitted(false);
      setLoading(true);
    }
    // 必定呼叫 draw/quota API（performDraw 內部會設定 lastSpreadCodeRef）
    performDraw();
  }, [spreadCode]);

  // 預載入所有牌的圖片，並計算卡牌比例
  useEffect(() => {
    if (drawResult?.cards.content && drawResult.cards.content.length > 0) {
      const firstCard = drawResult.cards.content[0];
      const img = new Image();
      img.onload = () => {
        const ratio = `${img.naturalWidth}/${img.naturalHeight}`;
        setCardAspectRatio(ratio);
      };
      img.src = firstCard.image_url;

      // 預載入其他牌的圖片
      drawResult.cards.content.slice(1).forEach((card) => {
        const preloadImg = new Image();
        preloadImg.src = card.image_url;
      });
    }
  }, [drawResult]);

  // 載入中畫面 - 根據 loadingStyle、backgroundColor 和 loadingText 顯示
  if (loading) {
    return (
      <LoadingScreen
        style={loadingStyle}
        title={loadingText || (loadingStyle === 'tarot' ? '正在洗牌中...' : '載入中...')}
        subtitle={loadingStyle === 'tarot' ? '請靜心冥想您的問題' : '請稍候'}
        backgroundColor={backgroundColor}
      />
    );
  }

  // 需要登入畫面
  if (needLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-indigo-900 to-purple-950 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles size={40} className="text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">開始你的占卜之旅</h2>
          <p className="text-purple-200 mb-6">
            請先登入以開啟神秘的塔羅牌陣，<br />
            揭示屬於你的命運指引
          </p>
          <button
            onClick={goToLogin}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-xl transition-all font-medium shadow-lg"
          >
            <LogIn size={20} />
            登入開始抽牌
          </button>
          <p className="text-purple-400 text-xs mt-4">
            登入後即可免費體驗占卜服務
          </p>
        </div>
      </div>
    );
  }

  // 次數不足畫面 - 顯示可用票券
  if (insufficientQuota) {
    const hasTickets = insufficientQuota.available_tickets.length > 0;

    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-indigo-900 to-purple-950 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-w-md w-full">
          {/* 標題區域 */}
          <div className="text-center mb-6">
            <p className="text-purple-200 text-sm">
              您的抽牌次數已用完
              {insufficientQuota.next_reset_at && (
                <>
                  <br />
                  <span className="text-purple-300">
                    下次重置：{formatDate(insufficientQuota.next_reset_at)}
                  </span>
                </>
              )}
            </p>
          </div>

          {/* 票券列表 - 有票券才顯示 */}
          {hasTickets && (
            <div className="space-y-3 mb-6">
              <p className="text-purple-300 text-sm font-medium">選擇票券補充次數：</p>
              {insufficientQuota.available_tickets.map((ticket) => (
                <button
                  key={ticket.ticket_number}
                  onClick={() => handleUseTicket(ticket.ticket_number)}
                  disabled={usingTicket}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
                    selectedTicket === ticket.ticket_number && usingTicket
                      ? 'bg-purple-500/30 border-purple-400'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-400/50'
                  } ${usingTicket ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Ticket size={24} className="text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white font-medium">{ticket.ticket_name}</p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-amber-400 font-semibold">+{ticket.bonus_amount} 次</span>
                      <span className="text-purple-400">•</span>
                      <span className="text-purple-300 flex items-center gap-1">
                        <Clock size={12} />
                        {formatDate(ticket.valid_until)} 到期
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-purple-400" />
                </button>
              ))}
            </div>
          )}

          {/* 金幣購買區塊 */}
          {spreadItem && memberCard && (memberCard.coins_per_twd || 0) > 0 && (() => {
            const coinsPerTwd = memberCard.coins_per_twd || 0;
            const basePrice = spreadItem.base_price || 0;
            const totalCoinsNeeded = Math.ceil(basePrice * coinsPerTwd);
            const userCoins = memberCard.coins || 0;
            const canAfford = userCoins >= totalCoinsNeeded;

            return (
              <div className="bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-400/20 rounded-xl p-4 mb-6">
                <h3 className="text-amber-400 text-sm font-medium mb-3 flex items-center gap-2">
                  <Coins size={16} />
                  使用{COIN_LABEL}購買
                </h3>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-white text-sm font-medium">{spreadItem.name}</p>
                    <p className="text-purple-300 text-xs mt-0.5">NT$ {basePrice}</p>
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
                    disabled={purchasingWithCoins || usingTicket}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {purchasingWithCoins ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
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
                      className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <Wallet size={16} />
                      前往儲值
                    </button>
                  </div>
                )}
              </div>
            );
          })()}

          {/* 使用中提示 */}
          {usingTicket && (
            <div className="flex items-center justify-center gap-2 text-purple-300 text-sm mb-4">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-400 border-t-transparent"></div>
              <span>正在使用票券...</span>
            </div>
          )}

          {/* 返回按鈕 */}
          <button
            onClick={() => navigate(-1)}
            disabled={usingTicket || purchasingWithCoins}
            className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors disabled:opacity-50"
          >
            返回
          </button>
        </div>

        {/* 儲值 Modal */}
        {showRechargeModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-purple-500/20 rounded-2xl w-full max-w-sm max-h-[80vh] flex flex-col">
              {/* Modal 標題 */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  {selectedRechargeItem && (
                    <button onClick={() => setSelectedRechargeItem(null)} className="text-purple-400 hover:text-white transition-colors mr-1">
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

              {/* Modal 內容 */}
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

                    {/* 購買獎勵 */}
                    {selectedRechargeItem.key_batches && selectedRechargeItem.key_batches.length > 0 && (
                      <div className="mb-4 p-3 bg-green-500/10 border border-green-400/20 rounded-xl">
                        <h4 className="text-xs font-medium text-green-400 mb-1.5 flex items-center gap-1.5">
                          <Gift size={14} />
                          購買後可獲得
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

                    {/* 付款方式 */}
                    {getRechargePrice(selectedRechargeItem) > 0 && rechargePaymentInfo.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-purple-300 mb-2 flex items-center gap-2">
                          <CreditCard size={14} />
                          付款方式
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {rechargePaymentInfo.map((p) => (
                            <button
                              key={p.payment_type}
                              onClick={() => setSelectedRechargePayment(p.payment_type)}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                                selectedRechargePayment === p.payment_type
                                  ? 'bg-amber-500 text-white border-amber-500'
                                  : 'bg-white/5 text-purple-200 border-white/10 hover:border-amber-400/50'
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
                      disabled={rechargePurchasing || (getRechargePrice(selectedRechargeItem) > 0 && !selectedRechargePayment)}
                      className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-medium rounded-xl hover:from-amber-600 hover:to-yellow-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {rechargePurchasing ? '處理中...' : getRechargePrice(selectedRechargeItem) === 0 ? '免費領取' : '確認付款'}
                    </button>
                  </div>
                ) : rechargeLoading ? (
                  <div className="p-4 space-y-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse"></div>
                    ))}
                  </div>
                ) : rechargeItems.length > 0 ? (
                  <div className="p-4 space-y-2">
                    {rechargeItems.map((item) => {
                      const price = getRechargePrice(item);
                      return (
                        <button
                          key={item.item_pk}
                          onClick={() => setSelectedRechargeItem(item)}
                          className="w-full flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl hover:border-amber-400/30 hover:bg-white/10 transition-all text-left group"
                        >
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center flex-shrink-0">
                            <Sparkles size={16} className="text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-white text-sm">{item.name}</h4>
                            {item.description && (
                              <p className="text-xs text-purple-400 mt-0.5 truncate">{item.description}</p>
                            )}
                            {item.key_batches && item.key_batches.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {item.key_batches.map((batch: any) => (
                                  <span key={batch.id} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-green-500/10 text-green-400 text-[10px] rounded-full border border-green-400/20">
                                    <Gift size={9} />
                                    {getBatchRewardText(batch) || batch.title}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className="text-sm font-bold text-amber-400">{formatRechargePrice(price)}</span>
                            <ChevronRight size={14} className="text-purple-500 group-hover:text-amber-400 transition-colors" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Wallet size={32} className="mx-auto text-purple-500 mb-2" />
                    <p className="text-purple-400 text-sm">目前沒有儲值方案</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 錯誤畫面
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <X size={32} className="text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">抽牌失敗</h2>
          <p className="text-purple-200 mb-6">{error}</p>
          <button
            onClick={handleRestart}
            className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-colors"
          >
            重新嘗試
          </button>
        </div>
      </div>
    );
  }

  // 啟用 AI 時：一進來先問問題，question_submit 後再顯示抽卡
  if (drawResult?.ai_interpretation?.ai_is_active && !questionSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-indigo-900 to-purple-950 flex flex-col justify-center p-6">
        <div className="max-w-lg mx-auto w-full">
          <h2 className="text-xl font-bold text-white text-center mb-2">請輸入想要詢問的內容</h2>
          <p className="text-purple-200 text-sm text-center mb-4">靜心思考您的問題，將有助於獲得更好的解讀</p>
          <textarea
            value={userQuestion}
            onChange={(e) => setUserQuestion(e.target.value)}
            placeholder="在此輸入您的問題..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-purple-400/20 text-white placeholder-purple-400/40 focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 outline-none resize-none text-sm"
            disabled={questionSubmitting}
          />
          <button
            type="button"
            onClick={handleQuestionSubmit}
            disabled={questionSubmitting || !userQuestion.trim()}
            className="mt-4 w-full py-3 rounded-xl bg-purple-500 hover:bg-purple-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center justify-center gap-2"
          >
            {questionSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                提交中...
              </>
            ) : (
              '確認並開始抽牌'
            )}
          </button>
        </div>
      </div>
    );
  }

  // 沒有結果
  if (!drawResult) {
    return null;
  }

  // 處理 POST 表單提交
  const handlePost = async (uri: string, formData: FormData): Promise<PostActionResult> => {
    try {
      const response = await api.post(uri, formData);
      if (response.data.success) {
        // 回傳 data 裡的資料（包含 cards, form_data, flex_deck）
        // 這些資料會被 FlexCarouselView 的 onPostSuccess 用來更新畫面
        return { success: true, data: response.data.data };
      } else {
        // 需要加購時不顯示錯誤（由 onNeedAddon 處理）
        if (!response.data.data?.need_addon) {
          showError(response.data.message || '提交失敗');
        }
        return { success: false, message: response.data.message, data: response.data.data };
      }
    } catch (err: any) {
      const errData = err.response?.data;
      // 需要加購時回傳 data（由 onNeedAddon 處理）
      if (errData?.data?.need_addon) {
        return { success: false, message: errData.message, data: errData.data };
      }
      const errorMessage = errData?.message || '網路錯誤，請稍後再試';
      showError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  // 如果 API 回傳 flex_deck，使用 FlexCarouselView
  if (drawResult.flex_deck) {
    // 使用共用函數取得 cardDrawStyle 和 detailStyle
    const templateValue = getTemplateFromResult(drawResult);
    const cardDrawStyle = getCardDrawStyle(templateValue);
    const detailStyle = getDetailStyle(drawResult.cards?.template_details);

    // 將 form_data 轉換為字串格式（FormData 只接受 string）
    const serverFormData: FormData = {};
    if (drawResult.form_data) {
      Object.entries(drawResult.form_data).forEach(([key, value]) => {
        serverFormData[key] = String(value);
      });
    }
    // 確保 session_id 有被傳遞（如果 form_data 沒有，就從 drawResult.session_id 取）
    if (!serverFormData.session_id && drawResult.session_id) {
      serverFormData.session_id = String(drawResult.session_id);
    }

    return (
      <FlexCarouselView
        flex={drawResult.flex_deck}
        cards={drawResult.cards}
        cardStyle={drawResult.cards?.style}
        variable={drawResult.variable}
        onComplete={handleRestart}
        cardDrawStyle={cardDrawStyle}
        detailStyle={detailStyle}
        serverFormData={serverFormData}
        onPost={handlePost}
        recommended_item={drawResult.recommended_item}
        recommended_person={drawResult.recommended_person}
      />
    );
  }

  // 否則使用傳統模板系統
  const templateName = drawResult.template || DEFAULT_TEMPLATE;
  const TemplateComponent = getTemplate(templateName);

  return (
    <TemplateComponent
      drawResult={drawResult}
      cardBackImage={cardBackImage}
      cardAspectRatio={cardAspectRatio}
      onRestart={handleRestart}
      drawnCardIndices={drawnCardIndices}
      setDrawnCardIndices={setDrawnCardIndices}
      flippingIndex={flippingIndex}
      setFlippingIndex={setFlippingIndex}
      allCardsDrawn={allCardsDrawn}
      setAllCardsDrawn={setAllCardsDrawn}
      recommended_item={drawResult.recommended_item}
      recommended_person={drawResult.recommended_person}
      ai_interpretation={drawResult.ai_interpretation}
      userQuestion={questionSubmitted ? userQuestion : undefined}
      onAiSubmit={
        drawResult.ai_interpretation?.ai_is_active
          ? async (formData) => {
              try {
                // 先將問題存到後端（模板內輸入時）
                if (spreadCode && formData.note && formData.session_id) {
                  await api.post(API_ENDPOINTS.CARDHACK_QUESTION_SUBMIT, {
                    spread_code: spreadCode,
                    note: formData.note,
                    session_id: typeof formData.session_id === 'string' ? Number(formData.session_id) : formData.session_id,
                  }).catch(() => {});
                }
                const res = await api.post(API_ENDPOINTS.CARDHACK_AI_SUBMIT, {
                  session_id: typeof formData.session_id === 'string' ? Number(formData.session_id) : formData.session_id,
                  note: formData.note,
                });
                const resData = res.data;
                // 檢查 need_addon（可能在 data.data 或 data）
                const addonData = resData?.data?.need_addon ? resData.data : (resData?.need_addon ? resData : null);
                if (!resData?.success && addonData?.need_addon) {
                  setAddonInfo({ need_addon: true, price: addonData.price, session_id: addonData.session_id });
                  getMemberCard(addonData.price).then(r => { if (r.success) setAddonMemberCard(r.data); }).catch(() => {});
                  return { success: false, need_addon: true };
                }
                const d = resData?.data;
                const interpretation =
                  d?.interpretation ?? d?.interpretation_text ?? d?.content ??
                  d?.flex_deck?.contents?.[0]?.hero?.layers?.[0]?.text;
                return {
                  success: !!resData?.success,
                  data: { interpretation: interpretation || '暫無分析結果' },
                };
              } catch (err: any) {
                const errData = err.response?.data;
                const addonData = errData?.data?.need_addon ? errData.data : (errData?.need_addon ? errData : null);
                if (addonData?.need_addon) {
                  setAddonInfo({ need_addon: true, price: addonData.price, session_id: addonData.session_id });
                  getMemberCard(addonData.price).then(r => { if (r.success) setAddonMemberCard(r.data); }).catch(() => {});
                  return { success: false, need_addon: true };
                }
                showError(errData?.message || 'AI 解讀失敗');
                return { success: false };
              }
            }
          : undefined
      }
      addonInfo={addonInfo}
      addonMemberCard={addonMemberCard}
      onAddonPurchase={
        addonInfo && drawResult.ai_interpretation?.ai_is_active
          ? async (note: string) => {
              if (!addonInfo || !addonMemberCard) return null;
              const coinsPerTwd = addonMemberCard.coins_per_twd || 0;
              const totalCoinsNeeded = Math.ceil(addonInfo.price * coinsPerTwd);
              if (addonMemberCard.coins < totalCoinsNeeded) {
                showError(`${COIN_LABEL}不足`);
                return null;
              }
              setPurchasingAddon(true);
              try {
                const orderRes = await api.post(API_ENDPOINTS.CARDHACK_AI_ADDON_ORDER_CREATE, {
                  session_id: addonInfo.session_id,
                  payment_method: 'Free',
                  use_coins: totalCoinsNeeded,
                  coins_discount_amount: addonInfo.price,
                });
                const orderData = orderRes.data;
                if (!orderData.success) {
                  showError(orderData.message || '建立訂單失敗');
                  return null;
                }
                showSuccess(orderData.message || '購買成功！正在載入解析...');
                setAddonInfo(null);
                setAddonMemberCard(null);
                const aiRes = await api.post(API_ENDPOINTS.CARDHACK_AI_SUBMIT, {
                  session_id: addonInfo.session_id,
                  note: note || userQuestion || '',
                });
                const d = aiRes.data?.data;
                const interpretation =
                  d?.interpretation ?? d?.interpretation_text ?? d?.content ??
                  d?.flex_deck?.contents?.[0]?.hero?.layers?.[0]?.text;
                return { interpretation: interpretation || '暫無分析結果' };
              } catch (err: any) {
                showError(err.response?.data?.message || '購買過程中發生錯誤');
                return null;
              } finally {
                setPurchasingAddon(false);
              }
            }
          : undefined
      }
    />
  );
};

export default CardDraw;
