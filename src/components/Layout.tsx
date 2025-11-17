import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CreditCard, Bot, Video, MessageSquare, Settings, LogOut, User, FileText, Sparkles, Calendar, Briefcase, Users, UserCog, BarChart3 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AI_COLORS } from '../constants/colors';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  // 截斷使用者名稱顯示
  const truncateUsername = (username?: string) => {
    if (!username) return '';
    return username.length > 12 ? `${username.slice(0, 12)}...` : username;
  };

  // 根據當前路徑決定導航項目
  const getNavItems = () => {
    if (location.pathname.startsWith('/business')) {
      return [
        { path: '/business', icon: Briefcase, label: '基本狀況' },
        { path: '/business/visitors', icon: Users, label: '關聯訪客' },
        { path: '/business/accounts', icon: UserCog, label: '帳戶分配' },
        { path: '/business/usage', icon: BarChart3, label: '使用紀錄' },
      ];
    } else if (location.pathname.startsWith('/client')) {
      return [
        { path: '/client', icon: Bot, label: '導師介紹' },
        { path: '/client/articles', icon: FileText, label: '影音文章' },
        { path: '/client/event', icon: Calendar, label: '課程活動' },
        { path: '/client/chat', icon: MessageSquare, label: '對話視窗' },
        { path: '/client/profile', icon: User, label: '會員專區' },
      ];
    } else {
      return [
        { path: '/provider', icon: CreditCard, label: '雲端名片' },
        { path: '/provider/assistants', icon: Bot, label: '智能助手' },
        { path: '/provider/creator', icon: Sparkles, label: 'AI創作' },
        { path: '/provider/customer-service', icon: MessageSquare, label: '客服對話' },
        { path: '/provider/profile', icon: Settings, label: '個人設定' },
      ];
    }
  };

  const navItems = getNavItems();

  // 根據當前路徑動態生成標題
  const getPageTitle = () => {
    switch (location.pathname) {
      // Business 路由
      case '/business':
        return '基本狀況';
      case '/business/visitors':
        return '關聯訪客';
      case '/business/accounts':
        return '帳戶分配';
      case '/business/usage':
        return '使用紀錄';
      // Provider 路由
      case '/provider/customer-service':
        return '客服對話';
      case '/provider/assistants':
        return '智能助手';
      case '/provider/assistants/chat':
        return '客服平台';
      case '/provider/creator':
        return 'AI創作';
      case '/provider/creator/article':
        return '文章創作';
      case '/provider/profile':
        return '個人設定';
      case '/provider/activity-settings':
        return '活動設定';
      case '/provider/private-domain':
        return '私域助手';
      case '/provider/ai-service':
        return 'AI助手設定';
      case '/provider':
        return '雲端名片';
      // Client 路由
      case '/client':
        return '導師介紹';
      case '/client/mentors':
        return '導師介紹';
      case '/client/event':
        return '課程活動';
      case '/client/articles':
        return '影音文章';
      case '/client/chat':
        return '對話視窗';
      case '/client/profile':
        return '會員專區';
      default:
        return import.meta.env.VITE_APP_NAME || 'PrePoe';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 md:hidden">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">{getPageTitle()}</h1>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <User size={16} className="text-gray-500" />
              <span className="text-sm text-gray-700" title={user?.username}>
                {truncateUsername(user?.username)}
              </span>
            </div>
            <button
              onClick={logout}
              className="p-2 text-gray-500 hover:text-red-600 transition-colors"
              title="登出"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Left Sidebar Navigation - Desktop Only */}
      <nav className="hidden md:flex md:flex-col md:w-48 md:bg-white md:border-r md:border-gray-200 md:min-h-screen md:pt-8">
        <div className="flex flex-col space-y-2 px-4 flex-1">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? `${AI_COLORS.bg} ${AI_COLORS.text} border-r-2 ${AI_COLORS.border}`
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium flex-1">{label}</span>
              </Link>
            );
          })}
        </div>
        
        {/* 登出按鈕 - 位於左側選單底部 */}
        <div className="px-4 pb-6">
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center space-x-3 px-4 py-2 text-gray-600 mb-3">
              <User size={20} />
              <span className="font-medium text-sm truncate" title={user?.username}>
                {truncateUsername(user?.username)}
              </span>
            </div>
            <button
              onClick={logout}
              className="flex items-center space-x-3 px-4 py-3 w-full text-left text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              <span className="font-medium">登出</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 pb-20 md:pb-0 md:ml-0">
        {children}
      </main>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden">
        <div className="flex justify-around items-center h-16 px-4">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1 transition-colors ${
                  isActive
                    ? AI_COLORS.text
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={24} className="mb-1" />
                <span className="text-xs font-medium text-center leading-tight">
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;