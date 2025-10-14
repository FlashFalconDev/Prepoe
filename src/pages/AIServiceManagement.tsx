import React, { useState, useEffect, useRef } from 'react';
import { Bot, FileText, Plus, Search, Filter, MoreVertical, Edit, Trash2, Eye, Settings, FolderOpen, Database, MessageCircle, X, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  getAIAssistants, 
  getUsageStatistics, 
  deleteAIAssistant,
  createVectorStore,
  sendChatMessage,
  type AIAssistant,
  type AIAssistantDocument,
  type ChatResponse
} from '../config/api';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../contexts/AuthContext';
import { AI_COLORS } from '../constants/colors';
import PlatformIcon from '../components/PlatformIcon';




const AIServiceManagement: React.FC = () => {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const { featureFlag } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [assistants, setAssistants] = useState<AIAssistant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);
  const [statistics, setStatistics] = useState({
    total_assistants: 0,
    active_assistants: 0,
    total_documents: 0,
    total_tokens: 0
  });
  
  // 防止重複 API 調用
  const hasInitialized = useRef(false);
  
  // 對話測試相關狀態
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentAssistant, setCurrentAssistant] = useState<AIAssistant | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  // 向量化載入狀態 - 追蹤每個助理的向量化狀態
  const [vectorizingAssistants, setVectorizingAssistants] = useState<Set<number>>(new Set());

  // 載入AI助手列表
  const loadAssistants = async (forceReload = false) => {
    console.log('🚀 loadAssistants 開始執行, forceReload:', forceReload, 'isLoading:', isLoading);
    
    // 防止重複載入
    if (isLoading && !forceReload) {
      console.log('⚠️ 正在載入中，跳過重複呼叫');
      return;
    }
    
    // 強制重置載入狀態（調試用）
    if (forceReload) {
      console.log('🔄 強制重新載入，重置載入狀態');
      setIsLoading(false);
    }
    
    try {
      console.log('📡 開始API呼叫...');
      setIsLoading(true);
      
      // 直接呼叫API，不使用Promise.race
      const response = await getAIAssistants(1, 50, searchTerm);
      console.log('✅ API呼叫成功，響應:', response);
      
      // 檢查響應格式：可能是直接的數組或包含success的對象
      let assistantsData: any[] = [];
      if (Array.isArray(response)) {
        console.log('📋 響應是數組格式');
        assistantsData = response;
      } else if (response && typeof response === 'object' && response !== null && 'success' in response && 'data' in response && response.data && typeof response.data === 'object' && response.data !== null && 'assistants' in response.data) {
        console.log('📋 響應是success格式');
        assistantsData = (response.data as any).assistants || [];
      } else if (response && typeof response === 'object' && response !== null && 'data' in response && Array.isArray((response as any).data)) {
        console.log('📋 響應是data數組格式');
        assistantsData = (response as any).data;
      } else {
        console.error('❌ 未知的響應格式:', response);
        showError('載入AI助手列表失敗：響應格式錯誤');
        setAssistants([]);
        setStatistics({
          total_assistants: 0,
          active_assistants: 0,
          total_documents: 0,
          total_tokens: 0,
        });
        return;
      }
      
      console.log('📊 處理後的助手數據:', assistantsData);
      
      // 處理數據，添加缺失的欄位
      const processedAssistants = assistantsData.map((assistant: any) => ({
        ...assistant,
        system_prompt: assistant.system_prompt || '',
        total_conversations: assistant.total_conversations || 0,
        total_tokens_used: assistant.total_tokens_used || 0,
        document_count: assistant.document_count || 0,
      }));
      
      setAssistants(processedAssistants);
      
      // 從助理列表計算基本統計
      const totalAssistants = processedAssistants.length;
      const activeAssistants = processedAssistants.filter((a: any) => a.is_active).length;
      const totalDocuments = processedAssistants.reduce((sum: number, a: any) => sum + (a.document_count || 0), 0);
      const totalTokens = processedAssistants.reduce((sum: number, a: any) => sum + (a.total_tokens_used || 0), 0);
      
      setStatistics({
        total_assistants: totalAssistants,
        active_assistants: activeAssistants,
        total_documents: totalDocuments,
        total_tokens: totalTokens,
      });
      
      console.log('🎉 載入成功:', processedAssistants.length, '個助手');
      console.log('📊 設置統計數據:', {
        total_assistants: totalAssistants,
        active_assistants: activeAssistants,
        total_documents: totalDocuments,
        total_tokens: totalTokens,
      });
      setHasInitialLoad(true); // 標記初始載入完成
    } catch (error) {
      console.error('💥 載入AI助手列表失敗:', error);
      const errorMessage = error instanceof Error ? error.message : '網路錯誤';
      showError('載入AI助手列表失敗：' + errorMessage);
      setAssistants([]);
      setStatistics({
        total_assistants: 0,
        active_assistants: 0,
        total_documents: 0,
        total_tokens: 0,
      });
      setHasInitialLoad(true); // 即使失敗也標記為已嘗試載入
    } finally {
      console.log('🏁 載入完成，設置 isLoading = false');
      console.log('🔍 當前狀態檢查 - assistants:', assistants.length, 'statistics:', statistics);
      
      // 強制狀態更新，使用函數式更新確保狀態正確
      setIsLoading(() => {
        console.log('🔄 強制更新 isLoading 為 false');
        return false;
      });
      
      console.log('✅ isLoading 已設置為 false');
    }
  };

    // 載入統計數據（從助理列表計算）
    const loadStatistics = async () => {
      // 統計數據現在在loadAssistants中計算
      // 這裡保留為將來使用API做準備
    };

    // 刪除AI助手
    const handleDeleteAssistant = async (assistantId: number) => {
      if (!confirm('確定要刪除此AI助手嗎？此操作無法復原。')) {
        return;
      }

      try {
        const response = await deleteAIAssistant(assistantId);
        if (response.success) {
          showSuccess('AI助手刪除成功');
          // 直接更新本地狀態，避免重新呼叫API
          setAssistants(prevAssistants => {
            const filtered = prevAssistants.filter(a => a.id !== assistantId);
            // 同時更新統計數據
            const totalAssistants = filtered.length;
            const activeAssistants = filtered.filter(a => a.is_active).length;
            const totalDocuments = filtered.reduce((sum, a) => sum + (a.document_count || 0), 0);
            const totalTokens = filtered.reduce((sum, a) => sum + (a.total_tokens_used || 0), 0);
            
            setStatistics({
              total_assistants: totalAssistants,
              active_assistants: activeAssistants,
              total_documents: totalDocuments,
              total_tokens: totalTokens,
            });
            
            return filtered;
          });
        } else {
          showError(response.message || '刪除失敗');
        }
      } catch (error) {
        console.error('刪除AI助手失敗:', error);
        showError('刪除AI助手失敗');
      }
    };

    // 建立向量化
    const handleCreateVectorStore = async (assistantId: number) => {
      // 防止重複點擊
      if (vectorizingAssistants.has(assistantId)) {
        return;
      }
      
      try {
        // 設置載入狀態
        setVectorizingAssistants(prev => new Set(prev).add(assistantId));
        
        const response = await createVectorStore(assistantId);
        if (response.success) {
          showSuccess('向量化建立成功');
          // 直接更新本地狀態，避免重新呼叫API
          setAssistants(prevAssistants => 
            prevAssistants.map(assistant => 
              assistant.id === assistantId 
                ? { ...assistant, vectorized_at: new Date().toISOString() }
                : assistant
            )
          );
        } else {
          showError(response.message || '向量化建立失敗');
        }
      } catch (error) {
        console.error('建立向量化失敗:', error);
        showError('建立向量化失敗');
      } finally {
        // 清除載入狀態
        setVectorizingAssistants(prev => {
          const newSet = new Set(prev);
          newSet.delete(assistantId);
          return newSet;
        });
      }
    };

    // 開啟對話測試
    const handleOpenChat = (assistant: AIAssistant) => {
      setCurrentAssistant(assistant);
      setIsChatOpen(true);
      setChatMessage('');
      
      // 添加歡迎消息
      const welcomeMessage = {
        id: `welcome-${Date.now()}`,
        role: 'assistant' as const,
        content: `您好！我是 ${assistant.name}，很高興為您服務。請問有什麼可以幫助您的嗎？`,
        timestamp: new Date()
      };
      setChatHistory([welcomeMessage]);
    };

    // 關閉對話測試
    const handleCloseChat = () => {
      setIsChatOpen(false);
      setCurrentAssistant(null);
      setChatMessage('');
      setChatHistory([]); // 清空对话历史
    };

    // 發送對話消息
    const handleSendChatMessage = async () => {
      if (!currentAssistant || !chatMessage.trim()) return;

      const userMessage = chatMessage.trim();
      
      // 添加用戶消息到對話歷史
      const newUserMessage = {
        id: `user-${Date.now()}`,
        role: 'user' as const,
        content: userMessage,
        timestamp: new Date()
      };
      
      setChatHistory(prev => [...prev, newUserMessage]);
      setChatMessage(''); // 清空輸入框

      try {
        setIsChatLoading(true);
        
        // 準備對話上下文 - 獲取最後10條對話記錄
        const conversationContext = chatHistory
          .slice(-10) // 取最後10條
          .map(msg => ({
            role: msg.role,
            content: msg.content
          }));
        
        const response = await sendChatMessage({
          query: userMessage,
          assistant_pk: currentAssistant.id,
          conversation_context: conversationContext // 添加對話上下文
        });

        if (response.success && response.data.success) {
          // 添加AI回覆到對話歷史
          const newAIMessage = {
            id: `ai-${Date.now()}`,
            role: 'assistant' as const,
            content: response.data.response,
            timestamp: new Date()
          };
          
          setChatHistory(prev => [...prev, newAIMessage]);
        } else {
          showError(response.message || '對話失敗');
          // 如果失敗，添加錯誤消息
          const errorMessage = {
            id: `error-${Date.now()}`,
            role: 'assistant' as const,
            content: '抱歉，我遇到了一些問題，請稍後再試。',
            timestamp: new Date()
          };
          setChatHistory(prev => [...prev, errorMessage]);
        }
      } catch (error) {
        console.error('發送對話消息失敗:', error);
        showError('發送對話消息失敗');
        // 添加錯誤消息
        const errorMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant' as const,
          content: '抱歉，網路連線出現問題，請檢查網路後重試。',
          timestamp: new Date()
        };
        setChatHistory(prev => [...prev, errorMessage]);
      } finally {
        setIsChatLoading(false);
      }
    };

  useEffect(() => {
    // 防止重複調用
    if (hasInitialized.current) {
      return;
    }
    hasInitialized.current = true;
    
    // 只在組件掛載時載入一次數據
    console.log('🔄 組件掛載，開始載入數據');
    loadAssistants(true); // 使用強制重新載入
  }, []);

  // 搜尋功能優化：使用防抖，避免頻繁API呼叫
  useEffect(() => {
    console.log('🔍 搜尋詞變化:', searchTerm, 'hasInitialLoad:', hasInitialLoad);
    
    // 如果還沒有初始載入，不要觸發搜尋
    if (!hasInitialLoad) {
      console.log('⏳ 等待初始載入完成');
      return;
    }
    
    // 如果搜尋詞為空，不需要重新載入（已經在初始載入時載入了）
    if (searchTerm === '') {
      console.log('📝 搜尋詞為空，不需要重新載入');
      return;
    }
    
    // 使用防抖，避免每次輸入都呼叫API
    const timer = setTimeout(() => {
      console.log('⏰ 防抖延遲結束，開始搜尋:', searchTerm);
      loadAssistants(true); // 使用強制重新載入
    }, 800); // 增加延遲時間，減少API呼叫頻率
    
    return () => {
      console.log('🧹 清理搜尋定時器');
      clearTimeout(timer);
    };
  }, [searchTerm, hasInitialLoad]);

     const renderAssistantCard = (assistant: AIAssistant) => (
     <div key={assistant.id} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
       {/* 頂部標題和快捷按鈕區域 */}
       <div className="flex items-start justify-between mb-4">
         {/* 左側標題和狀態 */}
         <div className="flex items-center space-x-3">
           <div className={`relative w-12 h-12 ${AI_COLORS.bg} rounded-full flex items-center justify-center flex-shrink-0`}>
             {assistant.avatar_url ? (
               <img src={assistant.avatar_url} alt={assistant.name} className="w-full h-full object-cover rounded-full" />
             ) : (
               <Bot size={24} className={AI_COLORS.text} />
             )}
             {/* 平台圖標 - 放在頭像左下角 */}
             {assistant.source_platform && (
               <div className="absolute -bottom-1 -left-1">
                 <PlatformIcon sourcePlatform={assistant.source_platform} size="sm" />
               </div>
             )}
           </div>
           <div className="flex-1">
             <div className="flex items-center space-x-2 mb-1">
               <h4 className="text-lg font-semibold text-gray-900">{assistant.name}</h4>
               <span className={`px-2 py-1 text-xs rounded-full ${
                 assistant.is_active 
                   ? 'bg-green-100 text-green-800' 
                   : 'bg-red-100 text-red-800'
               }`}>
                 {assistant.is_active ? '啟用' : '停用'}
               </span>
               {assistant.is_public && (
                 <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                   公開
                 </span>
               )}
             </div>
             <p className="text-gray-600 text-sm">{assistant.description}</p>
           </div>
         </div>
         
         {/* 右側快捷按鈕 - 限制在頂部區域 */}
         <div className="flex items-center space-x-3 flex-shrink-0">
           {/* 對話測試按鈕 - 只有已向量化的助理才顯示 */}
           {assistant.vectorized_at && (
             <button 
               onClick={() => handleOpenChat(assistant)}
               className="p-2.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
               title="對話測試"
             >
               <MessageCircle size={18} />
             </button>
           )}
           <button 
             onClick={() => handleCreateVectorStore(assistant.id)}
             disabled={vectorizingAssistants.has(assistant.id)}
             className={`p-2.5 rounded-lg transition-colors ${
               vectorizingAssistants.has(assistant.id)
                 ? 'text-blue-400 bg-blue-50 cursor-not-allowed'
                 : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
             }`}
             title={vectorizingAssistants.has(assistant.id) ? '向量化建立中...' : '建立向量化'}
           >
             {vectorizingAssistants.has(assistant.id) ? (
               <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
             ) : (
               <Database size={18} />
             )}
           </button>
           <button 
             onClick={() => navigate(`/provider/ai-service/assistants/edit/${assistant.id}`)}
             className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
           >
             <Edit size={18} />
           </button>
           <button 
             onClick={() => handleDeleteAssistant(assistant.id)}
             className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
           >
             <Trash2 size={18} />
           </button>
         </div>
       </div>
       
       {/* 主要內容區域 - 不受右側按鈕影響 */}
       <div className="w-full">
         {/* 主要信息網格 - 使用更寬的佈局，充分利用空間 */}
         <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3 text-sm mb-6">
           <div className="bg-gray-50 p-2.5 rounded-lg">
             <span className="text-gray-500 block text-xs mb-1">模型</span>
             <span className="font-medium text-gray-900 text-sm">Model {assistant.text_model_id}</span>
           </div>
           <div className="bg-gray-50 p-2.5 rounded-lg">
             <span className="text-gray-500 block text-xs mb-1">創意度</span>
             <span className="font-medium text-gray-900 text-sm">{assistant.temperature}</span>
           </div>
           <div className="bg-gray-50 p-2.5 rounded-lg">
             <span className="text-gray-500 block text-xs mb-1">對話數</span>
             <span className="font-medium text-gray-900 text-sm">{assistant.total_conversations}</span>
           </div>
           <div className="bg-gray-50 p-2.5 rounded-lg">
             <span className="text-gray-500 block text-xs mb-1">Token使用</span>
             <span className="font-medium text-gray-900 text-sm">{assistant.total_tokens_used.toLocaleString()}</span>
           </div>
           <div className="bg-gray-50 p-2.5 rounded-lg">
             <span className="text-gray-500 block text-xs mb-1">創建時間</span>
             <span className="font-medium text-gray-900 text-sm">{new Date(assistant.created_at).toLocaleDateString('zh-TW')}</span>
           </div>
           <div className="bg-gray-50 p-2.5 rounded-lg">
             <span className="text-gray-500 block text-xs mb-1">更新時間</span>
             <span className="font-medium text-gray-900 text-sm">{new Date(assistant.updated_at).toLocaleDateString('zh-TW')}</span>
           </div>
         </div>
         
         {/* 向量化狀態和檔案列表 - 調整為2列布局 */}
         <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
           {/* 向量化狀態 */}
           <div className="bg-gray-50 p-3 rounded-lg">
             <div className="flex items-center justify-between mb-2">
               <h5 className="text-sm font-medium text-gray-900 flex items-center">
                 <Database size={16} className="mr-2" />
                 向量化狀態
               </h5>
               <span className={`px-2 py-1 text-xs rounded-full ${
                 assistant.vectorized_at 
                   ? 'bg-green-100 text-green-800' 
                   : vectorizingAssistants.has(assistant.id)
                   ? 'bg-blue-100 text-blue-800'
                   : 'bg-gray-100 text-gray-600'
               }`}>
                 {assistant.vectorized_at 
                   ? '已向量化' 
                   : vectorizingAssistants.has(assistant.id)
                   ? '向量化中'
                   : '尚未向量化'
                 }
               </span>
             </div>
             <div className="text-sm text-gray-600">
               {assistant.vectorized_at ? (
                 <span>{new Date(assistant.vectorized_at).toLocaleString('zh-TW')}</span>
               ) : vectorizingAssistants.has(assistant.id) ? (
                 <span className="text-blue-600">向量化建立中，請稍候...</span>
               ) : (
                 <span>點擊右側向量化按鈕開始建立向量化</span>
               )}
             </div>
           </div>

           {/* 檔案列表 */}
           <div className="bg-gray-50 p-3 rounded-lg">
             <div className="flex items-center justify-between mb-2">
               <h5 className="text-sm font-medium text-gray-900 flex items-center">
                 <FolderOpen size={16} className="mr-2" />
                 關聯檔案 ({assistant.document_count})
               </h5>
               <button
                 onClick={() => navigate(`/provider/ai-service/assistants/${assistant.id}/documents/create`)}
                 className={`flex items-center px-3 py-1 text-sm ${AI_COLORS.button} rounded-lg transition-colors`}
               >
                 <Plus size={14} className="mr-1" />
                 新增檔案
               </button>
             </div>
             
             {assistant.document_count > 0 ? (
               <div className="text-center py-2">
                 <button 
                   onClick={() => navigate(`/provider/ai-service/assistants/${assistant.id}/documents`, {
                     state: { assistantData: assistant }
                   })}
                   className={`text-sm ${AI_COLORS.text} hover:${AI_COLORS.textDark}`}
                 >
                   查看 {assistant.document_count} 個檔案
                 </button>
               </div>
             ) : (
               <div className="text-center py-2 text-gray-500">
                 <FileText size={20} className="mx-auto mb-1 text-gray-300" />
                 <p className="text-xs">尚未建立任何檔案</p>
               </div>
             )}
           </div>
           

         </div>
       </div>
     </div>
   );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full mx-auto px-8 py-8">
        {/* 頂部數量顯示 */}
        {typeof featureFlag?.ai_assistant_count !== 'undefined' && !isLoading && (
          <div className="mb-4 text-right">
            <span className="text-sm text-gray-500">
              已使用：{assistants.length} / {Number(featureFlag?.ai_assistant_count || 0)}
            </span>
          </div>
        )}
        
        {/* AI助手列表 */}
        <div className="space-y-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className={`animate-spin rounded-full h-10 w-10 border-b-2 ${AI_COLORS.border}`}></div>
              <span className="ml-3 text-gray-600 text-lg">載入中...</span>
            </div>
          ) : assistants.length > 0 ? (
            <div className="grid gap-8 max-w-none">
              {assistants.map(renderAssistantCard)}
            </div>
          ) : (
            <div className="text-center py-16">
              <Bot size={64} className="mx-auto mb-6 text-gray-300" />
              <h3 className="text-xl font-medium text-gray-900 mb-3">尚未建立AI助手</h3>
              <p className="text-gray-600 mb-6 text-lg">開始建立您的第一個AI助手來提供智能客服服務</p>
              <button
                onClick={() => navigate('/provider/ai-service/assistants/create')}
                disabled={assistants.length >= Number(featureFlag?.ai_assistant_count || 0)}
                className={`flex items-center mx-auto px-6 py-3 rounded-lg transition-colors text-lg ${
                  assistants.length >= Number(featureFlag?.ai_assistant_count || 0)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : `${AI_COLORS.button}`
                }`}
                title={
                  assistants.length >= Number(featureFlag?.ai_assistant_count || 0)
                    ? `已達上限 (${assistants.length}/${featureFlag?.ai_assistant_count})`
                    : '建立第一個AI助手'
                }
              >
                <Plus size={18} className="mr-2" />
                建立第一個AI助手
              </button>
            </div>
          )}
          
          {/* 新增AI助手按鈕 - 移動到下方 */}
          {assistants.length > 0 && (
            <div className="text-center pt-8">
              <button
                onClick={() => navigate('/provider/ai-service/assistants/create')}
                disabled={assistants.length >= Number(featureFlag?.ai_assistant_count || 0)}
                className={`flex items-center mx-auto px-6 py-3 rounded-lg transition-colors text-lg ${
                  assistants.length >= Number(featureFlag?.ai_assistant_count || 0)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : `${AI_COLORS.button}`
                }`}
                title={
                  assistants.length >= Number(featureFlag?.ai_assistant_count || 0)
                    ? `已達上限 (${assistants.length}/${featureFlag?.ai_assistant_count})`
                    : '新增AI助手'
                }
              >
                <Plus size={18} className="mr-2" />
                新增AI助手
              </button>
            </div>
          )}
        </div>

        {/* 統計資訊 */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className={`w-10 h-10 ${AI_COLORS.bg} rounded-full flex items-center justify-center mr-4`}>
                <Bot size={18} className={AI_COLORS.text} />
              </div>
              <div>
                <p className="text-sm text-gray-500">總助手數</p>
                <p className="text-xl font-semibold text-gray-900">{statistics.total_assistants}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                <FileText size={18} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">總檔案數</p>
                <p className="text-xl font-semibold text-gray-900">
                  {statistics.total_documents}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className={`w-10 h-10 ${AI_COLORS.bg} rounded-full flex items-center justify-center mr-4`}>
                <Bot size={18} className={AI_COLORS.text} />
              </div>
              <div>
                <p className="text-sm text-gray-500">啟用助手</p>
                <p className="text-xl font-semibold text-gray-900">
                  {statistics.active_assistants}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-4">
                <FileText size={18} className="text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">總Token使用</p>
                <p className="text-xl font-semibold text-gray-900">
                  {statistics.total_tokens.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 對話測試窗口 */}
      {isChatOpen && currentAssistant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
            {/* 對話窗口標題 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 ${AI_COLORS.bg} rounded-full flex items-center justify-center`}>
                  {currentAssistant.avatar_url ? (
                    <img src={currentAssistant.avatar_url} alt={currentAssistant.name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <Bot size={16} className={AI_COLORS.text} />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">與 {currentAssistant.name} 對話測試</h3>
                  <p className="text-sm text-gray-500">
                    向量化時間：{currentAssistant.vectorized_at ? new Date(currentAssistant.vectorized_at).toLocaleString('zh-TW') : '未向量化'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-xs text-gray-500">
                  對話數：{chatHistory.length}
                </div>
                <button
                  onClick={() => setChatHistory([])}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                  title="清空對話歷史"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={handleCloseChat}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

                          {/* 對話內容區域 */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {/* 對話歷史 */}
                {chatHistory.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-500">
                      <Bot size={48} className="mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">開始與AI助手對話吧！</p>
                    </div>
                  </div>
                ) : (
                  chatHistory.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.role === 'user' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        {msg.role === 'assistant' && (
                          <div className="flex items-center gap-1 mb-1">
                            <Bot size={12} className={AI_COLORS.text} />
                            <span className="text-xs text-purple-600 font-medium">AI</span>
                          </div>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <p className={`text-xs mt-1 ${
                          msg.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {new Date(msg.timestamp).toLocaleTimeString('zh-TW')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                
                {/* 載入中指示器 */}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-900 rounded-lg px-4 py-2">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                        <span className="text-sm">AI正在思考中...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            {/* 輸入區域 */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendChatMessage()}
                  placeholder="輸入您的問題... (按 Enter 發送)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isChatLoading}
                />
                <button
                  onClick={handleSendChatMessage}
                  disabled={!chatMessage.trim() || isChatLoading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  title="發送消息"
                >
                  <Send size={16} />
                </button>
              </div>
              <div className="mt-2 text-xs text-gray-500 text-center">
                支援多輪對話，AI會記住對話上下文
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIServiceManagement; 