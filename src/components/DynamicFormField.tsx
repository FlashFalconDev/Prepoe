import React from 'react';
import type { FormField, DynamicFormData } from '../config/api';
import { shouldShowConditionalFields } from '../utils/formUtils';

interface DynamicFormFieldProps {
  field: FormField;
  value: any;
  onChange: (fieldId: string | number, value: any) => void;
  error?: string;
  formData: DynamicFormData; // 用於條件顯示判斷
}

/**
 * 動態表單欄位組件
 * 根據 field.type 渲染對應的輸入元件
 */
const DynamicFormField: React.FC<DynamicFormFieldProps> = ({
  field,
  value,
  onChange,
  error,
  formData
}) => {
  // 不顯示設定為不可見的欄位
  if (field.visible === false) {
    return null;
  }

  // 清理選項標籤（移除末尾的空括號或數字）
  const cleanLabel = (label: string): string => {
    if (!label) return '';
    
    let cleaned = label.trim();
    
    // 移除各種可能的末尾內容
    cleaned = cleaned
      .replace(/\(\s*\)$/g, '')        // 移除末尾的 "()" 或 "( )"
      .replace(/\s*\(\s*0+\s*\)$/g, '') // 移除末尾的 "(0)" 或 "( 0 )"
      .replace(/\s*0+$/g, '')           // 移除末尾的 "0" 及其前面的空格
      .replace(/[^\S\r\n]+$/g, '');    // 移除末尾的所有空白字符（除換行）
    
    return cleaned.trim();
  };

  // 渲染欄位標籤
  const renderLabel = () => (
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {field.label}
      {field.required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );

  // 渲染錯誤訊息
  const renderError = () => {
    if (!error) return null;
    return <p className="mt-1 text-sm text-red-600">{error}</p>;
  };

  // 渲染 text/email/tel/number 類型
  const renderTextInput = () => (
    <div className="mb-4">
      {renderLabel()}
      <input
        type={field.type}
        id={String(field.id)}
        value={value || ''}
        onChange={(e) => onChange(field.id, e.target.value)}
        placeholder={field.placeholder}
        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
        required={field.required}
      />
      {renderError()}
    </div>
  );

  // 渲染 textarea 類型
  const renderTextarea = () => (
    <div className="mb-4">
      {renderLabel()}
      <textarea
        id={String(field.id)}
        value={value || ''}
        onChange={(e) => onChange(field.id, e.target.value)}
        placeholder={field.placeholder}
        rows={4}
        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
        required={field.required}
      />
      {renderError()}
    </div>
  );

  // 渲染 select 類型
  const renderSelect = () => (
    <div className="mb-4">
      {renderLabel()}
      <select
        id={String(field.id)}
        value={value || ''}
        onChange={(e) => onChange(field.id, e.target.value)}
        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
        required={field.required}
      >
        <option value="">請選擇...</option>
        {field.options?.map((option) => (
          <option key={option.value} value={option.value}>
            {cleanLabel(option.label)}
            {option.price && option.price !== 0 ? (
              option.price > 0 
                ? ` (+NT$ ${option.price.toLocaleString()})` 
                : ` (-NT$ ${Math.abs(option.price).toLocaleString()})`
            ) : ''}
          </option>
        ))}
      </select>
      {renderError()}

      {/* 渲染條件欄位 */}
      {field.options?.map((option) => {
        if (shouldShowConditionalFields(field, value, option)) {
          return (
            <div key={`conditional-${option.value}`} className="ml-6 mt-4 pl-4 border-l-2 border-purple-300">
              {option.conditionalFields?.map((subField) => (
                <DynamicFormField
                  key={subField.id}
                  field={subField}
                  value={formData[subField.id]}
                  onChange={onChange}
                  error={error}
                  formData={formData}
                />
              ))}
            </div>
          );
        }
        return null;
      })}
    </div>
  );

  // 渲染 radio 類型
  const renderRadio = () => {
    // 處理 radio 點擊 - 如果非必選,允許取消選擇
    const handleRadioClick = (optionValue: string) => {
      if (!field.required && value === optionValue) {
        // 如果是非必選欄位,且點擊的是已選中的選項,則清空選擇
        // 使用 setTimeout 確保在 onChange 之後執行
        setTimeout(() => {
          onChange(field.id, '');
        }, 0);
      }
    };

    return (
      <div className="mb-4">
        {renderLabel()}
        {!field.required && (
          <div className="mb-2 bg-yellow-50 border border-yellow-200 rounded-lg p-2">
            <p className="text-xs text-yellow-700">
              💡 提示:此選項為非必選,已選擇的項目可點擊取消
            </p>
          </div>
        )}
        <div className="space-y-2">
          {field.options?.map((option) => (
            <div key={option.value}>
              <label
                className="flex items-start cursor-pointer group"
                onClick={(e) => {
                  // 在標籤層級處理點擊,避免干擾 radio 的原生行為
                  if (!field.required && value === option.value) {
                    e.preventDefault();
                    onChange(field.id, '');
                  }
                }}
              >
                <input
                  type="radio"
                  name={String(field.id)}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => {
                    // 只在選擇新選項時觸發
                    if (value !== option.value) {
                      onChange(field.id, e.target.value);
                    }
                  }}
                  className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 pointer-events-none flex-shrink-0"
                  required={field.required}
                />
                <div className="ml-3 flex-1 min-w-0">
                  <div className="text-gray-700 group-hover:text-purple-600">
                    {cleanLabel(option.label)}
                  </div>
                  {option.price && option.price !== 0 && (
                    <div className="mt-0.5">
                      {/* 如果有早鳥優惠且還在優惠期間內 */}
                      {option.earlyBird?.enabled && option.earlyBird.isActive && option.earlyBird.price !== undefined ? (
                        <div className="space-y-1">
                          {/* 原價（刪除線） */}
                          <div className={`font-medium text-sm line-through ${
                            option.price > 0 ? 'text-gray-400' : 'text-gray-400'
                          }`}>
                            {option.price > 0
                              ? `+NT$ ${option.price.toLocaleString()}`
                              : `-NT$ ${Math.abs(option.price).toLocaleString()}`
                            }
                          </div>
                          {/* 早鳥優惠價 */}
                          <div className="font-bold text-sm text-orange-600">
                            {option.earlyBird.price > 0
                              ? `+NT$ ${option.earlyBird.price.toLocaleString()}`
                              : option.earlyBird.price < 0
                              ? `-NT$ ${Math.abs(option.earlyBird.price).toLocaleString()}`
                              : 'NT$ 0'
                            }
                            <span className="ml-1 text-xs">🎉 早鳥價</span>
                          </div>
                          {/* 恢復原價時間 */}
                          {option.earlyBird.endDate && (
                            <div className="text-xs text-gray-500">
                              {new Date(option.earlyBird.endDate).toLocaleString('zh-TW', {
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })} 恢復原價
                            </div>
                          )}
                        </div>
                      ) : (
                        /* 沒有早鳥優惠或已過期，顯示正常價格 */
                        <div className={`font-medium text-sm ${
                          option.price > 0 ? 'text-purple-600' : 'text-green-600'
                        }`}>
                          {option.price > 0
                            ? `+NT$ ${option.price.toLocaleString()}`
                            : `-NT$ ${Math.abs(option.price).toLocaleString()}`
                          }
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </label>

              {/* 渲染條件欄位 */}
              {shouldShowConditionalFields(field, value, option) && (
                <div className="ml-6 mt-3 pl-4 border-l-2 border-purple-300 animate-fadeIn">
                  {option.conditionalFields?.map((subField) => (
                    <DynamicFormField
                      key={subField.id}
                      field={subField}
                      value={formData[subField.id]}
                      onChange={onChange}
                      error={error}
                      formData={formData}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        {renderError()}
      </div>
    );
  };

  // 渲染 checkbox 類型（支援多選限制）
  const renderCheckbox = () => {
    const selectedValues = Array.isArray(value) ? value : [];
    const selectedCount = selectedValues.length;
    const maxSelection = field.multiSelectConfig?.maxSelection;
    const minSelection = field.multiSelectConfig?.minSelection;
    const hasReachedMax = maxSelection && selectedCount >= maxSelection;

    const handleCheckboxChange = (optionValue: string, checked: boolean) => {
      let newValues: string[];
      if (checked) {
        newValues = [...selectedValues, optionValue];
      } else {
        newValues = selectedValues.filter((v) => v !== optionValue);
      }
      onChange(field.id, newValues);
    };

    return (
      <div className="mb-4">
        {renderLabel()}

        {/* 顯示選擇狀態 */}
        {(minSelection || maxSelection) && (
          <div className="text-sm text-gray-600 mb-2">
            已選 {selectedCount}
            {maxSelection && ` / ${maxSelection}`}
            {minSelection && ` (最少 ${minSelection} 項)`}
          </div>
        )}

        <div className="space-y-2">
          {field.options?.map((option) => {
            const isSelected = selectedValues.includes(option.value);
            const isDisabled = !isSelected && !!hasReachedMax;

            return (
              <div key={option.value}>
                <label
                  className={`flex items-start group ${
                    isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  <input
                    type="checkbox"
                    value={option.value}
                    checked={isSelected}
                    onChange={(e) => handleCheckboxChange(option.value, e.target.checked)}
                    disabled={isDisabled}
                    className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 disabled:opacity-50"
                  />
                  <span className={`ml-3 ${isDisabled ? 'text-gray-400' : 'text-gray-700 group-hover:text-purple-600'}`}>
                    {cleanLabel(option.label)}
                    {option.price && option.price !== 0 && (
                      <span className={`font-medium ml-2 ${
                        option.price > 0 ? 'text-purple-600' : 'text-green-600'
                      }`}>
                        {option.price > 0 
                          ? `(+NT$ ${option.price.toLocaleString()})` 
                          : `(-NT$ ${Math.abs(option.price).toLocaleString()})`
                        }
                      </span>
                    )}
                  </span>
                </label>

                {/* 渲染條件欄位 */}
                {shouldShowConditionalFields(field, value, option) && (
                  <div className="ml-6 mt-3 pl-4 border-l-2 border-purple-300 animate-fadeIn">
                    {option.conditionalFields?.map((subField) => (
                      <DynamicFormField
                        key={subField.id}
                        field={subField}
                        value={formData[subField.id]}
                        onChange={onChange}
                        error={error}
                        formData={formData}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 達到上限提示 */}
        {hasReachedMax && (
          <div className="text-amber-600 text-sm mt-2">
            ⚠️ 已達選擇上限
          </div>
        )}

        {renderError()}
      </div>
    );
  };

  // 渲染 boolean 類型（同意條款等）
  const renderBoolean = () => (
    <div className="mb-4">
      <label className="flex items-start cursor-pointer group">
        <input
          type="checkbox"
          id={String(field.id)}
          checked={value === true}
          onChange={(e) => onChange(field.id, e.target.checked)}
          className={`mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 ${
            error ? 'border-red-500' : ''
          }`}
          required={field.required}
        />
        <span className="ml-3 text-gray-700 group-hover:text-purple-600">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </span>
      </label>
      {renderError()}
    </div>
  );

  // 根據欄位類型渲染對應的組件
  switch (field.type) {
    case 'text':
    case 'email':
    case 'tel':
    case 'number':
      return renderTextInput();

    case 'textarea':
      return renderTextarea();

    case 'select':
      return renderSelect();

    case 'radio':
      return renderRadio();

    case 'checkbox':
      return renderCheckbox();

    case 'boolean':
      return renderBoolean();

    default:
      console.warn(`未知的欄位類型: ${field.type}`);
      return null;
  }
};

export default DynamicFormField;

