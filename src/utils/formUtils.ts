import type { FormField, FormFieldOption, DynamicFormData } from '../config/api';

/**
 * 根據 order 欄位對表單欄位進行排序
 */
export const sortFormFields = (fields: FormField[]): FormField[] => {
  // 防禦性檢查：確保 fields 是陣列
  if (!Array.isArray(fields)) {
    console.warn('fields is not an array:', fields);
    return [];
  }
  return [...fields].sort((a, b) => a.order - b.order);
};

/**
 * 取得選項的實際價格（考慮早鳥優惠）
 * @param option 選項
 * @returns 實際價格
 */
const getOptionPrice = (option: FormFieldOption): number => {
  // 如果有早鳥優惠且目前還在優惠期間內
  if (option.earlyBird?.enabled && option.earlyBird.isActive && option.earlyBird.price !== undefined) {
    return option.earlyBird.price;
  }
  return option.price || 0;
};

/**
 * 計算選項的總價格（累加模式）
 * @param basePrice 基本價格
 * @param formData 表單資料
 * @param formFields 表單欄位定義
 * @returns 總價格
 */
export const calculateTotalPrice = (
  basePrice: number,
  formData: DynamicFormData,
  formFields: FormField[]
): number => {
  let total = basePrice;

  // 防禦性檢查：確保 formFields 是陣列
  if (!Array.isArray(formFields)) {
    console.warn('formFields is not an array:', formFields);
    return total;
  }

  formFields.forEach((field) => {
    if (!field.options) return;

    const fieldValue = formData[String(field.id)];

    // 單選類型 (radio, select)
    if (field.type === 'radio' || field.type === 'select') {
      const selectedOption = field.options.find(opt => opt.value === fieldValue);
      if (selectedOption) {
        // 使用早鳥價格（如果有的話）
        total += getOptionPrice(selectedOption);
      }

      // 計算條件欄位的價格
      if (selectedOption?.conditionalFields) {
        total += calculateTotalPrice(0, formData, selectedOption.conditionalFields);
      }
    }

    // 多選類型 (checkbox)
    if (field.type === 'checkbox' && Array.isArray(fieldValue)) {
      fieldValue.forEach((value: string) => {
        const option = field.options?.find(opt => opt.value === value);
        if (option) {
          // 使用早鳥價格（如果有的話）
          total += getOptionPrice(option);
        }

        // 計算條件欄位的價格
        if (option?.conditionalFields) {
          total += calculateTotalPrice(0, formData, option.conditionalFields);
        }
      });
    }
  });

  return total;
};

/**
 * 獲取價格明細
 * @param basePrice 基本價格
 * @param formData 表單資料
 * @param formFields 表單欄位定義
 * @returns 價格明細陣列
 */
export const getPriceBreakdown = (
  basePrice: number,
  formData: DynamicFormData,
  formFields: FormField[]
): Array<{ label: string; price: number }> => {
  const breakdown: Array<{ label: string; price: number }> = [
    { label: '基本費用', price: basePrice }
  ];

  // 防禦性檢查：確保 formFields 是陣列
  if (!Array.isArray(formFields)) {
    console.warn('formFields is not an array:', formFields);
    return breakdown;
  }

  const collectPrices = (fields: FormField[], prefix = '') => {
    // 再次檢查
    if (!Array.isArray(fields)) return;
    fields.forEach((field) => {
      if (!field.options) return;

      const fieldValue = formData[String(field.id)];

      // 單選類型
      if (field.type === 'radio' || field.type === 'select') {
        const selectedOption = field.options.find(opt => opt.value === fieldValue);
        if (selectedOption) {
          // 使用早鳥價格（如果有的話）
          const actualPrice = getOptionPrice(selectedOption);
          if (actualPrice > 0 || actualPrice < 0) {
            breakdown.push({
              label: `${prefix}${field.label}: ${selectedOption.label}`,
              price: actualPrice
            });
          }
        }

        // 處理條件欄位
        if (selectedOption?.conditionalFields) {
          collectPrices(selectedOption.conditionalFields, `${prefix}  `);
        }
      }

      // 多選類型
      if (field.type === 'checkbox' && Array.isArray(fieldValue)) {
        fieldValue.forEach((value: string) => {
          const option = field.options?.find(opt => opt.value === value);
          if (option) {
            // 使用早鳥價格（如果有的話）
            const actualPrice = getOptionPrice(option);
            if (actualPrice > 0 || actualPrice < 0) {
              breakdown.push({
                label: `${prefix}${field.label}: ${option.label}`,
                price: actualPrice
              });
            }
          }

          // 處理條件欄位
          if (option?.conditionalFields) {
            collectPrices(option.conditionalFields, `${prefix}  `);
          }
        });
      }
    });
  };

  collectPrices(formFields);

  return breakdown;
};

