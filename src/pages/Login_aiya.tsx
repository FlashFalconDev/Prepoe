import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { handleLineLogin } from '../services/thirdPartyAuth';
import { normalizePath } from '../utils/pathUtils';

const Login: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const location = useLocation();

  // LINE 登入處理函數
  const handleLogin = async () => {
    try {
      setIsLoading(true);
      setError('');

      // 取得原始路徑並傳給後端
      const fromLocation = location.state?.from;
      let nextPath: string | undefined;

      if (fromLocation) {
        const fullPath = `${fromLocation.pathname}${fromLocation.search || ''}`;
        nextPath = normalizePath(fullPath);
      }

      // 將 next 路徑傳給授權函數
      await handleLineLogin(nextPath);

      // 注意:LINE 登入會跳轉到外部頁面,所以這裡不會執行到
      // 實際的跳轉會在 AuthCallback 頁面處理
    } catch (err: any) {
      console.error('LINE 登入失敗:', err);
      setError('LINE 登入失敗,請重試');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {/* 主視覺圖片區域 */}
        <div className="mb-8">
          <img
            src="/login_icon.png"
            alt="Prepoe Logo"
            className="w-full h-auto object-contain"
          />
        </div>

        {/* 錯誤訊息 */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-600 text-sm text-center">{error}</p>
          </div>
        )}

        {/* LINE 登入按鈕 */}
        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center px-6 py-4 bg-[#00B900] hover:bg-[#00A000] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              處理中...
            </>
          ) : (
            <>
              <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                <path fill="currentColor" d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
              </svg>
              使用 LINE 登入
            </>
          )}
        </button>

        {/* 說明文字 */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            登入 Line 後,系統會在您完成活動報到時發放專屬禮品。
          </p>
        </div>

        {/* 額外說明 */}
        <div className="mt-6 p-4 bg-orange-50 rounded-lg space-y-2">
          <p className="text-xs text-gray-600 text-center">
            若登入過程中發生跳轉錯誤或登入失敗,您可:
          </p>
          <p className="text-xs text-gray-600 text-center">
            再次嘗試登入或使用外部瀏覽器重新開啟報名頁
          </p>
          <p className="text-xs text-gray-600 text-center">
            也或直接前往 Aiya Line 官方帳號進行報名:
          </p>
          <p className="text-xs text-gray-600 text-center">
            👉 <a href="https://lin.ee/L1qbaGo" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">https://lin.ee/L1qbaGo</a>
          </p>
          <p className="text-xs text-gray-500 text-center italic">
            路徑:加入 Aiya Line 官方 →主題活動 → 熱門活動 → 進入報名頁
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
