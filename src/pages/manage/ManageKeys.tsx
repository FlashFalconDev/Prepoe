import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Key, Plus, Download, Check, Link as LinkIcon } from 'lucide-react';
import KeysManagerModal from '../../components/keys/KeysManagerModal';
import { AI_COLORS } from '../../constants/colors';
import { keysListBatches, keysGetBatchDetail } from '../../config/api';
import { useToast } from '../../hooks/useToast';

interface SelectedClient {
  managed_client_id: number;
  managed_client_sid: string;
  managed_client_name: string;
  company_name: string;
}

interface KeyBatch {
  id: number;
  title: string;
  key_type: 'UNIQUE' | 'SHARED';
  statistics: {
    total_items: number;
    used_items: number;
    unused_items: number;
    total_redemptions: number;
  };
  action_json?: {
    grants?: Array<{
      type: string;
      value: number;
    }>;
  };
  status: string;
  created_at: string;
  valid_from: string;
  valid_to: string;
}

const ManageKeys: React.FC = () => {
  const { clientSid } = useParams();
  const { showError, showSuccess } = useToast();
  const [showKeyManager, setShowKeyManager] = useState(false);
  const [selectedClient, setSelectedClient] = useState<SelectedClient | null>(null);
  const [batches, setBatches] = useState<KeyBatch[]>([]);
  const [loading, setLoading] = useState(true);

  // 金鑰資訊 Modal
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyData, setKeyData] = useState<any>(null);
  const [linkType, setLinkType] = useState<'line' | 'web'>('line');
  const [webUserType, setWebUserType] = useState<'client' | 'provider'>('client');

  // 已使用金鑰 Modal
  const [showUsedKeysModal, setShowUsedKeysModal] = useState(false);
  const [usedKeysList, setUsedKeysList] = useState<any[]>([]);
  const [usedKeysTitle, setUsedKeysTitle] = useState('');

  useEffect(() => {
    // 從 sessionStorage 讀取選擇的客戶資訊
    const clientData = sessionStorage.getItem('selected_manage_client');
    if (clientData) {
      setSelectedClient(JSON.parse(clientData));
    }
  }, []);

  // 載入金鑰批次列表
  const loadBatches = async () => {
    if (!selectedClient) return;

    try {
      setLoading(true);
      const resp = await keysListBatches({
        page: 1,
        page_size: 20,
        managed_client_id: selectedClient.managed_client_id
      });

      const rows = resp?.data?.batches || resp?.batches || resp?.data?.results || resp?.results || [];
      setBatches(Array.isArray(rows) ? rows : []);
    } catch (error: any) {
      console.error('載入金鑰批次失敗:', error);
      showError(error?.message || '載入金鑰批次失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClient) {
      loadBatches();
    }
  }, [selectedClient]);

  // 複製到剪貼簿
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showSuccess(`${label}已複製到剪貼簿`);
    } catch (error) {
      showError('複製失敗');
    }
  };

  // 取得一個未使用的金鑰 - 顯示 Modal
  const handleGetUnusedKey = async (batchId: number, batchTitle: string) => {
    try {
      const result = await keysGetBatchDetail(batchId, { status: 'available' });
      if (result?.success && result?.data?.length > 0) {
        setKeyData(result.data[0]);
        setLinkType('line'); // 重置為 LINE
        setWebUserType('client'); // 重置為 client
        setShowKeyModal(true);
      } else {
        showError('無法取得金鑰資訊');
      }
    } catch (error: any) {
      console.error('取得金鑰失敗:', error);
      showError(error?.message || '取得金鑰失敗');
    }
  };

  // 下載批次資料
  const handleDownload = async (batch: KeyBatch) => {
    try {
      const detail = await keysGetBatchDetail(batch.id);
      const data = detail?.data || detail;
      const keys = Array.isArray(data?.key_items) ? data.key_items : [];
      const redemptions = Array.isArray(data?.redemptions) ? data.redemptions : [];

      const keyHeaders = ['id','code','uses_total','uses_limit','is_used','valid_from','valid_to','created_at','line_url','member_card_id','redeemed_at','ok','reason'];

      const allRows = keys.map((k: any) => {
        const keyRow = [
          k.id,
          `"${k.code || ''}"`,
          k.uses_total ?? 0,
          k.uses_limit ?? '',
          k.is_used ? 'Y' : 'N',
          k.valid_from || '',
          k.valid_to || '',
          k.created_at || '',
          `"${k.line_url || ''}"`
        ];

        const keyRedemptions = redemptions.filter((r: any) => r.code === k.code);

        if (keyRedemptions.length > 0) {
          const firstRedemption = keyRedemptions[0];
          keyRow.push(
            firstRedemption.member_card_id || '',
            firstRedemption.redeemed_at || '',
            firstRedemption.ok ? 'Y' : 'N',
            `"${firstRedemption.reason || ''}"`
          );
        } else {
          keyRow.push('', '', '', '');
        }

        return keyRow.join(',');
      });

      const csv = '\ufeff' + keyHeaders.join(',') + '\n' + allRows.join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${batch.title}_complete.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showSuccess('下載成功');
    } catch (error: any) {
      console.error('下載失敗:', error);
      showError(error?.message || '下載失敗');
    }
  };

  // 查看已使用金鑰
  const handleViewUsedKeys = async (batchId: number, batchTitle: string) => {
    try {
      const result = await keysGetBatchDetail(batchId, { status: 'used' });
      if (result?.success && result?.data) {
        const keys = Array.isArray(result.data) ? result.data : [];
        if (keys.length === 0) {
          showError('此批次尚無已使用的金鑰');
          return;
        }
        setUsedKeysList(keys);
        setUsedKeysTitle(batchTitle);
        setShowUsedKeysModal(true);
      } else {
        showError('無法取得已使用金鑰列表');
      }
    } catch (error: any) {
      console.error('查看已使用金鑰失敗:', error);
      showError(error?.message || '查看已使用金鑰失敗');
    }
  };

  // 計算統計資料
  const stats = {
    total_batches: batches.length,
    total_keys: batches.reduce((sum, b) => sum + (b.statistics?.total_items || 0), 0),
    used_keys: batches.reduce((sum, b) => sum + (b.statistics?.used_items || 0), 0),
    remaining_keys: batches.reduce((sum, b) => sum + (b.statistics?.unused_items || 0), 0),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 pb-20 md:pb-6">
        {/* Header - Hidden on mobile (shown in header) */}
        <div className="mb-6 hidden md:block">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-lg ${AI_COLORS.bg} flex items-center justify-center`}>
                <Key className={AI_COLORS.text} size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">金鑰設定</h1>
                {selectedClient && (
                  <p className="text-gray-600 text-sm">
                    {selectedClient.company_name} - {selectedClient.managed_client_name}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowKeyManager(true)}
              className={`flex items-center gap-2 ${AI_COLORS.button} px-6 py-3 rounded-lg text-white font-medium transition-colors hover:shadow-md`}
            >
              <Plus size={20} />
              建立金鑰批次
            </button>
          </div>
        </div>

        {/* Mobile Create Button */}
        <div className="md:hidden mb-4">
          <button
            onClick={() => setShowKeyManager(true)}
            className={`w-full flex items-center justify-center gap-2 ${AI_COLORS.button} px-6 py-3 rounded-lg text-white font-medium transition-colors`}
          >
            <Plus size={20} />
            建立金鑰批次
          </button>
        </div>

        {/* 統計卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-gray-600 text-xs md:text-sm mb-1">批次總數</p>
            <p className="text-xl md:text-2xl font-bold text-gray-900">{stats.total_batches}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-gray-600 text-xs md:text-sm mb-1">總金鑰數</p>
            <p className="text-xl md:text-2xl font-bold text-gray-900">{stats.total_keys}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-gray-600 text-xs md:text-sm mb-1">已使用</p>
            <p className="text-xl md:text-2xl font-bold text-green-600">{stats.used_keys}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-gray-600 text-xs md:text-sm mb-1">剩餘</p>
            <p className="text-xl md:text-2xl font-bold text-blue-600">{stats.remaining_keys}</p>
          </div>
        </div>

        {/* 金鑰批次列表 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">金鑰批次列表</h2>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : batches.length === 0 ? (
            <div className="text-center py-12">
              <Key className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">尚無金鑰批次</h3>
              <p className="text-gray-600 mb-4">建立您的第一個金鑰批次，開始發放點數或代幣</p>
              <button
                onClick={() => setShowKeyManager(true)}
                className={`${AI_COLORS.button} px-6 py-2 rounded-lg text-white font-medium`}
              >
                建立金鑰批次
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {batches.map((batch) => {
                // 判斷狀態
                const isActive = batch.status === '進行中' || batch.status === 'active';
                const statusLight = isActive ? 'bg-green-500' : 'bg-red-500';

                return (
                  <div
                    key={batch.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors relative"
                  >
                    {/* 右側功能按鈕 */}
                    <div className="absolute top-4 right-4 flex flex-col gap-1.5">
                      <button
                        onClick={() => handleGetUnusedKey(batch.id, batch.title)}
                        className="p-1.5 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 transition-colors"
                        title="取得未使用金鑰連結"
                      >
                        <LinkIcon size={16} />
                      </button>
                      <button
                        onClick={() => handleViewUsedKeys(batch.id, batch.title)}
                        className="p-1.5 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 transition-colors"
                        title="查看已使用金鑰"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => handleDownload(batch)}
                        className="p-1.5 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 transition-colors"
                        title="下載批次資料"
                      >
                        <Download size={16} />
                      </button>
                    </div>

                    <div className="pr-14">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{batch.title}</h3>
                            <div className={`w-2 h-2 rounded-full ${statusLight}`} title={isActive ? '進行中' : '無效'}></div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              batch.key_type === 'UNIQUE'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {batch.key_type === 'UNIQUE' ? '唯一碼' : '共用碼'}
                            </span>
                            <span>•</span>
                            <span>{new Date(batch.created_at).toLocaleDateString('zh-TW')}</span>
                          </div>
                        </div>
                      </div>

                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-600">總數</p>
                      <p className="font-semibold text-gray-900">{batch.statistics?.total_items || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">已使用</p>
                      <p className="font-semibold text-green-600">{batch.statistics?.used_items || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">剩餘</p>
                      <p className="font-semibold text-blue-600">{batch.statistics?.unused_items || 0}</p>
                    </div>
                  </div>

                      <div className="flex flex-wrap gap-2 text-sm">
                        {batch.action_json?.grants?.map((grant, index) => (
                          <span
                            key={index}
                            className={`px-2 py-1 rounded text-xs ${
                              grant.type === 'points' ? 'bg-purple-50 text-purple-700' :
                              grant.type === 'coins' ? 'bg-yellow-50 text-yellow-700' :
                              grant.type === 'tokens' ? 'bg-green-50 text-green-700' :
                              'bg-blue-50 text-blue-700'
                            }`}
                          >
                            {grant.type.charAt(0).toUpperCase() + grant.type.slice(1)}: {grant.value}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 金鑰管理 Modal */}
      {showKeyManager && selectedClient && (
        <KeysManagerModal
          isOpen={showKeyManager}
          onClose={() => {
            setShowKeyManager(false);
            loadBatches(); // 關閉後重新載入列表
          }}
          managedClientId={selectedClient.managed_client_id}
          managedClientName={selectedClient.managed_client_name}
          managedClientSid={selectedClient.managed_client_sid}
          userRole="admin"
          initialTab="create"
        />
      )}

      {/* 金鑰資訊 Modal */}
      {showKeyModal && keyData && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[2100] flex items-center justify-center p-4" onClick={() => setShowKeyModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">金鑰資訊</h3>
              <button onClick={() => setShowKeyModal(false)} className="text-gray-400 hover:text-gray-600">
                <i className="ri-close-line text-xl" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">金鑰代碼</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={keyData.code || ''}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                  <button
                    onClick={() => copyToClipboard(keyData.code, '金鑰代碼')}
                    className={`px-4 py-2 ${AI_COLORS.button} rounded-lg transition-colors`}
                  >
                    複製
                  </button>
                </div>
              </div>

              {/* Link Type Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">連結類型</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setLinkType('line')}
                    className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                      linkType === 'line'
                        ? `${AI_COLORS.button}`
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    LINE
                  </button>
                  <button
                    onClick={() => setLinkType('web')}
                    className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                      linkType === 'web'
                        ? `${AI_COLORS.button}`
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    WEB
                  </button>
                </div>
              </div>

              {/* QR Code Display */}
              {(() => {
                const webUrl = `${import.meta.env.VITE_APP_URL || 'https://www.flashfalcon.info'}/${webUserType}/profile?key=${keyData.code}`;
                const currentUrl = linkType === 'line' ? keyData.line_url : webUrl;
                const currentLabel = linkType === 'line' ? 'LINE 連結' : 'WEB 連結';

                return currentUrl ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{currentLabel}</label>
                    <div className="flex items-start gap-4">
                      {/* QR Code */}
                      <div className="flex flex-col items-center gap-3 flex-1">
                        <div className="p-4 bg-white border border-gray-200 rounded-lg">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(currentUrl)}`}
                            alt={`${currentLabel} QR Code`}
                            className="w-48 h-48"
                          />
                        </div>
                        <button
                          onClick={() => copyToClipboard(currentUrl, currentLabel)}
                          className={`px-4 py-2 ${AI_COLORS.button} rounded-lg transition-colors`}
                        >
                          複製連結
                        </button>
                      </div>

                      {/* User Type Selector (only for WEB) */}
                      {linkType === 'web' && (
                        <div className="flex flex-col gap-2 pt-4">
                          <button
                            onClick={() => setWebUserType('client')}
                            className={`px-4 py-2 rounded-lg border transition-colors min-w-[100px] ${
                              webUserType === 'client'
                                ? `${AI_COLORS.button}`
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            Client
                          </button>
                          <button
                            onClick={() => setWebUserType('provider')}
                            className={`px-4 py-2 rounded-lg border transition-colors min-w-[100px] ${
                              webUserType === 'provider'
                                ? `${AI_COLORS.button}`
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            Provider
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 已使用金鑰 Modal */}
      {showUsedKeysModal && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[2100] flex items-center justify-center p-4" onClick={() => setShowUsedKeysModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">{usedKeysTitle} - 已使用金鑰</h3>
              <button onClick={() => setShowUsedKeysModal(false)} className="text-gray-400 hover:text-gray-600">
                <i className="ri-close-line text-xl" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto">
              {usedKeysList.length === 0 ? (
                <div className="text-center py-8 text-gray-500">尚無已使用的金鑰</div>
              ) : (
                <div className="space-y-3">
                  {usedKeysList.map((key: any, index: number) => (
                    <div key={key.id || index} className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-sm font-semibold text-gray-900">{key.code}</span>
                        <span className="text-sm text-gray-600">使用次數: {key.uses_total || 0}</span>
                      </div>
                      {key.redeemed_at && (
                        <div className="text-xs text-gray-500">
                          兌換時間: {new Date(key.redeemed_at).toLocaleString('zh-TW')}
                        </div>
                      )}
                      {key.member_card_id && (
                        <div className="text-xs text-gray-500">
                          會員卡號: {key.member_card_id}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ManageKeys;
