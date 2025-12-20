import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { api, API_ENDPOINTS } from '../config/api';
import { AI_COLORS } from '../constants/colors';

// 牌陣資料型別
interface Spread {
  id: number;
  code: string;
  name: string;
  description?: string;
  deck_name?: string;
  item_tags?: string[];
}

// 票券表單資料型別
interface ETicketFormData {
  // 基本資訊
  name: string;
  description: string;
  base_price: number;

  // 票券類型
  ticket_type: 'discount' | 'exchange' | 'topup';

  // 折扣券專屬
  discount_type?: 'percentage' | 'fixed';
  discount_value?: number;
  min_purchase_amount?: number;
  max_discount_amount?: number;

  // 點數卡專屬
  topup_type?: 'points' | 'coins' | 'tokens' | 'coins_special' | 'spread_quota';
  topup_amount?: number;
  auto_use_setting?: 'manual' | 'on_receive' | 'on_transfer';
  target_spread?: number | null; // 指定適用牌陣 ID

  // 兌換券專屬
  exchange_code?: string;

  // 有效期限
  validity_type: 'dynamic' | 'fixed';
  valid_days?: number;
  valid_start_date?: string;
  valid_end_date?: string;

  // 轉讓設定
  is_transferable: boolean;
  max_transfer_times?: number;

  // 庫存和限制
  total_stock: number;
  usage_limit_per_member?: number;

  // 適用標籤（可選）
  applicable_tags?: string[];

  // 啟用狀態
  is_active: boolean;
}

const ETicketForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showSuccess, showError } = useToast();
  const isEditMode = !!id;

  // 檢查當前路由，判斷是否在管理模式下
  const isManageMode = window.location.pathname.startsWith('/manage/');
  const clientSid = isManageMode ? window.location.pathname.split('/')[2] : null;
  const baseUrl = isManageMode ? `/manage/${clientSid}/etickets` : '/provider/etickets';

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 牌陣列表狀態
  const [spreads, setSpreads] = useState<Spread[]>([]);
  const [spreadsLoading, setSpreadsLoading] = useState(false);

  // 標籤相關狀態
  const [tagInput, setTagInput] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

  // 表單資料
  const [formData, setFormData] = useState<ETicketFormData>({
    name: '',
    description: '',
    base_price: 0,
    ticket_type: 'discount',
    validity_type: 'dynamic',
    valid_days: 30,
    is_transferable: true,
    max_transfer_times: 1,
    total_stock: 100,
    is_active: true,
    applicable_tags: [],
  });

  // 載入公開牌陣列表
  const loadSpreads = async () => {
    try {
      setSpreadsLoading(true);
      const params: any = {};
      if (isManageMode && clientSid) {
        params.manage_client_sid = clientSid;
      }
      const response = await api.get(API_ENDPOINTS.CARDHACK_PUBLIC_SPREADS, { params });
      if (response.data.success) {
        setSpreads(response.data.data || []);
      }
    } catch (error: any) {
      console.error('載入牌陣列表失敗:', error);
    } finally {
      setSpreadsLoading(false);
    }
  };

  // 載入票券資料（編輯模式）
  useEffect(() => {
    if (isEditMode) {
      loadETicket();
    }
    // 載入牌陣列表（用於牌陣次數票券）
    loadSpreads();
  }, [id]);

  const loadETicket = async () => {
    try {
      setLoading(true);
      const params: any = {};
      // 管理模式下加入 manage_client_sid
      if (isManageMode && clientSid) {
        params.manage_client_sid = clientSid;
      }
      const response = await api.get(API_ENDPOINTS.ETICKET_DETAIL(parseInt(id!)), { params });
      if (response.data.success) {
        const data = response.data.data;
        setFormData({
          ...data,
          base_price: parseFloat(data.base_price),
          discount_value: data.discount_value ? parseFloat(data.discount_value) : undefined,
          min_purchase_amount: data.min_purchase_amount ? parseFloat(data.min_purchase_amount) : undefined,
          max_discount_amount: data.max_discount_amount ? parseFloat(data.max_discount_amount) : undefined,
        });
      } else {
        showError(response.data.message || '載入票券失敗');
      }
    } catch (error: any) {
      console.error('載入票券失敗:', error);
      showError(error.response?.data?.message || '載入票券失敗');
    } finally {
      setLoading(false);
    }
  };

  // 處理表單提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 驗證
    if (!formData.name) {
      showError('請填寫必填欄位');
      return;
    }

    // 驗證票券類型特定欄位
    if (formData.ticket_type === 'discount') {
      if (!formData.discount_type || formData.discount_value === undefined) {
        showError('請填寫折扣類型和折扣值');
        return;
      }
    }

    if (formData.ticket_type === 'topup') {
      if (!formData.topup_type || !formData.topup_amount) {
        showError('請填寫補充類型和補充數量');
        return;
      }
    }

    try {
      setSubmitting(true);
      const endpoint = isEditMode
        ? API_ENDPOINTS.ETICKET_UPDATE(parseInt(id!))
        : API_ENDPOINTS.ETICKET_CREATE;

      // 準備提交資料，管理模式下加入 manage_client_sid
      const submitData: any = { ...formData };
      if (isManageMode && clientSid) {
        submitData.manage_client_sid = clientSid;
      }

      const response = await api.post(endpoint, submitData);

      if (response.data.success) {
        showSuccess(isEditMode ? '票券更新成功' : '票券建立成功');
        navigate(baseUrl);
      } else {
        showError(response.data.message || '儲存票券失敗');
      }
    } catch (error: any) {
      console.error('儲存票券失敗:', error);
      showError(error.response?.data?.message || '儲存票券失敗');
    } finally {
      setSubmitting(false);
    }
  };

  // 處理欄位變更
  const handleChange = (field: keyof ETicketFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // 標籤管理
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !formData.applicable_tags?.includes(trimmedTag)) {
      setFormData(prev => ({
        ...prev,
        applicable_tags: [...(prev.applicable_tags || []), trimmedTag],
      }));
      setTagInput('');
      setShowTagSuggestions(false);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      applicable_tags: (prev.applicable_tags || []).filter(tag => tag !== tagToRemove),
    }));
  };

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
    setShowTagSuggestions(e.target.value.length > 0);
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === 'Backspace' && tagInput === '' && (formData.applicable_tags?.length || 0) > 0) {
      removeTag(formData.applicable_tags![formData.applicable_tags!.length - 1]);
    }
  };

  const handleTagInputBlur = () => {
    setTimeout(() => setShowTagSuggestions(false), 200);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(baseUrl)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>返回票券列表</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? '編輯票券' : '建立票券'}
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            {isEditMode ? '修改票券資訊和設定' : '建立新的電子票券商品'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本資訊 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">基本資訊</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  票券名稱 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="例如：滿千折百券"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  票券描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                  placeholder="詳細說明票券的使用方式和規則"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  基礎價格 (元)
                </label>
                <input
                  type="number"
                  value={formData.base_price}
                  onChange={(e) => handleChange('base_price', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  min="0"
                  step="1"
                />
              </div>
            </div>
          </div>

          {/* 票券類型 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">票券類型</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                選擇類型 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.ticket_type}
                onChange={(e) => handleChange('ticket_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="discount">折扣券</option>
                <option value="topup">點數卡</option>
                <option value="exchange">兌換券</option>
              </select>
            </div>

            {/* 折扣券設定 */}
            {formData.ticket_type === 'discount' && (
              <div className="space-y-4 mt-4 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-gray-900">折扣券設定</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      折扣類型 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.discount_type}
                      onChange={(e) => handleChange('discount_type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    >
                      <option value="">請選擇</option>
                      <option value="percentage">百分比折扣</option>
                      <option value="fixed">固定金額</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      折扣值 <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.discount_value || ''}
                        onChange={(e) => handleChange('discount_value', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder={formData.discount_type === 'percentage' ? '10 = 打9折' : '折抵金額'}
                        min="0"
                        max={formData.discount_type === 'percentage' ? 100 : undefined}
                        step="1"
                        required
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                        {formData.discount_type === 'percentage' ? '%' : '元'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.discount_type === 'percentage'
                        ? '百分比：10 代表打 9 折（折扣 10%）'
                        : '固定金額：直接折抵的金額'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      最低消費金額 (元)
                    </label>
                    <input
                      type="number"
                      value={formData.min_purchase_amount || ''}
                      onChange={(e) => handleChange('min_purchase_amount', parseFloat(e.target.value) || undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      min="0"
                      step="1"
                      placeholder="0 = 無限制"
                    />
                  </div>

                  {formData.discount_type === 'percentage' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        最高折抵金額 (元)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={formData.max_discount_amount || ''}
                          onChange={(e) => handleChange('max_discount_amount', parseFloat(e.target.value) || undefined)}
                          className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          min="0"
                          step="1"
                          placeholder="0 = 無限制"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                          元
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        適用於百分比折扣時的上限
                      </p>
                    </div>
                  )}
                </div>

                {/* 可使用標籤 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    可使用標籤
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    設定哪些標籤的產品可以使用此折扣券，留空則所有產品皆可使用
                  </p>

                  {/* 已選標籤顯示 */}
                  {formData.applicable_tags && formData.applicable_tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.applicable_tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="text-purple-500 hover:text-purple-700 transition-colors"
                            title="移除標籤"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 標籤輸入區域 */}
                  <div className="relative">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={handleTagInputChange}
                      onKeyDown={handleTagInputKeyDown}
                      onBlur={handleTagInputBlur}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder={formData.applicable_tags && formData.applicable_tags.length === 0 ? "輸入標籤後按 Enter 新增" : "繼續新增標籤..."}
                    />

                    {/* 標籤建議 */}
                    {showTagSuggestions && tagInput.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 mt-1 max-h-48 overflow-y-auto">
                        <div className="p-2 border-b border-gray-100">
                          <p className="text-xs text-gray-500 font-medium">建議標籤</p>
                        </div>
                        {[
                          '123', '1233', 'VIP', '一般會員', '金卡會員', '銀卡會員', '銅卡會員',
                          '新會員', '老會員', '活躍會員', '潛在客戶', '重要客戶', '企業客戶'
                        ]
                          .filter(tag => tag.toLowerCase().includes(tagInput.toLowerCase()) && !formData.applicable_tags?.includes(tag))
                          .slice(0, 8)
                          .map(tag => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => addTag(tag)}
                              className="w-full text-left px-4 py-2 hover:bg-purple-50 transition-colors text-sm"
                            >
                              {tag}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    • 按 Enter 新增標籤<br />
                    • 按 Backspace 移除最後一個標籤<br />
                    • 點擊標籤上的 × 可移除該標籤
                  </p>
                </div>
              </div>
            )}

            {/* 點數卡設定 */}
            {formData.ticket_type === 'topup' && (
              <div className="space-y-4 mt-4 p-4 bg-yellow-50 rounded-lg">
                <h3 className="font-medium text-gray-900">點數卡設定</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      補充類型 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.topup_type}
                      onChange={(e) => {
                        const value = e.target.value;
                        handleChange('topup_type', value);
                        // 切換類型時清除不相關的欄位
                        if (value !== 'spread_quota') {
                          handleChange('target_spread', null);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    >
                      <option value="">請選擇</option>
                      <option value="points">積分 (Points)</option>
                      <option value="coins">金幣 (Coins)</option>
                      <option value="spread_quota">牌陣次數 (Spread Quota)</option>
                      {(clientSid === 'prepoe' || clientSid === 'aiya') && (
                        <>
                          <option value="tokens">代幣 (Tokens)</option>
                          <option value="coins_special">特殊金幣</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {formData.topup_type === 'spread_quota' ? '抽牌次數' : '補充數量'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.topup_amount || ''}
                      onChange={(e) => handleChange('topup_amount', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      min="1"
                      placeholder={formData.topup_type === 'spread_quota' ? '1' : '100'}
                      required
                    />
                    {formData.topup_type === 'spread_quota' && (
                      <p className="text-xs text-gray-500 mt-1">
                        使用此票券可獲得的抽牌次數
                      </p>
                    )}
                  </div>
                </div>

                {/* 牌陣次數專屬設定 */}
                {formData.topup_type === 'spread_quota' && (
                  <div className="space-y-4 mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <span className="text-orange-600">🎴</span>
                      牌陣適用範圍
                    </h4>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        指定適用牌陣
                      </label>
                      <select
                        value={formData.target_spread || ''}
                        onChange={(e) => handleChange('target_spread', e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        disabled={spreadsLoading}
                      >
                        <option value="">不指定（依標籤或全部牌陣）</option>
                        {spreads.map((spread) => (
                          <option key={spread.id} value={spread.id}>
                            {spread.name} {spread.deck_name ? `(${spread.deck_name})` : ''}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        {formData.target_spread
                          ? '僅適用於所選牌陣'
                          : formData.applicable_tags && formData.applicable_tags.length > 0
                            ? '將適用於標籤有交集的牌陣'
                            : '將適用於所有公開牌陣'}
                      </p>
                    </div>

                    {/* 適用標籤（牌陣次數專用） */}
                    {!formData.target_spread && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          適用牌陣標籤
                        </label>
                        <p className="text-xs text-gray-500 mb-3">
                          設定哪些標籤的牌陣可以使用此票券，留空則所有公開牌陣皆可使用
                        </p>

                        {/* 已選標籤顯示 */}
                        {formData.applicable_tags && formData.applicable_tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {formData.applicable_tags.map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-full"
                              >
                                {tag}
                                <button
                                  type="button"
                                  onClick={() => removeTag(tag)}
                                  className="text-orange-500 hover:text-orange-700 transition-colors"
                                  title="移除標籤"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        )}

                        {/* 標籤輸入區域 */}
                        <div className="relative">
                          <input
                            type="text"
                            value={tagInput}
                            onChange={handleTagInputChange}
                            onKeyDown={handleTagInputKeyDown}
                            onBlur={handleTagInputBlur}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder={formData.applicable_tags && formData.applicable_tags.length === 0 ? "輸入標籤後按 Enter 新增" : "繼續新增標籤..."}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 非牌陣次數的自動使用設定 */}
                {formData.topup_type !== 'spread_quota' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      自動使用設定
                    </label>
                    <select
                      value={formData.auto_use_setting}
                      onChange={(e) => handleChange('auto_use_setting', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="manual">手動使用</option>
                      <option value="on_receive">領取時自動使用</option>
                      <option value="on_transfer">轉讓時自動使用</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* 兌換券設定 */}
            {formData.ticket_type === 'exchange' && (
              <div className="space-y-4 mt-4 p-4 bg-green-50 rounded-lg">
                <h3 className="font-medium text-gray-900">兌換券設定</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    核銷碼 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.exchange_code || ''}
                    onChange={(e) => handleChange('exchange_code', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="請輸入核銷碼（10位以內）"
                    maxLength={10}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    核銷時需輸入此碼進行驗證
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 有效期限 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">有效期限</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                期限類型 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.validity_type}
                onChange={(e) => handleChange('validity_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="dynamic">動態期限（從發放日起算）</option>
                <option value="fixed">固定期限（指定日期範圍）</option>
              </select>
            </div>

            {formData.validity_type === 'dynamic' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  有效天數 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.valid_days || ''}
                  onChange={(e) => handleChange('valid_days', parseInt(e.target.value) || 30)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  min="1"
                  placeholder="30"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  從發放日期開始計算的有效天數
                </p>
              </div>
            )}

            {formData.validity_type === 'fixed' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    開始日期 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.valid_start_date || ''}
                    onChange={(e) => handleChange('valid_start_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    結束日期 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.valid_end_date || ''}
                    onChange={(e) => handleChange('valid_end_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            )}
          </div>

          {/* 轉讓設定 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">轉讓設定</h2>

            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_transferable"
                  checked={formData.is_transferable}
                  onChange={(e) => handleChange('is_transferable', e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="is_transferable" className="ml-2 block text-sm text-gray-900">
                  允許轉讓
                </label>
              </div>

              {formData.is_transferable && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    最大轉讓次數
                  </label>
                  <input
                    type="number"
                    value={formData.max_transfer_times || ''}
                    onChange={(e) => handleChange('max_transfer_times', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    min="1"
                    placeholder="1"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 庫存和限制 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">庫存和限制</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  總庫存 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.total_stock}
                  onChange={(e) => handleChange('total_stock', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  min="1"
                  placeholder="100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  每位會員持有上限
                </label>
                <input
                  type="number"
                  value={formData.usage_limit_per_member || ''}
                  onChange={(e) => handleChange('usage_limit_per_member', parseInt(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  min="1"
                  placeholder="0 = 無限制"
                />
              </div>
            </div>
          </div>

          {/* 啟用狀態 */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => handleChange('is_active', e.target.checked)}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                啟用此票券（可發放給會員）
              </label>
            </div>
          </div>

          {/* 操作按鈕 */}
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate(baseUrl)}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`flex items-center gap-2 ${AI_COLORS.button} px-6 py-2 rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  儲存中...
                </>
              ) : (
                <>
                  <Save size={20} />
                  {isEditMode ? '更新票券' : '建立票券'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ETicketForm;
