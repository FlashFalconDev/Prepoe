import React from 'react';
import { Upload, Image as ImageIcon, User, Link as LinkIcon } from 'lucide-react';
import { AI_COLORS } from '../constants/colors';

interface ImagePlaceholderProps {
  type: 'avatar' | 'link' | 'cover' | 'general';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
  showUploadIcon?: boolean;
  preview?: boolean;
  iconColor?: string;
}

const ImagePlaceholder: React.FC<ImagePlaceholderProps> = ({
  type,
  size = 'md',
  className = '',
  onClick,
  showUploadIcon = true,
  preview = false,
  iconColor
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 32,
    xl: 48
  };

  const getIcon = () => {
    const iconStyle = iconColor ? { color: iconColor } : {};
    
    switch (type) {
      case 'avatar':
        return <User size={iconSizes[size]} style={iconStyle} />;
      case 'link':
        return <LinkIcon size={iconSizes[size]} style={iconStyle} />;
      case 'cover':
        return <ImageIcon size={iconSizes[size]} style={iconStyle} />;
      default:
        return <ImageIcon size={iconSizes[size]} style={iconStyle} />;
    }
  };

  const getText = () => {
    switch (type) {
      case 'avatar':
        return '上傳頭像';
      case 'link':
        return '上傳圖示';
      case 'cover':
        return '上傳封面';
      default:
        return '上傳圖片';
    }
  };

  // 根據 preview 模式決定樣式
  const baseClasses = preview 
    ? `${sizeClasses[size]} flex items-center justify-center`
    : `${sizeClasses[size]} rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-gray-400 hover:${AI_COLORS.border} hover:${AI_COLORS.bgLight} hover:${AI_COLORS.text} transition-all duration-200 cursor-pointer`;

  return (
    <div
      className={`${baseClasses} ${className}`}
      onClick={onClick}
      title={preview ? undefined : getText()}
    >
      {getIcon()}
      {/* 預覽模式下不顯示文字 */}
      {!preview && (size === 'lg' || size === 'xl') ? (
        <span className="text-xs mt-1 text-center leading-tight">
          {getText()}
        </span>
      ) : null}
      {/* 移除多餘的小上傳按鈕，因為主要的上傳區域已經有完整功能 */}
    </div>
  );
};

export default ImagePlaceholder; 