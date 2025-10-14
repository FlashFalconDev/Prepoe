import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  Search, 
  Plus, 
  ArrowLeft,
  Send,
  Bot,
  User,
  Menu,
  X
} from 'lucide-react';
import { API_ENDPOINTS } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import { AI_COLORS } from '../../constants/colors';

// 文字處理工具函數
const processMessageText = (text: string) => {
  if (!text || typeof text !== 'string') return text;
  
  // 網址正則表達式（支援 http/https/www 開頭）
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
  
  // 圖片格式正則表達式
  const imageRegex = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i;
  
  // 分割文字和網址
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      // 處理網址
      let url = part;
      if (part.startsWith('www.')) {
        url = `https://${part}`;
      }
      
      // 檢查是否為圖片
      if (imageRegex.test(url)) {
        // 渲染圖片
        return (
          <div key={index} className="my-2">
            <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl mx-auto px-2">
              <img 
                src={url} 
                alt="聊天圖片" 
                className="w-full h-auto rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow object-contain"
                onClick={() => window.open(url, '_blank')}
                onError={(e) => {
                  // 圖片載入失敗時顯示為普通連結
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const linkElement = document.createElement('a');
                  linkElement.href = url;
                  linkElement.target = '_blank';
                  linkElement.className = 'text-blue-600 hover:text-blue-800 underline cursor-pointer';
                  linkElement.textContent = url;
                  target.parentNode?.appendChild(linkElement);
                }}
              />
            </div>
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-gray-500 hover:text-gray-700 block mt-1 text-center break-all"
            >
              {url}
            </a>
          </div>
        );
      } else {
        // 普通網址轉換為超連結
        return (
          <a 
            key={index}
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline cursor-pointer break-all"
          >
            {part}
          </a>
        );
      }
    } else {
      // 普通文字
      return <span key={index}>{part}</span>;
    }
  });
};

// 時間格式化函數 - 相對時間格式（用於對話列表）
const formatRelativeTime = (timestamp: string): string => {
  const now = new Date();
  const messageTime = new Date(timestamp);
  
  // 檢查日期是否有效
  if (isNaN(messageTime.getTime())) {
    return '時間未知';
  }
  
  // 計算時間差（毫秒）
  const timeDiff = now.getTime() - messageTime.getTime();
  
  // 轉換為分鐘、小時、天、月
  const minutes = Math.floor(timeDiff / (1000 * 60));
  const hours = Math.floor(timeDiff / (1000 * 60 * 60));
  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  
  // 根據時間差返回相對時間
  if (minutes < 1) {
    return '剛剛';
  } else if (minutes < 60) {
    return `${minutes}分鐘前`;
  } else if (hours < 24) {
    return `${hours}小時前`;
  } else if (days < 30) {
    return `${days}天前`;
  } else if (months < 12) {
    return `${months}個月前`;
  } else {
    return `${years}年前`;
  }
};

// 時間格式化函數 - 24小時制（用於聊天界面）
const formatTimestamp = (timestamp: string): string => {
  const messageTime = new Date(timestamp);
  
  // 檢查日期是否有效
  if (isNaN(messageTime.getTime())) {
    return '時間未知';
  }
  
  // 24小時制格式：HH:MM
  const hours = messageTime.getHours().toString().padStart(2, '0');
  const minutes = messageTime.getMinutes().toString().padStart(2, '0');
  
  return `${hours}:${minutes}`;
};

// 日期格式化函數（用於隔天提示）
const formatDate = (timestamp: string): string => {
  const messageTime = new Date(timestamp);
  
  // 檢查日期是否有效
  if (isNaN(messageTime.getTime())) {
    return '';
  }
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const messageDate = new Date(messageTime.getFullYear(), messageTime.getMonth(), messageTime.getDate());
  
  if (messageDate.getTime() === today.getTime()) {
    return '今天';
  } else if (messageDate.getTime() === yesterday.getTime()) {
    return '昨天';
  } else {
    return `${messageTime.getMonth() + 1}月${messageTime.getDate()}日`;
  }
};

// API 調用函數
const getSessionMessages = async (sessionId: string) => {
  try {
    const url = API_ENDPOINTS.CHAT_MESSAGES_GET(sessionId);
    console.log('🔍 獲取會話訊息 - API URL:', url);
    console.log('🔍 當前環境:', import.meta.env.MODE);
    console.log('🔍 API_BASE:', import.meta.env.MODE === 'development' ? '開發環境' : '生產環境');
    
    // 獲取CSRF token（GET請求也需要，確保認證）
    const csrfToken = await getCSRFToken();
    console.log('🔑 CSRF Token (GET):', csrfToken ? '已獲取' : '未獲取');
    
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'X-CSRFToken': csrfToken || '', // 添加CSRF token
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('獲取會話訊息失敗:', error);
    throw error;
  }
};

