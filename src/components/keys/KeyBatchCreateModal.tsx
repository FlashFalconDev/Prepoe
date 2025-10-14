import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AI_COLORS } from '../../constants/colors';
import { KeyBatchCreatePayload, keysCreateBatch } from '../../config/api';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../contexts/AuthContext';

interface KeyBatchCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (result: any) => void;
  managedClientId?: number;
  userRole?: string; // 用戶在該公司的角色
}

const defaultPayload: KeyBatchCreatePayload = {
  mode: 'unique',
  title: '',
  days: 60,
  points: 0,
  tokens: 0,
  count: 100,
  code_len: 12,
  allowed_channels: ['WEB'],
};

const KeyBatchCreateModal: React.FC<KeyBatchCreateModalProps> = ({ isOpen, onClose, onCreated, managedClientId, userRole }) => {
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();
  const [payload, setPayload] = useState<KeyBatchCreatePayload>(defaultPayload);
  const [submitting, setSubmitting] = useState(false);
  
  // 判斷是否為管理員（僅 admin）
  const isAdmin = userRole === 'admin' || user?.is_superuser;

  useEffect(() => {
    if (isOpen) {
      setPayload({ ...defaultPayload, managed_client_id: managedClientId });
      setSubmitting(false);
    }
  }, [isOpen, managedClientId]);

  const isUnique = payload.mode === 'unique';

  const preview = useMemo(() => {
    const copy: any = { ...payload };
    // 清掉非當前模式的欄位，便於預覽
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
    
    // 檢查至少要有一項贈與內容（points、tokens）
    const hasPoints = (payload.points || 0) > 0;
    const hasTokens = (payload.tokens || 0) > 0;
    
    if (!hasPoints && !hasTokens) {
      return '請至少設定一項贈與內容（Points 或 Tokens）';
    }
    
    if (isUnique) {
      if (!payload.count || payload.count <= 0) return '請輸入有效的數量';
      if (!payload.code_len || payload.code_len < 6 || payload.code_len > 32) return '金鑰長度需介於 6~32';
    } else {
      if (!payload.max_uses || payload.max_uses <= 0) return '請輸入總使用次數限制';
      if (!payload.per_member || payload.per_member <= 0) return '請輸入每人可使用次數';
    }
    return null;
  };

  const handleSubmit = async () => {
    const msg = validate();
    if (msg) {
      showError(msg);
      return;
    }
    try {
      setSubmitting(true);
      const result = await keysCreateBatch(payload);
      if (result?.success) {
        showSuccess(result.message || '金鑰批次建立成功');
        onCreated?.(result);
        onClose();
      } else {
        showError(result?.error || '建立失敗');
      }
    } catch (e: any) {
      showError(e?.response?.data?.error || '建立失敗');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[2000] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">建立金鑰批次</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <i className="ri-close-line text-xl" />
          </button>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          {/* Form */}
          <div className="p-5 lg:border-r border-gray-100">
            {/* 模式 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">模式</label>
              <div className="flex items-center gap-4">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    checked={payload.mode === 'unique'}
                    onChange={() => setPayload({ ...payload, mode: 'unique' })}
                  />
                  UNIQUE（一次性）
                </label>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    checked={payload.mode === 'event'}
                    onChange={() => setPayload({ ...payload, mode: 'event' })}
                  />
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
                <label className="block text-sm font-medium text-gray-700 mb-2">有效天數</label>
                <input
                  type="number"
                  value={payload.days || 0}
                  onChange={(e) => setPayload({ ...payload, days: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  min={1}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">贈送點數</label>
                <input
                  type="number"
                  value={payload.points || 0}
                  onChange={(e) => setPayload({ ...payload, points: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  min={0}
                />
              </div>
              {isAdmin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">贈送 Tokens</label>
                  <input
                    type="number"
                    value={payload.tokens || 0}
                    onChange={(e) => setPayload({ ...payload, tokens: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    min={0}
                  />
                </div>
              )}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">允許通道</label>
                <div className="flex items-center gap-4">
                  {['WEB', 'LINE'].map((ch) => (
                    <label key={ch} className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={payload.allowed_channels?.includes(ch)}
                        onChange={(e) => {
                          const set = new Set(payload.allowed_channels || []);
                          if (e.target.checked) set.add(ch); else set.delete(ch);
                          setPayload({ ...payload, allowed_channels: Array.from(set) });
                        }}
                      />
                      {ch}
                    </label>
                  ))}
                </div>
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
                    min={6}
                    max={32}
                  />
                </div>
              </div>
            )}

            {/* EVENT */}
            {!isUnique && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">事件代碼</label>
                  <input
                    type="text"
                    value={payload.event_code || ''}
                    onChange={(e) => setPayload({ ...payload, event_code: e.target.value })}
                    placeholder="例如：NEWYEAR2025"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">每人次數 *</label>
                  <input
                    type="number"
                    value={payload.per_member || 1}
                    onChange={(e) => setPayload({ ...payload, per_member: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    min={1}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">取消</button>
              <button onClick={handleSubmit} disabled={submitting} className={`flex-1 px-4 py-2 rounded-lg ${AI_COLORS.button} disabled:bg-gray-300 disabled:cursor-not-allowed`}>
                {submitting ? '建立中...' : '建立批次'}
              </button>
            </div>
          </div>

          {/* Preview */}
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
                <div>事件代碼 <span className="font-semibold">{payload.event_code || '(自動產生)'}</span>，總使用 <span className="font-semibold">{payload.max_uses || 0}</span> 次、每人 <span className="font-semibold">{payload.per_member || 0}</span> 次</div>
              )}
              {(payload.points || 0) > 0 && <div>贈送點數：<span className="font-semibold">{payload.points}</span></div>}
              {isAdmin && (payload.tokens || 0) > 0 && <div>贈送 Tokens：<span className="font-semibold">{payload.tokens}</span></div>}
              <div>有效天數：{payload.days || 0} 天</div>
              <div>允許通道：{(payload.allowed_channels || []).join('、') || '—'}</div>
            </div>

            <div className="mt-4">
              <pre className="text-xs bg-white border border-gray-200 rounded-lg p-3 overflow-auto max-h-72">{JSON.stringify(preview, null, 2)}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default KeyBatchCreateModal;



