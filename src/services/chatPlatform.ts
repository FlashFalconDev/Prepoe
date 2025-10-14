/**
 * ChatPlatform API 服務模組
 * 
 * 詳細的使用注意事項請參考: src/services/README.md
 */

import { API_ENDPOINTS } from '../config/api';

// 從 cookie 獲取 CSRF token 的輔助函數
const getCSRFTokenFromCookie = (): string | null => {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'csrftoken' || name === 'csrf_token' || name === 'csrf-token') {
      return value;
    }
  }
  return null;
};

// 獲取 CSRF token 的函數
export const getCSRFToken = async (): Promise<string> => {
  let token = getCSRFTokenFromCookie();
  if (!token) {
    try {
      const response = await fetch(API_ENDPOINTS.CSRF, {
        credentials: 'include',
      });
      if (response.ok) {
        token = getCSRFTokenFromCookie();
      }
    } catch (error) {
      console.error('獲取 CSRF token 失敗:', error);
    }
  }
  return token || '';
};

export interface ChatPlatform {
  id: number;
  name: string;
  unique_code: string;
  description: string;
  is_active: boolean;
  total_sessions: number;
  total_messages: number;
  created_at: string;
  ai_assistant_id?: number | null; // 關聯的AI助手ID
  ai_assistant_name?: string | null; // 關聯的AI助手名稱
  owner_name?: string; // 平台擁有者名稱
  welcome_message?: string; // 歡迎訊息
}

export interface ChatSession {
  id: string;
  session_id: string;
  session_title: string;
  platform: {
    id: number;
    name: string;
    unique_code: string;
  };
  status: 'active' | 'waiting' | 'resolved' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  user_role: 'manager' | 'participant';
  manager_info?: {
    is_primary: boolean;
    can_intervene: boolean;
    can_assign: boolean;
    assigned_at: string;
    ai_takeover: boolean; // 新增 AI 接管狀態
  };
  total_messages: number;
  unread_messages: number;
  created_at: string;
  last_message_at: string;
  last_message: {
    content: string;
    sender_type: 'customer' | 'agent' | 'ai' | 'member' | 'system';
    created_at: string;
  };
  source_platform?: string; // 來源平台：line, facebook, instagram, web
  // 保持向後兼容的字段
  title: string;
  platform_id: number;
  timestamp: string;
  unread_count: number;
  is_ai_handling: boolean;
}

export interface ChatMessage {
  id: string;
  message?: string; // 保留向後兼容
  content?: string; // 新的主要字段
  message_type: 'text' | 'image' | 'file';
  sender_type: 'customer' | 'agent' | 'ai' | 'system';
  timestamp: string;
  self?: boolean; // 標記是否為自己的訊息
  is_read?: boolean; // 是否已讀
  created_at?: string; // 創建時間
}

export interface CreatePlatformRequest {
  name: string;
  description: string;
  ai_assistant_id?: number | null; // 可選的AI助手ID
  welcome_message?: string; // 歡迎訊息
}

export interface StartSessionRequest {
  platform_id: number;
  title: string;
}

