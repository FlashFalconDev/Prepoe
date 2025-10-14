import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
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
  member_card_id?: number;
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

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
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
    }
  };

  const checkAuth = useCallback(async () => {
    try {
      const response = await getProtectedData();
      if (response.status === 200) {
        // 如果API返回用戶資訊，使用API的資料
        if (response.data.user) {
          // 確保用戶對象包含 member_card_id
          const userData = {
            ...response.data.user,
            member_card_id: response.data.user.member_card_id || response.data.user.id // 如果沒有member_card_id，使用id作為備用
          };
          setUser(userData);
          // 設置 feature_flag
          const ff = response.data.session_info?.session_data?.feature_flag;
          if (ff) setFeatureFlag(ff);
          localStorage.setItem('user', JSON.stringify(userData));
          console.log('從API獲取用戶資料:', userData);
        } else {
          // 否則嘗試從localStorage恢復
          const savedUser = localStorage.getItem('user');
          if (savedUser) {
            const parsedUser = JSON.parse(savedUser);
            // 確保從localStorage恢復的用戶也有member_card_id
            if (!parsedUser.member_card_id) {
              parsedUser.member_card_id = parsedUser.id;
            }
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
    checkAuth();
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