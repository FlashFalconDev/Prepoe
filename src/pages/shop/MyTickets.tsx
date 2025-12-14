import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Ticket, Clock, ChevronLeft, Gift, Percent, Search,
  QrCode, X, AlertCircle, CheckCircle, Copy, ArrowRight,
  Send, Coins
} from 'lucide-react';
import { api, API_ENDPOINTS } from '../../config/api';
import { useToast } from '../../hooks/useToast';
import { useShopContext } from '../../components/ShopLayout';

// 票券項目資訊（嵌套物件）
interface EticketItem {
  id: number;
  name: string;
  ticket_type: 'discount' | 'exchange' | 'topup';
  ticket_type_display: string;
  discount_type: 'percentage' | 'fixed' | null;
  discount_value: string | null;
  topup_type: string | null;
  topup_amount: number | null;
  is_transferable: boolean;
}

// 會員持有的票券
interface MyTicket {
  id: number;
  ticket_number: string;
  qr_code_url: string;
  status: 'active' | 'used' | 'expired' | 'cancelled';
  status_display: string;
  eticket_item: EticketItem;
  valid_from: string;
  valid_until: string;
  source: string;
  source_display: string;
  transfer_count: number;
  can_transfer: boolean;
  used_at: string | null;
  used_order_sn: string | null;
  actual_discount_amount: string;
  created_at: string;
}