// 獲取使用者的相關會話列表
const getUserSessions = async () => {
  try {
    const url = `${API_ENDPOINTS.SESSIONS_RELATED}?user=1`;
    console.log('👤 獲取使用者會話列表 - API URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📋 獲取到的使用者會話數據:', data);
    return data;
  } catch (error) {
    console.error('獲取使用者會話列表失敗:', error);
    throw error;
  }
};

// CSRF token 獲取函數
const getCSRFToken = async (): Promise<string | null> => {
  try {
    const response = await fetch(API_ENDPOINTS.CSRF, {
      method: 'GET',
      credentials: 'include',
    });
    
    if (response.ok) {
      // 從cookie中獲取CSRF token
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'csrftoken' || name === 'csrf_token' || name === 'csrf-token') {
          return value;
        }
      }
    }
    return null;
  } catch (error) {
    console.error('獲取CSRF token失敗:', error);
    return null;
  }
};

const startSession = async (uniqueCode: string) => {
  try {
    console.log('🚀 啟動會話 - 唯一代碼:', uniqueCode);
    
    // 調用真正的 start_session API
    const csrfToken = await getCSRFToken();
    if (!csrfToken) {
      throw new Error('無法獲取CSRF token');
    }
    
    const response = await fetch(API_ENDPOINTS.CHAT_SESSION_START, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      body: JSON.stringify({
        unique_code: uniqueCode,
        // 根據後端 API 需求添加其他必要參數
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(' start_session API 響應:', data);
    
    if (data.success) {
      return { success: true, data: data.data };
    } else {
      return { success: false, message: data.message || '啟動會話失敗' };
    }
  } catch (error) {
    console.error('啟動會話失敗:', error);
    return { success: false, message: error instanceof Error ? error.message : '未知錯誤' };
  }
};

// 對話列表項組件
const ConversationItem: React.FC<{
  conversation: {
    id: string;
    title: string;
    lastMessage: string;
    timestamp: string;
    unreadCount: number;
    isActive: boolean;
  };
  isSelected: boolean;
  onClick: () => void;
  isMobile: boolean;
}> = ({ conversation, isSelected, onClick, isMobile }) => {
  // 安全處理數據，確保所有欄位都是正確的類型
  const safeTitle = typeof conversation.title === 'string' ? conversation.title : '未命名會話';
  const safeLastMessage = typeof conversation.lastMessage === 'string' ? conversation.lastMessage : '開始新的對話...';
  const safeTimestamp = typeof conversation.timestamp === 'string' ? conversation.timestamp : '';
  const safeUnreadCount = typeof conversation.unreadCount === 'number' ? conversation.unreadCount : 0;

  return (
    <div
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('🖱️ ConversationItem 被點擊');
        onClick();
      }}
      className={`p-4 cursor-pointer transition-all duration-200 ${
        isSelected 
          ? `${AI_COLORS.bgLight} border-l-4 ${AI_COLORS.border}` 
          : 'hover:bg-gray-50 border-l-4 border-transparent'
      } ${isMobile ? 'border-b border-gray-100' : ''}`}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className={`font-medium text-gray-900 ${isMobile ? 'text-sm' : 'text-base'}`}>
          {safeTitle}
        </h3>
        <span className="text-xs text-gray-500">
          {safeTimestamp ? formatRelativeTime(safeTimestamp) : '時間未知'}
        </span>
      </div>
      <p className={`text-gray-600 mb-2 ${isMobile ? 'text-sm' : 'text-base'} line-clamp-2`}>
        {safeLastMessage}
      </p>
      {safeUnreadCount > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">未讀訊息</span>
          <span className={`${AI_COLORS.bgDark} text-white text-xs px-2 py-1 rounded-full`}>
            {safeUnreadCount}
          </span>
        </div>
      )}
    </div>
  );
};

