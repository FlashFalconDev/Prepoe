import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Search
} from 'lucide-react';
import { AI_COLORS } from '../../constants/colors';
import { 
  getBusinessCardApprove, 
  BusinessCardListItem, 
  BusinessCardApproveResponse 
} from '../../config/api';

// 導師卡片組件
const MentorCard: React.FC<{
  businessCard: BusinessCardListItem;
  onClick: () => void;
  isMobile: boolean;
}> = ({ businessCard, onClick, isMobile }) => (
  <div
    onClick={onClick}
    className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-100 ${
      isMobile ? 'p-4' : 'p-6'
    }`}
  >
    <div className="flex items-start gap-4">
      <div className="relative">
        <img
          src={businessCard.data.profile.profile_picture_url || ''}
          alt={businessCard.data.profile.name}
          className="w-16 h-16 rounded-full object-cover"
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between mb-2">
          <h3 className={`font-semibold text-gray-900 ${isMobile ? 'text-base' : 'text-lg'}`}>
            {businessCard.data.profile.name}
          </h3>
        </div>

        {/* 清掉大畫面的詳細介紹，只保留前三個標籤 */}
        <div className="flex flex-wrap gap-2">
          {businessCard.data.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className={`px-2 py-1 text-xs rounded-full ${
                tag.is_visible 
                  ? `${AI_COLORS.bgLight} ${AI_COLORS.textDark}` 
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {tag.text}
            </span>
          ))}
        </div>
        
      </div>
    </div>
  </div>
);

const UserMentors: React.FC = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 檢測設備類型
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // 業務卡片相關狀態
  const [businessCards, setBusinessCards] = useState<BusinessCardListItem[]>([]);
  const [businessCardsLoading, setBusinessCardsLoading] = useState(false);
  const [businessCardsError, setBusinessCardsError] = useState<string | null>(null);

  // 載入業務卡片數據
  useEffect(() => {
    const loadBusinessCards = async () => {
      setBusinessCardsLoading(true);
      setBusinessCardsError(null);
      
      try {
        const response: BusinessCardApproveResponse = await getBusinessCardApprove();
        console.log('API 響應:', response);
        
        // 檢查響應是否成功
        if (response.success) {
          let profileList: BusinessCardListItem[] = [];
          
          // 嘗試不同的數據結構
          if (response.data?.profile_list && Array.isArray(response.data.profile_list)) {
            profileList = response.data.profile_list;
            console.log('使用 data.profile_list:', profileList);
          } else if (response.profile_list && Array.isArray(response.profile_list)) {
            profileList = response.profile_list;
            console.log('使用 profile_list:', profileList);
          } else if (Array.isArray(response.data)) {
            profileList = response.data;
            console.log('使用 data 數組:', profileList);
          } else if (Array.isArray(response)) {
            profileList = response;
            console.log('響應本身就是數組:', profileList);
          } else {
            console.log('響應結構:', {
              success: response.success,
              message: response.message,
              data: response.data,
              profile_list: response.profile_list,
              keys: Object.keys(response)
            });
            setBusinessCardsError('API 響應結構不符合預期');
            return;
          }
          
          if (profileList.length > 0) {
            setBusinessCards(profileList);
            console.log('成功載入', profileList.length, '個導師資料');
          } else {
            setBusinessCardsError('沒有找到導師資料');
          }
        } else {
          console.log('API 返回失敗:', response.message);
          setBusinessCardsError(response.message || '載入導師資料失敗');
        }
      } catch (error) {
        console.error('載入導師資料時發生錯誤:', error);
        setBusinessCardsError('載入導師資料時發生錯誤');
      } finally {
        setBusinessCardsLoading(false);
      }
    };

    loadBusinessCards();
  }, []);

  // 過濾導師資料 - 只顯示有頭像連結的導師
  const filteredBusinessCards = businessCards.filter(card =>
    // 必須有頭像連結才顯示
    card.data.profile.profile_picture_url &&
    // 符合搜尋條件
    (card.data.profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (card.data.profile.bio && card.data.profile.bio.toLowerCase().includes(searchQuery.toLowerCase())) ||
    card.data.tags.some(tag => tag.text.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const handleMentorClick = (businessCard: BusinessCardListItem) => {
    const slug = businessCard.data.profile.slug || businessCard.order;
    navigate(`/client/provider/${slug}`, { state: { businessCard } });
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* 搜尋欄 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="搜索導師..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* 主要內容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {businessCardsLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            <span className="ml-2 text-gray-600">載入中...</span>
          </div>
        ) : businessCardsError ? (
          <div className="text-center py-12">
            <div className="text-red-600 mb-2">載入失敗</div>
            <p className="text-gray-600">{businessCardsError}</p>
          </div>
        ) : filteredBusinessCards.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">沒有找到導師</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery ? '請嘗試其他搜尋關鍵字' : '目前沒有可用的導師資料'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBusinessCards.map((businessCard) => (
              <MentorCard
                key={businessCard.order}
                businessCard={businessCard}
                onClick={() => handleMentorClick(businessCard)}
                isMobile={isMobile}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserMentors;