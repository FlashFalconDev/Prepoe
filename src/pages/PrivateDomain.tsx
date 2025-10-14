import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { AI_COLORS } from '../constants/colors';
import { API_ENDPOINTS } from '../config/api';
import RichMenuEditor from '../components/RichMenuEditor';
import { useAuth } from '../contexts/AuthContext';
import FeatureGate from '../components/FeatureGate';
import KeysManagerModal from '../components/keys/KeysManagerModal';

// CSRF Token 處理函數
const getCSRFTokenFromCookie = (): string | null => {
  // 嘗試多種可能的 cookie 名稱
  const possibleNames = ['csrftoken', 'csrf_token', 'csrf-token'];
  
  for (const name of possibleNames) {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.startsWith(name + '=')) {
        const token = decodeURIComponent(cookie.substring(name.length + 1));
        console.log(`找到CSRF token (${name}):`, token ? token.substring(0, 10) + '...' : 'null');
        return token;
      }
    }
  }
  
  console.log('未找到CSRF token');
  return null;
};

// 平台介面
interface Platform {
  id: number;
  name: string;
  description: string;
  unique_code: string;
  ai_assistant_name?: string;
}

// LINE管理內容介面
interface LineManagedContent {
  member_card_id: number;
  member_info: {
    name: string;
    email: string;
    phone: string;
  };
  total_managed_clients: number;
  managed_clients: LineClient[];
  summary: {
    total_bots: number;
    total_members: number;
    role_distribution: {
      owner: number;
      admin: number;
      supervisor: number;
    };
  };
}

// LINE客戶介面
interface LineClient {
  managed_client_id: number;
  managed_client_sid: string;
  managed_client_name: string;
  logo_url: string | null;
  sales: string;
  program: string;
  start_time: string;
  end_time: string;
  mdt: string;
  mdt_add: string;
  role: string;
  role_display: string;
  company_info: {
    id: number;
    co_sn: string;
    co_add: string;
    co_tel: string;
    co_name: string;
    co_email: string;
  };
  bots: LineBot[];
  member_count: number;
  modules: {
    MGM: boolean;
    CRM: boolean;
    Shop: boolean;
    ETicket: boolean;
    Reserve: boolean;
    ImageGeneration: boolean;
    QPOS: boolean;
    AIService: boolean;
    Sale: boolean;
  };
}

// 機器人介面
interface LineBot {
  id: number;
  bot_name: string;
  bot_bid: string;
  liffid: string;
  color_1: string;
  color_2: string;
  FF: boolean;
  MGM: boolean;
  CRM: boolean;
  Shop: boolean;
  ETicket: boolean;
  Reserve: boolean;
  liff_force_add: boolean;
  bot_token?: string;
  bot_sec?: string;
  user_count?: number; // 新增：機器人層級的人數
  platform_link?: {
    id: number;
    platform_id: string;
    platform_name: string;
  };
}

