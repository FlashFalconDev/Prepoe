import axios from "axios";
import { useEffect, useState } from 'react';

/**
 * API 配置文件
 * 
 * 重要說明：
 * ===========
 * 
 * 1. CSRF Token 處理
 *    - 所有 POST/PUT/DELETE/PATCH 請求都需要 CSRF token
 *    - 自動處理 token 獲取、設置和重試
 *    - 支持多種 cookie 名稱格式
 * 
 * 2. 跨域設置
 *    - withCredentials: true 確保攜帶 cookies
 *    - 支持開發和生產環境的不同配置
 * 
 * 3. 錯誤處理
 *    - 401: 未授權，需要重新登入
 *    - 403: CSRF 錯誤，自動重試
 *    - 其他: 記錄詳細錯誤信息
 * 
 * 4. 常見問題排查
 *    - CSRF token 過期：刷新頁面或重新登入
 *    - Cookie 問題：檢查瀏覽器設置
 *    - 跨域問題：檢查後端 CORS 設置
 * 
 * 5. 開發建議
 *    - 不要手動處理 CSRF token，讓攔截器自動處理
 *    - 如果遇到 403 錯誤，先檢查日誌再手動刷新
 *    - 定期檢查 token 有效性
 */

// 動態切換 API baseURL
export const getApiBase = () => {
  if (import.meta.env.MODE === 'development') {
    return 'https://host.flashfalcon.info';
  }
  
  // 生產環境：使用相對路徑，讓服務器處理代理
  return 'https://www.flashfalcon.info';
};

export const API_BASE = getApiBase();

// 動態切換應用程式 baseURL (用於複製連結等功能)
export const getAppBase = () => {
  // 優先使用環境變數 VITE_APP_URL
  if (import.meta.env.VITE_APP_URL) {
    return import.meta.env.VITE_APP_URL;
  }
  
  // 如果沒有設置環境變數，則使用預設值
  if (import.meta.env.MODE === 'development') {
    return 'https://react.flashfalcon.info'; // 開發環境
  }
  
  // 生產環境：使用正式域名
  return 'https://prepoe.flashfalcon.info';
};

export const APP_BASE = getAppBase();

// 建立聊天連結
export const createChatUrl = (code: string): string => {
  return `${APP_BASE}/client/chat/${code}`;
};

// 建立名片連結  
export const createCardUrl = (slug: string): string => {
  return `${APP_BASE}/card/${slug}`;
};

// 建立活動報名連結
export const createEventJoinUrl = (sku: string, referrerId?: number): string => {
  // 使用完整 URL 讓使用者可以複製完整連結
  const baseUrl = `${APP_BASE}/client/event/join/${sku}`;

  // 如果提供 referrerId，則加入查詢參數
  if (referrerId !== undefined) {
    return `${baseUrl}?referrer=${referrerId}`;
  }

  return baseUrl;
};

export const API_ENDPOINTS = {
  TEXT_MODEL_LIST: `${API_BASE}/aigen/api/get_model_list/text/`,
  VOICE_MODEL_LIST: `${API_BASE}/aigen/api/voice_model_list/`,
  VIDEO_MODEL_LIST: `${API_BASE}/aigen/api/video_model_list/`,
  UPLOAD_WAV: `${API_BASE}/aigen/api/upload_wav/`,
  UPLOAD_VIDEO: `${API_BASE}/aigen/api/upload_video/`,
  GENERATE_TARGET_TEXT: `${API_BASE}/aigen/api/generate_target_text/`,
  CREATE_VIDEO_GENERATION: `${API_BASE}/aigen/api/create_video_generation/`,
  VIDEO_GENERATION_LIST: `${API_BASE}/aigen/api/video_generation_list/`,
  // 音頻生成記錄相關 API
  AUDIO_GENERATION_LIST: `${API_BASE}/aigen/api/sound_clone_list/`,
  AUDIO_GENERATION_DETAIL: (audioId: number) => `${API_BASE}/aigen/api/sound_clone_detail/${audioId}/`,
  
  // 影片生成相關 API
  VIDEO_GENERATION_WITH_IMAGE_CREATE: `${API_BASE}/aigen/api/create_video_generation_with_image/`,
  VIDEO_GENERATION_WITH_IMAGE_LIST: `${API_BASE}/aigen/api/video_generation_with_image_list/`,
  VIDEO_GENERATION_WITH_IMAGE_DETAIL: (videoId: number) => `${API_BASE}/aigen/api/video_generation_with_image_detail/${videoId}/`,

  // 字幕合成 API
  SUBTITLE_BURN: (videoId: number) => `${API_BASE}/aigen/api/subtitle/burn/${videoId}/`,

  // 會員相關 API
  CSRF: `${API_BASE}/api/csrf/`,
  LOGIN: `${API_BASE}/api/login/`,
  LOGOUT: `${API_BASE}/api/logout/`,
  PROTECTED: `${API_BASE}/api/protected/`,
  FEATURE_FLAG: `${API_BASE}/api/feature_flag/`,
  // 第三方登入相關 API
  GOOGLE_LOGIN: `${API_BASE}/api/auth/google/`,
  LINE_LOGIN: `${API_BASE}/api/auth/line/`,
  FACEBOOK_LOGIN: `${API_BASE}/api/auth/facebook/`,
  APPLE_LOGIN: `${API_BASE}/api/auth/apple/`,
  THIRD_PARTY_CALLBACK: `${API_BASE}/api/auth/callback/`,
  THIRD_PARTY_CALLBACK_WITH_PROVIDER: (provider: string) => `${API_BASE}/api/auth/callback/${provider}/`,
  BUSINESS_CARD: `${API_BASE}/pp/api/business_card/`,
  SAVE_BUSINESS_CARD: `${API_BASE}/pp/api/save-profile/`,
  PUBLIC_BUSINESS_CARD: (slug: string) => `${API_BASE}/pp/api/get_business_card/${slug}/`,
  SAVE_LINK: `${API_BASE}/pp/api/save-link/`,
  DELETE_LINK: (linkId: number) => `${API_BASE}/pp/api/delete-link/${linkId}/`,
  // 文章相關 API
  ARTICLES: `${API_BASE}/article/api/articles/`,
  ARTICLE_CREATE: `${API_BASE}/article/api/articles/create/`,
  ARTICLE_DETAIL: (id: number) => `${API_BASE}/article/api/articles/${id}/`,
  ARTICLES_ALL: `${API_BASE}/article/api/articles_all/`,
  ARTICLE_UPDATE: (id: number) => `${API_BASE}/article/api/articles/${id}/update/`,
  ARTICLE_DELETE: (id: number) => `${API_BASE}/article/api/articles/${id}/delete/`,
  ARTICLE_LIKE: (id: number) => `${API_BASE}/article/api/articles/${id}/like/`,
  ARTICLE_COMMENTS: (id: number) => `${API_BASE}/article/api/articles/${id}/comments/`,
  ARTICLE_ADD_COMMENT: (id: number) => `${API_BASE}/article/api/articles/${id}/comments/add/`,
  PUBLIC_ARTICLE: (slug: string) => `${API_BASE}/article/public/articles/${slug}/`,
  TAGS: `${API_BASE}/article/api/tags/`,
  UPLOAD_MEDIA: `${API_BASE}/article/api/upload-media/`,
  UPLOAD_FILE: `${API_BASE}/api/upload_file/`,

  // AI客服相關 API
  AI_ASSISTANTS: `${API_BASE}/airag/api/assistants/`,
  AI_ASSISTANT_CREATE: `${API_BASE}/airag/api/assistants/create/`,
  AI_ASSISTANT_DETAIL: (id: number) => `${API_BASE}/airag/api/assistants/${id}/`,
  AI_ASSISTANT_UPDATE: (id: number) => `${API_BASE}/airag/api/assistants/${id}/update/`,
  AI_ASSISTANT_DELETE: (id: number) => `${API_BASE}/airag/api/assistants/${id}/delete/`,
  
  // AI助理檔案相關 API
  AI_ASSISTANT_DOCUMENTS: (assistantId: number) => `${API_BASE}/airag/api/assistants/${assistantId}/documents/`,
  AI_ASSISTANT_DOCUMENT_CREATE: (assistantId: number) => `${API_BASE}/airag/api/assistants/${assistantId}/documents/create/`,
  AI_ASSISTANT_DOCUMENT_DETAIL: (assistantId: number, documentId: number) => `${API_BASE}/airag/api/assistants/${assistantId}/documents/${documentId}/`,
  AI_ASSISTANT_DOCUMENT_UPDATE: (assistantId: number, documentId: number) => `${API_BASE}/airag/api/assistants/${assistantId}/documents/${documentId}/update/`,
  AI_ASSISTANT_DOCUMENT_DELETE: (assistantId: number, documentId: number) => `${API_BASE}/airag/api/assistants/${assistantId}/documents/${documentId}/delete/`,
  
  // 對話相關 API
  AI_CONVERSATIONS: (assistantId: number) => `${API_BASE}/airag/api/assistants/${assistantId}/conversations/`,
  AI_CONVERSATION_CREATE: (assistantId: number) => `${API_BASE}/airag/api/assistants/${assistantId}/conversations/create/`,
  AI_CONVERSATION_DETAIL: (assistantId: number, conversationId: number) => `${API_BASE}/airag/api/assistants/${assistantId}/conversations/${conversationId}/`,
  AI_MESSAGE_SEND: (assistantId: number, conversationId: number) => `${API_BASE}/airag/api/assistants/${assistantId}/conversations/${conversationId}/send/`,
  
  // 客服對話相關 API
  CHAT_CHECK_NEW: (sessionId: string) => `${API_BASE}/chatplatform/api/chat/check_new/${sessionId}/`,
  
  // ChatPlatform 相關 API
  CHAT_PLATFORM_BASE: `${API_BASE}/chatplatform/`,
  CHAT_PLATFORMS_MY: `${API_BASE}/chatplatform/api/platforms/my_platforms/`,
  CHAT_PLATFORMS_CREATE: `${API_BASE}/chatplatform/api/platforms/create/`,
  CHAT_PLATFORMS_MY_ALT: `${API_BASE}/chatplatform/api/platforms/my-platforms/`,
  CHAT_PLATFORMS_MY_ALT2: `${API_BASE}/chatplatform/api/platforms/my_platforms`,
  CHAT_PLATFORMS_MY_ALT3: `${API_BASE}/chatplatform/platforms/my_platforms/`,
  CHAT_PLATFORMS_PARTICIPATED: `${API_BASE}/chatplatform/api/platforms/participated/`,
  CHAT_PLATFORM_STATS: (platformId: number) => `${API_BASE}/chatplatform/api/platforms/${platformId}/stats/`,
  CHAT_PLATFORM_EXPORT: (platformId: number) => `${API_BASE}/chatplatform/api/platforms/${platformId}/export/`,
  CHAT_SESSION_START: `${API_BASE}/chatplatform/api/chat/start_session/`,
  CHAT_MESSAGE_SEND: `${API_BASE}/chatplatform/api/chat/send_message/`,
  CHAT_MESSAGES_GET: (sessionId: string) => `${API_BASE}/chatplatform/api/chat/get_messages/${sessionId}/`,
  MANAGER_INTERVENE: `${API_BASE}/chatplatform/api/managers/intervene/`,
  MANAGER_ASSIGN_SESSION: `${API_BASE}/chatplatform/api/managers/assign_session/`,
  TOOLS_GENERATE_CODE: `${API_BASE}/chatplatform/api/tools/generate_code/`,
  TOOLS_VALIDATE_CODE: (code: string) => `${API_BASE}/chatplatform/api/tools/validate_code/${code}/`,
  
  // 新的會話管理 API
  SESSIONS_MANAGED: `${API_BASE}/chatplatform/api/sessions/managed/`,
  SESSIONS_RELATED: `${API_BASE}/chatplatform/api/sessions/related/`,
  
  // 統計相關 API
  AI_STATISTICS: `${API_BASE}/airag/api/statistics/`,
  
  // 向量化相關 API
  VECTOR_STORE_CREATE: `${API_BASE}/airag/api/vector-store/create/`,
  
  // 聊天相關 API
  CHAT: `${API_BASE}/airag/api/chat/`,
  
  // 導師專區相關 API
  BUSINESS_CARD_APPROVE: `${API_BASE}/pp/api/business_card_approve/`,
  
  // LINE相關 API
  LINE_CREATE_BOT: `${API_BASE}/line/api/create_bot/`,
  LINE_MANAGED_CONTENT: `${API_BASE}/line/api/managed_content/`,
  LINE_UPDATE_BOT: (botId: string) => `${API_BASE}/line/api/update_bot/${botId}/`,
  
  // Rich Menu API
  RICH_MENUS: `${API_BASE}/line/api/rich-menus/`,
  RICH_MENU_CREATE: `${API_BASE}/line/api/rich-menus/create/`,
  RICH_MENU_UPDATE: (menuId: number) => `${API_BASE}/line/api/rich-menus/${menuId}/update/`,
  RICH_MENU_UPDATE_AREAS: (menuId: number) => `${API_BASE}/line/api/rich-menus/${menuId}/update-areas/`,
  RICH_MENU_DEPLOY: (menuId: number) => `${API_BASE}/line/api/rich-menus/${menuId}/deploy/`,
  RICH_MENU_DELETE: (menuId: number) => `${API_BASE}/line/api/rich-menus/${menuId}/delete/`,
  RICH_MENU_TEMPLATES: `${API_BASE}/line/api/rich-menus/templates/`,
  
  // ==================== ItemEvent 活動管理系統 API ====================
  
  // EventModule CRUD API
  EVENT_MODULES: `${API_BASE}/itemevent/api/modules/`,
  EVENT_MODULE_DETAIL: (moduleId: number) => `${API_BASE}/itemevent/api/modules/${moduleId}/`,
  EVENT_MODULE_CREATE: `${API_BASE}/itemevent/api/modules/create/`,
  EVENT_MODULE_UPDATE: (moduleId: number) => `${API_BASE}/itemevent/api/modules/${moduleId}/`,
  EVENT_MODULE_DELETE: (moduleId: number) => `${API_BASE}/itemevent/api/modules/${moduleId}/`,

  // 視圖內容相關 API (未來實作)
  VIEW_CONTENT: `${API_BASE}/api/view_content/`,
  
  // EventItem CRUD API
  EVENT_ITEMS: `${API_BASE}/itemevent/api/events/`,
  EVENT_ITEM_DETAIL: (eventId: number) => `${API_BASE}/itemevent/api/events/${eventId}/detail/`,
  EVENT_ITEM_CREATE: `${API_BASE}/itemevent/api/events/create/`,
  EVENT_ITEM_UPDATE: (eventId: number) => `${API_BASE}/itemevent/api/events/${eventId}/update/`,
  EVENT_ITEM_DELETE: (eventId: number) => `${API_BASE}/itemevent/api/events/${eventId}/delete/`,

  // ItemImage CRUD API（活動其他圖片管理）
  EVENT_IMAGES: (eventId: number) => `${API_BASE}/itemevent/api/events/${eventId}/images/`,
  EVENT_IMAGE_CREATE: (eventId: number) => `${API_BASE}/itemevent/api/events/${eventId}/images/create/`,
  EVENT_IMAGE_UPDATE: (imageId: number) => `${API_BASE}/itemevent/api/images/${imageId}/update/`,
  EVENT_IMAGE_DELETE: (imageId: number) => `${API_BASE}/itemevent/api/images/${imageId}/delete/`,
  EVENT_IMAGE_REORDER: (eventId: number) => `${API_BASE}/itemevent/api/events/${eventId}/images/reorder/`,

  // EventModuleAssignment CRUD API
  EVENT_MODULE_ASSIGNMENTS: (eventId: number) => `${API_BASE}/itemevent/api/events/${eventId}/modules/`,
  EVENT_MODULE_ASSIGNMENT_CREATE: (eventId: number) => `${API_BASE}/itemevent/api/events/${eventId}/modules/create/`,
  EVENT_MODULE_ASSIGNMENT_DETAIL: (assignmentId: number) => `${API_BASE}/itemevent/api/module-assignments/${assignmentId}/`,
  EVENT_MODULE_ASSIGNMENT_UPDATE: (assignmentId: number) => `${API_BASE}/itemevent/api/module-assignments/${assignmentId}/`,
  EVENT_MODULE_ASSIGNMENT_DELETE: (assignmentId: number) => `${API_BASE}/itemevent/api/module-assignments/${assignmentId}/`,
  
  // EventOrderDetail CRUD API
  EVENT_ORDERS: (eventId: number) => `${API_BASE}/itemevent/api/events/${eventId}/orders/`,

  // 訂單創建 API（用於活動報名支付）
  CREATE_ORDER: `${API_BASE}/item/api/create_order/`,
  
  // EventParticipant CRUD API
  EVENT_PARTICIPANTS: (eventId: number) => `${API_BASE}/itemevent/api/events/${eventId}/participants/`,
  EVENT_PARTICIPANT_DETAIL: (participantId: number) => `${API_BASE}/itemevent/api/participants/${participantId}/`,
  EVENT_PARTICIPANT_CHECKIN: (participantId: number) => `${API_BASE}/itemevent/api/participants/${participantId}/checkin/`,
  EVENT_PARTICIPANT_BY_CODE: (bindingCode: string) => `${API_BASE}/itemevent/api/participants/code/${bindingCode}/`,
  
  // EventStatistics API
  
  // 活動報名相關 API
  EVENT_JOIN_INFO: (sku: string) => `${API_BASE}/itemevent/api/events_sku/${sku}/`,
  EVENT_REGISTRATION_SUBMIT: (sku: string) => `${API_BASE}/itemevent/api/events_sku/${sku}/join/`,
  // 活動列表 API（不篩查使用者）
  EVENT_SKU_LIST: () => `${API_BASE}/itemevent/api/events_sku/`,
  EVENT_STATISTICS: (eventId: number) => `${API_BASE}/itemevent/api/events/${eventId}/statistics/`,
  EVENT_STATISTICS_REFRESH: (eventId: number) => `${API_BASE}/itemevent/api/events/${eventId}/statistics/refresh/`,

  // 表單欄位 API
  EVENT_FORM_FIELDS_BATCH_CREATE: (eventId: number) => `${API_BASE}/itemevent/api/events/${eventId}/form-fields/batch-create/`,
  EVENT_FORM_FIELDS_SYNC: (eventId: number) => `${API_BASE}/itemevent/api/events/${eventId}/form-fields/sync/`,
  EVENT_FORM_FIELDS_GET: (eventId: number) => `${API_BASE}/itemevent/api/events/${eventId}/form-fields/`,

  // 推薦訂單 API
  REFERRER_ORDERS: `${API_BASE}/item/api/referrer_order/`,
  // 我的訂單 API
  MY_ORDERS: `${API_BASE}/itemevent/api/events/my_order/`,

  // 付款相關 API
  PAY_ORDER: (orderPk: number, paymentMethod: string) => `${API_BASE}/item/api/pay_order/${orderPk}/${paymentMethod}/`,

  // Public Event API
  PUBLIC_EVENT_DETAIL: (eventId: number) => `${API_BASE}/itemevent/api/public/events/${eventId}/`,
  PUBLIC_EVENT_SEARCH: `${API_BASE}/itemevent/api/public/events/search/`,
  
  // ==================== Survey 問卷管理系統 API ====================
  
  // Survey CRUD API
  SURVEY_LIST: `${API_BASE}/survey/api/surveys/`,
  SURVEY_CREATE: `${API_BASE}/survey/api/surveys/create/`,
  SURVEY_DETAIL: (surveyId: number) => `${API_BASE}/survey/api/surveys/${surveyId}/`,
  SURVEY_UPDATE: (surveyId: number) => `${API_BASE}/survey/api/surveys/${surveyId}/update/`,
  SURVEY_DELETE: (surveyId: number) => `${API_BASE}/survey/api/surveys/${surveyId}/delete/`,
  
  // Section CRUD API
  SECTION_CREATE: (surveyId: number) => `${API_BASE}/survey/api/surveys/${surveyId}/sections/create/`,
  SECTION_UPDATE: (sectionId: number) => `${API_BASE}/survey/api/sections/${sectionId}/update/`,
  SECTION_DELETE: (sectionId: number) => `${API_BASE}/survey/api/sections/${sectionId}/delete/`,
  
  // Question CRUD API
  QUESTION_CREATE: (surveyId: number) => `${API_BASE}/survey/api/surveys/${surveyId}/questions/create/`,
  QUESTION_UPDATE: (questionId: number) => `${API_BASE}/survey/api/questions/${questionId}/update/`,
  QUESTION_DELETE: (questionId: number) => `${API_BASE}/survey/api/questions/${questionId}/delete/`,
  
  // Choice CRUD API
  CHOICE_CREATE: (questionId: number) => `${API_BASE}/survey/api/questions/${questionId}/choices/create/`,
  CHOICE_UPDATE: (choiceId: number) => `${API_BASE}/survey/api/choices/${choiceId}/update/`,
  CHOICE_DELETE: (choiceId: number) => `${API_BASE}/survey/api/choices/${choiceId}/delete/`,
  
  // Submission CRUD API
  SUBMISSION_CREATE: (surveyId: number) => `${API_BASE}/survey/api/surveys/${surveyId}/submissions/create/`,
  SUBMISSION_COMPLETE: (submissionId: number) => `${API_BASE}/survey/api/submissions/${submissionId}/complete/`,
  SUBMISSION_LIST: (surveyId: number) => `${API_BASE}/survey/api/surveys/${surveyId}/submissions/`,
  
  // Answer CRUD API
  ANSWER_CREATE: (submissionId: number) => `${API_BASE}/survey/api/submissions/${submissionId}/answers/create/`,
  ANSWER_UPDATE: (answerId: number) => `${API_BASE}/survey/api/answers/${answerId}/update/`,
  
  // Analytics API
  SURVEY_ANALYTICS: (surveyId: number) => `${API_BASE}/survey/api/surveys/${surveyId}/analytics/`,
  
  // Rules API
  VISIBILITY_RULE_CREATE: `${API_BASE}/survey/api/visibility-rules/create/`,
  SKIP_RULE_CREATE: `${API_BASE}/survey/api/skip-rules/create/`,
  
  // ==================== CRM 會員管理系統 API ====================
  
  // 會員卡相關 API
  MEMBER_CARD: `${API_BASE}/crm/api/member-card/`,
  MEMBER_CARD_BY_ID: (cardId: string) => `${API_BASE}/crm/api/member-card/${cardId}/`,
  
  // 會員詳細資料相關 API
  MEMBER_DETAILS: `${API_BASE}/crm/api/member-details/`,
  MEMBER_DETAILS_UPDATE: `${API_BASE}/crm/api/member-details/update/`,
  
  // 完整會員資料 API
  MEMBER_COMPLETE: `${API_BASE}/crm/api/member-complete/`,

  // ==================== Keys 金鑰模組 API ====================
  KEYS_BATCH_CREATE: `${API_BASE}/keys/api/batches/create/`,
  KEYS_BATCH_LIST: `${API_BASE}/keys/api/batches/`,
  KEYS_BATCH_DETAIL: (batchId: number) => `${API_BASE}/keys/api/batches/${batchId}/`,
  KEYS_BATCH_EXPORT: (batchId: number) => `${API_BASE}/keys/api/batches/${batchId}/export/`,
  KEYS_REDEEM: `${API_BASE}/keys/api/redeem/`,
  KEYS_REDEMPTIONS: `${API_BASE}/keys/api/redemptions/`,
  KEYS_MARK_USED: (batchId: number) => `${API_BASE}/keys/api/batches/${batchId}/mark-used/`,
  
  // ==================== AI 模組配置 API ====================
  AI_MODULES: `${API_BASE}/ai/api/get_AI_modules/`,
} as const;

