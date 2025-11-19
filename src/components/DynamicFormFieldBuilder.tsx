import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { AI_COLORS } from '../constants/colors';
import { FormFieldType, FormField } from '../config/api';

interface DynamicFormFieldBuilderProps {
  fields: FormField[];
  onChange: (fields: FormField[]) => void;
  earlyBirdConfig?: {
    enabled: boolean;
    endDate: string;
    price?: number;
  };
}

const FIELD_TYPES: Array<{ value: FormFieldType; label: string; icon: string }> = [
  { value: 'text', label: '文字', icon: 'ri-text' },
  { value: 'textarea', label: '多行文字', icon: 'ri-file-text-line' },
  { value: 'email', label: '電子郵件', icon: 'ri-mail-line' },
  { value: 'tel', label: '電話', icon: 'ri-phone-line' },
  { value: 'number', label: '數字', icon: 'ri-hashtag' },
  { value: 'select', label: '下拉選單', icon: 'ri-arrow-down-s-line' },
  { value: 'radio', label: '單選', icon: 'ri-radio-button-line' },
  { value: 'checkbox', label: '多選', icon: 'ri-checkbox-multiple-line' }
];

// 預設的基本欄位
const DEFAULT_FIELDS: FormField[] = [
  {
    id: 'name',
    type: 'text',
    label: '姓名',
    placeholder: '請輸入您的姓名',
    required: true,
    order: 0
  },
  {
    id: 'email',
    type: 'text',
    label: '電子郵件',
    placeholder: 'example@email.com',
    required: true,
    order: 1
  },
  {
    id: 'phone',
    type: 'text',
    label: '聯絡電話',
    placeholder: '0912345678',
    required: true,
    order: 2
  }
];

