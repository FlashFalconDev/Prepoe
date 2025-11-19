import { 
  initiateGoogleLogin, 
  initiateLineLogin, 
  initiateFacebookLogin, 
  initiateAppleLogin,
  handleThirdPartyCallback,
  API_BASE,
  getAppBase
} from '../config/api';
import axios from 'axios';

// 第三方登入提供者類型
export type ThirdPartyProvider = 'google' | 'line' | 'facebook' | 'apple';

// 第三方登入配置
interface ThirdPartyConfig {
  google: {
    clientId: string;
    scope: string;
    redirectUri: string;
  };
  line: {
    clientId: string;
    scope: string;
    redirectUri: string;
  };
  facebook: {
    appId: string;
    scope: string;
    redirectUri: string;
  };
  apple: {
    clientId: string;
    scope: string;
    redirectUri: string;
  };
}

// 從環境變數獲取配置
const getThirdPartyConfig = (): ThirdPartyConfig => ({
  google: {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
    scope: 'email profile',
    redirectUri: `${getAppBase()}/auth/callback/google`,
  },
  line: {
    clientId: import.meta.env.VITE_LINE_CLIENT_ID || '',
    scope: 'profile openid email',
    // 使用統一的 APP_BASE 來管理域名
    redirectUri: `${getAppBase()}/auth/callback/line`,
  },
  facebook: {
    appId: import.meta.env.VITE_FACEBOOK_APP_ID || '',
    scope: 'email public_profile',
    redirectUri: `${getAppBase()}/auth/callback/facebook`,
  },
  apple: {
    clientId: import.meta.env.VITE_APPLE_CLIENT_ID || '',
    scope: 'email name',
    redirectUri: `${getAppBase()}/auth/callback/apple`,
  },
});

// 從後端取得 state
const fetchStateFromBackend = async (nextPath?: string): Promise<string> => {
  const clientSid = localStorage.getItem('client_sid') || import.meta.env.VITE_CLIENT_SID;
  let url = `${API_BASE}/api/auth/generate_state/?client_sid=${clientSid}`;

  // 如果有 next 路徑，附加到 URL
  if (nextPath) {
    url += `&next=${encodeURIComponent(nextPath)}`;
  }

  const { data } = await axios.get(url);
  return data.state;
};

// Google 登入
export const handleGoogleLogin = async (nextPath?: string): Promise<void> => {
  try {
    const config = getThirdPartyConfig();
    const state = await fetchStateFromBackend(nextPath);
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${config.google.clientId}&` +
      `redirect_uri=${encodeURIComponent(config.google.redirectUri)}&` +
      `scope=${encodeURIComponent(config.google.scope)}&` +
      `response_type=code&` +
      `state=${state}`;
    window.location.href = googleAuthUrl;
  } catch (error) {
    console.error('Google 登入初始化失敗:', error);
    throw error;
  }
};

// LINE 登入
export const handleLineLogin = async (nextPath?: string): Promise<void> => {
  try {
    const config = getThirdPartyConfig();

    // 檢查 LINE Client ID 是否設定
    if (!config.line.clientId) {
      throw new Error('LINE Client ID 未設定，請檢查環境變數 VITE_LINE_CLIENT_ID');
    }

    const state = await fetchStateFromBackend(nextPath);

    // 構建 LINE 授權 URL，確保所有參數都正確編碼
    const lineAuthUrl = new URL('https://access.line.me/oauth2/v2.1/authorize');
    lineAuthUrl.searchParams.set('response_type', 'code');
    lineAuthUrl.searchParams.set('client_id', config.line.clientId);
    lineAuthUrl.searchParams.set('redirect_uri', config.line.redirectUri);
    lineAuthUrl.searchParams.set('scope', config.line.scope);
    lineAuthUrl.searchParams.set('state', state);

    window.location.href = lineAuthUrl.toString();
  } catch (error) {
    console.error('LINE 登入初始化失敗:', error);
    throw error;
  }
};

// Facebook 登入
export const handleFacebookLogin = async (nextPath?: string): Promise<void> => {
  try {
    const config = getThirdPartyConfig();
    const state = await fetchStateFromBackend(nextPath);
    const facebookAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
      `client_id=${config.facebook.appId}&` +
      `redirect_uri=${encodeURIComponent(config.facebook.redirectUri)}&` +
      `scope=${encodeURIComponent(config.facebook.scope)}&` +
      `state=${state}&` +
      `response_type=code`;
    window.location.href = facebookAuthUrl;
  } catch (error) {
    console.error('Facebook 登入初始化失敗:', error);
    throw error;
  }
};

// Apple 登入
export const handleAppleLogin = async (nextPath?: string): Promise<void> => {
  try {
    const config = getThirdPartyConfig();
    const state = await fetchStateFromBackend(nextPath);
    const appleAuthUrl = `https://appleid.apple.com/auth/authorize?` +
      `client_id=${config.apple.clientId}&` +
      `redirect_uri=${encodeURIComponent(config.apple.redirectUri)}&` +
      `scope=${encodeURIComponent(config.apple.scope)}&` +
      `state=${state}&` +
      `response_type=code&` +
      `response_mode=form_post`;
    window.location.href = appleAuthUrl;
  } catch (error) {
    console.error('Apple 登入初始化失敗:', error);
    throw error;
  }
};

// 處理第三方登入回調
export const handleAuthCallback = async (): Promise<any> => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const provider = getThirdPartyType();

    console.log('=== handleAuthCallback Debug ===');
    console.log('Code:', code?.substring(0, 20) + '...');
    console.log('State:', state);
    console.log('Provider:', provider);

    if (!code) {
      throw new Error('未收到授權碼');
    }
    if (!state) {
      throw new Error('未收到狀態碼');
    }
    if (!provider) {
      throw new Error('無法識別第三方登入類型');
    }

    console.log('準備呼叫後端 API...');
    // 呼叫後端 API 處理授權碼,並傳遞提供者類型
    const response = await handleThirdPartyCallback(code, state, provider);
    console.log('後端回應:', response.data);
    // 明確回傳 success 狀態與錯誤訊息
    if (response.data && response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data?.error || '登入失敗');
    }
  } catch (error: any) {
    // 讓外層能取得錯誤訊息
    throw new Error(error?.response?.data?.error || error.message || '登入失敗');
  }
};

// 檢查是否在回調頁面
export const isCallbackPage = (): boolean => {
  return window.location.pathname.startsWith('/auth/callback');
};

// 獲取第三方登入類型
export const getThirdPartyType = (): string | null => {
  const path = window.location.pathname;
  if (path.startsWith('/auth/callback/')) {
    return path.split('/').pop() || null;
  }
  return null;
};

// 獲取 URL 參數
export const getUrlParameter = (name: string): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
};