// 調試信息
console.log('API Configuration:', {
  mode: import.meta.env.MODE,
  currentHost: typeof window !== 'undefined' ? window.location.hostname : 'server-side',
  apiBase: API_BASE,
  endpoints: Object.keys(API_ENDPOINTS).length
});

// 建立 axios 實例，預設帶 cookie（等同 fetch 的 credentials: 'include'）
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // 這個很重要！確保跨域請求時攜帶 cookies
});

/**
 * CSRF Token 處理說明：
 * 
 * Django 後端使用 CSRF 保護，所有 POST/PUT/DELETE/PATCH 請求都需要 CSRF token
 * 
 * 常見問題：
 * 1. CSRF token 過期：會返回 403 Forbidden 錯誤
 * 2. Cookie 名稱不匹配：不同環境可能使用不同的 cookie 名稱
 * 3. 跨域問題：需要設置 withCredentials: true
 * 
 * 解決方案：
 * 1. 自動重試：遇到 403 錯誤時自動重新獲取 token 並重試
 * 2. 多種 cookie 名稱：支持 csrftoken, csrf_token, csrf-token
 * 3. 詳細日誌：記錄 token 獲取和設置過程
 * 
 * 如果仍然遇到問題：
 * - 檢查瀏覽器是否啟用 cookies
 * - 嘗試刷新頁面重新獲取 token
 * - 檢查後端 CSRF 設置是否正確
 */
// 添加請求攔截器來自動添加CSRF token
api.interceptors.request.use(
  async (config) => {
    // 對於GET請求，添加client_sid參數
    if (config.method?.toLowerCase() === 'get') {
      const clientSid = import.meta.env.VITE_CLIENT_SID;
      if (clientSid) {
        // 如果已經有params，則合併；否則創建新的params
        config.params = {
          ...config.params,
          client_sid: clientSid
        };
        console.log('添加client_sid到GET請求:', clientSid, 'URL:', config.url);
      }
    }
    
    // 對於POST、PUT、DELETE等需要CSRF token的請求
    if (['post', 'put', 'delete', 'patch'].includes(config.method?.toLowerCase() || '')) {
      // 嘗試從cookie獲取CSRF token
      let csrfToken = getCSRFTokenFromCookie();
      
      // 如果沒有CSRF token，嘗試從服務器獲取
      if (!csrfToken) {
        try {
          console.log('嘗試獲取CSRF token...');
          const response = await api.get(API_ENDPOINTS.CSRF);
          csrfToken = getCSRFTokenFromCookie();
          console.log('CSRF token獲取成功:', csrfToken ? '已設置' : '未設置');
        } catch (error) {
          console.error('獲取CSRF token失敗:', error);
        }
      }
      
      // 設置CSRF token到請求頭
      if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
        console.log('設置CSRF token到請求頭:', csrfToken.substring(0, 10) + '...');
      } else {
        console.warn('無法獲取CSRF token，請求可能會失敗');
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * 響應攔截器 - 錯誤處理
 * 
 * 主要處理：
 * 1. 401 未授權：可能需要重新登入
 * 2. 403 CSRF 錯誤：自動清除舊 token 並重新獲取，然後重試請求
 * 3. 其他錯誤：記錄詳細錯誤信息
 * 
 * 注意：CSRF token 重試邏輯在這裡處理，避免在業務代碼中重複處理
 */
// 添加響應攔截器來處理錯誤
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error('=== API Error 詳細資訊 ===');
    console.error('URL:', error.config?.url);
    console.error('Method:', error.config?.method);
    console.error('Status:', error.response?.status);
    console.error('錯誤訊息:', error.response?.data);
    console.error('完整錯誤:', error);

    if (error.response?.status === 401) {
      // 未授權,可能需要重新登入
      console.error('❌ 401 未授權錯誤 - 需要重新登入或授權失敗');
      console.error('後端回應:', error.response?.data);
    } else if (error.response?.status === 403) {
      // CSRF token錯誤，嘗試重新獲取
      console.error('CSRF token錯誤，嘗試重新獲取...');
      
      // 清除舊的CSRF token
      document.cookie = 'csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
      try {
        // 重新獲取CSRF token
        await api.get(API_ENDPOINTS.CSRF);
        console.log('CSRF token重新獲取成功');
        
        // 重試原始請求
        const originalRequest = error.config;
        if (originalRequest) {
          const csrfToken = getCSRFTokenFromCookie();
          if (csrfToken) {
            originalRequest.headers['X-CSRFToken'] = csrfToken;
            console.log('重試請求，使用新的CSRF token');
            return api(originalRequest);
          }
        }
      } catch (retryError) {
        console.error('重新獲取CSRF token失敗:', retryError);
      }
    }
    
    return Promise.reject(error);
  }
);

/**
 * 從 Cookie 中獲取 CSRF Token
 * 
 * 支持多種可能的 cookie 名稱：
 * - csrftoken (Django 默認)
 * - csrf_token (某些配置)
 * - csrf-token (某些框架)
 * 
 * 返回：CSRF token 字符串或 null
 */
// 取得 cookie 裡的 csrftoken
function getCSRFTokenFromCookie() {
  // 嘗試多種可能的 cookie 名稱
  const possibleNames = ['csrftoken', 'csrf_token', 'csrf-token'];
  
  for (const name of possibleNames) {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.startsWith(name + '=')) {
        const token = decodeURIComponent(cookie.substring(name.length + 1));
        console.log(`找到CSRF token (${name}):`, token ? token.substring(0, 10) + '...' : 'null');
        return token;
      }
    }
  }
  
  console.log('未找到CSRF token');
  return null;
}