const DynamicFormFieldBuilder: React.FC<DynamicFormFieldBuilderProps> = ({ fields, onChange, earlyBirdConfig }) => {
  const [expandedFieldId, setExpandedFieldId] = useState<string | null>(null);

  // 早鳥價彈窗狀態（只設定價格，日期來自 earlyBirdConfig）
  const [showEarlyBirdModal, setShowEarlyBirdModal] = useState(false);
  const [editingEarlyBird, setEditingEarlyBird] = useState<{
    fieldId: string;
    optionIndex: number;
    originalPrice: number;
  } | null>(null);
  const [earlyBirdPrice, setEarlyBirdPrice] = useState(0);

  // 初始化預設欄位
  useEffect(() => {
    if (fields.length === 0) {
      onChange(DEFAULT_FIELDS);
    }
  }, []);

  // 新增欄位
  const addField = () => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type: 'text',
      label: '新欄位',
      required: false,
      order: fields.length,
      placeholder: ''
    };
    onChange([...fields, newField]);
    setExpandedFieldId(String(newField.id));
  };

  // 刪除欄位
  const deleteField = (fieldId: string | number) => {
    const updatedFields = fields.filter(f => String(f.id) !== String(fieldId)).map((f, index) => ({ ...f, order: index }));
    onChange(updatedFields);
  };

  // 更新欄位
  const updateField = (fieldId: string | number, updates: Partial<FormField>) => {
    const updatedFields = fields.map(f => String(f.id) === String(fieldId) ? { ...f, ...updates } : f);
    onChange(updatedFields);
  };

  // 拖拽結束處理
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    // 只處理非預設欄位的拖曳
    const nonDefaultFields = fields.filter(field => !isDefaultField(field.id));
    const defaultFields = fields.filter(field => isDefaultField(field.id));

    // 在非預設欄位中重新排序
    const items = Array.from(nonDefaultFields);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // 合併預設欄位和重新排序後的欄位
    const allFields = [...defaultFields, ...items];

    // 更新 order
    const updatedItems = allFields.map((item, index) => ({ ...item, order: index }));
    onChange(updatedItems);
  };

  // 新增選項 (for radio/checkbox/select)
  const addOption = (fieldId: string | number) => {
    const field = fields.find(f => String(f.id) === String(fieldId));
    if (!field) return;

    const newOption = {
      id: `option_${Date.now()}`,
      value: `option_${Date.now()}`,
      label: '新選項',
      price: 0
    };

    const updatedOptions = [...(field.options || []), newOption];
    updateField(fieldId, { options: updatedOptions });
  };

  // 刪除選項
  const deleteOption = (fieldId: string | number, optionIndex: number) => {
    const field = fields.find(f => String(f.id) === String(fieldId));
    if (!field || !field.options) return;

    const updatedOptions = field.options.filter((_, index) => index !== optionIndex);
    updateField(fieldId, { options: updatedOptions });
  };

  // 更新選項
  const updateOption = (fieldId: string | number, optionIndex: number, updates: any) => {
    const field = fields.find(f => String(f.id) === String(fieldId));
    if (!field || !field.options) return;

    const updatedOptions = field.options.map((opt, index) =>
      index === optionIndex ? { ...opt, ...updates } : opt
    );
    updateField(fieldId, { options: updatedOptions });
  };

  // 打開早鳥價設定彈窗（只設定價格，日期顯示活動的統一設定）
  const openEarlyBirdModal = (fieldId: string | number, optionIndex: number) => {
    const field = fields.find(f => String(f.id) === String(fieldId));
    if (!field || !field.options) return;

    const option = field.options[optionIndex];
    const originalPrice = option.price || 0;

    // 優先使用 earlyBirdPrice（前端編輯），其次使用 earlyBird.price（後端回傳）
    const currentEarlyBirdPrice = option.earlyBirdPrice !== undefined
      ? option.earlyBirdPrice
      : (option.earlyBird?.price ?? 0);

    // 如果後端有早鳥價格但前端沒有，需要同步到前端
    // 這樣即使使用者沒有修改就關閉 modal，earlyBirdPrice 也會存在
    if (option.earlyBird?.price !== undefined && option.earlyBirdPrice === undefined) {
      updateOption(fieldId, optionIndex, {
        earlyBirdPrice: option.earlyBird.price
      });
    }

    setEditingEarlyBird({ fieldId: String(fieldId), optionIndex, originalPrice });
    setEarlyBirdPrice(currentEarlyBirdPrice);
    setShowEarlyBirdModal(true);
  };

  // 保存早鳥價設定
  const saveEarlyBird = () => {
    if (!editingEarlyBird) return;

    const { fieldId, optionIndex, originalPrice } = editingEarlyBird;

    // 檢查是否已啟用活動層級的早鳥優惠
    if (!earlyBirdConfig?.enabled) {
      alert('請先在活動設定中啟用早鳥優惠並設定截止日期');
      return;
    }

    // 驗證早鳥價必須小於或等於原價（等於原價表示取消早鳥）
    if (earlyBirdPrice > originalPrice) {
      alert(`早鳥價 (NT$ ${earlyBirdPrice}) 不能大於原價 (NT$ ${originalPrice})`);
      return;
    }

    // 更新選項的早鳥價格（只存價格，不存日期）
    // 總是保存 earlyBirdPrice，即使是 0 或等於原價
    updateOption(fieldId, optionIndex, {
      earlyBirdPrice: earlyBirdPrice
    });

    setShowEarlyBirdModal(false);
    setEditingEarlyBird(null);
  };

  // 新增條件欄位
  const addConditionalField = (fieldId: string | number, optionIndex: number) => {
    const field = fields.find(f => String(f.id) === String(fieldId));
    if (!field || !field.options) return;

    const newConditionalField: FormField = {
      id: `conditional_${Date.now()}`,
      type: 'text',
      label: '條件欄位',
      placeholder: '',
      required: true,
      order: (field.options[optionIndex].conditionalFields?.length || 0)
    };

    const updatedOptions = field.options.map((opt, index) => {
      if (index === optionIndex) {
        return {
          ...opt,
          conditionalFields: [...(opt.conditionalFields || []), newConditionalField]
        };
      }
      return opt;
    });

    updateField(fieldId, { options: updatedOptions });
  };

  // 刪除條件欄位
  const deleteConditionalField = (fieldId: string | number, optionIndex: number, conditionalIndex: number) => {
    const field = fields.find(f => String(f.id) === String(fieldId));
    if (!field || !field.options) return;

    const updatedOptions = field.options.map((opt, index) => {
      if (index === optionIndex && opt.conditionalFields) {
        return {
          ...opt,
          conditionalFields: opt.conditionalFields.filter((_, i) => i !== conditionalIndex)
        };
      }
      return opt;
    });

    updateField(fieldId, { options: updatedOptions });
  };

  // 更新條件欄位
  const updateConditionalField = (fieldId: string | number, optionIndex: number, conditionalIndex: number, updates: Partial<FormField>) => {
    const field = fields.find(f => String(f.id) === String(fieldId));
    if (!field || !field.options) return;

    const updatedOptions = field.options.map((opt, index) => {
      if (index === optionIndex && opt.conditionalFields) {
        return {
          ...opt,
          conditionalFields: opt.conditionalFields.map((cf, i) =>
            i === conditionalIndex ? { ...cf, ...updates } : cf
          )
        };
      }
      return opt;
    });

    updateField(fieldId, { options: updatedOptions });
  };

  // 判斷欄位類型是否需要選項
  const needsOptions = (type: FormFieldType) => ['select', 'radio', 'checkbox'].includes(type);

  // 判斷是否為預設欄位(不可編輯)
  const isDefaultField = (fieldId: string | number) => ['name', 'email', 'phone'].includes(String(fieldId));

  return (
    <div className="space-y-4">
      {/* 標題和新增按鈕 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">表單欄位</h3>
        <button
          type="button"
          onClick={addField}
          className={`flex items-center gap-2 px-3 py-2 ${AI_COLORS.button} rounded-lg transition-colors text-sm`}
        >
          <i className="ri-add-line" style={{ fontSize: '16px' }}></i>
          新增欄位
        </button>
      </div>

      {/* 提示訊息 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <div className="flex items-start gap-2">
          <i className="ri-information-line text-blue-600 text-lg mt-0.5"></i>
          <div className="flex-1">
            <p className="text-sm text-blue-800 font-medium">預設欄位說明</p>
            <p className="text-xs text-blue-600 mt-1">
              系統已預設「姓名」、「電子郵件」、「聯絡電話」三個基本必填欄位，無需額外設定。您可以在下方新增更多自訂欄位。
            </p>
          </div>
        </div>
      </div>

      {/* 欄位列表 */}
      {fields.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <i className="ri-loader-4-line animate-spin text-4xl text-gray-400 mb-3"></i>
          <p className="text-gray-500">正在載入預設欄位...</p>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="form-fields-list">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                {fields.filter(field => !isDefaultField(field.id)).map((field, index) => {
                  const fieldKey = `field-${String(field.id)}`;
                  return (
                  <Draggable key={fieldKey} draggableId={fieldKey} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`bg-white border rounded-lg transition-shadow ${
                          snapshot.isDragging ? 'shadow-lg' : 'shadow-sm hover:shadow-md'
                        }`}
                      >
                        {/* 欄位標頭 */}
                        <div className="flex items-center gap-3 p-4">
                          {/* 拖拽手柄 */}
                          <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                            <i className="ri-draggable text-gray-400 text-xl"></i>
                          </div>

                          {/* 欄位資訊 */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 truncate">{field.label || '未命名欄位'}</span>
                              <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                                {FIELD_TYPES.find(t => t.value === field.type)?.label || field.type}
                              </span>
                              {field.required && (
                                <span className="text-red-500 text-xs">*必填</span>
                              )}
                            </div>
                          </div>

                          {/* 操作按鈕 */}
                          {!isDefaultField(field.id) && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setExpandedFieldId(expandedFieldId === String(field.id) ? null : String(field.id))}
                                className={`p-2 rounded-lg transition-colors ${
                                  expandedFieldId === String(field.id)
                                    ? `${AI_COLORS.text} ${AI_COLORS.bgLight}`
                                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                                }`}
                                title="編輯"
                              >
                                <i className={`${expandedFieldId === String(field.id) ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} text-xl`}></i>
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteField(String(field.id))}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="刪除"
                              >
                                <i className="ri-delete-bin-line text-xl"></i>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* 欄位編輯區域 */}
                        {expandedFieldId === String(field.id) && !isDefaultField(field.id) && (
                          <div className="border-t px-4 py-4 space-y-4 bg-gray-50">
                            {/* 基本設定 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">欄位標籤</label>
                                <input
                                  type="text"
                                  value={field.label}
                                  onChange={(e) => updateField(String(field.id), { label: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                  placeholder="例如:姓名、電子郵件"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">欄位類型</label>
                                <select
                                  value={field.type}
                                  onChange={(e) => updateField(String(field.id), { type: e.target.value as FormFieldType })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                >
                                  {FIELD_TYPES.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">提示文字</label>
                              <input
                                type="text"
                                value={field.placeholder || ''}
                                onChange={(e) => updateField(String(field.id), { placeholder: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                placeholder="例如:請輸入您的姓名"
                              />
                            </div>

                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                id={`required-${String(field.id)}`}
                                checked={field.required}
                                onChange={(e) => updateField(String(field.id), { required: e.target.checked })}
                                className="accent-orange-600 w-4 h-4"
                              />
                              <label htmlFor={`required-${String(field.id)}`} className="text-sm text-gray-700">
                                此欄位為必填
                              </label>
                            </div>

                            {/* 多選數量限制 (僅 checkbox) */}
                            {field.type === 'checkbox' && (
                              <div className="grid grid-cols-2 gap-4 pt-2">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">最少選擇數量</label>
                                  <input
                                    type="number"
                                    value={field.multiSelectConfig?.minSelection || ''}
                                    onChange={(e) => updateField(String(field.id), {
                                      multiSelectConfig: {
                                        ...field.multiSelectConfig,
                                        minSelection: e.target.value ? parseInt(e.target.value) : undefined
                                      }
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    placeholder="不限制"
                                    min="0"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">最多選擇數量</label>
                                  <input
                                    type="number"
                                    value={field.multiSelectConfig?.maxSelection || ''}
                                    onChange={(e) => updateField(String(field.id), {
                                      multiSelectConfig: {
                                        ...field.multiSelectConfig,
                                        maxSelection: e.target.value ? parseInt(e.target.value) : undefined
                                      }
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    placeholder="不限制"
                                    min="1"
                                  />
                                </div>
                              </div>
                            )}

                            {/* 選項設定 (for radio/checkbox/select) */}
                            {needsOptions(field.type) && (
                              <div className="mt-4 pt-4 border-t">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="text-sm font-medium text-gray-700">選項設定</h4>
                                  <button
                                    type="button"
                                    onClick={() => addOption(String(field.id))}
                                    className="flex items-center gap-1 px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
                                  >
                                    <i className="ri-add-line"></i>
                                    新增選項
                                  </button>
                                </div>

                                <div className="space-y-3">
                                  {(field.options || []).map((option, optIndex) => (
                                    <div key={optIndex} className="bg-white p-3 rounded-lg border">
                                      {/* 選項標題與刪除按鈕 */}
                                      <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-medium text-gray-700">選項 {optIndex + 1}</span>
                                        <button
                                          type="button"
                                          onClick={() => deleteOption(String(field.id), optIndex)}
                                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                          title="刪除選項"
                                        >
                                          <i className="ri-close-line text-lg"></i>
                                        </button>
                                      </div>

                                      {/* 選項基本設定 */}
                                      <div className="grid grid-cols-1 sm:grid-cols-[2fr,1fr] gap-2 mb-2">
                                        <input
                                          type="text"
                                          value={option.label}
                                          onChange={(e) => updateOption(String(field.id), optIndex, { label: e.target.value })}
                                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                                          placeholder="選項名稱"
                                        />
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm text-gray-600 flex-shrink-0">NT$</span>
                                          <input
                                            type="number"
                                            value={option.price || 0}
                                            onChange={(e) => updateOption(String(field.id), optIndex, { price: parseInt(e.target.value) || 0 })}
                                            className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                                            placeholder="加價"
                                            min="0"
                                          />
                                          {/* 早鳥價設定按鈕（只在活動啟用早鳥且選項有價格時顯示）*/}
                                          {earlyBirdConfig?.enabled && (option.price || 0) > 0 && (() => {
                                            // 檢查早鳥價格的邏輯：
                                            // 1. 如果 earlyBirdPrice 已設定（包括 undefined），使用 earlyBirdPrice
                                            // 2. 否則使用 earlyBird.price（後端回傳的值）
                                            const hasExplicitEarlyBirdPrice = 'earlyBirdPrice' in option;
                                            const currentEarlyBirdPrice = hasExplicitEarlyBirdPrice
                                              ? option.earlyBirdPrice
                                              : option.earlyBird?.price;

                                            // 早鳥價格存在且不等於原價（等於原價或 undefined 表示已取消）
                                            const hasEarlyBird = currentEarlyBirdPrice !== undefined
                                              && currentEarlyBirdPrice !== null
                                              && currentEarlyBirdPrice !== option.price;

                                            return (
                                              <button
                                                type="button"
                                                onClick={() => openEarlyBirdModal(String(field.id), optIndex)}
                                                className={`p-2 rounded transition-colors flex-shrink-0 ${
                                                  hasEarlyBird
                                                    ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                                                    : 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
                                                }`}
                                                title={hasEarlyBird ? '早鳥價已設定' : '設定早鳥價'}
                                              >
                                                <i className="ri-vip-crown-line text-lg"></i>
                                              </button>
                                            );
                                          })()}
                                        </div>
                                      </div>

                                      {/* 條件欄位區域 */}
                                      <div className="ml-4 mt-2 border-l-2 border-gray-200 pl-3">
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="text-xs text-gray-600">選擇此選項時顯示的欄位</span>
                                          <button
                                            type="button"
                                            onClick={() => addConditionalField(String(field.id), optIndex)}
                                            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                          >
                                            <i className="ri-add-line"></i>
                                            新增條件欄位
                                          </button>
                                        </div>

                                        {/* 條件欄位列表 */}
                                        {option.conditionalFields && option.conditionalFields.length > 0 && (
                                          <div className="space-y-2">
                                            {option.conditionalFields.map((cf, cfIndex) => (
                                              <div key={cfIndex} className="bg-gray-50 p-2 rounded border border-gray-200">
                                                <div className="grid grid-cols-2 gap-2 mb-2">
                                                  <input
                                                    type="text"
                                                    value={cf.label}
                                                    onChange={(e) => updateConditionalField(String(field.id), optIndex, cfIndex, { label: e.target.value })}
                                                    className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder="欄位名稱"
                                                  />
                                                  <select
                                                    value={cf.type}
                                                    onChange={(e) => updateConditionalField(String(field.id), optIndex, cfIndex, { type: e.target.value as FormFieldType })}
                                                    className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                  >
                                                    {FIELD_TYPES.map(type => (
                                                      <option key={type.value} value={type.value}>{type.label}</option>
                                                    ))}
                                                  </select>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                  <input
                                                    type="text"
                                                    value={cf.placeholder || ''}
                                                    onChange={(e) => updateConditionalField(String(field.id), optIndex, cfIndex, { placeholder: e.target.value })}
                                                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder="提示文字"
                                                  />
                                                  <label className="flex items-center gap-1 ml-2 text-xs text-gray-600">
                                                    <input
                                                      type="checkbox"
                                                      checked={cf.required}
                                                      onChange={(e) => updateConditionalField(String(field.id), optIndex, cfIndex, { required: e.target.checked })}
                                                      className="accent-blue-600"
                                                    />
                                                    必填
                                                  </label>
                                                  <button
                                                    type="button"
                                                    onClick={() => deleteConditionalField(String(field.id), optIndex, cfIndex)}
                                                    className="ml-2 p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                                                    title="刪除條件欄位"
                                                  >
                                                    <i className="ri-delete-bin-line text-sm"></i>
                                                  </button>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* 早鳥價設定彈窗（只設定價格，日期顯示統一設定）*/}
      {showEarlyBirdModal && editingEarlyBird && earlyBirdConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <i className="ri-vip-crown-line text-orange-600"></i>
                選項早鳥價設定
              </h3>
              <button
                onClick={() => setShowEarlyBirdModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <i className="ri-close-line text-lg"></i>
              </button>
            </div>

            <div className="space-y-4">
              {/* 說明文字 */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700">
                  💡 早鳥截止日期由活動統一管理，此處只需設定此選項的早鳥價格。
                </p>
              </div>

              {/* 早鳥截止日期顯示（只讀）*/}
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="text-sm text-orange-700 mb-1">
                  <i className="ri-time-line mr-1"></i>
                  早鳥優惠截止時間
                </div>
                <div className="text-base font-semibold text-orange-900">
                  {new Date(earlyBirdConfig.endDate).toLocaleString('zh-TW', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>

              {/* 原價顯示 */}
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="text-sm text-purple-700 mb-1">選項加價</div>
                <div className="text-lg font-semibold text-purple-900">NT$ {editingEarlyBird.originalPrice.toLocaleString()}</div>
              </div>

              {/* 早鳥價輸入 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  早鳥優惠加價
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">NT$</span>
                  <input
                    type="number"
                    value={earlyBirdPrice}
                    onChange={(e) => setEarlyBirdPrice(parseInt(e.target.value) || 0)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    min="0"
                    max={editingEarlyBird.originalPrice}
                    placeholder="0"
                  />
                  {earlyBirdPrice !== editingEarlyBird.originalPrice && (
                    <button
                      type="button"
                      onClick={() => setEarlyBirdPrice(editingEarlyBird.originalPrice)}
                      className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors flex-shrink-0"
                      title="取消早鳥優惠"
                    >
                      移除
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {earlyBirdPrice === editingEarlyBird.originalPrice
                    ? '設定為原價表示取消早鳥優惠'
                    : `早鳥價可設定 0 ~ ${editingEarlyBird.originalPrice}，設定為原價 (NT$ ${editingEarlyBird.originalPrice}) 即可取消`}
                </p>
              </div>
            </div>

            {/* 按鈕 */}
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowEarlyBirdModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={saveEarlyBird}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                確定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicFormFieldBuilder;
