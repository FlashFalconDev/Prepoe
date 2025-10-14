// 檔案上傳 API 服務
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
  'X-CSRFToken': getCSRFTokenFromCookie() || '',
});

// 處理 API 回應
const handleApiResponse = async (response: Response) => {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || `HTTP error! status: ${response.status}`);
  }
  
  return data;
};

// 檔案上傳介面
export interface FileUploadResponse {
  file_record_id: number;
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
}

// 檔案上傳 API
export const fileUploadApi = {
  // 上傳檔案
  uploadFile: async (file: File): Promise<FileUploadResponse> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload/', {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: formData
      });
      
      const data = await handleApiResponse(response);
      return data.data;
    } catch (error) {
      console.error('檔案上傳失敗:', error);
      throw error;
    }
  },

  // 上傳圖片檔案（用於 Rich Menu）
  uploadImageFile: async (file: File): Promise<FileUploadResponse> => {
    // 驗證檔案類型
    if (!file.type.startsWith('image/')) {
      throw new Error('請選擇圖片檔案');
    }

    // 驗證檔案大小（最大 10MB）
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('檔案大小不能超過 10MB');
    }

    return fileUploadApi.uploadFile(file);
  }
};

// 輔助函數：預覽圖片
export const previewImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('無法讀取檔案'));
      }
    };
    reader.onerror = () => reject(new Error('檔案讀取失敗'));
    reader.readAsDataURL(file);
  });
};

// 輔助函數：壓縮圖片
export const compressImage = (file: File, quality: number = 0.8): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // 設定畫布尺寸
      const maxWidth = 2500;
      const maxHeight = 1686;
      
      let { width, height } = img;
      
      // 計算縮放比例
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // 繪製圖片
      ctx?.drawImage(img, 0, 0, width, height);
      
      // 轉換為 Blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            reject(new Error('圖片壓縮失敗'));
          }
        },
        file.type,
        quality
      );
    };
    
    img.onerror = () => reject(new Error('圖片載入失敗'));
    img.src = URL.createObjectURL(file);
  });
};