// 認證相關 API 呼叫函式
export const getCSRFToken = () => api.get(API_ENDPOINTS.CSRF);

/**
 * 手動刷新 CSRF Token
 * 
 * 使用場景：
 * 1. 頁面載入時預先獲取 token
 * 2. 用戶操作前主動刷新 token
 * 3. 遇到 CSRF 錯誤時手動重試
 * 
 * 注意：通常不需要手動調用，攔截器會自動處理
 * 但在某些特殊情況下（如長時間閒置後）可能需要手動刷新
 */
// 手動刷新CSRF token
export const refreshCSRFToken = async () => {
  try {
    console.log('手動刷新CSRF token...');
    const response = await api.get(API_ENDPOINTS.CSRF);
    const token = getCSRFTokenFromCookie();
    console.log('CSRF token刷新成功:', token ? '已設置' : '未設置');
    return token;
  } catch (error) {
    console.error('刷新CSRF token失敗:', error);
    return null;
  }
};

export const login = (username: string, password: string) =>
  api.post(API_ENDPOINTS.LOGIN, { username, password });
export const logout = () => api.post(API_ENDPOINTS.LOGOUT);
export const getProtectedData = (referrer?: string | number) => {
  // 如果提供 referrer，則加入查詢參數
  const params = referrer ? { referrer: String(referrer) } : {};
  return api.get(API_ENDPOINTS.PROTECTED, { params });
};
export const getFeatureFlag = () => api.get(API_ENDPOINTS.FEATURE_FLAG);

// 第三方登入相關 API 呼叫函式
export const initiateGoogleLogin = () => api.get(API_ENDPOINTS.GOOGLE_LOGIN);
export const initiateLineLogin = () => api.get(API_ENDPOINTS.LINE_LOGIN);
export const initiateFacebookLogin = () => api.get(API_ENDPOINTS.FACEBOOK_LOGIN);
export const initiateAppleLogin = () => api.get(API_ENDPOINTS.APPLE_LOGIN);
export const handleThirdPartyCallback = async (code: string, state: string, provider: string) => {
  const clientSid = localStorage.getItem('client_sid') || import.meta.env.VITE_CLIENT_SID || 'prepoe';

  console.log('=== 發送第三方登入回調請求 ===');
  console.log('Provider:', provider);
  console.log('Client SID:', clientSid);
  console.log('Code length:', code.length);
  console.log('State:', state);

  // 嘗試方法1: provider 在 URL 路徑中 (/api/auth/callback/line/)
  try {
    console.log('嘗試方法1: /api/auth/callback/' + provider + '/');
    const response = await api.post(
      API_ENDPOINTS.THIRD_PARTY_CALLBACK_WITH_PROVIDER(provider),
      {
        code,
        state,
        client_sid: clientSid
      }
    );
    console.log('✅ 方法1成功!');
    return response;
  } catch (error: any) {
    console.log('❌ 方法1失敗:', error.response?.status, error.response?.data);

    // 如果是404,代表endpoint不存在,嘗試方法2
    if (error.response?.status === 404 || error.response?.status === 400) {
      console.log('嘗試方法2: provider 在 request body 中');
      return api.post(
        API_ENDPOINTS.THIRD_PARTY_CALLBACK,
        {
          code,
          state,
          provider,
          client_sid: clientSid
        }
      );
    }

    // 其他錯誤直接拋出
    throw error;
  }
};

// 文章相關 API 呼叫函式
export interface ReadingConditionItem {
  general: number; // -1 表示不可閱讀，>= 0 表示可以閱讀的金額（0表示免費閱讀）
  vip: number; // -1 表示不可閱讀，>= 0 表示可以閱讀的金額（0表示免費閱讀）
  start_time?: string | null; // 開始時間 (ISO 8601)，null 表示預設值
  end_time?: string | null; // 結束時間 (ISO 8601)，null 表示預設值
}

export interface ArticleData {
  title: string;
  content: string;
  status: 'draft' | 'published';
  tags: string[];
  reading_conditions?: ReadingConditionItem[];
}

export interface ArticleFiles {
  coverImage?: File;
  images?: File[];
  videos?: File[];
  existingImageIds?: number[]; // 現有圖片ID列表
  existingVideoIds?: number[]; // 現有影片ID列表
}

export interface Article {
  id: number;
  title: string;
  content: string;
  cover_image_url?: string;
  tags: string[];
  provider_name?: string;
  provider_avatar_url?: string | null;
  images?: Array<{
    id: number;
    url: string;
    caption?: string;
    order: number;
  }>;
  videos?: Array<{
    id: number;
    url: string;
    caption?: string;
    order: number;
  }>;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
  published_at?: string;
  view_count: number;
  like_count: number;
  is_liked?: boolean;
  slug: string;
  reading_conditions?: ReadingConditionItem[];
}

export interface ArticleListResponse {
  success: boolean;
  data: {
    articles: Article[];
    pagination: {
      current_page: number;
      total_pages: number;
      total_count: number;
      has_next: boolean;
      has_previous: boolean;
    };
  };
  message: string;
}

export interface ArticleResponse {
  success: boolean;
  data: Article;
  message: string;
}

export interface CreateArticleResponse {
  success: boolean;
  data: {
    article_id: number;
    slug: string;
  };
  message: string;
}

export interface Tag {
  id: number;
  text: string;
}

export interface TagsResponse {
  success: boolean;
  data: {
    tags: Tag[];
  };
  message: string;
}

export interface UploadMediaResponse {
  success: boolean;
  data: {
    file_url: string;
    file_id: number;
    file_type: string;
  };
  message: string;
}

// 上傳檔案回應 (使用 /api/upload_file/ API)
export interface UploadFileResponse {
  success: boolean;
  data: {
    Static_Usage_Record_pk: number;
    url: string;
    file_extension: string;
    is_image: boolean;
    is_video: boolean;
    is_audio: boolean;
  };
  message: string;
}

// 獲取文章列表
export const getArticles = async (page = 1, perPage = 10): Promise<ArticleListResponse> => {
  const response = await api.get(API_ENDPOINTS.ARTICLES, {
    params: { page, per_page: perPage }
  });
  return response.data;
};

// 創建文章
export const createArticle = async (articleData: ArticleData, files?: ArticleFiles): Promise<CreateArticleResponse> => {
  const formData = new FormData();
  
  // 添加基本數據
  formData.append('title', articleData.title);
  formData.append('content', articleData.content);
  formData.append('status', articleData.status);
  
  // 添加標籤 - 嘗試不同的格式
  if (articleData.tags.length > 0) {
    // 方法1：作為JSON字符串
    formData.append('tags', JSON.stringify(articleData.tags));
  }
  
  // 添加閱讀條件設定
  if (articleData.reading_conditions) {
    formData.append('reading_conditions', JSON.stringify(articleData.reading_conditions));
  }
  
  // 添加文件
  if (files?.coverImage) {
    formData.append('cover_image', files.coverImage);
  }
  
  if (files?.images) {
    files.images.forEach((image, index) => {
      formData.append(`image_${index}`, image);
    });
  }
  
  if (files?.videos) {
    files.videos.forEach((video, index) => {
      formData.append(`video_${index}`, video);
    });
  }
  
  // 調試信息
  console.log('Creating article with data:', {
    title: articleData.title,
    content: articleData.content.substring(0, 100) + '...',
    status: articleData.status,
    tags: articleData.tags,
    reading_conditions: articleData.reading_conditions,
    hasCoverImage: !!files?.coverImage,
    imagesCount: files?.images?.length || 0,
    videosCount: files?.videos?.length || 0
  });
  
  // 調試 FormData 內容
  console.log('FormData entries:');
  for (let [key, value] of formData.entries()) {
    console.log(`${key}:`, value instanceof File ? `File(${value.name}, ${value.size} bytes)` : value);
  }
  
  try {
    const response = await api.post(API_ENDPOINTS.ARTICLE_CREATE, formData);
    
    console.log('API響應成功:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('API調用失敗:', {
      url: API_ENDPOINTS.ARTICLE_CREATE,
      error: error.response?.data || error.message,
      status: error.response?.status,
      headers: error.response?.headers
    });
    throw error;
  }
};

// 獲取文章詳情
export const getArticleDetail = async (articleId: number): Promise<ArticleResponse> => {
  const response = await api.get(API_ENDPOINTS.ARTICLE_DETAIL(articleId));
  return response.data;
};

// 更新文章
export const updateArticle = async (articleId: number, articleData: ArticleData, files?: ArticleFiles): Promise<CreateArticleResponse> => {
  const formData = new FormData();
  
  // 添加基本數據
  formData.append('title', articleData.title);
  formData.append('content', articleData.content);
  formData.append('status', articleData.status);
  
  // 添加標籤 - 嘗試不同的格式
  if (articleData.tags.length > 0) {
    // 方法1：作為JSON字符串
    formData.append('tags', JSON.stringify(articleData.tags));
  }
  
  // 添加閱讀條件設定
  if (articleData.reading_conditions) {
    formData.append('reading_conditions', JSON.stringify(articleData.reading_conditions));
  }
  
  // 添加文件
  if (files?.coverImage) {
    formData.append('cover_image', files.coverImage);
  }
  
  if (files?.images) {
    files.images.forEach((image, index) => {
      formData.append(`image_${index}`, image);
    });
  }
  
  if (files?.videos) {
    files.videos.forEach((video, index) => {
      formData.append(`video_${index}`, video);
    });
  }
  
  // 添加現有文件ID（用於更新時保留指定文件）
  if (files?.existingImageIds) {
    formData.append('existing_image_ids', JSON.stringify(files.existingImageIds));
  }
  
  if (files?.existingVideoIds) {
    formData.append('existing_video_ids', JSON.stringify(files.existingVideoIds));
  }
  
  const response = await api.post(API_ENDPOINTS.ARTICLE_UPDATE(articleId), formData);
  
  return response.data;
};

// 刪除文章
export const deleteArticle = async (articleId: number) => {
  const response = await api.post(API_ENDPOINTS.ARTICLE_DELETE(articleId), {});
  return response.data;
};

// 切換點讚狀態
export const toggleArticleLike = async (articleId: number) => {
  const response = await api.post(API_ENDPOINTS.ARTICLE_LIKE(articleId), {});
  return response.data;
};

// 獲取標籤列表
export const getTags = async (): Promise<TagsResponse> => {
  const response = await api.get(API_ENDPOINTS.TAGS);
  return response.data;
};

// 上傳媒體文件
export const uploadMedia = async (file: File, type: 'image' | 'video'): Promise<UploadMediaResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);

  const response = await api.post(API_ENDPOINTS.UPLOAD_MEDIA, formData);

  return response.data;
};

// 上傳檔案 (使用 /api/upload_file/ API，返回 Static_Usage_Record_pk)
export const uploadFile = async (file: File): Promise<UploadFileResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post(API_ENDPOINTS.UPLOAD_FILE, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

// 獲取公開文章
export const getPublicArticle = async (slug: string): Promise<ArticleResponse> => {
  const response = await api.get(API_ENDPOINTS.PUBLIC_ARTICLE(slug));
  return response.data;
};

// ==================== AI客服相關 API ====================

// AI助理相關介面
export interface AIAssistant {
  id: number;
  name: string;
  description: string;
  system_prompt: string;
  text_model_id: number;
  temperature: number;
  max_tokens: number;
  is_active: boolean;
  is_public: boolean;
  total_conversations: number;
  total_tokens_used: number;
  created_at: string;
  updated_at: string;
  avatar_url?: string;
  document_count: number;
  vectorized_at?: string; // 向量化时间
  source_platform?: string; // 來源平台：line, facebook, instagram, web
}

export interface AIAssistantDocument {
  id: number;
  title: string;
  file_type: string;
  priority: number;
  is_active: boolean;
  usage_count: number;
  is_processed: boolean;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at?: string;
  last_used_at?: string;
  source_file_url?: string;
}

export interface AIAssistantCreateData {
  name: string;
  description?: string;
  system_prompt: string;
  text_model_id?: number;
  temperature?: number;
  max_tokens?: number;
  is_active?: boolean;
  is_public?: boolean;
}

export interface AIAssistantUpdateData {
  name?: string;
  description?: string;
  system_prompt?: string;
  text_model_id?: number;
  temperature?: number;
  max_tokens?: number;
  is_active?: boolean;
  is_public?: boolean;
}

export interface AIAssistantDocumentCreateData {
  title: string;
  file_type?: string;
  priority?: number;
  source_file?: File;
}

export interface AIAssistantDocumentUpdateData {
  title?: string;
  file_type?: string;
  priority?: number;
}

export interface Conversation {
  id: number;
  title: string;
  is_active: boolean;
  total_messages: number;
  total_tokens: number;
  created_at: string;
  last_message_at?: string;
  messages?: Message[];
}

export interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  tokens_used: number;
  created_at: string;
}

