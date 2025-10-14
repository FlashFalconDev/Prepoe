import { API_ENDPOINTS } from '../config/api';

// CSRF Token 處理函數
const getCSRFTokenFromCookie = (): string | null => {
  const possibleNames = ['csrftoken', 'csrf_token', 'csrf-token'];
  
  for (const name of possibleNames) {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.startsWith(name + '=')) {
        const token = decodeURIComponent(cookie.substring(name.length + 1));
        return token;
      }
    }
  }
  return null;
};

// 獲取請求標頭
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'X-CSRFToken': getCSRFTokenFromCookie() || '',
});

// 處理 API 回應
const handleApiResponse = async (response: Response) => {
  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch (e) {
      // 如果無法解析 JSON，使用預設錯誤訊息
    }
    throw new Error(errorMessage);
  }
  
  const data = await response.json();
  return data;
};

// Rich Menu 介面定義
export interface RichMenuArea {
  xs: number;  // 起始X座標百分比
  ys: number;  // 起始Y座標百分比
  xe: number;  // 結束X座標百分比
  ye: number;  // 結束Y座標百分比
  action: string;  // 按鈕動作
}

export interface RichMenuImage {
  id: number;
  name: string;
  description?: string;
  image_url: string;
  thumbnail_url?: string;
  width: number;
  height: number;
  button_areas: RichMenuArea[];
  order: number;
  is_default: boolean;
  file_extension: string;
}

export interface RichMenuDeployment {
  id: number;
  line_richmenu_id: string;
  deployed_image_id: number;
  deployed_at: string;
}

export interface RichMenu {
  id: number;
  bot_id: number;
  bot_name: string;
  bot_bid: string;
  name: string;
  description?: string;
  richmenu_num: string;
  richmenu_id?: string;
  richmenu_alias_id?: string;
  menu_config?: any;
  status: string;
  status_display: string;
  is_active: boolean;
  is_deployed: boolean;
  images: RichMenuImage[];
  current_deployment?: RichMenuDeployment;
  created_at: string;
  updated_at: string;
  deployed_at?: string;
}

export interface CreateRichMenuRequest {
  bot_bid: string;
  name?: string;
  description?: string;
  richmenu_num?: string;
  menu_config?: any;
  images?: CreateRichMenuImageRequest[];
}

export interface CreateRichMenuImageRequest {
  file_record_id: number;
  name?: string;
  description?: string;
  width?: number;
  height?: number;
  button_areas?: RichMenuArea[];
  order?: number;
  is_default?: boolean;
}

export interface UpdateRichMenuRequest {
  name?: string;
  description?: string;
  menu_config?: any;
}

export interface DeployRichMenuRequest {
  image_id?: number;
  radio?: string;
}

export interface SwitchImageRequest {
  image_id: number;
}

export interface AddImageRequest {
  file_record_id: number;
  name?: string;
  description?: string;
  width?: number;
  height?: number;
  button_areas?: RichMenuArea[];
  order?: number;
  is_default?: boolean;
}

