import React from 'react';
import { Bell, X } from 'lucide-react';
import { NotificationItem } from '../config/api';
import { AI_COLORS } from '../constants/colors';

interface NotificationModalProps {
  isOpen: boolean;
  notification: NotificationItem | null;
  total: number;
  currentIndex: number;
  onConfirm: () => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  notification,
  total,
  currentIndex,
  onConfirm,
}) => {
  if (!isOpen || !notification) return null;

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/40" />

      {/* 彈窗 */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-[90%] max-w-sm mx-auto overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* 頂部裝飾條 */}
        <div className={`h-1.5 ${AI_COLORS.gradient}`} />

        {/* 標題列 */}
        <div className="flex items-center gap-2 px-5 pt-4 pb-2">
          <div className={`p-1.5 rounded-lg ${AI_COLORS.bgLight}`}>
            <Bell size={18} className={AI_COLORS.text} />
          </div>
          <span className="text-sm font-medium text-gray-500">
            站內通知
            {total > 1 && ` (${currentIndex + 1}/${total})`}
          </span>
        </div>

        {/* 內容 */}
        <div className="px-5 pb-2">
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {notification.title}
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
            {notification.content}
          </p>
          <p className="text-xs text-gray-400 mt-3">
            {formatDate(notification.created_at)}
          </p>
        </div>

        {/* 按鈕 */}
        <div className="px-5 pb-5 pt-3">
          <button
            onClick={onConfirm}
            className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${AI_COLORS.button}`}
          >
            {currentIndex + 1 < total ? '下一則' : '我知道了'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
