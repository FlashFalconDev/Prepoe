import React, { useState } from 'react';
import { FileText, Volume2, Camera, Sparkles, Play, Edit3, ArrowRight } from 'lucide-react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { AI_COLORS } from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';
import NoPermissionDialog from '../components/NoPermissionDialog';
import { handlePermissionRedeem } from '../utils/permissionUtils';

interface CreationOption {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  features: string[];
  path: string;
}

const AICreator: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isRoot = location.pathname === '/provider/creator';
  const { featureFlag, checkAuth } = useAuth();
  const [showNoPermission, setShowNoPermission] = useState(false);
  
  // 添加調試信息
  console.log('AICreator 頁面載入中...');


  const creationOptions: CreationOption[] = [
    {
      id: 'audio',
      title: '音頻創作',
      description: '使用AI技術快速生成專業音頻，支援多種情緒和語音風格',
      icon: Volume2,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      features: ['智能腳本生成', '多種情緒表達', '自訂語音模型', '一鍵生成'],
      path: '/provider/creator/audio'
    },
    {
      id: 'video-creation',
      title: '影片創作',
      description: '上傳圖片搭配語音，快速生成專業影片內容',
      icon: Camera,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      features: ['圖片上傳', '語音選擇', '自動合成', '一鍵生成'],
      path: '/provider/creator/video-creation'
    },
    {
      id: 'article',
      title: '文章創作',
      description: 'AI輔助文章創作，支援圖片影片上傳，智能標籤推薦',
      icon: FileText,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      features: ['智能內容建議', '圖片影片上傳', '標籤自動推薦', '即時預覽'],
      path: '/provider/creator/article'
    }
  ];

  // 添加導航處理函數
  const handleNavigation = (path: string, optionId?: string) => {
    if (optionId === 'article') {
      const enabled = Number(featureFlag?.article_enabled || 0);
      if (enabled === 0) {
        setShowNoPermission(true);
        return;
      }
    }
    console.log('導航到:', path);
    navigate(path);
  };

  const recentCreations = [
    {
      id: 1,
      type: 'video',
      title: '產品介紹影音',
      status: 'completed',
      createdAt: '2024-01-15',
      thumbnail: '🎬'
    },
    {
      id: 2,
      type: 'video-creation',
      title: '產品展示影片',
      status: 'completed',
      createdAt: '2024-01-14',
      thumbnail: '🎥'
    },
    {
      id: 3,
      type: 'audio',
      title: '品牌宣傳音頻',
      status: 'completed',
      createdAt: '2024-01-13',
      thumbnail: '🎵'
    },
    {
      id: 4,
      type: 'article',
      title: '技術分享文章',
      status: 'draft',
      createdAt: '2024-01-12',
      thumbnail: '📝'
    },
    {
      id: 5,
      type: 'video',
      title: '品牌宣傳片',
      status: 'processing',
      createdAt: '2024-01-11',
      thumbnail: '🎬'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'processing': return 'bg-blue-100 text-blue-700';
      case 'draft': return 'bg-amber-100 text-amber-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'processing': return '處理中';
      case 'draft': return '草稿';
      default: return '未知';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
        {isRoot && (
          <div className="max-w-6xl mx-auto px-4 py-6">
            {/* 移除 Header，直接顯示功能區域 */}
            


            {/* Creation Options */}
            <div className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {creationOptions.map((option) => (
                  <div
                    key={option.id}
                    className={`bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:${AI_COLORS.border}`}
                    tabIndex={0}
                    onClick={() => handleNavigation(option.path, option.id)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className={`w-16 h-16 rounded-2xl ${option.bgColor} flex items-center justify-center`}>
                        <option.icon size={32} className={option.color} />
                      </div>
                      <ArrowRight size={20} className="text-gray-400" />
                    </div>
                    
                    <div className="mb-5">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{option.title}</h3>
                      <p className="text-gray-600 text-sm leading-relaxed mb-4">{option.description}</p>
                      
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        {option.features.map((feature, index) => (
                          <div key={index} className="flex items-start gap-2 text-sm text-gray-600">
                            <div className={`w-1.5 h-1.5 ${AI_COLORS.bgDark} rounded-full flex-shrink-0 mt-1.5`}></div>
                            <span className="flex-1 leading-snug">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        <NoPermissionDialog
          isOpen={showNoPermission}
          onClose={() => setShowNoPermission(false)}
          onSubmitSerial={async (s) => {
            await handlePermissionRedeem(s, {
              checkAuth,
              onSuccess: () => setShowNoPermission(false)
            });
          }}
        />
        <Outlet />
      </div>
  );
};

export default AICreator; 