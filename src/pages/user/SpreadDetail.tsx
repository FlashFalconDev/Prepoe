import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import { useConfirm } from '../../hooks/useConfirm';
import ConfirmDialog from '../../components/ConfirmDialog';
import {
  getSpreadItemBysku,
  createOrder,
  getMemberCard,
  SpreadItem,
  MemberCard,
  CreateOrderRequest,
} from '../../config/api';
import { COIN_LABEL } from '../../config/terms';
import { AI_COLORS } from '../../constants/colors';

const SpreadDetail: React.FC = () => {
  const { sku } = useParams<{ sku: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showSuccess, showError } = useToast();
  const { confirm, isOpen, options, handleConfirm, handleCancel } = useConfirm();

  const [item, setItem] = useState<SpreadItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentType, setPaymentType] = useState('');
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [viewingImageUrl, setViewingImageUrl] = useState('');

  // Coin 折抵相關
  const [memberCard, setMemberCard] = useState<MemberCard | null>(null);
  const [useCoins, setUseCoins] = useState(false);
  const [coinAmount, setCoinAmount] = useState(0);

  const hasLoadedRef = useRef(false);
  const isLoadingRef = useRef(false);

  // Coin 折抵計算
  const coinsPerTwd = memberCard?.coins_per_twd || 0; // N coin = 1 TWD
  const coinEnabled = coinsPerTwd > 0 && (memberCard?.coins || 0) > 0;
  const userCoins = memberCard?.coins || 0;

  // 根據訂單金額計算可折抵上限
  const basePrice = item?.base_price || 0;
  const maxRedeemCoins = memberCard?.coin_max_redeem_coins
    ? Math.min(memberCard.coin_max_redeem_coins, userCoins)
    : userCoins;
  const maxRedeemAmountTwd = memberCard?.coin_max_redeem_amount_twd
    ? Math.min(memberCard.coin_max_redeem_amount_twd, basePrice)
    : basePrice;
  // 根據匯率和金額上限，算出實際可用的 coin 上限
  const effectiveMaxCoins = Math.min(
    maxRedeemCoins,
    Math.floor(maxRedeemAmountTwd * coinsPerTwd)
  );

  // 折抵金額
  const coinDiscountAmount = useCoins && coinsPerTwd > 0
    ? Math.floor(coinAmount / coinsPerTwd)
    : 0;
  const finalPrice = Math.max(0, basePrice - coinDiscountAmount);

  // 直接跳轉付款頁面
  const redirectToPayment = (html: string) => {
    document.open();
    document.write(html);
    document.close();

    const form = document.querySelector('form');
    if (form) {
      form.submit();
    }
  };

  // 載入商品詳情
  const loadItem = useCallback(async () => {
    if (!sku || hasLoadedRef.current || isLoadingRef.current) return;
    isLoadingRef.current = true;

    try {
      setLoading(true);
      const referrer = searchParams.get('referrer');
      const response = await getSpreadItemBysku(
        sku,
        referrer ? Number(referrer) : undefined
      );

      if (response.success) {
        setItem(response.data);
        hasLoadedRef.current = true;
      } else {
        showError('載入失敗', response.message);
      }
    } catch (error: any) {
      showError('載入失敗', error.message || '無法載入商品資訊');
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [sku, searchParams, showError]);

  // 載入會員資料（取得 coin 餘額與折抵配置）
  const loadMemberCard = useCallback(async (orderAmount?: number) => {
    try {
      const response = await getMemberCard(orderAmount);
      if (response.success && response.data) {
        setMemberCard(response.data);
      }
    } catch {
      // 訪客或未綁定會員，不影響購買流程
    }
  }, []);

  useEffect(() => {
    if (sku && !hasLoadedRef.current && !isLoadingRef.current) {
      loadItem();
    }
  }, [sku, loadItem]);

  // 商品載入後，用 order_amount 取得精確的 coin 折抵上限
  useEffect(() => {
    if (item && item.base_price > 0) {
      loadMemberCard(item.base_price);
    } else {
      loadMemberCard();
    }
  }, [item, loadMemberCard]);

  // 處理 coin 輸入變更
  const handleCoinChange = (value: number) => {
    // 確保是 coinsPerTwd 的整數倍，方便折抵計算
    const clamped = Math.max(0, Math.min(value, effectiveMaxCoins));
    setCoinAmount(clamped);
  };

  // 快速設定最大 coin
  const handleUseMaxCoins = () => {
    setCoinAmount(effectiveMaxCoins);
  };

  // 處理購買
  const handlePurchase = async () => {
    if (!item) {
      showError('商品資訊載入失敗');
      return;
    }

    if (!item.item_pk) {
      showError('商品資料異常，無法建立訂單');
      return;
    }

    // 付費商品且折抵後仍需付款時，需選付款方式
    if (finalPrice > 0 && !paymentType) {
      showError('請選擇付款方式');
      return;
    }

    const coinInfo = useCoins && coinAmount > 0
      ? `\n使用 ${coinAmount.toLocaleString()} ${COIN_LABEL}折抵 NT$ ${coinDiscountAmount.toLocaleString()}`
      : '';
    const priceDisplay = finalPrice > 0
      ? `\n應付金額：NT$ ${finalPrice.toLocaleString()}`
      : '\n此為免費牌陣';

    const confirmed = await confirm({
      title: '確認購買',
      message: `確定要購買「${item.name}」嗎？${coinInfo}${priceDisplay}`,
      confirmText: '確認購買',
      cancelText: '取消',
      type: 'info',
    });

    if (!confirmed) return;

    try {
      setSubmitting(true);

      const orderData: CreateOrderRequest = {
        items: [
          {
            item_pk: item.item_pk!,
            quantity: 1,
          },
        ],
        payment_method: finalPrice > 0 ? paymentType : 'Free',
      };

      // 帶入 Coin 折抵參數
      if (useCoins && coinAmount > 0 && coinDiscountAmount > 0) {
        orderData.use_coins = coinAmount;
        orderData.total_coins_used = coinAmount;
        orderData.coins_discount_amount = coinDiscountAmount;
      }

      const orderResponse = await createOrder(orderData);

      if (orderResponse.success) {
        if (orderResponse.payment_html) {
          redirectToPayment(orderResponse.payment_html);
        } else {
          showSuccess('購買成功！');
          navigate('/client/spread');
        }
      } else {
        showError(orderResponse.message || '訂單建立失敗');
      }
    } catch (error: any) {
      showError(error.message || '購買過程中發生錯誤');
    } finally {
      setSubmitting(false);
    }
  };

  // 載入中
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${AI_COLORS.border} mx-auto mb-4`}></div>
          <p className="text-gray-600">載入商品資訊中...</p>
        </div>
      </div>
    );
  }

  // 商品不存在
  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-gray-400 mb-4">
            <i className="ri-layout-grid-line text-6xl"></i>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">商品不存在</h3>
          <p className="text-gray-500 mb-6">找不到指定的牌陣商品，請檢查連結是否正確。</p>
          <button
            onClick={() => navigate('/client/spread')}
            className={`inline-flex items-center gap-2 px-4 py-2 ${AI_COLORS.button} rounded-xl transition-colors`}
          >
            <i className="ri-arrow-left-line"></i>
            返回牌陣列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 返回按鈕 */}
        <button
          onClick={() => navigate('/client/spread')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <i className="ri-arrow-left-line"></i>
          <span>返回牌陣列表</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左欄 - 商品資訊 */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">商品資訊</h2>

              {/* 商品主圖 */}
              {item.images && item.images.length > 0 && item.images[0] && (
                <div className="mb-4">
                  <img
                    src={item.images[0].url}
                    alt={item.name}
                    className="w-full h-48 object-cover rounded-lg cursor-pointer"
                    onClick={() => {
                      setViewingImageUrl(item.images[0].url);
                      setShowImageViewer(true);
                    }}
                  />

                  {/* 其他圖片縮圖 */}
                  {item.images.length > 1 && (
                    <div className="mt-3 flex gap-2 overflow-x-auto">
                      {item.images.slice(1).map((image, index) => (
                        <div
                          key={index}
                          className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-orange-400 transition-all"
                          onClick={() => {
                            setViewingImageUrl(image.url);
                            setShowImageViewer(true);
                          }}
                        >
                          <img
                            src={image.url}
                            alt={`${item.name} - 圖片 ${index + 2}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 商品詳情 */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                  <p className="text-gray-600 text-sm mt-1 whitespace-pre-wrap">{item.description}</p>
                </div>

                <div className="space-y-2 text-sm">
                  {item.spread && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <i className="ri-stack-line"></i>
                      <span>抽牌數量：{item.spread.draw_count} 張</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-500">
                    <i className="ri-money-dollar-circle-line"></i>
                    <span>
                      {basePrice > 0
                        ? `NT$ ${basePrice.toLocaleString()}`
                        : '免費'}
                    </span>
                  </div>
                  {item.spread?.ai_interpretation_addon_price != null &&
                    item.spread.ai_interpretation_addon_price > 0 && (
                      <div className="flex items-center gap-2 text-purple-600">
                        <i className="ri-sparkling-line"></i>
                        <span>AI 解讀附加：+NT$ {item.spread.ai_interpretation_addon_price}</span>
                      </div>
                    )}
                </div>

                {/* 標籤 */}
                {item.item_tags && item.item_tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    {item.item_tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="px-2 py-1 text-xs bg-purple-50 text-purple-600 rounded-full"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 右欄 - 購買區 */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">購買牌陣</h2>

              {/* Coin 折抵區塊 */}
              {basePrice > 0 && coinEnabled && (
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900 flex items-center gap-2">
                      <i className="ri-coin-line text-yellow-600"></i>
                      <span>{COIN_LABEL}折抵</span>
                    </h3>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useCoins}
                        onChange={(e) => {
                          setUseCoins(e.target.checked);
                          if (!e.target.checked) setCoinAmount(0);
                        }}
                        className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 rounded"
                      />
                      <span className="text-sm text-gray-700">使用{COIN_LABEL}</span>
                    </label>
                  </div>

                  {/* 金幣餘額資訊 */}
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>我的{COIN_LABEL}餘額</span>
                    <span className="font-medium text-yellow-700">
                      {userCoins.toLocaleString()} {COIN_LABEL}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mb-3">
                    折抵匯率：{coinsPerTwd} {COIN_LABEL} = NT$ 1
                    {effectiveMaxCoins > 0 && (
                      <span className="ml-2">
                        （最多可用 {effectiveMaxCoins.toLocaleString()} {COIN_LABEL}，折抵 NT$ {Math.floor(effectiveMaxCoins / coinsPerTwd).toLocaleString()}）
                      </span>
                    )}
                  </div>

                  {/* 使用金幣數量輸入 */}
                  {useCoins && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min={0}
                          max={effectiveMaxCoins}
                          step={coinsPerTwd}
                          value={coinAmount}
                          onChange={(e) => handleCoinChange(Number(e.target.value))}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                          placeholder={`輸入${COIN_LABEL}數量`}
                        />
                        <button
                          type="button"
                          onClick={handleUseMaxCoins}
                          className="px-3 py-2 text-sm bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors whitespace-nowrap"
                        >
                          最大
                        </button>
                      </div>

                      {/* 折抵滑桿 */}
                      {effectiveMaxCoins > 0 && (
                        <input
                          type="range"
                          min={0}
                          max={effectiveMaxCoins}
                          step={coinsPerTwd}
                          value={coinAmount}
                          onChange={(e) => handleCoinChange(Number(e.target.value))}
                          className="w-full h-2 bg-yellow-200 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                        />
                      )}

                      {/* 折抵結果 */}
                      {coinAmount > 0 && (
                        <div className="flex justify-between text-sm font-medium bg-yellow-100 rounded-lg px-3 py-2">
                          <span className="text-yellow-800">
                            使用 {coinAmount.toLocaleString()} {COIN_LABEL}
                          </span>
                          <span className="text-green-700">
                            -NT$ {coinDiscountAmount.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 費用明細 */}
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200 mb-6">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <i className="ri-money-dollar-circle-line text-purple-600"></i>
                  <span>費用明細</span>
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.name}</span>
                    <span className="text-gray-900 font-medium">
                      {basePrice > 0 ? `NT$ ${basePrice.toLocaleString()}` : '免費'}
                    </span>
                  </div>

                  {/* Coin 折抵明細 */}
                  {useCoins && coinAmount > 0 && coinDiscountAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-700 flex items-center gap-1">
                        <i className="ri-coin-line text-xs"></i>
                        {COIN_LABEL}折抵（{coinAmount.toLocaleString()} {COIN_LABEL}）
                      </span>
                      <span className="text-green-700 font-medium">
                        -NT$ {coinDiscountAmount.toLocaleString()}
                      </span>
                    </div>
                  )}

                  <div className="border-t border-purple-200 pt-2 mt-2">
                    <div className="flex justify-between text-base font-semibold">
                      <span className="text-gray-900">應付金額</span>
                      <span className="text-purple-600 text-xl">
                        {finalPrice > 0 ? `NT$ ${finalPrice.toLocaleString()}` : '免費'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 付款方式 - 折抵後仍需付費才顯示 */}
              {finalPrice > 0 && item.payment_info && item.payment_info.length > 0 && (
                <div className="space-y-4 mb-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    付款方式 <span className="text-red-500">*</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {item.payment_info.map((payment) => (
                      <label
                        key={payment.payment_type}
                        className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          paymentType === payment.payment_type
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300 bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment_type"
                          value={payment.payment_type}
                          checked={paymentType === payment.payment_type}
                          onChange={(e) => setPaymentType(e.target.value)}
                          className="sr-only"
                        />
                        <div className="flex items-center gap-3 w-full">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                              paymentType === payment.payment_type
                                ? 'border-purple-500 bg-purple-500'
                                : 'border-gray-300'
                            }`}
                          >
                            {paymentType === payment.payment_type && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {payment.payment_display}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* 購買按鈕 */}
              <button
                onClick={handlePurchase}
                disabled={submitting}
                className={`w-full px-6 py-3 ${AI_COLORS.button} rounded-xl disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-lg`}
              >
                {submitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    處理中...
                  </div>
                ) : (
                  <>
                    確認購買
                    {finalPrice > 0 && (
                      <span className="ml-2">NT$ {finalPrice.toLocaleString()}</span>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 確認對話框 */}
      <ConfirmDialog
        isOpen={isOpen}
        title={options.title || '確認操作'}
        message={options.message}
        confirmText={options.confirmText}
        cancelText={options.cancelText}
        type={options.type}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />

      {/* 圖片查看器彈窗 */}
      {showImageViewer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4"
          onClick={() => setShowImageViewer(false)}
        >
          <div className="relative max-w-6xl max-h-full">
            <button
              onClick={() => setShowImageViewer(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <i className="ri-close-line text-3xl"></i>
            </button>
            <img
              src={viewingImageUrl}
              alt="查看圖片"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SpreadDetail;
