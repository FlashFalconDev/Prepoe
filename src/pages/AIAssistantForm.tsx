import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Upload, Bot, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AI_COLORS } from '../constants/colors';
import { 
  createAIAssistant, 
  updateAIAssistant, 
  getAIAssistantDetail,
  getTextModelList,
  type AIAssistantCreateData,
  type AIAssistantUpdateData,
  type TextModel
} from '../config/api';
import { useToast } from '../hooks/useToast';

interface AIAssistantFormData {
  name: string;
  description: string;
  system_prompt: string;
  text_model_id: number;
  temperature: number;
  max_tokens: number;
  is_active: boolean;
  is_public: boolean;
}

const AIAssistantForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showError, showSuccess } = useToast();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState<AIAssistantFormData>({
    name: '',
    description: '',
    system_prompt: '',
    text_model_id: 0,
    temperature: 0.7,
    max_tokens: 2000,
    is_active: true,
    is_public: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [modelTypes, setModelTypes] = useState<TextModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);

  useEffect(() => {
    // 載入模型列表
    loadModelList();
    
    if (isEditing) {
      // 載入現有數據
      loadAssistantData();
    }
  }, [isEditing]);

  const loadModelList = async () => {
    try {
      setModelsLoading(true);
      const response = await getTextModelList();
      if (response.success) {
        setModelTypes(response.data);
        // 如果沒有選中的模型，選擇第一個模型
        if (formData.text_model_id === 0 && response.data.length > 0) {
          setFormData(prev => ({
            ...prev,
            text_model_id: response.data[0].id
          }));
        }
        // 如果是編輯模式，檢查當前選中的模型是否仍然有效
        else if (isEditing && formData.text_model_id > 0) {
          const isValidModel = response.data.some(model => model.id === formData.text_model_id);
          if (!isValidModel && response.data.length > 0) {
            setFormData(prev => ({
              ...prev,
              text_model_id: response.data[0].id
            }));
          }
        }
      } else {
        showError('載入模型列表失敗');
      }
    } catch (error) {
      console.error('載入模型列表失敗:', error);
      showError('載入模型列表失敗');
    } finally {
      setModelsLoading(false);
    }
  };

  const loadAssistantData = async () => {
    try {
      const response = await getAIAssistantDetail(parseInt(id!));
      if (response.success) {
        const assistant = response.data;
        setFormData({
          name: assistant.name,
          description: assistant.description,
          system_prompt: assistant.system_prompt,
          text_model_id: assistant.text_model_id || 0,
          temperature: assistant.temperature,
          max_tokens: assistant.max_tokens,
          is_active: assistant.is_active,
          is_public: assistant.is_public,
        });

      } else {
        showError('載入AI助理數據失敗');
      }
    } catch (error) {
      console.error('載入AI助理數據失敗:', error);
      showError('載入AI助理數據失敗');
    }
  };

  const handleInputChange = (field: keyof AIAssistantFormData, value: any) => {
    console.log(`Field changed: ${field}, value:`, value, 'type:', typeof value);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 檢查是否已選擇模型
      if (formData.text_model_id === 0 || !formData.text_model_id) {
        showError('請選擇一個模型');
        setIsLoading(false);
        return;
      }

      // 檢查選中的模型是否在可用模型列表中
      const isValidModel = modelTypes.some(model => model.id === formData.text_model_id);
      if (!isValidModel) {
        showError('選擇的模型無效，請重新選擇');
        setIsLoading(false);
        return;
      }

      if (isEditing) {
        const updateData: AIAssistantUpdateData = {
          name: formData.name,
          description: formData.description,
          system_prompt: formData.system_prompt,
          text_model_id: formData.text_model_id,
          temperature: formData.temperature,
          max_tokens: formData.max_tokens,
          is_active: formData.is_active,
          is_public: formData.is_public,
        };
        
        console.log('Updating AI Assistant with data:', updateData);
        console.log('text_model_id:', updateData.text_model_id, 'type:', typeof updateData.text_model_id);
        
        const response = await updateAIAssistant(parseInt(id!), updateData);
        if (response.success) {
          showSuccess('AI助理更新成功');
          navigate('/provider/ai-service');
        } else {
          showError(response.message || '更新失敗');
        }
      } else {
        const createData: AIAssistantCreateData = {
          name: formData.name,
          description: formData.description,
          system_prompt: formData.system_prompt,
          text_model_id: formData.text_model_id,
          temperature: formData.temperature,
          max_tokens: formData.max_tokens,
          is_active: formData.is_active,
          is_public: formData.is_public,
        };
        
        const response = await createAIAssistant(createData);
        if (response.success) {
          showSuccess('AI助理建立成功');
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
                <h1 className="text-3xl font-bold text-gray-900">
                  {isEditing ? '編輯AI助理' : '新增AI助理'}
                </h1>
                <p className="text-gray-600">
                  {isEditing ? '修改AI助理的設定和行為' : '建立新的AI助理來協助客戶服務'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 基本資訊 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">基本資訊</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 助理名稱 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  助理名稱 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="例如：客服小助手"
                  required
                />
              </div>

              {/* 模型類型 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  模型類型 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.text_model_id}
                  onChange={(e) => handleInputChange('text_model_id', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                  disabled={modelsLoading}
                >
                  {modelsLoading ? (
                    <option value="">載入模型中...</option>
                  ) : (
                    modelTypes.map(model => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* 助理描述 */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  助理描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="描述這個AI助理的功能和用途"
                />
              </div>
            </div>
          </div>

          {/* AI設定 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">AI設定</h2>

            <div className="space-y-4">
              {/* 系統提示詞 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  系統提示詞 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.system_prompt}
                  onChange={(e) => handleInputChange('system_prompt', e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="你是E神,喜歡用文言文回話"
                  required
                />
                <p className="mt-2 text-sm text-gray-500">
                  系統提示詞決定了AI助理的角色定位和回答風格，請詳細描述您希望AI助理如何表現。
                </p>
              </div>
            </div>
          </div>

          {/* 狀態設定 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">狀態設定</h2>
            
            <div className="space-y-4">
              {/* 是否啟用 */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">啟用助理</h3>
                  <p className="text-sm text-gray-500">啟用後，助理可以開始處理對話</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => handleInputChange('is_active', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-ai-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ai-500"></div>
                </label>
              </div>

              {/* 是否公開 */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">公開助理</h3>
                  <p className="text-sm text-gray-500">公開的助理可以被其他用戶使用</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_public}
                    onChange={(e) => handleInputChange('is_public', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-ai-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ai-500"></div>
                </label>
              </div>
            </div>
          </div>

          {/* 操作按鈕 */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/provider/ai-service')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isLoading}
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
                  {isEditing ? '更新助理' : '建立助理'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AIAssistantForm; 