export interface SendMessageRequest {
  session_id: string;
  message: string;
  message_type: 'text' | 'image' | 'file';
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface ApiError {
  success: false;
  error: string;
  error_code: string;
}



// // 獲取client_sid的函數
// const getClientSid = (): string => {
//   // 從localStorage或會話中獲取client_sid，如果沒有則從環境變數讀取
//   const clientSid = localStorage.getItem('client_sid') || import.meta.env.VITE_CLIENT_SID;
//   console.log('獲取到的client_sid:', clientSid);
//   return clientSid;
// };

// AI助手接口
export interface AIAssistant {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
}

// 更新平台信息
export const updatePlatform = async (platformId: number, updates: Partial<CreatePlatformRequest>): Promise<ApiResponse<ChatPlatform> | ApiError> => {
  try {
    console.log('開始調用 updatePlatform API...');
    console.log('平台ID:', platformId);
    console.log('更新數據:', updates);
    
    // 使用JSON格式，與雲端名片保持一致
    // 只傳遞有效的欄位，避免後端序列化器錯誤
    const jsonData: any = {};
    
    // 明確指定允許的欄位
    const allowedFields = ['name', 'description', 'ai_assistant_id', 'welcome_message'];
    
    allowedFields.forEach(field => {
      if (updates[field as keyof typeof updates] !== undefined) {
        jsonData[field] = updates[field as keyof typeof updates];
      }
    });
    
    // 確保不傳遞無效欄位
    console.log('🔍 過濾後的更新數據:', jsonData);
    
    console.log('使用 JSON 發送更新數據:');
    console.log('- name:', jsonData.name);
    console.log('- description:', jsonData.description);
    console.log('- ai_assistant_id:', jsonData.ai_assistant_id);
    console.log('- welcome_message:', jsonData.welcome_message);
    
    // 獲取CSRF令牌
    const csrfToken = getCSRFTokenFromCookie();
    if (!csrfToken) {
      console.error('CSRF token未找到，無法發送請求');
      return {
        success: false,
        error: 'CSRF token未找到，請刷新頁面重試',
        error_code: 'CSRF_TOKEN_MISSING'
      };
    }
    
    const url = `${API_ENDPOINTS.CHAT_PLATFORM_BASE}api/platforms/${platformId}/update/`;
    console.log('請求URL:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
        'X-CSRFToken': csrfToken
      },
      credentials: 'include',
      body: JSON.stringify(jsonData) // 使用JSON格式
    });

    console.log('響應狀態:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('API調用結果:', data);
    
    if (data.success) {
      return {
        success: true,
        data: data.data,
        message: data.message || '平台更新成功'
      };
    } else {
      // 檢查是否是序列化器錯誤
      if (data.message && data.message.includes('require_login')) {
        console.error('❌ 後端序列化器錯誤: require_login 欄位無效');
        return {
          success: false,
          error: '後端配置錯誤: 無效的欄位名稱。請聯繫管理員檢查後端配置。',
          error_code: 'SERIALIZER_ERROR'
        };
      }
      
      return {
        success: false,
        error: data.message || '平台更新失敗',
        error_code: data.error_code || 'UNKNOWN_ERROR'
      };
    }
  } catch (error) {
    console.error('更新平台失敗:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '網路錯誤',
      error_code: 'NETWORK_ERROR'
    };
  }
};