// 聊天界面組件
const ChatInterface: React.FC<{
  conversation: any;
  onSendMessage: (message: string) => void;
  onBack: () => void;
  isMobile: boolean;
}> = ({ conversation, onSendMessage, onBack, isMobile }) => {
  const [newMessage, setNewMessage] = useState('');
  const [localMessages, setLocalMessages] = useState<any[]>([]);
  const [sendingMessages, setSendingMessages] = useState<Set<string>>(new Set());
  const [messagePolling, setMessagePolling] = useState<NodeJS.Timeout | null>(null);
  const [lastMessageTime, setLastMessageTime] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 當會話更新時，同步本地訊息並啟動輪詢
  useEffect(() => {
    if (conversation?.messages) {
      // 格式化所有訊息
      const formattedMessages = conversation.messages.map((msg: any) => formatMessage(msg));
      setLocalMessages(formattedMessages);
      
      // 設置最後訊息時間
      if (conversation.messages.length > 0) {
        const lastMessage = conversation.messages[conversation.messages.length - 1];
        setLastMessageTime(lastMessage.timestamp || lastMessage.created_at);
        console.log('🔍 設置初始最後訊息時間:', lastMessage.timestamp || lastMessage.created_at);
      }
      
      // 啟動輪詢（使用簡單的 setInterval）
      const interval = setInterval(() => {
        console.log('🔍 開始檢查新訊息...');
        checkForNewMessages();
      }, 5000); // 5秒檢查一次
      
      setMessagePolling(interval);
      console.log('🔍 啟動訊息輪詢，間隔5秒');
      
      // 清理函數
      return () => {
        clearInterval(interval);
        setMessagePolling(null);
        console.log('🔍 停止訊息輪詢');
      };
    }
  }, [conversation]);

  // 檢查新訊息
  const checkForNewMessages = async () => {
    if (!conversation?.session_id) {
      console.log('🔍 沒有會話ID，跳過檢查');
      return;
    }
    
    try {
      // 使用最後一條訊息的時間戳
      const lastMessage = localMessages[localMessages.length - 1];
      if (!lastMessage?.timestamp) {
        console.log('🔍 沒有最後訊息時間戳，跳過檢查');
        return;
      }
      
      const url = `${API_ENDPOINTS.CHAT_CHECK_NEW(conversation.session_id)}?last_time=${encodeURIComponent(lastMessage.timestamp)}`;
      console.log('🔍 檢查新訊息 - URL:', url);
      console.log('🔍 最後訊息時間戳:', lastMessage.timestamp);
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('🔍 API 響應:', result);
        
        if (result.success && result.data.has_new) {
          console.log(`🔔 發現 ${result.data.count} 條新訊息`);
          console.log('🔍 新訊息原始數據:', result.data.new_messages);
          
          // 添加新訊息到本地列表（防止重複）
          const newMessages = result.data.new_messages.map((msg: any) => {
            console.log('🔍 處理新訊息:', msg);
            
            // 使用 formatMessage 函數統一處理訊息格式
            const processedMessage = {
              ...formatMessage(msg),
              status: 'sent' as const // 新訊息默認為已發送狀態
            };
            
            console.log('🔍 處理後的訊息:', processedMessage);
            return processedMessage;
          });
          
          // 過濾掉已存在的訊息，防止重複
          setLocalMessages(prev => {
            const existingIds = new Set(prev.map((m: any) => m.id));
            const trulyNewMessages = newMessages.filter((msg: any) => !existingIds.has(msg.id));
            
            if (trulyNewMessages.length > 0) {
              console.log(`🔔 添加 ${trulyNewMessages.length} 條真正的新訊息`);
              return [...prev, ...trulyNewMessages];
            } else {
              console.log('🔔 沒有真正的新訊息，跳過添加');
              return prev;
            }
          });
          
          // 自動滾動到底部
          setTimeout(() => scrollToBottom(), 100);
        } else {
          console.log('🔍 沒有新訊息');
        }
      } else {
        console.log('🔍 API 請求失敗:', response.status);
      }
    } catch (error) {
      console.error('檢查新訊息失敗:', error);
    }
  };

  // 自動滾動到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 當訊息更新時自動滾動
  useEffect(() => {
    scrollToBottom();
  }, [localMessages]);

  // 組件卸載時清理輪詢（暫時禁用）
  // useEffect(() => {
  //   return () => {
  //     if (messagePolling) {
  //       clearInterval(messagePolling);
  //       console.log('🔍 組件卸載，清理訊息輪詢');
  //     }
  //   };
  // }, [messagePolling]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    
    const messageText = newMessage.trim();
    const tempId = `temp_${Date.now()}`;
    
    console.log('🚀 開始發送訊息:', messageText);
    console.log('🔒 當前sendingMessages狀態:', sendingMessages);
    
    // 創建臨時訊息
    const tempMessage = {
      id: tempId,
      content: messageText,
      isSelf: true, // 用戶發送的訊息始終是true
      self: true,   // 添加self欄位確保一致性
      timestamp: new Date().toISOString(),
      messageType: 'text',
      isRead: false,
      status: 'sending' // 傳送中狀態
    };
    
    console.log('🚀 創建臨時訊息:', tempMessage);
    
    // 立即添加到本地訊息列表
    setLocalMessages(prev => [...prev, tempMessage]);
    
    // 更新傳送中狀態
    const newSendingSet = new Set(sendingMessages);
    newSendingSet.add(tempId);
    setSendingMessages(newSendingSet);
    
    console.log('🔒 更新後sendingMessages狀態:', newSendingSet);
    
    setNewMessage('');
    
    try {
      // 調用API發送訊息
      await onSendMessage(messageText);
      
      // 發送成功，更新狀態
      setLocalMessages(prev => prev.map(msg => 
        msg.id === tempId 
          ? { ...msg, status: 'sent', isRead: true } // 已傳送
          : msg
      ));
    } catch (error) {
      // 發送失敗，更新狀態
      setLocalMessages(prev => prev.map(msg => 
        msg.id === tempId 
          ? { ...msg, status: 'failed' } // 傳送失敗
          : msg
      ));
    } finally {
      // 清理傳送中狀態
      setSendingMessages(prev => {
        const newSet = new Set(prev);
        newSet.delete(tempId);
        console.log('🔓 清理後sendingMessages狀態:', newSet);
        return newSet;
      });
    }
  };

  // 重試傳送失敗的訊息
  const handleRetryMessage = async (message: any) => {
    if (message.status !== 'failed') return;
    
    // 更新狀態為傳送中
    setLocalMessages(prev => prev.map(msg => 
      msg.id === message.id 
        ? { ...msg, status: 'sending' }
        : msg
    ));
    setSendingMessages(prev => new Set(prev).add(message.id));
    
    try {
      // 重新調用API發送訊息
      await onSendMessage(message.content);
      
      // 發送成功，更新狀態
      setLocalMessages(prev => prev.map(msg => 
        msg.id === message.id 
          ? { ...msg, status: 'sent', isRead: true }
          : msg
      ));
    } catch (error) {
      // 發送失敗，保持失敗狀態
      setLocalMessages(prev => prev.map(msg => 
        msg.id === message.id 
          ? { ...msg, status: 'failed' }
          : msg
      ));
    } finally {
      // 清理傳送中狀態
      setSendingMessages(prev => {
        const newSet = new Set(prev);
        newSet.delete(message.id);
        return newSet;
      });
    }
  };

  // 處理API訊息格式
  const formatMessage = (message: any) => {
    // 安全檢查
    if (!message || typeof message !== 'object') {
      console.warn('⚠️ formatMessage: 無效的訊息對象:', message);
      return {
        id: `fallback_${Date.now()}`,
        content: '無效訊息',
        isSelf: false,
        timestamp: new Date().toISOString(),
        messageType: 'text',
        isRead: false
      };
    }
    
    // 調試：檢查訊息的self欄位和sender_type
    console.log('🔍 格式化訊息:', {
      id: message.id,
      content: message.content,
      self: message.self,
      sender_type: message.sender_type,
      isSelf: message.self === true || message.sender_type === 'agent' || message.sender_type === 'manager'
    });
    
    return {
      id: message.id || `msg_${Date.now()}`,
      content: message.content || '無內容',
      isSelf: message.self === true || message.sender_type === 'agent' || message.sender_type === 'manager', // 根據self和sender_type判斷
      timestamp: message.created_at || new Date().toISOString(),
      messageType: message.message_type || 'text',
      isRead: message.is_read || false,
      sender_type: message.sender_type // 保留sender_type用於顯示邏輯
    };
  };

  return (
    <div className="flex-1 flex flex-col bg-white relative h-full">
      {/* 聊天標題 */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center gap-3 flex-shrink-0 z-10">
        {isMobile && (
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {conversation.session_title || '聊天會話'}
          </h2>
          <p className="text-sm text-gray-500">
            {conversation.total_messages || 0} 條訊息
          </p>
        </div>
        
        {/* 錯誤提示橫幅 */}
        {localMessages.some(msg => msg.sender === 'system') && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 text-sm">⚠️</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">
                  無法載入對話內容
                </p>
                <p className="text-xs text-red-600 mt-1">
                  {localMessages.find(msg => msg.sender === 'system')?.content.replace('❌ ', '')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 聊天訊息 - 可滾動區域，強制高度 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ height: 'calc(100% - 140px)' }}>
        {localMessages.map((message, index) => {
          // 安全檢查：確保訊息對象有效
          if (!message || typeof message !== 'object') {
            console.warn('⚠️ 無效的訊息對象:', message);
            return null;
          }
          
          const formattedMessage = formatMessage(message);
          const isSending = sendingMessages.has(message.id);
          const isFailed = message.status === 'failed';
          
          // 檢查是否需要顯示日期提示
          const showDateDivider = (() => {
            if (index === 0) return true; // 第一條訊息總是顯示日期
            
            const prevMessage = localMessages[index - 1];
            const prevTimestamp = prevMessage.timestamp || prevMessage.created_at || prevMessage.time;
            const currentTimestamp = formattedMessage.timestamp;
            
            if (!currentTimestamp || !prevTimestamp) return false;
            
            try {
              const currentDate = new Date(currentTimestamp);
              const prevDate = new Date(prevTimestamp);
              
              // 檢查日期是否有效
              if (isNaN(currentDate.getTime()) || isNaN(prevDate.getTime())) return false;
              
              // 比較日期（忽略時間）
              const currentDateOnly = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
              const prevDateOnly = new Date(prevDate.getFullYear(), prevDate.getMonth(), prevDate.getDate());
              
              return currentDateOnly.getTime() !== prevDateOnly.getTime();
            } catch (error) {
              console.error('日期比較錯誤:', error);
              return false;
            }
          })();
          
          // 根據 sender_type 判斷訊息類型和位置
          const isOwnMessage = message.self === true || message.sender_type === 'agent' || message.sender_type === 'manager';
          const isAIMessage = message.sender_type === 'ai';
          const isCustomerMessage = message.sender_type === 'customer';
          const isSystemMessage = message.sender_type === 'system';
          
          // 如果是系統錯誤消息，不顯示在聊天區域中（因為已經在頂部顯示了）
          if (isSystemMessage) {
            return null;
          }
          
          // 判斷訊息位置：自己的訊息在右側，其他在左側
          const shouldAlignRight = isOwnMessage;
          
          // 獲取發言者名稱和頭像
          const getSenderInfo = () => {
            if (isOwnMessage) {
              return { name: '我', icon: 'user', color: 'primary' };
            } else if (isAIMessage) {
              return { name: 'AI助手', icon: 'bot', color: 'purple' };
            } else if (isCustomerMessage) {
              return { name: '客戶', icon: 'user', color: 'gray' };
            } else {
              return { name: '其他用戶', icon: 'user', color: 'gray' };
            }
          };
          
          const senderInfo = getSenderInfo();
          
          console.log('🎯 訊息顯示邏輯:', {
            id: message.id,
            sender_type: message.sender_type,
            self: message.self,
            isOwnMessage,
            isAIMessage,
            isCustomerMessage,
            shouldAlignRight,
            senderName: senderInfo.name
          });

          return (
            <React.Fragment key={formattedMessage.id || `msg_${Date.now()}`}>
              {/* 日期分隔線 */}
              {showDateDivider && formattedMessage.timestamp && (
                <div className="flex justify-center my-4">
                  <div className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full">
                    {formatDate(formattedMessage.timestamp)}
                  </div>
                </div>
              )}
              
              <div
                className={`flex ${shouldAlignRight ? 'justify-end' : 'justify-start'} animate-in fade-in-0 slide-in-from-bottom-2 duration-300`}
              >
                <div className={`flex ${shouldAlignRight ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 max-w-xs lg:max-w-md group`}>
                  {/* 發言者頭像 */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                    shouldAlignRight 
                      ? `${AI_COLORS.bgDark} group-hover:${AI_COLORS.bgDark}` 
                      : senderInfo.color === 'purple' 
                        ? `${AI_COLORS.bg} group-hover:${AI_COLORS.bgHover}`
                        : 'bg-gray-100 group-hover:bg-gray-200'
                  }`}>
                    {shouldAlignRight ? (
                      <User size={16} className="text-white" />
                    ) : senderInfo.icon === 'bot' ? (
                      <Bot size={16} className={AI_COLORS.text} />
                    ) : (
                      <User size={16} className="text-gray-600" />
                    )}
                  </div>
                  
                  {/* 訊息內容 */}
                  <div className={`px-4 py-2 rounded-2xl shadow-sm ${
                    shouldAlignRight
                      ? `${AI_COLORS.bgDark} text-white rounded-br-md` // 自己的訊息：右下角較尖
                      : 'bg-gray-100 text-gray-900 rounded-bl-md' // 他人訊息：左下角較尖
                  }`}>
                    {/* 發言者名稱 - 根據訊息類型顯示 */}
                    {!shouldAlignRight && (
                      <div className={`text-xs font-medium mb-1 ${
                        senderInfo.color === 'purple' ? AI_COLORS.text : 'text-gray-600'
                      }`}>
                        {senderInfo.name}
                      </div>
                    )}
                    
                    {/* 訊息內容 */}
                    <div className="text-sm">
                      {processMessageText(formattedMessage.content)}
                    </div>
                    
                    {/* 時間戳和傳送狀態 */}
                    <div className="flex items-center justify-between mt-2">
                      <p className={`text-xs ${
                        shouldAlignRight ? 'text-orange-100' : 'text-gray-500'
                      }`}>
                        {formatTimestamp(formattedMessage.timestamp)}
                      </p>
                      
                      {/* 傳送狀態指示器 */}
                      {shouldAlignRight && (
                        <div className="flex items-center gap-1">
                          {message.status === 'sending' ? (
                            <div className="flex items-center gap-1 text-xs text-orange-100">
                              <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              傳送中
                            </div>
                          ) : message.status === 'sent' ? (
                            <span className="text-xs text-orange-100">✓ 已傳送</span>
                          ) : message.status === 'failed' ? (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-red-300">✗ 傳送失敗</span>
                              <button
                                onClick={() => handleRetryMessage(message)}
                                className="text-xs text-red-300 hover:text-red-200 underline"
                                title="點擊重試"
                              >
                                重試
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-orange-100">✓</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 發送訊息 - 強制固定在底部 */}
      <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0 z-20" style={{ position: 'sticky', bottom: 0 }}>
        
        {/* 輸入區域 - 緊湊設計 */}
        <div className="flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && newMessage.trim()) {
                handleSend();
              }
            }}
            placeholder="輸入您的訊息..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 hover:border-orange-400"
          />
          <button
            onClick={() => {
              if (newMessage.trim()) {
                handleSend();
              }
            }}
            disabled={!newMessage.trim()}
            className={`px-4 py-2 rounded-lg transition-all duration-200 ${
              !newMessage.trim()
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : `${AI_COLORS.button} hover:shadow-md`
            }`}
          >
            {sendingMessages.size > 0 ? (
              <div className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                傳送中
              </div>
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// 使用者對話專區主頁面
const UserChat: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth(); // 移到組件頂層
  
  // 新增狀態
  const [sessionOptions, setSessionOptions] = useState<Array<{session_id: string, label: string}>>([]);
  const [showSessionSelector, setShowSessionSelector] = useState(false);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [userSessions, setUserSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // 檢測設備類型
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // 載入使用者會話列表
  useEffect(() => {
    const loadUserSessions = async () => {
      if (!isAuthenticated) return;
      
      setSessionsLoading(true);
      try {
        const response = await getUserSessions();
        if (response.success && response.data && response.data.sessions) {
          // 正確提取 sessions 陣列
          const sessions = response.data.sessions;
          console.log('✅ 成功載入使用者會話:', sessions);
          
          // 調試：檢查每個會話的數據結構
          sessions.forEach((session: any, index: number) => {
            console.log(`🔍 會話 ${index + 1}:`, {
              id: session.session_id || session.id,
              title: session.session_title || session.title,
              last_message: session.last_message,
              lastMessage: session.lastMessage,
              timestamp: session.last_activity || session.timestamp,
              unread_count: session.unread_count,
              messages: session.messages
            });
          });
          
          setUserSessions(sessions);
        } else {
          console.warn('⚠️ 載入使用者會話失敗:', response.message);
          setUserSessions([]);
        }
      } catch (error) {
        console.error('❌ 載入使用者會話時發生錯誤:', error);
        setUserSessions([]);
      } finally {
        setSessionsLoading(false);
      }
    };

    loadUserSessions();
  }, [isAuthenticated]);

  // 處理會話ID的useEffect
  useEffect(() => {
    const handleSessionId = async () => {
      if (!sessionId) return;
      
      setLoading(true);
      
      try {
        if (sessionId.startsWith('session_')) {
          // 如果是session_開頭，直接獲取訊息
          console.log('獲取會話訊息:', sessionId);
          const response = await getSessionMessages(sessionId);
          
          if (response.success) {
            setCurrentSession(response.data);
            setSelectedConversation(sessionId);
          } else {
            console.error('獲取會話訊息失敗:', response.message);
            // 顯示錯誤訊息給用戶
            setCurrentSession({
              session_id: sessionId,
              session_title: '權限錯誤',
              messages: [{
                id: 'error_1',
                content: `❌ 載入訊息失敗: ${response.message || '未知錯誤'}`,
                sender: 'system' as const,
                timestamp: new Date().toISOString()
              }]
            });
            setSelectedConversation(sessionId);
          }
        } else {
          // 如果不是session_開頭，嘗試啟動會話
          console.log('嘗試啟動會話:', sessionId);
          const response = await startSession(sessionId);
          
          if (response.success && response.data) {
            const sessions = response.data;
            
            if (sessions.length === 1) {
              // 只有一個會話，直接使用
              const session = sessions[0];
              console.log('自動選擇會話:', session);
              navigate(`/client/chat/${session.session_id}`);
            } else if (sessions.length > 1) {
              // 多個會話，顯示選擇器
              console.log('多個會話選項:', sessions);
              setSessionOptions(sessions);
              setShowSessionSelector(true);
            } else {
              console.error('沒有找到會話');
              // 顯示錯誤訊息給用戶
              setCurrentSession({
                session_id: sessionId,
                session_title: '會話錯誤',
                messages: [{
                  id: 'error_1',
                  content: '❌ 沒有找到會話',
                  sender: 'system' as const,
                  timestamp: new Date().toISOString()
                }]
              });
              setSelectedConversation(sessionId);
            }
          } else {
            console.error('啟動會話失敗:', response.message);
            // 顯示錯誤訊息給用戶
            setCurrentSession({
              session_id: sessionId,
              session_title: '會話啟動失敗',
              messages: [{
                id: 'error_1',
                content: `❌ 啟動會話失敗: ${response.message || '未知錯誤'}`,
                sender: 'system' as const,
                timestamp: new Date().toISOString()
              }]
            });
            setSelectedConversation(sessionId);
          }
        }
      } catch (error) {
        console.error('處理會話ID時發生錯誤:', error);
        // 顯示錯誤訊息給用戶
        setCurrentSession({
          session_id: sessionId,
          session_title: '系統錯誤',
          messages: [{
            id: 'error_1',
            content: `❌ 系統錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`,
            sender: 'system' as const,
            timestamp: new Date().toISOString()
          }]
        });
        setSelectedConversation(sessionId);
      } finally {
        setLoading(false);
      }
    };

    handleSessionId();
  }, [sessionId, navigate]);

  // 新增：當 selectedConversation 改變時，嘗試載入會話
  useEffect(() => {
    const loadSelectedConversation = async () => {
      if (!selectedConversation) return;
      
      console.log('🔄 載入選中的對話:', selectedConversation);
      
      // 檢查是否已經有當前會話
      if (currentSession && currentSession.session_id === selectedConversation) {
        console.log('✅ 會話已載入，跳過重複載入');
        return;
      }
      
      try {
        // 嘗試直接獲取會話訊息
        const response = await getSessionMessages(selectedConversation);
        
        if (response.success) {
          console.log('✅ 成功載入會話:', response.data);
          setCurrentSession(response.data);
        } else {
          console.error('❌ 載入會話失敗:', response.message);
          // 顯示錯誤訊息
          setCurrentSession({
            session_id: selectedConversation,
            session_title: '載入失敗',
            messages: [{
              id: 'error_1',
              content: `❌ 載入會話失敗: ${response.message || '未知錯誤'}`,
              sender: 'system' as const,
              timestamp: new Date().toISOString()
            }]
          });
        }
      } catch (error) {
        console.error('❌ 載入會話時發生錯誤:', error);
        // 顯示錯誤訊息
        setCurrentSession({
          session_id: selectedConversation,
          session_title: '系統錯誤',
          messages: [{
            id: 'error_1',
            content: `❌ 系統錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`,
            sender: 'system' as const,
            timestamp: new Date().toISOString()
          }]
        });
      }
    };

    loadSelectedConversation();
  }, [selectedConversation, currentSession]);

  // 使用從 API 獲取的真實會話數據
  const conversations = userSessions.map((session: any) => {
    // 安全處理 lastMessage，確保它是字串
    let lastMessage = '開始新的對話...';
    if (session.last_message) {
      if (typeof session.last_message === 'string') {
        lastMessage = session.last_message;
      } else if (typeof session.last_message === 'object' && session.last_message.content) {
        lastMessage = session.last_message.content;
      }
    } else if (session.lastMessage) {
      if (typeof session.lastMessage === 'string') {
        lastMessage = session.lastMessage;
      } else if (typeof session.lastMessage === 'object' && session.lastMessage.content) {
        lastMessage = session.lastMessage.content;
      }
    }

    return {
      id: session.session_id || session.id,
      title: session.session_title || session.title || '未命名會話',
      lastMessage: lastMessage,
      timestamp: session.last_activity || session.timestamp || new Date().toISOString(),
      unreadCount: session.unread_count || session.unreadCount || 0,
      isActive: session.is_active || session.isActive || false,
      messages: session.messages || []
    };
  });

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentConversation = conversations.find(conv => conv.id === selectedConversation);

  const handleSendMessage = async (message: string) => {
    if (!currentSession || !message.trim()) return;
    
    try {
      console.log('🚀 發送訊息到API:', message);
      console.log('🚀 會話ID:', currentSession.session_id);
      
      // 調試：檢查用戶身份信息
      console.log('👤 當前用戶信息:', {
        id: user?.id,
        username: user?.username,
        member_card_id: user?.member_card_id,
        is_authenticated: isAuthenticated
      });
      
      // 調試：檢查會話信息
      console.log('💬 當前會話信息:', {
        session_id: currentSession.session_id,
        session_title: currentSession.session_title,
        total_messages: currentSession.total_messages,
        messages_count: currentSession.messages?.length || 0
      });
      
      // 獲取CSRF token
      const csrfToken = await getCSRFToken();
      if (!csrfToken) {
        throw new Error('無法獲取CSRF token');
      }
      
      // 調用發送訊息API
      const response = await fetch(API_ENDPOINTS.CHAT_MESSAGE_SEND, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify({
          session_id: currentSession.session_id,
          message: message,        // 修正：使用 'message' 而不是 'content'
          message_type: 'text'
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`發送失敗: ${errorData.message || response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ 訊息發送成功');
        
        // 智能去重：移除樂觀更新的臨時訊息，避免重複顯示
        setCurrentSession((prev: any) => {
          if (!prev) return prev;
          
          // 找到對應的臨時訊息並移除
          const updatedMessages = prev.messages?.filter((msg: any) => {
            // 如果是臨時訊息且內容匹配，則移除
            if (msg.id.toString().startsWith('temp_') && msg.content === message) {
              console.log('🔄 移除樂觀更新的臨時訊息:', msg.id);
              return false;
            }
            return true;
          }) || [];
          
          return {
            ...prev,
            messages: updatedMessages
          };
        });
        
        // 延遲更新會話，讓去重邏輯先完成
        setTimeout(async () => {
          try {
            const updatedSession = await getSessionMessages(currentSession.session_id);
            if (updatedSession.success) {
              // 使用 setCurrentSession 更新會話，觸發 ChatInterface 的 useEffect
              setCurrentSession(updatedSession.data);
            }
          } catch (error) {
            console.warn('⚠️ 重新獲取會話訊息失敗，但不影響發送:', error);
          }
        }, 500); // 縮短延遲時間
        
      } else {
        // 詳細的錯誤處理
        console.error('❌ 後端返回錯誤:', result);
        
        if (result.message) {
          if (result.message.includes('身分不對') || result.message.includes('權限')) {
            throw new Error(`權限驗證失敗: ${result.message}。請檢查您是否有權限訪問此會話。`);
          } else if (result.message.includes('會話')) {
            throw new Error(`會話錯誤: ${result.message}。會話可能已過期或無效。`);
          } else {
            throw new Error(`發送失敗: ${result.message}`);
          }
        } else {
          throw new Error('發送失敗: 未知錯誤');
        }
      }
      
    } catch (error) {
      console.error('❌ 發送訊息失敗:', error);
      // 這裡可以添加錯誤提示UI
      alert(`發送訊息失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  };

  const handleNewConversation = () => {
    // 創建新對話的邏輯
    console.log('創建新對話');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 會話選擇器 Modal */}
      {showSessionSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">選擇會話</h3>
            <div className="space-y-3">
              {sessionOptions.map((session) => (
                <button
                  key={session.session_id}
                  onClick={() => {
                    setShowSessionSelector(false);
                    navigate(`/client/chat/${session.session_id}`);
                  }}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium">{session.label}</div>
                  <div className="text-sm text-gray-500">ID: {session.session_id}</div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowSessionSelector(false)}
              className="mt-4 w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 載入中指示器 */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg p-6">
            <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${AI_COLORS.border} mx-auto`}></div>
            <p className="mt-2 text-gray-600">處理中...</p>
          </div>
        </div>
      )}

      {isMobile && (
          <button
            onClick={() => setIsNavOpen(!isNavOpen)}
            className="fixed top-16 right-4 z-30 p-2 bg-white rounded-lg shadow-lg"
          >
          <Menu size={24} />
        </button>
      )}

      <div className="flex h-screen">
        {/* 對話列表側邊欄 */}
        <div className={`${
          isMobile 
            ? `${isNavOpen ? 'block' : 'hidden'} fixed inset-0 z-40 bg-black bg-opacity-50`
            : 'w-80 bg-white border-r border-gray-200'
        }`}>
            <div className={`${
              isMobile 
                ? 'fixed right-0 top-0 h-full w-80 bg-white shadow-lg'
                : 'h-full'
            } flex flex-col`}>
            {/* 側邊欄標題 */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold text-gray-900">對話專區</h1>
                <div className="flex items-center gap-2">
                  {/* 刷新按鈕 */}
                  <button
                    onClick={async () => {
                      setSessionsLoading(true);
                      try {
                        const response = await getUserSessions();
                        if (response.success && response.data && response.data.sessions) {
                          setUserSessions(response.data.sessions);
                        }
                      } catch (error) {
                        console.error('刷新會話列表失敗:', error);
                      } finally {
                        setSessionsLoading(false);
                      }
                    }}
                    disabled={sessionsLoading}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    title="刷新會話列表"
                  >
                    <div className={`w-4 h-4 ${sessionsLoading ? 'animate-spin' : ''}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>
                  </button>
                  {/* 手機版關閉按鈕 */}
                  {isMobile && (
                    <button
                      onClick={() => setIsNavOpen(false)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
              </div>
              
              {/* 搜索功能暫停使用提示 */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-yellow-800 font-medium">搜索功能暫停使用</span>
                </div>
                <p className="text-xs text-yellow-700 mt-1">搜索對話功能暫時不可用</p>
              </div>
            </div>

            {/* 對話列表 */}
            <div className="flex-1 overflow-y-auto">
              {sessionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${AI_COLORS.border} mx-auto mb-2`}></div>
                    <p className="text-sm text-gray-600">載入會話中...</p>
                  </div>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <MessageSquare size={32} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">暫無會話</p>
                    <p className="text-xs text-gray-500">開始新的對話吧</p>
                  </div>
                </div>
              ) : (
                                 filteredConversations.map((conversation) => (
                   <ConversationItem
                     key={conversation.id}
                     conversation={conversation}
                     isSelected={selectedConversation === conversation.id}
                     onClick={() => {
                       console.log('🎯 點擊對話:', conversation);
                       setSelectedConversation(conversation.id);
                       // 根據對話ID獲取會話訊息
                       if (conversation.id) {
                         navigate(`/client/chat/${conversation.id}`);
                       }
                     }}
                     isMobile={isMobile}
                   />
                 ))
              )}
            </div>
          </div>
        </div>

        {/* 聊天界面 */}
        <div className="flex-1 flex flex-col">
          {currentSession ? (
            <ChatInterface 
              conversation={currentSession} 
              onSendMessage={handleSendMessage} 
              onBack={() => navigate('/client/chat')} 
              isMobile={isMobile} 
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">選擇會話開始聊天</h3>
                <p className="text-gray-500">從左側選擇一個會話開始聊天</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserChat; 