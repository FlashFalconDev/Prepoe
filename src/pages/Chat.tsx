import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Send, Bot, MessageCircle, Phone, FileText, Users, Filter, 
  Play, Pause, Plus, Settings, Edit, Trash2, Eye, Download,
  Globe, BarChart3, MessageSquare, Clock, AlertCircle, ArrowRight, X, User, RefreshCw, Copy
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import FeatureGate from '../components/FeatureGate';
import { useToast } from '../hooks/useToast';
import { AI_COLORS } from '../constants/colors';
import { 
  getMyPlatforms, 
  createPlatform, 
  updatePlatform, 
  exportPlatformData as exportPlatformDataService,
  startNewSession as startNewSessionService,
  sendMessage as sendMessageService,
  getMessages as getMessagesService,
  getManagedSessions,
  getRelatedSessions,
  toggleAITakeover,
  type ChatPlatform,
  type ChatSession,
  type ChatMessage,
  type CreatePlatformRequest,
  type AIAssistant
} from '../services/chatPlatform';
import { API_ENDPOINTS, createChatUrl } from '../config/api';
import PlatformIcon from '../components/PlatformIcon';

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
const formatChatTime = (timestamp: string): string => {
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

const ChatPlatformManagement: React.FC = () => {
  const { user, isAuthenticated, featureFlag } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  const location = useLocation();
  
  // 檢查是否通過客服對話路由訪問
  const isCustomerServiceRoute = location.pathname === '/provider/customer-service';
  const [platforms, setPlatforms] = useState<ChatPlatform[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<ChatPlatform | null>(null);
  const [activeTab, setActiveTab] = useState<'platforms' | 'conversations'>('platforms');
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [showCreatePlatform, setShowCreatePlatform] = useState(false);
  
  // 防止重複 API 調用
  const hasInitialized = useRef(false);
  
  // 新增：拉出式對話視窗狀態
  const [showConversationDrawer, setShowConversationDrawer] = useState(false);
  const [conversationView, setConversationView] = useState<'list' | 'chat'>('list');
  const [allSessions, setAllSessions] = useState<ChatSession[]>([]);
  const [selectedConversationSession, setSelectedConversationSession] = useState<ChatSession | null>(null);
  const [conversationMessages, setConversationMessages] = useState<ChatMessage[]>([]);
  const [adminReplyMessage, setAdminReplyMessage] = useState('');
  
  // 分頁和搜索相關狀態
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10); // 每頁顯示的對話數量
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'waiting' | 'resolved'>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'low' | 'medium' | 'high' | 'urgent'>('all');
  const [filterRole, setFilterRole] = useState<'all' | 'manager' | 'participant'>('all');
  
  // 載入狀態
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // 使用useRef來創建更可靠的防重複調用機制
  const fetchInProgressRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  
  // 聊天區域的 ref，用於自動滾動
  const chatAreaRef = useRef<HTMLDivElement>(null);
  
  // CSRF token 獲取函數（與使用者端保持一致）
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
  
  // 創建平台的表單狀態
  const [createPlatformForm, setCreatePlatformForm] = useState({
    name: '',
    description: '',
    ai_assistant_id: null as number | null,
    welcome_message: ''
  });

  // 編輯平台的表單狀態
  const [editPlatformForm, setEditPlatformForm] = useState({
    id: 0,
    name: '',
    description: '',
    ai_assistant_id: null as number | null,
    welcome_message: ''
  });

  // 編輯模式狀態
  const [showEditPlatform, setShowEditPlatform] = useState(false);

  // 篩選和分頁計算
  const filteredSessions = useMemo(() => {
    let filtered = allSessions;
    
    // 搜索篩選
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(session => 
        session.session_title.toLowerCase().includes(query) ||
        session.platform.name.toLowerCase().includes(query) ||
        (session.last_message?.content || '').toLowerCase().includes(query)
      );
    }
    
    // 狀態篩選
    if (filterStatus !== 'all') {
      filtered = filtered.filter(session => session.status === filterStatus);
    }
    
    // 優先級篩選
    if (filterPriority !== 'all') {
      filtered = filtered.filter(session => session.priority === filterPriority);
    }
    
    // 角色篩選
    if (filterRole !== 'all') {
      filtered = filtered.filter(session => session.user_role === filterRole);
    }
    
    return filtered;
  }, [allSessions, searchQuery, filterStatus, filterPriority, filterRole]);
  
  // 分頁計算
  const totalPages = Math.ceil(filteredSessions.length / pageSize);
  const paginatedSessions = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredSessions.slice(startIndex, startIndex + pageSize);
  }, [filteredSessions, currentPage, pageSize]);
  
  // 分頁控制函數
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // 滾動到對話列表頂部
    const conversationList = document.getElementById('conversation-list');
    if (conversationList) {
      conversationList.scrollTop = 0;
    }
  };
  
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // 重置到第一頁
  };
  
  const handleFilterChange = (type: 'status' | 'priority' | 'role', value: string) => {
    switch (type) {
      case 'status':
        setFilterStatus(value as any);
        break;
      case 'priority':
        setFilterPriority(value as any);
        break;
      case 'role':
        setFilterRole(value as any);
        break;
    }
    setCurrentPage(1); // 重置到第一頁
  };
  
  // 組件初始化時獲取平台列表
  useEffect(() => {
    if (isAuthenticated && !hasInitialized.current) {
      hasInitialized.current = true;
      fetchMyPlatforms();
    }
  }, [isAuthenticated]);


  // 當路由是客服對話時，自動切換到對話管理標籤
  useEffect(() => {
    if (isCustomerServiceRoute) {
      setActiveTab('conversations');
      fetchAllConversations();
    }
  }, [isCustomerServiceRoute]);
  
  // 監聽對話切換，自動載入訊息
  useEffect(() => {
    if (selectedConversationSession && conversationView === 'chat') {
      console.log('🔄 useEffect: 對話已切換，自動載入訊息:', selectedConversationSession.session_id);
      loadConversationMessages(selectedConversationSession.session_id);
    }
  }, [selectedConversationSession?.session_id, conversationView]);

  // 獲取我的平台列表
  const fetchMyPlatforms = async () => {
    if (fetchInProgressRef.current) return;
    
    const now = Date.now();
    if (now - lastFetchTimeRef.current < 1000) return;
    
    fetchInProgressRef.current = true;
    lastFetchTimeRef.current = now;
    
    try {
      setLoading(true);
      const result = await getMyPlatforms();
      console.log('🔍 getMyPlatforms 返回結果:', result);
      if (result.success) {
        // 根據API返回格式設置平台數據
        const platformsData = result.data;
        console.log('🔍 平台數據:', platformsData);
        if (Array.isArray(platformsData)) {
          setPlatforms(platformsData);
        } else if (platformsData && typeof platformsData === 'object' && 'platforms' in platformsData && Array.isArray((platformsData as any).platforms)) {
          setPlatforms((platformsData as any).platforms);
        } else {
          console.warn('🔍 平台數據格式不預期:', platformsData);
          setPlatforms([]);
        }
      } else {
        console.error('獲取平台失敗:', (result as any).error || (result as any).message);
      }
    } catch (error) {
      console.error('獲取平台時發生錯誤:', error);
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  };


  // 獲取管理員的對話
  const fetchAllConversations = async () => {
    try {
      setLoadingConversations(true);
      const response = await fetch(API_ENDPOINTS.SESSIONS_RELATED, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // 只顯示管理員角色的對話
          const managerSessions = (result.data.sessions || []).filter(
            (session: any) => session.user_role === 'manager'
          );
          setAllSessions(managerSessions);
          // 重置分頁到第一頁
          setCurrentPage(1);
        } else {
          console.error('獲取對話失敗:', result.message);
        }
      } else {
        console.error('獲取對話失敗:', response.status);
      }
    } catch (error) {
      console.error('獲取對話時發生錯誤:', error);
    } finally {
      setLoadingConversations(false);
    }
  };

  // 切換 AI 接管狀態
  const handleToggleAITakeover = async (sessionId: string, newState: boolean) => {
    try {
      // 檢查當前狀態，避免重複 API 調用
      const currentSession = allSessions.find(session => session.session_id === sessionId);
      if (currentSession?.manager_info?.ai_takeover === newState) {
        console.log(`ℹ️ AI 接管狀態已經是 ${newState ? '開啟' : '關閉'}，跳過 API 調用`);
        return;
      }
      
      console.log(`🔄 切換 AI 接管狀態: ${sessionId} -> ${newState}`);
      
      // 調用後端 API 更新 AI 接管狀態
      const result = await toggleAITakeover(sessionId, newState);
      
      if (result.success) {
        console.log(`✅ AI 接管狀態更新成功:`, result.data);
        
        // 更新本地會話列表中的 AI 接管狀態
        setAllSessions(prev => prev.map(session => {
          if (session.session_id === sessionId && session.manager_info) {
            return {
              ...session,
              manager_info: {
                ...session.manager_info,
                ai_takeover: newState
              }
            };
          }
          return session;
        }));
        
        // 使用統一的 Toast 提示系統
        showSuccess(
          `AI 接管功能已${newState ? '啟用' : '禁用'}`,
          newState ? 'AI 將自動處理客戶訊息' : '管理員將手動處理客戶訊息'
        );
      } else {
        console.error('❌ AI 接管狀態更新失敗:', (result as any).error);
        showError('更新失敗', (result as any).error || '未知錯誤');
        
        // 如果 API 失敗，回滾本地狀態
        setAllSessions(prev => prev.map(session => {
          if (session.session_id === sessionId && session.manager_info) {
            return {
              ...session,
              manager_info: {
                ...session.manager_info,
                ai_takeover: !newState // 回滾到原來的狀態
              }
            };
          }
          return session;
        }));
      }
      
    } catch (error) {
      console.error('❌ 切換 AI 接管狀態失敗:', error);
      showError('更新失敗', error instanceof Error ? error.message : '未知錯誤');
      
      // 如果發生錯誤，回滾本地狀態
      setAllSessions(prev => prev.map(session => {
        if (session.session_id === sessionId && session.manager_info) {
          return {
            ...session,
            manager_info: {
              ...session.manager_info,
              ai_takeover: !newState // 回滾到原來的狀態
            }
          };
        }
        return session;
      }));
    }
  };

  // 使用 PK 進行高效去重，並清理臨時訊息
  const removeDuplicateMessages = (messages: any[]) => {
    const seenIds = new Set();
    const uniqueMessages = [];
    
    for (const msg of messages) {
      // 跳過臨時訊息
      if (String(msg.id).startsWith('temp_')) {
        console.log('🔍 清理臨時訊息:', msg.id, msg.message);
        continue;
      }
      
      if (seenIds.has(msg.id)) {
        console.log('🔍 清理重複ID的訊息:', msg.id, msg.message);
        continue;
      }
      
      seenIds.add(msg.id);
      uniqueMessages.push(msg);
    }
    
    console.log(`🔍 清理完成: 原始 ${messages.length} 條 -> 清理後 ${uniqueMessages.length} 條`);
    return uniqueMessages;
  };

  // 載入對話訊息
  const loadConversationMessages = async (sessionId: string) => {
    try {
      setLoadingMessages(true);
      const response = await fetch(API_ENDPOINTS.CHAT_MESSAGES_GET(sessionId), {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log('🔍 成功獲取訊息:', result.data);
          console.log('🔍 訊息數量:', result.data.messages?.length || 0);
          console.log('🔍 第一條訊息結構:', result.data.messages?.[0]);
          
          // 清理重複訊息後設置
          console.log('🔍 載入訊息 - 原始數量:', result.data.messages?.length || 0);
          console.log('🔍 載入訊息 - 原始IDs:', result.data.messages?.map((m: any) => m.id) || []);
          
          const cleanedMessages = removeDuplicateMessages(result.data.messages || []);
          console.log('🔍 載入訊息 - 清理後數量:', cleanedMessages.length);
          console.log('🔍 載入訊息 - 清理後IDs:', cleanedMessages.map(m => m.id));
          
          setConversationMessages(cleanedMessages);
          
          // 檢查是否有 Reply_Token 數據
          if (result.data.Reply_Token !== undefined) {
            console.log(`🔔 初始載入時獲取 Reply_Token 數量: ${result.data.Reply_Token}`);
            setReplyTokenCount(result.data.Reply_Token);
          }
          
          // 設置最後訊息時間，用於輪詢
          if (cleanedMessages.length > 0) {
            const lastMessage = cleanedMessages[cleanedMessages.length - 1];
            setLastMessageTime(lastMessage.timestamp || lastMessage.created_at);
            console.log('🔍 設置初始最後訊息時間:', lastMessage.timestamp || lastMessage.created_at);
          }
          // 自動滾動到底部
          setTimeout(() => {
            if (chatAreaRef.current) {
              chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
            }
          }, 100);
        } else {
          console.error('獲取訊息失敗:', result.message);
          console.log('🔍 設置錯誤消息到UI:', result.message);
          console.log('🔍 錯誤消息對象:', {
            id: 'error_1',
            message: `❌ 載入訊息失敗: ${result.message || '未知錯誤'}`,
            message_type: 'text',
            sender_type: 'system',
            timestamp: new Date().toISOString()
          });
          // 顯示錯誤訊息給用戶
          setConversationMessages([{
            id: 'error_1',
            message: `❌ 載入訊息失敗: ${result.message || '未知錯誤'}`,
            message_type: 'text',
            sender_type: 'system',
            timestamp: new Date().toISOString()
          }]);
          console.log('🔍 已調用 setConversationMessages');
        }
      } else {
        console.error('獲取訊息失敗:', response.status);
        // 嘗試解析錯誤訊息
        try {
          const errorResult = await response.json();
          const errorMessage = errorResult.message || `HTTP錯誤: ${response.status}`;
          console.log('🔍 設置HTTP錯誤消息到UI:', errorMessage);
          setConversationMessages([{
            id: 'error_1',
            message: `❌ 載入訊息失敗: ${errorMessage}`,
            message_type: 'text',
            sender_type: 'system',
            timestamp: new Date().toISOString()
          }]);
        } catch (parseError) {
          // 如果無法解析JSON，顯示HTTP狀態碼
          console.log('🔍 設置HTTP狀態碼錯誤消息到UI:', response.status);
          setConversationMessages([{
            id: 'error_1',
            message: `❌ 載入訊息失敗: HTTP ${response.status}`,
            message_type: 'text',
            sender_type: 'system',
            timestamp: new Date().toISOString()
          }]);
        }
      }
    } catch (error) {
      console.error('獲取訊息時發生錯誤:', error);
      // 如果API失敗，從會話數據構造基本訊息
      const session = allSessions.find(s => s.session_id === sessionId);
      if (session && session.last_message) {
        const fallbackMessage: ChatMessage = {
          id: 'fallback_1',
          message: session.last_message.content || '無法載入訊息',
          message_type: 'text',
          sender_type: session.last_message.sender_type === 'member' ? 'customer' : (session.last_message.sender_type || 'customer'),
          timestamp: session.last_message.created_at || new Date().toISOString()
        };
        setConversationMessages([fallbackMessage]);
      }
    } finally {
      setLoadingMessages(false);
    }
  };

  // 發送訊息
  const handleSendMessage = async (sessionId: string, message: string, messageType: 'text' = 'text') => {
    if (!selectedConversationSession) {
      console.error('❌ 發送消息時會話狀態為空');
      return;
    }
    
    try {
      const csrfToken = await getCSRFToken();
      if (!csrfToken) {
        throw new Error('無法獲取CSRF token');
      }
      
      const response = await fetch(API_ENDPOINTS.CHAT_MESSAGE_SEND, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify({
          session_id: sessionId,
          message: message,
          message_type: messageType
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ 發送消息失敗:', response.status, errorText);
        throw new Error(`發送失敗: ${response.status}`);
      }
      
      const result = await response.json();
              if (result.success) {
          console.log('✅ 消息發送成功');
          
          // 自動關閉 AI 接管（如果當前是開啟狀態）
          if (selectedConversationSession.manager_info?.ai_takeover) {
            console.log('🔄 管理員已參與對話，自動關閉 AI 接管');
            try {
              await handleToggleAITakeover(selectedConversationSession.session_id, false);
              
              // 同步更新本地狀態，確保AI接管開關狀態正確
              setSelectedConversationSession(prev => ({
                ...prev!,
                manager_info: {
                  ...prev!.manager_info!,
                  ai_takeover: false
                }
              }));
            } catch (error) {
              console.error('❌ 自動關閉 AI 接管失敗:', error);
            }
          }
          
          // 樂觀更新UI - 立即顯示消息
          const newMessageObj: ChatMessage = {
            id: `temp_${Date.now()}`,
            message: message,
            message_type: messageType,
            sender_type: 'agent', // 管理員發送的消息
            timestamp: new Date().toISOString(),
            self: true // 標記為自己的訊息，確保顯示在右邊
          };
          setConversationMessages(prev => [...prev, newMessageObj]);
          
          // 立即清空輸入框
          setNewMessage('');
          
          // 立即滾動到底部
          setTimeout(() => {
            if (chatAreaRef.current) {
              chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
            }
          }, 100);
          
          // 智能去重：延遲移除臨時訊息，避免與真實訊息重複
          setTimeout(() => {
            setConversationMessages(prev => {
              // 找到對應的臨時訊息並移除
              return prev.filter(msg => {
                if (msg.id === `temp_${Date.now() - 100}` && msg.message === message) {
                  console.log('🔄 移除管理端樂觀更新的臨時訊息:', msg.id);
                  return false;
                }
                return true;
              });
            });
          }, 1000); // 1秒後移除臨時訊息
        } else {
        console.error('❌ 發送消息失敗:', result.message);
        throw new Error(result.message || '發送失敗');
      }
    } catch (error) {
      console.error('❌ 發送消息時發生錯誤:', error);
    }
  };

  // 發送管理員回覆
  const handleSendAdminReply = async () => {
    if (!selectedConversationSession || !adminReplyMessage.trim()) {
      return;
    }
    
    try {
      const csrfToken = await getCSRFToken();
      if (!csrfToken) {
        throw new Error('無法獲取CSRF token');
      }
      
      const response = await fetch(API_ENDPOINTS.CHAT_MESSAGE_SEND, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify({
          session_id: selectedConversationSession.session_id,
          message: adminReplyMessage.trim(),
          message_type: 'text'
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ 管理員回覆失敗:', response.status, errorText);
        throw new Error(`回覆失敗: ${response.status}`);
      }
      
      const result = await response.json();
              if (result.success) {
          console.log('✅ 管理員回覆成功');
          
          // 自動關閉 AI 接管（如果當前是開啟狀態）
          if (selectedConversationSession.manager_info?.ai_takeover) {
            console.log('🔄 管理員已參與對話，自動關閉 AI 接管');
            try {
              await handleToggleAITakeover(selectedConversationSession.session_id, false);
              
              // 同步更新本地狀態，確保AI接管開關狀態正確
              setSelectedConversationSession(prev => ({
                ...prev!,
                manager_info: {
                  ...prev!.manager_info!,
                  ai_takeover: false
                }
              }));
            } catch (error) {
              console.error('❌ 自動關閉 AI 接管失敗:', error);
            }
          }
          
          // 樂觀更新UI - 立即顯示消息
          const newMessageObj: ChatMessage = {
            id: `temp_${Date.now()}`,
            message: adminReplyMessage.trim(),
            message_type: 'text',
            sender_type: 'agent',
            timestamp: new Date().toISOString(),
            self: true // 標記為自己的訊息，確保顯示在右邊
          };
          setConversationMessages(prev => [...prev, newMessageObj]);
          
          // 立即清空輸入框
          setAdminReplyMessage('');
          
          // 立即滾動到底部
          setTimeout(() => {
            if (chatAreaRef.current) {
              chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
            }
          }, 100);
          
          // 智能去重：延遲移除臨時訊息，避免與真實訊息重複
          setTimeout(() => {
            setConversationMessages(prev => {
              // 找到對應的臨時訊息並移除
              return prev.filter(msg => {
                if (msg.id === `temp_${Date.now() - 100}` && msg.message === adminReplyMessage.trim()) {
                  console.log('🔄 移除管理端樂觀更新的臨時訊息:', msg.id);
                  return false;
                }
                return true;
              });
            });
          }, 1000); // 1秒後移除臨時訊息
        } else {
        console.error('❌ 管理員回覆失敗:', result.message);
        throw new Error(result.message || '回覆失敗');
      }
    } catch (error) {
      console.error('❌ 管理員回覆時發生錯誤:', error);
    }
  };

  // 創建平台
  const handleCreatePlatform = async () => {
    try {
      console.log('🔍 開始創建平台，表單數據:', createPlatformForm);
      
      // 驗證必填欄位
      if (!createPlatformForm.name || createPlatformForm.name.trim() === '') {
        alert('平台名稱是必填項，請填寫平台名稱');
        return;
      }
      
      if (!createPlatformForm.description || createPlatformForm.description.trim() === '') {
        alert('平台描述是必填項，請填寫平台描述');
        return;
      }
      
      // 調用創建平台 API
      const result = await createPlatform({
        name: createPlatformForm.name.trim(),
        description: createPlatformForm.description.trim(),
        ai_assistant_id: createPlatformForm.ai_assistant_id,
        welcome_message: createPlatformForm.welcome_message || ''
      });
      
      console.log('🔍 創建平台結果:', result);
      
      if (result.success) {
        console.log('✅ 平台創建成功');
        setShowCreatePlatform(false);
        setCreatePlatformForm({
          name: '',
          description: '',
          ai_assistant_id: null,
          welcome_message: ''
        });
        fetchMyPlatforms();
        alert('平台創建成功！');
      } else {
        console.error('❌ 創建平台失敗:', (result as any).error || (result as any).message);
        alert(`創建平台失敗: ${(result as any).error || (result as any).message || '未知錯誤'}`);
      }
    } catch (error) {
      console.error('❌ 創建平台時發生錯誤:', error);
      alert(`創建平台時發生錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  };

  // 開啟建立平台
  const handleOpenCreatePlatform = () => {
    setShowCreatePlatform(true);
  };

  // 更新平台
  const handleUpdatePlatform = async () => {
    try {
      console.log('🔍 開始更新平台:', editPlatformForm);
      
      const result = await updatePlatform(
        editPlatformForm.id,
        {
          name: editPlatformForm.name,
          description: editPlatformForm.description,
          welcome_message: editPlatformForm.welcome_message,
          ai_assistant_id: editPlatformForm.ai_assistant_id
        }
      );
      
      console.log('🔍 更新平台結果:', result);
      
      if (result.success) {
        console.log('✅ 平台更新成功');
        setShowEditPlatform(false);
        setEditPlatformForm({
          id: 0,
          name: '',
          description: '',
          ai_assistant_id: null,
          welcome_message: ''
        });
        // 重新獲取平台列表
        fetchMyPlatforms();
      } else {
        console.error('❌ 更新平台失敗:', (result as any).error || (result as any).message);
        alert(`更新平台失敗: ${(result as any).error || (result as any).message || '未知錯誤'}`);
      }
    } catch (error) {
      console.error('❌ 更新平台時發生錯誤:', error);
      alert(`更新平台時發生錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  };

  // 刪除平台
  const handleDeletePlatform = async (platformId: number) => {
    if (window.confirm('確定要刪除這個平台嗎？此操作無法撤銷。')) {
      try {
        // 這裡需要實現刪除平台的API調用
        console.log('刪除平台:', platformId);
        fetchMyPlatforms();
      } catch (error) {
        console.error('刪除平台時發生錯誤:', error);
      }
    }
  };

  // 導出平台數據
  const handleExportPlatform = async (platformId: number) => {
    try {
      const result = await exportPlatformDataService(platformId);
      if (result) {
        // 處理導出成功
        console.log('導出成功:', result);
        // 創建下載連結
        const url = window.URL.createObjectURL(result);
        const a = document.createElement('a');
        a.href = url;
        a.download = `platform_${platformId}_data.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('導出失敗: 無法獲取數據');
      }
    } catch (error) {
      console.error('導出時發生錯誤:', error);
    }
  };


  // 獲取狀態顏色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'waiting': return 'bg-yellow-500';
      case 'resolved': return 'bg-blue-500';
      case 'escalated': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // 獲取優先級顏色
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  // 統一的日期格式化函數
  const formatMessageTime = (timestamp: string) => {
    const messageDate = new Date(timestamp);
    const isValidDate = !isNaN(messageDate.getTime());
    return isValidDate ? messageDate.toLocaleTimeString() : '時間未知';
  };

  const [messagePolling, setMessagePolling] = useState<NodeJS.Timeout | null>(null);
  const [lastMessageId, setLastMessageId] = useState<string | number | null>(null);
  const [lastMessageTime, setLastMessageTime] = useState<string | null>(null);
  const [isCheckingMessages, setIsCheckingMessages] = useState(false); // 防止重複檢查
  const [replyTokenCount, setReplyTokenCount] = useState<number>(0); // 存儲 Reply_Token 數量

  // 輕量級檢查新訊息
  const checkForNewMessages = async (sessionId: string) => {
    console.log('🔍 檢查新訊息 - 當前訊息數量:', conversationMessages.length);
    
    // 找到最後一條真實訊息（優先使用非臨時訊息，如果沒有則使用臨時訊息）
    const lastRealMessage = conversationMessages
      .filter(msg => {
        if (!msg || !msg.id) return false;
        
        // 支援數字和字符串類型的 ID
        if (typeof msg.id === 'number') return true; // 數字 ID 都是真實的
        if (typeof msg.id === 'string') return true; // 暫時允許所有字符串 ID，包括臨時訊息
        
        return false; // 其他類型排除
      })
      .pop();
    
    if (!lastRealMessage) {
      console.log('❌ 沒有找到真實訊息，跳過檢查');
      return;
    }
    
    // 嘗試多個可能的時間戳欄位
    const lastMessageTime = lastRealMessage.timestamp;
    console.log('🔍 使用最後訊息時間:', lastMessageTime);
    
    // 檢查時間戳是否有效
    if (!lastMessageTime) {
      console.log('❌ 最後訊息時間戳無效，跳過檢查');
      return;
    }
    
    try {
      const url = `${API_ENDPOINTS.CHAT_CHECK_NEW(sessionId)}?last_time=${encodeURIComponent(lastMessageTime)}`;
      console.log('🔍 請求URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.success && result.data.has_new) {
          console.log(`🔔 發現 ${result.data.count} 條新訊息`);
          
          // 檢查是否有 Reply_Token 數據
          if (result.data.Reply_Token !== undefined) {
            console.log(`🔔 更新 Reply_Token 數量: ${result.data.Reply_Token}`);
            setReplyTokenCount(result.data.Reply_Token);
          }
          
          // 只添加新訊息，不重新載入全部
          const newMessages = result.data.new_messages.map((msg: any) => ({
            id: msg.id,
            message: msg.message || msg.content || msg.text,
            message_type: msg.message_type,
            sender_type: msg.sender_type,
            timestamp: msg.created_at || msg.timestamp,
            self: msg.self
          }));
          
          // 使用 PK 進行高效去重，並清理臨時訊息
          setConversationMessages(prev => {
            console.log('🔍 當前對話訊息數量:', prev.length);
            console.log('🔍 當前對話訊息IDs:', prev.map(m => m.id));
            console.log('🔍 新訊息數量:', newMessages.length);
            console.log('🔍 新訊息IDs:', newMessages.map((m: any) => m.id));
            
            const existingIds = new Set(prev.map(m => m.id));
            
            // 清理臨時訊息，只保留真實訊息
            const realMessages = prev.filter(msg => !String(msg.id).startsWith('temp_'));
            console.log('🔍 清理臨時訊息後數量:', realMessages.length);
            
            const trulyNewMessages = newMessages.filter((msg: any) => {
              const isIdDuplicate = existingIds.has(msg.id);
              
              if (isIdDuplicate) {
                console.log('🔍 跳過重複ID的訊息:', msg.id, msg.message);
                return false;
              }
              
              console.log('🔍 通過檢查的新訊息:', msg.id, msg.message);
              return true;
            });
            
            if (trulyNewMessages.length > 0) {
              console.log(`🔔 添加 ${trulyNewMessages.length} 條真正的新訊息`);
              const newState = [...realMessages, ...trulyNewMessages];
              console.log('🔍 更新後的狀態，訊息數量:', newState.length);
              console.log('🔍 更新後的狀態，訊息IDs:', newState.map(m => m.id));
              return newState;
            } else {
              console.log('🔔 沒有真正的新訊息，跳過添加');
              return realMessages; // 返回清理後的狀態
            }
          });
          
          // 更新最後訊息ID
          if (newMessages.length > 0) {
            setLastMessageId(newMessages[newMessages.length - 1].id);
          }
          
          // 自動滾動到底部
          setTimeout(() => {
            if (chatAreaRef.current) {
              chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
            }
          }, 100);
        }
      }
    } catch (error) {
      console.error('檢查新訊息失敗:', error);
    }
  };

  // 開啟對話時啟動輪詢
  useEffect(() => {
    if (selectedConversationSession && conversationView === 'chat') {
      // 先停止現有的輪詢
      if (messagePolling) {
        clearInterval(messagePolling);
        setMessagePolling(null);
      }
      
      // 延遲啟動輪詢，等待訊息載入完成
      const startPolling = () => {
        // 設置最後訊息ID和時間
        if (conversationMessages.length > 0) {
          const lastMessage = conversationMessages[conversationMessages.length - 1];
          const lastId = lastMessage.id;
          const lastTime = lastMessage.timestamp;
          
          setLastMessageId(lastId);
          setLastMessageTime(lastTime);
          console.log('🔍 設置最後訊息ID:', lastId);
          console.log('🔍 設置最後訊息時間:', lastTime);
        }
        
        // 啟動新的輪詢
        const interval = setInterval(() => {
          console.log('🔍 開始檢查新訊息...');
          checkForNewMessages(selectedConversationSession.session_id);
        }, 5000); // 5秒檢查一次
        
        setMessagePolling(interval);
        console.log('🔍 啟動訊息輪詢，間隔5秒');
      };
      
      // 如果已有訊息，立即啟動輪詢；否則等待1秒後啟動
      if (conversationMessages.length > 0) {
        startPolling();
      } else {
        setTimeout(startPolling, 1000);
      }
      
      return () => {
        if (messagePolling) {
          clearInterval(messagePolling);
          console.log('🔍 停止訊息輪詢');
        }
      };
    }
  }, [selectedConversationSession, conversationView, conversationMessages]); // 重新添加 conversationMessages 依賴

  // 關閉對話時停止輪詢
  useEffect(() => {
    if (!selectedConversationSession || conversationView !== 'chat') {
      if (messagePolling) {
        clearInterval(messagePolling);
        setMessagePolling(null);
      }
    }
  }, [selectedConversationSession, conversationView]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">需要登入</h2>
          <p className="text-gray-600">請先登入以訪問此功能</p>
        </div>
      </div>
    );
  }

  return (
    <FeatureGate feature="chat_platform_count">
      <div className="min-h-screen bg-gray-50">
      {/* 主要內容區域 */}
      <div className="max-w-7xl mx-auto">
        {/* 功能列（標籤頁）- 移到頂部，手機版和桌面版都顯示 */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-3 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex space-x-1 sm:space-x-4">
                <button
                  onClick={() => {
                    setActiveTab('platforms');
                    // 切換到平台管理標籤時自動刷新數據
                    fetchMyPlatforms();
                  }}
                  className={`px-2 sm:px-3 py-2 text-sm sm:text-base font-medium rounded-lg transition-colors ${
                    activeTab === 'platforms'
                      ? `${AI_COLORS.text} ${AI_COLORS.bg} border ${AI_COLORS.border}`
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  平台管理
                </button>
                <button
                  onClick={() => {
                    setActiveTab('conversations');
                    // 切換到客服對話標籤時自動刷新數據
                    fetchAllConversations();
                  }}
                  className={`px-2 sm:px-3 py-2 text-sm sm:text-base font-medium rounded-lg transition-colors ${
                    activeTab === 'conversations'
                      ? `${AI_COLORS.text} ${AI_COLORS.bg} border ${AI_COLORS.border}`
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  客服對話
                </button>
              </div>
              
              {/* 刷新對話按鈕 - 移到標籤導航右側，變成符號按鈕 */}
              {activeTab === 'conversations' && (
                <button
                  onClick={fetchAllConversations}
                  className={`p-2 text-gray-500 hover:${AI_COLORS.text} hover:${AI_COLORS.bgLight} rounded-lg transition-colors`}
                  title="刷新對話"
                >
                  <RefreshCw size={18} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 平台管理標籤內容 */}
        {activeTab === 'platforms' && (
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <div className="mb-4 sm:mb-0">
                {typeof featureFlag?.chat_platform_count !== 'undefined' && (
                  <span className="text-sm text-gray-500">
                    已使用：{platforms.length} / {Number(featureFlag?.chat_platform_count || 0)}
                  </span>
                )}
              </div>
              <button
                onClick={handleOpenCreatePlatform}
                disabled={platforms.length >= Number(featureFlag?.chat_platform_count || 0)}
                className={`w-full sm:w-auto px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                  platforms.length >= Number(featureFlag?.chat_platform_count || 0)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : `${AI_COLORS.button}`
                }`}
                title={
                  platforms.length >= Number(featureFlag?.chat_platform_count || 0)
                    ? `已達上限 (${platforms.length}/${featureFlag?.chat_platform_count})`
                    : '建立新平台'
                }
              >
                <Plus size={16} />
                建立新平台
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${AI_COLORS.border} mx-auto`}></div>
                <p className="mt-2 text-gray-600">載入中...</p>
              </div>
            ) : platforms.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Globe size={48} className="text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">還沒有平台</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  建立您的第一個客服平台來開始提供服務，為客戶提供更好的體驗
                </p>
                <button
                  onClick={handleOpenCreatePlatform}
                  disabled={platforms.length >= Number(featureFlag?.chat_platform_count || 0)}
                  className={`px-6 py-3 rounded-lg transition-all duration-200 flex items-center gap-2 mx-auto ${
                    platforms.length >= Number(featureFlag?.chat_platform_count || 0)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : `${AI_COLORS.button}`
                  }`}
                  title={
                    platforms.length >= Number(featureFlag?.chat_platform_count || 0)
                      ? `已達上限 (${platforms.length}/${featureFlag?.chat_platform_count})`
                      : '建立第一個平台'
                  }
                >
                  <Plus size={20} />
                  建立第一個平台
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {platforms.map((platform) => (
                  <div key={platform.id} className={`bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:${AI_COLORS.border} group`}>
                    {/* 卡片頭部 */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-semibold text-gray-900 mb-2 truncate" title={platform.name}>
                          {platform.name}
                        </h4>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2" title={platform.description}>
                          {platform.description}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                          <Globe size={14} className="text-gray-400" />
                          <span className="font-mono text-xs truncate" title={platform.unique_code}>
                            代碼: {platform.unique_code}
                          </span>
                        </div>
                      </div>
                      
                      {/* 操作按鈕 - 只保留編輯功能 */}
                      <div className="flex items-center gap-1 ml-3">
                        <button
                          onClick={() => {
                            setEditPlatformForm({
                              id: platform.id,
                              name: platform.name,
                              description: platform.description,
                              ai_assistant_id: platform.ai_assistant_id || null,
                              welcome_message: platform.welcome_message || ''
                            });
                            setShowEditPlatform(true);
                          }}
                          className={`p-2 text-gray-400 hover:${AI_COLORS.text} hover:${AI_COLORS.bgLight} rounded-lg transition-all duration-200`}
                          title="編輯平台"
                        >
                          <Edit size={16} />
                        </button>
                      </div>
                    </div>
                    
                                         {/* 卡片底部 - 左右兩個區塊 */}
                     <div className="grid grid-cols-2 gap-3">
                       {/* 左側：AI助手狀態 */}
                       <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                         <div className={`w-8 h-8 ${AI_COLORS.bg} rounded-full flex items-center justify-center`}>
                           <Bot size={16} className={AI_COLORS.text} />
                         </div>
                         <div className="flex-1 min-w-0">
                           <p className="text-sm font-medium text-gray-700">
                             {platform.ai_assistant_name || '未設定AI助手'}
                           </p>
                         </div>
                       </div>
                       
                       {/* 右側：代碼複製 */}
                       <div className="flex items-center justify-center p-3 bg-gray-50 rounded-lg">
                         <button
                           onClick={() => {
                             const chatUrl = createChatUrl(platform.unique_code || '');
                             navigator.clipboard.writeText(chatUrl);
                             showSuccess('對話網址已複製到剪貼簿');
                           }}
                           className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                           title="複製對話網址"
                         >
                           <Copy size={20} />
                         </button>
                       </div>
                     </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 客服對話標籤內容 */}
        {activeTab === 'conversations' && (
          <div className="p-4 sm:p-6 lg:p-8">
            {/* 移除刷新按鈕，已經移動到標籤導航 */}
            
            {loading ? (
              <div className="text-center py-8">
                <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${AI_COLORS.border} mx-auto`}></div>
                <p className="mt-2 text-gray-600">載入中...</p>
              </div>
            ) : allSessions.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare size={48} className="text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">還沒有管理員對話會話</h3>
                <p className="text-gray-600">當您管理的客戶開始對話時，會話將顯示在這裡</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {allSessions
                  .sort((a, b) => {
                    // 按優先級排序：高 > 中 > 低
                    const priorityOrder = { high: 3, medium: 2, low: 1 };
                    return (priorityOrder[b.priority as keyof typeof priorityOrder] || 1) - (priorityOrder[a.priority as keyof typeof priorityOrder] || 1);
                  })
                  .map((session) => (
                    <div
                      key={`session-${session.session_id || session.id}`}
                      className="relative bg-white border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-all duration-200 cursor-pointer group"
                      onClick={() => {
                        console.log('🔄 開始切換對話...');
                        console.log('🔄 當前對話:', selectedConversationSession?.session_id);
                        console.log('🔄 目標對話:', session.session_id);
                        
                                                 // 先清空當前訊息，強制重新渲染
                         setConversationMessages([]);
                         
                         // 重置 Reply_Token 數量
                         setReplyTokenCount(0);
                         
                         // 設置新的會話
                         setSelectedConversationSession(session);
                         setConversationView('chat');
                         
                         console.log('✅ 對話已切換，useEffect 將自動載入訊息');
                      }}
                    >
                      {/* 左上：進行中狀態標籤 */}
                      <div className="absolute top-2 left-2">
                        <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium text-white ${getStatusColor(session.status)}`}>
                          {session.status === 'active' ? '進行中' : 
                           session.status === 'waiting' ? '等待中' : 
                           session.status === 'resolved' ? '已解決' : '已升級'}
                        </span>
                      </div>

                      {/* 右上：時間 */}
                      <div className="absolute top-2 right-2">
                        <span className="text-xs text-gray-500">
                          {session.last_message?.created_at ? formatRelativeTime(session.last_message.created_at) : '--'}
                        </span>
                      </div>

                                              {/* 中間：圓形頭像（外框顏色跟隨優先級） */}
                        <div className="flex justify-center mt-4 mb-2 relative">
                          <div className={`w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center border-2 ${
                            session.priority === 'high' ? 'border-red-500' :
                            session.priority === 'medium' ? 'border-yellow-500' :
                            'border-green-500'
                          }`}>
                            {(session.platform as any)?.ai_assistant_id ? (
                              <Bot size={40} className={AI_COLORS.text} />
                            ) : (
                              <User size={40} className="text-gray-500" />
                            )}
                          </div>
                        
                        {/* 人數：浮水印方式，在人像右下方 */}
                        <div className="absolute bottom-6 right-0 bg-black/20 text-white text-xs font-bold rounded-full px-1 py-1 flex items-center justify-center backdrop-blur-sm z-10">
                          × {(session as any).session_users?.length || 1} 人
                        </div>
                        
                        {/* 平台圖標：放在頭像左下角 */}
                        {session.source_platform && (
                          <div className="absolute -bottom-1 -left+5">
                            <PlatformIcon sourcePlatform={session.source_platform} size="sm" />
                          </div>
                        )}
                        
                        {/* 機器人狀態：放在平台圖標右邊 */}
                        <div className="absolute -bottom-1 left-1">
                          <Bot 
                            size={22} 
                            className={`${
                              session.manager_info?.ai_takeover ? AI_COLORS.text : 'text-gray-400'
                            }`}
                          />
                        </div>
                      </div>

                      {/* 圖像下方：Label */}
                      <div className="text-center mb-0">
                        <span className="text-xs text-gray-700 font-medium">
                          {session.session_title || '新對話'}
                        </span>
                      </div>

                      {/* 懸停時的邊框效果 */}
                      <div className={`absolute inset-0 rounded-lg border-2 border-transparent group-hover:${AI_COLORS.border} transition-colors pointer-events-none`}></div>
                    </div>
                  ))}
              </div>
            )}

            {/* 聊天界面 - 全屏覆蓋，和訪客端一樣 */}
            {selectedConversationSession && conversationView === 'chat' && (
              <div className="fixed inset-0 bg-white z-50 flex flex-col">
                {/* 聊天標題和關閉按鈕 */}
                <div className="bg-gray-50 p-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {selectedConversationSession.session_title || '未命名對話'}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-500">
                          會話ID: {selectedConversationSession.session_id?.slice(-5) || '未知'}
                        </span>
                        <button
                          onClick={() => {
                            if (selectedConversationSession.session_id) {
                              const fullUrl = `${window.location.origin}/client/chat/${selectedConversationSession.session_id}`;
                              navigator.clipboard.writeText(fullUrl);
                              // 可以添加複製成功的提示
                            }
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          title="複製完整會話ID"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                        
                        {/* LINE 平台顯示 Reply_Token 數量 */}
                        {selectedConversationSession.source_platform === 'line' && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full">
                            <i className="ri-line-fill text-green-600 text-sm"></i>
                            <span className="text-xs text-green-700 font-medium">
                              {replyTokenCount} token
                            </span>
                          </div>
                        )}
                      </div>
                      {/* AI接管開關 */}
                      {selectedConversationSession.manager_info && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-sm text-gray-600">AI接管</span>
                          <button
                            onClick={async () => {
                              if (selectedConversationSession.session_id) {
                                try {
                                  const newStatus = !selectedConversationSession.manager_info?.ai_takeover;
                                  // 立即更新本地狀態，提供即時反饋
                                  setSelectedConversationSession(prev => ({
                                    ...prev!,
                                    manager_info: {
                                      ...prev!.manager_info!,
                                      ai_takeover: newStatus
                                    }
                                  }));
                                  
                                  // 調用API
                                  await handleToggleAITakeover(
                                    selectedConversationSession.session_id, 
                                    newStatus
                                  );
                                } catch (error) {
                                  // 如果API失敗，恢復原狀態
                                  setSelectedConversationSession(prev => ({
                                    ...prev!,
                                    manager_info: {
                                      ...prev!.manager_info!,
                                      ai_takeover: !selectedConversationSession.manager_info?.ai_takeover
                                    }
                                  }));
                                  console.error('AI接管切換失敗:', error);
                                }
                              }
                            }}
                            disabled={false}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ai-500 focus:ring-offset-2 ${
                              selectedConversationSession.manager_info?.ai_takeover 
                                ? AI_COLORS.bgDark
                                : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                                selectedConversationSession.manager_info?.ai_takeover 
                                  ? 'translate-x-5' 
                                  : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedConversationSession.priority)}`}>
                      {selectedConversationSession.priority === 'high' ? '高' : 
                       selectedConversationSession.priority === 'medium' ? '中' : '低'} 優先級
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(selectedConversationSession.status)}`}>
                      {selectedConversationSession.status === 'active' ? '進行中' : 
                       selectedConversationSession.status === 'waiting' ? '等待中' : 
                       selectedConversationSession.status === 'resolved' ? '已解決' : '已升級'}
                    </span>
                    <button
                      onClick={() => {
                        setConversationView('list');
                        setSelectedConversationSession(null);
                      }}
                      className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors shadow-md"
                      title="關閉對話"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                {/* 聊天訊息 - 全版顯示 */}
                <div 
                  ref={chatAreaRef}
                  className="flex-1 overflow-y-auto p-4 space-y-4 w-full"
                >
                  {/* 載入狀態指示器 - 統一顯示，避免重複 */}
                  {loadingMessages ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className={`animate-spin rounded-full h-10 w-10 border-b-2 ${AI_COLORS.border} mb-3`}></div>
                      <p className="text-base text-gray-600 font-medium">載入對話訊息中...</p>
                      <p className="text-sm text-gray-500 mt-1">請稍候</p>
                    </div>
                  ) : conversationMessages.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare size={48} className="text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 text-base">沒有訊息</p>
                      <p className="text-gray-400 text-sm mt-1">開始新的對話吧</p>
                    </div>
                  ) : (
                                        conversationMessages.map((message, index) => {
                      // 使用24小時制時間格式化函數
                      const timestampValue = message.timestamp;
                      const displayTime = timestampValue ? formatChatTime(timestampValue) : '時間未知';
                      
                      // 檢查是否需要顯示日期提示
                      const showDateDivider = (() => {
                        if (index === 0) return true; // 第一條訊息總是顯示日期
                        
                        const prevMessage = conversationMessages[index - 1];
                        const prevTimestamp = prevMessage.timestamp;
                        
                        if (!timestampValue || !prevTimestamp) return false;
                        
                        try {
                          const currentDate = new Date(timestampValue);
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
                      
                      // 發言者類型判斷 - 適配管理員端數據結構
                      const isAIMessage = message.sender_type === 'ai';
                      const isAgentMessage = message.sender_type === 'agent';
                      const isMemberMessage = false; // member 類型不存在於 ChatMessage 介面中
                      const isSystemMessage = message.sender_type === 'system';
                      
                      // 消息對齊邏輯 - 優先使用 self 欄位，特殊處理系統訊息
                      const isOwnMessage = message.self === true; // 使用 self 欄位判斷
                      
                      // 特殊處理：如果 sender_type 是 system 但 self 是 false，當作客戶訊息處理
                      const shouldAlignRight = isOwnMessage; // 自己的訊息靠右
                      const shouldAlignLeft = !isOwnMessage; // 別人的訊息靠左
                      const shouldAlignCenter = false; // 暫時禁用系統消息居中，統一使用左右對齊
                      
                      return (
                        <div key={`msg-${message.id}-${message.timestamp || 'unknown'}`}>
                          {/* 日期分隔線 */}
                          {showDateDivider && timestampValue && (
                            <div className="flex justify-center my-4">
                              <div className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full">
                                {formatDate(timestampValue)}
                              </div>
                            </div>
                          )}
                          
                          <div
                            className={`flex ${shouldAlignCenter ? 'justify-center' : shouldAlignRight ? 'justify-end' : 'justify-start'} animate-in fade-in-0 slide-in-from-bottom-2 duration-300 w-full`}
                          >
                            <div className={`flex ${shouldAlignCenter ? 'flex-row' : shouldAlignRight ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 max-w-xs lg:max-w-md group ${!shouldAlignRight && !shouldAlignCenter ? 'ml-0' : ''}`}>
                              {/* 發言者頭像 - 完全複製客戶端樣式 */}
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                                isAIMessage 
                                  ? `${AI_COLORS.bg} group-hover:${AI_COLORS.bgHover}` 
                                  : isAgentMessage
                                  ? AI_COLORS.button
                                  : AI_COLORS.button
                              }`}>
                                {isAIMessage ? (
                                  <Bot size={16} className={AI_COLORS.text} />
                                ) : isAgentMessage ? (
                                  <User size={16} className="text-white" />
                                ) : (
                                  <User size={16} className="text-white" />
                                )}
                              </div>
                              
                              {/* 訊息內容 - 管理員端樣式 */}
                              <div className={`px-4 py-2 rounded-2xl shadow-sm ${
                                isAIMessage
                                  ? `${AI_COLORS.bg} ${AI_COLORS.textDark} rounded-bl-md` // AI訊息：橙色背景，左下角較尖
                                  : isOwnMessage
                                  ? `${AI_COLORS.bgDark} text-white rounded-br-md` // 自己的訊息：主題色背景，右下角較尖
                                  : 'bg-gray-100 text-gray-900 rounded-bl-md' // 別人的訊息：灰色背景，左下角較尖
                              }`}>
                                {/* 發言者名稱 - 根據訊息類型顯示 */}
                                {!isOwnMessage && (
                                  <div className="text-xs font-medium mb-1 text-gray-600">
                                    {isAIMessage ? 'AI助手' : '客戶'}
                                  </div>
                                )}
                                
                                {/* 訊息內容 - 嘗試多個可能的字段名 */}
                                <div className="text-sm">
                                  {(() => {
                                    const content = message.content || message.message;
                                    if (!content) {
                                      console.log('🔍 訊息內容提取失敗:', {
                                        id: message.id,
                                        message: message.message,
                                        content: message.content,
                                        fullMessage: message
                                      });
                                    }
                                    return processMessageText(content || '訊息內容載入中...');
                                  })()}
                                </div>
                                
                                {/* 時間戳和狀態 - 管理員端樣式 */}
                                <div className="flex items-center justify-between mt-1">
                                  <p className={`text-xs ${
                                    isOwnMessage ? 'text-white' : 'text-gray-500'
                                  }`}>
                                    {displayTime}
                                  </p>
                                  
                                  {/* 傳送狀態指示器 - 只在自己的訊息上顯示 */}
                                  {isOwnMessage && (
                                    <div className="flex items-center gap-1">
                                      <span className="text-white">√</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* 管理員回覆輸入 - 保持原有邏輯 */}
                <div className="bg-white border-t border-gray-200 p-3 sm:p-4">
                  <div className="flex gap-2 sm:gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="輸入管理員回覆..."
                      className={`flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ai-500 focus:border-transparent text-sm sm:text-base`}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && newMessage.trim()) {
                          handleSendMessage(selectedConversationSession.session_id, newMessage.trim());
                          setNewMessage(''); // 清空輸入框
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        if (newMessage.trim()) {
                          handleSendMessage(selectedConversationSession.session_id, newMessage.trim());
                          setNewMessage(''); // 清空輸入框
                        }
                      }}
                      className={`${AI_COLORS.button} px-4 sm:px-6 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm sm:text-base`}
                    >
                      <Send size={16} className="sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">發送</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 創建平台模態框 */}
      {showCreatePlatform && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">建立新平台</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">平台名稱</label>
                <input
                  type="text"
                  value={createPlatformForm.name}
                  onChange={(e) => setCreatePlatformForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-ai-500 focus:border-transparent"
                  placeholder="輸入平台名稱"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">平台描述</label>
                <textarea
                  value={createPlatformForm.description}
                  onChange={(e) => setCreatePlatformForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-ai-500 focus:border-transparent"
                  rows={3}
                  placeholder="輸入平台描述"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">AI助手</label>
                <select
                  value={createPlatformForm.ai_assistant_id || ''}
                  onChange={(e) => setCreatePlatformForm(prev => ({ 
                    ...prev, 
                    ai_assistant_id: e.target.value ? parseInt(e.target.value) : null 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-ai-500 focus:border-transparent"
                >
                  <option value="">選擇AI助手（可選）</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">歡迎訊息</label>
                <textarea
                  value={createPlatformForm.welcome_message}
                  onChange={(e) => setCreatePlatformForm(prev => ({ ...prev, welcome_message: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-ai-500 focus:border-transparent"
                  rows={3}
                  placeholder="輸入歡迎訊息"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreatePlatform(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreatePlatform}
                disabled={!createPlatformForm.name.trim()}
                className={`flex-1 px-4 py-2 ${AI_COLORS.button} rounded-md transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed`}
              >
                建立
              </button>
            </div>
          </div>
        </div>
      )}


      {/* 編輯平台模態框 */}
      {showEditPlatform && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">編輯平台</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">平台名稱</label>
                <input
                  type="text"
                  value={editPlatformForm.name}
                  onChange={(e) => setEditPlatformForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-ai-500 focus:border-transparent"
                  placeholder="輸入平台名稱"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">平台描述</label>
                <textarea
                  value={editPlatformForm.description}
                  onChange={(e) => setEditPlatformForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-ai-500 focus:border-transparent"
                  rows={3}
                  placeholder="輸入平台描述"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">AI助手</label>
                <select
                  value={editPlatformForm.ai_assistant_id || ''}
                  onChange={(e) => setEditPlatformForm(prev => ({ 
                    ...prev, 
                    ai_assistant_id: e.target.value ? parseInt(e.target.value) : null 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-ai-500 focus:border-transparent"
                >
                  <option value="">選擇AI助手（可選）</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">歡迎訊息</label>
                <textarea
                  value={editPlatformForm.welcome_message}
                  onChange={(e) => setEditPlatformForm(prev => ({ ...prev, welcome_message: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-ai-500 focus:border-transparent"
                  rows={3}
                  placeholder="輸入歡迎訊息"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditPlatform(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleUpdatePlatform}
                disabled={!editPlatformForm.name.trim()}
                className={`flex-1 px-4 py-2 ${AI_COLORS.button} rounded-md transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed`}
              >
                更新
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </FeatureGate>
  );
};

export default ChatPlatformManagement; 