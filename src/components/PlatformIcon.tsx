import React from 'react';

interface PlatformIconProps {
  sourcePlatform: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const PlatformIcon: React.FC<PlatformIconProps> = ({
  sourcePlatform,
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-5 h-5 text-xs',
    md: 'w-6 h-6 text-sm',
    lg: 'w-7 h-7 text-base'
  };

  const getPlatformIcon = () => {
    switch (sourcePlatform) {
      case 'line':
        return (
          <div className={`${sizeClasses[size]} bg-green-500 rounded-full flex items-center justify-center ${className}`}>
            <i className="ri-line-fill text-white"></i>
          </div>
        );
      case 'facebook':
        return (
          <div className={`${sizeClasses[size]} bg-blue-600 rounded-full flex items-center justify-center ${className}`}>
            <i className="ri-facebook-fill text-white"></i>
          </div>
        );
      case 'instagram':
        return (
          <div className={`${sizeClasses[size]} bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center ${className}`}>
            <i className="ri-instagram-fill text-white"></i>
          </div>
        );
      case 'web':
        return (
          <div className={`${sizeClasses[size]} bg-gray-600 rounded-full flex items-center justify-center ${className}`}>
            <i className="ri-global-fill text-white"></i>
          </div>
        );
      default:
        return (
          <div className={`${sizeClasses[size]} bg-gray-400 rounded-full flex items-center justify-center ${className}`}>
            <i className="ri-question-fill text-white"></i>
          </div>
        );
    }
  };

  return getPlatformIcon();
};

export default PlatformIcon;
