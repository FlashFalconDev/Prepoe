import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { login, getCSRFToken } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import { handleGoogleLogin, handleLineLogin, handleFacebookLogin, handleAppleLogin } from '../services/thirdPartyAuth';
import { AI_COLORS } from '../constants/colors';
import { normalizePath } from '../utils/pathUtils';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isThirdPartyLoading, setIsThirdPartyLoading] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login: authLogin } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // 首先獲取CSRF token
      await getCSRFToken();
      
      // 執行登入
      const response = await login(username, password);
      
      if (response.status === 200) {
        // 登入成功，保存用戶資訊並跳轉到原本要去的頁面
        const userData = response.data.user || { id: 1, username };
        authLogin(userData);
        
        // 獲取原本要去的頁面，如果沒有則跳轉到首頁
        const from = location.state?.from?.pathname || '/';
        const normalizedPath = normalizePath(from);
        navigate(normalizedPath, { replace: true });
      }
    } catch (err: any) {
      console.error('登入失敗:', err);
      setError(err.response?.data?.message || '登入失敗，請檢查用戶名和密碼');
    } finally {
      setIsLoading(false);
    }
  };

  // 第三方登入處理函數
  const handleThirdPartyAuth = async (provider: string, authFunction: () => Promise<void>) => {
    try {
      setIsThirdPartyLoading(provider);
      setError('');
      
      // 保存原始路徑到 sessionStorage，因為第三方登入會跳轉到外部頁面
      const from = location.state?.from?.pathname || '/';
      const normalizedPath = normalizePath(from);
      sessionStorage.setItem('redirectAfterLogin', normalizedPath);
      
      await authFunction();
      
      // 注意：第三方登入會跳轉到外部頁面，所以這裡不會執行到
      // 實際的跳轉會在 AuthCallback 頁面處理
    } catch (err: any) {
      console.error(`${provider} 登入失敗:`, err);
      setError(`${provider} 登入失敗，請重試`);
    } finally {
      setIsThirdPartyLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Logo/标题区域 */}
        <div className="text-center mb-8">
          <div className={`w-16 h-16 ${AI_COLORS.gradient} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">歡迎回來</h1>
          <p className="text-gray-600">請登入您的帳戶</p>
        </div>

        {/* 登录表单 */}
        <form onSubmit={handleLogin} className="space-y-6">
          {/* 用户名输入 - 禁用狀態 */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-500 mb-2">
              用戶名
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed"
              placeholder="暫時無法使用"
              disabled
            />
          </div>

          {/* 密码输入 - 禁用狀態 */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-500 mb-2">
              密碼
            </label>
            <div className="relative">
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed"
                placeholder="暫時無法使用"
                disabled
              />
              <button
                type="button"
                disabled
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-300 cursor-not-allowed"
              >
                <EyeOff size={20} />
              </button>
            </div>
          </div>

          {/* 错误信息 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* 登录按钮 - 禁用狀態 */}
          <button
            type="button"
            disabled
            className="w-full bg-gray-300 text-gray-500 py-3 px-4 rounded-lg font-medium cursor-not-allowed"
          >
            暫時無法使用
          </button>
        </form>

                  {/* 分隔線 */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">或使用以下方式登入</span>
            </div>
          </div>

          {/* 第三方登入按鈕 */}
          <div className="space-y-3">
            {/* LINE 登入 */}
            <button
              onClick={() => handleThirdPartyAuth('LINE', handleLineLogin)}
              disabled={isThirdPartyLoading === 'LINE'}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {isThirdPartyLoading === 'LINE' ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600 mr-2"></div>
              ) : (
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#00B900" d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                </svg>
              )}
              {isThirdPartyLoading === 'LINE' ? '處理中...' : '使用 LINE 登入'}
            </button>

            {/* Google 登入 - 禁用狀態 */}
            <button
              disabled
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-200 rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-2 opacity-50" viewBox="0 0 24 24">
                <path fill="#9CA3AF" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#9CA3AF" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#9CA3AF" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#9CA3AF" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              使用 Google 登入 (暫時無法使用)
            </button>
          </div>

          {/* 底部信息 */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              還沒有帳戶？{' '}
              <a href="#" className={`${AI_COLORS.text} hover:${AI_COLORS.textDark} font-medium`}>
                聯絡管理員
              </a>
            </p>
          </div>
      </div>
    </div>
  );
};

export default Login; 