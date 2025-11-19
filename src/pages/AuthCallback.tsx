import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { handleAuthCallback, isCallbackPage } from '../services/thirdPartyAuth';
import { getProtectedData } from '../config/api';
import { AI_COLORS } from '../constants/colors';
import { normalizePath, getBasename } from '../utils/pathUtils';

const AuthCallback: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  const calledRef = useRef(false); // 防止重複呼叫

  useEffect(() => {
    const processCallback = async () => {
      if (calledRef.current) return;
      calledRef.current = true;
      try {
        if (!isCallbackPage()) {
          navigate('/login');
          return;
        }
        setStatus('loading');
        setMessage('正在處理登入...');

        // 處理第三方登入回調
        const result = await handleAuthCallback();
        if (result.success) {
          setStatus('success');
          setMessage('登入成功！正在跳轉...');
          if (result.user) {
            login(result.user);
          }

          // 登入成功後，調用 /api/protected/ 來獲取 session 中的 next 路徑
          const protectedResponse = await getProtectedData();
          const redirectPath = protectedResponse.data.session_info?.session_data?.next || '/';

          // 清除 URL 上的 code/state，避免刷新重複觸發
          const basename = getBasename();
          window.history.replaceState({}, document.title, basename);

          // 標準化重定向路徑
          const normalizedPath = normalizePath(redirectPath);

          setTimeout(() => {
            navigate(normalizedPath, { replace: true });
          }, 1500);
        } else {
          throw new Error(result.error || '登入失敗');
        }
      } catch (error: any) {
        console.error('第三方登入回調處理失敗:', error);
        setStatus('error');
        setMessage(error.message || '登入失敗，請重試');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    };
    processCallback();
    // 依賴陣列必須為空，確保只執行一次
  }, [navigate, login]);

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader className={`w-12 h-12 ${AI_COLORS.text} animate-spin`} />;
      case 'success':
        return <CheckCircle className="w-12 h-12 text-green-500" />;
      case 'error':
        return <XCircle className="w-12 h-12 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return AI_COLORS.text;
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-6">
          {getStatusIcon()}
        </div>
        <h1 className={`text-2xl font-bold mb-4 ${getStatusColor()}`}>
          {status === 'loading' && '處理中...'}
          {status === 'success' && '登入成功'}
          {status === 'error' && '登入失敗'}
        </h1>
        <p className="text-gray-600 mb-6">
          {message}
        </p>
        {status === 'error' && (
          <button
            onClick={() => navigate('/login')}
            className={`${AI_COLORS.button} px-6 py-2 rounded-lg transition-colors`}
          >
            返回登入頁面
          </button>
        )}
        {status === 'loading' && (
          <div className="text-sm text-gray-500">
            請稍候，正在驗證您的身份...
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback; 