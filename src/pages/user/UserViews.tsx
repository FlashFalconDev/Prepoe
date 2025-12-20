import React, { useEffect, useState } from 'react';
import { useToast } from '../../hooks/useToast';
import { api, API_ENDPOINTS } from '../../config/api';

interface ViewContent {
  iframe_html: string;
  title?: string;
  description?: string;
}

const UserViews: React.FC = () => {
  const [content, setContent] = useState<ViewContent | null>(null);
  const [loading, setLoading] = useState(true);
  const { showError } = useToast();
  
  // 左上角輪播圖片
  const leftImages = ['/l_t.png', '/l_b.png', '/r_b.png'];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    fetchViewContent();
  }, []);

  // 左上角圖片輪播效果
  useEffect(() => {
    const interval = setInterval(() => {
      // 先淡出
      setIsVisible(false);
      
      // 等淡出完成後切換圖片並淡入
      setTimeout(() => {
        setCurrentImageIndex((prev) => (prev + 1) % leftImages.length);
        setIsVisible(true);
      }, 500);
    }, 3000); // 每 3 秒切換一次

    return () => clearInterval(interval);
  }, []);

  const fetchViewContent = async () => {
    try {
      setLoading(true);

      // TODO: 未來從 API 獲取內容
      // const response = await api.get(API_ENDPOINTS.VIEW_CONTENT);
      // setContent(response.data);

      // 目前使用測試內容 - Dacast 直播
      setContent({
        iframe_html: '<div style="position:relative;padding-bottom:56.25%;overflow:hidden;height:0;max-width:100%;"><iframe id="b0a6bbf3-2d67-7c3d-d58a-63418a947a3a-live-f16641b9-5808-4f38-8891-fb12ed487ed7" src="https://iframe.dacast.com/live/b0a6bbf3-2d67-7c3d-d58a-63418a947a3a/f16641b9-5808-4f38-8891-fb12ed487ed7" width="100%" height="100%" frameborder="0" scrolling="no" allow="autoplay;encrypted-media" allowfullscreen webkitallowfullscreen mozallowfullscreen oallowfullscreen msallowfullscreen style="position:absolute;top:0;left:0;"></iframe></div>',
        title: '2025 世界冥想日',
        description: 'Aiya共振之聲音樂會'
      });
    } catch (error) {
      console.error('載入內容失敗:', error);
      showError('載入內容失敗');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">無法載入內容</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8" style={{ backgroundColor: '#85BFC7' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 頂部裝飾區 - 左右兩側 */}
        <div className="flex justify-between items-end mb-4 -mt-6">
          {/* 左上角輪播裝飾 - 固定高度避免播放器跳動 */}
          <div className="pl-4 h-8 md:h-10 lg:h-12 flex items-center">
            <img 
              src={leftImages[currentImageIndex]} 
              alt="" 
              className={`w-8 md:w-10 lg:w-12 transition-all duration-500 ${
                isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
              }`}
            />
          </div>
          
          {/* 右上角裝飾 */}
          <div className="pr-4">
            <img 
              src="/r_t.png" 
              alt="" 
              className="w-60 md:w-[270px] lg:w-[310px]"
            />
          </div>
        </div>
        
        {/* 直播視窗容器 */}
        <div className="relative">
          {/* 直播視窗 */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div
              className="w-full"
              dangerouslySetInnerHTML={{ __html: content.iframe_html }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserViews;
