import React from 'react';
import {
  Settings,
  MessageSquare,
  HelpCircle,
  Calculator,
  Calendar,
  ArrowRight,
  Sparkles,
  Bot
} from 'lucide-react';
import type { LucideIcon } from "lucide-react";
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { AI_COLORS } from '../constants/colors';

// 添加CSS样式支持
const lineClampStyles = `
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

interface Assistant {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  count: number;
  path: string;
  isMain?: boolean;
  disabled?: boolean;
}

const Assistants: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isRoot = location.pathname === '/provider/assistants';
  const assistants: Assistant[] = [
    {
      id: '1',
      title: 'AI助手設定',
      description: '建立和管理智能客服系統，配置AI助理、檔案管理和對話設定',
      icon: Settings,
      color: AI_COLORS.text,
      bgColor: AI_COLORS.bg,
      path: '/provider/ai-service',
      count: 156,
      isMain: true,
    },
    {
      id: '2',
      title: '客服平台',
      description: '24小時智能客服，提供即時回應與問題解決',
      icon: MessageSquare,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100',
      path: '/provider/assistants/chat',
      count: 156,
    },
    {
      id: '4',
      title: '問卷統計',
      description: '快速建立專業問卷，收集客戶回饋與市場洞察',
      icon: HelpCircle,
      color: AI_COLORS.text,
      bgColor: AI_COLORS.bg,
      path: '/provider/assistants/question',
      count: 12,
      disabled: true,
    },
    {
      id: '5',
      title: '網站建立',
      description: '快速建立專業網站，提供完整的網站建設服務',
      icon: Settings,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
      path: '/provider/assistants/website',
      count: 8,
      disabled: true,
    },
    {
      id: '6',
      title: '會議工具',
      description: '智能安排會議，自動記錄會議重點與行動項目',
      icon: Calendar,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      path: '/provider/assistants/meeting',
      count: 24,
      disabled: true,
    },
  ];

  const handleNavigation = (path: string, isDisabled: boolean = false) => {
    if (isDisabled) {
      console.log('功能暫時不可用:', path);
      return;
    }
    console.log('導航到:', path);
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 添加CSS样式 */}
      <style>{lineClampStyles}</style>
      
      {isRoot && (
        <div className="max-w-6xl mx-auto px-4 py-6">
        {/* 移除 Header，直接顯示功能區域 */}
        
        {/* Main AI Assistant Management - 簡化版 */}
        <div className="mb-8">
          {assistants.filter(a => a.isMain).map((assistant) => (
            <div
              key={assistant.id}
              className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 hover:border-ai-300"
              tabIndex={0}
              onClick={() => handleNavigation(assistant.path)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-16 h-16 rounded-2xl ${assistant.bgColor} flex items-center justify-center`}>
                  <assistant.icon size={32} className={assistant.color} />
                </div>
                <div className={`${AI_COLORS.bg} ${AI_COLORS.text} px-3 py-1 rounded-full text-sm font-medium`}>
                  主要功能
                </div>
              </div>
              
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{assistant.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{assistant.description}</p>
              </div>
              
              <div className="flex justify-end">
                <button className={`flex items-center gap-2 px-6 py-3 rounded-xl text-white text-base font-medium transition-all duration-200 ${AI_COLORS.button} shadow-sm hover:shadow-md`}>
                  進入設定
                  <Settings size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Other Assistants Grid - 缩小排列 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">擴增功能</h2>
          <div className="grid grid-cols-3 gap-4">
            {assistants.filter(a => !a.isMain).map((assistant) => (
              <div
                key={assistant.id}
                className={`bg-white rounded-xl p-4 shadow-sm transition-all duration-200 border border-gray-100 ${
                  assistant.disabled 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:shadow-md cursor-pointer hover:border-gray-200 hover:transform hover:scale-105'
                }`}
                tabIndex={assistant.disabled ? -1 : 0}
                onClick={() => handleNavigation(assistant.path, assistant.disabled)}
              >
                <div className="flex justify-center items-start mb-3">
                  <div className={`w-12 h-12 rounded-xl ${assistant.bgColor} flex items-center justify-center shadow-sm`}>
                    <assistant.icon size={24} className={assistant.color} />
                  </div>
                </div>
                
                <div className="text-center">
                  <h3 className="text-base font-semibold text-gray-900 mb-1">{assistant.title}</h3>
                  {assistant.disabled && (
                    <div className="inline-block bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full">
                      即將推出
                    </div>
                  )}
                  <div className="hidden md:block">
                    <p className="text-gray-600 text-xs leading-relaxed line-clamp-2">{assistant.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>


      </div>
      )}
      <Outlet />
    </div>
  );
};

export default Assistants;