import { useState, useCallback } from 'react';
import type { FormField, DynamicFormData } from '../config/api';
import { getVisibleConditionalFields } from '../utils/formUtils';

// 驗證錯誤類型
export type ValidationErrors = Record<string, string>;

/**
 * 表單驗證 Hook
 * 處理必填、格式驗證、多選限制等
 */
export const useFormValidation = () => {
  const [errors, setErrors] = useState<ValidationErrors>({});

  /**
   * 驗證單個欄位
   */
  const validateField = useCallback((
    field: FormField,
    value: any
  ): string | null => {
    // 必填驗證
    if (field.required) {
      if (value === undefined || value === null || value === '') {
        return `${field.label}為必填欄位`;
      }

      // 陣列類型的必填驗證
      if (Array.isArray(value) && value.length === 0) {
        return `${field.label}為必填欄位`;
      }

      // 布林值類型的必填驗證
      if (field.type === 'boolean' && value !== true) {
        return `請勾選${field.label}`;
      }
    }

    // 如果不是必填且值為空，跳過其他驗證
    if (!value && !field.required) {
      return null;
    }

    // 多選限制驗證
    if (field.type === 'checkbox' && field.multiSelectConfig && Array.isArray(value)) {
      const selectedCount = value.length;

      if (field.multiSelectConfig.minSelection !== undefined) {
        if (selectedCount < field.multiSelectConfig.minSelection) {
          return `請至少選擇 ${field.multiSelectConfig.minSelection} 項`;
        }
      }

      if (field.multiSelectConfig.maxSelection !== undefined) {
        if (selectedCount > field.multiSelectConfig.maxSelection) {
          return `最多只能選擇 ${field.multiSelectConfig.maxSelection} 項`;
        }
      }
    }

    // 自訂驗證規則
    if (field.validation && value) {
      const { min, max, pattern, errorMessage } = field.validation;

      // 字串長度或數字範圍驗證
      if (typeof value === 'string') {
        if (min !== undefined && value.length < min) {
          return errorMessage || `${field.label}最少需要 ${min} 個字元`;
        }

        if (max !== undefined && value.length > max) {
          return errorMessage || `${field.label}最多 ${max} 個字元`;
        }
      }

      if (typeof value === 'number') {
        if (min !== undefined && value < min) {
          return errorMessage || `${field.label}最小值為 ${min}`;
        }

        if (max !== undefined && value > max) {
          return errorMessage || `${field.label}最大值為 ${max}`;
        }
      }

      // 正則表達式驗證
      if (pattern && typeof value === 'string') {
        const regex = new RegExp(pattern);
        if (!regex.test(value)) {
          return errorMessage || `${field.label}格式不正確`;
        }
      }
    }

    return null;
  }, []);

  /**
   * 驗證整個表單
   */
  const validateForm = useCallback((
    formFields: FormField[],
    formData: DynamicFormData
  ): { isValid: boolean; errors: ValidationErrors } => {
    const newErrors: ValidationErrors = {};

    // 收集所有需要驗證的欄位（包括可見的條件欄位）
    const allFields = [
      ...formFields,
      ...getVisibleConditionalFields(formFields, formData)
    ];

    // 驗證每個欄位
    allFields.forEach((field) => {
      const error = validateField(field, formData[String(field.id)]);
      if (error) {
        newErrors[String(field.id)] = error;
      }
    });

    setErrors(newErrors);

    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: newErrors
    };
  }, [validateField]);

  /**
   * 清除特定欄位的錯誤
   */
  const clearFieldError = useCallback((fieldId: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldId];
      return newErrors;
    });
  }, []);

  /**
   * 清除所有錯誤
   */
  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  /**
   * 手動設定錯誤
   */
  const setFieldError = useCallback((fieldId: string, error: string) => {
    setErrors((prev) => ({
      ...prev,
      [fieldId]: error
    }));
  }, []);

  return {
    errors,              // 當前錯誤
    validateField,       // 驗證單個欄位
    validateForm,        // 驗證整個表單
    clearFieldError,     // 清除特定欄位錯誤
    clearAllErrors,      // 清除所有錯誤
    setFieldError        // 手動設定錯誤
  };
};