export interface MessageSendData {
  content: string;
}

export interface AIAssistantListResponse {
  success: boolean;
  data: {
    assistants: AIAssistant[];
    pagination: {
      current_page: number;
      total_pages: number;
      total_count: number;
      has_next: boolean;
      has_previous: boolean;
    };
  };
  message: string;
}

export interface AIAssistantResponse {
  success: boolean;
  data: AIAssistant & { documents: AIAssistantDocument[] };
  message: string;
}

export interface AIAssistantDocumentListResponse {
  success: boolean;
  data: {
    documents: AIAssistantDocument[];
    pagination: {
      current_page: number;
      total_pages: number;
      total_count: number;
      has_next: boolean;
      has_previous: boolean;
    };
  };
  message: string;
}

export interface AIAssistantDocumentResponse {
  success: boolean;
  data: AIAssistantDocument;
  message: string;
}

export interface ConversationListResponse {
  success: boolean;
  data: {
    conversations: Conversation[];
    pagination: {
      current_page: number;
      total_pages: number;
      total_count: number;
      has_next: boolean;
      has_previous: boolean;
    };
  };
  message: string;
}

export interface ConversationResponse {
  success: boolean;
  data: Conversation;
  message: string;
}

export interface MessageSendResponse {
  success: boolean;
  data: {
    user_message_id: number;
    ai_message_id: number;
    ai_response: string;
  };
  message: string;
}

export interface StatisticsResponse {
  success: boolean;
  data: {
    overview: {
      total_assistants: number;
      active_assistants: number;
      total_documents: number;
      total_conversations: number;
      active_conversations: number;
      total_messages: number;
      total_tokens: number;
    };
    recent_7_days: {
      new_conversations: number;
      new_messages: number;
    };
  };
  message: string;
}

// AI助理相關 API 函數
export const getAIAssistants = async (
  page = 1, 
  pageSize = 10, 
  search = '', 
  isActive = '', 
  isPublic = ''
): Promise<AIAssistantListResponse> => {
  const params: any = { page, page_size: pageSize };
  if (search) params.search = search;
  if (isActive !== '') params.is_active = isActive;
  if (isPublic !== '') params.is_public = isPublic;
  
  const response = await api.get(API_ENDPOINTS.AI_ASSISTANTS, { params });
  return response.data;
};

export const getAIAssistantDetail = async (assistantId: number): Promise<AIAssistantResponse> => {
  const response = await api.get(API_ENDPOINTS.AI_ASSISTANT_DETAIL(assistantId));
  return response.data;
};

export const createAIAssistant = async (data: AIAssistantCreateData): Promise<{ success: boolean; data: { id: number }; message: string }> => {
  // 準備JSON數據
  const jsonData: any = {
    name: data.name,
    system_prompt: data.system_prompt,
  };
  
  if (data.description) jsonData.description = data.description;
  if (data.text_model_id !== undefined && data.text_model_id !== null) jsonData.text_model_id = data.text_model_id;
  if (data.temperature !== undefined) jsonData.temperature = data.temperature;
  if (data.max_tokens !== undefined) jsonData.max_tokens = data.max_tokens;
  if (data.is_active !== undefined) jsonData.is_active = data.is_active;
  if (data.is_public !== undefined) jsonData.is_public = data.is_public;
  
  const response = await api.post(API_ENDPOINTS.AI_ASSISTANT_CREATE, jsonData);
  return response.data;
};

export const updateAIAssistant = async (assistantId: number, data: AIAssistantUpdateData): Promise<{ success: boolean; data: { id: number }; message: string }> => {
  // 準備JSON數據
  const jsonData: any = {};
  
  if (data.name) jsonData.name = data.name;
  if (data.description !== undefined) jsonData.description = data.description;
  if (data.system_prompt) jsonData.system_prompt = data.system_prompt;
  if (data.text_model_id !== undefined && data.text_model_id !== null) jsonData.text_model_id = data.text_model_id;
  if (data.temperature !== undefined) jsonData.temperature = data.temperature;
  if (data.max_tokens !== undefined) jsonData.max_tokens = data.max_tokens;
  if (data.is_active !== undefined) jsonData.is_active = data.is_active;
  if (data.is_public !== undefined) jsonData.is_public = data.is_public;
  
  const response = await api.put(API_ENDPOINTS.AI_ASSISTANT_UPDATE(assistantId), jsonData);
  return response.data;
};

export const deleteAIAssistant = async (assistantId: number): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(API_ENDPOINTS.AI_ASSISTANT_DELETE(assistantId));
  return response.data;
};

// AI助理檔案相關 API 函數
export const getAIAssistantDocuments = async (
  assistantId: number,
  page = 1,
  pageSize = 10,
  search = '',
  isActive = '',
  fileType = ''
): Promise<AIAssistantDocumentListResponse> => {
  const params: any = { page, page_size: pageSize };
  if (search) params.search = search;
  if (isActive !== '') params.is_active = isActive;
  if (fileType) params.file_type = fileType;
  
  const response = await api.get(API_ENDPOINTS.AI_ASSISTANT_DOCUMENTS(assistantId), { params });
  return response.data;
};

export const getAIAssistantDocumentDetail = async (assistantId: number, documentId: number): Promise<AIAssistantDocumentResponse> => {
  const response = await api.get(API_ENDPOINTS.AI_ASSISTANT_DOCUMENT_DETAIL(assistantId, documentId));
  return response.data;
};

export const createAIAssistantDocument = async (assistantId: number, data: AIAssistantDocumentCreateData): Promise<{ success: boolean; data: { id: number }; message: string }> => {
  // 如果有檔案，使用FormData；否則使用JSON
  if (data.source_file) {
    const formData = new FormData();
    formData.append('title', data.title);
    if (data.file_type) formData.append('file_type', data.file_type);
    if (data.priority !== undefined) formData.append('priority', data.priority.toString());
    formData.append('source_file', data.source_file);
    
    const response = await api.post(API_ENDPOINTS.AI_ASSISTANT_DOCUMENT_CREATE(assistantId), formData);
    return response.data;
  } else {
    // 準備JSON數據
    const jsonData: any = {
      title: data.title,
    };
    
    if (data.file_type) jsonData.file_type = data.file_type;
    if (data.priority !== undefined) jsonData.priority = data.priority;
    
    const response = await api.post(API_ENDPOINTS.AI_ASSISTANT_DOCUMENT_CREATE(assistantId), jsonData);
    return response.data;
  }
};

export const updateAIAssistantDocument = async (
  assistantId: number, 
  documentId: number, 
  data: AIAssistantDocumentUpdateData
): Promise<{ success: boolean; data: { id: number }; message: string }> => {
  // 準備JSON數據
  const jsonData: any = {};
  
  if (data.title) jsonData.title = data.title;
  if (data.file_type) jsonData.file_type = data.file_type;
  if (data.priority !== undefined) jsonData.priority = data.priority;
  
  const response = await api.put(API_ENDPOINTS.AI_ASSISTANT_DOCUMENT_UPDATE(assistantId, documentId), jsonData);
  return response.data;
};

export const deleteAIAssistantDocument = async (assistantId: number, documentId: number): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(API_ENDPOINTS.AI_ASSISTANT_DOCUMENT_DELETE(assistantId, documentId));
  return response.data;
};

// 對話相關 API 函數
export const getConversations = async (
  assistantId: number,
  page = 1,
  pageSize = 10,
  isActive = ''
): Promise<ConversationListResponse> => {
  const params: any = { page, page_size: pageSize };
  if (isActive !== '') params.is_active = isActive;
  
  const response = await api.get(API_ENDPOINTS.AI_CONVERSATIONS(assistantId), { params });
  return response.data;
};

export const getConversationDetail = async (assistantId: number, conversationId: number): Promise<ConversationResponse> => {
  const response = await api.get(API_ENDPOINTS.AI_CONVERSATION_DETAIL(assistantId, conversationId));
  return response.data;
};

export const createConversation = async (assistantId: number, title?: string): Promise<{ success: boolean; data: { id: number }; message: string }> => {
  const response = await api.post(API_ENDPOINTS.AI_CONVERSATION_CREATE(assistantId), {
    title: title || ''
  });
  return response.data;
};

export const sendMessage = async (assistantId: number, conversationId: number, data: MessageSendData): Promise<MessageSendResponse> => {
  const response = await api.post(API_ENDPOINTS.AI_MESSAGE_SEND(assistantId, conversationId), data);
  return response.data;
};

// 統計相關 API 函數
export const getUsageStatistics = async (): Promise<StatisticsResponse> => {
  const response = await api.get(API_ENDPOINTS.AI_STATISTICS);
  return response.data;
};

// 向量化相關 API 函數
export const createVectorStore = async (assistantPk: number): Promise<{ success: boolean; message: string }> => {
  const response = await api.post(API_ENDPOINTS.VECTOR_STORE_CREATE, {
    assistant_pk: assistantPk
  });
  return response.data;
};

