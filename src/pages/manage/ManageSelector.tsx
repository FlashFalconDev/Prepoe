import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ArrowRight, Ticket } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { api, API_ENDPOINTS } from '../../config/api';
import { AI_COLORS } from '../../constants/colors';

// LINE客戶介面（參考 PrivateDomain.tsx 的結構）
interface ManagedClient {
  managed_client_id: number;
  managed_client_sid: string;
  managed_client_name: string;
  logo_url: string | null;
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

const ManageSelector: React.FC = () => {
  const navigate = useNavigate();
  const { showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<ManagedClient[]>([]);

  // 載入管理的客戶列表
  const loadManagedClients = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.LINE_MANAGED_CONTENT);

      if (response.data.success) {
        const data = response.data.data;
        // 顯示所有管理的客戶
        setClients(data.managed_clients);
      }
    } catch (error: any) {
      console.error('載入客戶列表失敗:', error);
      showError(error.response?.data?.message || '載入客戶列表失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadManagedClients();
  }, []);

  // 選擇客戶並導向管理頁面
  const handleSelectClient = (client: ManagedClient) => {
    // 將選擇的客戶資訊儲存到 sessionStorage
    sessionStorage.setItem('selected_manage_client', JSON.stringify({
      managed_client_id: client.managed_client_id,
      managed_client_sid: client.managed_client_sid,
      managed_client_name: client.managed_client_name,
      company_name: client.company_info.co_name,
    }));

    // 導向管理儀表板頁面
    navigate(`/manage/${client.managed_client_sid}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">管理系統</h1>
          <p className="text-gray-600">選擇要管理的公司或品牌</p>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : clients.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Ticket className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">尚無可管理的電子票券</h3>
            <p className="text-gray-600">請聯繫管理員開通電子票券模組</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((client) => (
              <div
                key={client.managed_client_id}
                className="bg-white rounded-xl shadow hover:shadow-lg transition-all duration-300 p-6 cursor-pointer border-2 border-transparent hover:border-purple-500"
                onClick={() => handleSelectClient(client)}
              >
                {/* Logo 或圖標 */}
                <div className="flex items-center justify-center mb-4">
                  {client.logo_url ? (
                    <img
                      src={client.logo_url}
                      alt={client.managed_client_name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Building2 className="text-purple-600" size={32} />
                    </div>
                  )}
                </div>

                {/* 公司資訊 */}
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {client.company_info.co_name}
                  </h3>
                  <p className="text-sm text-gray-600">{client.managed_client_name}</p>
                </div>

                {/* 角色標籤 */}
                <div className="flex items-center justify-center mb-4">
                  <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                    {client.role_display}
                  </span>
                </div>

                {/* 進入按鈕 */}
                <button className={`w-full flex items-center justify-center gap-2 ${AI_COLORS.button} py-2 rounded-lg text-white font-medium transition-colors`}>
                  進入設定
                  <ArrowRight size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageSelector;
