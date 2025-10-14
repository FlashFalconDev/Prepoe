import { keysRedeem } from '../config/api';

export interface PermissionCheckOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  useToast?: boolean;
  showSuccess?: (message: string) => void;
  showError?: (message: string) => void;
  checkAuth?: () => Promise<void>;
}

export const handlePermissionRedeem = async (
  serial: string,
  options: PermissionCheckOptions = {}
) => {
  const {
    onSuccess,
    onError,
    useToast = false,
    showSuccess,
    showError,
    checkAuth
  } = options;

  if (!serial.trim()) {
    const errorMessage = '請輸入授權序號';
    if (useToast && showError) {
      showError(errorMessage);
    } else {
      alert(errorMessage);
    }
    return;
  }

  try {
    const response = await keysRedeem({
      code: serial.trim(),
      channel: 'WEB'
    });

    if (response.success) {
      const successMessage = '金鑰兌換成功！';
      
      if (useToast && showSuccess) {
        showSuccess(successMessage);
      } else {
        alert(successMessage);
      }

      // 重新載入使用者資訊以更新 featureFlag
      if (checkAuth) {
        await checkAuth();
      }

      if (onSuccess) {
        onSuccess();
      }
    } else {
      const errorMessage = `${response.error || response.message || '未知錯誤'}`;
      
      if (useToast && showError) {
        showError(errorMessage);
      } else {
        alert(errorMessage);
      }

      if (onError) {
        onError(errorMessage);
      }
    }
  } catch (error: any) {
    console.error('金鑰兌換錯誤:', error);
    
    // 處理 API 回應錯誤格式
    let errorMessage = '請稍後再試';
    if (error.response?.data) {
      const apiError = error.response.data;
      errorMessage = apiError.error || apiError.message || error.message || '請稍後再試';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    const fullErrorMessage = `${errorMessage}`;
    
    if (useToast && showError) {
      showError(fullErrorMessage);
    } else {
      alert(fullErrorMessage);
    }

    if (onError) {
      onError(fullErrorMessage);
    }
  }
};
