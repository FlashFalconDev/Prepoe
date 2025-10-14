import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Upload, FileText, X, Download, Bot } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AI_COLORS } from '../constants/colors';
import { 
  createAIAssistantDocument, 
  updateAIAssistantDocument, 
  getAIAssistantDocumentDetail,
  getAIAssistantDetail,
  type AIAssistantDocumentCreateData,
  type AIAssistantDocumentUpdateData
} from '../config/api';
import { useToast } from '../hooks/useToast';

interface DocumentFormData {
  title: string;
  file_type: string;
  source_file?: File;
}

const DocumentForm: React.FC = () => {
  const navigate = useNavigate();
  const { assistantId, id } = useParams<{ assistantId: string; id: string }>();
  const { showError, showSuccess } = useToast();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState<DocumentFormData>({
    title: '',
    file_type: 'pdf',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [assistantName, setAssistantName] = useState('');

  const fileTypes = [
    { value: 'pdf', label: 'PDF檔案 (.pdf)' },
  ];

  useEffect(() => {
    if (assistantId) {
      loadAssistantData();
    }
    if (isEditing) {
      loadDocumentData();
    }
  }, [assistantId, isEditing]);

  useEffect(() => {
    // 移除統計計算，因為不再有content字段
  }, []);

  const loadAssistantData = async () => {
    try {
      const response = await getAIAssistantDetail(parseInt(assistantId!));
      if (response.success) {
        setAssistantName(response.data.name);
      } else {
        showError('載入AI助理數據失敗');
      }
    } catch (error) {
      console.error('載入AI助理數據失敗:', error);
      showError('載入AI助理數據失敗');
    }
  };

  const loadDocumentData = async () => {
    try {
      const response = await getAIAssistantDocumentDetail(parseInt(assistantId!), parseInt(id!));
      if (response.success) {
        const document = response.data;
        setFormData({
          title: document.title,
          file_type: document.file_type,
        });
      } else {
        showError('載入檔案數據失敗');
      }
    } catch (error) {
      console.error('載入檔案數據失敗:', error);
      showError('載入檔案數據失敗');
    }
  };

  const handleInputChange = (field: keyof DocumentFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 驗證檔案格式
      const fileName = file.name.toLowerCase();
      if (!fileName.endsWith('.pdf')) {
        showError('只支援PDF檔案格式，請選擇PDF檔案');
        return;
      }
      
      // 驗證檔案類型
      if (file.type !== 'application/pdf' && !fileName.endsWith('.pdf')) {
        showError('檔案格式不正確，請選擇有效的PDF檔案');
        return;
      }
      
      setFormData(prev => ({ ...prev, source_file: file }));
      
      // 設置檔案類型為PDF
      setFormData(prev => ({ 
        ...prev, 
        file_type: 'pdf',
        title: file.name.replace(/\.pdf$/i, '') // 移除.pdf副檔名
      }));
      
      // 檔案內容由後端處理提取，前端不需要讀取
    }
  };

  const removeFile = () => {
    setFormData(prev => ({ ...prev, source_file: undefined }));
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isEditing) {
        const updateData: AIAssistantDocumentUpdateData = {
          title: formData.title,
          file_type: formData.file_type,
        };
        
        const response = await updateAIAssistantDocument(parseInt(assistantId!), parseInt(id!), updateData);
        if (response.success) {
          showSuccess('檔案更新成功');
          navigate('/provider/ai-service');
        } else {
          showError(response.message || '更新失敗');
        }
      } else {
        const createData: AIAssistantDocumentCreateData = {
          title: formData.title,
          file_type: formData.file_type,
          source_file: formData.source_file,
        };
        
        const response = await createAIAssistantDocument(parseInt(assistantId!), createData);
        if (response.success) {
          showSuccess('檔案建立成功');
          navigate('/provider/ai-service');
        } else {
          showError(response.message || '建立失敗');
        }
      }
    } catch (error) {
      console.error('提交失敗:', error);
      showError('操作失敗，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTemplate = () => {
    // 顯示PDF範本說明
    showSuccess('PDF範本說明：請準備包含以下內容的PDF檔案：\n\n1. 清晰的標題和章節結構\n2. 完整的知識內容\n3. 適當的格式和排版\n4. 檔案大小不超過10MB');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
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
                <h1 className="text-3xl font-bold text-gray-900">
                  {isEditing ? '編輯檔案' : '新增檔案'}
                </h1>
                <p className="text-gray-600">
                  {isEditing ? '修改檔案內容和設定' : '為AI助理新增知識檔案'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 檔案上傳 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">檔案上傳</h2>
            
            <div className="space-y-4">
              {/* 上傳區域 */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                {formData.source_file ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center space-x-2">
                      <FileText size={24} className="text-blue-600" />
                      <span className="font-medium text-gray-900">{formData.source_file.name}</span>
                    </div>
                    
                    {/* 檔案類型標籤 */}
                    <div className="flex justify-center">
                      <span className="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-800 font-medium">
                        PDF
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-500">
                      檔案大小：{(formData.source_file.size / 1024).toFixed(1)} KB
                    </p>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="flex items-center mx-auto px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X size={16} className="mr-2" />
                      移除檔案
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <FileText size={48} className="mx-auto text-gray-400" />
                    <div>
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <div className={`flex items-center justify-center px-6 py-3 rounded-lg transition-colors ${AI_COLORS.button}`}>
                          <Upload size={20} className="mr-2" />
                          選擇檔案
                        </div>
                      </label>
                    </div>
                    
                    {/* 支援的檔案類型標籤 */}
                    <div className="flex justify-center space-x-2">
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">PDF</span>
                    </div>
                    
                    <p className="text-sm text-gray-500">
                      僅支援PDF檔案格式，內容會自動從檔案中提取，最大 10MB
                    </p>
                  </div>
                )}
              </div>

              {/* PDF範本說明 */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="flex items-center mx-auto px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <FileText size={16} className="mr-2" />
                  PDF範本說明
                </button>
              </div>
            </div>
          </div>

          {/* 基本資訊 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">基本資訊</h2>
            
            <div className="grid grid-cols-1 gap-6">
              {/* 檔案標題 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  檔案標題 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="例如：產品使用手冊"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  檔案標題會自動從檔案名稱提取，您也可以手動修改
                </p>
              </div>
            </div>
          </div>





          {/* 處理狀態 */}
          {isProcessing && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <div>
                  <h3 className="text-sm font-medium text-blue-900">正在處理檔案</h3>
                  <p className="text-sm text-blue-700">請稍候，系統正在分析檔案內容...</p>
                </div>
              </div>
            </div>
          )}

          {/* 操作按鈕 */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/ai-service')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isLoading || isProcessing}
              className={`flex items-center px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${AI_COLORS.button}`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  儲存中...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  {isEditing ? '更新檔案' : '建立檔案'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DocumentForm; 