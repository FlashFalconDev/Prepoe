import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileSlug: string;
  sharePpUrl?: string; // 新增：後端提供的 LINE 分享連結
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, profileSlug, sharePpUrl }) => {
  const [copied, setCopied] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  
  const shareUrl = `${window.location.origin}/card/${profileSlug}`;
  // 優先使用後端提供的 share_pp 連結
  const lineShareUrl = sharePpUrl;
  
  // 調試信息
  console.log('ShareModal profileSlug:', profileSlug);
  console.log('ShareModal sharePpUrl:', sharePpUrl);
  console.log('ShareModal sharePpUrl 類型:', typeof sharePpUrl);
  console.log('ShareModal lineShareUrl:', lineShareUrl);
  console.log('ShareModal lineShareUrl 類型:', typeof lineShareUrl);

  // 使用本地 qrcode 庫生成 QR 碼
  useEffect(() => {
    if (isOpen && shareUrl) {
      QRCode.toDataURL(shareUrl, {
        width: 192,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      .then(url => {
        setQrCodeDataUrl(url);
      })
      .catch(err => {
        console.error('QR 碼生成失敗:', err);
      });
    }
  }, [isOpen, shareUrl]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('複製失敗:', err);
    }
  };

  const handleLineShare = () => {
    if (lineShareUrl) {
      window.open(lineShareUrl, '_blank');
    } else {
      console.error('LINE分享連結未提供');
      // 可以在这里添加一个提示给用户
      alert('LINE分享功能暫時無法使用，請稍後再試');
    }
  };

  if (!isOpen) return null;

  console.log('ShareModal profileSlug:', profileSlug); // 調試信息

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[2000] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4">
        {/* 標題欄 */}
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-t-2xl px-6 py-4 relative">
          <h2 className="text-white text-lg font-semibold text-center">分享您的名片</h2>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <i className="ri-close-line text-lg"></i>
          </button>
        </div>

        {/* 內容 */}
        <div className="p-6">
          <p className="text-gray-700 text-sm mb-6 text-center">
            掃描QR碼或使用以下方式分享
          </p>

          {/* QR 碼區域 */}
          <div className="flex justify-center mb-6">
            <div className="bg-white p-4 rounded-lg border-2 border-gray-200 relative">
              {qrCodeDataUrl ? (
                <img 
                  src={qrCodeDataUrl} 
                  alt="QR Code" 
                  className="w-48 h-48 rounded"
                />
              ) : (
                <div className="w-48 h-48 bg-gray-100 rounded flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <i className="ri-qr-code-line text-4xl mb-2"></i>
                    <div className="text-xs">載入中...</div>
                  </div>
                </div>
              )}
              <div className="absolute bottom-2 right-2 w-6 h-6 bg-gray-200 rounded flex items-center justify-center">
                <i className="ri-scan-line text-xs text-gray-600"></i>
              </div>
            </div>
          </div>

          <p className="text-gray-600 text-xs text-center mb-6">
            掃描QR碼立即查看名片
          </p>

          {/* 按鈕區域 */}
          <div className="space-y-3">
            <button
              onClick={handleCopyLink}
              className="w-full py-3 px-4 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <i className="ri-link text-lg"></i>
              {copied ? '已複製！' : '複製連結'}
            </button>
            
            <button
              onClick={handleLineShare}
              className="w-full py-3 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
            >
              <i className="ri-play-fill text-lg"></i>
              分享到LINE
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ShareModal; 