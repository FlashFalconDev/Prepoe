import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import PreviewCard from '../components/PreviewCard';
import ShareModal from '../components/ShareModal';
import { useBusinessCardData } from '../hooks/useBusinessCardData';

interface BusinessCardViewProps {}

const BusinessCardView: React.FC<BusinessCardViewProps> = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: cardData, loading, error } = useBusinessCardData(slug);
  const [showShareModal, setShowShareModal] = useState(false);

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleCloseShareModal = () => {
    setShowShareModal(false);
  };

  // 載入狀態
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  // 錯誤狀態
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">載入失敗</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            重新載入
          </button>
        </div>
      </div>
    );
  }

  // 數據檢查
  if (!cardData || !cardData.profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-6xl mb-4">📄</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">名片不存在</h2>
          <p className="text-gray-600">找不到指定的名片資料</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: cardData.profile?.page_bg_color || '#f9fafb' }}
      >
        <div className="w-full max-w-4xl mx-auto">
          <div className="flex justify-center">
            <PreviewCard 
              data={cardData} 
              onShare={handleShare}
            />
          </div>
        </div>
      </div>

      {/* 分享彈窗 */}
      <ShareModal
        isOpen={showShareModal}
        onClose={handleCloseShareModal}
        profileSlug={cardData.profile?.slug || ''}
        sharePpUrl={cardData.share_pp}
      />

      {/* Powered by 頁腳 - 使用名片設定的顏色 */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 text-center">
        <div 
          className="backdrop-blur-sm rounded-full px-4 py-2 shadow-lg"
          style={{ 
            backgroundColor: `${cardData.profile?.bg_color || '#ffffff'}80`,
            color: cardData.profile?.text_color || '#6b7280'
          }}
        >
          <p className="text-xs">
            Powered by <span className="font-semibold" style={{ color: cardData.profile?.button_color || '#3b82f6' }}>Prepoe</span>
          </p>
        </div>
      </div>
    </>
  );
};

export default BusinessCardView; 