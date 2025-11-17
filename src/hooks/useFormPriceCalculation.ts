import { useMemo } from 'react';
import type { FormField, DynamicFormData } from '../config/api';
import { calculateTotalPrice, getPriceBreakdown } from '../utils/formUtils';

/**
 * 表單價格計算 Hook
 * 自動計算總價和價格明細
 */
export const useFormPriceCalculation = (
  basePrice: number,
  formData: DynamicFormData,
  formFields: FormField[]
) => {
  // 計算總價
  const totalPrice = useMemo(() => {
    return calculateTotalPrice(basePrice, formData, formFields);
  }, [basePrice, formData, formFields]);

  // 計算價格明細
  const priceBreakdown = useMemo(() => {
    return getPriceBreakdown(basePrice, formData, formFields);
  }, [basePrice, formData, formFields]);

  // 額外費用（不含基本費用）
  const extraCost = useMemo(() => {
    return totalPrice - basePrice;
  }, [totalPrice, basePrice]);

  return {
    totalPrice,      // 總價
    priceBreakdown,  // 價格明細
    extraCost,       // 額外費用
    basePrice        // 基本費用
  };
};

