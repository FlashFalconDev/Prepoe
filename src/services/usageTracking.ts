/**
 * 應用情境停留 API 服務
 * 用於追蹤用戶在不同功能模組的使用情況
 * 
 * API 文檔: https://rise.iii.org.tw/app_restful/public/index.php/api/customers/add/2
 */

interface UsageTrackingParams {
  action_id: string;      // 情境種類，例如: ai_audio_step1
  action_name: string;    // 情境描述，例如: 基本資訊
  now_page: string;       // 現在的頁面，例如: 基本資訊
  use_time?: string;      // 該網頁的總使用時間，預設為 "0"
}

/**
 * 發送使用情境追蹤資料
 * @param params 追蹤參數
 * @returns Promise<void>
 */
export const trackUsage = async (params: UsageTrackingParams): Promise<void> => {
  try {
    // 從 localStorage 獲取用戶資訊
    let device_id = '';
    let ip = '';
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userObj = JSON.parse(userStr);
        device_id = userObj.id ? String(userObj.id) : '';
        ip = userObj.ip_address ? String(userObj.ip_address) : '';
      }
    } catch (e) {
      console.error('解析用戶資訊失敗:', e);
    }

    // 判斷設備類型
    const view = /phone|android|mobile/i.test(navigator.userAgent) ? 'phone' : 'PC';

    // 組裝請求參數
    const body = {
      mode: "2",                                      // 固定值為 2
      app_id: "114_光隼",                             // 固定回傳 "114_光隼"
      action_id: params.action_id,
      action_name: params.action_name,
      use_time: params.use_time || "0",
      time: Math.floor(Date.now() / 1000),           // Unix timestamp
      device_id: device_id || "",
      ip: ip || "",
      view,
      now_page: params.now_page,
    };

    // 轉換為 URL-encoded 格式
    const formBody = Object.entries(body)
      .map(([key, value]) => encodeURIComponent(key) + '=' + encodeURIComponent(value))
      .join('&');

    // 發送請求
    const response = await fetch('https://rise.iii.org.tw/app_restful/public/index.php/api/customers/add/2', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded' 
      },
      body: formBody,
    });

    const responseText = await response.text();
    console.log('使用情境追蹤 API 回應:', responseText);
    
    if (!response.ok) {
      console.error('使用情境追蹤失敗:', response.status, responseText);
    }
  } catch (error) {
    console.error('發送使用情境追蹤時發生錯誤:', error);
  }
};

/**
 * 音頻創作步驟追蹤
 */
export const trackAudioStep = async (step: number): Promise<void> => {
  const stepMap = [
    { action_id: 'ai_audio_step1', action_name: '基本資訊', now_page: '基本資訊' },
    { action_id: 'ai_audio_step2', action_name: '語音模型', now_page: '語音模型' },
    { action_id: 'ai_audio_step3', action_name: '情緒調整', now_page: '情緒調整' },
    { action_id: 'ai_audio_step4', action_name: '文案編輯', now_page: '文案編輯' },
    { action_id: 'ai_audio_step5', action_name: 'AI生成', now_page: 'AI生成' },
  ];
  
  const info = stepMap[step - 1];
  if (info) {
    await trackUsage(info);
  }
};

/**
 * 影片創作步驟追蹤
 */
export const trackVideoStep = async (step: number): Promise<void> => {
  const stepMap = [
    { action_id: 'ai_video_step1', action_name: '基本資訊', now_page: '基本資訊' },
    { action_id: 'ai_video_step2', action_name: '語音模型', now_page: '語音模型' },
    { action_id: 'ai_video_step3', action_name: '影像素材', now_page: '影像素材' },
    { action_id: 'ai_video_step4', action_name: '影片情境', now_page: '影片情境' },
    { action_id: 'ai_video_step5', action_name: 'AI生成', now_page: 'AI生成' },
  ];
  
  const info = stepMap[step - 1];
  if (info) {
    await trackUsage(info);
  }
};

/**
 * 影片創作（圖片+音頻）步驟追蹤
 */
export const trackVideoCreationStep = async (step: number): Promise<void> => {
  const stepMap = [
    { action_id: 'video_creation_step1', action_name: '影片標題', now_page: '基本資訊' },
    { action_id: 'video_creation_step2', action_name: '語音模型', now_page: '語音模型' },
    { action_id: 'video_creation_step3', action_name: '選擇素材', now_page: '影像素材' },
    { action_id: 'video_creation_step4', action_name: '影片情境', now_page: '影片情境描述' },
    { action_id: 'video_creation_step5', action_name: '生成影片', now_page: 'AI生成' },
  ];
  
  const info = stepMap[step - 1];
  if (info) {
    await trackUsage(info);
  }
};

/**
 * 通用頁面訪問追蹤
 */
export const trackPageVisit = async (pageName: string): Promise<void> => {
  await trackUsage({
    action_id: `page_visit_${pageName.toLowerCase().replace(/\s+/g, '_')}`,
    action_name: `訪問${pageName}`,
    now_page: pageName,
  });
};

