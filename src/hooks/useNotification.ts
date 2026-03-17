import { useState, useCallback, useRef } from 'react';
import { getUnreadNotifications, markNotificationRead, NotificationItem } from '../config/api';

export const useNotification = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const isFetchingRef = useRef(false);

  // 取得站內未讀通知
  const fetchUnread = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const res = await getUnreadNotifications();
      if (res.success && res.data.notifications.length > 0) {
        setNotifications(res.data.notifications);
        setCurrentIndex(0);
        setIsOpen(true);
      }
    } catch (err) {
      console.error('取得通知失敗:', err);
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  // 使用者按下確認 → 標記已讀，顯示下一則或關閉
  const handleConfirm = useCallback(async () => {
    const current = notifications[currentIndex];
    if (!current) return;

    try {
      await markNotificationRead(current.id);
    } catch (err) {
      console.error('標記通知已讀失敗:', err);
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex < notifications.length) {
      setCurrentIndex(nextIndex);
    } else {
      setIsOpen(false);
      setNotifications([]);
      setCurrentIndex(0);
    }
  }, [notifications, currentIndex]);

  const currentNotification = notifications[currentIndex] || null;

  return {
    isOpen,
    currentNotification,
    total: notifications.length,
    currentIndex,
    fetchUnread,
    handleConfirm,
  };
};
