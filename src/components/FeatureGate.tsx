import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ConfirmDialog from './ConfirmDialog';
import { AI_COLORS } from '../constants/colors';
import { useNavigate } from 'react-router-dom';
import { handlePermissionRedeem } from '../utils/permissionUtils';
import { useToast } from '../hooks/useToast';

interface FeatureGateProps {
  feature: 'ai_assistant_count' | 'article_enabled' | 'chat_platform_count' | 'community_count' | 'namecard_enabled' | 'tokens';
  requirePositive?: boolean; // true: >0 才有權限; false: ===1 視為開關
  children: React.ReactNode;
}

const FeatureGate: React.FC<FeatureGateProps> = ({ feature, requirePositive = true, children }) => {
  const { featureFlag, checkAuth } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [open, setOpen] = useState(true);
  const [serial, setSerial] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);

  const enabled = (() => {
    const value = (featureFlag as any)?.[feature];
    if (value === undefined || value === null) return true; // 預設不擋
    return requirePositive ? Number(value) > 0 : Number(value) === 1;
  })();

  // 處理金鑰兌換
  const handleRedeemKey = async () => {
    setIsRedeeming(true);
    try {
      await handlePermissionRedeem(serial, {
        useToast: true,
        showSuccess,
        showError,
        checkAuth,
        onSuccess: () => {
          setOpen(false);
          setSerial('');
        }
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  if (!enabled) {
    return (
      <>
        {/* 觸發權限彈窗的佔位容器：直接顯示彈窗 */}
        <div className="p-6">
          <ConfirmDialog
            isOpen={open}
            title="沒有使用權限"
            message="此功能尚未啟用，請輸入授權序號或關閉。"
            confirmText="送出"
            cancelText="關閉"
            type="warning"
            onConfirm={handleRedeemKey}
            onCancel={() => {
              setOpen(false);
              try { navigate(-1); } catch (e) { navigate('/'); }
            }}
            extra={
              <div className="flex items-center gap-3">
                <input
                  value={serial}
                  onChange={(e) => setSerial(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !isRedeeming) {
                      handleRedeemKey();
                    }
                  }}
                  placeholder="請輸入授權序號"
                  disabled={isRedeeming}
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            }
          />
        </div>
      </>
    );
  }

  return <>{children}</>;
};

export default FeatureGate;


