import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AI_COLORS } from '../../constants/colors';
import {
  KeyTriggerCreatePayload, KeyTriggerItem, TriggerType, AchievementConditionType,
  keysCreateTrigger, keysListTriggers, keysGetBatchDetail, keysGetTriggerDetail, keysUpdateTrigger, keysDeleteTrigger,
  keysListBatches,
} from '../../config/api';
import { Plus, Trash2, Power } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import KeysManagerModal from './KeysManagerModal';

interface TriggerManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  managedClientId?: number;
  managedClientName?: string;
}

/** 從批次資料中提取贈與摘要文字 */
const getBatchRewardSummary = (batch: any): string => {
  if (!batch) return '';
  const parts: string[] = [];

  // 先從 action_json.grants 彙總
  const grants: any[] = (batch.action_json?.grants || []) as any[];
  let roleLabel: string | null = null;
  const grantTotals = grants.reduce<Record<string, number>>((acc, g) => {
    const key = (g.type || '').toLowerCase();
    if (key === 'role') {
      roleLabel = g.value || g.role || 'provider';
    } else {
      acc[key] = (acc[key] || 0) + (Number(g.amount ?? g.value) || 0);
    }
    return acc;
  }, {});

  // 再用批次頂層欄位補全（API 列表可能不含 action_json）
  if (!grantTotals.points && (batch.points || 0) > 0) grantTotals.points = Number(batch.points);
  if (!grantTotals.coins && (batch.coins || 0) > 0) grantTotals.coins = Number(batch.coins);
  if (!grantTotals.tokens && (batch.tokens || 0) > 0) grantTotals.tokens = Number(batch.tokens);

  const labelMap: Record<string, string> = { points: 'Points', coins: 'Coins', tokens: 'Tokens' };
  Object.entries(grantTotals).forEach(([k, v]) => {
    if (v > 0) parts.push(`${labelMap[k] || k}: ${v}`);
  });
  if (roleLabel) parts.push(`role: ${roleLabel}`);

  const eticketRewards: any[] = batch.eticket_rewards || [];
  if (eticketRewards.length > 0) {
    const ticketSummary = eticketRewards.map((r: any) =>
      `${r.eticket_item_name || '票券'}×${r.quantity || 1}`
    ).join('、');
    parts.push(`票券: ${ticketSummary}`);
  }
  return parts.join('、');
};