// API 函數
export const richMenuApi = {
  // 獲取 Rich Menu 列表
  getRichMenus: async (clientSid: string): Promise<RichMenu[]> => {
    try {
      const response = await fetch(`${API_ENDPOINTS.RICH_MENUS}?managed_client_sid=${clientSid}`, {
        method: 'GET',
        headers: getHeaders(),
        credentials: 'include'
      });
      
      const data = await handleApiResponse(response);
      return data.data.rich_menus;
    } catch (error) {
      console.error('獲取 Rich Menu 列表失敗:', error);
      throw error;
    }
  },

  // 創建 Rich Menu (使用檔案記錄ID)
  createRichMenu: async (menuData: CreateRichMenuRequest): Promise<RichMenu> => {
    try {
      const response = await fetch(API_ENDPOINTS.RICH_MENU_CREATE, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify(menuData)
      });
      
      const data = await handleApiResponse(response);
      return data.data;
    } catch (error) {
      console.error('創建 Rich Menu 失敗:', error);
      throw error;
    }
  },

  // 創建 Rich Menu (直接上傳圖片文件)
  createRichMenuWithFiles: async (menuData: {
    bot_bid: string;
    name?: string;
    description?: string;
    richmenu_num?: string;
    menu_config?: any;
    areas?: any[];
  }, imageFiles: File[]): Promise<RichMenu> => {
    try {
      const formData = new FormData();
      
      // 添加 JSON 數據
      formData.append('bot_bid', menuData.bot_bid);
      formData.append('name', menuData.name || '未命名選單');
      formData.append('description', menuData.description || '');
      formData.append('richmenu_num', menuData.richmenu_num || 'main');
      formData.append('menu_config', JSON.stringify(menuData.menu_config || {}));
      
      // 添加區域數據
      if (menuData.areas && menuData.areas.length > 0) {
        formData.append('areas', JSON.stringify(menuData.areas));
      }
      
      // 添加圖片文件 (格式: image_0, image_1, image_2...)
      imageFiles.forEach((file, index) => {
        formData.append(`image_${index}`, file);
      });
      
      const response = await fetch(API_ENDPOINTS.RICH_MENU_CREATE, {
        method: 'POST',
        headers: {
          'X-CSRFToken': getCSRFTokenFromCookie() || '',
        },
        credentials: 'include',
        body: formData
      });
      
      const data = await handleApiResponse(response);
      return data.data;
    } catch (error) {
      console.error('創建 Rich Menu 失敗:', error);
      throw error;
    }
  },

  // 更新 Rich Menu
  updateRichMenu: async (menuId: number, updateData: UpdateRichMenuRequest): Promise<RichMenu> => {
    try {
      const response = await fetch(API_ENDPOINTS.RICH_MENU_UPDATE(menuId), {
        method: 'PUT',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify(updateData)
      });
      
      const data = await handleApiResponse(response);
      return data.data;
    } catch (error) {
      console.error('更新 Rich Menu 失敗:', error);
      throw error;
    }
  },

  // 更新 Rich Menu (支援圖片更新) - 使用與創建完全相同的格式
  updateRichMenuWithFiles: async (menuId: number, menuData: {
    bot_bid: string;
    name?: string;
    description?: string;
    richmenu_num?: string;
    menu_config?: any;
    areas?: any[];
  }, imageFiles: File[]): Promise<RichMenu> => {
    try {
      const formData = new FormData();
      
      // 添加 JSON 數據 - 與創建 API 完全相同
      formData.append('bot_bid', menuData.bot_bid);
      formData.append('name', menuData.name || '未命名選單');
      formData.append('description', menuData.description || '');
      formData.append('richmenu_num', menuData.richmenu_num || 'main');
      formData.append('menu_config', JSON.stringify(menuData.menu_config || {}));
      
      // 添加區域數據 - 與創建 API 完全相同
      if (menuData.areas && menuData.areas.length > 0) {
        formData.append('areas', JSON.stringify(menuData.areas));
      }
      
      // 添加圖片文件 (格式: image_0, image_1, image_2...) - 與創建 API 完全相同
      imageFiles.forEach((file, index) => {
        formData.append(`image_${index}`, file);
      });
      
      const response = await fetch(API_ENDPOINTS.RICH_MENU_UPDATE(menuId), {
        method: 'POST',
        headers: {
          'X-CSRFToken': getCSRFTokenFromCookie() || '',
        },
        credentials: 'include',
        body: formData
      });
      
      const data = await handleApiResponse(response);
      return data.data;
    } catch (error) {
      console.error('更新 Rich Menu 失敗:', error);
      throw error;
    }
  },

  // 部署 Rich Menu
  deployRichMenu: async (menuId: number, imageId?: number, radio: string = '2500:1686'): Promise<RichMenu> => {
    try {
      const response = await fetch(API_ENDPOINTS.RICH_MENU_DEPLOY(menuId), {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify({ image_id: imageId, radio })
      });
      
      const data = await handleApiResponse(response);
      return data.data;
    } catch (error) {
      console.error('部署 Rich Menu 失敗:', error);
      throw error;
    }
  },

  // 添加圖片到 Rich Menu
  addImage: async (menuId: number, imageData: AddImageRequest): Promise<RichMenuImage> => {
    try {
      const response = await fetch(`${API_ENDPOINTS.RICH_MENUS}${menuId}/images/`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify(imageData)
      });
      
      const data = await handleApiResponse(response);
      return data.data;
    } catch (error) {
      console.error('添加圖片失敗:', error);
      throw error;
    }
  },

  // 切換 Rich Menu 圖片
  switchImage: async (menuId: number, imageId: number): Promise<RichMenu> => {
    try {
      const response = await fetch(`${API_ENDPOINTS.RICH_MENUS}${menuId}/switch-image/`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify({ image_id: imageId })
      });
      
      const data = await handleApiResponse(response);
      return data.data;
    } catch (error) {
      console.error('切換圖片失敗:', error);
      throw error;
    }
  },

  // 刪除 Rich Menu
  deleteRichMenu: async (menuId: number): Promise<void> => {
    try {
      const response = await fetch(API_ENDPOINTS.RICH_MENU_DELETE(menuId), {
        method: 'DELETE',
        headers: getHeaders(),
        credentials: 'include'
      });
      
      await handleApiResponse(response);
    } catch (error) {
      console.error('刪除 Rich Menu 失敗:', error);
      throw error;
    }
  },

  // 獲取模板列表
  getTemplates: async (): Promise<any[]> => {
    try {
      const response = await fetch(API_ENDPOINTS.RICH_MENU_TEMPLATES, {
        method: 'GET',
        headers: getHeaders(),
        credentials: 'include'
      });
      
      const data = await handleApiResponse(response);
      return data.data.templates;
    } catch (error) {
      console.error('獲取模板列表失敗:', error);
      throw error;
    }
  },

  // 更新區域設定
  updateAreas: async (menuId: number, areas: RichMenuArea[]): Promise<RichMenu> => {
    try {
      const response = await fetch(API_ENDPOINTS.RICH_MENU_UPDATE_AREAS(menuId), {
        method: 'PUT',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify({ areas })
      });
      
      const data = await handleApiResponse(response);
      return data.data;
    } catch (error) {
      console.error('更新區域設定失敗:', error);
      throw error;
    }
  },

  // 獲取 Rich Menu 詳情
  getRichMenuDetail: async (menuId: number): Promise<RichMenu> => {
    try {
      const response = await fetch(`${API_ENDPOINTS.RICH_MENUS}${menuId}/`, {
        method: 'GET',
        headers: getHeaders(),
        credentials: 'include'
      });
      
      const data = await handleApiResponse(response);
      return data.data;
    } catch (error) {
      console.error('獲取 Rich Menu 詳情失敗:', error);
      throw error;
    }
  }
};