// 創建新平台
export const createPlatform = async (platformData: CreatePlatformRequest): Promise<ApiResponse<ChatPlatform> | ApiError> => {
  try {
    console.log('開始調用 createPlatform API...');
    console.log('平台數據:', platformData);
    
    // 生成唯一代碼
    const uniqueCode = `platform_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 使用JSON格式，與雲端名片保持一致
    const jsonData = {
      name: platformData.name,
      description: platformData.description,
      unique_code: uniqueCode,
      ai_assistant_id: platformData.ai_assistant_id || null,
      welcome_message: platformData.welcome_message || ''
    };
    
    console.log('使用 JSON 發送數據:');
    console.log('- name:', jsonData.name);
    console.log('- description:', jsonData.description);
    console.log('- unique_code:', jsonData.unique_code);
    console.log('- ai_assistant_id:', jsonData.ai_assistant_id);
    console.log('- welcome_message:', jsonData.welcome_message);
    
    // 獲取CSRF令牌
    const csrfToken = getCSRFTokenFromCookie();
    if (!csrfToken) {
      console.error('CSRF token未找到，無法發送請求');
      return {
        success: false,
        error: 'CSRF token未找到，請刷新頁面重試',
        error_code: 'CSRF_TOKEN_MISSING'
      };
    }
    
    const response = await fetch(API_ENDPOINTS.CHAT_PLATFORMS_CREATE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
        'X-CSRFToken': csrfToken
      },
      credentials: 'include',
      body: JSON.stringify(jsonData) // 使用JSON格式
    });

    console.log('響應狀態:', response.status);
    console.log('響應標頭:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('API調用結果:', data);
    
    if (data.success) {
      return {
        success: true,
        data: data.data,
        message: data.message || '平台創建成功'
      };
    } else {
      return {
        success: false,
        error: data.message || '平台創建失敗',
        error_code: data.error_code || 'UNKNOWN_ERROR'
      };
    }
  } catch (error) {
    console.error('創建平台失敗:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '網路錯誤',
      error_code: 'NETWORK_ERROR'
    };
  }
};

// 獲取我的平台列表
export const getMyPlatforms = async (): Promise<ApiResponse<ChatPlatform[]> | ApiError> => {
  try {
    console.log('開始調用 getMyPlatforms API...');
    
    // 不再需要client_sid參數
    const url = API_ENDPOINTS.CHAT_PLATFORMS_MY;
    console.log('請求URL:', url);
    
    // 獲取CSRF令牌
    const csrfToken = getCSRFTokenFromCookie();
    if (!csrfToken) {
      console.error('CSRF token未找到，無法發送請求');
      return {
        success: false,
        error: 'CSRF token未找到，請刷新頁面重試',
        error_code: 'CSRF_TOKEN_MISSING'
      };
    }
    
    // 使用與成功API完全相同的請求格式
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*', // 與成功API完全一致
        'X-CSRFToken': csrfToken // 添加CSRF令牌
      },
      // 關鍵：確保cookie被傳送
      credentials: 'include',
      // 不設置其他標頭，讓瀏覽器自動處理
    });

    console.log('響應狀態:', response.status);
    console.log('響應標頭:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('API調用結果:', data);
    
    if (data.success) {
      return {
        success: true,
        data: data.data || [],
        message: data.message || '獲取成功'
      };
    } else {
      return {
        success: false,
        error: data.message || '獲取失敗',
        error_code: data.error_code || 'UNKNOWN_ERROR'
      };
    }
  } catch (error) {
    console.error('獲取平台列表失敗:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '網路錯誤',
      error_code: 'NETWORK_ERROR'
    };
  }
};

// 獲取我參與的平台
export const getParticipatedPlatforms = async (): Promise<ApiResponse<ChatPlatform[]> | ApiError> => {
  try {
    const response = await fetch(API_ENDPOINTS.CHAT_PLATFORMS_PARTICIPATED, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('獲取參與平台失敗:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '獲取參與平台失敗',
      error_code: 'NETWORK_ERROR'
    };
  }
};

// 獲取平台統計資訊
export const getPlatformStats = async (platformId: number): Promise<ApiResponse<any> | ApiError> => {
  try {
    const response = await fetch(API_ENDPOINTS.CHAT_PLATFORM_STATS(platformId), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('獲取平台統計失敗:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '獲取平台統計失敗',
      error_code: 'NETWORK_ERROR'
    };
  }
};

// 匯出平台資料
export const exportPlatformData = async (platformId: number): Promise<Blob | null> => {
  try {
    const response = await fetch(API_ENDPOINTS.CHAT_PLATFORM_EXPORT(platformId), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.error('匯出平台資料失敗:', error);
    return null;
  }
};

// 開始新對話
export const startNewSession = async (request: StartSessionRequest): Promise<ApiResponse<any> | ApiError> => {
  try {
    const response = await fetch(API_ENDPOINTS.CHAT_SESSION_START, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRFToken': await getCSRFToken(),
      },
      body: JSON.stringify(request)
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('開始對話失敗:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '開始對話失敗',
      error_code: 'NETWORK_ERROR'
    };
  }
};

// 發送訊息
export const sendMessage = async (request: SendMessageRequest): Promise<ApiResponse<any> | ApiError> => {
  try {
    const response = await fetch(API_ENDPOINTS.CHAT_MESSAGE_SEND, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRFToken': await getCSRFToken(),
      },
      body: JSON.stringify(request)
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('發送訊息失敗:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '發送訊息失敗',
      error_code: 'NETWORK_ERROR'
    };
  }
};

// 獲取對話訊息
export const getMessages = async (sessionId: string): Promise<ApiResponse<ChatMessage[]> | ApiError> => {
  try {
    const response = await fetch(API_ENDPOINTS.CHAT_MESSAGES_GET(sessionId), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('獲取訊息失敗:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '獲取訊息失敗',
      error_code: 'NETWORK_ERROR'
    };
  }
};

// 管理者介入對話
export const managerIntervene = async (sessionId: string, message: string): Promise<ApiResponse<any> | ApiError> => {
  try {
    const response = await fetch(API_ENDPOINTS.MANAGER_INTERVENE, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRFToken': await getCSRFToken(),
      },
      body: JSON.stringify({
        session_id: sessionId,
        message: message
      })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('管理者介入失敗:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '管理者介入失敗',
      error_code: 'NETWORK_ERROR'
    };
  }
};

// 分配對話會話
export const assignSession = async (sessionId: string, agentId: number): Promise<ApiResponse<any> | ApiError> => {
  try {
    const response = await fetch(API_ENDPOINTS.MANAGER_ASSIGN_SESSION, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRFToken': await getCSRFToken(),
      },
      body: JSON.stringify({
        session_id: sessionId,
        agent_id: agentId
      })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('分配會話失敗:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '分配會話失敗',
      error_code: 'NETWORK_ERROR'
    };
  }
};

// 生成唯一代碼
export const generateUniqueCode = async (): Promise<ApiResponse<string> | ApiError> => {
  try {
    const response = await fetch(API_ENDPOINTS.TOOLS_GENERATE_CODE, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRFToken': await getCSRFToken(),
      },
      body: JSON.stringify({})
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('生成唯一代碼失敗:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '生成唯一代碼失敗',
      error_code: 'NETWORK_ERROR'
    };
  }
};

// 驗證唯一代碼
export const validateUniqueCode = async (code: string): Promise<ApiResponse<boolean> | ApiError> => {
  try {
    const response = await fetch(API_ENDPOINTS.TOOLS_VALIDATE_CODE(code), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('驗證唯一代碼失敗:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '驗證唯一代碼失敗',
      error_code: 'NETWORK_ERROR'
    };
  }
};

// 下載檔案輔助函數
export const downloadFile = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}; 

/**
 * 獲取管理的會話
 * 獲取當前用戶作為管理者管理的所有對話會話
 */
export const getManagedSessions = async (): Promise<ApiResponse<{
  total_sessions: number;
  sessions: ChatSession[];
}>> => {
  try {
    const response = await fetch(API_ENDPOINTS.SESSIONS_MANAGED, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': await getCSRFToken(),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('獲取管理的會話失敗:', error);
    throw error;
  }
};

/**
 * 獲取所有相關會話
 * 獲取當前用戶相關的所有對話會話（包括管理的和參與的）
 */
export const getRelatedSessions = async (): Promise<ApiResponse<{
  total_sessions: number;
  sessions: ChatSession[];
}>> => {
  try {
    const response = await fetch(API_ENDPOINTS.SESSIONS_RELATED, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': await getCSRFToken(),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('獲取相關會話失敗:', error);
    throw error;
  }
};

/**
 * 切換 AI 接管狀態
 * 啟用或禁用指定會話的 AI 接管功能
 */
export const toggleAITakeover = async (sessionId: string, aiTakeover: boolean): Promise<ApiResponse<any> | ApiError> => {
  try {
    console.log('開始調用 toggleAITakeover API...');
    console.log('會話ID:', sessionId);
    console.log('AI接管狀態:', aiTakeover);
    
    // 獲取CSRF令牌
    const csrfToken = getCSRFTokenFromCookie();
    if (!csrfToken) {
      console.error('CSRF token未找到，無法發送請求');
      return {
        success: false,
        error: 'CSRF token未找到，請刷新頁面重試',
        error_code: 'CSRF_TOKEN_MISSING'
      };
    }
    
    const url = `${API_ENDPOINTS.CHAT_PLATFORM_BASE}api/managers/toggle_ai_takeover/${sessionId}/`;
    console.log('請求URL:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
        'X-CSRFToken': csrfToken
      },
      credentials: 'include',
      body: JSON.stringify({ ai_takeover: aiTakeover })
    });

    console.log('響應狀態:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('API調用結果:', data);
    
    if (data.success) {
      return {
        success: true,
        data: data.data,
        message: data.message || 'AI接管狀態更新成功'
      };
    } else {
      return {
        success: false,
        error: data.message || 'AI接管狀態更新失敗',
        error_code: data.error_code || 'UNKNOWN_ERROR'
      };
    }
  } catch (error) {
    console.error('切換AI接管狀態失敗:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '網路錯誤',
      error_code: 'NETWORK_ERROR'
    };
  }
}; 