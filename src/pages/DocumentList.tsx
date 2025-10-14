import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { AI_COLORS } from '../constants/colors';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Trash2, 
  Eye,
  Bot,
  Settings
} from 'lucide-react';
import { 
  getAIAssistantDocuments, 
  deleteAIAssistantDocument,
  getAIAssistantDetail,
  type AIAssistantDocument 
} from '../config/api';
import { useToast } from '../hooks/useToast';

const DocumentList: React.FC = () => {
  const navigate = useNavigate();
  const { assistantId } = useParams<{ assistantId: string }>();
  const location = useLocation();
  const { showError, showSuccess } = useToast();
  
  // 從URL state獲取預載的助理數據
  const preloadedAssistantData = location.state?.assistantData;

  const [documents, setDocuments] = useState<AIAssistantDocument[]>([]);
  const [assistantName, setAssistantName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const response = await getAIAssistantDocuments(parseInt(assistantId!), 1, 50, searchTerm);
      
      // 檢查響應格式
      let documentsData = [];
      if (Array.isArray(response)) {
        documentsData = response;
      } else if (response.success && response.data && response.data.documents) {
        documentsData = response.data.documents;
      } else {
        console.error('未知的響應格式:', response);
        showError('載入文檔列表失敗');
        setDocuments([]);
        return;
      }
      
      setDocuments(documentsData);
    } catch (error) {
      console.error('載入文檔列表失敗:', error);
      showError('載入文檔列表失敗');
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAssistantData = async () => {
    try {
      if (preloadedAssistantData) {
        setAssistantName(preloadedAssistantData.name);
      } else {
        const response = await getAIAssistantDetail(parseInt(assistantId!));
        if (response.success) {
          setAssistantName(response.data.name);
        }
      }
    } catch (error) {
      console.error('載入AI助理數據失敗:', error);
    }
  };

  const handleDeleteDocument = async (documentId: number) => {
    if (!confirm('確定要刪除此檔案嗎？此操作無法復原。')) {
      return;
    }

    try {
      const response = await deleteAIAssistantDocument(parseInt(assistantId!), documentId);
      if (response.success) {
        showSuccess('檔案刪除成功');
        loadDocuments();
      } else {
        showError(response.message || '刪除失敗');
      }
    } catch (error) {
      console.error('刪除檔案失敗:', error);
      showError('刪除檔案失敗');
    }
  };

  useEffect(() => {
    loadAssistantData();
    loadDocuments();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDocuments();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const renderDocumentCard = (document: AIAssistantDocument) => (
    <div key={document.id} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <FileText size={24} className="text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h4 className="text-lg font-semibold text-gray-900">{document.title}</h4>
              <span className={`px-2 py-1 text-xs rounded-full ${
                document.is_active 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {document.is_active ? '啟用' : '停用'}
              </span>
              <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                {document.file_type.toUpperCase()}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <span className="text-gray-500">優先級：</span>
                <span className="font-medium">{document.priority}</span>
              </div>
              <div>
                <span className="text-gray-500">使用次數：</span>
                <span className="font-medium">{document.usage_count}</span>
              </div>
            </div>



            <div className="text-xs text-gray-500">
              建立時間：{new Date(document.created_at).toLocaleString('zh-TW')}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => handleDeleteDocument(document.id)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/provider/ai-service')}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft size={20} className="mr-2" />
                返回
              </button>
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Bot size={24} className={AI_COLORS.text} />
                  <span className="text-sm text-gray-600">AI助理：{assistantName}</span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900">檔案列表</h1>
                <p className="text-gray-600">查看和管理AI助理的知識檔案</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(`/provider/ai-service/assistants/${assistantId}/documents/create`, {
                  state: { assistantData: preloadedAssistantData }
                })}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${AI_COLORS.button}`}
              >
                <Plus size={16} className="mr-2" />
                新增檔案
              </button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="搜尋檔案..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* 檔案列表 */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">檔案列表</h2>
            <span className="text-sm text-gray-500">{documents.length} 個檔案</span>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${AI_COLORS.border} mx-auto`}></div>
              <p className="mt-4 text-gray-600">載入中...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">尚無檔案</h3>
              <p className="text-gray-600 mb-6">為AI助理新增知識檔案以提升回答品質</p>
              <button
                onClick={() => navigate(`/provider/ai-service/assistants/${assistantId}/documents/create`, {
                  state: { assistantData: preloadedAssistantData }
                })}
                className={`flex items-center mx-auto px-4 py-2 rounded-lg transition-colors ${AI_COLORS.button}`}
              >
                <Plus size={16} className="mr-2" />
                新增第一個檔案
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map(renderDocumentCard)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentList; 