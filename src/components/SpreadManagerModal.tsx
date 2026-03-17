import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Edit3, Trash2, Layers, Eye, EyeOff, ChevronLeft, Loader2, GripVertical, ShoppingBag, DollarSign, Clock, Star, User, Search, CheckSquare, Square } from 'lucide-react';
import { COLORS } from '../constants/colors';
import { api, API_ENDPOINTS } from '../config/api';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import ConfirmDialog from './ConfirmDialog';

// ===== 型別定義 =====
interface SpreadPosition {
  id?: number;
  index: number;
  title: string;
  description: string;
}

interface SpreadItemInfo {
  id: number;
  name: string;
  description: string;
  base_price: number;
  cost_price?: number;
  sku: string;
  is_active: boolean;
  unit: string;
  spread: { id: number; code: string; name: string; draw_count: number };
}

interface Spread {
  id: number;
  code: string;
  name: string;
  deck_id: number;
  is_public: boolean;
  draw_count: number;
  flex_json: Record<string, any>;
  flex_template: string;
  flex_template_details: string;
  flex_web_id: number | null;
  unique_deck_card: boolean;
  ai_is_active: boolean;
  ai_assistant_id: number | null;
  ai_prompt: string;
  ai_interpretation_addon_price: number | null;
  item_tags: Array<{ id: number; name: string }>;
  positions: SpreadPosition[];
  created_at: string;
  updated_at: string;
}

interface SpreadFormData {
  name: string;
  draw_count: number;
  deck_id: number;
  is_public: boolean;
  flex_template: string;
  flex_template_details: string;
  unique_deck_card: boolean;
  ai_is_active: boolean;
  ai_prompt: string;
  ai_interpretation_addon_price: number | null;
  positions: SpreadPosition[];
}

interface ItemFormData {
  enabled: boolean;
  name: string;
  description: string;
  base_price: number;
  is_active: boolean;
  syncName: boolean; // 是否與牌陣名稱同步
}

type ResetPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom' | 'never';

const RESET_PERIOD_OPTIONS: { value: ResetPeriod; label: string }[] = [
  { value: 'daily', label: '每日' },
  { value: 'weekly', label: '每週' },
  { value: 'monthly', label: '每月' },
  { value: 'quarterly', label: '每季' },
  { value: 'yearly', label: '每年' },
  { value: 'custom', label: '自訂天數' },
  { value: 'never', label: '永不重置' },
];

interface QuotaFormData {
  enabled: boolean;
  reset_period: ResetPeriod;
  reset_amount: number;
  custom_days: number | null;
  is_active: boolean;
}

interface QuotaInfo {
  id: number;
  spread_id: number;
  reset_period: ResetPeriod;
  reset_period_display: string;
  reset_amount: number;
  custom_days: number | null;
  is_active: boolean;
}

interface RecommendedItem {
  id: number;
  spread_id: number;
  item_info_id: number;
  item_name: string;
  numerator: number;
  order: number;
}

interface RecommendedPerson {
  id: number;
  spread_id: number;
  profile_id: number;
  profile_name: string;
  numerator: number;
  order: number;
}

interface TagOption {
  id: number;
  name: string;
}

interface SearchItemResult {
  id: number;
  name: string;
  sku: string;
  item_type?: string;
  is_active: boolean;
  /** 所屬公司（client_sid），items-by-tag 新格式 by_client 分組時帶入 */
  client_sid?: string;
  item_tags?: Array<{ id: number; name: string }>;
}

/** item_type 對應類別中文（推薦商品搜尋結果用） */
const ITEM_TYPE_LABEL: Record<string, string> = {
  event: '活動',
  food: '餐點',
  retail: '產品',
  eticket: '票券',
  booking: '預約',
  recharge: '儲值',
  spread: '牌陣',
  ai_interpretation: 'AI解讀',
};

function getItemTypeLabel(itemType?: string): string {
  return (itemType && ITEM_TYPE_LABEL[itemType]) || '產品';
}

interface SearchPersonResult {
  id: number;
  name: string;
  slug?: string;
}

interface SpreadManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  deck: { id: number; name: string };
}

const defaultFormData = (deckId: number): SpreadFormData => ({
  name: '',
  draw_count: 3,
  deck_id: deckId,
  is_public: true,
  flex_template: 'flex_01',
  flex_template_details: 'd_01',
  unique_deck_card: true,
  ai_is_active: false,
  ai_prompt: '',
  ai_interpretation_addon_price: null,
  positions: [
    { index: 0, title: '過去', description: '' },
    { index: 1, title: '現在', description: '' },
    { index: 2, title: '未來', description: '' },
  ],
});

const defaultItemFormData = (): ItemFormData => ({
  enabled: false,
  name: '',
  description: '',
  base_price: 0,
  is_active: true,
  syncName: true,
});

const defaultQuotaFormData = (): QuotaFormData => ({
  enabled: false,
  reset_period: 'monthly',
  reset_amount: 5,
  custom_days: null,
  is_active: true,
});

