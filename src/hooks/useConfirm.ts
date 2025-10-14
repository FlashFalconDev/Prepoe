import { useState, useCallback } from 'react';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export const useConfirm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({ message: '' });
  const [resolve, setResolve] = useState<(value: boolean) => void>(() => {});

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions({
        title: '確認操作',
        confirmText: '確認',
        cancelText: '取消',
        type: 'danger',
        ...options
      });
      setResolve(() => resolve);
      setIsOpen(true);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    resolve(true);
  }, [resolve]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    resolve(false);
  }, [resolve]);

  return {
    confirm,
    isOpen,
    options,
    handleConfirm,
    handleCancel
  };
}; 