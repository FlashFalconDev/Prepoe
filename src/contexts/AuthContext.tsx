import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { getProtectedData, logout as logoutApi, getFeatureFlag } from '../config/api';

interface FeatureFlag {
  ai_assistant_count?: number;
  article_enabled?: number;
  chat_platform_count?: number;
  community_count?: number;
  namecard_enabled?: number;
  tokens?: number;
}

interface User {
  id: number;
  username: string;
  email?: string;
  member_card?: number; // API 返回的 member_card 欄位
  member_card_id?: number; // 保留向後兼容
  is_superuser?: boolean; // 系統管理員標識
  role?: string; // 用戶角色（如 "admin"）
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  featureFlag?: FeatureFlag;
  login: (user: User) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  loadFeatureFlag: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [featureFlag, setFeatureFlag] = useState<FeatureFlag | undefined>(undefined);

  // 使用 ref 來追蹤是否已經檢查過認證，防止重複請求
  const hasCheckedAuthRef = useRef(false);
  const isCheckingAuthRef = useRef(false);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    // 重置認證檢查標記,以便可以重新檢查並獲取完整的用戶資料
    hasCheckedAuthRef.current = false;
    // 使用 setTimeout 來確保 checkAuth 在當前執行上下文之後執行
    setTimeout(() => {
      checkAuth();
    }, 0);
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.error('登出API呼叫失敗:', error);
    } finally {
      setUser(null);
      setFeatureFlag(undefined);
      localStorage.removeItem('user');
      hasCheckedAuthRef.current = false; // 重置認證檢查標記
    }
  };

  const checkAuth = useCallback(async () => {
    // 防止重複請求 - 檢查是否已檢查過或正在檢查中
    if (hasCheckedAuthRef.current || isCheckingAuthRef.current) {
      console.log('⚠️ 認證已檢查或正在檢查中，跳過重複請求');
      return;
    }

    try {
      isCheckingAuthRef.current = true; // 立即標記為檢查中

      // 從 URL 查詢參數中獲取 referrer
      const urlParams = new URLSearchParams(window.location.search);
      const referrer = urlParams.get('referrer');

      // 構建完整的當前路徑（包含 pathname 和 search）
      const currentPath = window.location.pathname + window.location.search;

      const response = await getProtectedData(referrer || undefined, currentPath);
      if (response.status === 200) {
        // 如果API返回用戶資訊，使用API的資料
        if (response.data.user) {
          // 直接使用 API 返回的用戶資料,保持原始結構
          const userData = response.data.user;
          setUser(userData);
          // 設置 feature_flag
          const ff = response.data.session_info?.session_data?.feature_flag;
          if (ff) setFeatureFlag(ff);
          localStorage.setItem('user', JSON.stringify(userData));
          hasCheckedAuthRef.current = true; // 標記為已檢查
          console.log('從API獲取用戶資料:', userData);
        } else {
          // 否則嘗試從localStorage恢復
          const savedUser = localStorage.getItem('user');
          if (savedUser) {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
            console.log('從localStorage恢復用戶資料:', parsedUser);
          }
        }
      }
    } catch (error) {
      console.error('認證檢查失敗:', error);
      // 清除無效的認證資訊
      setUser(null);
      setFeatureFlag(undefined);
      localStorage.removeItem('user');
    } finally {
      setIsLoading(false);
      isCheckingAuthRef.current = false;
    }
  }, []);

  const loadFeatureFlag = useCallback(async () => {
    try {
      console.log('開始獲取 feature_flag...');
      const response = await getFeatureFlag();
      if (response.status === 200) {
        // 從 session_info.session_data.feature_flag 中提取
        const ff = response.data.session_info?.session_data?.feature_flag;
        if (ff) {
          setFeatureFlag(ff);
          console.log('feature_flag 獲取成功:', ff);
        } else {
          console.warn('回應中沒有找到 feature_flag');
        }
      }
    } catch (error) {
      console.error('獲取 feature_flag 失敗:', error);
    }
  }, []);

  useEffect(() => {
    if (!hasCheckedAuthRef.current && !isCheckingAuthRef.current) {
      checkAuth();
    }
  }, [checkAuth]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    featureFlag,
    login,
    logout,
    checkAuth,
    loadFeatureFlag,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 