const PrivateDomain: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { checkAuth, featureFlag } = useAuth();
  
  // 狀態管理
  const [lineOAs, setLineOAs] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOA, setEditingOA] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // 新增LINE OA表單數據
  const [dataFormData, setDataFormData] = useState({
    companyName: '',
    companyUniformNumber: '',
    officeAddress: '',
    contactPhone: '',
    contactEmail: '',
    lineOAName: '',
    botBid: '',
    botToken: '',
    botSec: '',
    liffId: '',
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981',
    platformId: '' // 新增：關聯平台ID
  });
  
  // 編輯機器人相關狀態
  const [showEditBotModal, setShowEditBotModal] = useState(false);
  const [editingBot, setEditingBot] = useState<LineBot | null>(null);
  const [editingBotClient, setEditingBotClient] = useState<LineClient | null>(null);
  const [botFormData, setBotFormData] = useState({
    companyName: '',
    companyUniformNumber: '',
    officeAddress: '',
    contactPhone: '',
    contactEmail: '',
    lineOAName: '',
    botBid: '',
    botToken: '',
    botSec: '',
    liffId: '',
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981',
    platformId: '' // 新增：關聯平台ID
  });
  
  // LINE管理內容狀態
  const [managedContent, setManagedContent] = useState<LineManagedContent | null>(null);
  const [loadingManagedContent, setLoadingManagedContent] = useState(false);
  
  // 平台列表狀態
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loadingPlatforms, setLoadingPlatforms] = useState(false);
  
  // Rich Menu 編輯器狀態
  const [showRichMenuEditor, setShowRichMenuEditor] = useState(false);
  const [selectedBotForRichMenu, setSelectedBotForRichMenu] = useState<{ id: string; name: string; clientSid: string } | null>(null);

  // 擴增功能彈窗狀態
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendClient, setExtendClient] = useState<LineClient | null>(null);
  const [showKeyCreate, setShowKeyCreate] = useState(false);
  
  // 表單狀態
  const [formData, setFormData] = useState({
    name: '',
    lineId: '',
    description: '',
    tags: '',
    qrCode: ''
  });

  // 獲取平台列表
  const fetchPlatforms = async () => {
    try {
      setLoadingPlatforms(true);
      
      // 先獲取CSRF token
      let csrfToken = getCSRFTokenFromCookie();
      if (!csrfToken) {
        try {
          await fetch(API_ENDPOINTS.CSRF, {
            method: 'GET',
            credentials: 'include'
          });
          csrfToken = getCSRFTokenFromCookie();
        } catch (error) {
          console.error('獲取CSRF token失敗:', error);
        }
      }
      
      const response = await fetch(API_ENDPOINTS.CHAT_PLATFORMS_MY, {
        method: 'GET',
        headers: {
          'X-CSRFToken': csrfToken || '',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.data) {
        setPlatforms(Array.isArray(result.data) ? result.data : result.data.platforms || []);
      } else {
        setPlatforms([]);
      }
      
    } catch (error) {
      console.error('獲取平台列表失敗:', error);
      setPlatforms([]);
    } finally {
      setLoadingPlatforms(false);
    }
  };

  // 獲取LINE管理內容
  const fetchManagedContent = async () => {
    try {
      setLoadingManagedContent(true);
      
      // 先獲取CSRF token
      let csrfToken = getCSRFTokenFromCookie();
      if (!csrfToken) {
        try {
          await fetch(API_ENDPOINTS.CSRF, {
            method: 'GET',
            credentials: 'include'
          });
          csrfToken = getCSRFTokenFromCookie();
        } catch (error) {
          console.error('獲取CSRF token失敗:', error);
        }
      }
      
      const response = await fetch(API_ENDPOINTS.LINE_MANAGED_CONTENT, {
        method: 'GET',
        headers: {
          'X-CSRFToken': csrfToken || '',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setManagedContent(result.data);
      
    } catch (error) {
      console.error('獲取LINE管理內容失敗:', error);
      showError('獲取LINE管理內容失敗');
    } finally {
      setLoadingManagedContent(false);
    }
  };

  // 模擬數據
  useEffect(() => {
    const mockData: any[] = [
      {
        id: '1',
        name: 'Prepoe官方LINE',
        lineId: '@prepoe_official',
        qrCode: 'https://example.com/qr1.png',
        description: 'Prepoe官方客服與資訊發布',
        status: 'active',
        createdAt: '2024-01-15',
        memberCount: 1250,
        messageCount: 3420,
        tags: ['官方', '客服', '資訊']
      },
      {
        id: '2',
        name: '技術支援LINE',
        lineId: '@prepoe_tech',
        qrCode: 'https://example.com/qr2.png',
        description: '技術問題諮詢與支援服務',
        status: 'active',
        createdAt: '2024-01-20',
        memberCount: 890,
        messageCount: 1560,
        tags: ['技術', '支援', '諮詢']
      }
    ];
    setLineOAs(mockData);
    
    // 獲取LINE管理內容
    fetchManagedContent();
    // 獲取平台列表
    fetchPlatforms();
    
  }, [featureFlag]);

  const handleOpenCreate = () => {
    setShowCreateModal(true);
  };

  const handleCreateOA = async () => {
    if (!dataFormData.companyName || !dataFormData.lineOAName) {
      showError('請填寫必要欄位');
      return;
    }

    try {
      setLoading(true);
      
      // 先獲取CSRF token
      let csrfToken = getCSRFTokenFromCookie();
      if (!csrfToken) {
        try {
          console.log('嘗試獲取CSRF token...');
          await fetch(API_ENDPOINTS.CSRF, {
            method: 'GET',
            credentials: 'include'
          });
          csrfToken = getCSRFTokenFromCookie();
          console.log('CSRF token獲取成功:', csrfToken ? '已設置' : '未設置');
        } catch (error) {
          console.error('獲取CSRF token失敗:', error);
        }
      }
      
      // 準備API請求數據
      const apiData = {
        bot_name: dataFormData.lineOAName,
        bot_bid: dataFormData.botBid,
        bot_token: dataFormData.botToken,
        bot_sec: dataFormData.botSec,
        liffid: dataFormData.liffId,
        color_1: dataFormData.primaryColor,
        color_2: dataFormData.secondaryColor,
        co_sn: dataFormData.companyUniformNumber,
        co_add: dataFormData.officeAddress,
        co_tel: dataFormData.contactPhone,
        co_name: dataFormData.companyName,
        co_email: dataFormData.contactEmail,
        platform_id: dataFormData.platformId || null // 新增：關聯平台ID
      };

      // 發送POST請求到API
      const response = await fetch(API_ENDPOINTS.LINE_CREATE_BOT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken || '', // 使用獲取到的CSRF token
        },
        credentials: 'include', // 包含cookies
        body: JSON.stringify(apiData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // 創建本地OA對象用於UI顯示
      const newOA: any = {
        id: Date.now().toString(),
        name: dataFormData.lineOAName,
        lineId: dataFormData.botBid,
        qrCode: '', // API沒有返回QR Code，暫時留空
        description: `公司: ${dataFormData.companyName}`,
        status: 'active',
        createdAt: new Date().toISOString().split('T')[0],
        memberCount: 0,
        messageCount: 0,
        tags: ['新建立']
      };

      setLineOAs([...lineOAs, newOA]);
      setShowCreateModal(false);
      resetForm();
      showSuccess('LINE OA 新增成功！');
      
      // 重新載入 LINE OA 列表以更新計數
      fetchManagedContent();
      
    } catch (error) {
      console.error('創建LINE OA失敗:', error);
      showError('創建LINE OA失敗，請檢查網路連線或聯繫管理員');
    } finally {
      setLoading(false);
    }
  };

  const handleEditOA = () => {
    if (!editingOA || !formData.name || !formData.lineId) {
      showError('請填寫必要欄位');
      return;
    }

    const updatedOAs = lineOAs.map(oa => 
      oa.id === editingOA.id 
        ? {
            ...oa,
            name: formData.name,
            lineId: formData.lineId,
            description: formData.description,
            tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : []
          }
        : oa
    );

    setLineOAs(updatedOAs);
    setShowEditModal(false);
    setEditingOA(null);
    resetForm();
    showSuccess('LINE OA 更新成功！');
  };

  const handleDeleteOA = (id: string) => {
    if (window.confirm('確定要刪除這個LINE OA嗎？')) {
      setLineOAs(lineOAs.filter(oa => oa.id !== id));
      showSuccess('LINE OA 刪除成功！');
    }
  };

  const handleEdit = (oa: any) => {
    setEditingOA(oa);
    setFormData({
      name: oa.name,
      lineId: oa.lineId,
      description: oa.description,
      tags: oa.tags.join(', '),
      qrCode: oa.qrCode
    });
    setShowEditModal(true);
  };

    // 編輯機器人
    const handleEditBot = (bot: LineBot) => {
      console.log('編輯機器人:', bot);
      setEditingBot(bot);
      
      // 先找到對應的客戶信息
      const client = managedContent?.managed_clients.find(client => client.bots.some(b => b.id === bot.id));
      console.log('找到客戶:', client);
      setEditingBotClient(client || null);
      
      // 從bot的platform_link中獲取平台關聯信息
      const platformId = (bot as any).platform_link?.platform_id || '';
      console.log('平台ID:', platformId);
      
      const formData = {
        companyName: client?.company_info?.co_name || '',
        companyUniformNumber: client?.company_info?.co_sn || '',
        officeAddress: client?.company_info?.co_add || '',
        contactPhone: client?.company_info?.co_tel || '',
        contactEmail: client?.company_info?.co_email || '',
        lineOAName: bot.bot_name,
        botBid: bot.bot_bid,
        botToken: bot.bot_token || '',
        botSec: bot.bot_sec || '',
        liffId: bot.liffid,
        primaryColor: bot.color_1,
        secondaryColor: bot.color_2,
        platformId: platformId // 設置平台關聯ID
      };
      
      console.log('設置表單數據:', formData);
      setBotFormData(formData);
      setShowEditBotModal(true);
    };

  // 更新機器人
  const handleUpdateBot = async () => {
    if (!editingBot || !botFormData.companyName || !botFormData.lineOAName || !botFormData.botBid) {
      showError('請填寫必要欄位');
      return;
    }

    try {
      setLoading(true);
      
      // 先獲取CSRF token
      let csrfToken = getCSRFTokenFromCookie();
      if (!csrfToken) {
        try {
          await fetch(API_ENDPOINTS.CSRF, {
            method: 'GET',
            credentials: 'include'
          });
          csrfToken = getCSRFTokenFromCookie();
        } catch (error) {
          console.error('獲取CSRF token失敗:', error);
        }
      }
      
      // 準備API請求數據
      const apiData = {
        bot_name: botFormData.lineOAName,
        bot_bid: botFormData.botBid,
        bot_token: botFormData.botToken || editingBot.bot_token,
        bot_sec: botFormData.botSec || editingBot.bot_sec,
        liffid: botFormData.liffId,
        color_1: botFormData.primaryColor,
        color_2: botFormData.secondaryColor,
        co_sn: botFormData.companyUniformNumber,
        co_add: botFormData.officeAddress,
        co_tel: botFormData.contactPhone,
        co_name: botFormData.companyName,
        co_email: botFormData.contactEmail,
        platform_id: botFormData.platformId || null // 新增：關聯平台ID
      };

      // 發送PUT請求到API
      const response = await fetch(API_ENDPOINTS.LINE_UPDATE_BOT(editingBot.bot_bid), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken || '',
        },
        credentials: 'include',
        body: JSON.stringify(apiData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // 更新本地狀態
      if (managedContent) {
        const updatedContent = { ...managedContent };
        const clientIndex = updatedContent.managed_clients.findIndex(
          client => client.managed_client_id === editingBotClient?.managed_client_id
        );
        
        if (clientIndex !== -1) {
          const botIndex = updatedContent.managed_clients[clientIndex].bots.findIndex(
            bot => bot.id === editingBot.id
          );
          
          if (botIndex !== -1) {
            // 更新機器人資料
            updatedContent.managed_clients[clientIndex].bots[botIndex] = {
              ...editingBot,
              bot_name: botFormData.lineOAName,
              bot_bid: botFormData.botBid,
              bot_token: botFormData.botToken || editingBot.bot_token,
              bot_sec: botFormData.botSec || editingBot.bot_sec,
              liffid: botFormData.liffId,
              color_1: botFormData.primaryColor,
              color_2: botFormData.secondaryColor,
              // 更新平台關聯信息
              platform_link: botFormData.platformId ? {
                id: Date.now(), // 臨時ID，實際應該從後端獲取
                platform_id: botFormData.platformId,
                platform_name: platforms.find(p => p.unique_code === botFormData.platformId)?.name || '未知平台'
              } : undefined
            };
            
            // 更新公司資訊
            updatedContent.managed_clients[clientIndex].company_info = {
              ...updatedContent.managed_clients[clientIndex].company_info,
              co_name: botFormData.companyName,
              co_sn: botFormData.companyUniformNumber,
              co_add: botFormData.officeAddress,
              co_tel: botFormData.contactPhone,
              co_email: botFormData.contactEmail
            };
            
            setManagedContent(updatedContent);
          }
        }
      }
      
      setShowEditBotModal(false);
      setEditingBot(null);
      setEditingBotClient(null);
      showSuccess('機器人更新成功！');
      
      // 重新獲取數據，確保前端顯示最新的後端數據
      fetchManagedContent();
      
    } catch (error) {
      console.error('更新機器人失敗:', error);
      showError('更新機器人失敗，請檢查網路連線或聯繫管理員');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      lineId: '',
      description: '',
      tags: '',
      qrCode: ''
    });
    
    setDataFormData({
      companyName: '',
      companyUniformNumber: '',
      officeAddress: '',
      contactPhone: '',
      contactEmail: '',
      lineOAName: '',
      botBid: '',
      botToken: '',
      botSec: '',
      liffId: '',
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981',
      platformId: '' // 新增：關聯平台ID
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showSuccess('已複製到剪貼簿');
  };

  // 開啟 Rich Menu 編輯器
  const handleOpenRichMenuEditor = (bot: LineBot, client: LineClient) => {
    console.log('開啟 Rich Menu 編輯器，bot:', bot);
    console.log('對應的客戶:', client);
    console.log('使用的 managed_client_sid:', client.managed_client_sid);
    
    setSelectedBotForRichMenu({
      id: bot.bot_bid,
      name: bot.bot_name,
      clientSid: client.managed_client_sid
    });
    setShowRichMenuEditor(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '啟用中';
      case 'inactive':
        return '已停用';
      case 'pending':
        return '待審核';
      default:
        return '未知';
    }
  };

  return (
    <FeatureGate feature="community_count">
      <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 社群平台頁簽 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex items-center px-6 w-full" aria-label="Tabs">
              <div className="flex space-x-4">
                {/* LINE頁簽 - 啟用 */}
                <button className="flex items-center justify-center py-3 px-3 border-b-2 border-green-500 text-green-600 hover:bg-green-50 transition-colors">
                  <i className="ri-line-fill text-xl"></i>
                </button>
                
                {/* Facebook頁簽 - 禁用 */}
                <button className="flex items-center justify-center py-3 px-3 border-b-2 border-transparent text-gray-400 cursor-not-allowed hover:bg-gray-50 transition-colors" disabled>
                  <i className="ri-facebook-fill text-xl"></i>
                </button>
                
                {/* Instagram頁簽 - 禁用 */}
                <button className="flex items-center justify-center py-3 px-3 border-b-2 border-transparent text-gray-400 cursor-not-allowed hover:bg-gray-50 transition-colors" disabled>
                  <i className="ri-instagram-fill text-xl"></i>
                </button>
              </div>
              {typeof featureFlag?.community_count !== 'undefined' && managedContent && (
                <span className="ml-auto text-sm text-gray-500">
                  已使用：{managedContent.total_managed_clients} / {Number(featureFlag?.community_count || 0)}
                </span>
              )}
            </nav>
          </div>
          
          {/* LINE OA 內容 */}
          <div className="p-6 relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <i className="ri-line-fill text-2xl text-green-600"></i>
                <h2 className="text-lg font-semibold text-gray-900">LINE OA 管理</h2>
              </div>
              <button
                onClick={handleOpenCreate}
                disabled={!!managedContent && managedContent.total_managed_clients >= Number(featureFlag?.community_count || 0)}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  managedContent && managedContent.total_managed_clients >= Number(featureFlag?.community_count || 0)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
                title={
                  managedContent && managedContent.total_managed_clients >= Number(featureFlag?.community_count || 0)
                    ? `已達上限 (${managedContent.total_managed_clients}/${featureFlag?.community_count})`
                    : '新增LINE OA'
                }
              >
                <Plus size={16} />
                新增LINE OA
              </button>
            </div>
            
            {loadingManagedContent ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600">載入中...</p>
              </div>
            ) : managedContent ? (
              <div className="space-y-4">
                {/* LINE OA列表 */}
                {managedContent.managed_clients.map((client) => {
                  console.log('Client data:', client);
                  return (
                    <div key={client.managed_client_id} className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 break-all leading-tight" style={{ maxWidth: '16ch' }}>
                          {client.company_info?.co_name || client.managed_client_name}
                        </h3>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                          {/* 擴增功能按鈕（顯示在角色徽章前面） */}
                          <button
                            onClick={() => { setExtendClient(client); setShowExtendModal(true); }}
                            className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs rounded-full hover:bg-blue-100 transition-colors"
                          >
                            擴增功能
                          </button>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            client.role === 'owner' ? 'bg-green-100 text-green-800' :
                            client.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {client.role_display}
                          </span>
                        </div>
                      </div>
                      
                      {/* 機器人列表 */}
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {client.bots.map((bot) => (
                            <div key={bot.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <span className="font-medium text-gray-900">{bot.bot_name}</span>
                                    <span className="text-sm text-gray-500">人數: {(bot.user_count || client.member_count || 0).toLocaleString()}</span>
                                  </div>
                                  <div className="text-sm text-gray-600 space-y-1">
                                    <div>Bot basic ID: {bot.bot_bid}</div>
                                    <div>LIFF ID: {bot.liffid}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleOpenRichMenuEditor(bot, client)}
                                    className="text-gray-400 hover:text-blue-600 transition-colors"
                                    title="編輯 Rich Menu"
                                  >
                                    <Menu size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleEditBot(bot)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                    title="編輯機器人"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-3">
                                {bot.FF && <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">FF</span>}
                                {bot.MGM && <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">MGM</span>}
                                {bot.CRM && <span className={`px-2 py-1 ${AI_COLORS.bg} ${AI_COLORS.textDark} text-xs rounded`}>CRM</span>}
                                {bot.Shop && <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">Shop</span>}
                                {bot.ETicket && <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">ETicket</span>}
                                {bot.Reserve && <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded">Reserve</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center">
                <i className="ri-line-fill text-5xl text-gray-400 mx-auto mb-4"></i>
                <h3 className="text-lg font-medium text-gray-900 mb-2">無法載入LINE管理內容</h3>
                <p className="text-gray-600 mb-4">請檢查網路連線或聯繫管理員</p>
                <button
                  onClick={fetchManagedContent}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  重新載入
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 新增LINE OA模態框 */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center gap-3 mb-6">
                <i className="ri-line-fill text-2xl text-green-600"></i>
                <h3 className="text-lg font-medium text-gray-900">新增LINE OA</h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 左側：基本資訊 */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 mb-4">基本資訊</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">公司名稱 (個人可以添寫名字)</label>
                    <input
                      type="text"
                      value={dataFormData.companyName}
                      onChange={(e) => setDataFormData({ ...dataFormData, companyName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="輸入公司名稱或個人姓名"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">公司統編 (個人則免填)</label>
                    <input
                      type="text"
                      value={dataFormData.companyUniformNumber}
                      onChange={(e) => setDataFormData({ ...dataFormData, companyUniformNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="輸入公司統一編號"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">辦公地址</label>
                    <input
                      type="text"
                      value={dataFormData.officeAddress}
                      onChange={(e) => setDataFormData({ ...dataFormData, officeAddress: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="輸入辦公地址"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">聯繫電話</label>
                    <input
                      type="text"
                      value={dataFormData.contactPhone}
                      onChange={(e) => setDataFormData({ ...dataFormData, contactPhone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="輸入聯繫電話"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">聯繫email</label>
                    <input
                      type="email"
                      value={dataFormData.contactEmail}
                      onChange={(e) => setDataFormData({ ...dataFormData, contactEmail: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="輸入聯繫email"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">LINE OA名稱</label>
                    <input
                      type="text"
                      value={dataFormData.lineOAName}
                      onChange={(e) => setDataFormData({ ...dataFormData, lineOAName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="輸入LINE OA名稱"
                    />
                  </div>
                </div>
                
                {/* 右側：技術配置 */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 mb-4">技術配置</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bot basic ID</label>
                    <input
                      type="text"
                      value={dataFormData.botBid}
                      onChange={(e) => setDataFormData({ ...dataFormData, botBid: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="輸入Bot basic ID"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Channel access token</label>
                    <input
                      type="text"
                      value={dataFormData.botToken}
                      onChange={(e) => setDataFormData({ ...dataFormData, botToken: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="輸入Channel access token"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Channel secret</label>
                    <input
                      type="text"
                      value={dataFormData.botSec}
                      onChange={(e) => setDataFormData({ ...dataFormData, botSec: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="輸入Channel secret"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">LIFF ID</label>
                    <input
                      type="text"
                      value={dataFormData.liffId}
                      onChange={(e) => setDataFormData({ ...dataFormData, liffId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="輸入LIFF ID"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">主色</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={dataFormData.primaryColor}
                        onChange={(e) => setDataFormData({ ...dataFormData, primaryColor: e.target.value })}
                        className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={dataFormData.primaryColor}
                        onChange={(e) => setDataFormData({ ...dataFormData, primaryColor: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="#3B82F6"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">輔色</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={dataFormData.secondaryColor}
                        onChange={(e) => setDataFormData({ ...dataFormData, secondaryColor: e.target.value })}
                        className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={dataFormData.secondaryColor}
                        onChange={(e) => setDataFormData({ ...dataFormData, secondaryColor: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="#10B981"
                      />
                    </div>
                  </div>
                  
                  {/* 關聯客服助手的平台 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">關聯客服助手的平台</label>
                    <select
                      value={dataFormData.platformId}
                      onChange={(e) => setDataFormData({ ...dataFormData, platformId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">不關聯</option>
                      {platforms.map((platform) => (
                        <option key={platform.id} value={platform.unique_code}>
                          {platform.name} - {platform.ai_assistant_name || '未設定AI助手'}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      選擇要關聯的客服平台，可以不關聯
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateOA}
                  disabled={!dataFormData.companyName || !dataFormData.lineOAName || !dataFormData.botBid || loading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {loading ? '新增中...' : '新增LINE OA'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 編輯LINE OA 模態框 */}
        {showEditModal && editingOA && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center gap-3 mb-4">
                <i className="ri-line-fill text-xl text-green-600"></i>
                <h3 className="text-lg font-medium text-gray-900">編輯LINE OA</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">OA名稱 *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="輸入OA名稱"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">LINE ID *</label>
                  <input
                    type="text"
                    value={formData.lineId}
                    onChange={(e) => setFormData({ ...formData, lineId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="輸入LINE ID"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows={3}
                    placeholder="輸入OA描述"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">標籤</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="輸入標籤，用逗號分隔"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">QR Code 網址</label>
                  <input
                    type="url"
                    value={formData.qrCode}
                    onChange={(e) => setFormData({ ...formData, qrCode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="輸入QR Code圖片網址"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingOA(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleEditOA}
                  disabled={!formData.name || !formData.lineId}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  更新
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 編輯機器人模態框 */}
        {showEditBotModal && editingBot && editingBotClient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                  <i className="ri-line-fill text-2xl text-green-600"></i>
                  <h3 className="text-lg font-medium text-gray-900">編輯機器人</h3>
                </div>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {editingBot?.platform_link?.platform_name || '未關聯平台'}
                </span>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 左側：基本資訊 */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 mb-4">基本資訊</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">公司名稱 (個人可以添寫名字)</label>
                    <input
                      type="text"
                      value={botFormData.companyName}
                      onChange={(e) => setBotFormData({ ...botFormData, companyName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="輸入公司名稱或個人姓名"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">公司統編 (個人則免填)</label>
                    <input
                      type="text"
                      value={botFormData.companyUniformNumber}
                      onChange={(e) => setBotFormData({ ...botFormData, companyUniformNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="輸入公司統一編號"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">辦公地址</label>
                    <input
                      type="text"
                      value={botFormData.officeAddress}
                      onChange={(e) => setBotFormData({ ...botFormData, officeAddress: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="輸入辦公地址"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">聯繫電話</label>
                    <input
                      type="text"
                      value={botFormData.contactPhone}
                      onChange={(e) => setBotFormData({ ...botFormData, contactPhone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="輸入聯繫電話"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">聯繫email</label>
                    <input
                      type="email"
                      value={botFormData.contactEmail}
                      onChange={(e) => setBotFormData({ ...botFormData, contactEmail: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="輸入聯繫email"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">LINE OA名稱</label>
                    <input
                      type="text"
                      value={botFormData.lineOAName}
                      onChange={(e) => setBotFormData({ ...botFormData, lineOAName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="輸入LINE OA名稱"
                    />
                  </div>
                </div>
                
                {/* 右側：技術配置 */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 mb-4">技術配置</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bot basic ID</label>
                    <input
                      type="text"
                      value={botFormData.botBid}
                      onChange={(e) => setBotFormData({ ...botFormData, botBid: e.target.value })}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        ((editingBot?.user_count || editingBotClient?.member_count || 0) > 0) ? 'bg-gray-100 cursor-not-allowed' : ''
                      }`}
                      placeholder="輸入Bot basic ID"
                      disabled={((editingBot?.user_count || editingBotClient?.member_count || 0) > 0)}
                    />
                    {((editingBot?.user_count || editingBotClient?.member_count || 0) > 0) && (
                      <p className="text-xs text-orange-600 mt-1">
                        當人數大於0時，Bot basic ID 不可修改
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Channel access token</label>
                    <input
                      type="text"
                      value={botFormData.botToken}
                      onChange={(e) => setBotFormData({ ...botFormData, botToken: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="輸入Channel access token"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Channel secret</label>
                                          <input
                        type="text"
                        value={botFormData.botSec}
                        onChange={(e) => setBotFormData({ ...botFormData, botSec: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="輸入Channel secret"
                      />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">LIFF ID</label>
                    <input
                      type="text"
                      value={botFormData.liffId}
                      onChange={(e) => setBotFormData({ ...botFormData, liffId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="輸入LIFF ID"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">主色</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={botFormData.primaryColor}
                        onChange={(e) => setBotFormData({ ...botFormData, primaryColor: e.target.value })}
                        className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={botFormData.primaryColor}
                        onChange={(e) => setBotFormData({ ...botFormData, primaryColor: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="#3B82F6"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">輔色</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={botFormData.secondaryColor}
                        onChange={(e) => setBotFormData({ ...botFormData, secondaryColor: e.target.value })}
                        className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={botFormData.secondaryColor}
                        onChange={(e) => setBotFormData({ ...botFormData, secondaryColor: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="#10B981"
                      />
                    </div>
                  </div>
                  
                  {/* 關聯客服助手的平台 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">關聯客服助手的平台</label>
                    <select
                      value={botFormData.platformId}
                      onChange={(e) => setBotFormData({ ...botFormData, platformId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">不關聯</option>
                      {platforms.map((platform) => (
                        <option key={platform.id} value={platform.unique_code}>
                          {platform.name} - {platform.ai_assistant_name || '未設定AI助手'}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      選擇要關聯的客服平台，可以不關聯
                    </p>
                    {/* 顯示當前關聯的平台信息 */}
                    {editingBot?.platform_link && (
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs text-blue-700">
                          目前關聯平台：{editingBot.platform_link.platform_name}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditBotModal(false);
                    setEditingBot(null);
                    setEditingBotClient(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleUpdateBot}
                  disabled={!botFormData.companyName || !botFormData.lineOAName || !botFormData.botBid || loading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {loading ? '更新中...' : '更新機器人'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rich Menu 編輯器 */}
        {showRichMenuEditor && selectedBotForRichMenu && (
          <RichMenuEditor
            isOpen={showRichMenuEditor}
            onClose={() => {
              setShowRichMenuEditor(false);
              setSelectedBotForRichMenu(null);
            }}
            botId={selectedBotForRichMenu.id}
            botName={selectedBotForRichMenu.name}
            clientSid={selectedBotForRichMenu.clientSid}
          />
        )}

        {/* 擴增功能彈窗 */}
        {showExtendModal && extendClient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">擴增功能</h3>
                <button
                  onClick={() => { setShowExtendModal(false); setExtendClient(null); }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-6">{extendClient.company_info?.co_name || extendClient.managed_client_name}</p>
              <div className="grid grid-cols-1 gap-3">
                <button onClick={() => { setShowExtendModal(false); setShowKeyCreate(true); }} className="w-full py-3 px-4 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors">金鑰設定</button>
                <button disabled className="w-full py-3 px-4 border border-gray-300 rounded-lg bg-white text-gray-400 cursor-not-allowed">商城設定（即將推出）</button>
                <button disabled className="w-full py-3 px-4 border border-gray-300 rounded-lg bg-white text-gray-400 cursor-not-allowed">卡牌關聯（即將推出）</button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* 建立金鑰批次 */}
      <KeysManagerModal
        isOpen={showKeyCreate}
        onClose={() => setShowKeyCreate(false)}
        managedClientId={extendClient?.managed_client_id}
        managedClientName={extendClient?.company_info?.co_name || extendClient?.managed_client_name}
        managedClientSid={extendClient?.managed_client_sid}
        userRole={extendClient?.role}
      />
      </div>
    </FeatureGate>
  );
};

export default PrivateDomain; 