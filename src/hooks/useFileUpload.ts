import { useState, useCallback } from 'react';
import { fileUploadService, FileUploadOptions, FileUploadResult } from '../services/fileUpload';

export const useFileUpload = (options: FileUploadOptions = {}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(async (file: File): Promise<FileUploadResult> => {
    setUploading(true);
    setError(null);
    
    try {
      // 驗證檔案
      const validation = fileUploadService.validateFile(file, options);
      if (!validation.success) {
        setError(validation.error || '檔案驗證失敗');
        return validation;
      }
      
      // 創建預覽 URL
      const previewUrl = fileUploadService.createPreviewUrl(file);
      
      return {
        success: true,
        file,
        url: previewUrl
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '檔案上傳失敗';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setUploading(false);
    }
  }, [options]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    uploadFile,
    uploading,
    error,
    clearError
  };
}; 