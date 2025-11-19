import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import { useConfirm } from '../../hooks/useConfirm';
import { useFormPriceCalculation } from '../../hooks/useFormPriceCalculation';
import { useFormValidation } from '../../hooks/useFormValidation';
import ConfirmDialog from '../../components/ConfirmDialog';
import DynamicFormField from '../../components/DynamicFormField';
import ParticipantFormCard from '../../components/ParticipantFormCard';
import { 
  getEventJoinInfo, 
  createOrder, 
  EventJoinInfo, 
  CreateOrderRequest,
  DynamicFormData,
  FormField
} from '../../config/api';
import { AI_COLORS } from '../../constants/colors';
import { sortFormFields, initializeFormData } from '../../utils/formUtils';

// 預設表單欄位（基本資訊）
const DEFAULT_FORM_FIELDS: FormField[] = [
  {
    id: 'name',
    type: 'text',
    label: '姓名',
    required: true,
    order: 1
  },
  {
    id: 'email',
    type: 'email',
    label: '電子郵件',
    required: true,
    placeholder: '請輸入您的電子郵件',
    order: 2
  },
  {
    id: 'phone',
    type: 'tel',
    label: '聯絡電話',
    required: true,
    order: 3
  }
];

/**
 * 合併預設欄位和後端傳來的欄位
 * 如果後端有傳同樣 id 的欄位，則使用後端的配置
 * 後端傳來的欄位 order 會自動加 10，確保預設欄位排在前面
 */
const mergeFormFields = (backendFields: FormField[] | undefined): FormField[] => {
  if (!backendFields || !Array.isArray(backendFields)) {
    return DEFAULT_FORM_FIELDS;
  }

  // 建立一個 Map 來存放所有欄位（後端的會覆蓋預設的）
  const fieldMap = new Map<string, FormField>();

  // 先加入預設欄位
  DEFAULT_FORM_FIELDS.forEach(field => {
    fieldMap.set(String(field.id), field);
  });

  // 後端傳來的欄位會覆蓋預設的，並且 order 加 10
  backendFields.forEach(field => {
    fieldMap.set(String(field.id), {
      ...field,
      order: field.order + 10  // 後端的 order 都加 10
    });
  });

  // 轉換回陣列並按 order 排序
  return Array.from(fieldMap.values()).sort((a, b) => a.order - b.order);
};

