import React, { useState, useEffect, useState as useReactState } from 'react';
import { Calendar, Clock, ShoppingCart, CreditCard, Monitor, ChevronRight, User, Star, Coins, Zap, BarChart3, Edit3, X, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import NoPermissionDialog from '../components/NoPermissionDialog';
import { handlePermissionRedeem } from '../utils/permissionUtils';
import type { LucideIcon } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { AI_COLORS } from '../constants/colors';
import { getMemberComplete, updateMemberDetails, type MemberComplete, type MemberDetailsUpdateData } from '../config/api';
import { useToast } from '../hooks/useToast';

interface MoreItem {
  id: string;
  title: string;
  description?: string;
  icon: LucideIcon;
  type: 'navigation';
  onPress?: () => void;
}

const More: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { featureFlag, checkAuth } = useAuth();
  const [showNoPermission, setShowNoPermission] = useState(false);
  
  // 會員資料狀態
  const [memberData, setMemberData] = useState<MemberComplete | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  
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

  // 組件載入時取得會員資料
  useEffect(() => {
    loadMemberData();
  }, []);


  const moreFunctions: MoreItem[] = [
    {
      id: '1',
      title: '私域社群',
      description: '管理LINE OA與私域社群工具',
      icon: Users,
      type: 'navigation',
      onPress: () => navigate('/provider/private-domain'),
    },
    {
      id: '2',
      title: '活動設定',
      description: '管理活動和促銷設定',
      icon: Calendar,
      type: 'navigation',
      onPress: () => navigate('/provider/activity-settings'),
    },
    {
      id: '3',
      title: '預約設定',
      description: '配置預約系統和時間管理',
      icon: Clock,
      type: 'navigation',
      onPress: () => console.log('Booking Settings - Coming Soon'),
    },
    {
      id: '4',
      title: '商城設定',
      description: '管理商品和購物車設定',
      icon: ShoppingCart,
      type: 'navigation',
      onPress: () => console.log('Shop Settings - Coming Soon'),
    },
    {
      id: '5',
      title: '金流設定',
      description: '配置支付和財務設定',
      icon: CreditCard,
      type: 'navigation',
      onPress: () => console.log('Payment Settings - Coming Soon'),
    },
    {
      id: '6',
      title: '設備設定',
      description: '管理設備和硬體設定',
      icon: Monitor,
      type: 'navigation',
      onPress: () => console.log('Device Settings - Coming Soon'),
    },
  ];

  const renderMoreItem = (item: MoreItem) => {
    // 私域社群(id:1) 與 活動設定(id:2) 皆顯示為可點擊；
    // 活動設定真正可用性由 featureFlag.event_enabled 控制，未啟用則點擊跳出彈窗
    const isActivity = item.id === '2';
    const rawEventEnabled = (featureFlag as any)?.event_enabled;
    const eventEnabled = rawEventEnabled === 1 || rawEventEnabled === '1' || rawEventEnabled === true || rawEventEnabled === 'true';
    const clickable = item.id === '1' || item.id === '2';
    const isDisabled = !clickable; // 其他項目維持不可用
    
    return (
      <button
        key={item.id}
        className={`flex items-center p-5 border-b border-gray-100 w-full text-left transition-colors ${
          isDisabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:bg-gray-50'
        }`}
        onClick={
          isDisabled
            ? undefined
            : () => {
                if (isActivity && !eventEnabled) {
                  setShowNoPermission(true);
                  return;
                }
                item.onPress && item.onPress();
              }
        }
        disabled={isDisabled}
      >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
          isDisabled ? 'bg-gray-200' : AI_COLORS.bg
        }`}>
          <item.icon size={24} className={isDisabled ? 'text-gray-400' : AI_COLORS.text} />
        </div>
        
        <div className="flex-1">
          <h3 className={`font-semibold mb-1 ${isDisabled ? 'text-gray-400' : 'text-gray-900'}`}>
            {item.title}
            {/* 其他項標示即將推出；活動設定維持高亮且不加未啟用提示 */}
            {isDisabled && <span className="text-xs text-gray-400 ml-2">(即將推出)</span>}
          </h3>
          {item.description && (
            <p className={`text-sm leading-relaxed ${isDisabled ? 'text-gray-400' : 'text-gray-600'}`}>
              {item.description}
            </p>
          )}
        </div>
        
        <ChevronRight size={20} className={isDisabled ? 'text-gray-300' : 'text-gray-400'} />
      </button>
    );
  };

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
                    <div className="text-xs text-gray-500">金幣</div>
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

                    {/* 餘額資訊 */}
                    <div className="bg-blue-50 rounded-xl p-4 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Coins size={20} className="text-blue-500" />
                          <span className="font-semibold text-gray-900">Token 餘額</span>
                        </div>
                        <button
                          onClick={() => setIsUsageModalOpen(true)}
                          className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors"
                          title="查看使用記錄"
                        >
                          <BarChart3 size={18} className="text-blue-600" />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-gray-600 mb-1">訂閱</p>
                          <p className="font-semibold text-gray-900">
                            {memberData.member_status.data.balance.subscription}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 mb-1">加購</p>
                          <p className="font-semibold text-gray-900">
                            {memberData.member_status.data.balance.addon}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 mb-1">總剩餘</p>
                          <p className="font-bold text-blue-600">
                            {memberData.member_status.data.balance.total_remaining}
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

        {/* More Functions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">其他功能</h2>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {moreFunctions.map(renderMoreItem)}
          </div>
        </div>
      </div>


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

      {/* 使用記錄彈窗 */}
      {isUsageModalOpen && memberData?.member_status?.data?.recent_usage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* 彈窗標題 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center gap-2">
                <BarChart3 size={24} className="text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">使用記錄</h3>
              </div>
              <button
                onClick={() => setIsUsageModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* 使用記錄列表 */}
            <div className="p-6">
              {memberData.member_status.data.recent_usage.length > 0 ? (
                <div className="space-y-2">
                  {memberData.member_status.data.recent_usage.map((usage, index) => (
                    <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-xs text-gray-500 truncate">
                          {new Date(usage.created_at).toLocaleString('zh-TW', { 
                            year: 'numeric',
                            month: '2-digit', 
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <span className="font-medium text-gray-900 capitalize">{usage.kind}</span>
                      </div>
                      <span className="font-semibold text-blue-600 ml-3">{usage.tokens} tokens</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 size={48} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">暫無使用記錄</p>
                </div>
              )}
            </div>

            {/* 關閉按鈕 */}
            <div className="p-6 border-t border-gray-200 sticky bottom-0 bg-white">
              <button
                onClick={() => setIsUsageModalOpen(false)}
                className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 權限不足彈窗：活動設定未啟用時顯示 */}
      <NoPermissionDialog
        isOpen={showNoPermission}
        onClose={() => setShowNoPermission(false)}
        onSubmitSerial={async (s) => {
          await handlePermissionRedeem(s, {
            checkAuth,
            onSuccess: () => setShowNoPermission(false)
          });
        }}
        title="沒有使用權限"
        message="活動功能尚未啟用，請輸入授權序號或關閉。"
      />

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
    </div>
  );
};

export default More;