const SpreadManagerModal: React.FC<SpreadManagerModalProps> = ({ isOpen, onClose, deck }) => {
  const { showSuccess, showError } = useToast();
  const { confirm, isOpen: confirmOpen, options: confirmOptions, handleConfirm, handleCancel } = useConfirm();

  // 模式切換：list / form
  const [mode, setMode] = useState<'list' | 'form'>('list');
  const [spreads, setSpreads] = useState<Spread[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // SpreadItem 對照表 (spread_id -> SpreadItemInfo)
  const [spreadItemMap, setSpreadItemMap] = useState<Record<number, SpreadItemInfo>>({});

  // 表單
  const [editingSpread, setEditingSpread] = useState<Spread | null>(null);
  const [formData, setFormData] = useState<SpreadFormData>(defaultFormData(deck.id));
  const [itemFormData, setItemFormData] = useState<ItemFormData>(defaultItemFormData());
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [quotaFormData, setQuotaFormData] = useState<QuotaFormData>(defaultQuotaFormData());
  const [existingQuotaId, setExistingQuotaId] = useState<number | null>(null);
  const [formTab, setFormTab] = useState<'spread' | 'ai' | 'item' | 'recommend'>('spread');

  // 推薦商品 & 推薦人員（本地編輯，統一儲存）
  const [recommendedItems, setRecommendedItems] = useState<RecommendedItem[]>([]);
  const [recommendedPersons, setRecommendedPersons] = useState<RecommendedPerson[]>([]);
  const [originalRecItems, setOriginalRecItems] = useState<RecommendedItem[]>([]);
  const [originalRecPersons, setOriginalRecPersons] = useState<RecommendedPerson[]>([]);
  const [recLoading, setRecLoading] = useState(false);
  const [recSaving, setRecSaving] = useState(false);

  // 推薦搜尋 & 批量選取
  const [itemTags, setItemTags] = useState<TagOption[]>([]);
  const [personTags, setPersonTags] = useState<TagOption[]>([]);
  const [itemSearchTag, setItemSearchTag] = useState('');
  const [itemSearchText, setItemSearchText] = useState('');
  const [personSearchTag, setPersonSearchTag] = useState('');
  const [personSearchText, setPersonSearchText] = useState('');
  const [searchedItems, setSearchedItems] = useState<SearchItemResult[]>([]);
  const [searchedPersons, setSearchedPersons] = useState<SearchPersonResult[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set());
  const [selectedPersonIds, setSelectedPersonIds] = useState<Set<number>>(new Set());
  const [searching, setSearching] = useState(false);
  const [batchAdding, setBatchAdding] = useState(false);

  // 標籤 autocomplete
  const [itemTagInput, setItemTagInput] = useState('');
  const [showItemTagDropdown, setShowItemTagDropdown] = useState(false);
  const [personTagInput, setPersonTagInput] = useState('');
  const [showPersonTagDropdown, setShowPersonTagDropdown] = useState(false);

  // 重置狀態
  useEffect(() => {
    if (isOpen) {
      setMode('list');
      setEditingSpread(null);
      setFormData(defaultFormData(deck.id));
      setItemFormData(defaultItemFormData());
      setEditingItemId(null);
      setQuotaFormData(defaultQuotaFormData());
      setExistingQuotaId(null);
      setFormTab('spread');
      loadData();
    }
  }, [isOpen, deck.id]);

  // 名稱同步：當 syncName 開啟且牌陣名稱變更時，同步到商品名稱
  useEffect(() => {
    if (itemFormData.syncName) {
      setItemFormData(prev => ({ ...prev, name: formData.name }));
    }
  }, [formData.name, itemFormData.syncName]);

  // ===== API 操作 =====
  const loadData = async () => {
    try {
      setLoading(true);
      // 同時載入牌陣列表和商品列表
      const [spreadsRes, itemsRes] = await Promise.all([
        api.get(API_ENDPOINTS.CARDHACK_SPREADS, { params: { deck_id: deck.id } }),
        api.get(API_ENDPOINTS.SPREAD_ITEMS).catch(() => ({ data: { success: false, data: { items: [] } } })),
      ]);

      if (spreadsRes.data.success) {
        setSpreads(spreadsRes.data.data || []);
      } else {
        showError(spreadsRes.data.message || '載入牌陣失敗');
      }

      // 建立 spread_id -> SpreadItem 對照表
      if (itemsRes.data.success) {
        const items: SpreadItemInfo[] = itemsRes.data.data?.items || itemsRes.data.data || [];
        const map: Record<number, SpreadItemInfo> = {};
        items.forEach(item => {
          if (item.spread?.id) {
            map[item.spread.id] = item;
          }
        });
        setSpreadItemMap(map);
      }
    } catch (error: any) {
      console.error('載入資料錯誤:', error);
      showError(error.response?.data?.message || '載入資料時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingSpread(null);
    setEditingItemId(null);
    setFormData(defaultFormData(deck.id));
    setItemFormData(defaultItemFormData());
    setQuotaFormData(defaultQuotaFormData());
    setExistingQuotaId(null);
    setRecommendedItems([]);
    setRecommendedPersons([]);
    setFormTab('spread');
    setMode('form');
  };

  const handleEdit = async (spread: Spread) => {
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.CARDHACK_SPREAD_DETAIL(spread.id));
      if (response.data.success) {
        const detail = response.data.data;
        setEditingSpread(detail);
        setFormData({
          name: detail.name,
          draw_count: detail.draw_count,
          deck_id: detail.deck_id,
          is_public: detail.is_public,
          flex_template: detail.flex_template || 'flex_01',
          flex_template_details: detail.flex_template_details || 'd_01',
          unique_deck_card: detail.unique_deck_card ?? true,
          ai_is_active: detail.ai_is_active || false,
          ai_prompt: detail.ai_prompt || '',
          ai_interpretation_addon_price: detail.ai_interpretation_addon_price ?? null,
          positions: detail.positions || [],
        });

        // 載入關聯的 SpreadItem
        const existingItem = spreadItemMap[spread.id];
        if (existingItem) {
          setEditingItemId(existingItem.id);
          setItemFormData({
            enabled: true,
            name: existingItem.name,
            description: existingItem.description || '',
            base_price: existingItem.base_price,
            is_active: existingItem.is_active,
            syncName: existingItem.name === detail.name,
          });
        } else {
          setEditingItemId(null);
          setItemFormData({
            ...defaultItemFormData(),
            name: detail.name,
          });
        }

        // 載入配額
        try {
          const quotaRes = await api.get(API_ENDPOINTS.CARDHACK_SPREAD_QUOTA(spread.id));
          if (quotaRes.data.success && quotaRes.data.data) {
            const q: QuotaInfo = quotaRes.data.data;
            setExistingQuotaId(q.id);
            setQuotaFormData({
              enabled: true,
              reset_period: q.reset_period,
              reset_amount: q.reset_amount,
              custom_days: q.custom_days,
              is_active: q.is_active,
            });
          } else {
            setExistingQuotaId(null);
            setQuotaFormData(defaultQuotaFormData());
          }
        } catch {
          // 404 表示尚無配額，不報錯
          setExistingQuotaId(null);
          setQuotaFormData(defaultQuotaFormData());
        }

        // 載入推薦商品與推薦人員 + 標籤選項
        loadRecommendations(spread.id);
        loadTags();

        setMode('form');
      } else {
        showError(response.data.message || '載入牌陣詳情失敗');
      }
    } catch (error: any) {
      showError(error.response?.data?.message || '載入牌陣詳情時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (spreadId: number) => {
    const confirmed = await confirm({
      title: '確認刪除',
      message: '確定要刪除此牌陣嗎？若已綁定牌陣商品或有抽牌紀錄，將無法刪除。',
    });
    if (!confirmed) return;

    try {
      const response = await api.delete(API_ENDPOINTS.CARDHACK_SPREAD_DELETE(spreadId));
      if (response.data.success) {
        showSuccess('牌陣已刪除');
        setSpreads(prev => prev.filter(s => s.id !== spreadId));
        setSpreadItemMap(prev => {
          const next = { ...prev };
          delete next[spreadId];
          return next;
        });
      } else {
        showError(response.data.message || '刪除失敗');
      }
    } catch (error: any) {
      showError(error.response?.data?.message || '刪除牌陣時發生錯誤');
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showError('請輸入牌陣名稱');
      return;
    }
    if (formData.draw_count < 1) {
      showError('抽牌張數至少為 1');
      return;
    }
    if (itemFormData.enabled && !itemFormData.name.trim()) {
      showError('請輸入商品名稱');
      return;
    }
    if (quotaFormData.enabled && quotaFormData.reset_period === 'custom' && (!quotaFormData.custom_days || quotaFormData.custom_days < 1)) {
      showError('自訂天數至少為 1');
      return;
    }

    try {
      setSubmitting(true);

      // 1. 儲存牌陣
      const spreadPayload = {
        ...formData,
        positions: formData.positions.map((p, i) => ({ ...p, index: i })),
      };

      let spreadResponse;
      let savedSpreadId: number;

      if (editingSpread) {
        spreadResponse = await api.patch(API_ENDPOINTS.CARDHACK_SPREAD_UPDATE(editingSpread.id), spreadPayload);
        savedSpreadId = editingSpread.id;
      } else {
        spreadResponse = await api.post(API_ENDPOINTS.CARDHACK_SPREAD_CREATE, spreadPayload);
        savedSpreadId = spreadResponse.data.data?.id;
      }

      if (!spreadResponse.data.success) {
        showError(spreadResponse.data.message || '儲存牌陣失敗');
        return;
      }

      // 2. 儲存商品（如果啟用）
      if (itemFormData.enabled && savedSpreadId) {
        const itemPayload = {
          name: itemFormData.name,
          description: itemFormData.description,
          base_price: itemFormData.base_price,
          is_active: itemFormData.is_active,
          spread_id: savedSpreadId,
        };

        try {
          if (editingItemId) {
            await api.patch(API_ENDPOINTS.SPREAD_ITEM_UPDATE(editingItemId), itemPayload);
          } else {
            await api.post(API_ENDPOINTS.SPREAD_ITEM_CREATE, itemPayload);
          }
        } catch (itemError: any) {
          showError(itemError.response?.data?.message || '商品儲存失敗，但牌陣已保存');
        }
      }

      // 3. 儲存配額
      if (savedSpreadId) {
        try {
          if (quotaFormData.enabled) {
            const quotaPayload = {
              reset_period: quotaFormData.reset_period,
              reset_amount: quotaFormData.reset_amount,
              custom_days: quotaFormData.reset_period === 'custom' ? quotaFormData.custom_days : null,
              is_active: quotaFormData.is_active,
            };
            if (existingQuotaId) {
              await api.patch(API_ENDPOINTS.CARDHACK_SPREAD_QUOTA_UPDATE(savedSpreadId), quotaPayload);
            } else {
              await api.post(API_ENDPOINTS.CARDHACK_SPREAD_QUOTA_CREATE(savedSpreadId), quotaPayload);
            }
          } else if (existingQuotaId) {
            // 配額已關閉但原先有設定 → 刪除
            await api.delete(API_ENDPOINTS.CARDHACK_SPREAD_QUOTA_DELETE(savedSpreadId));
          }
        } catch (quotaError: any) {
          showError(quotaError.response?.data?.message || '配額儲存失敗，但牌陣已保存');
        }
      }

      showSuccess(editingSpread ? '牌陣已更新' : '牌陣已建立');
      setMode('list');
      loadData();
    } catch (error: any) {
      showError(error.response?.data?.message || '儲存牌陣時發生錯誤');
    } finally {
      setSubmitting(false);
    }
  };

  // ===== 位置管理 =====
  const addPosition = () => {
    setFormData(prev => ({
      ...prev,
      positions: [
        ...prev.positions,
        { index: prev.positions.length, title: '', description: '' },
      ],
    }));
  };

  const removePosition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      positions: prev.positions
        .filter((_, i) => i !== index)
        .map((p, i) => ({ ...p, index: i })),
    }));
  };

  const updatePosition = (index: number, field: 'title' | 'description', value: string) => {
    setFormData(prev => ({
      ...prev,
      positions: prev.positions.map((p, i) =>
        i === index ? { ...p, [field]: value } : p
      ),
    }));
  };

  const handleDrawCountChange = (count: number) => {
    const clamped = Math.max(1, Math.min(20, count));
    setFormData(prev => {
      let positions = [...prev.positions];
      if (clamped > positions.length) {
        for (let i = positions.length; i < clamped; i++) {
          positions.push({ index: i, title: `位置 ${i + 1}`, description: '' });
        }
      } else if (clamped < positions.length) {
        positions = positions.slice(0, clamped);
      }
      return { ...prev, draw_count: clamped, positions };
    });
  };

  // ===== 推薦管理 =====
  const loadRecommendations = async (spreadId: number) => {
    try {
      setRecLoading(true);
      const [itemsRes, personsRes] = await Promise.all([
        api.get(API_ENDPOINTS.SPREAD_RECOMMENDED_ITEMS, { params: { spread_id: spreadId } }).catch(() => ({ data: { success: false, data: [] } })),
        api.get(API_ENDPOINTS.SPREAD_RECOMMENDED_PERSONS, { params: { spread_id: spreadId } }).catch(() => ({ data: { success: false, data: [] } })),
      ]);
      const items = itemsRes.data.success ? (itemsRes.data.data || []) : [];
      const persons = personsRes.data.success ? (personsRes.data.data || []) : [];
      setRecommendedItems(items);
      setRecommendedPersons(persons);
      setOriginalRecItems(JSON.parse(JSON.stringify(items)));
      setOriginalRecPersons(JSON.parse(JSON.stringify(persons)));
    } catch {
      // 靜默處理
    } finally {
      setRecLoading(false);
    }
  };

  const loadTags = async () => {
    try {
      const [itemTagsRes, personTagsRes] = await Promise.all([
        api.get(API_ENDPOINTS.ITEM_TAGS).catch(() => ({ data: { success: false, data: [] } })),
        api.get(API_ENDPOINTS.PP_TAG_LIST).catch(() => ({ data: { success: false, data: [] } })),
      ]);
      if (itemTagsRes.data.success) setItemTags(itemTagsRes.data.data || []);
      if (personTagsRes.data.success) setPersonTags(personTagsRes.data.data || []);
    } catch {
      // 靜默處理
    }
  };

  const searchItems = async () => {
    try {
      setSearching(true);
      const params: Record<string, string> = {};
      if (itemSearchTag) params.tag_ids = itemSearchTag;
      if (itemSearchText) params.search = itemSearchText;
      const res = await api.get(API_ENDPOINTS.ITEMS_BY_TAG, { params });
      if (res.data.success) {
        const raw = res.data.data;
        let items: SearchItemResult[] = [];
        const getItemList = (val: any): any[] => {
          if (Array.isArray(val)) return val;
          if (val && typeof val === 'object' && Array.isArray(val.items)) return val.items;
          return [];
        };
        if (raw?.grouped_by_client && raw?.by_client && typeof raw.by_client === 'object') {
          items = Object.entries(raw.by_client).flatMap(([clientSid, val]: [string, any]) =>
            getItemList(val).map((item: any) => ({
              id: item.id,
              name: item.name,
              sku: item.sku ?? '',
              item_type: item.item_type,
              is_active: item.is_active !== false,
              client_sid: clientSid,
              item_tags: item.item_tags,
            }))
          );
        } else if (Array.isArray(raw)) {
          items = raw;
        } else if (raw?.by_client && typeof raw.by_client === 'object') {
          items = Object.entries(raw.by_client).flatMap(([clientSid, val]: [string, any]) =>
            getItemList(val).map((item: any) => ({
              ...item,
              client_sid: clientSid,
            }))
          );
        }
        setSearchedItems(items);
        setSelectedItemIds(new Set());
      } else {
        showError(res.data.message || '搜尋失敗');
      }
    } catch (error: any) {
      showError(error.response?.data?.message || '搜尋商品失敗');
    } finally {
      setSearching(false);
    }
  };

  const searchPersons = async () => {
    try {
      setSearching(true);
      const params: Record<string, string> = {};
      if (personSearchTag) params.tag_pp_ids = personSearchTag;
      if (personSearchText) params.search = personSearchText;
      const res = await api.get(API_ENDPOINTS.PROFILES_BY_TAG, { params });
      if (res.data.success) {
        setSearchedPersons(res.data.data || []);
        setSelectedPersonIds(new Set());
      } else {
        showError(res.data.message || '搜尋失敗');
      }
    } catch (error: any) {
      showError(error.response?.data?.message || '搜尋人員失敗');
    } finally {
      setSearching(false);
    }
  };

  // === 本地操作（不呼叫 API） ===

  const tempIdRef = useRef(-1);

  const handleBatchAddItems = () => {
    if (selectedItemIds.size === 0) return;
    const existingIds = new Set(recommendedItems.map(r => r.item_info_id));
    const toAdd = searchedItems.filter(s => selectedItemIds.has(s.id) && !existingIds.has(s.id));
    if (toAdd.length === 0) {
      showError('所選商品皆已在推薦列表中');
      return;
    }
    const newRecs: RecommendedItem[] = toAdd.map((s, i) => ({
      id: tempIdRef.current - i,
      spread_id: editingSpread?.id || 0,
      item_info_id: s.id,
      item_name: s.name,
      numerator: 1,
      order: recommendedItems.length + i,
    }));
    tempIdRef.current -= toAdd.length;
    setRecommendedItems(prev => [...prev, ...newRecs]);
    setSelectedItemIds(new Set());
    setSearchedItems([]);
    showSuccess(`已加入 ${toAdd.length} 個推薦商品（尚未儲存）`);
  };

  const handleBatchAddPersons = () => {
    if (selectedPersonIds.size === 0) return;
    const existingIds = new Set(recommendedPersons.map(r => r.profile_id));
    const toAdd = searchedPersons.filter(s => selectedPersonIds.has(s.id) && !existingIds.has(s.id));
    if (toAdd.length === 0) {
      showError('所選人員皆已在推薦列表中');
      return;
    }
    const newRecs: RecommendedPerson[] = toAdd.map((s, i) => ({
      id: tempIdRef.current - i,
      spread_id: editingSpread?.id || 0,
      profile_id: s.id,
      profile_name: s.name,
      numerator: 1,
      order: recommendedPersons.length + i,
    }));
    tempIdRef.current -= toAdd.length;
    setRecommendedPersons(prev => [...prev, ...newRecs]);
    setSelectedPersonIds(new Set());
    setSearchedPersons([]);
    showSuccess(`已加入 ${toAdd.length} 個推薦人員（尚未儲存）`);
  };

  const handleDeleteRecItem = (recId: number) => {
    setRecommendedItems(prev => prev.filter(i => i.id !== recId));
  };

  const handleUpdateRecItem = (recId: number, numerator: number) => {
    setRecommendedItems(prev => prev.map(i => i.id === recId ? { ...i, numerator } : i));
  };

  const handleDeleteRecPerson = (recId: number) => {
    setRecommendedPersons(prev => prev.filter(p => p.id !== recId));
  };

  const handleUpdateRecPerson = (recId: number, numerator: number) => {
    setRecommendedPersons(prev => prev.map(p => p.id === recId ? { ...p, numerator } : p));
  };

  // === 統一儲存推薦設定（diff 後送出） ===
  const saveRecommendations = async () => {
    if (!editingSpread) return;
    try {
      setRecSaving(true);

      // --- 推薦商品 ---
      const origItemIds = new Set(originalRecItems.map(r => r.id));
      const currItemIds = new Set(recommendedItems.filter(r => r.id > 0).map(r => r.id));
      // 刪除：原本有但現在沒有
      const itemsToDelete = originalRecItems.filter(r => !currItemIds.has(r.id));
      // 新增：id < 0 的是新加的
      const itemsToCreate = recommendedItems.filter(r => r.id < 0);
      // 更新權重：id > 0 且 numerator 改變
      const itemsToUpdate = recommendedItems.filter(r => {
        if (r.id < 0) return false;
        const orig = originalRecItems.find(o => o.id === r.id);
        return orig && orig.numerator !== r.numerator;
      });

      // --- 推薦人員 ---
      const origPersonIds = new Set(originalRecPersons.map(r => r.id));
      const currPersonIds = new Set(recommendedPersons.filter(r => r.id > 0).map(r => r.id));
      const personsToDelete = originalRecPersons.filter(r => !currPersonIds.has(r.id));
      const personsToCreate = recommendedPersons.filter(r => r.id < 0);
      const personsToUpdate = recommendedPersons.filter(r => {
        if (r.id < 0) return false;
        const orig = originalRecPersons.find(o => o.id === r.id);
        return orig && orig.numerator !== r.numerator;
      });

      const totalOps = itemsToDelete.length + itemsToCreate.length + itemsToUpdate.length
        + personsToDelete.length + personsToCreate.length + personsToUpdate.length;

      if (totalOps === 0) {
        showSuccess('沒有變更');
        return;
      }

      // 執行所有操作
      const promises: Promise<any>[] = [];
      for (const r of itemsToDelete) {
        promises.push(api.delete(API_ENDPOINTS.SPREAD_RECOMMENDED_ITEM_DELETE(r.id)));
      }
      for (const r of itemsToCreate) {
        promises.push(api.post(API_ENDPOINTS.SPREAD_RECOMMENDED_ITEM_CREATE, {
          spread_id: editingSpread.id,
          item_info_id: r.item_info_id,
          numerator: r.numerator,
        }));
      }
      for (const r of itemsToUpdate) {
        promises.push(api.patch(API_ENDPOINTS.SPREAD_RECOMMENDED_ITEM_UPDATE(r.id), { numerator: r.numerator }));
      }
      for (const r of personsToDelete) {
        promises.push(api.delete(API_ENDPOINTS.SPREAD_RECOMMENDED_PERSON_DELETE(r.id)));
      }
      for (const r of personsToCreate) {
        promises.push(api.post(API_ENDPOINTS.SPREAD_RECOMMENDED_PERSON_CREATE, {
          spread_id: editingSpread.id,
          profile_id: r.profile_id,
          numerator: r.numerator,
        }));
      }
      for (const r of personsToUpdate) {
        promises.push(api.patch(API_ENDPOINTS.SPREAD_RECOMMENDED_PERSON_UPDATE(r.id), { numerator: r.numerator }));
      }

      await Promise.all(promises);
      showSuccess('推薦設定已儲存');

      // 重新載入以取得正確的 id
      await loadRecommendations(editingSpread.id);
    } catch (error: any) {
      showError(error.response?.data?.message || '儲存推薦設定失敗');
    } finally {
      setRecSaving(false);
    }
  };

  const toggleItemSelection = (id: number) => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const togglePersonSelection = (id: number) => {
    setSelectedPersonIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (!isOpen) return null;

  // ===== 渲染 =====
  const modal = createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[2000] flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            {mode === 'form' && (
              <button
                onClick={() => setMode('list')}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {mode === 'list'
                  ? `${deck.name} — 牌陣管理`
                  : editingSpread
                    ? '編輯牌陣'
                    : '新增牌陣'}
              </h3>
              {mode === 'list' && (
                <p className="text-sm text-gray-500">共 {spreads.length} 個牌陣</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {mode === 'list' ? renderList() : renderForm()}
        </div>
      </div>
    </div>,
    document.body
  );

  return (
    <>
      {modal}
      {createPortal(
        <ConfirmDialog
          isOpen={confirmOpen}
          title={confirmOptions.title || ''}
          message={confirmOptions.message}
          confirmText={confirmOptions.confirmText}
          cancelText={confirmOptions.cancelText}
          type={confirmOptions.type}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />,
        document.body
      )}
    </>
  );

  // ===== 列表模式 =====
  function renderList() {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-gray-400" />
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {/* 新增按鈕 */}
        <button
          onClick={handleCreate}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-orange-400 hover:text-orange-600 transition-colors"
        >
          <Plus size={18} />
          <span>新增牌陣</span>
        </button>

        {/* 牌陣列表 */}
        {spreads.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Layers size={40} className="mx-auto mb-3 opacity-50" />
            <p>尚無牌陣</p>
            <p className="text-sm mt-1">點擊上方按鈕建立第一個牌陣</p>
          </div>
        ) : (
          spreads.map((spread) => {
            const linkedItem = spreadItemMap[spread.id];
            return (
              <div
                key={spread.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-orange-200 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900 truncate">{spread.name}</h4>
                    {spread.is_public ? (
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <Eye size={12} /> 公開
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <EyeOff size={12} /> 私人
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span>抽 {spread.draw_count} 張</span>
                    <span>·</span>
                    <span>{spread.positions?.length || 0} 個位置</span>
                    {spread.ai_is_active && (
                      <>
                        <span>·</span>
                        <span className="text-orange-500">AI 解讀</span>
                      </>
                    )}
                  </div>
                  {/* 商品資訊 */}
                  {linkedItem && (
                    <div className="flex items-center gap-2 mt-1.5 text-xs">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                        <ShoppingBag size={10} />
                        ${linkedItem.base_price}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded-full text-xs ${linkedItem.is_active ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                        {linkedItem.is_active ? '上架中' : '已下架'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 ml-3">
                  <button
                    onClick={() => handleEdit(spread)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="編輯"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(spread.id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="刪除"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  }

  // ===== 表單模式 =====
  function renderForm() {
    const tabs: { key: typeof formTab; label: string; icon: React.ReactNode; editOnly?: boolean }[] = [
      { key: 'spread', label: '牌陣', icon: <Layers size={14} /> },
      { key: 'ai', label: 'AI 與配額', icon: <Clock size={14} /> },
      { key: 'item', label: '商品', icon: <ShoppingBag size={14} /> },
      { key: 'recommend', label: '推薦', icon: <Star size={14} />, editOnly: true },
    ];

    const visibleTabs = tabs.filter(t => !t.editOnly || editingSpread);

    return (
      <div className="flex flex-col h-full">
        {/* 分頁導航 */}
        <div className="flex border-b border-gray-200 mb-4 -mt-1">
          {visibleTabs.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFormTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                formTab === tab.key
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* 分頁內容 */}
        <div className="flex-1 space-y-5">
          {formTab === 'spread' && renderSpreadTab()}
          {formTab === 'ai' && renderAiTab()}
          {formTab === 'item' && renderItemTab()}
          {formTab === 'recommend' && renderRecommendTab()}
        </div>

        {/* 提交按鈕（固定在底部） */}
        <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => setMode('list')}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            取消
          </button>
          {formTab === 'recommend' ? (
            <button
              type="button"
              onClick={saveRecommendations}
              disabled={recSaving}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50"
              style={{ backgroundColor: COLORS.ai.primary }}
            >
              {recSaving && <Loader2 size={14} className="animate-spin" />}
              儲存推薦設定
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50"
              style={{ backgroundColor: COLORS.ai.primary }}
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {editingSpread ? '更新牌陣' : '建立牌陣'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ===== Tab: 牌陣基本 =====
  function renderSpreadTab() {
    return (
      <>
        {/* 基本資訊 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">牌陣名稱 *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="例如：三張牌、凱爾特十字"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">抽牌張數 *</label>
            <input
              type="number"
              min={1}
              max={20}
              value={formData.draw_count}
              onChange={(e) => handleDrawCountChange(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">公開狀態</label>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, is_public: !prev.is_public }))}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2 border rounded-lg transition-colors ${
                formData.is_public
                  ? 'border-green-300 bg-green-50 text-green-700'
                  : 'border-gray-300 bg-gray-50 text-gray-500'
              }`}
            >
              {formData.is_public ? <Eye size={16} /> : <EyeOff size={16} />}
              {formData.is_public ? '公開' : '私人'}
            </button>
          </div>
        </div>

        {/* 位置設定 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              牌位設定 ({formData.positions.length} 個)
            </label>
            <button
              type="button"
              onClick={addPosition}
              className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700"
            >
              <Plus size={14} /> 新增牌位
            </button>
          </div>
          <div className="space-y-2">
            {formData.positions.map((pos, idx) => (
              <div key={idx} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center pt-2 text-gray-300">
                  <GripVertical size={14} />
                  <span className="text-xs font-mono text-gray-400 w-5 text-center">{idx + 1}</span>
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={pos.title}
                    onChange={(e) => updatePosition(idx, 'title', e.target.value)}
                    placeholder="牌位名稱（例如：過去）"
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-orange-400 focus:border-orange-400 outline-none"
                  />
                  <input
                    type="text"
                    value={pos.description}
                    onChange={(e) => updatePosition(idx, 'description', e.target.value)}
                    placeholder="描述（選填）"
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-orange-400 focus:border-orange-400 outline-none text-gray-500"
                  />
                </div>
                {formData.positions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePosition(idx)}
                    className="p-1 mt-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 版型設定 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">抽卡版型</label>
            <select
              value={formData.flex_template}
              onChange={(e) => setFormData(prev => ({ ...prev, flex_template: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none"
            >
              <option value="flex_01">版型一</option>
              <option value="flex_02">版型二</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">唯一牌卡模式</label>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, unique_deck_card: !prev.unique_deck_card }))}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2 border rounded-lg transition-colors ${
                formData.unique_deck_card
                  ? 'border-orange-300 bg-orange-50 text-orange-700'
                  : 'border-gray-300 bg-gray-50 text-gray-500'
              }`}
            >
              {formData.unique_deck_card ? '開啟（不重複抽牌）' : '關閉（可重複抽牌）'}
            </button>
          </div>
        </div>
      </>
    );
  }

  // ===== Tab: AI 與配額 =====
  function renderAiTab() {
    return (
      <>
        {/* AI 設定 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">AI 解讀設定</label>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, ai_is_active: !prev.ai_is_active }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.ai_is_active ? 'bg-orange-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                  formData.ai_is_active ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          {formData.ai_is_active && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">AI 提示詞</label>
                <textarea
                  value={formData.ai_prompt}
                  onChange={(e) => setFormData(prev => ({ ...prev, ai_prompt: e.target.value }))}
                  placeholder="給 AI 的解讀提示詞..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none text-sm resize-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">AI 解讀加購價</label>
                <input
                  type="number"
                  min={0}
                  value={formData.ai_interpretation_addon_price ?? ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    ai_interpretation_addon_price: e.target.value ? Number(e.target.value) : null,
                  }))}
                  placeholder="留空表示不提供加購"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* 配額設定 */}
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Clock size={16} className="text-gray-500" />
              使用配額
              {existingQuotaId && <span className="text-xs text-green-600 font-normal">已設定</span>}
            </label>
            <button
              type="button"
              onClick={() => setQuotaFormData(prev => ({ ...prev, enabled: !prev.enabled }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                quotaFormData.enabled ? 'bg-orange-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                  quotaFormData.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          {quotaFormData.enabled && (
            <div className="space-y-3 bg-blue-50/50 rounded-lg p-3 border border-blue-100">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">重置週期</label>
                  <select
                    value={quotaFormData.reset_period}
                    onChange={(e) => setQuotaFormData(prev => ({ ...prev, reset_period: e.target.value as ResetPeriod }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none text-sm"
                  >
                    {RESET_PERIOD_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">每週期次數</label>
                  <input
                    type="number"
                    min={1}
                    value={quotaFormData.reset_amount}
                    onChange={(e) => setQuotaFormData(prev => ({ ...prev, reset_amount: Math.max(1, parseInt(e.target.value) || 1) }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none text-sm"
                  />
                </div>
              </div>
              {quotaFormData.reset_period === 'custom' && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">自訂天數</label>
                  <input
                    type="number"
                    min={1}
                    value={quotaFormData.custom_days ?? ''}
                    onChange={(e) => setQuotaFormData(prev => ({ ...prev, custom_days: e.target.value ? parseInt(e.target.value) : null }))}
                    placeholder="每 N 天重置一次"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none text-sm"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm text-gray-600 mb-1">啟用狀態</label>
                <button
                  type="button"
                  onClick={() => setQuotaFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                  className={`w-full flex items-center justify-center gap-2 px-3 py-2 border rounded-lg transition-colors text-sm ${
                    quotaFormData.is_active
                      ? 'border-green-300 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-gray-50 text-gray-500'
                  }`}
                >
                  {quotaFormData.is_active ? '啟用中' : '已停用'}
                </button>
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  // ===== Tab: 商品 =====
  function renderItemTab() {
    return (
      <>
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <ShoppingBag size={16} className="text-gray-500" />
              商品設定
              {editingItemId && <span className="text-xs text-green-600 font-normal">已建立</span>}
            </label>
            <button
              type="button"
              onClick={() => setItemFormData(prev => ({ ...prev, enabled: !prev.enabled }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                itemFormData.enabled ? 'bg-orange-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                  itemFormData.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          {itemFormData.enabled && (
            <div className="space-y-3 bg-orange-50/50 rounded-lg p-3 border border-orange-100">
              {/* 商品名稱 */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm text-gray-600">商品名稱</label>
                  <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={itemFormData.syncName}
                      onChange={(e) => {
                        const sync = e.target.checked;
                        setItemFormData(prev => ({
                          ...prev,
                          syncName: sync,
                          name: sync ? formData.name : prev.name,
                        }));
                      }}
                      className="rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                    />
                    與牌陣同名
                  </label>
                </div>
                <input
                  type="text"
                  value={itemFormData.name}
                  onChange={(e) => setItemFormData(prev => ({ ...prev, name: e.target.value, syncName: false }))}
                  placeholder="商品名稱"
                  disabled={itemFormData.syncName}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none text-sm disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              {/* 價格和上架 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    <DollarSign size={12} className="inline" /> 售價
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={itemFormData.base_price}
                    onChange={(e) => setItemFormData(prev => ({ ...prev, base_price: Number(e.target.value) || 0 }))}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">上架狀態</label>
                  <button
                    type="button"
                    onClick={() => setItemFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                    className={`w-full flex items-center justify-center gap-2 px-3 py-2 border rounded-lg transition-colors text-sm ${
                      itemFormData.is_active
                        ? 'border-green-300 bg-green-50 text-green-700'
                        : 'border-gray-200 bg-gray-50 text-gray-500'
                    }`}
                  >
                    {itemFormData.is_active ? '上架中' : '已下架'}
                  </button>
                </div>
              </div>

              {/* 描述 */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">商品描述</label>
                <textarea
                  value={itemFormData.description}
                  onChange={(e) => setItemFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="商品描述（選填）"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none text-sm resize-none"
                />
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  // ===== Tab: 推薦 =====
  function renderRecommendTab() {
    if (recLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-gray-400" />
        </div>
      );
    }

    const existingItemIds = new Set(recommendedItems.map(r => r.item_info_id));
    const existingPersonIds = new Set(recommendedPersons.map(r => r.profile_id));

    return (
      <>
        {/* ===== 推薦商品 ===== */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-3">
            <ShoppingBag size={16} className="text-orange-500" />
            推薦商品
            <span className="text-xs text-gray-400 font-normal">({recommendedItems.length} 個)</span>
          </h4>

          {/* 已新增列表 */}
          {recommendedItems.length > 0 && (
            <div className="space-y-1.5 mb-3">
              {recommendedItems.map(item => (
                <div key={item.id} className="flex items-center justify-between px-3 py-2 bg-orange-50/50 rounded-lg border border-orange-100">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-900 truncate">{item.item_name}</span>
                    <span className="ml-2 text-xs text-gray-400">#{item.item_info_id}</span>
                  </div>
                  <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                    <label className="text-xs text-gray-500">權重</label>
                    <input
                      type="number"
                      min={1}
                      value={item.numerator}
                      onChange={(e) => {
                        const val = Math.max(1, parseInt(e.target.value) || 1);
                        setRecommendedItems(prev => prev.map(r => r.id === item.id ? { ...r, numerator: val } : r));
                        handleUpdateRecItem(item.id, val);
                      }}
                      className="w-14 px-1 py-0.5 text-sm text-center border border-gray-200 rounded focus:ring-1 focus:ring-orange-400 outline-none"
                    />
                    <button onClick={() => handleDeleteRecItem(item.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 搜尋區塊 */}
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-2">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={itemSearchTag ? (itemTags.find(t => String(t.id) === itemSearchTag)?.name || '') : itemTagInput}
                  onChange={(e) => {
                    setItemTagInput(e.target.value);
                    setItemSearchTag('');
                    setShowItemTagDropdown(true);
                  }}
                  onFocus={() => setShowItemTagDropdown(true)}
                  onBlur={() => setTimeout(() => setShowItemTagDropdown(false), 150)}
                  placeholder="標籤篩選"
                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-orange-400 outline-none"
                />
                {showItemTagDropdown && (() => {
                  const filtered = itemTags.filter(t => !itemTagInput || t.name.toLowerCase().includes(itemTagInput.toLowerCase()));
                  return filtered.length > 0 ? (
                    <div className="absolute z-10 mt-1 w-full max-h-32 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                      <button type="button" onClick={() => { setItemSearchTag(''); setItemTagInput(''); setShowItemTagDropdown(false); }}
                        className="w-full px-3 py-1.5 text-left text-sm text-gray-500 hover:bg-gray-50">全部</button>
                      {filtered.map(t => (
                        <button key={t.id} type="button"
                          onClick={() => { setItemSearchTag(String(t.id)); setItemTagInput(t.name); setShowItemTagDropdown(false); }}
                          className="w-full px-3 py-1.5 text-left text-sm hover:bg-orange-50 truncate">{t.name}</button>
                      ))}
                    </div>
                  ) : null;
                })()}
              </div>
              <input
                type="text"
                value={itemSearchText}
                onChange={(e) => setItemSearchText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchItems()}
                placeholder="搜尋名稱/SKU"
                className="flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-orange-400 outline-none"
              />
              <button
                type="button"
                onClick={searchItems}
                disabled={searching}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-white rounded-lg transition-colors disabled:opacity-50"
                style={{ backgroundColor: COLORS.ai.primary }}
              >
                {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                搜尋
              </button>
            </div>

            {/* 搜尋結果 */}
            {searchedItems.length > 0 && (
              <>
                {searchedItems.some(i => i.client_sid) && (
                  <p className="text-xs text-gray-500 mb-1">
                    以下為各公司產品，灰色標籤為所屬公司
                  </p>
                )}
                <div className="max-h-40 overflow-y-auto space-y-1 border border-gray-200 rounded-lg p-1.5 bg-white">
                  {searchedItems.map(item => {
                    const alreadyAdded = existingItemIds.has(item.id);
                    const isSelected = selectedItemIds.has(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={alreadyAdded}
                        onClick={() => !alreadyAdded && toggleItemSelection(item.id)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm transition-colors ${
                          alreadyAdded
                            ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                            : isSelected
                              ? 'bg-orange-50 border border-orange-200'
                              : 'hover:bg-gray-50'
                        }`}
                      >
                        {alreadyAdded ? (
                          <CheckSquare size={14} className="text-green-400 flex-shrink-0" />
                        ) : isSelected ? (
                          <CheckSquare size={14} className="text-orange-500 flex-shrink-0" />
                        ) : (
                          <Square size={14} className="text-gray-300 flex-shrink-0" />
                        )}
                        <span className="flex-1 truncate">{item.name}</span>
                        {item.client_sid && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 flex-shrink-0" title="所屬公司">
                            {item.client_sid}
                          </span>
                        )}
                        <span className="text-xs text-gray-500 flex-shrink-0" title="類別">
                          {getItemTypeLabel(item.item_type)}
                        </span>
                        {alreadyAdded && <span className="text-xs text-green-500 flex-shrink-0">已加入</span>}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    找到 {searchedItems.length} 筆，已選 {selectedItemIds.size} 筆
                  </span>
                  <button
                    type="button"
                    onClick={handleBatchAddItems}
                    disabled={selectedItemIds.size === 0 || batchAdding}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50"
                    style={{ backgroundColor: COLORS.ai.primary }}
                  >
                    {batchAdding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    批量加入 ({selectedItemIds.size})
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ===== 推薦人員 ===== */}
        <div className="border-t border-gray-100 pt-4">
          <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-3">
            <User size={16} className="text-blue-500" />
            推薦人員
            <span className="text-xs text-gray-400 font-normal">({recommendedPersons.length} 個)</span>
          </h4>

          {/* 已新增列表 */}
          {recommendedPersons.length > 0 && (
            <div className="space-y-1.5 mb-3">
              {recommendedPersons.map(person => (
                <div key={person.id} className="flex items-center justify-between px-3 py-2 bg-blue-50/50 rounded-lg border border-blue-100">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-900 truncate">{person.profile_name}</span>
                    <span className="ml-2 text-xs text-gray-400">#{person.profile_id}</span>
                  </div>
                  <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                    <label className="text-xs text-gray-500">權重</label>
                    <input
                      type="number"
                      min={1}
                      value={person.numerator}
                      onChange={(e) => {
                        const val = Math.max(1, parseInt(e.target.value) || 1);
                        setRecommendedPersons(prev => prev.map(r => r.id === person.id ? { ...r, numerator: val } : r));
                        handleUpdateRecPerson(person.id, val);
                      }}
                      className="w-14 px-1 py-0.5 text-sm text-center border border-gray-200 rounded focus:ring-1 focus:ring-orange-400 outline-none"
                    />
                    <button onClick={() => handleDeleteRecPerson(person.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 搜尋區塊 */}
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-2">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={personSearchTag ? (personTags.find(t => String(t.id) === personSearchTag)?.name || '') : personTagInput}
                  onChange={(e) => {
                    setPersonTagInput(e.target.value);
                    setPersonSearchTag('');
                    setShowPersonTagDropdown(true);
                  }}
                  onFocus={() => setShowPersonTagDropdown(true)}
                  onBlur={() => setTimeout(() => setShowPersonTagDropdown(false), 150)}
                  placeholder="標籤篩選"
                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-orange-400 outline-none"
                />
                {showPersonTagDropdown && (() => {
                  const filtered = personTags.filter(t => !personTagInput || t.name.toLowerCase().includes(personTagInput.toLowerCase()));
                  return filtered.length > 0 ? (
                    <div className="absolute z-10 mt-1 w-full max-h-32 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                      <button type="button" onClick={() => { setPersonSearchTag(''); setPersonTagInput(''); setShowPersonTagDropdown(false); }}
                        className="w-full px-3 py-1.5 text-left text-sm text-gray-500 hover:bg-gray-50">全部</button>
                      {filtered.map(t => (
                        <button key={t.id} type="button"
                          onClick={() => { setPersonSearchTag(String(t.id)); setPersonTagInput(t.name); setShowPersonTagDropdown(false); }}
                          className="w-full px-3 py-1.5 text-left text-sm hover:bg-blue-50 truncate">{t.name}</button>
                      ))}
                    </div>
                  ) : null;
                })()}
              </div>
              <input
                type="text"
                value={personSearchText}
                onChange={(e) => setPersonSearchText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchPersons()}
                placeholder="搜尋名稱"
                className="flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-orange-400 outline-none"
              />
              <button
                type="button"
                onClick={searchPersons}
                disabled={searching}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-white rounded-lg transition-colors disabled:opacity-50"
                style={{ backgroundColor: COLORS.ai.primary }}
              >
                {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                搜尋
              </button>
            </div>

            {/* 搜尋結果 */}
            {searchedPersons.length > 0 && (
              <>
                <div className="max-h-40 overflow-y-auto space-y-1 border border-gray-200 rounded-lg p-1.5 bg-white">
                  {searchedPersons.map(person => {
                    const alreadyAdded = existingPersonIds.has(person.id);
                    const isSelected = selectedPersonIds.has(person.id);
                    return (
                      <button
                        key={person.id}
                        type="button"
                        disabled={alreadyAdded}
                        onClick={() => !alreadyAdded && togglePersonSelection(person.id)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm transition-colors ${
                          alreadyAdded
                            ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                            : isSelected
                              ? 'bg-blue-50 border border-blue-200'
                              : 'hover:bg-gray-50'
                        }`}
                      >
                        {alreadyAdded ? (
                          <CheckSquare size={14} className="text-green-400 flex-shrink-0" />
                        ) : isSelected ? (
                          <CheckSquare size={14} className="text-blue-500 flex-shrink-0" />
                        ) : (
                          <Square size={14} className="text-gray-300 flex-shrink-0" />
                        )}
                        <span className="flex-1 truncate">{person.name}</span>
                        <span className="text-xs text-gray-400 flex-shrink-0">#{person.id}</span>
                        {alreadyAdded && <span className="text-xs text-green-500 flex-shrink-0">已加入</span>}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    找到 {searchedPersons.length} 筆，已選 {selectedPersonIds.size} 筆
                  </span>
                  <button
                    type="button"
                    onClick={handleBatchAddPersons}
                    disabled={selectedPersonIds.size === 0 || batchAdding}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50"
                    style={{ backgroundColor: COLORS.ai.primary }}
                  >
                    {batchAdding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    批量加入 ({selectedPersonIds.size})
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </>
    );
  }
};

export default SpreadManagerModal;