/**
 * 判斷條件欄位是否應該顯示
 * @param parentField 父欄位
 * @param parentValue 父欄位的值
 * @param option 選項
 * @returns 是否顯示條件欄位
 */
export const shouldShowConditionalFields = (
  parentField: FormField,
  parentValue: any,
  option: FormFieldOption
): boolean => {
  if (!option.conditionalFields || option.conditionalFields.length === 0) {
    return false;
  }

  // 單選類型：值相等時顯示
  if (parentField.type === 'radio' || parentField.type === 'select') {
    return parentValue === option.value;
  }

  // 多選類型：值包含在陣列中時顯示
  if (parentField.type === 'checkbox') {
    return Array.isArray(parentValue) && parentValue.includes(option.value);
  }

  return false;
};

/**
 * 收集所有需要顯示的條件欄位
 * @param formFields 表單欄位
 * @param formData 表單資料
 * @returns 所有應該顯示的條件欄位（扁平化）
 */
export const getVisibleConditionalFields = (
  formFields: FormField[],
  formData: DynamicFormData
): FormField[] => {
  const visibleFields: FormField[] = [];

  // 防禦性檢查：確保 formFields 是陣列
  if (!Array.isArray(formFields)) {
    console.warn('formFields is not an array:', formFields);
    return visibleFields;
  }

  const collectFields = (fields: FormField[]) => {
    // 再次檢查
    if (!Array.isArray(fields)) return;
    fields.forEach((field) => {
      if (!field.options) return;

      const fieldValue = formData[String(field.id)];

      field.options.forEach((option) => {
        if (shouldShowConditionalFields(field, fieldValue, option) && option.conditionalFields) {
          visibleFields.push(...option.conditionalFields);
          // 遞迴處理條件欄位的條件欄位
          collectFields(option.conditionalFields);
        }
      });
    });
  };

  collectFields(formFields);

  return visibleFields;
};

/**
 * 初始化表單資料（設定預設值）
 * @param formFields 表單欄位
 * @returns 初始化的表單資料
 */
export const initializeFormData = (formFields: FormField[]): DynamicFormData => {
  const data: DynamicFormData = {};

  // 防禦性檢查：確保 formFields 是陣列
  if (!Array.isArray(formFields)) {
    console.warn('formFields is not an array:', formFields);
    return data;
  }

  const processFields = (fields: FormField[]) => {
    // 再次檢查
    if (!Array.isArray(fields)) return;
    fields.forEach((field) => {
      if (field.defaultValue !== undefined) {
        data[String(field.id)] = field.defaultValue;
      } else {
        // 設定預設空值
        switch (field.type) {
          case 'checkbox':
            data[String(field.id)] = [];
            break;
          case 'boolean':
            data[String(field.id)] = false;
            break;
          case 'number':
            data[String(field.id)] = 0;
            break;
          default:
            data[String(field.id)] = '';
        }
      }

      // 處理選項中的條件欄位
      if (field.options) {
        field.options.forEach((option) => {
          if (option.conditionalFields) {
            processFields(option.conditionalFields);
          }
        });
      }
    });
  };

  processFields(formFields);

  return data;
};

