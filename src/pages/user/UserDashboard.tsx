import React, { useState, useEffect } from 'react';
import { Star, Clock, X, User, Calendar, Ticket, CreditCard, BookOpen, MessageSquare, Wallet, Sparkles, ChevronRight, Gift } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getMemberComplete, updateMemberDetails, type MemberComplete, type MemberDetailsUpdateData, api, API_ENDPOINTS, createOrder, keysGetBatchDetail } from '../../config/api';
import { COIN_LABEL, memberLabelMap } from '../../config/terms';
import { useToast } from '../../hooks/useToast';
import { AI_COLORS } from '../../constants/colors';
import { handlePermissionRedeem } from '../../utils/permissionUtils';
import MyOrdersModal from '../../components/MyOrdersModal';
import { useNavigate, useSearchParams } from 'react-router-dom';

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

// 專區卡片組件
const FeatureCard: React.FC<{
  icon: React.ComponentType<any>;
  title: string;
  path?: string;
  onClick?: () => void;
  isComingSoon?: boolean;
}> = ({ icon: Icon, title, path, onClick, isComingSoon = true }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (isComingSoon) return;
    if (onClick) {
      onClick();
    } else if (path) {
      navigate(path);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`flex flex-col items-center justify-center bg-white rounded-xl shadow-sm transition-all duration-200 border border-gray-100 p-6 ${
        isComingSoon ? 'opacity-60 cursor-not-allowed pointer-events-none' : 'hover:shadow-md cursor-pointer'
      }`}
    >
      <div className={`w-14 h-14 ${AI_COLORS.bg} rounded-xl flex items-center justify-center mb-3`}>
        <Icon size={28} className={AI_COLORS.text} />
      </div>
      <h3 className="font-semibold text-gray-900 text-base text-center">
        {title}
      </h3>
    </div>
  );
};

const UserDashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  const { checkAuth } = useAuth();

  // 會員資料狀態
  const [memberData, setMemberData] = useState<MemberComplete | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');

  // 我的訂單彈窗狀態
  const [isMyOrdersModalOpen, setIsMyOrdersModalOpen] = useState(false);

  // 儲值 Modal
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [rechargeItems, setRechargeItems] = useState<any[]>([]);
  const [rechargePaymentInfo, setRechargePaymentInfo] = useState<{ payment_type: string; payment_display: string }[]>([]);
  const [rechargeLoading, setRechargeLoading] = useState(false);
  const [selectedRechargeItem, setSelectedRechargeItem] = useState<any | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [purchasing, setPurchasing] = useState(false);

  // 編輯表單狀態
  const [editForm, setEditForm] = useState<MemberDetailsUpdateData>({
    nick_name: '',
    email: '',
    phone: '',
    birthday: '',
    gender: 'male',
    address: ''
  });

  // 載入會員資料
  const loadMemberData = async () => {
    try {
      setIsLoading(true);
      const response = await getMemberComplete();
      if (response.success) {
        setMemberData(response.data);
        // 初始化編輯表單
        setEditForm({
          nick_name: response.data.member_details.nick_name || '',
          email: response.data.member_details.email || '',
          phone: response.data.member_details.phone || '',
          birthday: response.data.member_details.birthday || '',
          gender: response.data.member_details.gender || 'male',
          address: response.data.member_details.address || ''
        });
      }
    } catch (error) {
      console.error('載入會員資料失敗:', error);
      showToast({ type: 'error', title: '載入會員資料失敗' });
    } finally {
      setIsLoading(false);
    }
  };

  // 開啟編輯彈窗
  const handleEditClick = () => {
    if (memberData) {
      setEditForm({
        nick_name: memberData.member_details.nick_name || '',
        email: memberData.member_details.email || '',
        phone: memberData.member_details.phone || '',
        birthday: memberData.member_details.birthday || '',
        gender: memberData.member_details.gender || 'male',
        address: memberData.member_details.address || ''
      });
      setIsEditModalOpen(true);
    }
  };

  // 處理金鑰兌換
  const handleRedeem = async () => {
    if (!redeemCode.trim()) {
      showToast({ type: 'error', title: '請輸入兌換碼' });
      return;
    }

    await handlePermissionRedeem(redeemCode, {
      useToast: true,
      showSuccess: (message) => showToast({ type: 'success', title: message }),
      showError: (message) => showToast({ type: 'error', title: message }),
      checkAuth,
      onSuccess: () => {
        setRedeemCode('');
        setIsRedeemModalOpen(false);
        loadMemberData(); // 重新載入會員資料以更新積分
      }
    });
  };

  // 關閉編輯彈窗
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
  };

  // 更新會員資料
  const handleUpdateMember = async () => {
    try {
      setIsUpdating(true);
      const response = await updateMemberDetails(editForm);
      if (response.success) {
        showToast({ type: 'success', title: '會員資料更新成功' });
        // 重新載入資料
        await loadMemberData();
        setIsEditModalOpen(false);
      } else {
        showToast({ type: 'error', title: response.message || '更新失敗' });
      }
    } catch (error) {
      console.error('更新會員資料失敗:', error);
      showToast({ type: 'error', title: '更新會員資料失敗' });
    } finally {
      setIsUpdating(false);
    }
  };

  // 處理表單輸入變更
  const handleInputChange = (field: keyof MemberDetailsUpdateData, value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 儲值相關
  const loadRechargeItems = async () => {
    try {
      setRechargeLoading(true);
      const response = await api.get(API_ENDPOINTS.SHOP_ITEMS, {
        params: { type: 'recharge' },
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
    const price = getItemPrice(selectedRechargeItem);
    if (price > 0 && !selectedPayment) {
      showToast({ type: 'error', title: '請選擇付款方式' });
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
          showToast({ type: 'success', title: response.message || '儲值成功！' });
          setShowRechargeModal(false);
          setSelectedRechargeItem(null);
          loadMemberData();
        }
      } else {
        showToast({ type: 'error', title: response.message || '購買失敗' });
      }
    } catch (error: any) {
      showToast({ type: 'error', title: error.response?.data?.message || '購買過程中發生錯誤' });
    } finally {
      setPurchasing(false);
    }
  };

  // 組件載入時取得會員資料
  useEffect(() => {
    loadMemberData();
  }, []);

  // 檢查 URL 參數，如果有 key 則自動開啟兌換彈窗
  useEffect(() => {
    const keyParam = searchParams.get('key');
    if (keyParam) {
      setRedeemCode(keyParam);
      setIsRedeemModalOpen(true);
      // 清除 URL 參數，避免重複觸發
      searchParams.delete('key');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* User Profile Summary */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                <span className="ml-2 text-gray-600">載入中...</span>
              </div>
            ) : memberData ? (
              <>
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-15 h-15 ${AI_COLORS.bg} rounded-full flex items-center justify-center`}>
                    <User size={32} className={AI_COLORS.text} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {memberData.member_details.nick_name || '未設定'}
                    </h3>
                    <p className="text-gray-600 text-sm mb-1">
                      {memberData.member_details.email || '未設定'}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {memberData.member_card.client_info.name || '會員'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsRedeemModalOpen(true)}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-medium transition-colors hover:opacity-90"
                    >
                      兌換
                    </button>
                    <button
                      onClick={handleEditClick}
                      className={`px-4 py-2 ${AI_COLORS.button} rounded-lg text-sm font-medium transition-colors hover:opacity-90`}
                    >
                      編輯
                    </button>
                  </div>
                </div>

                {/* User Stats */}
                <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                  <div className="text-center">
                    <div className={`text-lg font-bold ${AI_COLORS.text} mb-1`}>
                      {memberData.member_card.card_id}
                    </div>
                    <div className="text-xs text-gray-500">Card ID</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600 mb-1">
                      {memberData.member_card.exp.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">經驗值</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600 mb-1">
                      {memberData.member_card.points.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">積分</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-yellow-600 mb-1">
                      {memberData.member_card.coins.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">{COIN_LABEL}</div>
                  </div>
                </div>

                {/* Member Status - 目前計畫 */}
                {memberData.member_status?.success && memberData.member_status.data && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <h4 className="text-sm font-semibold text-gray-900 mb-4">目前計畫</h4>

                    {/* 訂閱方案資訊 */}
                    <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-4 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Star size={20} className="text-orange-500" />
                          <span className="font-semibold text-gray-900">
                            {memberData.member_status.data.subscription.plan}
                          </span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          memberData.member_status.data.subscription.auto_renew
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {memberData.member_status.data.subscription.auto_renew ? '自動續訂' : '手動續訂'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-600 mb-1">剩餘天數</p>
                          <p className="font-semibold text-gray-900">
                            {memberData.member_status.data.subscription.days_left} 天
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 mb-1">到期日</p>
                          <p className="font-semibold text-gray-900">
                            {new Date(memberData.member_status.data.subscription.end_at).toLocaleDateString('zh-TW')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 待處理變更 */}
                    {memberData.member_status.data.pending_change.has_pending && (
                      <div className="bg-yellow-50 rounded-xl p-4 mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock size={20} className="text-yellow-600" />
                          <span className="font-semibold text-gray-900">待處理變更</span>
                        </div>
                        <p className="text-sm text-gray-700">
                          將於 {memberData.member_status.data.pending_change.effective_at ?
                            new Date(memberData.member_status.data.pending_change.effective_at).toLocaleDateString('zh-TW') :
                            '未知日期'} 變更為 {memberData.member_status.data.pending_change.target_plan || '未指定方案'}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 儲值入口 */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">帳戶儲值</h4>
                  <button
                    onClick={openRechargeModal}
                    className="w-full bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4 hover:border-amber-300 hover:shadow-sm transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                        <Wallet size={20} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">儲值方案</p>
                        <p className="text-xs text-gray-500 mt-0.5">購買儲值方案，獲得積分、{COIN_LABEL}等獎勵</p>
                      </div>
                      <ChevronRight size={18} className="text-gray-300 group-hover:text-amber-500 transition-colors" />
                    </div>
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">無法載入會員資料</p>
                <button
                  onClick={loadMemberData}
                  className="mt-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  重新載入
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 功能專區 */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">功能選單</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <FeatureCard
              icon={Calendar}
              title="參與活動"
              onClick={() => setIsMyOrdersModalOpen(true)}
              isComingSoon={false}
            />
            <FeatureCard
              icon={Ticket}
              title="票券中心"
              path="/client/tickets"
              isComingSoon={false}
            />
            <FeatureCard
              icon={CreditCard}
              title="抽卡紀錄"
              path="/client/draw-history"
              isComingSoon={false}
            />
            <FeatureCard
              icon={MessageSquare}
              title="對話視窗"
              path="/client/chat"
              isComingSoon={false}
            />
            <FeatureCard
              icon={BookOpen}
              title="閱讀紀錄"
              path="/client/articles"
              isComingSoon={true}
            />
          </div>
        </div>
      </div>

      {/* 我的訂單彈窗 */}
      <MyOrdersModal
        isOpen={isMyOrdersModalOpen}
        onClose={() => setIsMyOrdersModalOpen(false)}
      />

      {/* 編輯會員資料彈窗 */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* 彈窗標題 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">編輯個人資料</h3>
              <button
                onClick={handleCloseEditModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* 表單內容 */}
            <div className="p-6 space-y-4">
              {/* 暱稱 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  暱稱
                </label>
                <input
                  type="text"
                  value={editForm.nick_name || ''}
                  onChange={(e) => handleInputChange('nick_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="請輸入暱稱"
                />
              </div>

              {/* 電子郵件 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  電子郵件
                </label>
                <input
                  type="email"
                  value={editForm.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="請輸入電子郵件"
                />
              </div>

              {/* 電話 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  電話
                </label>
                <input
                  type="tel"
                  value={editForm.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="請輸入電話號碼"
                />
              </div>

              {/* 生日 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  生日
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {/* 年份選擇 */}
                  <select
                    value={editForm.birthday ? editForm.birthday.split('-')[0] : ''}
                    onChange={(e) => {
                      const year = e.target.value;
                      const currentDate = editForm.birthday || '';
                      const month = currentDate ? currentDate.split('-')[1] || '01' : '01';
                      const day = currentDate ? currentDate.split('-')[2] || '01' : '01';
                      const newDate = year ? `${year}-${month}-${day}` : '';
                      handleInputChange('birthday', newDate);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">年</option>
                    {Array.from({ length: 80 }, (_, i) => {
                      const year = new Date().getFullYear() - i;
                      return (
                        <option key={year} value={year}>
                          {year}年
                        </option>
                      );
                    })}
                  </select>

                  {/* 月份選擇 */}
                  <select
                    value={editForm.birthday ? editForm.birthday.split('-')[1] : ''}
                    onChange={(e) => {
                      const month = e.target.value;
                      const currentDate = editForm.birthday || '';
                      const year = currentDate ? currentDate.split('-')[0] || '' : '';
                      const day = currentDate ? currentDate.split('-')[2] || '01' : '01';
                      const newDate = year && month ? `${year}-${month}-${day}` : '';
                      handleInputChange('birthday', newDate);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">月</option>
                    {Array.from({ length: 12 }, (_, i) => {
                      const month = String(i + 1).padStart(2, '0');
                      return (
                        <option key={month} value={month}>
                          {month}月
                        </option>
                      );
                    })}
                  </select>

                  {/* 日期選擇 */}
                  <select
                    value={editForm.birthday ? editForm.birthday.split('-')[2] : ''}
                    onChange={(e) => {
                      const day = e.target.value;
                      const currentDate = editForm.birthday || '';
                      const year = currentDate ? currentDate.split('-')[0] || '' : '';
                      const month = currentDate ? currentDate.split('-')[1] || '' : '';
                      const newDate = year && month && day ? `${year}-${month}-${day}` : '';
                      handleInputChange('birthday', newDate);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">日</option>
                    {(() => {
                      const currentDate = editForm.birthday || '';
                      const year = currentDate ? parseInt(currentDate.split('-')[0]) : new Date().getFullYear();
                      const month = currentDate ? parseInt(currentDate.split('-')[1]) : 1;
                      const daysInMonth = new Date(year, month, 0).getDate();
                      return Array.from({ length: daysInMonth }, (_, i) => {
                        const day = String(i + 1).padStart(2, '0');
                        return (
                          <option key={day} value={day}>
                            {day}日
                          </option>
                        );
                      });
                    })()}
                  </select>
                </div>

                {/* 快速選擇按鈕 */}
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date();
                      const todayStr = today.toISOString().split('T')[0];
                      handleInputChange('birthday', todayStr);
                    }}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    今天
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date();
                      today.setFullYear(today.getFullYear() - 20);
                      const dateStr = today.toISOString().split('T')[0];
                      handleInputChange('birthday', dateStr);
                    }}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    20歲
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date();
                      today.setFullYear(today.getFullYear() - 30);
                      const dateStr = today.toISOString().split('T')[0];
                      handleInputChange('birthday', dateStr);
                    }}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    30歲
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date();
                      today.setFullYear(today.getFullYear() - 40);
                      const dateStr = today.toISOString().split('T')[0];
                      handleInputChange('birthday', dateStr);
                    }}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    40歲
                  </button>
                </div>

                {/* 顯示當前選擇的日期 */}
                {editForm.birthday && (
                  <div className="mt-2 text-sm text-gray-600">
                    選擇的日期：{editForm.birthday}
                  </div>
                )}
              </div>

              {/* 性別 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  性別
                </label>
                <select
                  value={editForm.gender || 'male'}
                  onChange={(e) => handleInputChange('gender', e.target.value as 'male' | 'female' | 'other')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="male">男性</option>
                  <option value="female">女性</option>
                  <option value="other">其他</option>
                </select>
              </div>

              {/* 地址 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  地址
                </label>
                <textarea
                  value={editForm.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows={3}
                  placeholder="請輸入地址"
                />
              </div>
            </div>

            {/* 按鈕區域 */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={handleCloseEditModal}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                disabled={isUpdating}
              >
                取消
              </button>
              <button
                onClick={handleUpdateMember}
                disabled={isUpdating}
                className={`px-6 py-2 ${AI_COLORS.button} rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isUpdating ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    更新中...
                  </div>
                ) : (
                  '更新資料'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 兌換碼彈窗 */}
      {isRedeemModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">兌換點數或功能</h3>
              <button
                onClick={() => {
                  setIsRedeemModalOpen(false);
                  setRedeemCode('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              請輸入您的兌換碼以獲得額外的點數、代幣或解鎖新功能。
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                兌換碼
              </label>
              <input
                type="text"
                value={redeemCode}
                onChange={(e) => setRedeemCode(e.target.value)}
                placeholder="請輸入您的兌換碼"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleRedeem();
                  }
                }}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsRedeemModalOpen(false);
                  setRedeemCode('');
                }}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
              >
                取消
              </button>
              <button
                onClick={handleRedeem}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white rounded-lg transition-colors font-medium"
              >
                確認兌換
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 儲值 Modal */}
      {showRechargeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => !selectedRechargeItem && setShowRechargeModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
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
                <div className="p-5">
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
                      {formatRechargePrice(getItemPrice(selectedRechargeItem))}
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
                <div className="p-5 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-18 bg-gray-100 rounded-xl animate-pulse"></div>
                  ))}
                </div>
              ) : rechargeItems.length > 0 ? (
                <div className="p-5 space-y-2.5">
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
                          <span className="text-base font-bold text-amber-600">{formatRechargePrice(price)}</span>
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

export default UserDashboard;
