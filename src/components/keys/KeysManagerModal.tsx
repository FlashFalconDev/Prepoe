import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AI_COLORS } from '../../constants/colors';
import { KeyBatchCreatePayload, keysCreateBatch, keysListBatches, keysGetBatchDetail } from '../../config/api';
import { Download, Key, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface KeysManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  managedClientId?: number;
  managedClientName?: string;
  managedClientSid?: string;
  userRole?: string; // 用戶在該公司的角色
}

type TabKey = 'list' | 'create';

const defaultPayload: KeyBatchCreatePayload = {
  mode: 'unique',
  title: '',
  days: 60,
  points: 0,
  coins: 0,
  count: 100,
  code_len: 12,
};

const KeysManagerModal: React.FC<KeysManagerModalProps> = ({ isOpen, onClose, managedClientId, managedClientName, managedClientSid, userRole }) => {
  const { user } = useAuth();
  const [active, setActive] = useState<TabKey>('list');
  
  // 判斷是否為管理員（僅 admin）
  const isAdmin = userRole === 'admin' || user?.is_superuser;

  // list state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [batches, setBatches] = useState<any[]>([]);

  // create state
  const [payload, setPayload] = useState<KeyBatchCreatePayload>({ ...defaultPayload, managed_client_id: managedClientId });
  const [submitting, setSubmitting] = useState(false);

  // GetOne modal state
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyData, setKeyData] = useState<any>(null);
  
  // Used keys list modal state
  const [showUsedKeysModal, setShowUsedKeysModal] = useState(false);
  const [usedKeysList, setUsedKeysList] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      setActive('list');
      setPayload({ ...defaultPayload, managed_client_id: managedClientId });
      setBatches([]);
      setError(null);
    }
  }, [isOpen, managedClientId]);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      setError(null);
      const resp = await keysListBatches({ page: 1, page_size: 10, managed_client_id: managedClientId });
      const rows = resp?.data?.batches || resp?.batches || resp?.data?.results || resp?.results || [];
      setBatches(Array.isArray(rows) ? rows : []);
    } catch (e: any) {
      setError(e?.message || '讀取失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && active === 'list') {
      fetchBatches();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, active, managedClientId]);

  const isUnique = payload.mode === 'unique';
  const preview = useMemo(() => {
    const copy: any = { ...payload };
    if (isUnique) {
      delete copy.event_code;
      delete copy.max_uses;
      delete copy.per_member;
    } else {
      delete copy.count;
      delete copy.code_len;
    }
    return copy;
  }, [payload, isUnique]);

  const validate = (): string | null => {
    if (!payload.title || payload.title.trim().length === 0) return '請輸入批次標題';
    if (!payload.managed_client_id) return '缺少 managed_client_id';
    
    // 檢查至少要有一項贈與內容（points、coins、tokens 或 role）
    const hasPoints = (payload.points || 0) > 0;
    const hasCoins = (payload.coins || 0) > 0;
    const hasTokens = (payload.tokens || 0) > 0;
    const hasRole = payload.role && payload.role.trim().length > 0;
    
    if (!hasPoints && !hasCoins && !hasTokens && !hasRole) {
      return '請至少設定一項贈與內容（Points、Coins、Tokens 或角色）';
    }
    
    if (isUnique) {
      if (!payload.count || payload.count <= 0) return '請輸入有效的數量';
      if (!payload.code_len || payload.code_len < 12 || payload.code_len > 18) return '金鑰長度需介於 12~18';
    } else {
      if (!payload.max_uses || payload.max_uses <= 0) return '請輸入總使用次數限制';
      // 移除每人次數的限制
      if (payload.event_code && payload.event_code.length > 11) return '事件代碼最長 11 個字元';
    }
    return null;
  };

  const handleCreate = async () => {
    const msg = validate();
    if (msg) {
      alert(msg);
      return;
    }
    try {
      setSubmitting(true);
      const result = await keysCreateBatch(payload);
      if (result?.success) {
        setActive('list');
        fetchBatches();
      } else {
        alert(result?.error || '建立失敗');
      }
    } catch (e: any) {
      alert(e?.response?.data?.error || '建立失敗');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const formatToSeconds = (value?: string) => {
    if (!value) return '-';
    try {
      const d = new Date(value);
      if (!Number.isNaN(d.getTime())) {
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      }
    } catch {}
    // fallback: trim microseconds and timezone
    try {
      const plain = value.replace('T', ' ').replace(/\..*$/, '').replace(/Z$/, '');
      return plain;
    } catch {
      return value;
    }
  };

  const sidLower = (managedClientSid || '').toLowerCase();
  const showPreview = sidLower === 'flashfalcon' || sidLower === 'prepoe';

  const handleGetOne = async (batchId: number) => {
    try {
      const result = await keysGetBatchDetail(batchId, { status: 'available' });
      if (result?.success && result?.data?.length > 0) {
        setKeyData(result.data[0]);
        setShowKeyModal(true);
      } else {
        alert('無法取得金鑰資訊');
      }
    } catch (err) {
      console.error('取得金鑰失敗:', err);
      alert('取得金鑰失敗');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert(`${label} 已複製到剪貼簿`);
    }).catch(() => {
      alert('複製失敗');
    });
  };

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[2000] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">金鑰設定</h3>
            {managedClientName && (
              <div className="text-sm text-gray-500 mt-0.5">{managedClientName}</div>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <i className="ri-close-line text-xl" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-5 pt-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex gap-4">
            {([
              { key: 'list', label: '已建立列表' },
              { key: 'create', label: '建立金鑰' },
            ] as { key: TabKey; label: string }[]).map((t) => (
              <button
                key={t.key}
                onClick={() => setActive(t.key)}
                className={`px-3 py-2 text-sm border-b-2 -mb-px ${
                  active === t.key ? 'border-orange-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {active === 'list' ? (
          <div className="p-5 overflow-y-auto flex-1">
            {loading ? (
              <div className="text-center text-gray-500">讀取中...</div>
            ) : error ? (
              <div className="text-center text-red-500">{error}</div>
            ) : batches.length === 0 ? (
              <div className="text-center text-gray-500">尚未建立任何批次</div>
            ) : (
              <div className="space-y-3">
                {batches.map((b: any, idx: number) => {
                  const title = b.title || b.name || `批次 ${b.id || idx+1}`;
                  const mode = b.key_type || b.mode || b.batch_type || '-';
                  const createdAt = b.created_at || b.mdt_add || '-';
                  const remaining = (b.statistics && (b.statistics.unused_items ?? b.statistics.remaining)) ?? b.remaining ?? b.available ?? '-';
                  const status = b.status || b.state || '';
                  // 贈與摘要（從 action_json.grants 彙總）
                  const grants: any[] = (b.action_json?.grants || []) as any[];
                  let roleLabel: string | null = null;
                  const grantTotals = grants.reduce<Record<string, number>>((acc, g) => {
                    const key = (g.type || '').toLowerCase();
                    if (key === 'role') {
                      roleLabel = g.role || g.value || g.name || null;
                      return acc;
                    }
                    const amount = Number(g.amount || 0);
                    if (!Number.isNaN(amount)) {
                      acc[key] = (acc[key] || 0) + amount;
                    }
                    return acc;
                  }, {});
                  const typeLabel: Record<string, string> = { points: 'Points', coins: 'Coins', tokens: 'Tokens' };
                  const parts: string[] = [];
                  Object.entries(grantTotals).forEach(([k, v]) => {
                    if (v > 0) parts.push(`${typeLabel[k] || k}: ${v}`);
                  });
                  if (roleLabel) parts.push(`role: ${roleLabel}`);
                  const grantSummary = parts.join('、');
                  const handleDownload = async () => {
                    try {
                      // 改用 批次詳細資訊 API 取得 key_items 與 redemptions，輸出合併的 CSV
                      const detail = await keysGetBatchDetail(b.id);
                      const data = detail?.data || detail;
                      const keys = Array.isArray(data?.key_items) ? data.key_items : [];
                      const redemptions = Array.isArray(data?.redemptions) ? data.redemptions : [];

                      // 合併金鑰清單和兌換記錄到一個CSV檔案
                      const keyHeaders = ['id','code','uses_total','uses_limit','is_used','valid_from','valid_to','created_at','line_url','member_card_id','redeemed_at','ok','reason'];
                      
                      // 為每個金鑰找到對應的兌換記錄
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
                        
                        // 找到這個金鑰的兌換記錄
                        const keyRedemptions = redemptions.filter((r: any) => r.code === k.code);
                        
                        if (keyRedemptions.length > 0) {
                          // 如果有兌換記錄，將第一個兌換記錄的資訊添加到金鑰行後面
                          const firstRedemption = keyRedemptions[0];
                          keyRow.push(
                            firstRedemption.member_card_id ?? '',
                            firstRedemption.redeemed_at || '',
                            firstRedemption.ok ? 'Y' : 'N',
                            (firstRedemption.reason || '').toString().replace(/\n/g,' ')
                          );
                          
                          // 如果有多個兌換記錄，為每個額外的兌換記錄添加新行
                          const additionalRows = keyRedemptions.slice(1).map((r: any) => [
                            '', // 空的id
                            `"${r.code || ''}"`, // 重複code
                            '', '', '', '', '', '', '', // 空的金鑰欄位
                            r.member_card_id ?? '',
                            r.redeemed_at || '',
                            r.ok ? 'Y' : 'N',
                            (r.reason || '').toString().replace(/\n/g,' ')
                          ]);
                          
                          return [keyRow, ...additionalRows];
                        } else {
                          // 沒有兌換記錄，補齊空欄位
                          keyRow.push('', '', '', '');
                          return [keyRow];
                        }
                      }).flat();

                      const csv = '\ufeff' + [keyHeaders.join(','), ...allRows.map((r: (string | number)[]) => r.join(','))].join('\n');
                      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.setAttribute('download', `${title}_complete.csv`);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(url);
                    } catch (err) {
                      // 失敗時，最少匯出目前列的摘要 CSV
                      const headers = ['id','title','key_type','created_at','status','unused'];
                      const row = [b.id, JSON.stringify(title), mode, createdAt, status, remaining];
                      const csv = '\ufeff' + headers.join(',') + '\n' + row.join(',');
                      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.setAttribute('download', `${title}.csv`);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(url);
                    }
                  };
                  // 判斷狀態燈號顏色
                  const isActive = status === '進行中' || status === 'active';
                  const statusLight = isActive ? 'bg-green-500' : 'bg-red-500';

                  const handleViewUsedKeys = async () => {
                    try {
                      const result = await keysGetBatchDetail(b.id, { status: 'used' });
                      if (result?.success && result?.data) {
                        const keys = Array.isArray(result.data) ? result.data : [];
                        if (keys.length === 0) {
                          alert('此批次尚無已使用的金鑰');
                          return;
                        }
                        setUsedKeysList(keys);
                        setShowUsedKeysModal(true);
                      } else {
                        alert('無法取得已使用金鑰列表');
                      }
                    } catch (err) {
                      console.error('取得已使用金鑰失敗:', err);
                      alert('取得已使用金鑰失敗');
                    }
                  };

                  return (
                    <div key={b.id || idx} className="py-3 px-3 bg-white border border-gray-200 rounded-xl relative">
                      <div className="absolute top-3 right-3 flex flex-col gap-1.5">
                        <button onClick={() => handleGetOne(b.id)} className={`p-1.5 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-gray-700`} aria-label="取得未使用金鑰">
                          <Key size={16} />
                        </button>
                        <button
                          onClick={handleViewUsedKeys}
                          className={`p-1.5 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-gray-700`}
                          aria-label="查看已使用金鑰"
                        >
                          <Check size={16} />
                        </button>
                        <button onClick={handleDownload} className={`p-1.5 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-gray-700`} aria-label="下載">
                          <Download size={16} />
                        </button>
                      </div>
                      <div className="pr-14">
                        <div className="flex items-center gap-2 font-medium text-gray-900">
                          <span className="truncate">{title}</span>
                          {mode && (
                            <span className="px-2 py-0.5 rounded-md text-xs border border-gray-300 text-gray-700 bg-white whitespace-nowrap">{String(mode).toUpperCase()}</span>
                          )}
                          <div className={`w-2 h-2 rounded-full ${statusLight}`} title={isActive ? '進行中' : '無效'}></div>
                        </div>
                        <div className="mt-1 text-sm text-gray-600">
                          可用：{(b.statistics?.unused_items ?? remaining)}/{b.statistics?.total_items ?? '-'}
                        </div>
                        {grantSummary && (
                          <div className="mt-1 text-sm text-gray-600">贈與：{grantSummary}</div>
                        )}
                        <div className="mt-1 text-sm text-gray-500">
                          建立時間：{formatToSeconds(createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className={`grid grid-cols-1 ${showPreview ? 'lg:grid-cols-2' : ''} gap-0 overflow-y-auto flex-1`}>
            <div className="p-5 lg:border-r border-gray-100">
              {/* 模式 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">模式</label>
                <div className="flex items-center gap-4">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input type="radio" checked={payload.mode === 'unique'} onChange={() => setPayload({ ...payload, mode: 'unique' })} />
                    UNIQUE（一次性）
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input type="radio" checked={payload.mode === 'event'} onChange={() => setPayload({ ...payload, mode: 'event' })} />
                    EVENT（事件代碼）
                  </label>
                </div>
              </div>

              {/* 基本設定 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">批次標題 *</label>
                  <input
                    type="text"
                    value={payload.title}
                    onChange={(e) => setPayload({ ...payload, title: e.target.value })}
                    placeholder="例如：新年活動金鑰"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Points</label>
                  <input
                    type="number"
                    value={payload.points || 0}
                    onChange={(e) => setPayload({ ...payload, points: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    min={0}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Coins</label>
                  <input
                    type="number"
                    value={(payload.coins ?? payload.tokens) || 0}
                    onChange={(e) => setPayload({ ...payload, coins: Number(e.target.value), tokens: undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    min={0}
                  />
                </div>
                {isAdmin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tokens</label>
                    <input
                      type="number"
                      value={payload.tokens || 0}
                      onChange={(e) => setPayload({ ...payload, tokens: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      min={0}
                    />
                  </div>
                )}
              </div>

              {/* 有效天數 + 角色 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">有效天數</label>
                  <input
                    type="number"
                    value={payload.days || 0}
                    onChange={(e) => setPayload({ ...payload, days: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    min={1}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">角色設定</label>
                  <select
                    value={payload.role || ''}
                    onChange={(e) =>
                      setPayload({
                        ...payload,
                        role: (e.target.value as KeyBatchCreatePayload['role']) || undefined,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">請選擇角色</option>
                    <option value="manager">管理者</option>
                    <option value="service">客服專員</option>
                    <option value="provider">服務提供者</option>
                  </select>
                </div>
              </div>

              {/* UNIQUE */}
              {isUnique && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">生成數量 *</label>
                    <input
                      type="number"
                      value={payload.count || 0}
                      onChange={(e) => setPayload({ ...payload, count: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">金鑰長度 *</label>
                    <input
                      type="number"
                      value={payload.code_len || 12}
                      onChange={(e) => setPayload({ ...payload, code_len: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      min={12}
                      max={18}
                    />
                  </div>
                </div>
              )}

              {/* EVENT */}
              {!isUnique && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">總使用次數 *</label>
                    <input
                      type="number"
                      value={payload.max_uses || 0}
                      onChange={(e) => setPayload({ ...payload, max_uses: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">事件代碼 *</label>
                    <input
                      type="text"
                      value={payload.event_code || ''}
                      onChange={(e) => setPayload({ ...payload, event_code: e.target.value })}
                      placeholder="例如：NEWYEAR2025"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    maxLength={11}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">取消</button>
                <button onClick={handleCreate} disabled={submitting} className={`flex-1 px-4 py-2 rounded-lg ${AI_COLORS.button} disabled:bg-gray-300 disabled:cursor-not-allowed`}>
                  {submitting ? '建立中...' : '建立批次'}
                </button>
              </div>
            </div>

            {/* Preview */}
            {showPreview && (
            <div className="p-5 bg-gray-50">
              <h4 className="font-medium text-gray-900 mb-3">即時預覽</h4>
              <div className="text-sm text-gray-700 space-y-2">
                <div>模式：<span className="font-semibold">{isUnique ? 'UNIQUE (一次性)' : 'EVENT (事件代碼)'}</span></div>
                <div>標題：<span className="font-semibold">{payload.title || '—'}</span></div>
                {payload.managed_client_id ? (
                  <div>managed_client_id：<span className="font-semibold">{payload.managed_client_id}</span></div>
                ) : null}
                {isUnique ? (
                  <div>將產生 <span className="font-semibold">{payload.count || 0}</span> 組、長度 <span className="font-semibold">{payload.code_len || 0}</span> 的唯一金鑰</div>
                ) : (
                  <div>事件代碼 <span className="font-semibold">{payload.event_code || '(自動產生)'}</span>，總使用 <span className="font-semibold">{payload.max_uses || 0}</span> 次</div>
                )}
                {(payload.points || 0) > 0 && <div>贈送點數：<span className="font-semibold">{payload.points}</span></div>}
                {(payload.coins || 0) > 0 && <div>贈送 Coins：
                  <span className="font-semibold">{payload.coins}</span>
                </div>}
                {isAdmin && (payload.tokens || 0) > 0 && <div>贈送 Tokens：<span className="font-semibold">{payload.tokens}</span></div>}
                <div>有效天數：{payload.days || 0} 天</div>
                <div>角色設定：{payload.role || '—'}</div>
              </div>

              <div className="mt-4">
                <pre className="text-xs bg-white border border-gray-200 rounded-lg p-3 overflow-auto max-h-72">{JSON.stringify(preview, null, 2)}</pre>
              </div>
            </div>
            )}
          </div>
        )}
      </div>

      {/* GetOne Modal */}
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
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    複製
                  </button>
                </div>
              </div>

              {/* LINE URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">LINE 連結</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={keyData.line_url || ''}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(keyData.line_url, 'LINE 連結')}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    複製
                  </button>
                </div>
              </div>

              {/* Created At */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">建立時間</label>
                <input
                  type="text"
                  value={formatToSeconds(keyData.created_at) || ''}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>

              {/* Close Button */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowKeyModal(false)}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  關閉
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Used Keys List Modal */}
      {showUsedKeysModal && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[2100] flex items-center justify-center p-4" onClick={() => setShowUsedKeysModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-900">已使用金鑰列表 ({usedKeysList.length})</h3>
              <button onClick={() => setShowUsedKeysModal(false)} className="text-gray-400 hover:text-gray-600">
                <i className="ri-close-line text-xl" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1">
              {usedKeysList.length === 0 ? (
                <div className="text-center text-gray-500 py-8">此批次尚無已使用的金鑰</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Code</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">代號</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">使用時間</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usedKeysList.map((key: any, idx: number) => (
                        <tr key={key.id || idx} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-mono text-gray-900">{key.code || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{key.member_card_id || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{formatToSeconds(key.redeemed_at || key.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="flex justify-end px-5 py-4 border-t border-gray-100 flex-shrink-0">
              <button
                onClick={() => setShowUsedKeysModal(false)}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                關閉
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>,
    document.body
  );
};

export default KeysManagerModal;


