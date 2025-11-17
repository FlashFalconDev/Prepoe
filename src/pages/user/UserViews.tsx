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

  useEffect(() => {
    fetchViewContent();
  }, []);

  const fetchViewContent = async () => {
    try {
      setLoading(true);

      // TODO: 未來從 API 獲取內容
      // const response = await api.get(API_ENDPOINTS.VIEW_CONTENT);
      // setContent(response.data);

      // 目前使用測試內容
      setContent({
        iframe_html: '<div style="position:relative;padding-bottom:56.25%;overflow:hidden;height:0;max-width:100%;"><iframe id="a547cf9b-21aa-57a9-822e-a056f99aca78-live-36850afa-33e3-44a1-a1d9-e374a21359a4" src="https://iframe.dacast.com/live/a547cf9b-21aa-57a9-822e-a056f99aca78/36850afa-33e3-44a1-a1d9-e374a21359a4" width="100%" height="100%" frameborder="0" scrolling="no" allow="autoplay;encrypted-media" allowfullscreen webkitallowfullscreen mozallowfullscreen oallowfullscreen msallowfullscreen style="position:absolute;top:0;left:0;"></iframe></div>',
        title: '直播內容',
        description: '測試直播頁面'
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {content.title && (
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">{content.title}</h1>
            {content.description && (
              <p className="mt-2 text-gray-600">{content.description}</p>
            )}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div
            className="w-full"
            dangerouslySetInnerHTML={{ __html: content.iframe_html }}
          />
        </div>
      </div>
    </div>
  );
};

export default UserViews;