const EventJoin: React.FC = () => {
  const { sku } = useParams<{ sku: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { confirm, isOpen, options, handleConfirm, handleCancel } = useConfirm();

  // 狀態管理
  const [eventInfo, setEventInfo] = useState<EventJoinInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // 多人報名狀態
  const [participantCount, setParticipantCount] = useState(1);
  const [participants, setParticipants] = useState<DynamicFormData[]>([{}]);
  const [primaryContactIndex, setPrimaryContactIndex] = useState(0);
  const [contactNote, setContactNote] = useState('');
  const [paymentType, setPaymentType] = useState('');
  
  // 條款和備註
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showRemarkSection, setShowRemarkSection] = useState(false);
  const [remarkNote, setRemarkNote] = useState('');

  // 圖片查看器
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [viewingImageUrl, setViewingImageUrl] = useState<string>('');

  // 使用 ref 來追蹤是否已經載入過資料，防止重複請求
  const hasLoadedRef = useRef(false);
  const isLoadingRef = useRef(false);

  // 使用 useCallback 包裝 loadEventInfo 函數，避免不必要的重新渲染
  const loadEventInfo = useCallback(async () => {
    // 防止重複請求 - 檢查是否已載入或正在載入中
    if (hasLoadedRef.current || isLoadingRef.current) {
      console.log('⚠️ 活動資訊已載入或正在載入中，跳過重複請求');
      return;
    }

    try {
      isLoadingRef.current = true; // 立即標記為載入中
      setLoading(true);

      if (!sku) {
        showError('參數錯誤', '缺少活動 SKU 參數');
        return;
      }

      console.log('🔍 正在載入活動資訊，SKU:', sku);

      // 將 URL 查詢參數轉換為物件
      const queryParams: Record<string, string> = {};
      searchParams.forEach((value, key) => {
        queryParams[key] = value;
      });

      console.log('🔍 URL 查詢參數:', queryParams);

      const response = await getEventJoinInfo(sku, queryParams);
      console.log('🔍 API 回應:', response);

      if (response.success) {
        setEventInfo(response.data);
        
        // 合併預設欄位和後端傳來的欄位，然後初始化第一個參加者
        const mergedFields = mergeFormFields(response.data.form_fields);
        const initialData = initializeFormData(mergedFields);
        setParticipants([initialData]);
        console.log('✅ 動態表單初始化完成:', initialData);
        console.log('📋 合併後的表單欄位:', mergedFields);
        
        hasLoadedRef.current = true; // 標記為已載入
        console.log('✅ 活動資訊載入成功:', response.data);
      } else {
        console.error('❌ API 回應失敗:', response.message);
        showError('載入失敗', response.message);
      }
    } catch (error: any) {
      console.error('❌ 載入活動資訊時發生錯誤:', error);
      showError('載入失敗', error.message || '無法載入活動資訊');
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [sku, searchParams, showError]);

  // 載入活動資訊
  useEffect(() => {
    if (sku && !hasLoadedRef.current && !isLoadingRef.current) {
      loadEventInfo();
    }
  }, [sku, loadEventInfo]);

  // 使用動態表單 Hooks
  const { errors, validateForm, clearFieldError } = useFormValidation();
  
  // 合併預設欄位和後端傳來的欄位
  const formFields = mergeFormFields(eventInfo?.form_fields);
  
  // 取得選項的實際價格（考慮早鳥優惠）
  const getOptionPrice = (option: any): number => {
    if (option.earlyBird?.enabled && option.earlyBird.isActive && option.earlyBird.price !== undefined) {
      return option.earlyBird.price;
    }
    return option.price || 0;
  };

  // 計算所有參加者的總價格和明細
  const calculatePriceDetails = () => {
    // 基本價格：如果活動有早鳥優惠，使用早鳥價，否則使用原價
    let unitPrice = eventInfo?.base_price || 0;
    if (eventInfo?.earlyBird?.enabled && eventInfo.earlyBird.isActive && eventInfo.earlyBird.price !== undefined) {
      unitPrice = eventInfo.earlyBird.price;
    }
    const basePrice = unitPrice * participantCount;

    const participantDetails: Array<{
      participantIndex: number;
      items: Array<{ label: string; price: number }>;
    }> = [];
    let extraPrice = 0;

    participants.forEach((participant, participantIndex) => {
      const items: Array<{ label: string; price: number }> = [];

      formFields.forEach((field) => {
        if (!field.options) return;

        const fieldValue = participant[String(field.id)];

        // 單選類型
        if (field.type === 'radio' || field.type === 'select') {
          const selectedOption = field.options.find(opt => opt.value === fieldValue);
          if (selectedOption) {
            // 使用早鳥價格（如果有的話）
            const actualPrice = getOptionPrice(selectedOption);
            if (actualPrice !== 0) {
              extraPrice += actualPrice;
              items.push({
                label: `${field.label}: ${selectedOption.label}`,
                price: actualPrice
              });
            }
          }

          // 條件欄位的價格
          if (selectedOption?.conditionalFields) {
            selectedOption.conditionalFields.forEach((subField) => {
              if (!subField.options) return;
              const subValue = participant[String(subField.id)];
              const subOption = subField.options.find(opt => opt.value === subValue);
              if (subOption) {
                const actualPrice = getOptionPrice(subOption);
                if (actualPrice !== 0) {
                  extraPrice += actualPrice;
                  items.push({
                    label: `  ${subField.label}: ${subOption.label}`,
                    price: actualPrice
                  });
                }
              }
            });
          }
        }

        // 多選類型
        if (field.type === 'checkbox' && Array.isArray(fieldValue)) {
          fieldValue.forEach((value: string) => {
            const option = field.options?.find(opt => opt.value === value);
            if (option) {
              const actualPrice = getOptionPrice(option);
              if (actualPrice !== 0) {
                extraPrice += actualPrice;
                items.push({
                  label: `${field.label}: ${option.label}`,
                  price: actualPrice
                });
              }
            }
          });
        }
      });

      // 只有當該參加者有加購項目時才加入
      if (items.length > 0) {
        participantDetails.push({
          participantIndex,
          items
        });
      }
    });

    return {
      basePrice,
      extraPrice,
      totalPrice: basePrice + extraPrice,
      participantDetails
    };
  };
  
  const priceInfo = calculatePriceDetails();
  const totalPrice = priceInfo.totalPrice;
  
  // 處理參加者數量變更
  const handleParticipantCountChange = (count: number) => {
    setParticipantCount(count);
    
    const newParticipants = [...participants];
    
    // 如果增加人數，添加新的空表單
    while (newParticipants.length < count) {
      const initialData = formFields.length > 0 
        ? initializeFormData(formFields)
        : {};
      newParticipants.push(initialData);
    }
    
    // 如果減少人數，移除多餘的表單
    if (newParticipants.length > count) {
      newParticipants.splice(count);
    }
    
    setParticipants(newParticipants);
    
    // 如果主要聯絡人索引超過新的人數，重置為第一人
    if (primaryContactIndex >= count && primaryContactIndex !== -1) {
      setPrimaryContactIndex(0);
    }
  };
  
  // 處理單個參加者的表單欄位變更
  const handleParticipantFieldChange = (participantIndex: number, fieldId: string | number, value: any) => {
    const newParticipants = [...participants];
    newParticipants[participantIndex] = {
      ...newParticipants[participantIndex],
      [String(fieldId)]: value
    };
    setParticipants(newParticipants);
  };

  /**
   * 清理參加者數據，移除未顯示的條件欄位
   * 只保留應該提交的欄位數據
   */
  const cleanParticipantData = (participantData: DynamicFormData): DynamicFormData => {
    const cleanedData: DynamicFormData = {};
    
    // 收集所有應該顯示的欄位 ID
    const visibleFieldIds = new Set<string>();
    
    // 添加所有主欄位
    formFields.forEach(field => {
      visibleFieldIds.add(String(field.id));

      // 檢查是否有條件欄位需要顯示（支持 radio 和 select）
      if (field.options && (field.type === 'radio' || field.type === 'select')) {
        const selectedValue = participantData[String(field.id)];
        const selectedOption = field.options.find(opt => opt.value === selectedValue);

        // 如果選項有條件欄位，添加這些欄位 ID
        if (selectedOption?.conditionalFields) {
          selectedOption.conditionalFields.forEach(subField => {
            visibleFieldIds.add(String(subField.id));
          });
        }
      }
    });
    
    // 只保留可見欄位的數據
    Object.keys(participantData).forEach(key => {
      if (visibleFieldIds.has(key)) {
        cleanedData[key] = participantData[key];
      }
    });
    
    return cleanedData;
  };

  // 處理表單提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!eventInfo) {
      showError('活動資訊載入失敗');
      return;
    }

    // 驗證所有參加者的表單
    const fieldsToValidate = Array.isArray(eventInfo.form_fields) ? eventInfo.form_fields : [];
    let allValid = true;
    let firstErrorMessage = '';
    
    for (let i = 0; i < participants.length; i++) {
      const { isValid, errors: validationErrors } = validateForm(
        fieldsToValidate,
        participants[i]
      );
      
      if (!isValid) {
        allValid = false;
        const firstError = Object.values(validationErrors)[0];
        firstErrorMessage = `參加者 ${i + 1}: ${firstError}`;
        break;
      }
    }
    
    if (!allValid) {
      showError(firstErrorMessage || '請檢查表單欄位');
      return;
    }
    
    // 檢查聯絡人設定（只需確認有選擇）
    // primaryContactIndex 預設為 0，不需要額外檢查
    
    // 檢查付款方式
    if (totalPrice > 0 && !paymentType) {
      showError('請選擇付款方式');
      return;
    }
    
    // 檢查條款同意
    // 只有在有活動條款時才需要檢查
    if (eventInfo?.terms_of_event && !agreeTerms) {
      showError('請同意活動條款');
      return;
    }

    // 確認報名（顯示總價和人數）
    const primaryContactName = participants[primaryContactIndex]?.name || `參加者 ${primaryContactIndex + 1}`;
    const confirmed = await confirm({
      title: '確認報名',
      message: `確定要報名參加「${eventInfo.name}」嗎？\n報名人數：${participantCount}人${
        totalPrice > 0 ? `\n活動費用：NT$ ${totalPrice.toLocaleString()}` : ''
      }\n聯絡人：${primaryContactName}`,
      confirmText: '確認報名',
      cancelText: '取消',
      type: 'info'
    });

    if (!confirmed) return;

    try {
      setSubmitting(true);

      if (!eventInfo) {
        showError('活動資訊載入失敗');
        return;
      }

      // 如果是付費活動，使用訂單創建 API
      if (totalPrice > 0 && paymentType) {
        // 清理所有參加者的數據，移除未顯示的條件欄位，並加入 is_primary_contact 欄位
        const cleanedParticipants = participants.map((participant, index) => ({
          ...cleanParticipantData(participant),
          is_primary_contact: index === primaryContactIndex ? 1 : 0
        }));

        const orderData: CreateOrderRequest = {
          items: [
            {
              item_pk: eventInfo.item_pk,
              quantity: participantCount
            }
          ],
          payment_method: paymentType,
          participant_info: {
            participant_count: participantCount,
            participants: cleanedParticipants,
            contact_note: contactNote,
            remark: remarkNote
          } as any
        };

        console.log('📝 創建訂單資料:', orderData);
        console.log('🧹 清理前的參加者數據:', participants);
        console.log('✨ 清理後的參加者數據:', cleanedParticipants);

        const orderResponse = await createOrder(orderData);

        console.log('📋 訂單回應:', orderResponse);

        if (orderResponse.success) {
          // 如果有支付 HTML，需要渲染並自動提交
          if (orderResponse.payment_html) {
            console.log('💳 收到支付 HTML，準備跳轉到支付頁面');

            // 創建一個隱藏的 div 來渲染支付表單
            const paymentContainer = document.createElement('div');
            paymentContainer.innerHTML = orderResponse.payment_html;
            document.body.appendChild(paymentContainer);

            // 尋找表單並自動提交
            const form = paymentContainer.querySelector('form');
            if (form) {
              console.log('✅ 找到支付表單，自動提交中...');
              form.submit();
            } else {
              console.error('❌ 未找到支付表單');
              showError('支付表單載入失敗');
              document.body.removeChild(paymentContainer);
            }
          } else {
            // 無需支付或現金支付
            showSuccess('報名成功！');
            console.log('✅ 訂單創建成功:', orderResponse.data);

            // 重新初始化表單
            const mergedFields = mergeFormFields(eventInfo.form_fields);
            const initialData = initializeFormData(mergedFields);
            setParticipants([initialData]);
            setParticipantCount(1);
            setPrimaryContactIndex(0);
            setContactNote('');
            setPaymentType('');
            setAgreeTerms(false);
            setRemarkNote('');
            setShowRemarkSection(false);

            // 可以跳轉到成功頁面或顯示訂單詳情
            if (orderResponse.data?.order_id) {
              // navigate(`/client/order/${orderResponse.data.order_id}`);
            }
          }
        } else {
          showError(orderResponse.message || '訂單創建失敗');
        }
      } else {
        // 免費活動，直接提交報名（如果後端有提供這個 API）
        showSuccess('免費活動報名成功！');

        // 重新初始化表單
        const mergedFields = mergeFormFields(eventInfo.form_fields);
        const initialData = initializeFormData(mergedFields);
        setParticipants([initialData]);
        setParticipantCount(1);
        setPrimaryContactIndex(0);
        setContactNote('');
        setPaymentType('');
        setAgreeTerms(false);
        setRemarkNote('');
        setShowRemarkSection(false);
      }

    } catch (error: any) {
      console.error('❌ 報名失敗:', error);
      showError(error.message || '報名過程中發生錯誤');
    } finally {
      setSubmitting(false);
    }
  };

  // 格式化時間
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

  // 載入中狀態
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${AI_COLORS.border} mx-auto mb-4`}></div>
          <p className="text-gray-600">載入活動資訊中...</p>
        </div>
      </div>
    );
  }

  // 活動不存在
  if (!eventInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-gray-400 mb-4">
            <i className="ri-calendar-line text-6xl"></i>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">活動不存在</h3>
          <p className="text-gray-500 mb-6">找不到指定的活動，請檢查連結是否正確。</p>
          <button
            onClick={() => navigate('/')}
            className={`inline-flex items-center gap-2 px-4 py-2 ${AI_COLORS.button} rounded-xl transition-colors`}
          >
            <i className="ri-home-line"></i>
            返回首頁
          </button>
        </div>
      </div>
    );
  }

  // 判斷是否可以報名
  const isRegistrationOpen = eventInfo.event_status === 'registration_open';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 活動資訊 */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">活動資訊</h2>

                {/* 活動狀態標籤 */}
                <span className={`inline-block px-3 py-1 text-sm rounded-full ${
                  eventInfo.event_status === 'registration_open'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {eventInfo.event_status_display}
                </span>
              </div>

              {/* 活動主圖 (使用 images 的第一張) */}
              {eventInfo.images && eventInfo.images.length > 0 && eventInfo.images[0] && (
                <div className="mb-4">
                  <img
                    src={eventInfo.images[0].url}
                    alt={eventInfo.name}
                    className="w-full h-48 object-cover rounded-lg cursor-pointer"
                    onClick={() => {
                      setViewingImageUrl(eventInfo.images![0].url);
                      setShowImageViewer(true);
                    }}
                  />

                  {/* 其他圖片縮圖 */}
                  {eventInfo.images.length > 1 && (
                    <div className="mt-3 flex gap-2 overflow-x-auto">
                      {eventInfo.images.slice(1).map((image, index) => (
                        <div
                          key={index}
                          className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-orange-400 transition-all"
                          onClick={() => {
                            setViewingImageUrl(image.url);
                            setShowImageViewer(true);
                          }}
                        >
                          <img
                            src={image.url}
                            alt={`${eventInfo.name} - 圖片 ${index + 2}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* 活動詳情 */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{eventInfo.name}</h3>
                  <p className="text-gray-600 text-sm mt-1 whitespace-pre-wrap">{eventInfo.description}</p>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-500">
                    <i className="ri-calendar-line"></i>
                    <span>{formatDateTime(eventInfo.start_time)} - {formatDateTime(eventInfo.end_time)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <i className="ri-map-pin-line"></i>
                    <span>{eventInfo.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <i className="ri-money-dollar-circle-line"></i>
                    <span>
                      {formFields && formFields.length > 0 ? (
                        totalPrice > eventInfo.base_price ? (
                          <>
                            <span className="line-through text-gray-400 mr-2">NT$ {eventInfo.base_price}</span>
                            <span className="font-semibold text-purple-600">NT$ {totalPrice.toLocaleString()}</span>
                          </>
                        ) : (
                          `NT$ ${totalPrice.toLocaleString()}`
                        )
                      ) : (
                        `NT$ ${eventInfo.base_price}`
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <i className="ri-user-line"></i>
                    <span>
                      {eventInfo.min_participants} - {eventInfo.max_participants} 人
                      {eventInfo.current_participants_count !== undefined && (
                        <span className={`ml-2 font-medium ${
                          eventInfo.current_participants_count >= eventInfo.min_participants
                            ? 'text-green-600'
                            : 'text-orange-600'
                        }`}>
                          (已報名 {eventInfo.current_participants_count})
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {/* 活動標籤 */}
                {eventInfo.item_tags && eventInfo.item_tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    {eventInfo.item_tags.map((tag) => (
                      <span key={tag.id} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 報名表單 - 只在報名開放時顯示 */}
          {isRegistrationOpen && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">報名表單</h2>

                {/* 報名表單內容 */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {formFields && formFields.length > 0 ? (
                    <>
                      {/* 報名人數選擇（如果允許多人報名） */}
                      {eventInfo && eventInfo.max_participants_per_user > 1 && (
                      <div className="pb-6 border-b">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          報名人數 <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={participantCount}
                          onChange={(e) => handleParticipantCountChange(Number(e.target.value))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          {Array.from({ length: eventInfo.max_participants_per_user }, (_, i) => i + 1).map((num) => (
                            <option key={num} value={num}>
                              {num === 1 ? '1人' : `${num}人（代報名${num - 1}人）`}
                            </option>
                          ))}
                        </select>
                        <p className="mt-2 text-sm text-gray-500">
                          💡 此活動最多可為 {eventInfo.max_participants_per_user} 人報名
                        </p>
                      </div>
                    )}

                    {/* 參加者表單卡片 */}
                    <div className="space-y-4">
                      {participants.map((participant, index) => (
                        <ParticipantFormCard
                          key={index}
                          participantIndex={index}
                          participantName={participant.name || ''}
                          isPrimaryContact={primaryContactIndex === index}
                          formFields={formFields}
                          formData={participant}
                          errors={{}}
                          onChange={(fieldId, value) => handleParticipantFieldChange(index, fieldId, value)}
                        />
                      ))}
                    </div>

                    {/* 聯絡人選擇（如果有多人） */}
                    {participantCount > 1 && (
                      <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
                        <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                          <span>📧</span>
                          <span>聯絡人設定</span>
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                          選擇的聯絡人將收到活動通知和確認信
                        </p>
                        <div className="space-y-2">
                          {participants.map((participant, index) => (
                            <label
                              key={index}
                              className="flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer hover:bg-blue-50 transition-colors"
                            >
                              <input
                                type="radio"
                                name="primary_contact"
                                value={index}
                                checked={primaryContactIndex === index}
                                onChange={() => setPrimaryContactIndex(index)}
                                className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                              />
                              <span className="text-gray-900">
                                參加者 {index + 1}
                                {participant.name && <span className="text-gray-600 ml-2">({participant.name})</span>}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 費用明細 */}
                    {totalPrice > 0 && (
                      <div className="bg-purple-50 rounded-lg p-6 border-2 border-purple-200">
                        <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                          <span>💰</span>
                          <span>費用明細</span>
                        </h3>
                        <div className="space-y-2">
                          {/* 基本費用 */}
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              基本費用 {participantCount > 1 && `(${participantCount}人)`}
                            </span>
                            <span className="text-gray-900 font-medium">
                              NT$ {priceInfo.basePrice.toLocaleString()}
                            </span>
                          </div>
                          
                          {/* 加購項目明細 - 按參加者分組 */}
                          {priceInfo.participantDetails.map((participantDetail) => (
                            <div key={participantDetail.participantIndex} className="space-y-1">
                              {/* 參加者標題（如果是多人報名） */}
                              {participantCount > 1 && (
                                <div className="text-sm font-medium text-gray-800 mt-2">
                                  參加者 {participantDetail.participantIndex + 1}
                                </div>
                              )}
                              
                              {/* 該參加者的所有加購項目 */}
                              {participantDetail.items.map((item, itemIndex) => (
                                <div key={itemIndex} className="flex justify-between text-sm">
                                  <span className={`${item.price < 0 ? 'text-green-700' : 'text-gray-600'} ${participantCount > 1 ? 'pl-3' : ''}`}>
                                    {participantCount > 1 && '· '}
                                    {item.label}
                                  </span>
                                  <span className={`font-medium ${
                                    item.price > 0 ? 'text-purple-700' : 'text-green-700'
                                  }`}>
                                    {item.price > 0 ? '+' : ''}NT$ {item.price.toLocaleString()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ))}
                          
                          {/* 總計 */}
                          <div className="border-t border-purple-200 pt-2 mt-2">
                            <div className="flex justify-between text-base font-semibold">
                              <span className="text-gray-900">總計</span>
                              <span className="text-purple-600 text-xl">
                                NT$ {totalPrice.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 付款方式 */}
                    {totalPrice > 0 && eventInfo.payment_info && eventInfo.payment_info.length > 0 && (
                      <div className="space-y-4 pt-4 border-t">
                        <h3 className="text-lg font-medium text-gray-900">
                          付款方式 <span className="text-red-500">*</span>
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {eventInfo.payment_info.map((payment) => (
                            <label
                              key={payment.payment_type}
                              className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                paymentType === payment.payment_type
                                  ? 'border-purple-500 bg-purple-50'
                                  : 'border-gray-200 hover:border-purple-300 bg-white'
                              }`}
                            >
                              <input
                                type="radio"
                                name="payment_type"
                                value={payment.payment_type}
                                checked={paymentType === payment.payment_type}
                                onChange={(e) => setPaymentType(e.target.value)}
                                className="sr-only"
                              />
                              <div className="flex items-center gap-3 w-full">
                                <div
                                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                    paymentType === payment.payment_type
                                      ? 'border-purple-500 bg-purple-500'
                                      : 'border-gray-300'
                                  }`}
                                >
                                  {paymentType === payment.payment_type && (
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                  )}
                                </div>
                                <span className="text-sm font-medium text-gray-900">
                                  {payment.payment_display}
                                </span>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 同意條款（必填 - 只在有條款時顯示） */}
                    {eventInfo?.terms_of_event && (
                      <div className="space-y-3 pt-4 border-t">
                        <div className={`flex items-start gap-3 p-3 rounded-lg ${
                          !agreeTerms ? 'bg-red-50 border border-red-200' : 'bg-gray-50'
                        }`}>
                          <input
                            type="checkbox"
                            id="agree_terms"
                            checked={agreeTerms}
                            onChange={(e) => setAgreeTerms(e.target.checked)}
                            className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 rounded"
                            required
                          />
                          <label htmlFor="agree_terms" className="flex-1 text-sm text-gray-700 cursor-pointer">
                            我同意{' '}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                setShowTermsModal(true);
                              }}
                              className="text-purple-600 hover:text-purple-700 underline"
                            >
                              活動條款
                            </button>
                            {' '}和相關規定
                            <span className="text-red-500 ml-1">*</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* 備註區塊（可展開） */}
                    <div className="pt-4 border-t">
                      <button
                        type="button"
                        onClick={() => setShowRemarkSection(!showRemarkSection)}
                        className="flex items-center justify-between w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-gray-700 font-medium">📝 備註（選填）</span>
                        </div>
                        <span className={`transform transition-transform ${showRemarkSection ? 'rotate-180' : ''}`}>
                          ▼
                        </span>
                      </button>
                      
                      {showRemarkSection && (
                        <div className="mt-3 p-4 bg-gray-50 rounded-lg animate-fadeIn">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            其他備註
                          </label>
                          <textarea
                            value={remarkNote}
                            onChange={(e) => setRemarkNote(e.target.value)}
                            placeholder="如有其他需求或說明，請在此填寫..."
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                          <p className="mt-2 text-xs text-gray-500">
                            💡 例如：特殊飲食需求、交通安排、其他注意事項等
                          </p>
                        </div>
                      )}
                    </div>

                    {/* 提交按鈕 */}
                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={submitting}
                        className={`w-full px-6 py-3 ${AI_COLORS.button} rounded-xl disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-lg`}
                      >
                        {submitting ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            提交中...
                          </div>
                        ) : (
                          <>
                            確認報名
                            {participantCount > 1 && <span className="ml-2">({participantCount}人)</span>}
                            {totalPrice > 0 && <span className="ml-2">NT$ {totalPrice.toLocaleString()}</span>}
                          </>
                        )}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <p>此活動尚未配置報名表單</p>
                  </div>
                )}
              </form>
            </div>
          </div>
          )}
        </div>
      </div>

      {/* 確認對話框 */}
      <ConfirmDialog
        isOpen={isOpen}
        title={options.title || '確認操作'}
        message={options.message}
        confirmText={options.confirmText}
        cancelText={options.cancelText}
        type={options.type}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />

      {/* 圖片查看器彈窗 */}
      {showImageViewer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4"
          onClick={() => setShowImageViewer(false)}
        >
          <div className="relative max-w-6xl max-h-full">
            <button
              onClick={() => setShowImageViewer(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <i className="ri-close-line text-3xl"></i>
            </button>
            <img
              src={viewingImageUrl}
              alt="查看圖片"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* 活動條款彈窗 */}
      {showTermsModal && eventInfo?.terms_of_event && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowTermsModal(false)}
        >
          <div
            className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 標題列 */}
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900">活動條款</h3>
              <button
                onClick={() => setShowTermsModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            {/* 內容區域 */}
            <div className="flex-1 overflow-y-auto p-6">
              <div
                className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: eventInfo.terms_of_event }}
              />
            </div>

            {/* 按鈕區域 */}
            <div className="flex gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowTermsModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setAgreeTerms(true);
                  setShowTermsModal(false);
                }}
                className={`flex-1 px-4 py-2 ${AI_COLORS.button} rounded-lg transition-colors`}
              >
                同意條款
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventJoin;