const TriggerManagerModal: React.FC<TriggerManagerModalProps> = ({ isOpen, onClose, managedClientId, managedClientName }) => {
  const { showError, showSuccess } = useToast();

  // 觸發條件列表
  const [triggers, setTriggers] = useState<KeyTriggerItem[]>([]);
  const [triggerLoading, setTriggerLoading] = useState(false);

  // 所有批次（用於獎勵交叉比對）
  const [allBatches, setAllBatches] = useState<any[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);

  // 各 batch_id 的獎勵快取（從觸發詳情 API 補全）
  const [batchRewardCache, setBatchRewardCache] = useState<Record<number, any>>({});

  // 開啟完整的建立批次 Modal
  const [showBatchCreate, setShowBatchCreate] = useState(false);

  // 新增表單
  const [creating, setCreating] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<number | ''>('');
  const [newTrigger, setNewTrigger] = useState<{
    trigger_type: TriggerType;
    min_amount: number;
    trigger_at: 'first_paid_order' | 'card_created';
    achievement_condition_type: AchievementConditionType;
    achievement_condition_value: number;
    reward_scope: 'lifetime_once' | 'period_once';
    event_type: string;
  }>({
    trigger_type: 'new_member',
    min_amount: 0,
    trigger_at: 'card_created',
    achievement_condition_type: 'first_purchase',
    achievement_condition_value: 0,
    reward_scope: 'lifetime_once',
    event_type: 'order_paid',
  });

  const fetchTriggers = async () => {
    if (!managedClientId) return;
    try {
      setTriggerLoading(true);
      const resp = await keysListTriggers({ managed_client_id: managedClientId });
      const list = resp?.data?.triggers || [];
      setTriggers(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error('載入觸發條件失敗:', e);
      setTriggers([]);
    } finally {
      setTriggerLoading(false);
    }
  };

  const fetchAllBatches = async () => {
    if (!managedClientId) return;
    try {
      setBatchLoading(true);
      const resp = await keysListBatches({ page: 1, page_size: 100, managed_client_id: managedClientId });
      const rows = resp?.data?.batches || resp?.batches || resp?.data?.results || resp?.results || [];
      const batchList = Array.isArray(rows) ? rows : [];
      // 對 ACHIEVEMENT 批次補全獎勵資訊（列表 API 不含 action_json / points / coins / tokens）
      const achievementRows = batchList.filter((b: any) => String(b.key_type || b.mode || '').toUpperCase() === 'ACHIEVEMENT');
      if (achievementRows.length > 0) {
        const details = await Promise.allSettled(
          achievementRows.map((b: any) => keysGetBatchDetail(b.id))
        );
        details.forEach((result, idx) => {
          if (result.status === 'fulfilled' && result.value) {
            const detail = result.value?.data?.batch || result.value?.batch || result.value?.data || result.value;
            if (detail && typeof detail === 'object') {
              Object.assign(achievementRows[idx], detail);
            }
          }
        });
      }
      setAllBatches(batchList);
    } catch {
      setAllBatches([]);
    } finally {
      setBatchLoading(false);
    }
  };

  // 派生 ACHIEVEMENT 批次（供建立表單下拉選擇）
  const achievementBatches = useMemo(
    () => allBatches.filter((b: any) => String(b.key_type || b.mode || '').toUpperCase() === 'ACHIEVEMENT'),
    [allBatches]
  );

  // 取得某 batch 的獎勵資訊：先查 allBatches，再查 batchRewardCache
  const getBatchForReward = (batchId: number): any => {
    return allBatches.find((b: any) => b.id === batchId) || batchRewardCache[batchId] || null;
  };

  // 觸發列表載入完成後，對找不到獎勵資訊的 batch 補查詳情
  const enrichMissingBatchRewards = async (triggerList: KeyTriggerItem[]) => {
    if (!managedClientId) return;
    const missingIds = new Set<number>();
    triggerList.forEach((t) => {
      const found = allBatches.find((b: any) => b.id === t.batch_id);
      if (!found && !batchRewardCache[t.batch_id]) {
        missingIds.add(t.batch_id);
      }
    });
    if (missingIds.size === 0) return;
    // 用觸發詳情 API 補全（會回傳完整 batch 物件）
    const newCache: Record<number, any> = {};
    await Promise.all(
      Array.from(missingIds).map(async (batchId) => {
        // 從 triggerList 找一個屬於該 batch 的 trigger，用其 id 查詳情
        const trigger = triggerList.find((t) => t.batch_id === batchId);
        if (!trigger) return;
        try {
          const detail = await keysGetTriggerDetail(trigger.id, { managed_client_id: managedClientId! });
          if (detail?.data?.batch) {
            newCache[batchId] = detail.data.batch;
          }
        } catch { /* 靜默忽略 */ }
      })
    );
    if (Object.keys(newCache).length > 0) {
      setBatchRewardCache((prev) => ({ ...prev, ...newCache }));
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTriggers();
      fetchAllBatches();
      setCreating(false);
      setSelectedBatchId('');
      setBatchRewardCache({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, managedClientId]);

  // 當 triggers 或 allBatches 變化後，嘗試補全遺漏的獎勵資訊
  useEffect(() => {
    if (triggers.length > 0 && allBatches.length >= 0) {
      enrichMissingBatchRewards(triggers);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggers, allBatches]);

  const resetForm = () => {
    setNewTrigger({
      trigger_type: 'new_member',
      min_amount: 0,
      trigger_at: 'card_created',
      achievement_condition_type: 'first_purchase',
      achievement_condition_value: 0,
      reward_scope: 'lifetime_once',
      event_type: 'order_paid',
    });
    setSelectedBatchId('');
  };

  // 批次建立成功回呼
  const handleBatchCreated = async (result: any) => {
    await fetchAllBatches();
    const newId = result?.data?.batch?.id || result?.data?.id;
    if (newId) setSelectedBatchId(newId);
  };

  // 當前選中批次的獎勵摘要
  const selectedBatchInfo = useMemo(() => {
    if (!selectedBatchId) return null;
    return achievementBatches.find((b: any) => b.id === Number(selectedBatchId)) || null;
  }, [selectedBatchId, achievementBatches]);

  const handleCreate = async () => {
    if (!managedClientId) return;
    if (!selectedBatchId) {
      showError('請選擇要綁定的金鑰批次');
      return;
    }
    const payload: KeyTriggerCreatePayload = {
      managed_client_id: managedClientId,
      batch_id: Number(selectedBatchId),
      trigger_type: newTrigger.trigger_type,
    };
    // 依觸發類型只傳該類型專用欄位
    if (newTrigger.trigger_type === 'order_amount') {
      if (!newTrigger.min_amount || newTrigger.min_amount <= 0) {
        showError('請輸入有效的最低金額');
        return;
      }
      payload.min_amount = newTrigger.min_amount;
    } else if (newTrigger.trigger_type === 'new_member') {
      payload.trigger_at = newTrigger.trigger_at;
    } else if (newTrigger.trigger_type === 'achievement') {
      payload.achievement_condition_type = newTrigger.achievement_condition_type;
      payload.achievement_condition_value = newTrigger.achievement_condition_value;
      payload.reward_scope = newTrigger.reward_scope;
      payload.event_type = newTrigger.event_type || undefined;
    }
    try {
      const result = await keysCreateTrigger(payload);
      if (result?.success) {
        showSuccess('觸發條件建立成功');
        setCreating(false);
        resetForm();
        fetchTriggers();
      } else {
        showError(result?.error || '建立失敗');
      }
    } catch (e: any) {
      showError(e?.response?.data?.error || '建立觸發條件失敗');
    }
  };

  const handleToggle = async (triggerId: number, currentActive: boolean) => {
    if (!managedClientId) return;
    try {
      await keysUpdateTrigger(triggerId, { managed_client_id: managedClientId, is_active: !currentActive });
      fetchTriggers();
    } catch (e: any) {
      showError(e?.response?.data?.error || '更新失敗');
    }
  };

  const handleDelete = async (triggerId: number) => {
    if (!managedClientId) return;
    if (!window.confirm('確定要刪除此觸發條件？此操作無法復原。')) return;
    try {
      await keysDeleteTrigger(triggerId, { managed_client_id: managedClientId });
      showSuccess('已刪除觸發條件');
      fetchTriggers();
    } catch (e: any) {
      showError(e?.response?.data?.error || '刪除失敗');
    }
  };

  if (!isOpen) return null;

  return (<>
    {createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[2000] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">成就觸發</h3>
            {managedClientName && <p className="text-sm text-gray-500 mt-0.5">{managedClientName}</p>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <i className="ri-close-line text-xl" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* 觸發條件列表 */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700">已建立的觸發條件</h4>
              <button
                onClick={() => { setCreating(!creating); if (!creating) resetForm(); }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${creating ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : `${AI_COLORS.button}`}`}
              >
                <Plus size={14} />
                {creating ? '取消' : '新增條件'}
              </button>
            </div>

            {triggerLoading ? (
              <div className="flex items-center justify-center py-8 text-gray-400">
                <i className="ri-loader-4-line animate-spin text-xl mr-2" />
                載入中...
              </div>
            ) : triggers.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                尚未建立任何觸發條件
              </div>
            ) : (
              <div className="space-y-2">
                {triggers.map((t) => {
                  const typeLabel = t.trigger_type === 'order_amount' ? '滿額觸發' : t.trigger_type === 'new_member' ? '新會員觸發' : t.trigger_type === 'product_purchase' ? '購買觸發' : '成就觸發';
                  // 從 allBatches 或 batchRewardCache 取得完整 batch 資料
                  const matchedBatch = getBatchForReward(t.batch_id);
                  const rewardText = getBatchRewardSummary(matchedBatch);
                  // 將 condition_summary 翻譯成中文
                  const conditionMap: Record<string, string> = {
                    card_created: '首次註冊',
                    first_paid_order: '首次付費訂單',
                    first_purchase: '首次消費',
                    order_total_amount: '累計消費金額',
                    order_count: '累計訂單數',
                  };
                  const rawSummary = t.condition_summary || '—';
                  const conditionText = Object.entries(conditionMap).reduce(
                    (text, [key, label]) => text.replace(new RegExp(key, 'g'), label),
                    rawSummary
                  );
                  return (
                    <div key={t.id} className={`flex items-center justify-between p-3 rounded-xl border ${t.is_active ? 'border-green-200 bg-green-50/50' : 'border-gray-200 bg-gray-50'}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                            t.trigger_type === 'order_amount' ? 'bg-blue-100 text-blue-700' :
                            t.trigger_type === 'new_member' ? 'bg-purple-100 text-purple-700' :
                            t.trigger_type === 'product_purchase' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {typeLabel}
                          </span>
                          <span className="text-xs text-gray-400 truncate">{t.batch_title}</span>
                          <span className={`text-xs ${t.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                            {t.is_active ? '啟用中' : '已停用'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1 truncate">{conditionText}</p>
                        {rewardText && (
                          <p className="text-xs text-orange-600 mt-0.5">發送：{rewardText}</p>
                        )}
                        {t.trigger_type === 'achievement' && t.reward_scope && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            獎勵範圍：{t.reward_scope === 'lifetime_once' ? '終身一次' : '區間一次'}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 ml-3 flex-shrink-0">
                        <button
                          onClick={() => handleToggle(t.id, t.is_active)}
                          className={`p-1.5 rounded-lg transition-colors ${t.is_active ? 'text-green-600 hover:bg-green-100' : 'text-gray-400 hover:bg-gray-200'}`}
                          title={t.is_active ? '停用' : '啟用'}
                        >
                          <Power size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="刪除"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 新增觸發條件表單 */}
          {creating && (
            <div className="border border-orange-200 bg-orange-50/30 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">新增觸發條件</h4>

              {/* 綁定批次 */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-600">綁定金鑰批次 *</label>
                  <button
                    type="button"
                    onClick={() => setShowBatchCreate(true)}
                    className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                  >
                    + 新增批次
                  </button>
                </div>
                {batchLoading ? (
                  <div className="text-sm text-gray-400">載入批次中...</div>
                ) : achievementBatches.length === 0 ? (
                  <div className="text-sm text-gray-400">尚無條件觸發類型的金鑰批次，請點擊上方新增</div>
                ) : (
                  <>
                    <select
                      value={selectedBatchId}
                      onChange={(e) => setSelectedBatchId(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm"
                    >
                      <option value="">請選擇批次</option>
                      {achievementBatches.map((b: any) => {
                        const reward = getBatchRewardSummary(b);
                        const label = b.title || b.batch_title || `批次 #${b.id}`;
                        return (
                          <option key={b.id} value={b.id}>{label}{reward ? ` (${reward})` : ''}</option>
                        );
                      })}
                    </select>
                    {selectedBatchInfo && (
                      <div className="mt-1.5 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg text-xs text-gray-600">
                        <span className="font-medium text-orange-700">觸發時將發送：</span>{' '}
                        {getBatchRewardSummary(selectedBatchInfo) || '（無贈與內容）'}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* 觸發類型 */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-600 mb-1.5">觸發類型</label>
                <div className="flex items-center gap-3">
                  {([
                    { value: 'new_member', label: '新會員觸發' },
                    { value: 'order_amount', label: '滿額觸發' },
                    { value: 'achievement', label: '成就觸發' },
                  ] as { value: TriggerType; label: string }[]).map((opt) => (
                    <label key={opt.value} className="inline-flex items-center gap-1.5 text-sm cursor-pointer">
                      <input
                        type="radio"
                        checked={newTrigger.trigger_type === opt.value}
                        onChange={() => setNewTrigger({ ...newTrigger, trigger_type: opt.value })}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* 條件欄位 - 依 trigger_type 動態顯示 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                {newTrigger.trigger_type === 'order_amount' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">滿額門檻（元）</label>
                    <input
                      type="number"
                      value={newTrigger.min_amount}
                      onChange={(e) => setNewTrigger({ ...newTrigger, min_amount: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm"
                      min={0}
                      placeholder="例如：1000"
                    />
                  </div>
                )}

                {newTrigger.trigger_type === 'new_member' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">觸發時機</label>
                    <select
                      value={newTrigger.trigger_at}
                      onChange={(e) => setNewTrigger({ ...newTrigger, trigger_at: e.target.value as 'first_paid_order' | 'card_created' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm"
                    >
                      <option value="card_created">首次註冊</option>
                      <option value="first_paid_order">首次付費訂單</option>
                    </select>
                  </div>
                )}

                {newTrigger.trigger_type === 'achievement' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">成就條件類型</label>
                      <select
                        value={newTrigger.achievement_condition_type}
                        onChange={(e) => setNewTrigger({ ...newTrigger, achievement_condition_type: e.target.value as AchievementConditionType })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm"
                      >
                        <option value="order_total_amount">累計消費金額</option>
                        <option value="order_count">累計訂單數</option>
                        <option value="first_purchase">首次消費</option>
                      </select>
                    </div>
                    {newTrigger.achievement_condition_type !== 'first_purchase' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          {newTrigger.achievement_condition_type === 'order_total_amount' ? '目標金額' : '目標次數'}
                        </label>
                        <input
                          type="number"
                          value={newTrigger.achievement_condition_value}
                          onChange={(e) => setNewTrigger({ ...newTrigger, achievement_condition_value: Number(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm"
                          min={0}
                          placeholder={newTrigger.achievement_condition_type === 'order_total_amount' ? '例如：5000' : '例如：10'}
                        />
                      </div>
                    )}
                    {/* 獎勵範圍 - 僅成就觸發使用 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">獎勵範圍</label>
                      <select
                        value={newTrigger.reward_scope}
                        onChange={(e) => setNewTrigger({ ...newTrigger, reward_scope: e.target.value as 'lifetime_once' | 'period_once' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm"
                      >
                        <option value="lifetime_once">終身一次</option>
                        <option value="period_once">區間一次</option>
                      </select>
                    </div>
                  </>
                )}
              </div>

              {/* 建立按鈕 */}
              <div className="flex justify-end mt-4">
                <button
                  onClick={handleCreate}
                  disabled={!selectedBatchId || achievementBatches.length === 0}
                  className={`px-5 py-2 rounded-lg text-sm font-medium ${AI_COLORS.button} disabled:bg-gray-300 disabled:cursor-not-allowed`}
                >
                  建立觸發條件
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-5 py-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            關閉
          </button>
        </div>
      </div>
    </div>,
    document.body
  )}
  <KeysManagerModal
    isOpen={showBatchCreate}
    onClose={() => setShowBatchCreate(false)}
    onCreated={handleBatchCreated}
    managedClientId={managedClientId}
    managedClientName={managedClientName}
    lockedMode="achievement"
  />
  </>);
};

export default TriggerManagerModal;
