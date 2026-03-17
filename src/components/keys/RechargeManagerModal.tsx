import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AI_COLORS } from '../../constants/colors';
import {
  RechargeItem, RechargeItemCreatePayload,
  rechargeListItems, rechargeCreateItem, rechargeToggleActive,
  KeyTriggerCreatePayload, KeyTriggerItem,
  keysCreateTrigger, keysListTriggers, keysListBatches,
  keysGetBatchDetail, keysGetTriggerDetail, keysUpdateTrigger, keysDeleteTrigger,
} from '../../config/api';
import { Plus, Trash2, Power, Zap, Package } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import KeysManagerModal from './KeysManagerModal';

/** 從批次資料中提取贈與摘要文字 */
const getBatchRewardSummary = (batch: any): string => {
  if (!batch) return '';
  const parts: string[] = [];
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

interface RechargeManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  managedClientId?: number;
  managedClientName?: string;
}

const RechargeManagerModal: React.FC<RechargeManagerModalProps> = ({
  isOpen, onClose, managedClientId, managedClientName,
}) => {
  const { showError, showSuccess } = useToast();

  // 商品列表
  const [items, setItems] = useState<RechargeItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  // 新增商品表單
  const [creating, setCreating] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', base_price: 0, description: '' });
  const [submitting, setSubmitting] = useState(false);

  // 觸發設定
  const [selectedItemForTrigger, setSelectedItemForTrigger] = useState<RechargeItem | null>(null);
  const [existingTriggers, setExistingTriggers] = useState<KeyTriggerItem[]>([]);
  const [triggersLoading, setTriggersLoading] = useState(false);

  // 批次相關
  const [allBatches, setAllBatches] = useState<any[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<number | ''>('');
  const [batchRewardCache, setBatchRewardCache] = useState<Record<number, any>>({});
  const [showKeysManager, setShowKeysManager] = useState(false);

  // ---- 資料載入 ----

  const fetchItems = async () => {
    try {
      setItemsLoading(true);
      const resp = await rechargeListItems(managedClientId ? { managed_client_id: managedClientId } : undefined);
      const list = resp?.data?.items || resp?.items || resp?.data || [];
      setItems(Array.isArray(list) ? list : []);
    } catch {
      setItems([]);
    } finally {
      setItemsLoading(false);
    }
  };

  const fetchTriggers = async () => {
    if (!managedClientId) return;
    try {
      setTriggersLoading(true);
      const resp = await keysListTriggers({ managed_client_id: managedClientId, trigger_type: 'product_purchase' });
      const list = resp?.data?.triggers || [];
      setExistingTriggers(Array.isArray(list) ? list : []);
    } catch {
      setExistingTriggers([]);
    } finally {
      setTriggersLoading(false);
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

  const achievementBatches = useMemo(
    () => allBatches.filter((b: any) => String(b.key_type || b.mode || '').toUpperCase() === 'ACHIEVEMENT'),
    [allBatches]
  );

  const getBatchForReward = (batchId: number): any => {
    return allBatches.find((b: any) => b.id === batchId) || batchRewardCache[batchId] || null;
  };

  // 補全遺漏的獎勵資訊
  const enrichMissingBatchRewards = async (triggerList: KeyTriggerItem[]) => {
    if (!managedClientId) return;
    const missingIds = new Set<number>();
    triggerList.forEach((t) => {
      if (!allBatches.find((b: any) => b.id === t.batch_id) && !batchRewardCache[t.batch_id]) {
        missingIds.add(t.batch_id);
      }
    });
    if (missingIds.size === 0) return;
    const newCache: Record<number, any> = {};
    await Promise.all(
      Array.from(missingIds).map(async (batchId) => {
        const trigger = triggerList.find((t) => t.batch_id === batchId);
        if (!trigger) return;
        try {
          const detail = await keysGetTriggerDetail(trigger.id, { managed_client_id: managedClientId! });
          if (detail?.data?.batch) newCache[batchId] = detail.data.batch;
        } catch { /* 靜默忽略 */ }
      })
    );
    if (Object.keys(newCache).length > 0) {
      setBatchRewardCache((prev) => ({ ...prev, ...newCache }));
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchItems();
      fetchTriggers();
      fetchAllBatches();
      setCreating(false);
      setSelectedItemForTrigger(null);
      setSelectedBatchId('');
      setBatchRewardCache({});
      setNewItem({ name: '', base_price: 0, description: '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, managedClientId]);

  useEffect(() => {
    if (existingTriggers.length > 0) {
      enrichMissingBatchRewards(existingTriggers);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingTriggers, allBatches]);

  // 選中批次的摘要
  const selectedBatchInfo = useMemo(() => {
    if (!selectedBatchId) return null;
    return achievementBatches.find((b: any) => b.id === Number(selectedBatchId)) || null;
  }, [selectedBatchId, achievementBatches]);

  // ---- 商品操作 ----

  const handleCreateItem = async () => {
    if (!managedClientId) { showError('缺少 managed_client_id，無法建立儲值商品'); return; }
    if (!newItem.name.trim()) { showError('請輸入商品名稱'); return; }
    if (newItem.base_price <= 0) { showError('價格必須大於 0'); return; }
    try {
      setSubmitting(true);
      const payload: RechargeItemCreatePayload = {
        managed_client_id: managedClientId,
        name: newItem.name.trim(),
        base_price: newItem.base_price,
        description: newItem.description.trim(),
      };
      const resp = await rechargeCreateItem(payload);
      if (resp?.success || resp?.data) {
        showSuccess('儲值商品建立成功');
        setCreating(false);
        setNewItem({ name: '', base_price: 0, description: '' });
        fetchItems();
      } else {
        showError(resp?.error || '建立失敗');
      }
    } catch (e: any) {
      showError(e?.response?.data?.error || '建立商品失敗');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleItem = async (item: RechargeItem) => {
    if (!managedClientId) return;
    try {
      const resp = await rechargeToggleActive(item.item_pk, !item.is_active, managedClientId);
      if (resp?.success) {
        showSuccess(item.is_active ? '已停用' : '已啟用');
        fetchItems();
      } else {
        showError(resp?.error || '更新失敗');
      }
    } catch (e: any) {
      showError(e?.response?.data?.error || '更新失敗');
    }
  };

  // ---- 觸發操作 ----

  const handleCreateTrigger = async () => {
    if (!managedClientId || !selectedItemForTrigger || !selectedBatchId) return;
    try {
      const payload: KeyTriggerCreatePayload = {
        managed_client_id: managedClientId,
        batch_id: Number(selectedBatchId),
        trigger_type: 'product_purchase',
        item_info_ids: [selectedItemForTrigger.item_pk],
      };
      const result = await keysCreateTrigger(payload);
      if (result?.success) {
        showSuccess('購買觸發建立成功');
        setSelectedItemForTrigger(null);
        setSelectedBatchId('');
        fetchTriggers();
      } else {
        showError(result?.error || '建立觸發失敗');
      }
    } catch (e: any) {
      showError(e?.response?.data?.error || '建立觸發失敗');
    }
  };

  const handleToggleTrigger = async (triggerId: number, currentActive: boolean) => {
    if (!managedClientId) return;
    try {
      await keysUpdateTrigger(triggerId, { managed_client_id: managedClientId, is_active: !currentActive });
      fetchTriggers();
    } catch (e: any) {
      showError(e?.response?.data?.error || '更新失敗');
    }
  };

  const handleDeleteTrigger = async (triggerId: number) => {
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

  const handleBatchCreated = async (result: any) => {
    await fetchAllBatches();
    const newId = result?.data?.batch?.id || result?.data?.id;
    if (newId) setSelectedBatchId(newId);
  };

  // 取得某商品的觸發條件
  const getTriggersForItem = (itemId: number) => {
    return existingTriggers.filter((t) => {
      const ids = t.item_info_ids || t.condition_json?.item_info_ids || [];
      return Array.isArray(ids) && ids.includes(itemId);
    });
  };

  if (!isOpen) return null;

  return (<>
    {createPortal(
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[2000] flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">儲值商品管理</h3>
              {managedClientName && <p className="text-sm text-gray-500 mt-0.5">{managedClientName}</p>}
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <i className="ri-close-line text-xl" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5">

            {/* 商品列表區 */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-700">儲值商品列表</h4>
                <button
                  onClick={() => { setCreating(!creating); if (creating) setNewItem({ name: '', base_price: 0, description: '' }); }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${creating ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : AI_COLORS.button}`}
                >
                  <Plus size={14} />
                  {creating ? '取消' : '新增商品'}
                </button>
              </div>

              {itemsLoading ? (
                <div className="flex items-center justify-center py-8 text-gray-400">
                  <i className="ri-loader-4-line animate-spin text-xl mr-2" />
                  載入中...
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  <Package size={32} className="mx-auto mb-2 text-gray-300" />
                  尚未建立任何儲值商品
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map((item) => {
                    const itemTriggers = getTriggersForItem(item.item_pk);
                    return (
                      <div key={item.item_pk} className={`p-3 rounded-xl border ${item.is_active ? 'border-green-200 bg-green-50/50' : 'border-gray-200 bg-gray-50'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm text-gray-900">{item.name}</span>
                              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                NT$ {Number(item.base_price).toLocaleString()}
                              </span>
                              <span className={`text-xs ${item.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                                {item.is_active ? '啟用中' : '已停用'}
                              </span>
                            </div>
                            {item.description && (
                              <p className="text-xs text-gray-500 mt-1 truncate">{item.description}</p>
                            )}
                            {item.sku && (
                              <p className="text-xs text-gray-400 mt-0.5">SKU: {item.sku}</p>
                            )}
                            {/* 已綁定觸發 */}
                            {itemTriggers.length > 0 && (
                              <div className="mt-1.5 space-y-1">
                                {itemTriggers.map((t) => {
                                  const matchedBatch = getBatchForReward(t.batch_id);
                                  const rewardText = getBatchRewardSummary(matchedBatch);
                                  return (
                                    <div key={t.id} className="flex items-center gap-2 text-xs">
                                      <span className="inline-block px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 font-medium">觸發</span>
                                      <span className="text-gray-600 truncate">{t.batch_title}</span>
                                      {rewardText && <span className="text-orange-600">({rewardText})</span>}
                                      <span className={t.is_active ? 'text-green-500' : 'text-gray-400'}>
                                        {t.is_active ? '●' : '○'}
                                      </span>
                                      <button
                                        onClick={() => handleToggleTrigger(t.id, t.is_active)}
                                        className="text-gray-400 hover:text-orange-600"
                                        title={t.is_active ? '停用觸發' : '啟用觸發'}
                                      >
                                        <Power size={12} />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteTrigger(t.id)}
                                        className="text-gray-400 hover:text-red-500"
                                        title="刪除觸發"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 ml-3 flex-shrink-0">
                            <button
                              onClick={() => {
                                if (selectedItemForTrigger?.item_pk === item.item_pk) {
                                  setSelectedItemForTrigger(null);
                                } else {
                                  setSelectedItemForTrigger(item);
                                  setSelectedBatchId('');
                                }
                              }}
                              className={`p-1.5 rounded-lg transition-colors ${
                                selectedItemForTrigger?.item_pk === item.item_pk
                                  ? 'text-orange-600 bg-orange-100'
                                  : 'text-orange-400 hover:bg-orange-50 hover:text-orange-600'
                              }`}
                              title="設定購買觸發"
                            >
                              <Zap size={16} />
                            </button>
                            <button
                              onClick={() => handleToggleItem(item)}
                              className={`p-1.5 rounded-lg transition-colors ${item.is_active ? 'text-green-600 hover:bg-green-100' : 'text-gray-400 hover:bg-gray-200'}`}
                              title={item.is_active ? '停用' : '啟用'}
                            >
                              <Power size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 新增商品表單 */}
            {creating && (
              <div className="border border-orange-200 bg-orange-50/30 rounded-xl p-4 mb-5">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">新增儲值商品</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">商品名稱 *</label>
                    <input
                      type="text"
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm"
                      placeholder="例如：VIP 儲值方案"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">售價（NT$）*</label>
                    <input
                      type="number"
                      value={newItem.base_price || ''}
                      onChange={(e) => setNewItem({ ...newItem, base_price: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm"
                      placeholder="例如：299"
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">描述</label>
                    <textarea
                      value={newItem.description}
                      onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm resize-none"
                      rows={2}
                      placeholder="商品描述（選填）"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handleCreateItem}
                      disabled={submitting}
                      className={`px-5 py-2 rounded-lg text-sm font-medium ${AI_COLORS.button} disabled:bg-gray-300 disabled:cursor-not-allowed`}
                    >
                      {submitting ? '建立中...' : '建立商品'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 觸發設定面板 */}
            {selectedItemForTrigger && (
              <div className="border border-orange-200 bg-orange-50/30 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-1">設定購買觸發</h4>
                <p className="text-xs text-gray-500 mb-3">
                  購買「<span className="font-medium text-gray-700">{selectedItemForTrigger.name}</span>」後自動發放獎勵
                </p>

                {/* 綁定批次 */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-600">綁定金鑰批次 *</label>
                    <button
                      type="button"
                      onClick={() => setShowKeysManager(true)}
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
                          <span className="font-medium text-orange-700">購買後將發送：</span>{' '}
                          {getBatchRewardSummary(selectedBatchInfo) || '（無贈與內容）'}
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => { setSelectedItemForTrigger(null); setSelectedBatchId(''); }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleCreateTrigger}
                    disabled={!selectedBatchId || achievementBatches.length === 0}
                    className={`px-5 py-2 rounded-lg text-sm font-medium ${AI_COLORS.button} disabled:bg-gray-300 disabled:cursor-not-allowed`}
                  >
                    建立購買觸發
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
      isOpen={showKeysManager}
      onClose={() => setShowKeysManager(false)}
      onCreated={handleBatchCreated}
      managedClientId={managedClientId}
      managedClientName={managedClientName}
      lockedMode="achievement"
    />
  </>);
};

export default RechargeManagerModal;
