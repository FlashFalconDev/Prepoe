import React, { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, featureFlag, loadFeatureFlag } = useAuth();
  const location = useLocation();
  const hasCalledLoadFeatureFlag = useRef(false);

  // 如果已登入但沒有 featureFlag，則呼叫 loadFeatureFlag 來獲取
  useEffect(() => {
    if (isAuthenticated && !featureFlag && !isLoading && !hasCalledLoadFeatureFlag.current) {
      hasCalledLoadFeatureFlag.current = true;
      console.log('ProtectedRoute: 呼叫 loadFeatureFlag 獲取 feature_flag');
      loadFeatureFlag();
    }
  }, [isAuthenticated, featureFlag, isLoading, loadFeatureFlag]);

  // 當登出時重置標記
  useEffect(() => {
    if (!isAuthenticated) {
      hasCalledLoadFeatureFlag.current = false;
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // 保存當前路徑，登入後可以跳轉回來
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 已登入但沒有 featureFlag，顯示載入狀態
  if (!featureFlag) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在載入權限資訊...</p>
        </div>
      </div>
    );
  }

  // 已登入且有 featureFlag，允許訪問
  return <>{children}</>;
};

export default ProtectedRoute; 