import React, { createContext, useState, useContext, useCallback } from 'react';


// ====== 工具函式 ======

/**
 * 從大圖 URL 推導小圖 URL
 * 例: .../Rune/25-4.jpg → .../Rune/25s.png
 */
export const getSmallImageUrl = (imageUrl: string): string => {
  return imageUrl.replace(/(\d+)-\d+\.jpg$/, '$1s.png');
};
// ====== 型別定義 ======

export interface RunaCard {
  name: string;
  description: string;
  image: string;
  image_s: string;
}

export interface RunaFooterItem {
  image: string;
  share_url: string;
}

/** 前端 hardcoded footer 資料 */
export const RUNA_FOOTER_ITEMS: RunaFooterItem[] = [
  {
    image: 'https://react-fflinebot.s3.us-east-1.amazonaws.com/img/Rune/footer1.png',
    share_url: 'https://host.flashfalcon.info/info/aiyaplus/?pushtext=@Aiya幣',
  },
  {
    image: 'https://react-fflinebot.s3.us-east-1.amazonaws.com/img/Rune/footer2.png',
    share_url: 'https://host.flashfalcon.info/info/aiyaplus/?pushtext=@熱門活動',
  },
  {
    image: 'https://react-fflinebot.s3.us-east-1.amazonaws.com/img/Rune/footer3.png',
    share_url: '/client',
  },
];

export interface RunaResult {
  card: RunaCard[];
  footer?: RunaFooterItem[];
  liff_id: string;
  cdr_pk: number;
  ai_token: string;
  question: string;
  session_id: number;
}

export interface RunaContextType {
  userName: string;
  setUserName: (name: string) => void;
  userQuestion: string;
  setUserQuestion: (question: string) => void;
  result: RunaResult | null;
  setResult: (result: RunaResult | null) => void;
  runes: string[];
  setRunes: (runes: string[]) => void;
}

// ====== sessionStorage 持久化 ======

const STORAGE_KEY = 'runa_session';

interface StoredState {
  userName: string;
  userQuestion: string;
  result: RunaResult | null;
  runes: string[];
}

const loadFromStorage = (): StoredState | null => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredState;
  } catch {
    return null;
  }
};

const saveToStorage = (state: StoredState) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // sessionStorage 寫入失敗不影響主流程
  }
};

// ====== Context ======

const RunaContext = createContext<RunaContextType | undefined>(undefined);
export const useRunaContext = (): RunaContextType => {
  const context = useContext(RunaContext);
  if (!context) {
    throw new Error('useRunaContext must be used within a RunaProvider');
  }
  return context;
};
interface RunaProviderProps {
  children: React.ReactNode;
}
export const RunaProvider: React.FC<RunaProviderProps> = ({ children }) => {
  const stored = loadFromStorage();

  const [userName, _setUserName] = useState(stored?.userName || '');
  const [userQuestion, _setUserQuestion] = useState(stored?.userQuestion || '');
  const [result, _setResult] = useState<RunaResult | null>(stored?.result || null);
  const [runes, _setRunes] = useState<string[]>(stored?.runes || []);

  // 包裝 setter，寫入 state 同時同步到 sessionStorage
  const setUserName = useCallback((name: string) => {
    _setUserName(name);
    const cur = loadFromStorage() || { userName: '', userQuestion: '', result: null, runes: [] };
    saveToStorage({ ...cur, userName: name });
  }, []);

  const setUserQuestion = useCallback((question: string) => {
    _setUserQuestion(question);
    const cur = loadFromStorage() || { userName: '', userQuestion: '', result: null, runes: [] };
    saveToStorage({ ...cur, userQuestion: question });
  }, []);

  const setResult = useCallback((res: RunaResult | null) => {
    _setResult(res);
    const cur = loadFromStorage() || { userName: '', userQuestion: '', result: null, runes: [] };
    saveToStorage({ ...cur, result: res });
  }, []);

  const setRunes = useCallback((r: string[]) => {
    _setRunes(r);
    const cur = loadFromStorage() || { userName: '', userQuestion: '', result: null, runes: [] };
    saveToStorage({ ...cur, runes: r });
  }, []);
  const value: RunaContextType = {
    userName,
    setUserName,
    userQuestion,
    setUserQuestion,
    result,
    setResult,
    runes,
    setRunes,
  };
  return <RunaContext.Provider value={value}>{children}</RunaContext.Provider>;
};
