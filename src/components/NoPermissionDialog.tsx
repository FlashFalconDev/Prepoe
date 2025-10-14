import React, { useState } from 'react';
import ConfirmDialog from './ConfirmDialog';
import { AI_COLORS } from '../constants/colors';

interface NoPermissionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSerial?: (serial: string) => void;
  title?: string;
  message?: string;
}

const NoPermissionDialog: React.FC<NoPermissionDialogProps> = ({
  isOpen,
  onClose,
  onSubmitSerial,
  title = '沒有使用權限',
  message = '此功能尚未啟用，請輸入授權序號或關閉。'
}) => {
  const [serial, setSerial] = useState('');

  const handleSubmit = () => {
    if (onSubmitSerial) onSubmitSerial(serial);
  };

  return (
    <ConfirmDialog
      isOpen={isOpen}
      title={title}
      message={message}
      confirmText="送出"
      cancelText="關閉"
      type="warning"
      onConfirm={handleSubmit}
      onCancel={onClose}
      extra={
        <div className="flex items-center gap-3">
          <input
            value={serial}
            onChange={(e) => setSerial(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSubmit();
              }
            }}
            placeholder="請輸入授權序號"
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
      }
    />
  );
};

export default NoPermissionDialog;


