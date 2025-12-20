import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Search, UserCheck, UserX, Download } from 'lucide-react';
import { getItemEventParticipants, checkInItemEventParticipant, type EventParticipantsResponse, type ItemEventParticipant } from '../config/api';
import { useToast } from '../hooks/useToast';
import { AI_COLORS } from '../constants/colors';

interface EventParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: number;
  eventName: string;
}

const EventParticipantsModal: React.FC<EventParticipantsModalProps> = ({ isOpen, onClose, eventId, eventName }) => {
  const [data, setData] = useState<EventParticipantsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [checkInFilter, setCheckInFilter] = useState<'all' | 'checked_in' | 'not_checked_in'>('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [selectedParticipant, setSelectedParticipant] = useState<ItemEventParticipant | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const { showError, showSuccess } = useToast();

  // 防止重複請求
  const isLoadingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadParticipants = useCallback(async () => {
    // 如果正在載入中，跳過
    if (isLoadingRef.current) return;

    // 取消前一個請求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      isLoadingRef.current = true;
      setLoading(true);
      const params: any = {
        page: currentPage,
        page_size: pageSize
      };

      if (checkInFilter !== 'all') params.check_in_status = checkInFilter;
      if (orderStatusFilter !== 'all') params.order_status = orderStatusFilter;
      if (searchQuery) params.search = searchQuery;

      const response = await getItemEventParticipants(eventId, params);
      setData(response);
    } catch (error: any) {
      // 忽略取消的請求錯誤
      if (error.name === 'AbortError' || error.name === 'CanceledError') return;
      console.error('載入參與者錯誤:', error);
      showError('載入失敗', error.message || '載入參與者列表時發生錯誤');
    } finally {
      isLoadingRef.current = false;
      setLoading(false);
    }
  }, [eventId, currentPage, pageSize, checkInFilter, orderStatusFilter, searchQuery, showError]);

  useEffect(() => {
    if (isOpen && eventId) {
      loadParticipants();
    }

    // 清理函數：組件卸載或依賴變更時取消請求
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isOpen, eventId, currentPage, pageSize, checkInFilter, orderStatusFilter, searchQuery, loadParticipants]);

  const handleCheckIn = async (participantId: number) => {
    try {
      await checkInItemEventParticipant(participantId, {
        check_in_method: 'manual',
        operator: '管理員',
        notes: '手動報到'
      });
      showSuccess('報到成功');
      loadParticipants();
    } catch (error: any) {
      showError('報到失敗', error.message || '報到時發生錯誤');
    }
  };

  const formatDateTime = (dateTime: string) => {
    try {
      return new Date(dateTime).toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateTime;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const exportToCSV = () => {
    if (!data?.data?.participants || !data.data.participants.length) return;

    // 收集所有動態表單欄位（從所有參與者中提取唯一的欄位標籤）
    const dynamicFieldLabels: string[] = [];
    const dynamicFieldIds: (string | number)[] = [];

    data.data.participants.forEach(p => {
      if (p.form_data) {
        p.form_data.forEach(field => {
          // 排除 is_primary_contact，因為已經有獨立欄位
          if (field.field_id !== 'is_primary_contact' && !dynamicFieldIds.includes(field.field_id)) {
            dynamicFieldIds.push(field.field_id);
            dynamicFieldLabels.push(field.field_label);
          }
        });
      }
    });

    // 建立標題列：基本資訊 + 動態表單欄位 + 訂單資訊 + 報到狀態
    const headers = [
      '姓名',
      '電子郵件',
      '電話',
      '綁定碼',
      '主要聯絡人',
      ...dynamicFieldLabels,
      '訂單編號',
      '訂單狀態',
      '推薦者ID',
      '單價',
      '小計',
      '參與人數',
      '備註',
      '報到狀態',
      '報到時間',
      '報名時間'
    ];

    const rows = data.data.participants.map(p => {
      // 取得動態欄位的值
      const dynamicValues = dynamicFieldIds.map(fieldId => {
        const field = p.form_data?.find(f => f.field_id === fieldId);
        return field?.display_value || '';
      });

      // 取得主要聯絡人狀態
      const isPrimaryContact = p.form_data?.find(f => f.field_id === 'is_primary_contact');
      const isPrimaryContactValue = isPrimaryContact?.value === 1 ? '是' : '否';

      // 取得訂單詳細資訊
      const orderDetail = p.event_order_detail;
      const unitPrice = orderDetail?.unit_price ? `$${orderDetail.unit_price.toLocaleString()}` : '';
      const subtotal = orderDetail?.subtotal ? `$${orderDetail.subtotal.toLocaleString()}` : '';
      const participantCount = orderDetail?.participant_count?.toString() || '';
      const remark = orderDetail?.options_json?.remark || '';
      const referrerId = p.order_info?.referrer_member_card_id?.toString() || '';

      return [
        p.name,
        p.email,
        p.phone,
        p.binding_code,
        isPrimaryContactValue,
        ...dynamicValues,
        p.order_info?.sn || '',
        p.order_info?.status_display || '',
        referrerId,
        unitPrice,
        subtotal,
        participantCount,
        remark,
        p.is_checked_in ? '已報到' : '未報到',
        p.check_in_time ? formatDateTime(p.check_in_time) : '',
        formatDateTime(p.created_at)
      ];
    });

    // 處理 CSV 特殊字元（逗號、換行、引號）
    const escapeCSV = (cell: string) => {
      if (cell.includes(',') || cell.includes('\n') || cell.includes('"')) {
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return `"${cell}"`;
    };

    const csvContent = [
      headers.map(h => escapeCSV(h)).join(','),
      ...rows.map(row => row.map(cell => escapeCSV(String(cell))).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${eventName}_參與者名單_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* 標題列 */}
        <div className={`${AI_COLORS.bg} p-6 flex items-center justify-between`}>
          <div>
            <h3 className="text-xl font-semibold text-white">參與者管理</h3>
            <p className="text-sm text-white text-opacity-90 mt-1">{eventName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* 內容區域 */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading && !data && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${AI_COLORS.border} mx-auto mb-4`}></div>
                <p className="text-gray-600">載入中...</p>
              </div>
            </div>
          )}

          {data?.data && (
            <div className="space-y-4">
              {/* 統計卡片 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">總參與人數</div>
                  <div className="text-2xl font-bold text-blue-600">{data.data.statistics?.total_count || 0}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">已報到</div>
                  <div className="text-2xl font-bold text-green-600">{data.data.statistics?.checked_in_count || 0}</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">未報到</div>
                  <div className="text-2xl font-bold text-yellow-600">{data.data.statistics?.not_checked_in_count || 0}</div>
                </div>
                <div className={`${AI_COLORS.bgLight} rounded-lg p-4`}>
                  <div className="text-sm text-gray-600 mb-1">報到率</div>
                  <div className={`text-2xl font-bold ${AI_COLORS.text}`}>
                    {(data.data.statistics?.check_in_rate || 0).toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* 篩選和搜尋列 */}
              <div className="flex flex-col md:flex-row gap-4">
                {/* 搜尋框 */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="搜尋姓名、電子郵件或電話..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                {/* 報到狀態篩選 */}
                <select
                  value={checkInFilter}
                  onChange={(e) => {
                    setCheckInFilter(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">全部報到狀態</option>
                  <option value="checked_in">已報到</option>
                  <option value="not_checked_in">未報到</option>
                </select>

                {/* 訂單狀態篩選 */}
                <select
                  value={orderStatusFilter}
                  onChange={(e) => {
                    setOrderStatusFilter(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">全部訂單狀態</option>
                  <option value="paid">已付款</option>
                  <option value="pending">待付款</option>
                </select>

                {/* 每頁顯示數量 */}
                <select
                  value={pageSize}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setPageSize(value);
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value={20}>每頁 20 筆</option>
                  <option value={50}>每頁 50 筆</option>
                  <option value={100}>每頁 100 筆</option>
                  <option value={9999}>顯示全部</option>
                </select>

                {/* 匯出按鈕 */}
                <button
                  onClick={exportToCSV}
                  className={`px-4 py-2 ${AI_COLORS.button} text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2`}
                >
                  <Download size={18} />
                  匯出 CSV
                </button>
              </div>

              {/* 參與者列表 */}
              {!data.data.participants || data.data.participants.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <i className="ri-user-line text-6xl"></i>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">暫無參與者</h4>
                  <p className="text-gray-500">此活動尚未有參與者記錄</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          姓名
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          聯絡資訊
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          綁定碼
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          訂單資訊
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          報到狀態
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          建立時間
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.data.participants.map((participant) => (
                        <tr key={participant.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{participant.name}</div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm text-gray-900">{participant.email}</div>
                            <div className="text-sm text-gray-500">{participant.phone}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">{participant.binding_code}</code>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            {participant.order_info && (
                              <div>
                                <div className="text-sm font-medium text-gray-900">{participant.order_info.sn}</div>
                                <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(participant.order_info.status)}`}>
                                  {participant.order_info.status_display}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-center">
                            {participant.is_checked_in ? (
                              <div>
                                <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                                  <UserCheck size={16} />
                                  <span className="text-sm font-medium">已報到</span>
                                </div>
                                {participant.check_in_time && (
                                  <div className="text-xs text-gray-500">
                                    {formatDateTime(participant.check_in_time)}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-1 text-gray-400">
                                <UserX size={16} />
                                <span className="text-sm">未報到</span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDateTime(participant.created_at)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-2">
                              {!participant.is_checked_in && data.data.event?.use_check_in && (
                                <button
                                  onClick={() => handleCheckIn(participant.id)}
                                  className={`px-3 py-1 ${AI_COLORS.button} text-white text-sm rounded hover:opacity-90 transition-opacity`}
                                >
                                  手動報到
                                </button>
                              )}
                              {participant.form_data && participant.form_data.length > 0 && (
                                <button
                                  onClick={() => {
                                    setSelectedParticipant(participant);
                                    setShowDetailModal(true);
                                  }}
                                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:opacity-90 transition-opacity"
                                >
                                  查看詳情
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 分頁控制 */}
              {data.data.pagination && data.data.pagination.total_pages > 1 && (
                <div className="flex items-center justify-between border-t pt-4">
                  <div className="text-sm text-gray-500">
                    第 {data.data.pagination?.current_page || 1} 頁，共 {data.data.pagination?.total_pages || 1} 頁
                    （總計 {data.data.pagination?.total_count || 0} 筆）
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={!data.data.pagination?.has_previous}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      上一頁
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      disabled={!data.data.pagination?.has_next}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      下一頁
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 底部按鈕 */}
        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            關閉
          </button>
        </div>
      </div>

      {/* 參與者詳情彈窗 */}
      {showDetailModal && selectedParticipant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]" onClick={() => setShowDetailModal(false)}>
          <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="bg-blue-600 p-4 flex items-center justify-between rounded-t-xl sticky top-0 z-10">
              <h4 className="text-lg font-semibold text-white">參與者詳細資訊</h4>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1 text-white hover:bg-white hover:bg-opacity-20 rounded transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              {/* 基本資訊 */}
              <div className="mb-6">
                <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <i className="ri-user-line"></i>
                  基本資訊
                </h5>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">姓名:</span>
                    <span className="font-medium">{selectedParticipant.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">電子郵件:</span>
                    <span className="font-medium">{selectedParticipant.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">電話:</span>
                    <span className="font-medium">{selectedParticipant.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">綁定碼:</span>
                    <code className="bg-white px-2 py-1 rounded border">{selectedParticipant.binding_code}</code>
                  </div>
                </div>
              </div>

              {/* 表單填寫內容 */}
              {selectedParticipant.form_data && selectedParticipant.form_data.length > 0 && (
                <div className="mb-6">
                  <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <i className="ri-file-list-line"></i>
                    表單填寫內容
                  </h5>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    {selectedParticipant.form_data.map((field, index) => (
                      <div key={index} className="border-b border-gray-200 last:border-0 pb-3 last:pb-0">
                        <div className="text-sm text-gray-600 mb-1">{field.field_label}</div>
                        <div className="font-medium text-gray-900">{field.display_value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 訂單資訊 */}
              {selectedParticipant.order_info && (
                <div className="mb-6">
                  <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <i className="ri-shopping-cart-line"></i>
                    訂單資訊
                  </h5>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">訂單編號:</span>
                      <span className="font-medium">{selectedParticipant.order_info.sn}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">訂單狀態:</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedParticipant.order_info.status)}`}>
                        {selectedParticipant.order_info.status_display}
                      </span>
                    </div>
                    {selectedParticipant.order_info.referrer_member_card_id && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">推薦者ID:</span>
                        <span className="font-medium">{selectedParticipant.order_info.referrer_member_card_id}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">建立時間:</span>
                      <span className="font-medium">{formatDateTime(selectedParticipant.order_info.created_at)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 報到狀態 */}
              <div>
                <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <i className="ri-checkbox-circle-line"></i>
                  報到狀態
                </h5>
                <div className="bg-gray-50 rounded-lg p-4">
                  {selectedParticipant.is_checked_in ? (
                    <div>
                      <div className="flex items-center gap-2 text-green-600 mb-2">
                        <UserCheck size={20} />
                        <span className="font-medium">已報到</span>
                      </div>
                      {selectedParticipant.check_in_time && (
                        <div className="text-sm text-gray-600">
                          報到時間: {formatDateTime(selectedParticipant.check_in_time)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-400">
                      <UserX size={20} />
                      <span>尚未報到</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end sticky bottom-0 bg-white">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventParticipantsModal;
