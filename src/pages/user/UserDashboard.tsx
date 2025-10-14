import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Ticket,
  CreditCard,
  BookOpen,
  ChevronRight,
  User,
  Edit3,
  X
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { getEventSkuList, createEventJoinUrl, ItemEventItem, getMemberComplete, updateMemberDetails, type MemberComplete, type MemberDetailsUpdateData } from '../../config/api';
import { AI_COLORS } from '../../constants/colors';


// 專區卡片組件
const FeatureCard: React.FC<{
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  path: string;
  isMobile: boolean;
  isComingSoon?: boolean;
}> = ({ icon: Icon, title, description, path, isMobile, isComingSoon = true }) => (
  <div
    className={`block bg-white rounded-xl shadow-sm transition-all duration-200 border border-gray-100 ${
      isMobile ? 'p-4' : 'p-5'
    } ${isComingSoon ? 'opacity-60 cursor-not-allowed pointer-events-none' : 'hover:shadow-md'}`}
  >
    <div className="flex items-start gap-4">
      <div className={`w-12 h-12 ${AI_COLORS.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <Icon size={24} className={AI_COLORS.text} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <h3 className={`font-semibold text-gray-900 ${isMobile ? 'text-base' : 'text-lg'}`}>
            {title}
          </h3>
          {isComingSoon && (
            <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
              即將推出
            </span>
          )}
        </div>
        <p className={`text-gray-600 ${isMobile ? 'text-sm' : 'text-base'}`}>
          {description}
        </p>
      </div>
      <ChevronRight size={20} className="text-gray-400 flex-shrink-0 self-center" />
    </div>
  </div>
);

// 會員資料組件
const MemberProfile: React.FC<{
  memberData: MemberComplete | null;
  isLoading: boolean;
  onEditClick: () => void;
  isMobile: boolean;
}> = ({ memberData, isLoading, onEditClick, isMobile }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="animate-pulse">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="text-center">
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!memberData) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 text-center">
        <div className="text-gray-400 mb-2">
          <User size={48} />
        </div>
        <p className="text-gray-500">無法載入會員資料</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
      {/* 會員基本資料 */}
      <div className="flex items-center gap-4 mb-5">
        <div className={`w-16 h-16 ${AI_COLORS.bg} rounded-full flex items-center justify-center`}>
          <User size={32} className={AI_COLORS.text} />
        </div>
        <div className="flex-1">
          <h3 className={`font-bold text-gray-900 ${isMobile ? 'text-lg' : 'text-xl'} mb-1`}>
            {memberData.member_details.nick_name || '未設定'}
          </h3>
          <p className="text-gray-600 text-sm mb-1">
            {memberData.member_details.email || '未設定'}
          </p>
          <span className="inline-block px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
            會員
          </span>
        </div>
        <button
          onClick={onEditClick}
          className={`px-4 py-2 ${AI_COLORS.button} text-white rounded-lg hover:opacity-90 transition-opacity`}
        >
          編輯
        </button>
      </div>

      {/* 會員統計資料 - 簡化版 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-xl font-bold text-blue-600 mb-1">
            {memberData.member_card.exp || 0}
          </div>
          <div className="text-sm text-gray-500">經驗值</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-blue-600 mb-1">
            {memberData.member_card.points || 0}
          </div>
          <div className="text-sm text-gray-500">積分</div>
        </div>
        <div className="text-center">
          <div className={`text-xl font-bold ${AI_COLORS.text} mb-1`}>
            {memberData.member_card.coins || 0}
          </div>
          <div className="text-sm text-gray-500">代幣</div>
        </div>
      </div>
    </div>
  );
};

// 編輯會員資料彈窗
const EditMemberModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  memberData: MemberComplete | null;
  onUpdate: (data: MemberDetailsUpdateData) => Promise<void>;
  isUpdating: boolean;
}> = ({ isOpen, onClose, memberData, onUpdate, isUpdating }) => {
  const [formData, setFormData] = useState<MemberDetailsUpdateData>({
    nick_name: '',
    email: '',
    phone: '',
    birthday: '',
    gender: 'male',
    address: ''
  });

  // 當彈窗開啟時，初始化表單資料
  useEffect(() => {
    if (isOpen && memberData) {
      setFormData({
        nick_name: memberData.member_details.nick_name || '',
        email: memberData.member_details.email || '',
        phone: memberData.member_details.phone || '',
        birthday: memberData.member_details.birthday || '',
        gender: memberData.member_details.gender || 'male',
        address: memberData.member_details.address || ''
      });
    }
  }, [isOpen, memberData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdate(formData);
  };

  const handleInputChange = (field: keyof MemberDetailsUpdateData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">編輯會員資料</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              暱稱
            </label>
            <input
              type="text"
              value={formData.nick_name}
              onChange={(e) => handleInputChange('nick_name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="請輸入暱稱"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              電子郵件
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="請輸入電子郵件"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              電話
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="請輸入電話號碼"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              生日
            </label>
            <input
              type="date"
              value={formData.birthday}
              onChange={(e) => handleInputChange('birthday', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              性別
            </label>
            <select
              value={formData.gender}
              onChange={(e) => handleInputChange('gender', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="male">男性</option>
              <option value="female">女性</option>
              <option value="other">其他</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              地址
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              rows={3}
              placeholder="請輸入地址"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className={`flex-1 px-4 py-2 ${AI_COLORS.button} text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isUpdating ? '更新中...' : '更新資料'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 活動預覽組件
const EventPreview: React.FC<{ events: ItemEventItem[]; isMobile: boolean }> = ({ events, isMobile }) => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

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

  // 複製報名連結
  const handleCopyJoinLink = async (event: ItemEventItem) => {
    try {
      if (!event.sku) {
        showError('無法複製連結', '此活動尚未設定 SKU，無法生成報名連結');
        return;
      }

      const joinUrl = createEventJoinUrl(event.sku);
      
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(joinUrl);
        showSuccess('連結已複製', '報名連結已複製到剪貼簿');
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = joinUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
          showSuccess('連結已複製', '報名連結已複製到剪貼簿');
        } catch (err) {
          showError('複製失敗', '無法自動複製，請手動複製連結');
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (error: any) {
      showError('複製失敗', error.message || '複製過程中發生錯誤');
    }
  };

  // 直接跳轉到報名頁面
  const handleJoinEvent = (event: ItemEventItem) => {
    if (!event.sku) {
      showError('無法報名', '此活動尚未設定 SKU，無法進行報名');
      return;
    }
    
    const joinUrl = createEventJoinUrl(event.sku);
    navigate(joinUrl);
  };

  // 只顯示前3個活動作為預覽
  const previewEvents = events.slice(0, 3);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">熱門活動</h3>
        <a 
          href="/client/event" 
          className={`${AI_COLORS.text} hover:${AI_COLORS.textDark} text-sm font-medium`}
        >
          查看全部 →
        </a>
      </div>
      
      {previewEvents.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <i className="ri-calendar-line text-3xl"></i>
          </div>
          <p className="text-gray-500 text-sm">暫無活動</p>
        </div>
      ) : (
        <div className="space-y-3">
          {previewEvents.map((event) => (
            <div key={event.id} className="border border-gray-100 rounded-lg p-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-3">
                {event.main_image && (
                  <img
                    src={event.main_image.url}
                    alt={event.name}
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 text-sm line-clamp-1 mb-1">{event.name}</h4>
                  <div className="space-y-1 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <i className="ri-calendar-line"></i>
                      <span>{formatDateTime(event.start_time)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <i className="ri-money-dollar-circle-line"></i>
                      <span>NT$ {event.base_price}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleJoinEvent(event)}
                      disabled={event.event_status !== 'registration_open'}
                      className={`px-3 py-1 ${AI_COLORS.button} text-xs rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors`}
                    >
                      {event.event_status === 'registration_open' ? '報名' : '截止'}
                    </button>
                    <button
                      onClick={() => handleCopyJoinLink(event)}
                      className="px-2 py-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors text-xs"
                      title="複製報名連結"
                    >
                      <i className="ri-link"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// 使用者主頁面
const UserDashboard: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [events, setEvents] = useState<ItemEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { showError, showToast } = useToast();
  
  // 會員資料狀態
  const [memberData, setMemberData] = useState<MemberComplete | null>(null);
  const [isMemberLoading, setIsMemberLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // 檢測設備類型
  React.useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // 載入會員資料
  const loadMemberData = async () => {
    try {
      setIsMemberLoading(true);
      const response = await getMemberComplete();
      if (response.success) {
        setMemberData(response.data);
      }
    } catch (error) {
      console.error('載入會員資料失敗:', error);
      showToast({ type: 'error', title: '載入會員資料失敗' });
    } finally {
      setIsMemberLoading(false);
    }
  };

  // 更新會員資料
  const handleUpdateMember = async (data: MemberDetailsUpdateData) => {
    try {
      setIsUpdating(true);
      const response = await updateMemberDetails(data);
      if (response.success) {
        showToast({ type: 'success', title: '會員資料更新成功' });
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


  // 載入活動列表
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        const response = await getEventSkuList();
        if (response.success) {
          const eventsData = response.data.events;
          if (Array.isArray(eventsData)) {
            setEvents(eventsData);
          } else {
            setEvents([]);
          }
        } else {
          console.warn('載入活動失敗:', response.message);
          setEvents([]);
        }
      } catch (error: any) {
        console.error('載入活動資料失敗:', error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  // 載入會員資料
  useEffect(() => {
    loadMemberData();
  }, []);


  const features = [
    {
      icon: Calendar,
      title: '參與活動',
      description: '查看已報名的活動和課程',
      path: '/client/event'
    },
    {
      icon: Ticket,
      title: '票劵中心',
      description: '管理您的票劵和優惠券',
      path: '/client/tickets'
    },
    {
      icon: CreditCard,
      title: '抽卡紀錄',
      description: '查看抽卡歷史和獲得獎勵',
      path: '/client/cards'
    },
    {
      icon: BookOpen,
      title: '閱讀紀錄',
      description: '瀏覽文章閱讀歷史和收藏',
      path: '/client/articles'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* 主內容區域 */}
      <div className={`${isMobile ? 'p-4' : 'p-6'}`}>
        {/* 會員資料區域 */}
        <div className="mb-6">
          <MemberProfile
            memberData={memberData}
            isLoading={isMemberLoading}
            onEditClick={() => setIsEditModalOpen(true)}
            isMobile={isMobile}
          />
        </div>

        {/* 功能專區 */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">功能選單</h2>
          {isMobile ? (
            // 手機版：單列布局
            <div className="space-y-4">
              {features.map((feature) => (
                <FeatureCard
                  key={feature.path}
                  {...feature}
                  isMobile={isMobile}
                />
              ))}
            </div>
          ) : (
            // 電腦版：網格布局
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature) => (
                <FeatureCard
                  key={feature.path}
                  {...feature}
                  isMobile={isMobile}
                />
              ))}
            </div>
          )}
        </div>


        {/* 編輯會員資料彈窗 */}
        <EditMemberModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          memberData={memberData}
          onUpdate={handleUpdateMember}
          isUpdating={isUpdating}
        />
      </div>
    </div>
  );
};

export default UserDashboard; 