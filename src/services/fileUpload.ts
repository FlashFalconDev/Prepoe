import { api, API_ENDPOINTS } from '../config/api';

/**
 * 檔案上傳服務模組
 * 提供統一的檔案上傳、轉換和管理功能
 */

export interface FileUploadOptions {
  maxSize?: number; // 最大檔案大小 (bytes)
  allowedTypes?: string[]; // 允許的檔案類型
  compress?: boolean; // 是否壓縮圖片
  quality?: number; // 圖片品質 (0-1)
}

export interface FileUploadResult {
  success: boolean;
  file?: File;
  url?: string;
  error?: string;
}

export interface FileConversionResult {
  success: boolean;
  file?: File;
  error?: string;
}

/**
 * 檔案上傳服務類
 */
export class FileUploadService {
  private static instance: FileUploadService;
  
  private constructor() {}
  
  public static getInstance(): FileUploadService {
    if (!FileUploadService.instance) {
      FileUploadService.instance = new FileUploadService();
    }
    return FileUploadService.instance;
  }

  /**
   * 驗證檔案
   */
  validateFile(file: File, options: FileUploadOptions = {}): FileUploadResult {
    const { maxSize, allowedTypes } = options;
    
    // 檢查檔案大小
    if (maxSize && file.size > maxSize) {
      return {
        success: false,
        error: `檔案大小超過限制 (${this.formatFileSize(maxSize)})`
      };
    }
    
    // 檢查檔案類型
    if (allowedTypes && allowedTypes.length > 0) {
      const fileType = file.type.toLowerCase();
      const isValidType = allowedTypes.some(type => 
        fileType.includes(type.toLowerCase()) || 
        file.name.toLowerCase().endsWith(type.toLowerCase())
      );
      
      if (!isValidType) {
        return {
          success: false,
          error: `不支援的檔案類型，支援的類型：${allowedTypes.join(', ')}`
        };
      }
    }
    
    return { success: true, file };
  }

  /**
   * 將 Blob URL 轉換為 File 物件
   */
  async blobUrlToFile(blobUrl: string, filename: string, mimeType: string = 'image/jpeg'): Promise<FileConversionResult> {
    try {
      if (!blobUrl.startsWith('blob:')) {
        return {
          success: false,
          error: '不是有效的 Blob URL'
        };
      }
      
      const response = await fetch(blobUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const file = new File([blob], filename, { type: mimeType });
      
      return { success: true, file };
    } catch (error) {
      return {
        success: false,
        error: `Blob URL 轉換失敗: ${error instanceof Error ? error.message : '未知錯誤'}`
      };
    }
  }

  /**
   * 將 Base64 字串轉換為 File 物件
   */
  async base64ToFile(base64String: string, filename: string, mimeType: string = 'image/jpeg'): Promise<FileConversionResult> {
    try {
      if (!base64String.startsWith('data:')) {
        return {
          success: false,
          error: '不是有效的 Base64 字串'
        };
      }
      
      const response = await fetch(base64String);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const file = new File([blob], filename, { type: mimeType });
      
      return { success: true, file };
    } catch (error) {
      return {
        success: false,
        error: `Base64 轉換失敗: ${error instanceof Error ? error.message : '未知錯誤'}`
      };
    }
  }

  /**
   * 壓縮圖片檔案
   */
  async compressImage(file: File, quality: number = 0.8): Promise<FileConversionResult> {
    try {
      if (!file.type.startsWith('image/')) {
        return {
          success: false,
          error: '不是圖片檔案'
        };
      }
      
      return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
          // 計算壓縮後的尺寸
          const maxWidth = 1920;
          const maxHeight = 1080;
          let { width, height } = img;
          
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // 繪製圖片
          ctx?.drawImage(img, 0, 0, width, height);
          
          // 轉換為 Blob
          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, { type: file.type });
              resolve({ success: true, file: compressedFile });
            } else {
              resolve({ success: false, error: '圖片壓縮失敗' });
            }
          }, file.type, quality);
        };
        
        img.onerror = () => {
          resolve({ success: false, error: '圖片載入失敗' });
        };
        
        img.src = URL.createObjectURL(file);
      });
    } catch (error) {
      return {
        success: false,
        error: `圖片壓縮失敗: ${error instanceof Error ? error.message : '未知錯誤'}`
      };
    }
  }

  /**
   * 上傳檔案到指定端點
   */
  async uploadFile(file: File, endpoint: string, additionalData?: Record<string, any>): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // 添加額外數據
      if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
          formData.append(key, value);
        });
      }
      
      const response = await api.post(endpoint, formData);
      return response.data;
    } catch (error) {
      throw new Error(`檔案上傳失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  }

  /**
   * 格式化檔案大小
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 生成預覽 URL
   */
  createPreviewUrl(file: File): string {
    return URL.createObjectURL(file);
  }

  /**
   * 釋放預覽 URL
   */
  revokePreviewUrl(url: string): void {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }
}

// 導出單例實例
export const fileUploadService = FileUploadService.getInstance();

// 導出便捷函數
export const {
  validateFile,
  blobUrlToFile,
  base64ToFile,
  compressImage,
  uploadFile,
  createPreviewUrl,
  revokePreviewUrl
} = fileUploadService; 