import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import { useConfirm } from '../../hooks/useConfirm';
import ConfirmDialog from '../../components/ConfirmDialog';
import { getEventJoinInfo, submitEventRegistration, EventJoinInfo, EventRegistrationData } from '../../config/api';
import { AI_COLORS } from '../../constants/colors';

const EventJoin: React.FC = () => {
  const { sku } = useParams<{ sku: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { confirm, isOpen, options, handleConfirm, handleCancel } = useConfirm();

  // 狀態管理
  const [eventInfo, setEventInfo] = useState<EventJoinInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<EventRegistrationData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    dietary_restrictions: '',
    special_requirements: '',
    agree_terms: false,
    agree_privacy: false
  });

  // 載入活動資訊
  useEffect(() => {
    if (sku) {
      loadEventInfo();
    }
  }, [sku]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadEventInfo = async () => {
    try {
      setLoading(true);
      if (!sku) {
        showError('參數錯誤', '缺少活動 SKU 參數');
        return;
      }
      
      console.log('🔍 正在載入活動資訊，SKU:', sku);
      console.log('🔍 API 端點:', `${import.meta.env.VITE_API_BASE || 'http://localhost:8000'}/itemevent/api/events_sku/${sku}/`);
      
      const response = await getEventJoinInfo(sku);
      console.log('🔍 API 回應:', response);
      
      if (response.success) {
        setEventInfo(response.data);
        console.log('✅ 活動資訊載入成功:', response.data);
      } else {
        console.error('❌ API 回應失敗:', response.message);
        showError('載入失敗', response.message);
      }
    } catch (error: any) {
      console.error('❌ 載入活動資訊時發生錯誤:', error);
      showError('載入失敗', error.message || '無法載入活動資訊');
    } finally {
      setLoading(false);
    }
  };

  // 處理表單輸入變更
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // 處理表單提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 表單驗證
    if (!formData.name.trim()) {
      showError('請填寫姓名', '姓名為必填欄位');
      return;
    }
    
    if (!formData.email.trim()) {
      showError('請填寫電子郵件', '電子郵件為必填欄位');
      return;
    }
    
    if (!formData.phone.trim()) {
      showError('請填寫聯絡電話', '聯絡電話為必填欄位');
      return;
    }
    
    if (!formData.agree_terms) {
      showError('請同意活動條款', '必須同意活動條款才能報名');
      return;
    }
    
    if (!formData.agree_privacy) {
      showError('請同意隱私政策', '必須同意隱私政策才能報名');
      return;
    }

    // 確認報名
    const confirmed = await confirm({
      title: '確認報名',
      message: `確定要報名參加「${eventInfo?.name}」嗎？報名成功後將無法取消。`,
      confirmText: '確認報名',
      cancelText: '取消',
      type: 'info'
    });

    if (!confirmed) return;

    try {
      setSubmitting(true);
      
      if (!sku) {
        showError('參數錯誤', '缺少活動 SKU 參數');
        return;
      }
      
      const response = await submitEventRegistration(sku, formData);
      if (response.success) {
        showSuccess('報名成功', '您已成功報名參加活動！');
        // 跳轉到報名成功頁面或顯示成功訊息
        
        // 清空表單
        setFormData({
          name: '',
          email: '',
          phone: '',
          company: '',
          position: '',
          dietary_restrictions: '',
          special_requirements: '',
          agree_terms: false,
          agree_privacy: false
        });
      } else {
        showError('報名失敗', response.message);
      }
      
    } catch (error: any) {
      showError('報名失敗', error.message || '報名過程中發生錯誤');
    } finally {
      setSubmitting(false);
    }
  };

  // 格式化時間
  const formatDateTime = (dateTime: string) => {
    try {
      return new Date(dateTime).toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateTime;
    }
  };

  // 載入中狀態
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${AI_COLORS.border} mx-auto mb-4`}></div>
          <p className="text-gray-600">載入活動資訊中...</p>
        </div>
      </div>
    );
  }

  // 活動不存在或已結束
  if (!eventInfo || eventInfo.event_status !== 'registration_open') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-gray-400 mb-4">
            <i className="ri-calendar-line text-6xl"></i>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {!eventInfo ? '活動不存在' : '報名已截止'}
          </h3>
          <p className="text-gray-500 mb-6">
            {!eventInfo 
              ? '找不到指定的活動，請檢查連結是否正確。'
              : '此活動的報名時間已結束，無法再報名參加。'
            }
          </p>
          <button
            onClick={() => navigate('/')}
            className={`inline-flex items-center gap-2 px-4 py-2 ${AI_COLORS.button} rounded-xl transition-colors`}
          >
            <i className="ri-home-line"></i>
            返回首頁
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 頁面標題 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">活動報名</h1>
          <p className="text-gray-600">填寫以下資訊完成活動報名</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 活動資訊 */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">活動資訊</h2>
              
              {/* 活動主圖 */}
              {eventInfo.main_image && (
                <div className="mb-4">
                  <img
                    src={eventInfo.main_image.url}
                    alt={eventInfo.name}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}
              
              {/* 活動詳情 */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{eventInfo.name}</h3>
                  <p className="text-gray-600 text-sm mt-1">{eventInfo.description}</p>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-500">
                    <i className="ri-calendar-line"></i>
                    <span>{formatDateTime(eventInfo.start_time)} - {formatDateTime(eventInfo.end_time)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <i className="ri-map-pin-line"></i>
                    <span>{eventInfo.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <i className="ri-money-dollar-circle-line"></i>
                    <span>NT$ {eventInfo.base_price}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <i className="ri-user-line"></i>
                    <span>{eventInfo.min_participants} - {eventInfo.max_participants} 人</span>
                  </div>
                </div>
                
                                 {/* 活動標籤 */}
                 {eventInfo.item_tags && eventInfo.item_tags.length > 0 && (
                   <div className="flex flex-wrap gap-2">
                     {eventInfo.item_tags.map((tag) => (
                       <span key={tag.id} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                         {tag.name}
                       </span>
                     ))}
                   </div>
                 )}
                
                {/* 活動狀態 */}
                <div className="pt-3 border-t">
                  <span className={`inline-block px-3 py-1 text-sm rounded-full ${
                    eventInfo.event_status === 'registration_open' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {eventInfo.event_status_display}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 報名表單 */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">報名表單</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 基本資訊 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">基本資訊</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    姓名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="請輸入您的姓名"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    電子郵件 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="請輸入您的電子郵件"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    聯絡電話 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="請輸入您的聯絡電話"
                    required
                  />
                </div>
              </div>
              
              {/* 公司資訊 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">公司資訊（選填）</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">公司名稱</label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="請輸入您的公司名稱"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">職稱</label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="請輸入您的職稱"
                  />
                </div>
              </div>
              
              {/* 特殊需求 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">特殊需求（選填）</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">飲食限制</label>
                  <input
                    type="text"
                    name="dietary_restrictions"
                    value={formData.dietary_restrictions}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="例如：素食、過敏原等"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">其他需求</label>
                  <textarea
                    name="special_requirements"
                    value={formData.special_requirements}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="請描述您的其他特殊需求"
                  />
                </div>
              </div>
              
              {/* 同意條款 */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="agree_terms"
                    name="agree_terms"
                    checked={formData.agree_terms}
                    onChange={handleInputChange}
                    className="accent-orange-600 w-4 h-4 mt-1"
                    required
                  />
                  <label htmlFor="agree_terms" className="text-sm text-gray-700">
                    我同意 <a href="#" className={`${AI_COLORS.text} hover:${AI_COLORS.textDark} underline`}>活動條款</a> 和相關規定
                  </label>
                </div>
                
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="agree_privacy"
                    name="agree_privacy"
                    checked={formData.agree_privacy}
                    onChange={handleInputChange}
                    className="accent-orange-600 w-4 h-4 mt-1"
                    required
                  />
                  <label htmlFor="agree_privacy" className="text-sm text-gray-700">
                    我同意 <a href="#" className={`${AI_COLORS.text} hover:${AI_COLORS.textDark} underline`}>隱私政策</a> 和個人資料處理方式
                  </label>
                </div>
              </div>
              
              {/* 提交按鈕 */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full px-6 py-3 ${AI_COLORS.button} rounded-xl disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors`}
                >
                  {submitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      提交中...
                    </div>
                  ) : (
                    '確認報名'
                  )}
                </button>
              </div>
            </form>
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
    </div>
  );
};

export default EventJoin;