// 輔助函數：將前端區域格式轉換為 API 格式
export const convertAreasToApiFormat = (areas: any[], canvasWidth: number = 800, canvasHeight: number = 600): RichMenuArea[] => {
  return areas.map(area => ({
    xs: (area.x / canvasWidth) * 100,
    ys: (area.y / canvasHeight) * 100,
    xe: ((area.x + area.width) / canvasWidth) * 100,
    ye: ((area.y + area.height) / canvasHeight) * 100,
    action: convertActionToApiFormat(area.action)
  }));
};

// 輔助函數：將前端動作格式轉換為 API 格式
export const convertActionToApiFormat = (action: any): string => {
  switch (action.type) {
    case 'postback':
      return `postback:${action.data}`;
    case 'message':
      return `message:${action.text}`;
    case 'uri':
      return `uri:${action.uri}`;
    case 'liff':
      return `liff:${action.liffId}`;
    case 'phone':
      return `phone:${action.phone}`;
    case 'email':
      return `email:${action.email}`;
    case 'datetimepicker':
      return `datetimepicker:${action.data}:${action.mode || 'datetime'}:${action.initial || ''}:${action.max || ''}:${action.min || ''}`;
    case 'camera':
      return 'camera:camera';
    case 'cameraRoll':
      return 'cameraRoll:cameraRoll';
    case 'location':
      return 'location:location';
    case 'switch':
      return `switch:${action.switchMenuId}`;
    default:
      return `postback:${action.data || 'unknown'}`;
  }
};

// 輔助函數：將 API 格式轉換為前端區域格式
export const convertApiFormatToAreas = (mapJson: RichMenuArea[], canvasWidth: number = 800, canvasHeight: number = 600): any[] => {
  return mapJson.map((area, index) => ({
    id: `area_${index}`,
    x: (area.xs / 100) * canvasWidth,
    y: (area.ys / 100) * canvasHeight,
    width: ((area.xe - area.xs) / 100) * canvasWidth,
    height: ((area.ye - area.ys) / 100) * canvasHeight,
    action: convertApiFormatToAction(area.action),
    label: `區域 ${index + 1}`
  }));
};

// 輔助函數：將 API 動作格式轉換為前端格式
export const convertApiFormatToAction = (actionString: string): any => {
  const [type, ...params] = actionString.split(':');
  
  switch (type) {
    case 'postback':
      return {
        type: 'postback',
        data: params.join(':')
      };
    case 'message':
      return {
        type: 'message',
        text: params.join(':')
      };
    case 'uri':
      return {
        type: 'uri',
        uri: params.join(':')
      };
    case 'datetimepicker':
      return {
        type: 'datetimepicker',
        data: params[0] || '',
        mode: params[1] || 'datetime',
        initial: params[2] || '',
        max: params[3] || '',
        min: params[4] || ''
      };
    case 'camera':
      return { type: 'camera' };
    case 'cameraRoll':
      return { type: 'cameraRoll' };
    case 'location':
      return { type: 'location' };
    case 'liff':
      return {
        type: 'liff',
        liffId: params.join(':')
      };
    case 'phone':
      return {
        type: 'phone',
        phone: params.join(':')
      };
    case 'email':
      return {
        type: 'email',
        email: params.join(':')
      };
    case 'switch':
      return {
        type: 'switch',
        switchMenuId: parseInt(params[0]) || undefined
      };
    default:
      return {
        type: 'postback',
        data: actionString
      };
  }
};
