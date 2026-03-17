// ====== LIFF 型別宣告 ======

interface LiffMessage {
  type: string;
  text: string;
}

interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

interface LiffSDK {
  init: (config: { liffId: string }) => Promise<void>;
  isInClient: () => boolean;
  isLoggedIn: () => boolean;
  isInitialized?: () => boolean;
  login: () => void;
  sendMessages: (messages: LiffMessage[]) => Promise<void>;
  getProfile: () => Promise<LiffProfile>;
}

declare global {
  interface Window {
    liff?: LiffSDK;
  }
}

// ====== LIFF 狀態介面 ======

export interface LiffStatus {
  initialized: boolean;
  inClient: boolean;
  loggedIn: boolean;
  error: string | null;
}

// ====== LIFF 初始化 ======

export const initLiff = async (liffId: string): Promise<boolean> => {
  try {
    if (!window.liff) {
      throw new Error('LIFF SDK 未載入');
    }

    await window.liff.init({ liffId });

    console.log('LIFF 初始化成功');

    if (window.liff.isInClient()) {
      console.log('在 LINE 應用內執行');
    } else {
      console.log('在外部瀏覽器執行');
    }

    return true;
  } catch (error) {
    console.error('LIFF 初始化失敗:', error);
    return false;
  }
};

// ====== 發送訊息到聊天室 ======

export const sendMessageToChat = async (message: string): Promise<boolean> => {
  try {
    if (!window.liff) {
      throw new Error('LIFF 未初始化');
    }

    if (!window.liff.isInClient()) {
      throw new Error('不在 LINE 應用內，無法發送訊息');
    }

    if (!window.liff.isLoggedIn()) {
      throw new Error('用戶未登入');
    }

    await window.liff.sendMessages([
      {
        type: 'text',
        text: message,
      },
    ]);

    console.log('訊息發送成功:', message);
    return true;
  } catch (error) {
    console.error('發送訊息失敗:', error);
    throw error;
  }
};

// ====== 檢查 LIFF 狀態 ======

export const checkLiffStatus = (): LiffStatus => {
  if (!window.liff) {
    return {
      initialized: false,
      inClient: false,
      loggedIn: false,
      error: 'LIFF SDK 未載入',
    };
  }

  try {
    return {
      initialized: window.liff.isInitialized ? window.liff.isInitialized() : false,
      inClient: window.liff.isInClient(),
      loggedIn: window.liff.isLoggedIn ? window.liff.isLoggedIn() : false,
      error: null,
    };
  } catch (error) {
    return {
      initialized: false,
      inClient: false,
      loggedIn: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

// ====== 登入 LIFF ======

export const loginLiff = async (): Promise<boolean> => {
  try {
    if (!window.liff) {
      throw new Error('LIFF 未初始化');
    }

    if (!window.liff.isLoggedIn()) {
      window.liff.login();
    }

    return true;
  } catch (error) {
    console.error('LIFF 登入失敗:', error);
    throw error;
  }
};

// ====== 取得用戶資料 ======

export const getUserProfile = async (): Promise<LiffProfile> => {
  try {
    if (!window.liff) {
      throw new Error('LIFF 未初始化');
    }

    if (!window.liff.isLoggedIn()) {
      throw new Error('用戶未登入');
    }

    const profile = await window.liff.getProfile();
    return profile;
  } catch (error) {
    console.error('取得用戶資料失敗:', error);
    throw error;
  }
};
