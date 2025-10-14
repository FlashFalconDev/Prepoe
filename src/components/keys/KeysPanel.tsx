import React, { useEffect, useState } from 'react';
import { AI_COLORS } from '../../constants/colors';
import { keysListBatches } from '../../config/api';

interface KeysPanelProps {
  managedClientId?: number;
  onCreate: () => void;
}

const KeysPanel: React.FC<KeysPanelProps> = ({ managedClientId, onCreate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [batches, setBatches] = useState<any[]>([]);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await keysListBatches({ page: 1, page_size: 10, managed_client_id: managedClientId });
      setBatches(data?.data?.results || data?.results || data?.batches || []);
    } catch (e: any) {
      setError(e?.message || '讀取失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [managedClientId]);

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h4 className="font-semibold text-gray-900">已建立列表</h4>
        <button onClick={onCreate} className={`px-3 py-2 rounded-lg ${AI_COLORS.button}`}>建立金鑰</button>
      </div>
      <div className="p-4">
        {loading ? (
          <div className="text-center text-gray-500">讀取中...</div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : batches.length === 0 ? (
          <div className="text-center text-gray-500">尚未建立任何批次</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {batches.map((b: any, idx: number) => (
              <div key={b.id || idx} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{b.title || b.name || `批次 ${b.id}`}</div>
                  <div className="text-sm text-gray-500">模式：{b.mode || b.batch_type}、建立時間：{b.created_at || b.mdt_add || '-'}</div>
                </div>
                <div className="text-sm text-gray-600">可用：{b.remaining ?? b.available ?? '-'}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default KeysPanel;