const MyTickets: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { refreshMemberCard } = useShopContext();

  // 從 URL 路徑解析 clientSid: /shop/:clientSid/my-tickets
  const clientSid = location.pathname.split('/')[2];

  const [tickets, setTickets] = useState<MyTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('active');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<MyTicket | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showUseModal, setShowUseModal] = useState(false);
  const [usingTicket, setUsingTicket] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState('');

  useEffect(() => {
    loadTickets();
  }, [clientSid, selectedStatus]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const params: any = {
        client_sid: clientSid,
      };
      if (selectedStatus !== 'all') {
        params.status = selectedStatus;
      }

      const response = await api.get(API_ENDPOINTS.MY_ETICKETS, { params });
      if (response.data.success) {
        setTickets(response.data.data || []);
      } else {
        showError(response.data.message || '載入票券失敗');
      }
    } catch (error: any) {
      console.error('載入票券失敗:', error);
      if (error.response?.status !== 401) {
        showError(error.response?.data?.message || '載入票券失敗');
      }
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  // 使用點數卡（topup類型票券）- 直接兌換
  const handleUseTopupTicket = async (ticket: MyTicket) => {
    if (ticket.eticket_item.ticket_type !== 'topup' || ticket.status !== 'active') return;

    try {
      setUsingTicket(ticket.ticket_number);
      const response = await api.post(API_ENDPOINTS.MY_ETICKET_USE(ticket.ticket_number), {
        client_sid: clientSid,
      });

      if (response.data.success) {
        showSuccess(response.data.message || '兌換成功');
        loadTickets();
        // 刷新會員卡資料（點數可能增加）
        refreshMemberCard();
      } else {
        showError(response.data.message || '兌換失敗');
      }
    } catch (error: any) {
      console.error('使用票券失敗:', error);
      showError(error.response?.data?.message || '使用失敗');
    } finally {
      setUsingTicket(null);
    }
  };

  // 使用兌換券 - 需要輸入驗證碼
  const handleUseExchangeTicket = async () => {
    if (!selectedTicket || selectedTicket.eticket_item.ticket_type !== 'exchange') return;

    try {
      setUsingTicket(selectedTicket.ticket_number);
      const response = await api.post(API_ENDPOINTS.MY_ETICKET_USE(selectedTicket.ticket_number), {
        client_sid: clientSid,
        verify_code: verifyCode,
      });

      if (response.data.success) {
        showSuccess(response.data.message || '兌換成功');
        setShowUseModal(false);
        setVerifyCode('');
        setSelectedTicket(null);
        loadTickets();
        // 刷新會員卡資料
        refreshMemberCard();
      } else {
        showError(response.data.message || '兌換失敗');
      }
    } catch (error: any) {
      console.error('使用票券失敗:', error);
      showError(error.response?.data?.message || '使用失敗');
    } finally {
      setUsingTicket(null);
    }
  };

  const getTicketTypeIcon = (type: string) => {
    switch (type) {
      case 'discount':
        return <Percent size={16} className="text-red-500" />;
      case 'exchange':
        return <Gift size={16} className="text-green-500" />;
      case 'topup':
        return <Coins size={16} className="text-yellow-500" />;
      default:
        return <Ticket size={16} className="text-gray-500" />;
    }
  };

  const getTicketBgGradient = (type: string, status: string) => {
    if (status !== 'active') {
      return 'from-gray-400 to-gray-500';
    }
    switch (type) {
      case 'discount':
        return 'from-red-500 to-pink-500';
      case 'exchange':
        return 'from-green-500 to-teal-500';
      case 'topup':
        return 'from-yellow-500 to-orange-500';
      default:
        return 'from-purple-500 to-pink-500';
    }
  };

  const getStatusBadge = (status: string, statusDisplay: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
            <CheckCircle size={12} />
            {statusDisplay}
          </span>
        );
      case 'used':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
            <CheckCircle size={12} />
            {statusDisplay}
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs">
            <AlertCircle size={12} />
            {statusDisplay}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">
            {statusDisplay}
          </span>
        );
    }
  };

  const getTicketValue = (ticket: MyTicket) => {
    const item = ticket.eticket_item;
    if (item.ticket_type === 'discount') {
      if (item.discount_type === 'fixed') {
        return `折抵 $${parseFloat(item.discount_value || '0').toFixed(0)}`;
      } else {
        const discountPercent = parseFloat(item.discount_value || '0');
        return `${(100 - discountPercent) / 10} 折`;
      }
    } else if (item.ticket_type === 'topup') {
      const typeLabel = item.topup_type === 'points' ? '點' : item.topup_type === 'coins' ? '金幣' : '';
      return `${item.topup_amount} ${typeLabel}`;
    } else if (item.ticket_type === 'exchange') {
      return '兌換券';
    }
    return '';
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const isExpiringSoon = (validUntil: string) => {
    if (!validUntil) return false;
    const now = new Date();
    const expiry = new Date(validUntil);
    const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 7 && daysLeft > 0;
  };

  const copyTicketNumber = (ticketNumber: string) => {
    navigator.clipboard.writeText(ticketNumber);
    showSuccess('票券號碼已複製');
  };

  const statusFilters = [
    { id: 'active', label: '可使用' },
    { id: 'used', label: '已使用' },
    { id: 'expired', label: '已過期' },
    { id: 'all', label: '全部' },
  ];

  const typeFilters = [
    { id: 'all', label: '全部', icon: Ticket },
    { id: 'discount', label: '折扣券', icon: Percent },
    { id: 'exchange', label: '兌換券', icon: Gift },
    { id: 'topup', label: '點數卡', icon: Coins },
  ];

  const filteredTickets = tickets.filter(ticket => {
    const name = ticket.eticket_item?.name || '';
    const number = ticket.ticket_number || '';
    const search = searchTerm.toLowerCase();
    const matchSearch = name.toLowerCase().includes(search) || number.toLowerCase().includes(search);
    const matchType = selectedType === 'all' || ticket.eticket_item?.ticket_type === selectedType;
    return matchSearch && matchType;
  });

  // 開啟使用 Modal
  const openUseModal = (ticket: MyTicket) => {
    setSelectedTicket(ticket);
    setVerifyCode('');
    if (ticket.eticket_item.ticket_type === 'exchange') {
      setShowUseModal(true);
    } else if (ticket.eticket_item.ticket_type === 'discount') {
      // 折扣券直接顯示 QR
      setShowQRModal(true);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* 標題列 */}
      <div className="sticky top-0 bg-white z-30 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/shop/${clientSid}/member`)}
            className="p-1.5 -ml-1.5 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft size={24} className="text-gray-600" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">我的票券</h1>
          <span className="ml-auto text-sm text-gray-500">{filteredTickets.length} 張</span>
        </div>
      </div>

      {/* 搜尋與篩選 */}
      <div className="sticky top-[57px] bg-gray-50 z-20 px-4 py-3 border-b border-gray-200">
        <div className="relative mb-3">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜尋票券..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* 類型篩選 */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {typeFilters.map((filter) => {
            const Icon = filter.icon;
            return (
              <button
                key={filter.id}
                onClick={() => setSelectedType(filter.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedType === filter.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-purple-300'
                }`}
              >
                <Icon size={14} />
                {filter.label}
              </button>
            );
          })}
        </div>

        {/* 狀態篩選 */}
        <div className="flex gap-2 overflow-x-auto pt-2 scrollbar-hide">
          {statusFilters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setSelectedStatus(filter.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedStatus === filter.id
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* 票券列表 */}
      <div className="flex-1 p-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden animate-pulse">
                <div className="h-24 bg-gray-200"></div>
                <div className="p-4">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredTickets.length > 0 ? (
          <div className="space-y-4">
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.ticket_number}
                className={`bg-white rounded-xl overflow-hidden shadow-sm ${
                  ticket.status === 'active' ? 'hover:shadow-md' : 'opacity-75'
                } transition-shadow`}
              >
                {/* 票券頭部 */}
                <div className={`bg-gradient-to-r ${getTicketBgGradient(ticket.eticket_item.ticket_type, ticket.status)} p-4 text-white relative overflow-hidden`}>
                  {/* 裝飾圓形 */}
                  <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full"></div>
                  <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-white/10 rounded-full"></div>

                  <div className="relative flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                          {getTicketTypeIcon(ticket.eticket_item.ticket_type)}
                          {ticket.eticket_item.ticket_type_display}
                        </span>
                        {getStatusBadge(ticket.status, ticket.status_display)}
                      </div>
                      <h3 className="text-lg font-bold mb-1">{ticket.eticket_item.name}</h3>
                      <p className="text-2xl font-bold">
                        {getTicketValue(ticket)}
                      </p>
                    </div>
                    {ticket.status === 'active' && (
                      <button
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setShowQRModal(true);
                        }}
                        className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                      >
                        <QrCode size={28} />
                      </button>
                    )}
                  </div>
                </div>

                {/* 票券詳情 */}
                <div className="p-4">
                  {/* 票券號碼 */}
                  <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 rounded-lg">
                    <span className="text-xs text-gray-500">票券號碼：</span>
                    <span className="text-sm font-mono font-medium text-gray-700">{ticket.ticket_number}</span>
                    <button
                      onClick={() => copyTicketNumber(ticket.ticket_number)}
                      className="ml-auto p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Copy size={14} />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      有效期限：{formatDate(ticket.valid_until)}
                    </span>
                    {isExpiringSoon(ticket.valid_until) && ticket.status === 'active' && (
                      <span className="text-orange-600 font-medium">即將到期</span>
                    )}
                    <span className="text-gray-400">
                      來源：{ticket.source_display}
                    </span>
                  </div>

                  {/* 操作按鈕 - 根據類型顯示不同 */}
                  {ticket.status === 'active' && (
                    <div className="flex gap-2">
                      {/* 點數卡 - 使用按鈕 */}
                      {ticket.eticket_item.ticket_type === 'topup' && (
                        <button
                          onClick={() => handleUseTopupTicket(ticket)}
                          disabled={usingTicket === ticket.ticket_number}
                          className="flex-1 py-2.5 bg-yellow-500 text-white text-sm font-medium rounded-xl hover:bg-yellow-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {usingTicket === ticket.ticket_number ? (
                            '處理中...'
                          ) : (
                            <>
                              <ArrowRight size={16} />
                              立即兌換
                            </>
                          )}
                        </button>
                      )}

                      {/* 兌換券 - 使用按鈕 */}
                      {ticket.eticket_item.ticket_type === 'exchange' && (
                        <button
                          onClick={() => openUseModal(ticket)}
                          className="flex-1 py-2.5 bg-green-500 text-white text-sm font-medium rounded-xl hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                        >
                          <QrCode size={16} />
                          使用兌換
                        </button>
                      )}

                      {/* 折扣券 - 查看適用商品 */}
                      {ticket.eticket_item.ticket_type === 'discount' && (
                        <button
                          onClick={() => openUseModal(ticket)}
                          className="flex-1 py-2.5 bg-red-500 text-white text-sm font-medium rounded-xl hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                        >
                          <Percent size={16} />
                          查看適用商品
                        </button>
                      )}

                      {/* 轉讓按鈕 - 可轉讓的票券才顯示 */}
                      {ticket.can_transfer && ticket.eticket_item.is_transferable && (
                        <button
                          onClick={() => {
                            // TODO: 實作轉讓功能
                            showSuccess('轉讓功能開發中');
                          }}
                          className="px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                        >
                          <Send size={16} />
                          轉讓
                        </button>
                      )}
                    </div>
                  )}

                  {/* 已使用時間 */}
                  {ticket.status === 'used' && ticket.used_at && (
                    <p className="text-xs text-gray-400">
                      使用時間：{formatDate(ticket.used_at)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Ticket size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 mb-2">
              {selectedStatus === 'active' ? '目前沒有可使用的票券' : '沒有符合條件的票券'}
            </p>
            <button
              onClick={() => navigate(`/shop/${clientSid}/tickets`)}
              className="text-sm text-purple-600 font-medium hover:text-purple-700"
            >
              前往票券商城 →
            </button>
          </div>
        )}
      </div>

      {/* QR Code Modal - 用於展示 QR 碼 */}
      {showQRModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden">
            <div className={`bg-gradient-to-r ${getTicketBgGradient(selectedTicket.eticket_item.ticket_type, selectedTicket.status)} p-4 text-white`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold">{selectedTicket.eticket_item.name}</h3>
                <button
                  onClick={() => {
                    setShowQRModal(false);
                    setSelectedTicket(null);
                  }}
                  className="p-1 hover:bg-white/20 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-2xl font-bold">{getTicketValue(selectedTicket)}</p>
            </div>

            <div className="p-6">
              {/* QR Code 區域 */}
              <div className="bg-gray-50 rounded-xl p-6 mb-4 flex items-center justify-center">
                {selectedTicket.qr_code_url ? (
                  <img
                    src={selectedTicket.qr_code_url}
                    alt="QR Code"
                    className="w-48 h-48"
                  />
                ) : (
                  <div className="w-48 h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                    <QrCode size={64} className="text-gray-400" />
                  </div>
                )}
              </div>

              {/* 票券號碼 */}
              <div className="text-center mb-4">
                <p className="text-sm text-gray-500 mb-1">票券號碼</p>
                <p className="text-lg font-mono font-bold text-gray-900">{selectedTicket.ticket_number}</p>
              </div>

              {/* 使用說明 */}
              <div className="text-center text-sm text-gray-500">
                <p>請出示此 QR Code 給店員掃描</p>
                <p>有效期限：{formatDate(selectedTicket.valid_until)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 兌換券使用 Modal */}
      {showUseModal && selectedTicket && selectedTicket.eticket_item.ticket_type === 'exchange' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden">
            <div className={`bg-gradient-to-r ${getTicketBgGradient(selectedTicket.eticket_item.ticket_type, selectedTicket.status)} p-4 text-white`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold">{selectedTicket.eticket_item.name}</h3>
                <button
                  onClick={() => {
                    setShowUseModal(false);
                    setSelectedTicket(null);
                    setVerifyCode('');
                  }}
                  className="p-1 hover:bg-white/20 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-lg">使用兌換券</p>
            </div>

            <div className="p-6">
              {/* QR Code 區域 */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4 flex items-center justify-center">
                {selectedTicket.qr_code_url ? (
                  <img
                    src={selectedTicket.qr_code_url}
                    alt="QR Code"
                    className="w-40 h-40"
                  />
                ) : (
                  <div className="w-40 h-40 bg-gray-200 rounded-lg flex items-center justify-center">
                    <QrCode size={48} className="text-gray-400" />
                  </div>
                )}
              </div>

              <p className="text-center text-sm text-gray-500 mb-4">
                請出示 QR Code 給店員掃描，或輸入店員提供的驗證碼
              </p>

              {/* 驗證碼輸入 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  店員驗證碼
                </label>
                <input
                  type="text"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.toUpperCase())}
                  placeholder="請輸入店員提供的驗證碼"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-center text-lg font-mono tracking-widest focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  maxLength={8}
                />
              </div>

              <button
                onClick={handleUseExchangeTicket}
                disabled={!verifyCode || usingTicket === selectedTicket.ticket_number}
                className="w-full py-3 bg-green-500 text-white font-medium rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {usingTicket === selectedTicket.ticket_number ? '處理中...' : '確認兌換'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 折扣券 Modal - 顯示適用商品 */}
      {showQRModal && selectedTicket && selectedTicket.eticket_item.ticket_type === 'discount' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden">
            <div className={`bg-gradient-to-r ${getTicketBgGradient(selectedTicket.eticket_item.ticket_type, selectedTicket.status)} p-4 text-white`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold">{selectedTicket.eticket_item.name}</h3>
                <button
                  onClick={() => {
                    setShowQRModal(false);
                    setSelectedTicket(null);
                  }}
                  className="p-1 hover:bg-white/20 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-2xl font-bold">{getTicketValue(selectedTicket)}</p>
            </div>

            <div className="p-6">
              <div className="text-center mb-4">
                <Percent size={48} className="mx-auto text-red-500 mb-3" />
                <p className="text-gray-600">
                  此折扣券可於結帳時使用
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  請在購物車結帳時選擇使用此券
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="text-sm text-gray-500 mb-1">票券號碼</p>
                <p className="text-lg font-mono font-bold text-gray-900 text-center">{selectedTicket.ticket_number}</p>
              </div>

              <div className="text-center text-xs text-gray-400">
                有效期限：{formatDate(selectedTicket.valid_until)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTickets;
