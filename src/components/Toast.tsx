import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ 
  id, 
  type, 
  title, 
  message, 
  duration = 5000, 
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 動畫進入
    const enterTimer = setTimeout(() => setIsVisible(true), 100);
    
    // 自動關閉
    const exitTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(id), 300); // 等待動畫完成後移除
    }, duration);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
    };
  }, [id, duration, onClose]);

  const getToastStyles = () => {
    const baseStyles = "flex items-start gap-3 p-4 rounded-xl shadow-lg border-l-4 transition-all duration-300 transform";
    
    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-50 border-green-500 text-green-800`;
      case 'error':
        return `${baseStyles} bg-red-50 border-red-500 text-red-800`;
      case 'warning':
        return `${baseStyles} bg-yellow-50 border-yellow-500 text-yellow-800`;
      case 'info':
        return `${baseStyles} bg-blue-50 border-blue-500 text-blue-800`;
      default:
        return `${baseStyles} bg-gray-50 border-gray-500 text-gray-800`;
    }
  };

  const getIcon = () => {
    const iconClass = "flex-shrink-0";
    switch (type) {
      case 'success':
        return <CheckCircle size={20} className={`${iconClass} text-green-600`} />;
      case 'error':
        return <XCircle size={20} className={`${iconClass} text-red-600`} />;
      case 'warning':
        return <AlertCircle size={20} className={`${iconClass} text-yellow-600`} />;
      case 'info':
        return <Info size={20} className={`${iconClass} text-blue-600`} />;
      default:
        return <Info size={20} className={`${iconClass} text-gray-600`} />;
    }
  };

  return (
    <div
      className={`${getToastStyles()} ${
        isVisible 
          ? 'translate-x-0 opacity-100' 
          : 'translate-x-full opacity-0'
      }`}
    >
      {getIcon()}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm">{title}</h4>
        {message && (
          <p className="text-sm mt-1 opacity-90">{message}</p>
        )}
      </div>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => onClose(id), 300);
        }}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-black hover:bg-opacity-10 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default Toast; 