// 聊天相關 API 函數
export interface ChatRequest {
  query: string;
  assistant_pk: number;
  conversation_context?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export interface ChatResponse {
  success: boolean;
  message: string;
  error: string;
  data: {
    success: boolean;
    query: string;
    ai_model: string;
    context_type: string;
    context_sources: number;
    response: string;
    search_results: Array<{
      file_id: string;
      content: string;
      score: number;
      metadata: any;
      result_index: number;
    }>;
  };
}

export const sendChatMessage = async (data: ChatRequest): Promise<ChatResponse> => {
  const response = await api.post(API_ENDPOINTS.CHAT, data);
  return response.data;
};

// ==================== ItemEvent 活動管理系統相關介面 ====================

// ItemEventModule 介面
export interface ItemEventModule {
  id: number;
  name: string;
  module_type: string;
  module_type_display: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ItemEventItem 介面
export interface ItemEventItem {
  id: number;
  name: string;
  description: string;
  base_price: number;
  earlyBirdConfig?: EarlyBirdConfig;  // 前端編輯時使用
  earlyBird?: EarlyBirdConfig;        // 後端回傳時使用（兩個都保留以支援不同場景）
  start_time: string;
  end_time: string;
  location: string;
  min_participants: number;
  max_participants: number;
  max_participants_per_user: number;
  use_check_in: boolean;
  event_status: 'draft' | 'registration_open' | 'registration_closed' | 'in_progress' | 'completed' | 'cancelled';
  event_status_display: string;
  form_fields: any[];
  sku?: string; // 活動的唯一識別碼，用於生成報名連結
  modules?: ItemEventModuleAssignment[];
  tags?: Array<{
    id: number;
    name: string;
    is_hidden: boolean;
  }>;
  item_tags?: Array<{
    id: number;
    name: string;
    is_hidden: boolean;
  }>;
  images?: Array<{
    id: number;
    order: number;
    ratio: string;
    url: string;
    thumbnail_url: string;
    file_extension: string;
    info: string;
    created_at: string;
  }>;
  main_image?: {
    id: number;
    order: number;
    ratio: string;
    url: string;
    thumbnail_url: string;
    file_extension: string;
    info: string;
    created_at: string;
  };
  payment_info?: Array<{
    payment_type: string;
    payment_display: string;
  }>;
  created_at: string;
  updated_at: string;
  current_participants_count?: number;  // 目前已報名人數
  is_public_event?: boolean;  // 是否為公開活動
  waiting_payment_minutes?: number;  // 未付款訂單時效（分鐘）
  terms_of_event?: string;  // 活動條款
  statistics?: {
    total_registrations: number;
    paid_registrations: number;
    total_participants: number;
    checked_in_participants: number;
    total_revenue: number;
  };
}

// ItemImage 介面（用於上傳其他圖片）
export interface ItemImage {
  id?: number; // 新增時沒有 id
  Static_Usage_Record: number; // FK to Static_Usage_Record
  order: number; // 圖片順序
  url?: string; // 圖片 URL（後端回傳時提供）
  thumbnail_url?: string; // 縮圖 URL（後端回傳時提供）
  file_extension?: string; // 檔案副檔名（後端回傳時提供）
}

// 用於前端上傳圖片的臨時資料結構
export interface ItemImageUpload {
  id?: string; // 臨時 id（用於追蹤前端狀態）
  file?: File; // 待上傳的檔案
  Static_Usage_Record?: number; // 上傳後取得的 pk
  order: number; // 圖片順序
  preview?: string; // 預覽 URL（base64 或 blob URL）
  uploading?: boolean; // 是否正在上傳中
  uploaded?: boolean; // 是否已上傳完成
}

// 用於建立和更新活動的介面（支援檔案上傳）
export interface ItemEventItemFormData extends Omit<ItemEventItem, 'main_image' | 'images' | 'tags'> {
  main_image_file?: File;
  tags?: string[] | string; // 支援字串陣列或 JSON 字串
  additional_images?: ItemImageUpload[]; // 其他圖片
}

// ItemEventModuleAssignment 介面
export interface ItemEventModuleAssignment {
  id: number;
  event_id: number;
  module_id: number;
  label: string;
  order: number;
  is_active: boolean;
  module_start_time?: string;
  module_end_time?: string;
  module_config: any;
  module?: ItemEventModule;
  created_at: string;
  updated_at: string;
}

// ItemEventOrderDetail 介面
export interface ItemEventOrderDetail {
  id: number;
  order_sn: string;
  order_status: string;
  order_status_display: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  participant_count: number;
  selected_date?: string;
  special_requests?: string;
  options_json: any;
  created_at: string;
  updated_at: string;
}

// ItemEventParticipant 介面
export interface ItemEventParticipant {
  id: number;
  name: string;
  email: string;
  phone: string;
  binding_code: string;
  is_checked_in: boolean;
  check_in_time?: string;
  info_json: any;
  form_data?: Array<{
    field_id: number | string;
    field_label: string;
    field_type: string;
    value: string;
    display_value: string;
  }>;
  order_sn?: string;
  order_status?: string;
  created_at: string;
  updated_at?: string;
  order_info?: {
    sn: string;
    status: string;
    status_display: string;
    created_at: string;
  };
  event_order_detail?: {
    id: number;
    participant_count: number;
    unit_price: number;
    subtotal: number;
    selected_date?: string;
    special_requests?: string;
    options_json: any;
  };
}

// 參與者列表回應介面
export interface EventParticipantsResponse {
  success: boolean;
  message: string;
  data: {
    event: {
      id: number;
      name: string;
      start_time: string;
      end_time: string;
      location: string;
      event_status: string;
      use_check_in: boolean;
    };
    form_fields?: Array<{
      id: number | string;
      label: string;
      type: string;
      placeholder?: string;
      required?: boolean;
      order?: number;
      options?: Array<{
        id: number;
        value: string;
        label: string;
        price?: number;
      }>;
    }>;
    statistics: {
      total_count: number;
      checked_in_count: number;
      not_checked_in_count: number;
      check_in_rate: number;
    };
    participants: ItemEventParticipant[];
    pagination: {
      current_page: number;
      total_pages: number;
      page_size: number;
      total_count: number;
      has_next: boolean;
      has_previous: boolean;
    };
  };
}

// ItemEventStatistics 介面
export interface ItemEventStatistics {
  event_name: string;
  total_registrations: number;
  paid_registrations: number;
  pending_registrations: number;
  total_participants: number;
  checked_in_participants: number;
  check_in_rate: number;
  total_revenue: number;
  module_statistics: Record<string, {
    module_name: string;
    module_type: string;
    participant_count: number;
  }>;
  last_updated: string;
}

// ==================== 動態表單系統介面 ====================

// 多選限制配置
export interface MultiSelectConfig {
  minSelection?: number; // 最少選擇數量
  maxSelection?: number; // 最多選擇數量
}

// 表單欄位類型
export type FormFieldType = 
  | 'text'      // 一般文字
  | 'textarea'  // 文字區塊
  | 'number'    // 數字
  | 'email'     // 電子郵件
  | 'tel'       // 電話
  | 'select'    // 下拉選單
  | 'radio'     // 單選
  | 'checkbox'  // 多選
  | 'boolean';  // 布林值（同意條款等）

// 早鳥價設定（活動層級，統一管理截止日期）
export interface EarlyBirdConfig {
  enabled: boolean;            // 是否啟用早鳥優惠
  endDate: string;             // 早鳥截止日期 (ISO 8601 格式)，全活動統一
  price?: number;              // 基本價格的早鳥價（可選）- 後端使用 price 欄位名稱
  isActive?: boolean;          // 是否在早鳥期間內（後端計算）
}

// 表單欄位選項
export interface FormFieldOption {
  id: string | number;         // 選項 ID（編輯時使用）
  value: string;               // 選項值
  label: string;               // 選項顯示文字
  price?: number;              // 額外價格（累加到 base_price）
  earlyBirdPrice?: number;     // 早鳥價格（前端提交時使用，只存價格）
  earlyBird?: {                // 早鳥價格（後端回傳時使用）
    enabled: boolean;
    price: number;
    isActive?: boolean;        // 是否在早鳥期間內（後端計算）
    endDate?: string;          // 早鳥截止日期（後端回傳）
  };
  conditionalFields?: FormField[]; // 選擇此選項時顯示的子欄位
}

// 表單欄位驗證規則
export interface FormFieldValidation {
  min?: number;           // 最小值/最小長度
  max?: number;           // 最大值/最大長度
  pattern?: string;       // 正則表達式
  errorMessage?: string;  // 自訂錯誤訊息
}

// 表單欄位定義
export interface FormField {
  id: string | number;              // 唯一識別碼（新建時前端生成，編輯時後端返回）
  type: FormFieldType;              // 欄位類型
  label: string;                    // 欄位標籤
  placeholder?: string;             // 提示文字
  required: boolean;                // 是否必填
  defaultValue?: any;               // 預設值
  order: number;                    // 顯示順序
  options?: FormFieldOption[];      // 選項（select/radio/checkbox 使用）
  multiSelectConfig?: MultiSelectConfig; // 多選限制配置
  validation?: FormFieldValidation; // 驗證規則
  visible?: boolean;                // 是否可見（預設 true）
}

// 動態表單資料（扁平化結構）
export type DynamicFormData = Record<string, any>;

// ==================== 活動報名相關介面 ====================

export interface EventJoinInfo extends Omit<ItemEventItem, 'statistics'> {
  // 繼承 ItemEventItem 的所有欄位，但排除 statistics
  // 這樣可以確保與新的 API 端點返回的資料結構完全匹配
  item_pk: number; // 活動的主鍵，用於訂單創建
}

export interface EventRegistrationData {
  name: string;
  email: string;
  phone: string;
  company?: string;
  position?: string;
  dietary_restrictions?: string;
  special_requirements?: string;
  agree_terms: boolean;
  agree_privacy: boolean;
  payment_type?: string; // 付款方式
}

// 訂單創建相關介面
export interface OrderItem {
  item_pk: number;
  quantity: number;
}

export interface CreateOrderRequest {
  items: OrderItem[];
  payment_method: string; // 'LINEPay' | 'JkoPay' | 'NewebPay' | 'Cash'
  participant_info?: EventRegistrationData; // 活動參與者資訊
}

export interface CreateOrderResponse {
  success: boolean;
  message?: string;
  payment_html?: string; // 第三方支付需要的 HTML 表單
  data?: {
    order_id: number;
    order_number: string;
    total_amount: number;
    payment_method: string;
    payment_status: string;
    participant_id?: number;
  };
}

// 推薦訂單介面
export interface ReferrerOrder {
  id: number;
  sn: string;
  status: string;
  status_display: string;
  total_amount: number;
  discount_amount: number;
  payment_amount: number;
  remark: string;
  created_at: string;
  updated_at: string;
  member_card_id: number;
  referrer_member_card_id: number | null;
}

export interface ReferrerOrdersResponse {
  success: boolean;
  data: ReferrerOrder[];
  error: string;
  message: string;
}

// 我的訂單 - 參與者介面
export interface MyOrderParticipant {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  binding_code: string | null;
  is_checked_in: boolean;
  check_in_time: string | null;
}

// 我的訂單 - 活動圖片介面
export interface MyOrderEventImage {
  id: number;
  url: string | null;
  ratio: string;
  order: number;
}

// 我的訂單 - 活動明細介面
export interface MyOrderEventDetail {
  event_order_detail_id: number;
  event_id: number;
  event_name: string;
  event_description: string;
  event_sku: string;
  event_images: MyOrderEventImage[];
  quantity: number;
  unit_price: number;
  subtotal: number;
  participant_count: number;
  selected_date: string | null;
  special_requests: string;
  options_json: Record<string, any>;
  participants: MyOrderParticipant[];
  created_at: string;
}

// 我的訂單介面
// 訂單付款資訊介面
export interface OrderPaymentInfo {
  payment_type: string;
  payment_display: string;
}

export interface MyOrder {
  order_id: number;
  order_sn: string;
  status: string;
  status_display: string;
  total_amount: number;
  discount_amount: number;
  payment_amount: number;
  created_at: string;
  updated_at: string;
  events: MyOrderEventDetail[];
  payment_info: OrderPaymentInfo[];  // 可用的付款方式列表
}

// 我的訂單分頁資訊
export interface MyOrderPagination {
  current_page: number;
  total_pages: number;
  total_count: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

// 我的訂單響應介面
export interface MyOrdersResponse {
  success: boolean;
  data: {
    orders: MyOrder[];
    pagination: MyOrderPagination;
  };
  error: string;
  message: string;
}

// ==================== 付款相關介面 ====================

// 付款訂單響應介面
export interface PayOrderResponse {
  success: boolean;
  payment_required?: boolean;
  payment_method?: string;
  payment_html?: string;  // 第三方付款 HTML 表單
  order_sn?: string;
  data?: {
    payment_url?: string;
    order_id: number;
    payment_method: string;
    status: string;
  };
  error?: string;
  message?: string;
}

// ==================== Survey 問卷管理系統相關介面 ====================

// Survey 介面
export interface Survey {
  id: number;
  title: string;
  description: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  question_count: number;
  submission_count: number;
}

// Section 介面
export interface Section {
  id: number;
  survey_id: number;
  title: string;
  description: string;
  order: number;
  created_at: string;
  updated_at: string;
}

// Question 介面
export interface Question {
  id: number;
  section_id: number;
  text: string;
  help_text?: string;
  type: 'single' | 'multi' | 'short' | 'long' | 'rating' | 'date' | 'number';
  required: boolean;
  order: number;
  allow_other: boolean;
  rating_min?: number;
  rating_max?: number;
  created_at: string;
  updated_at: string;
  choices?: Choice[];
}

// Choice 介面
export interface Choice {
  id: number;
  question_id: number;
  label: string;
  value: string;
  order: number;
  is_other: boolean;
  created_at: string;
  updated_at: string;
}

// Submission 介面
export interface Submission {
  id: number;
  survey_id: number;
  session_key: string;
  is_completed: boolean;
  completed_at?: string;
  meta: {
    user_agent?: string;
    ip_address?: string;
    timestamp?: string;
  };
  created_at: string;
  updated_at: string;
}

// Answer 介面
export interface Answer {
  id: number;
  submission_id: number;
  question_id: number;
  selected_choice_id?: number;
  text_value?: string;
  long_text_value?: string;
  rating_value?: number;
  date_value?: string;
  number_value?: number;
  other_text?: string;
  selected_choice_ids?: number[];
  created_at: string;
  updated_at: string;
}

// SurveyAnalytics 介面
export interface SurveyAnalytics {
  survey_id: number;
  survey_title: string;
  total_submissions: number;
  completed_submissions: number;
  completion_rate: number;
  questions: Array<{
    id: number;
    text: string;
    type: string;
    choice_counts?: Record<string, number>;
    average_rating?: number;
    total_ratings?: number;
  }>;
}

// VisibilityRule 介面
export interface VisibilityRule {
  id: number;
  target_question_id: number;
  match: 'all' | 'any';
  action: 'show' | 'hide';
  priority: number;
  conditions: Array<{
    source_question_id: number;
    operator: string;
    choice_ids: number[];
  }>;
  created_at: string;
  updated_at: string;
}

// SkipRule 介面
export interface SkipRule {
  id: number;
  source_question_id: number;
  match: 'all' | 'any';
  goto_question_id?: number;
  goto_section_id?: number;
  goto_end: boolean;
  priority: number;
  conditions: Array<{
    source_question_id: number;
    operator: string;
    choice_ids: number[];
  }>;
  created_at: string;
  updated_at: string;
}

// 分頁回應介面
export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    [key: string]: T[] | {
      current_page: number;
      total_pages: number;
      total_count: number;
      has_next: boolean;
      has_previous: boolean;
    };
    pagination: {
      current_page: number;
      total_pages: number;
      total_count: number;
      has_next: boolean;
      has_previous: boolean;
    };
  };
  message: string;
}

// 單一資料回應介面
export interface SingleResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

// ==================== ItemEvent 活動管理系統 API 函數 ====================

// ItemEventModule API 函數
export const getItemEventModules = async (): Promise<SingleResponse<ItemEventModule[]>> => {
  const response = await api.get(API_ENDPOINTS.EVENT_MODULES);
  return response.data;
};

export const getItemEventModuleDetail = async (moduleId: number): Promise<SingleResponse<ItemEventModule>> => {
  const response = await api.get(API_ENDPOINTS.EVENT_MODULE_DETAIL(moduleId));
  return response.data;
};

export const createItemEventModule = async (moduleData: Partial<ItemEventModule>): Promise<SingleResponse<{ id: number }>> => {
  const response = await api.post(API_ENDPOINTS.EVENT_MODULE_CREATE, moduleData);
  return response.data;
};

export const updateItemEventModule = async (moduleId: number, moduleData: Partial<ItemEventModule>): Promise<SingleResponse<{ id: number }>> => {
  const response = await api.put(API_ENDPOINTS.EVENT_MODULE_UPDATE(moduleId), moduleData);
  return response.data;
};

export const deleteItemEventModule = async (moduleId: number): Promise<SingleResponse<{ message: string }>> => {
  const response = await api.delete(API_ENDPOINTS.EVENT_MODULE_DELETE(moduleId));
  return response.data;
};

// ItemEventItem API 函數
export const getItemEventItems = async (
  page = 1,
  pageSize = 20,
  search = '',
  status = '',
  providerSlug?: string
): Promise<PaginatedResponse<ItemEventItem>> => {
  const params: any = { page, page_size: pageSize, manager: 1 };
  if (search) params.search = search;
  if (status) params.status = status;
  if (providerSlug) params.provider_slug = providerSlug;
  
  const response = await api.get(API_ENDPOINTS.EVENT_ITEMS, { params });
  return response.data;
};

export const getItemEventItemDetail = async (eventId: number): Promise<SingleResponse<ItemEventItem>> => {
  const response = await api.get(API_ENDPOINTS.EVENT_ITEM_DETAIL(eventId));
  return response.data;
};

export const createItemEventItem = async (eventData: Partial<ItemEventItemFormData>): Promise<SingleResponse<{ id: number }>> => {
  // 檢查是否包含檔案，如果是則使用 FormData
  const hasFiles = (eventData as any).main_image_file instanceof File;

  if (hasFiles) {
    const formData = new FormData();

    // 添加基本資料
    Object.keys(eventData).forEach(key => {
      if (key === 'main_image_file' && (eventData as any)[key] instanceof File) {
        formData.append('main_image', (eventData as any)[key]);
      } else if (key !== 'main_image_file' && (eventData as any)[key] !== undefined && (eventData as any)[key] !== null) {
        if (key === 'tags' && Array.isArray((eventData as any)[key])) {
          // 標籤陣列轉換為字串
          formData.append('tags', JSON.stringify((eventData as any)[key]));
        } else if (key === 'form_fields' && Array.isArray((eventData as any)[key])) {
          // 表單欄位陣列轉換為字串
          formData.append('form_fields', JSON.stringify((eventData as any)[key]));
        } else if (typeof (eventData as any)[key] === 'string' || typeof (eventData as any)[key] === 'number' || typeof (eventData as any)[key] === 'boolean') {
          // 只添加基本類型的值
          formData.append(key, String((eventData as any)[key]));
        }
      }
    });

    const response = await api.post(API_ENDPOINTS.EVENT_ITEM_CREATE, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } else {
    // 沒有圖片時，移除 main_image_file 欄位
    const { main_image_file, ...cleanData } = eventData as any;
    const response = await api.post(API_ENDPOINTS.EVENT_ITEM_CREATE, cleanData);
    return response.data;
  }
};

export const updateItemEventItem = async (eventId: number, eventData: Partial<ItemEventItemFormData>): Promise<SingleResponse<{ id: number }>> => {
  // 檢查是否包含檔案，如果是則使用 FormData
  const hasFiles = (eventData as any).main_image_file instanceof File;

  if (hasFiles) {
    const formData = new FormData();

    console.log('📦 準備發送 FormData，eventData keys:', Object.keys(eventData));

    // 添加基本資料（不包含 form_fields，因為用 sync API 單獨處理）
    Object.keys(eventData).forEach(key => {
      if (key === 'main_image_file' && (eventData as any)[key] instanceof File) {
        console.log(`  ✅ 添加圖片: main_image (${(eventData as any)[key].name})`);
        formData.append('main_image', (eventData as any)[key]);
      } else if (key !== 'main_image_file' && key !== 'form_fields' && (eventData as any)[key] !== undefined && (eventData as any)[key] !== null) {
        if (key === 'tags' && Array.isArray((eventData as any)[key])) {
          // 標籤陣列轉換為字串
          const tagsJson = JSON.stringify((eventData as any)[key]);
          console.log(`  ✅ 添加標籤: ${key} = ${tagsJson}`);
          formData.append('tags', tagsJson);
        } else if (typeof (eventData as any)[key] === 'string' || typeof (eventData as any)[key] === 'number' || typeof (eventData as any)[key] === 'boolean') {
          // 只添加基本類型的值
          console.log(`  ✅ 添加欄位: ${key} = ${(eventData as any)[key]}`);
          formData.append(key, String((eventData as any)[key]));
        } else {
          console.log(`  ⚠️ 跳過欄位: ${key} (type: ${typeof (eventData as any)[key]})`);
        }
      } else if (key === 'form_fields') {
        console.log(`  ⚠️ 跳過 form_fields (使用 sync API 單獨處理)`);
      }
    });

    console.log('📤 使用 PATCH 發送 FormData 到後端...');
    const response = await api.patch(API_ENDPOINTS.EVENT_ITEM_UPDATE(eventId), formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } else {
    // 沒有圖片時，移除 main_image_file 和 form_fields 欄位，使用 JSON 發送
    const { main_image_file, form_fields, ...cleanData } = eventData as any;
    const response = await api.put(API_ENDPOINTS.EVENT_ITEM_UPDATE(eventId), cleanData);
    return response.data;
  }
};

export const deleteItemEventItem = async (eventId: number): Promise<SingleResponse<{ message: string }>> => {
  const response = await api.delete(API_ENDPOINTS.EVENT_ITEM_DELETE(eventId));
  return response.data;
};

// ItemImage API 函數（活動其他圖片管理）
export const getEventImages = async (eventId: number): Promise<SingleResponse<ItemImage[]>> => {
  const response = await api.get(API_ENDPOINTS.EVENT_IMAGES(eventId));
  return response.data;
};

export const createEventImage = async (
  eventId: number,
  imageData: Omit<ItemImage, 'id' | 'url' | 'thumbnail_url' | 'file_extension'>
): Promise<SingleResponse<ItemImage>> => {
  const response = await api.post(API_ENDPOINTS.EVENT_IMAGE_CREATE(eventId), imageData);
  return response.data;
};

export const updateEventImage = async (
  imageId: number,
  imageData: Partial<ItemImage>
): Promise<SingleResponse<ItemImage>> => {
  const response = await api.put(API_ENDPOINTS.EVENT_IMAGE_UPDATE(imageId), imageData);
  return response.data;
};

export const deleteEventImage = async (imageId: number): Promise<SingleResponse<{ message: string }>> => {
  const response = await api.delete(API_ENDPOINTS.EVENT_IMAGE_DELETE(imageId));
  return response.data;
};

export const reorderEventImages = async (
  eventId: number,
  imageOrders: Array<{ id: number; order: number }>
): Promise<SingleResponse<{ message: string }>> => {
  const response = await api.post(API_ENDPOINTS.EVENT_IMAGE_REORDER(eventId), { images: imageOrders });
  return response.data;
};

// ItemEventModuleAssignment API 函數
export const getItemEventModuleAssignments = async (eventId: number): Promise<SingleResponse<ItemEventModuleAssignment[]>> => {
  const response = await api.get(API_ENDPOINTS.EVENT_MODULE_ASSIGNMENTS(eventId));
  return response.data;
};

export const createItemEventModuleAssignment = async (
  eventId: number,
  assignmentData: Partial<ItemEventModuleAssignment>
): Promise<SingleResponse<{ id: number }>> => {
  const response = await api.post(API_ENDPOINTS.EVENT_MODULE_ASSIGNMENT_CREATE(eventId), assignmentData);
  return response.data;
};

export const updateItemEventModuleAssignment = async (
  assignmentId: number,
  assignmentData: Partial<ItemEventModuleAssignment>
): Promise<SingleResponse<{ id: number }>> => {
  const response = await api.put(API_ENDPOINTS.EVENT_MODULE_ASSIGNMENT_UPDATE(assignmentId), assignmentData);
  return response.data;
};

export const deleteItemEventModuleAssignment = async (assignmentId: number): Promise<SingleResponse<{ message: string }>> => {
  const response = await api.delete(API_ENDPOINTS.EVENT_MODULE_ASSIGNMENT_DELETE(assignmentId));
  return response.data;
};

// ItemEventOrderDetail API 函數
export const getItemEventOrders = async (
  eventId: number,
  page = 1,
  pageSize = 20,
  status = ''
): Promise<PaginatedResponse<ItemEventOrderDetail>> => {
  const params: any = { page, page_size: pageSize };
  if (status) params.status = status;
  
  const response = await api.get(API_ENDPOINTS.EVENT_ORDERS(eventId), { params });
  return response.data;
};

// ItemEventParticipant API 函數
export const getItemEventParticipants = async (
  eventId: number,
  params?: {
    page?: number;
    page_size?: number;
    check_in_status?: 'checked_in' | 'not_checked_in';
    search?: string;
    order_status?: string;
  }
): Promise<EventParticipantsResponse> => {
  const queryParams: any = {
    page: params?.page || 1,
    page_size: params?.page_size || 20
  };

  if (params?.check_in_status) queryParams.check_in_status = params.check_in_status;
  if (params?.search) queryParams.search = params.search;
  if (params?.order_status) queryParams.order_status = params.order_status;

  const response = await api.get(API_ENDPOINTS.EVENT_PARTICIPANTS(eventId), { params: queryParams });
  return response.data;
};

export const getItemEventParticipantDetail = async (participantId: number): Promise<SingleResponse<ItemEventParticipant>> => {
  const response = await api.get(API_ENDPOINTS.EVENT_PARTICIPANT_DETAIL(participantId));
  return response.data;
};

export const checkInItemEventParticipant = async (
  participantId: number,
  checkInData: {
    check_in_method: string;
    location?: string;
    operator?: string;
    notes?: string;
  }
): Promise<SingleResponse<{ message: string }>> => {
  const response = await api.put(API_ENDPOINTS.EVENT_PARTICIPANT_CHECKIN(participantId), checkInData);
  return response.data;
};

export const getItemEventParticipantByCode = async (bindingCode: string): Promise<SingleResponse<ItemEventParticipant>> => {
  const response = await api.get(API_ENDPOINTS.EVENT_PARTICIPANT_BY_CODE(bindingCode));
  return response.data;
};

// ItemEventStatistics API 函數
export const getItemEventStatistics = async (eventId: number): Promise<SingleResponse<ItemEventStatistics>> => {
  const response = await api.get(API_ENDPOINTS.EVENT_STATISTICS(eventId));
  return response.data;
};

export const refreshItemEventStatistics = async (eventId: number): Promise<SingleResponse<{ message: string }>> => {
  const response = await api.put(API_ENDPOINTS.EVENT_STATISTICS_REFRESH(eventId), {});
  return response.data;
};

// 表單欄位批量創建 API 函數
export interface BatchFormFieldCreate {
  id?: string | number;      // 欄位 ID（sync API 使用，有 id 表示更新，無 id 表示創建）
  field_type: FormFieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  order: number;
  multiSelectConfig?: {
    minSelection?: number;
    maxSelection?: number;
  };
  options?: Array<{
    id?: string | number;    // 選項 ID（sync API 使用）
    label: string;
    price: number;
    order: number;
    conditionalFields?: BatchFormFieldCreate[];
  }>;
}

export interface BatchFormFieldsRequest {
  fields: BatchFormFieldCreate[];
}

export interface BatchFormFieldsResponse {
  success: boolean;
  data: {
    form_config: FormField[];
    stats: {
      // batch-create API 的統計
      fields_count?: number;
      options_count?: number;
      conditional_fields_count?: number;
      // sync API 的統計
      fields_created?: number;
      fields_updated?: number;
      fields_deleted?: number;
      options_created?: number;
      options_updated?: number;
      options_deleted?: number;
      conditionals_created?: number;
      conditionals_updated?: number;
      conditionals_deleted?: number;
    };
  };
  message: string;
}

export const batchCreateFormFields = async (
  eventId: number,
  fieldsData: BatchFormFieldsRequest
): Promise<BatchFormFieldsResponse> => {
  const response = await api.post(API_ENDPOINTS.EVENT_FORM_FIELDS_BATCH_CREATE(eventId), fieldsData);
  return response.data;
};

export const syncFormFields = async (
  eventId: number,
  fieldsData: BatchFormFieldsRequest
): Promise<BatchFormFieldsResponse> => {
  const response = await api.post(API_ENDPOINTS.EVENT_FORM_FIELDS_SYNC(eventId), fieldsData);
  return response.data;
};

export const getFormFields = async (eventId: number): Promise<SingleResponse<FormField[]>> => {
  const response = await api.get(API_ENDPOINTS.EVENT_FORM_FIELDS_GET(eventId));
  return response.data;
};

// Public ItemEvent API 函數
export const getPublicItemEventDetail = async (eventId: number): Promise<SingleResponse<ItemEventItem>> => {
  const response = await api.get(API_ENDPOINTS.PUBLIC_EVENT_DETAIL(eventId));
  return response.data;
};

export const searchPublicItemEvents = async (
  q = '',
  moduleType = '',
  page = 1,
  pageSize = 20
): Promise<PaginatedResponse<ItemEventItem>> => {
  const params: any = { page, page_size: pageSize };
  if (q) params.q = q;
  if (moduleType) params.module_type = moduleType;
  
  const response = await api.get(API_ENDPOINTS.PUBLIC_EVENT_SEARCH, { params });
  return response.data;
};

// ==================== 活動管理輔助函數 ====================

// 檢查活動是否可以刪除
export const canDeleteEvent = (event: ItemEventItem): boolean => {
  if (!event.statistics) return true;
  return event.statistics.total_registrations === 0;
};

// 獲取活動狀態顯示文字
export const getEventStatusDisplay = (status: string): string => {
  const statusMap: Record<string, string> = {
    draft: '草稿',
    registration_open: '報名開放',
    registration_closed: '報名截止',
    in_progress: '進行中',
    completed: '已完成',
    cancelled: '已取消'
  };
  return statusMap[status] || status;
};

// 檢查活動是否正在進行
export const isEventActive = (event: ItemEventItem): boolean => {
  const now = new Date();
  const startTime = new Date(event.start_time);
  const endTime = new Date(event.end_time);
  return now >= startTime && now <= endTime;
};

// 檢查活動是否可以報名
export const canRegisterEvent = (event: ItemEventItem): boolean => {
  if (event.event_status !== 'registration_open') return false;
  if (!event.statistics) return true;
  return event.statistics.total_participants < event.max_participants;
};

// ==================== 活動報名相關 API 函數 ====================

// 根據 SKU 獲取活動報名資訊
export const getEventJoinInfo = async (sku: string, queryParams?: Record<string, string>): Promise<SingleResponse<EventJoinInfo>> => {
  const response = await api.get(API_ENDPOINTS.EVENT_JOIN_INFO(sku), {
    params: queryParams
  });
  return response.data;
};

// 獲取活動列表（不篩查使用者）
export const getEventSkuList = async (
  page = 1,
  perPage = 12,
  providerSlug?: string
): Promise<SingleResponse<{ events: ItemEventItem[] }>> => {
  const response = await api.get(API_ENDPOINTS.EVENT_SKU_LIST(), {
    params: {
      page,
      per_page: perPage,
      manager: 1,
      ...(providerSlug ? { provider_slug: providerSlug } : {})
    }
  });
  return response.data;
};

// 提交活動報名
export const submitEventRegistration = async (
  sku: string,
  registrationData: EventRegistrationData
): Promise<SingleResponse<{ registration_id: number; message: string }>> => {
  const response = await api.post(API_ENDPOINTS.EVENT_REGISTRATION_SUBMIT(sku), registrationData);
  return response.data;
};

// 創建訂單（用於活動報名支付）
export const createOrder = async (
  orderData: CreateOrderRequest
): Promise<CreateOrderResponse> => {
  try {
    const response = await api.post(API_ENDPOINTS.CREATE_ORDER, orderData);
    return response.data;
  } catch (error: any) {
    console.error('創建訂單失敗:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || '創建訂單時發生錯誤'
    };
  }
};

// 獲取推薦訂單列表
export const getReferrerOrders = async (itemId: number): Promise<ReferrerOrdersResponse> => {
  try {
    const response = await api.get(API_ENDPOINTS.REFERRER_ORDERS, {
      params: { item_id: itemId }
    });
    return response.data;
  } catch (error: any) {
    console.error('獲取推薦訂單失敗:', error);
    return {
      success: false,
      data: [],
      error: error.response?.data?.error || error.message || '獲取推薦訂單時發生錯誤',
      message: error.response?.data?.message || '獲取推薦訂單失敗'
    };
  }
};

/**
 * 獲取我的活動訂單
 * @param params 查詢參數
 * @param params.status 訂單狀態 (pending, paid, completed, cancelled, etc.)
 * @param params.page 頁碼
 * @param params.page_size 每頁數量
 * @returns Promise<MyOrdersResponse>
 */
export const getMyOrders = async (params?: {
  status?: string;
  page?: number;
  page_size?: number;
}): Promise<MyOrdersResponse> => {
  try {
    console.log('🌐 [API] 發送請求至:', API_ENDPOINTS.MY_ORDERS);
    console.log('🌐 [API] 請求參數:', params);
    const response = await api.get(API_ENDPOINTS.MY_ORDERS, { params });
    console.log('🌐 [API] 回應狀態:', response.status);
    console.log('🌐 [API] 回應數據:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ [API] 獲取我的訂單失敗:', error);
    console.error('❌ [API] 錯誤狀態碼:', error.response?.status);
    console.error('❌ [API] 錯誤回應:', error.response?.data);
    return {
      success: false,
      data: {
        orders: [],
        pagination: {
          current_page: 1,
          total_pages: 0,
          total_count: 0,
          page_size: 20,
          has_next: false,
          has_previous: false
        }
      },
      error: error.response?.data?.error || error.message || '獲取我的訂單時發生錯誤',
      message: error.response?.data?.message || '獲取我的訂單失敗'
    };
  }
};

// ==================== 付款相關 API 函數 ====================

/**
 * 執行訂單付款
 * @param orderPk 訂單 ID
 * @param paymentMethod 付款方式（例如：'NewebPay', 'LINEPay'）
 * @returns 付款訂單響應（可能包含第三方付款 URL）
 */
export const payOrder = async (orderPk: number, paymentMethod: string): Promise<PayOrderResponse> => {
  try {
    console.log('🌐 [API] 執行訂單付款:', { orderPk, paymentMethod });
    const response = await api.post(API_ENDPOINTS.PAY_ORDER(orderPk, paymentMethod));
    console.log('✅ [API] 付款訂單回應:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ [API] 執行訂單付款失敗:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || '執行訂單付款時發生錯誤',
      message: error.response?.data?.message || '執行訂單付款失敗'
    };
  }
};

// ==================== Survey 問卷管理系統 API 函數 ====================

// Survey CRUD API 函數
export const getSurveyList = async (
  page = 1,
  pageSize = 20,
  search = '',
  isActive?: boolean
): Promise<PaginatedResponse<Survey>> => {
  const params: any = { page, page_size: pageSize };
  if (search) params.search = search;
  if (isActive !== undefined) params.is_active = isActive;
  
  const response = await api.get(API_ENDPOINTS.SURVEY_LIST, { params });
  return response.data;
};

export const createSurvey = async (surveyData: {
  title: string;
  description: string;
  is_active: boolean;
  create_default_section: boolean;
}): Promise<SingleResponse<{ id: number }>> => {
  const response = await api.post(API_ENDPOINTS.SURVEY_CREATE, surveyData);
  return response.data;
};

export const getSurveyDetail = async (surveyId: number): Promise<SingleResponse<Survey>> => {
  const response = await api.get(API_ENDPOINTS.SURVEY_DETAIL(surveyId));
  return response.data;
};

export const updateSurvey = async (
  surveyId: number,
  surveyData: Partial<Survey>
): Promise<SingleResponse<{ id: number }>> => {
  const response = await api.put(API_ENDPOINTS.SURVEY_UPDATE(surveyId), surveyData);
  return response.data;
};

export const deleteSurvey = async (surveyId: number): Promise<SingleResponse<{ message: string }>> => {
  const response = await api.delete(API_ENDPOINTS.SURVEY_DELETE(surveyId));
  return response.data;
};

// Section CRUD API 函數
export const createSection = async (
  surveyId: number,
  sectionData: {
    title: string;
    description: string;
    order: number;
  }
): Promise<SingleResponse<{ id: number }>> => {
  const response = await api.post(API_ENDPOINTS.SECTION_CREATE(surveyId), sectionData);
  return response.data;
};

export const updateSection = async (
  sectionId: number,
  sectionData: Partial<Section>
): Promise<SingleResponse<{ id: number }>> => {
  const response = await api.put(API_ENDPOINTS.SECTION_UPDATE(sectionId), sectionData);
  return response.data;
};

export const deleteSection = async (sectionId: number): Promise<SingleResponse<{ message: string }>> => {
  const response = await api.delete(API_ENDPOINTS.SECTION_DELETE(sectionId));
  return response.data;
};

// Question CRUD API 函數
export const createQuestion = async (
  surveyId: number,
  questionData: {
    section_id: number;
    text: string;
    help_text?: string;
    type: 'single' | 'multi' | 'short' | 'long' | 'rating' | 'date' | 'number';
    required: boolean;
    order: number;
    allow_other: boolean;
    rating_min?: number;
    rating_max?: number;
    choices?: Array<{
      label: string;
      value: string;
      order: number;
      is_other: boolean;
    }>;
  }
): Promise<SingleResponse<{ id: number }>> => {
  const response = await api.post(API_ENDPOINTS.QUESTION_CREATE(surveyId), questionData);
  return response.data;
};

export const updateQuestion = async (
  questionId: number,
  questionData: Partial<Question>
): Promise<SingleResponse<{ id: number }>> => {
  const response = await api.put(API_ENDPOINTS.QUESTION_UPDATE(questionId), questionData);
  return response.data;
};

export const deleteQuestion = async (questionId: number): Promise<SingleResponse<{ message: string }>> => {
  const response = await api.delete(API_ENDPOINTS.QUESTION_DELETE(questionId));
  return response.data;
};

// Choice CRUD API 函數
export const createChoice = async (
  questionId: number,
  choiceData: {
    label: string;
    value: string;
    order: number;
    is_other: boolean;
  }
): Promise<SingleResponse<{ id: number }>> => {
  const response = await api.post(API_ENDPOINTS.CHOICE_CREATE(questionId), choiceData);
  return response.data;
};

export const updateChoice = async (
  choiceId: number,
  choiceData: Partial<Choice>
): Promise<SingleResponse<{ id: number }>> => {
  const response = await api.put(API_ENDPOINTS.CHOICE_UPDATE(choiceId), choiceData);
  return response.data;
};

export const deleteChoice = async (choiceId: number): Promise<SingleResponse<{ message: string }>> => {
  const response = await api.delete(API_ENDPOINTS.CHOICE_DELETE(choiceId));
  return response.data;
};

// Submission CRUD API 函數
export const createSubmission = async (
  surveyId: number,
  submissionData: {
    session_key: string;
    meta: {
      user_agent?: string;
      ip_address?: string;
      timestamp?: string;
    };
  }
): Promise<SingleResponse<{ id: number }>> => {
  const response = await api.post(API_ENDPOINTS.SUBMISSION_CREATE(surveyId), submissionData);
  return response.data;
};

export const completeSubmission = async (submissionId: number): Promise<SingleResponse<{ message: string }>> => {
  const response = await api.put(API_ENDPOINTS.SUBMISSION_COMPLETE(submissionId), {});
  return response.data;
};

export const getSubmissionList = async (
  surveyId: number,
  page = 1,
  pageSize = 20
): Promise<PaginatedResponse<Submission>> => {
  const params = { page, page_size: pageSize };
  const response = await api.get(API_ENDPOINTS.SUBMISSION_LIST(surveyId), { params });
  return response.data;
};

// Answer CRUD API 函數
export const createAnswer = async (
  submissionId: number,
  answerData: {
    question_id: number;
    selected_choice_id?: number;
    text_value?: string;
    long_text_value?: string;
    rating_value?: number;
    date_value?: string;
    number_value?: number;
    other_text?: string;
    selected_choice_ids?: number[];
  }
): Promise<SingleResponse<{ id: number }>> => {
  const response = await api.post(API_ENDPOINTS.ANSWER_CREATE(submissionId), answerData);
  return response.data;
};

export const updateAnswer = async (
  answerId: number,
  answerData: Partial<Answer>
): Promise<SingleResponse<{ id: number }>> => {
  const response = await api.put(API_ENDPOINTS.ANSWER_UPDATE(answerId), answerData);
  return response.data;
};

// Analytics API 函數
export const getSurveyAnalytics = async (surveyId: number): Promise<SingleResponse<SurveyAnalytics>> => {
  const response = await api.get(API_ENDPOINTS.SURVEY_ANALYTICS(surveyId));
  return response.data;
};

// Rules API 函數
export const createVisibilityRule = async (ruleData: {
  target_question_id: number;
  match: 'all' | 'any';
  action: 'show' | 'hide';
  priority: number;
  conditions: Array<{
    source_question_id: number;
    operator: string;
    choice_ids: number[];
  }>;
}): Promise<SingleResponse<{ id: number }>> => {
  const response = await api.post(API_ENDPOINTS.VISIBILITY_RULE_CREATE, ruleData);
  return response.data;
};

export const createSkipRule = async (ruleData: {
  source_question_id: number;
  match: 'all' | 'any';
  goto_question_id?: number;
  goto_section_id?: number;
  goto_end: boolean;
  priority: number;
  conditions: Array<{
    source_question_id: number;
    operator: string;
    choice_ids: number[];
  }>;
}): Promise<SingleResponse<{ id: number }>> => {
  const response = await api.post(API_ENDPOINTS.SKIP_RULE_CREATE, ruleData);
  return response.data;
};

// ==================== 導師專區相關介面 ====================

// 業務卡片資料介面
export interface BusinessCardProfile {
  id: number;
  name: string;
  bio: string;
  email: string;
  show_email: boolean;
  phone: string;
  show_phone: boolean;
  mobile: string;
  show_mobile: boolean;
  address: string;
  show_address: boolean;
  bg_color: string;
  text_color: string;
  button_color: string;
  button_text_color: string;
  ctag_bg_color: string;
  ctag_text_color: string;
  contact_bg_color: string;
  contact_icon_color: string;
  social_icon_color: string;
  page_bg_color: string;
  slug: string;
  social_position: string;
  social_size: string;
  profile_picture_url: string | null;
  view_web_count: number;
  share_line_count: number;
}

// 標籤資料介面
export interface BusinessCardTag {
  id: number;
  text: string;
  is_visible: boolean;
  order: number;
}

// 社群媒體資料介面
export interface BusinessCardSocialMedia {
  platform: string;
  is_active: boolean;
}

// 業務卡片完整資料介面
export interface BusinessCardData {
  profile: BusinessCardProfile;
  tags: BusinessCardTag[];
  qr_code_base64: string;
  pp_url: string;
  page_bg_color: string;
  text_color: string;
  share_pp: string;
}

// 業務卡片列表項目介面
export interface BusinessCardListItem {
  order: number;
  data: BusinessCardData;
  profile: any; // 原始 profile 物件
}

// 業務卡片審核 API 響應介面
export interface BusinessCardApproveResponse {
  success: boolean;
  message: string;
  data?: {
    profile_list?: BusinessCardListItem[];
  };
  profile_list?: BusinessCardListItem[]; // 支援頂層結構
}

// 導師專區 API 函數
export const getBusinessCardApprove = async (): Promise<BusinessCardApproveResponse> => {
  const response = await api.get(API_ENDPOINTS.BUSINESS_CARD_APPROVE);
  return response.data;
};

// 影音文章 API 函數
export const getArticlesAll = async (page = 1, perPage = 10, providerSlug?: string): Promise<ArticleListResponse> => {
  const response = await api.get(API_ENDPOINTS.ARTICLES_ALL, {
    params: {
      page,
      per_page: perPage,
      ...(providerSlug ? { provider_slug: providerSlug } : {})
    }
  });
  return response.data;
};

// 文字模型列表 API 介面
export interface TextModel {
  id: number;
  name: string;
  type: string;
}

export interface TextModelListResponse {
  success: boolean;
  message: string;
  data: TextModel[];
}

// 文字模型列表 API 函數
export const getTextModelList = async (): Promise<TextModelListResponse> => {
  const response = await api.get(API_ENDPOINTS.TEXT_MODEL_LIST);
  return response.data;
};

// ==================== CRM 會員管理系統相關介面 ====================

// 會員卡資料介面
export interface MemberCard {
  id: number;
  card_id: string;
  exp: number;
  points: number;
  coins: number;
  tokens: number;
  mdt_add: string;
  client_info: {
    id: number;
    name: string;
  };
  member_info: {
    id: number;
    name: string;
  };
}

// 會員詳細資料介面
export interface MemberDetails {
  id: number;
  member_card_id: number;
  nick_name: string;
  email: string;
  phone: string;
  birthday: string;
  gender: 'male' | 'female' | 'other';
  address: string;
  mdt_add: string;
  created: boolean;
}

// 會員訂閱狀態介面
export interface MemberSubscription {
  plan: string;
  start_at: string;
  end_at: string;
  days_left: number;
  auto_renew: boolean;
}

// 會員餘額介面
export interface MemberBalance {
  total_remaining: number;
  subscription: number;
  addon: number;
}

// 待處理變更介面
export interface MemberPendingChange {
  has_pending: boolean;
  target_plan: string | null;
  effective_at: string | null;
}

// 最近使用記錄介面
export interface MemberRecentUsage {
  kind: string;
  tokens: number;
  created_at: string;
}

// 會員狀態介面
export interface MemberStatus {
  success: boolean;
  data: {
    subscription: MemberSubscription;
    balance: MemberBalance;
    pending_change: MemberPendingChange;
    recent_usage: MemberRecentUsage[];
  };
}

// 完整會員資料介面
export interface MemberComplete {
  member_card: MemberCard;
  member_details: MemberDetails;
  member_status?: MemberStatus | null;
}

// 會員詳細資料更新資料介面
export interface MemberDetailsUpdateData {
  nick_name?: string;
  email?: string;
  phone?: string;
  birthday?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
}

// CRM API 回應介面
export interface MemberCardResponse {
  success: boolean;
  data: MemberCard;
  message: string;
}

export interface MemberDetailsResponse {
  success: boolean;
  data: MemberDetails;
  message: string;
}

export interface MemberCompleteResponse {
  success: boolean;
  data: MemberComplete;
  message: string;
}

export interface MemberDetailsUpdateResponse {
  success: boolean;
  data: MemberDetails & {
    updated_fields: string[];
  };
  message: string;
}

// ==================== CRM 會員管理系統 API 函數 ====================

// 取得會員卡資料
export const getMemberCard = async (): Promise<MemberCardResponse> => {
  const response = await api.get(API_ENDPOINTS.MEMBER_CARD);
  return response.data;
};

// 根據卡號查詢會員資料
export const getMemberCardById = async (cardId: string): Promise<MemberCompleteResponse> => {
  const response = await api.get(API_ENDPOINTS.MEMBER_CARD_BY_ID(cardId));
  return response.data;
};

// 取得會員詳細資料
export const getMemberDetails = async (): Promise<MemberDetailsResponse> => {
  const response = await api.get(API_ENDPOINTS.MEMBER_DETAILS);
  return response.data;
};

// 更新會員詳細資料
export const updateMemberDetails = async (data: MemberDetailsUpdateData): Promise<MemberDetailsUpdateResponse> => {
  const response = await api.post(API_ENDPOINTS.MEMBER_DETAILS_UPDATE, data);
  return response.data;
};

// 取得完整會員資料
export const getMemberComplete = async (): Promise<MemberCompleteResponse> => {
  const response = await api.get(API_ENDPOINTS.MEMBER_COMPLETE);
  return response.data;
};

// ==================== Keys 金鑰模組 - 型別與 API 方法 ====================
export interface KeyBatchCreatePayload {
  mode: 'unique' | 'event';
  title: string;
  days?: number;
  points?: number;
  coins?: number;
  tokens?: number; // backward compatibility
  role?: 'manager' | 'service' | 'agent' | 'provider';
  managed_client_id?: number;
  sub_plan?: string;
  sub_months?: number;
  sub_policy?: 'IMMEDIATE' | 'NEXT_BILLING_CYCLE' | 'FIXED_DATE';
  sub_fixed_date?: string;
  sub_override?: boolean;
  count?: number;
  code_len?: number;
  event_code?: string;
  max_uses?: number;
  per_member?: number;
  allowed_channels?: string[];
  audience_filter_json?: Record<string, any>;
}

export const keysCreateBatch = async (payload: KeyBatchCreatePayload) => {
  const response = await api.post(API_ENDPOINTS.KEYS_BATCH_CREATE, payload);
  return response.data;
};

export const keysListBatches = async (params?: { page?: number; page_size?: number; managed_client_id?: number }) => {
  const response = await api.get(API_ENDPOINTS.KEYS_BATCH_LIST, { params });
  return response.data;
};

export const keysGetBatchDetail = async (batchId: number, params?: { status?: 'available' | 'used' | 'all' }) => {
  const response = await api.get(API_ENDPOINTS.KEYS_BATCH_DETAIL(batchId), { params });
  return response.data;
};

export const keysExportBatch = async (
  batchId: number,
  params?: { format?: 'xlsx' | 'csv'; only_unused?: boolean }
): Promise<Blob> => {
  const response = await api.get(API_ENDPOINTS.KEYS_BATCH_EXPORT(batchId), {
    params,
    responseType: 'blob',
  });
  return response.data as Blob;
};

export const keysRedeem = async (data: { code: string; request_id?: string; channel?: string }) => {
  const response = await api.post(API_ENDPOINTS.KEYS_REDEEM, data);
  return response.data;
};

export const keysMyRedemptions = async (params?: { page?: number; page_size?: number }) => {
  const response = await api.get(API_ENDPOINTS.KEYS_REDEMPTIONS, { params });
  return response.data;
};

export const keysMarkUsed = async (batchId: number) => {
  const response = await api.post(API_ENDPOINTS.KEYS_MARK_USED(batchId));
  return response.data;
};

// ==================== AI 模組配置相關介面與 API ====================

// AI 模組配置介面 - 新格式
export interface AIModuleBranch {
  pk: number; // branch 的主鍵
  per_unit: number;
  token_per_unit: number;
  rate_type: 'per_chars' | 'per_second';
  branch?: string; // 對於 s2v，有 "720p" 或 "540p"
  limits?: {
    max_chars?: number; // 對於 t2s，字數上限
  };
}

export interface AIModel {
  name: string;
  branch: AIModuleBranch[];
}

export interface AIModuleConfig {
  modules: {
    t2s?: Array<{ [key: string]: AIModel }>;
    s2v?: Array<{ [key: string]: AIModel }>;
  };
  total_tokens?: string;
}

export interface AIModulesResponse {
  success: boolean;
  data: AIModuleConfig;
  message: string;
}

// 輔助函數：從模組列表中提取模型
export const extractModels = (moduleList?: Array<{ [key: string]: AIModel }>): { id: string; model: AIModel }[] => {
  if (!moduleList || moduleList.length === 0) return [];
  
  const models: { id: string; model: AIModel }[] = [];
  moduleList.forEach(item => {
    Object.entries(item).forEach(([id, model]) => {
      models.push({ id, model });
    });
  });
  return models;
};

/**
 * 獲取 AI 模組配置
 * @param modeOfAction - 操作模式：'t2s' (音頻創作) 或 's2v' (影片創作)
 * @returns Promise<AIModulesResponse>
 */
export const getAIModules = async (modeOfAction: 't2s' | 's2v'): Promise<AIModulesResponse> => {
  try {
    const response = await api.get(API_ENDPOINTS.AI_MODULES, {
      params: {
        mode_of_action: modeOfAction
      }
    });
    return response.data;
  } catch (error: any) {
    console.error('獲取 AI 模組配置失敗:', error);
    return {
      success: false,
      data: {
        modules: {
          t2s: [],
          s2v: []
        },
        total_tokens: '0'
      },
      message: error.response?.data?.message || '獲取 AI 模組配置失敗'
    };
  }
};

// ==================== AIGen API 函數 ====================

// AIGen API 回應類型
interface ApiResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
  status?: number;
}

/**
 * 建立聲音克隆需求
 * @param voiceModelId 聲音模型ID
 * @param label 標籤名稱
 * @param textContent 要克隆的文字內容
 * @param modelPk AI模組的主鍵（從 AI 模組列表中獲取）
 * @param modelSubPk AI模組分支的主鍵（從 branch.pk 中獲取）
 * @param emotionValues 情緒強度值
 * @returns Promise<ApiResponse>
 */
export const createSoundClone = async (
  voiceModelId: number,
  label: string,
  textContent: string,
  modelPk: string,
  modelSubPk: number,
  emotionValues?: {[key: string]: number}
): Promise<ApiResponse> => {
  try {
    const response = await api.post('/aigen/api/create_sound_clone/', {
      voice_model_id: voiceModelId,
      label: label,
      text_content: textContent,
      model_pk: modelPk,
      model_sub_pk: modelSubPk,
      emotion_values: emotionValues || {}
    });

    return {
      success: true,
      data: response.data,
      message: response.data.message || '聲音克隆需求建立成功'
    };
  } catch (error: any) {
    console.error('建立聲音克隆需求失敗:', error);
    
    if (error.response?.status === 400) {
      return {
        success: false,
        error: error.response.data.error || '重複提交或無效數據',
        status: 400
      };
    }
    
    if (error.response?.status === 405) {
      return {
        success: false,
        error: '僅支援 POST 請求',
        status: 405
      };
    }
    
    return {
      success: false,
      error: error.response?.data?.error || '建立聲音克隆需求失敗',
      status: error.response?.status || 500
    };
  }
};

/**
 * 生成AI音頻
 * @param title 音頻標題
 * @param voiceModelId 聲音模型ID
 * @param textContent 文字內容
 * @param modelPk AI模組的主鍵（從 AI 模組列表中獲取）
 * @param modelSubPk AI模組分支的主鍵（從 branch.pk 中獲取）
 * @param emotionValues 情緒強度值
 * @returns Promise<ApiResponse>
 */
export const generateAIAudio = async (
  title: string,
  voiceModelId: number | null,
  textContent: string | null,
  modelPk: string,
  modelSubPk: number,
  emotionValues: {[key: string]: number},
  priority: number = 5, // 優先級，預設為5
  dialogueScript?: {[key: string]: any} // 擴增模式的對話腳本（可選）
): Promise<ApiResponse> => {
  try {
    // 根據是否有 dialogueScript 來決定發送的數據
    const requestData: any = {
      label: title, // 使用title作為label
      model_pk: modelPk,
      model_sub_pk: modelSubPk,
      priority: priority // 添加優先級參數
    };

    if (dialogueScript) {
      // 擴增模式：發送對話腳本
      requestData.dialogue_script = dialogueScript;
    } else {
      // 基礎模式：發送單一語音模型和文案
      requestData.voice_model_id = voiceModelId;
      requestData.text_content = textContent;
      requestData.emotion_values = emotionValues; // 額外的情緒數據
    }

    const response = await api.post('/aigen/api/create_sound_clone/', requestData);

    return {
      success: true,
      data: response.data,
      message: response.data.message || 'AI音頻生成成功'
    };
  } catch (error: any) {
    console.error('生成AI音頻失敗:', error);

    return {
      success: false,
      error: error.response?.data?.error || '生成AI音頻失敗',
      status: error.response?.status || 500
    };
  }
};

/**
 * 取得聲音克隆記錄列表
 * @returns Promise<ApiResponse>
 */
export const getSoundCloneList = async (): Promise<ApiResponse> => {
  try {
    const response = await api.get('/aigen/api/sound_clone_list/');
    
    return {
      success: true,
      data: response.data,
      message: response.data.message || '聲音克隆記錄獲取成功'
    };
  } catch (error: any) {
    console.error('獲取聲音克隆記錄失敗:', error);
    
    return {
      success: false,
      error: error.response?.data?.error || '獲取聲音克隆記錄失敗',
      status: error.response?.status || 500
    };
  }
};

/**
 * 取得特定聲音克隆的詳細資訊
 * @param soundCloneId 聲音克隆ID
 * @returns Promise<ApiResponse>
 */
export const getSoundCloneDetail = async (soundCloneId: number): Promise<ApiResponse> => {
  try {
    const response = await api.get(`/aigen/api/sound_clone_detail/${soundCloneId}/`);
    
    return {
      success: true,
      data: response.data,
      message: response.data.message || '聲音克隆詳細資訊獲取成功'
    };
  } catch (error: any) {
    console.error('獲取聲音克隆詳細資訊失敗:', error);
    
    return {
      success: false,
      error: error.response?.data?.error || '獲取聲音克隆詳細資訊失敗',
      status: error.response?.status || 500
    };
  }
};

// ==================== 影片生成相關 API 函數 ====================

/**
 * 創建影片生成需求（不帶圖片）
 * @param data 包含語音模型、影片模型、標題和文案的數據
 * @returns Promise<ApiResponse>
 */
export const createVideoGeneration = async (data: {
  voice_model_id: number;
  video_model_id: number;
  label: string;
  text_content: string;
}): Promise<ApiResponse> => {
  try {
    const response = await api.post(API_ENDPOINTS.CREATE_VIDEO_GENERATION, data);
    
    return {
      success: true,
      data: response.data,
      message: response.data.message || '影片生成需求創建成功'
    };
  } catch (error: any) {
    console.error('創建影片生成需求失敗:', error);
    
    return {
      success: false,
      error: error.response?.data?.error || '創建影片生成需求失敗',
      status: error.response?.status || 500
    };
  }
};

/**
 * 創建帶圖片的影片生成需求
 * @param formData FormData 包含圖片和相關參數
 * @param modelPk 模型主鍵
 * @param modelSubPk 模型子鍵
 * @returns Promise<ApiResponse>
 */
export const createVideoGenerationWithImage = async (
  formData: FormData, 
  modelPk: string, 
  modelSubPk: number
): Promise<ApiResponse> => {
  try {
    // 添加 model_pk 和 model_sub_pk 到 formData
    formData.append('model_pk', modelPk);
    formData.append('model_sub_pk', modelSubPk.toString());
    
    const response = await api.post(API_ENDPOINTS.VIDEO_GENERATION_WITH_IMAGE_CREATE, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
    
    return {
      success: true,
      data: response.data,
      message: response.data.message || '影片生成需求創建成功'
    };
  } catch (error: any) {
    console.error('創建影片生成需求失敗:', error);
    
    return {
      success: false,
      error: error.response?.data?.error || '創建影片生成需求失敗',
      status: error.response?.status || 500
    };
  }
};

/**
 * 取得影片生成需求列表
 * @returns Promise<ApiResponse>
 */
export const getVideoGenerationWithImageList = async (): Promise<ApiResponse> => {
  try {
    const response = await api.get(API_ENDPOINTS.VIDEO_GENERATION_WITH_IMAGE_LIST);
    
    return {
      success: true,
      data: response.data,
      message: response.data.message || '影片生成記錄獲取成功'
    };
  } catch (error: any) {
    console.error('獲取影片生成記錄失敗:', error);
    
    return {
      success: false,
      error: error.response?.data?.error || '獲取影片生成記錄失敗',
      status: error.response?.status || 500
    };
  }
};

/**
 * 取得影片生成需求詳細資訊
 * @param videoGenerationId 影片生成ID
 * @returns Promise<ApiResponse>
 */
export const getVideoGenerationWithImageDetail = async (videoGenerationId: number): Promise<ApiResponse> => {
  try {
    const response = await api.get(API_ENDPOINTS.VIDEO_GENERATION_WITH_IMAGE_DETAIL(videoGenerationId));
    
    return {
      success: true,
      data: response.data,
      message: response.data.message || '影片生成詳細資訊獲取成功'
    };
  } catch (error: any) {
    console.error('獲取影片生成詳細資訊失敗:', error);
    
    return {
      success: false,
      error: error.response?.data?.error || '獲取影片生成詳細資訊失敗',
      status: error.response?.status || 500
    };
  }
};

export { api };
