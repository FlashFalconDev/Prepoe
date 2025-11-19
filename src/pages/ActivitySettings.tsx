import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import { useAuth } from '../contexts/AuthContext';
import ConfirmDialog from '../components/ConfirmDialog';
import ImagePlaceholder from '../components/ImagePlaceholder';
import ReferrerOrdersModal from '../components/ReferrerOrdersModal';
import EventParticipantsModal from '../components/EventParticipantsModal';
import DynamicFormFieldBuilder from '../components/DynamicFormFieldBuilder';
import { AI_COLORS } from '../constants/colors';
import {
  getItemEventItems,
  getItemEventItemDetail,
  createItemEventItem,
  updateItemEventItem,
  deleteItemEventItem,
  getItemEventStatistics,
  refreshItemEventStatistics,
  createEventJoinUrl,
  batchCreateFormFields,
  syncFormFields,
  uploadFile,
  FormField,
  deleteEventImage,
  reorderEventImages
} from '../config/api';

// 使用新的 ItemEvent 介面
import type {
  ItemEventItem,
  ItemEventStatistics,
  SingleResponse,
  PaginatedResponse,
  ItemImageUpload
} from '../config/api';

const ActivitySettings: React.FC = () => {
  console.log('🎯 ActivitySettings 組件已載入');

  const { showSuccess, showError } = useToast();
  const { confirm, isOpen, options, handleConfirm, handleCancel } = useConfirm();
  const { user } = useAuth();

  // 過濾掉預設欄位的輔助函數
  const isDefaultField = (fieldId: string | number) => ['name', 'email', 'phone'].includes(String(fieldId));
  const filterDefaultFields = (fields: FormField[]) => fields.filter(f => !isDefaultField(String(f.id)));
  
  // 狀態管理
  const [activeTab, setActiveTab] = useState<'modules' | 'events' | 'registrations' | 'statistics'>('events');
  const [events, setEvents] = useState<ItemEventItem[]>([]);
  const [statistics, setStatistics] = useState<ItemEventStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  
  // 模態框狀態
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ItemEventItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 推薦訂單彈窗狀態
  const [showReferrerOrdersModal, setShowReferrerOrdersModal] = useState(false);
  const [selectedEventForOrders, setSelectedEventForOrders] = useState<ItemEventItem | null>(null);

  // 參與者彈窗狀態
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [selectedEventForParticipants, setSelectedEventForParticipants] = useState<ItemEventItem | null>(null);

  // 圖片查看器狀態
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [viewingImageUrl, setViewingImageUrl] = useState<string>('');
  
  const [eventForm, setEventForm] = useState({
    name: '',
    description: '',
    base_price: 0,
    earlyBirdConfig: undefined as { enabled: boolean; endDate: string; price?: number } | undefined,
    earlyBird: undefined as { enabled: boolean; endDate: string; price?: number; isActive?: boolean } | undefined,
    start_time: '',
    end_time: '',
    location: '',
    min_participants: 1,
    max_participants: 100,
    max_participants_per_user: 1,
    use_check_in: true,
    event_status: 'draft' as 'draft' | 'registration_open' | 'registration_closed' | 'in_progress' | 'completed' | 'cancelled',
    form_fields: [] as FormField[],
    tags: [] as string[],
    main_image_file: undefined as File | undefined,
    is_public_event: true,
    waiting_payment_minutes: 180,
    terms_of_event: ''
  });

  // 圖片上傳相關狀態
  const [additionalImages, setAdditionalImages] = useState<ItemImageUpload[]>([]);
  const additionalImagesRef = useRef<HTMLInputElement>(null);

  // 標籤相關狀態
  const [tagInput, setTagInput] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [showTermsSection, setShowTermsSection] = useState(false);

  // 早鳥價設定彈窗狀態
  const [showBasePriceEarlyBirdModal, setShowBasePriceEarlyBirdModal] = useState(false);
  const [basePriceEarlyBirdForm, setBasePriceEarlyBirdForm] = useState({
    enabled: false,
    price: 0,
    endDate: ''
  });



  // 載入活動列表
  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await getItemEventItems();
      if (response.success) {
        // 確保 response.data.events 存在且是陣列
        const eventsData = response.data.events;
        if (Array.isArray(eventsData)) {
          setEvents(eventsData);
        } else {
          setEvents([]);
        }
      } else {
        showError('載入失敗', response.message);
      }
    } catch (error: any) {
      showError('載入失敗', error.message || '未知錯誤');
    } finally {
      setLoading(false);
    }
  };

  // 載入活動統計
  const loadStatistics = async (eventId: number) => {
    try {
      const response = await getItemEventStatistics(eventId);
      if (response.success) {
        setStatistics(response.data);
      } else {
        showError('載入失敗', response.message);
      }
    } catch (error: any) {
      showError('載入失敗', error.message || '未知錯誤');
    }
  };

  // 初始化載入
  useEffect(() => {
    console.log('🎯 ActivitySettings useEffect 執行');
    
    // 載入初始資料
    const initializeData = async () => {
      try {
        setLoading(true);
        
        // 載入活動資料
        const eventsResponse = await getItemEventItems();
        
        // 處理活動資料
        if (eventsResponse.success) {
          const eventsData = eventsResponse.data.events;
          if (Array.isArray(eventsData)) {
            setEvents(eventsData);
          } else {
            console.warn('活動資料格式錯誤:', eventsData);
            setEvents([]);
          }
        } else {
          console.warn('載入活動失敗:', eventsResponse.message);
          setEvents([]);
        }
        
             } catch (error: any) {
         console.error('初始化資料載入失敗:', error);
         showError('載入失敗', error.message || '無法載入活動資料');
         setEvents([]);
       } finally {
         setLoading(false);
       }
    };
    
    initializeData();
  }, []);



  // 處理活動表單提交
  const handleEventSubmit = async () => {
    // 防止重複提交
    if (isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);

      if (editingEvent) {
        // 更新活動
        const updateData: any = { ...eventForm };

        // 移除舊的 main_image_file 欄位
        delete updateData.main_image_file;

        // 處理圖片上傳
        const imagesToUpload = additionalImages.filter(img => img.file && !img.uploaded);
        const uploadedImagesPks: Array<{ Static_Usage_Record: number; order: number }> = [];

        // 先收集已上傳的圖片 pk
        additionalImages.forEach((img, index) => {
          if (img.Static_Usage_Record && img.uploaded) {
            uploadedImagesPks.push({
              Static_Usage_Record: img.Static_Usage_Record,
              order: index
            });
          }
        });

        // 上傳新圖片
        if (imagesToUpload.length > 0) {
          showSuccess(`正在上傳 ${imagesToUpload.length} 張圖片...`, '請稍候');

          for (const image of imagesToUpload) {
            try {
              // 標記為上傳中
              setAdditionalImages(prev =>
                prev.map(img => img.id === image.id ? { ...img, uploading: true } : img)
              );

              // 上傳檔案
              const uploadResult = await uploadFile(image.file!);
              if (uploadResult.success) {
                // 保存到 uploadedImagesPks
                uploadedImagesPks.push({
                  Static_Usage_Record: uploadResult.data.Static_Usage_Record_pk,
                  order: image.order
                });

                // 標記為已上傳
                setAdditionalImages(prev =>
                  prev.map(img =>
                    img.id === image.id
                      ? { ...img, uploading: false, uploaded: true, Static_Usage_Record: uploadResult.data.Static_Usage_Record_pk }
                      : img
                  )
                );
              } else {
                showError(`圖片 ${image.order + 1} 上傳失敗`, uploadResult.message);
                setAdditionalImages(prev =>
                  prev.map(img => img.id === image.id ? { ...img, uploading: false } : img)
                );
              }
            } catch (error: any) {
              console.error('圖片上傳錯誤:', error);
              showError(`圖片 ${image.order + 1} 上傳失敗`, error.message);
              setAdditionalImages(prev =>
                prev.map(img => img.id === image.id ? { ...img, uploading: false } : img)
              );
            }
          }

          showSuccess('圖片上傳完成', `成功上傳 ${imagesToUpload.length} 張圖片`);
        }

        // 重新排序並準備圖片資料
        const sortedImages = uploadedImagesPks
          .sort((a, b) => a.order - b.order)
          .map((img, index) => ({
            Static_Usage_Record: img.Static_Usage_Record,
            order: index
          }));

        // 所有圖片都放在 images 陣列中 (第一張即為主圖)
        if (sortedImages.length > 0) {
          updateData.images = sortedImages;
        } else {
          updateData.images = [];
        }

        const response = await updateItemEventItem(editingEvent.id, updateData);
        if (response.success) {
          showSuccess('更新成功', '活動已更新');

          // 使用 sync API 同步表單欄位 (智能判斷增刪改，過濾掉預設欄位)
          const customFields = filterDefaultFields(eventForm.form_fields);
          try {
            const formFieldsResponse = await syncFormFields(editingEvent.id, {
              fields: customFields.map(field => {
                // 判斷是否為前端臨時 id（以 field_ 開頭的是新建欄位）
                const isNewField = typeof field.id === 'string' && field.id.startsWith('field_');

                return {
                  ...(isNewField ? {} : { id: field.id }), // 新欄位不傳 id，已存在的欄位傳 id
                  field_type: field.type,
                  label: field.label,
                  placeholder: field.placeholder,
                  required: field.required,
                  order: field.order,
                  multiSelectConfig: field.multiSelectConfig,
                  options: field.options?.map((opt, optIndex) => {
                    const isNewOption = typeof opt.id === 'string' && opt.id.startsWith('option_');
                    return {
                      ...(isNewOption ? {} : { id: opt.id }),
                      label: opt.label,
                      price: opt.price || 0,
                      earlyBirdPrice: opt.earlyBirdPrice,
                      order: optIndex,
                      conditionalFields: opt.conditionalFields?.map((cf, cfIndex) => {
                        const isNewConditional = typeof cf.id === 'string' && cf.id.startsWith('conditional_');
                        return {
                          ...(isNewConditional ? {} : { id: cf.id }),
                          field_type: cf.type,
                          label: cf.label,
                          placeholder: cf.placeholder,
                          required: cf.required,
                          order: cfIndex
                        };
                      })
                    };
                  })
                };
              })
            });

            if (formFieldsResponse.success) {
              console.log('表單欄位已同步:', formFieldsResponse.data);
              const stats = formFieldsResponse.data.stats;
              if (stats) {
                showSuccess('表單欄位已同步',
                  `創建 ${stats.fields_created || 0} 個、更新 ${stats.fields_updated || 0} 個、刪除 ${stats.fields_deleted || 0} 個欄位`
                );
              }
            }
          } catch (error: any) {
            console.error('同步表單欄位失敗:', error);
            showError('表單欄位同步失敗', error.message || '請稍後再試');
          }
        } else {
          showError('更新失敗', response.message);
          return;
        }
      } else {
        // 創建新活動
        const createData: any = { ...eventForm };

        // 移除 main_image_file 欄位
        delete createData.main_image_file;

        // 處理圖片上傳
        const imagesToUpload = additionalImages.filter(img => img.file && !img.uploaded);
        const uploadedImagesPks: Array<{ Static_Usage_Record: number; order: number }> = [];

        // 上傳新圖片
        if (imagesToUpload.length > 0) {
          showSuccess(`正在上傳 ${imagesToUpload.length} 張圖片...`, '請稍候');

          for (const image of imagesToUpload) {
            try {
              // 標記為上傳中
              setAdditionalImages(prev =>
                prev.map(img => img.id === image.id ? { ...img, uploading: true } : img)
              );

              // 上傳檔案
              const uploadResult = await uploadFile(image.file!);
              if (uploadResult.success) {
                // 保存到 uploadedImagesPks
                uploadedImagesPks.push({
                  Static_Usage_Record: uploadResult.data.Static_Usage_Record_pk,
                  order: image.order
                });

                // 標記為已上傳
                setAdditionalImages(prev =>
                  prev.map(img =>
                    img.id === image.id
                      ? { ...img, uploading: false, uploaded: true, Static_Usage_Record: uploadResult.data.Static_Usage_Record_pk }
                      : img
                  )
                );
              } else {
                showError(`圖片 ${image.order + 1} 上傳失敗`, uploadResult.message);
                setAdditionalImages(prev =>
                  prev.map(img => img.id === image.id ? { ...img, uploading: false } : img)
                );
              }
            } catch (error: any) {
              console.error('圖片上傳錯誤:', error);
              showError(`圖片 ${image.order + 1} 上傳失敗`, error.message);
              setAdditionalImages(prev =>
                prev.map(img => img.id === image.id ? { ...img, uploading: false } : img)
              );
            }
          }

          showSuccess('圖片上傳完成', `成功上傳 ${imagesToUpload.length} 張圖片`);
        }

        // 重新排序並準備圖片資料
        const sortedImages = uploadedImagesPks
          .sort((a, b) => a.order - b.order)
          .map((img, index) => ({
            Static_Usage_Record: img.Static_Usage_Record,
            order: index
          }));

        // 所有圖片都放在 images 陣列中 (第一張即為主圖)
        if (sortedImages.length > 0) {
          createData.images = sortedImages;
        }

        const response = await createItemEventItem(createData);
        if (response.success) {
          // 後端回應格式: { event_id: number, event: { id, name, sku } }
          const eventId = (response.data as any).event_id || (response.data as any).event?.id || response.data.id;
          showSuccess('創建成功', '活動已創建');

          // 如果有表單欄位,批量創建 (過濾掉預設欄位)
          const customFields = filterDefaultFields(eventForm.form_fields);
          if (customFields.length > 0) {
            try {
              const formFieldsResponse = await batchCreateFormFields(eventId, {
                fields: customFields.map(field => ({
                  field_type: field.type,
                  label: field.label,
                  placeholder: field.placeholder,
                  required: field.required,
                  order: field.order,
                  multiSelectConfig: field.multiSelectConfig,
                  options: field.options?.map(opt => ({
                    label: opt.label,
                    price: opt.price || 0,
                    earlyBirdPrice: opt.earlyBirdPrice,
                    order: 0,
                    conditionalFields: opt.conditionalFields?.map(cf => ({
                      field_type: cf.type,
                      label: cf.label,
                      placeholder: cf.placeholder,
                      required: cf.required,
                      order: cf.order
                    }))
                  }))
                }))
              });

              if (formFieldsResponse.success) {
                console.log('表單欄位已創建:', formFieldsResponse.data);
                showSuccess('表單欄位已創建', `成功建立 ${formFieldsResponse.data.stats.fields_count} 個欄位`);
              }
            } catch (error: any) {
              console.error('批量創建表單欄位失敗:', error);
              showError('表單欄位創建失敗', error.message || '請稍後再試');
            }
          }
        } else {
          showError('創建失敗', response.message);
          return;
        }
      }

      setShowEventModal(false);
      setEditingEvent(null);
      setAdditionalImages([]); // 重置其他圖片
      setEventForm({
        name: '',
        description: '',
        base_price: 0,
        earlyBirdConfig: undefined,
        earlyBird: undefined,
        start_time: getDefaultStartTime(),
        end_time: getDefaultEndTime(),
        location: '',
        min_participants: 1,
        max_participants: 100,
        max_participants_per_user: 1,
        use_check_in: true,
        event_status: 'draft',
        form_fields: [],
        tags: [],
        main_image_file: undefined,
        is_public_event: true,
        waiting_payment_minutes: 180,
        terms_of_event: ''
      });
      setAdditionalImages([]); // 重置圖片列表
      setTagInput('');
      setShowTagSuggestions(false);
      loadEvents();
    } catch (error: any) {
      showError('操作失敗', error.message || '未知錯誤');
    } finally {
      setIsSubmitting(false);
    }
  };



  // 刪除活動
  const handleDeleteEvent = async (eventId: number) => {
    const confirmed = await confirm({
      title: '刪除活動',
      message: '確定要刪除這個活動嗎？此操作無法撤銷。',
      confirmText: '刪除',
      cancelText: '取消',
      type: 'danger'
    });
    
    if (confirmed) {
      try {
        const response = await deleteItemEventItem(eventId);
        if (response.success) {
          showSuccess('刪除成功', '活動已刪除');
          loadEvents();
        } else {
          showError('刪除失敗', response.message);
        }
      } catch (error: any) {
        showError('刪除失敗', error.message || '未知錯誤');
      }
    }
  };

  // 複製報名連結
  const handleCopyJoinLink = async (event: ItemEventItem) => {
    try {
      // 檢查活動是否有 SKU
      if (!event.sku) {
        showError('無法複製連結', '此活動尚未設定 SKU，無法生成報名連結');
        return;
      }

      // 如果使用者已登入，則在連結中加入 referrer 參數（使用 member_card）
      const joinUrl = createEventJoinUrl(event.sku, user?.member_card);
      
      // 使用 Clipboard API 複製連結
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(joinUrl);
        showSuccess('連結已複製', '報名連結已複製到剪貼簿');
      } else {
        // 降級方案：創建臨時輸入框
        const textArea = document.createElement('textarea');
        textArea.value = joinUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
          showSuccess('連結已複製', '報名連結已複製到剪貼簿');
        } catch (err) {
          showError('複製失敗', '無法自動複製，請手動複製連結');
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (error: any) {
      showError('複製失敗', error.message || '複製過程中發生錯誤');
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

  // 格式化時間為 HTML datetime-local 輸入欄位格式
  const formatDateTimeForInput = (dateTime: string) => {
    try {
      const date = new Date(dateTime);
      // 轉換為 YYYY-MM-DDTHH:mm 格式
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return '';
    }
  };

  // 取得預設開始時間（明天上午9點）
  const getDefaultStartTime = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return formatDateTimeForInput(tomorrow.toISOString());
  };

  // 取得預設結束時間（明天下午6點）
  const getDefaultEndTime = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(18, 0, 0, 0);
    return formatDateTimeForInput(tomorrow.toISOString());
  };

  // 過濾活動
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterType === 'all' || event.event_status === filterType;
    return matchesSearch && matchesStatus;
  });


  // 處理其他圖片上傳
  const handleAdditionalImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // 檢查圖片數量限制(最多 6 張)
    const MAX_IMAGES = 6;
    const currentImageCount = additionalImages.length;
    const newFilesCount = files.length;
    const totalCount = currentImageCount + newFilesCount;

    if (totalCount > MAX_IMAGES) {
      showError('圖片數量超過限制', `最多只能上傳 ${MAX_IMAGES} 張圖片，目前已有 ${currentImageCount} 張`);
      e.target.value = '';
      return;
    }

    const newImages: ItemImageUpload[] = Array.from(files).map((file, index) => {
      const reader = new FileReader();
      const tempId = `temp_${Date.now()}_${index}`;
      const newImage: ItemImageUpload = {
        id: tempId,
        file,
        order: additionalImages.length + index,
        preview: '',
        uploading: false,
        uploaded: false
      };

      reader.onload = (ev) => {
        if (typeof ev.target?.result === 'string') {
          setAdditionalImages(prev =>
            prev.map(img => img.id === tempId ? { ...img, preview: ev.target!.result as string } : img)
          );
        }
      };
      reader.readAsDataURL(file);

      return newImage;
    });

    setAdditionalImages(prev => [...prev, ...newImages]);
    e.target.value = '';
  };

  // 移除其他圖片
  const removeAdditionalImage = async (imageId: string | number) => {
    const image = additionalImages.find(img => img.id === imageId);

    // 如果是已上傳的圖片(有數字 id),需要呼叫 API 刪除
    if (image && typeof image.id === 'number' && typeof imageId === 'number') {
      try {
        const confirmed = await confirm({
          title: '確認刪除',
          message: '確定要刪除這張圖片嗎?',
          confirmText: '刪除',
          cancelText: '取消',
          type: 'danger'
        });

        if (confirmed) {
          const response = await deleteEventImage(imageId);
          if (response.success) {
            showSuccess('刪除成功', '圖片已刪除');
            setAdditionalImages(prev => prev.filter(img => String(img.id) !== String(imageId)));
          } else {
            showError('刪除失敗', response.message);
          }
        }
      } catch (error: any) {
        showError('刪除失敗', error.message || '未知錯誤');
      }
    } else {
      // 臨時圖片,直接從狀態中移除
      setAdditionalImages(prev => prev.filter(img => img.id !== imageId));
    }
  };

  // 重新排序圖片
  const reorderAdditionalImages = (startIndex: number, endIndex: number) => {
    setAdditionalImages(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);

      // 更新 order
      return result.map((img, index) => ({ ...img, order: index }));
    });
  };

  // 標籤管理
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !eventForm.tags.includes(trimmedTag)) {
      setEventForm({ ...eventForm, tags: [...eventForm.tags, trimmedTag] });
      setTagInput('');
      setShowTagSuggestions(false);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setEventForm({
      ...eventForm,
      tags: eventForm.tags.filter(tag => tag !== tagToRemove)
    });
  };

  // 早鳥優惠設定管理（活動層級，統一管理截止日期）
  const openBasePriceEarlyBirdModal = () => {
    // 優先使用 earlyBirdConfig（編輯時），其次使用 earlyBird（後端回傳）
    const config = eventForm.earlyBirdConfig || eventForm.earlyBird;

    // 如果後端有早鳥設定但前端沒有，需要同步到前端
    // 這樣即使使用者沒有修改就關閉 modal，earlyBirdConfig 也會存在
    if (eventForm.earlyBird && !eventForm.earlyBirdConfig) {
      setEventForm({
        ...eventForm,
        earlyBirdConfig: {
          enabled: eventForm.earlyBird.enabled,
          endDate: eventForm.earlyBird.endDate,
          price: eventForm.earlyBird.price
        }
      });
    }

    setBasePriceEarlyBirdForm({
      enabled: config?.enabled || false,
      price: config?.price || 0,
      endDate: config?.endDate || ''
    });
    setShowBasePriceEarlyBirdModal(true);
  };

  const saveBasePriceEarlyBird = () => {
    if (basePriceEarlyBirdForm.enabled) {
      // 必須設定截止日期
      if (!basePriceEarlyBirdForm.endDate) {
        alert('請設定早鳥截止日期');
        return;
      }

      // 如果設定了基本價格的早鳥價，必須小於或等於原價（等於原價表示取消早鳥）
      if (basePriceEarlyBirdForm.price > eventForm.base_price) {
        alert(`基本價格早鳥價 (NT$ ${basePriceEarlyBirdForm.price}) 不能大於原價 (NT$ ${eventForm.base_price})`);
        return;
      }
    }

    // 更新早鳥設定
    // - 如果啟用：設定完整的早鳥資料
    // - 如果關閉：發送 { enabled: false } 讓後端知道要關閉早鳥
    setEventForm({
      ...eventForm,
      earlyBirdConfig: basePriceEarlyBirdForm.enabled ? {
        enabled: true,
        endDate: basePriceEarlyBirdForm.endDate,
        // 當早鳥價格等於原價時，視為取消早鳥優惠（設為 undefined）
        price: basePriceEarlyBirdForm.price !== eventForm.base_price ? basePriceEarlyBirdForm.price : undefined
      } : {
        enabled: false,
        endDate: '',
        price: undefined
      }
    });

    setShowBasePriceEarlyBirdModal(false);
  };

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTagInput(value);
    setShowTagSuggestions(value.length > 0);
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === 'Backspace' && tagInput === '' && eventForm.tags.length > 0) {
      removeTag(eventForm.tags[eventForm.tags.length - 1]);
    }
  };

  const handleTagInputBlur = () => {
    setTimeout(() => setShowTagSuggestions(false), 200);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 頁面標題 */}
        <div className="mb-0 md:mb-8">
          <h1 className="hidden md:block text-2xl font-bold text-gray-900">活動設定</h1>
          <p className="hidden md:block text-gray-600 mt-2">管理您的活動模組、活動資訊和報名系統</p>
        </div>

        {/* 標籤頁導航 */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'events', label: '活動管理', icon: 'ri-calendar-line' },
                { id: 'modules', label: '模組管理', icon: 'ri-settings-3-line' },
                { id: 'registrations', label: '報名管理', icon: 'ri-user-line' },
                { id: 'statistics', label: '統計分析', icon: 'ri-bar-chart-line' }
              ].map((tab) => {
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                      activeTab === tab.id
                        ? `${AI_COLORS.border} ${AI_COLORS.text}`
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <i className={tab.icon} style={{ fontSize: '16px' }}></i>
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* 活動管理標籤頁 */}
        {activeTab === 'events' && (
          <div>
            {/* 搜尋和篩選 */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" style={{ fontSize: '20px' }}></i>
                  <input
                    type="text"
                    placeholder="搜尋活動名稱或描述..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">所有狀態</option>
                  <option value="draft">草稿</option>
                  <option value="registration_open">報名開放</option>
                  <option value="registration_closed">報名截止</option>
                  <option value="in_progress">進行中</option>
                  <option value="completed">已完成</option>
                  <option value="cancelled">已取消</option>
                </select>
                <button
                  onClick={() => {
                    setEditingEvent(null);
                    setAdditionalImages([]); // 重置圖片
                    setEventForm({
                      name: '',
                      description: '',
                      base_price: 0,
                      earlyBirdConfig: undefined,
                      earlyBird: undefined,
                      start_time: '',
                      end_time: '',
                      location: '',
                      min_participants: 1,
                      max_participants: 100,
                      max_participants_per_user: 1,
                      use_check_in: true,
                      event_status: 'draft',
                      form_fields: [],
                      tags: [],
                      main_image_file: undefined,
                      is_public_event: true,
                      waiting_payment_minutes: 180,
                      terms_of_event: ''
                    });
                    setTagInput('');
                    setShowTagSuggestions(false);
                    setShowEventModal(true);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 ${AI_COLORS.button} rounded-lg transition-colors`}
                >
                  <i className="ri-add-line" style={{ fontSize: '16px' }}></i>
                  建立活動
                </button>
              </div>
            </div>

            {/* 載入狀態 */}
            {loading && (
              <div className="col-span-full flex items-center justify-center py-12">
                <div className="text-center">
                  <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${AI_COLORS.border} mx-auto mb-4`}></div>
                  <p className="text-gray-600">載入活動資料中...</p>
                </div>
              </div>
            )}
            
            {/* 無資料狀態 */}
            {!loading && filteredEvents.length === 0 && (
              <div className="col-span-full text-center py-12">
                <div className="text-gray-400 mb-4">
                  <i className="ri-calendar-line text-6xl"></i>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">尚無活動</h3>
                <p className="text-gray-500 mb-6">開始建立您的第一個活動吧！</p>
                <button
                  onClick={() => {
                    setEditingEvent(null);
                    setAdditionalImages([]); // 重置圖片
                    setEventForm({
                      name: '',
                      description: '',
                      base_price: 0,
                      earlyBirdConfig: undefined,
                      earlyBird: undefined,
                      start_time: getDefaultStartTime(),
                      end_time: getDefaultEndTime(),
                      location: '',
                      min_participants: 1,
                      max_participants: 100,
                      max_participants_per_user: 1,
                      use_check_in: true,
                      event_status: 'draft',
                      form_fields: [],
                      tags: [],
                      main_image_file: undefined,
                      is_public_event: true,
                      waiting_payment_minutes: 180,
                      terms_of_event: ''
                    });
                    setTagInput('');
                    setShowTagSuggestions(false);
                    setShowEventModal(true);
                  }}
                  className={`inline-flex items-center gap-2 px-4 py-2 ${AI_COLORS.button} rounded-lg transition-colors`}
                >
                  <i className="ri-add-line" style={{ fontSize: '16px' }}></i>
                  建立第一個活動
                </button>
              </div>
            )}
             
             {/* 活動列表 */}
             {!loading && filteredEvents.length > 0 && (
               <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                 {filteredEvents.map((event) => (
                   <div key={event.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                     {/* 活動主圖 (使用 images 的第一張) */}
                     {event.images && event.images.length > 0 && event.images[0] && (
                       <div>
                         <div className="relative h-48 bg-gray-100">
                           <img
                             src={event.images[0].url}
                             alt={event.name}
                             className="w-full h-full object-cover cursor-pointer"
                             onClick={() => {
                               setViewingImageUrl(event.images![0].url);
                               setShowImageViewer(true);
                             }}
                           />

                           {/* 活動狀態標籤 - 移到主圖右上角 */}
                           <div className="absolute top-2 right-2">
                             <span className={`px-3 py-1 text-xs rounded-full font-medium shadow-lg ${
                               event.event_status === 'draft' ? 'bg-gray-100 text-gray-700' :
                               event.event_status === 'registration_open' ? 'bg-green-500 text-white' :
                               event.event_status === 'registration_closed' ? 'bg-yellow-500 text-white' :
                               event.event_status === 'in_progress' ? 'bg-blue-500 text-white' :
                               event.event_status === 'completed' ? 'bg-purple-500 text-white' :
                               'bg-red-500 text-white'
                             }`}>
                               {event.event_status_display}
                             </span>
                           </div>
                         </div>
                       </div>
                     )}

                     {/* 活動資訊 */}
                     <div className="p-6 flex flex-col flex-1">
                       <div className="flex items-start justify-between mb-3">
                         <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{event.name}</h3>
                         <div className="flex gap-1">
                           <button
                             onClick={() => handleCopyJoinLink(event)}
                             className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                             title="複製報名連結"
                           >
                             <i className="ri-link" style={{ fontSize: '16px' }}></i>
                           </button>
                           <button
                             onClick={() => {
                               setEditingEvent(event);
                               // 處理早鳥設定：如果有 earlyBird 或 earlyBirdConfig，需要格式化日期
                               const earlyBirdData = event.earlyBirdConfig || event.earlyBird;
                               const formattedEarlyBird = earlyBirdData ? {
                                 ...earlyBirdData,
                                 endDate: formatDateTimeForInput(earlyBirdData.endDate)
                               } : undefined;

                               // 處理 form_fields：將後端的 earlyBird.price 映射到前端的 earlyBirdPrice
                               const processedFormFields = event.form_fields?.map((field: FormField) => ({
                                 ...field,
                                 options: field.options?.map((opt: any) => ({
                                   ...opt,
                                   // 如果後端有 earlyBird.price，將其映射到 earlyBirdPrice
                                   earlyBirdPrice: opt.earlyBirdPrice !== undefined
                                     ? opt.earlyBirdPrice
                                     : opt.earlyBird?.price,
                                   // 遞迴處理條件欄位
                                   conditionalFields: opt.conditionalFields?.map((cf: any) => ({
                                     ...cf,
                                     options: cf.options?.map((cfOpt: any) => ({
                                       ...cfOpt,
                                       earlyBirdPrice: cfOpt.earlyBirdPrice !== undefined
                                         ? cfOpt.earlyBirdPrice
                                         : cfOpt.earlyBird?.price
                                     }))
                                   }))
                                 }))
                               })) || [];

                               setEventForm({
                                  name: event.name,
                                  description: event.description,
                                  base_price: event.base_price,
                                  earlyBirdConfig: formattedEarlyBird,
                                  earlyBird: event.earlyBird,
                                  start_time: formatDateTimeForInput(event.start_time),
                                  end_time: formatDateTimeForInput(event.end_time),
                                  location: event.location,
                                  min_participants: event.min_participants,
                                  max_participants: event.max_participants,
                                  max_participants_per_user: event.max_participants_per_user,
                                  use_check_in: event.use_check_in,
                                  event_status: event.event_status,
                                  form_fields: processedFormFields,
                                  tags: event.item_tags?.map(tag => tag.name) || [],
                                  main_image_file: undefined,
                                  is_public_event: (event as any).is_public_event !== undefined ? (event as any).is_public_event : true,
                                  waiting_payment_minutes: (event as any).waiting_payment_minutes || 180,
                                  terms_of_event: (event as any).terms_of_event || ''
                                });
                               // 載入圖片 (第一張即為主圖)
                               if (event.images && event.images.length > 0) {
                                 const allImages: ItemImageUpload[] = event.images.map((img, index) => ({
                                   id: img.id.toString(),
                                   Static_Usage_Record: img.id,
                                   order: index,
                                   preview: img.url,
                                   uploaded: true,
                                   uploading: false
                                 }));
                                 setAdditionalImages(allImages);
                               } else {
                                 setAdditionalImages([]);
                               }

                               // 設定標籤輸入
                               setTagInput('');
                               setShowTagSuggestions(false);
                               setShowEventModal(true);
                             }}
                             className={`p-2 text-gray-400 hover:${AI_COLORS.text} hover:${AI_COLORS.bgLight} rounded-lg transition-colors`}
                             title="編輯"
                           >
                             <i className="ri-edit-line" style={{ fontSize: '16px' }}></i>
                           </button>
                           <button
                             onClick={() => handleDeleteEvent(event.id)}
                             className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                             title="刪除"
                           >
                             <i className="ri-delete-bin-line" style={{ fontSize: '16px' }}></i>
                           </button>
                         </div>
                       </div>
                       
                       <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>
                       
                       {/* 活動詳情 */}
                       <div className="space-y-2 mb-4">
                         <div className="flex items-center gap-2 text-sm text-gray-500">
                           <i className="ri-calendar-line" style={{ fontSize: '14px' }}></i>
                           <span>{formatDateTime(event.start_time)} - {formatDateTime(event.end_time)}</span>
                         </div>
                         <div className="flex items-center gap-2 text-sm text-gray-500">
                          <i className="ri-user-line" style={{ fontSize: '14px' }}></i>
                          <span>
                            {event.min_participants} - {event.max_participants} 人
                            {event.current_participants_count !== undefined && (
                              <span className={`ml-2 font-medium ${
                                event.current_participants_count >= event.min_participants
                                  ? 'text-green-600'
                                  : 'text-orange-600'
                              }`}>
                                (已報名 {event.current_participants_count})
                              </span>
                            )}
                          </span>
                        </div>
                         <div className="flex items-center gap-2 text-sm text-gray-500">
                           <i className="ri-money-dollar-circle-line" style={{ fontSize: '14px' }}></i>
                           <span>NT$ {event.base_price}</span>
                         </div>
                         {event.location && (
                           <div className="flex items-center gap-2 text-sm text-gray-500">
                             <i className="ri-map-pin-line" style={{ fontSize: '14px' }}></i>
                             <span>{event.location}</span>
                           </div>
                         )}
                       </div>
                       
                                               {/* 活動標籤 */}
                        {event.item_tags && event.item_tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {event.item_tags.map((tag, index) => (
                              <span key={index} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                                {tag.name}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* 其他圖片縮圖 - 顯示在按鈕上方 */}
                        {event.images && event.images.length > 1 && (
                          <div className="mb-3">
                            <div className="flex gap-2 overflow-x-auto pb-1">
                              {event.images.slice(1).map((image, index) => (
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
                                    alt={`${event.name} - 圖片 ${index + 2}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                       {/* 操作按鈕 - 固定在底部 */}
                       <div className="border-t pt-3 mt-auto space-y-2">
                         <div className="grid grid-cols-2 gap-2">
                           <button
                             onClick={() => {
                               setSelectedEventForParticipants(event);
                               setShowParticipantsModal(true);
                             }}
                             className="px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                           >
                             <i className="ri-user-line" style={{ fontSize: '16px' }}></i>
                             參與者
                           </button>
                           <button
                             onClick={() => {
                               setSelectedEventForOrders(event);
                               setShowReferrerOrdersModal(true);
                             }}
                             className={`px-3 py-2 ${AI_COLORS.button} text-white text-sm rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2`}
                           >
                             <i className="ri-file-list-3-line" style={{ fontSize: '16px' }}></i>
                             訂單
                           </button>
                         </div>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        )}

                 {/* 模組管理標籤頁 */}
         {activeTab === 'modules' && (
           <div className="text-center py-12">
             <i className="ri-settings-3-line mx-auto text-gray-400 mb-4" style={{ fontSize: '48px' }}></i>
             <h3 className="text-lg font-medium text-gray-900 mb-2">模組管理</h3>
             <p className="text-gray-500">管理活動模組和功能設定</p>
             <p className="text-sm text-gray-400 mt-2">此功能正在開發中...</p>
           </div>
         )}

        {/* 報名管理標籤頁 */}
        {activeTab === 'registrations' && (
          <div className="text-center py-12">
            <i className="ri-user-line mx-auto text-gray-400 mb-4" style={{ fontSize: '48px' }}></i>
            <h3 className="text-lg font-medium text-gray-900 mb-2">報名管理</h3>
            <p className="text-gray-500">管理活動報名和參與者資訊</p>
            <p className="text-sm text-gray-400 mt-2">此功能正在開發中...</p>
          </div>
        )}

        {/* 統計分析標籤頁 */}
        {activeTab === 'statistics' && (
          <div className="text-center py-12">
            <i className="ri-bar-chart-line mx-auto text-gray-400 mb-4" style={{ fontSize: '48px' }}></i>
            <h3 className="text-lg font-medium text-gray-900 mb-2">統計分析</h3>
            <p className="text-gray-500">查看活動統計和參與者分析</p>
            <p className="text-sm text-gray-400 mt-2">此功能正在開發中...</p>
          </div>
        )}

        

        {/* 活動創建/編輯模態框 */}
        {showEventModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingEvent ? '編輯活動' : '建立活動'}
                  </h3>
                  <button
                    onClick={() => setShowEventModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <i className="ri-close-line" style={{ fontSize: '20px' }}></i>
                  </button>
                </div>
                
                <form onSubmit={(e) => { e.preventDefault(); handleEventSubmit(); }} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">活動名稱</label>
                      <input
                        type="text"
                        value={eventForm.name}
                        onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="輸入活動名稱"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">基本價格</label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 flex-shrink-0">NT$</span>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={eventForm.base_price}
                          onChange={(e) => {
                            const value = e.target.value;
                            setEventForm({
                              ...eventForm,
                              base_price: value === '' ? 0 : parseInt(value) || 0
                            });
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="輸入活動基本價格（可以為0）"
                          required
                        />
                        {/* 早鳥優惠設定按鈕 */}
                        <button
                          type="button"
                          onClick={openBasePriceEarlyBirdModal}
                          className={`p-2 rounded transition-colors flex-shrink-0 ${
                            eventForm.earlyBirdConfig?.enabled
                              ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                              : 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
                          }`}
                          title={eventForm.earlyBirdConfig?.enabled ? '早鳥優惠已設定' : '設定早鳥優惠（含截止日期）'}
                        >
                          <i className="ri-vip-crown-line text-lg"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">活動狀態</label>
                      <select
                        value={eventForm.event_status}
                        onChange={(e) => setEventForm({ ...eventForm, event_status: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="draft">草稿</option>
                        <option value="registration_open">報名開放</option>
                        <option value="registration_closed">報名截止</option>
                        <option value="in_progress">進行中</option>
                        <option value="completed">已完成</option>
                        <option value="cancelled">已取消</option>
                      </select>
                    </div>
                    
                                         <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">標籤</label>
                       <div className="space-y-3">
                         {/* 已選擇的標籤 */}
                         {eventForm.tags.length > 0 && (
                           <div className="flex flex-wrap gap-2">
                             {eventForm.tags.map((tag, index) => (
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
                             placeholder={eventForm.tags.length === 0 ? "輸入標籤後按 Enter 新增" : "繼續新增標籤..."}
                           />
                           
                           {/* 標籤建議 */}
                           {showTagSuggestions && tagInput.length > 0 && (
                             <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 mt-1 max-h-48 overflow-y-auto">
                               <div className="p-2 border-b border-gray-100">
                                 <p className="text-xs text-gray-500 font-medium">建議標籤</p>
                               </div>
                               {[
                                 '科技', '生活', '美食', '旅遊', '健康', '教育', '娛樂', '運動',
                                 '藝術', '音樂', '電影', '書籍', '時尚', '美容', '寵物', '園藝',
                                 '攝影', '設計', '程式', '商業', '投資', '理財', '心理', '哲學'
                               ]
                                 .filter(tag => tag.toLowerCase().includes(tagInput.toLowerCase()) && !eventForm.tags.includes(tag))
                                 .slice(0, 8)
                                 .map(tag => (
                                   <button
                                     key={tag}
                                     type="button"
                                     className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                                     onClick={() => addTag(tag)}
                                   >
                                     <i className="ri-price-tag-3-line text-gray-400" style={{ fontSize: '14px' }}></i>
                                     {tag}
                                   </button>
                                 ))}
                             </div>
                           )}
                         </div>
                         
                         {/* 操作提示 */}
                         <div className="text-xs text-gray-500">
                           <p>• 按 Enter 新增標籤</p>
                           <p>• 按 Backspace 移除最後一個標籤</p>
                           <p>• 點擊標籤上的 × 可移除該標籤</p>
                         </div>
                       </div>
                     </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">活動地點</label>
                    <input
                      type="text"
                      value={eventForm.location}
                      onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="輸入活動地點"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">活動描述</label>
                    <textarea
                      value={eventForm.description}
                      onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent whitespace-pre-wrap"
                      placeholder="輸入活動描述（支援換行）"
                      rows={8}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">開始時間</label>
                      <input
                        type="datetime-local"
                        value={eventForm.start_time}
                        onChange={(e) => setEventForm({ ...eventForm, start_time: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">結束時間</label>
                      <input
                        type="datetime-local"
                        value={eventForm.end_time}
                        onChange={(e) => setEventForm({ ...eventForm, end_time: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">最小參與人數</label>
                      <input
                        type="number"
                        value={eventForm.min_participants}
                        onChange={(e) => setEventForm({ ...eventForm, min_participants: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        min="1"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">最大參與人數</label>
                      <input
                        type="number"
                        value={eventForm.max_participants}
                        onChange={(e) => setEventForm({ ...eventForm, max_participants: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        min="1"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">每人最大參與次數</label>
                      <input
                        type="number"
                        value={eventForm.max_participants_per_user}
                        onChange={(e) => setEventForm({ ...eventForm, max_participants_per_user: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        min="1"
                        required
                      />
                    </div>
                  </div>
                  
                  {/* 活動圖片上傳 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">活動圖片</label>
                    <div className="space-y-3">
                      {/* 已上傳的圖片預覽 */}
                      {additionalImages.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {additionalImages.map((image, index) => (
                            <div key={image.id} className="relative group bg-gray-50 rounded-lg border border-gray-200 p-2">
                              {/* 圖片預覽 */}
                              <div className="relative aspect-video bg-gray-100 rounded overflow-hidden mb-2">
                                {image.preview ? (
                                  <img
                                    src={image.preview}
                                    alt={`圖片 ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <i className="ri-image-line text-gray-400 text-2xl"></i>
                                  </div>
                                )}

                                {/* 主圖標示 */}
                                {index === 0 && (
                                  <div className="absolute top-1 left-1 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                                    主圖
                                  </div>
                                )}

                                {/* 上傳中遮罩 */}
                                {image.uploading && (
                                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                    <div className="text-white text-xs">上傳中...</div>
                                  </div>
                                )}

                                {/* 刪除按鈕 */}
                                <button
                                  type="button"
                                  onClick={() => removeAdditionalImage(image.id!)}
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                  title="刪除圖片"
                                >
                                  ×
                                </button>
                              </div>

                              {/* 排序控制 */}
                              <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                                <span>順序: {index + 1}</span>
                                <div className="flex gap-1">
                                  {index > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => reorderAdditionalImages(index, index - 1)}
                                      className="p-1 hover:bg-gray-200 rounded"
                                      title="向前移動"
                                    >
                                      <i className="ri-arrow-up-s-line"></i>
                                    </button>
                                  )}
                                  {index < additionalImages.length - 1 && (
                                    <button
                                      type="button"
                                      onClick={() => reorderAdditionalImages(index, index + 1)}
                                      className="p-1 hover:bg-gray-200 rounded"
                                      title="向後移動"
                                    >
                                      <i className="ri-arrow-down-s-line"></i>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 上傳按鈕 */}
                      <button
                        type="button"
                        onClick={() => additionalImagesRef.current?.click()}
                        className="inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed border-orange-400 text-orange-600 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all duration-200"
                      >
                        <i className="ri-add-line text-xl"></i>
                        <span className="text-sm font-medium">新增圖片</span>
                      </button>
                      <p className="text-xs text-gray-500 mt-2">
                        支援 jpg, png, gif, webp 格式，最多上傳 6 張圖片(第一張為主圖)
                      </p>
                    </div>
                  </div>

                  {/* 啟用報到功能、公開活動、未付款訂單時效 - 同一行 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                    {/* 啟用報到功能 */}
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="use-check-in"
                        checked={eventForm.use_check_in}
                        onChange={(e) => setEventForm({ ...eventForm, use_check_in: e.target.checked })}
                        className="accent-orange-600 w-4 h-4"
                      />
                      <label htmlFor="use-check-in" className="text-sm text-gray-700">
                        啟用報到功能
                      </label>
                    </div>

                    {/* 公開活動 */}
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="is-public-event"
                        checked={eventForm.is_public_event}
                        onChange={(e) => setEventForm({ ...eventForm, is_public_event: e.target.checked })}
                        className="accent-orange-600 w-4 h-4"
                      />
                      <label htmlFor="is-public-event" className="text-sm text-gray-700">
                        公開活動
                      </label>
                    </div>

                    {/* 未付款訂單時效 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        未付款訂單時效（分）
                      </label>
                      <input
                        type="number"
                        value={eventForm.waiting_payment_minutes}
                        onChange={(e) => setEventForm({ ...eventForm, waiting_payment_minutes: parseInt(e.target.value) || 180 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        min="1"
                        placeholder="預設 180 分鐘"
                      />
                      <p className="text-xs text-gray-500 mt-1">訂單建立後，多久時間內未完成付款將自動取消</p>
                    </div>
                  </div>

                  {/* 表單欄位編輯器 */}
                  <div className="pt-4 border-t">
                    <DynamicFormFieldBuilder
                      fields={eventForm.form_fields}
                      onChange={(updatedFields) => setEventForm({ ...eventForm, form_fields: updatedFields })}
                      earlyBirdConfig={eventForm.earlyBirdConfig}
                    />
                  </div>

                  {/* 活動條款 */}
                  <div className="pt-4 border-t">
                    {/* 活動條款 - 可展開的文字區塊 */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          活動條款
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowTermsSection(!showTermsSection)}
                          className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1"
                        >
                          {showTermsSection ? (
                            <>
                              <i className="ri-arrow-up-s-line"></i>
                              隱藏
                            </>
                          ) : (
                            <>
                              <i className="ri-arrow-down-s-line"></i>
                              展開填寫
                            </>
                          )}
                        </button>
                      </div>
                      {showTermsSection && (
                        <textarea
                          value={eventForm.terms_of_event}
                          onChange={(e) => setEventForm({ ...eventForm, terms_of_event: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="輸入活動條款內容（選填）"
                          rows={6}
                        />
                      )}
                      {!showTermsSection && eventForm.terms_of_event && (
                        <div className="text-xs text-gray-500 bg-gray-50 rounded px-3 py-2">
                          已填寫條款內容（{eventForm.terms_of_event.length} 字）
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowEventModal(false)}
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting && (
                        <i className="ri-loader-4-line animate-spin"></i>
                      )}
                      {isSubmitting ? '處理中...' : (editingEvent ? '更新' : '建立')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* 隱藏的圖片輸入（支援多選）*/}
        <input
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          ref={additionalImagesRef}
          onChange={handleAdditionalImagesUpload}
        />

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

        {/* 推薦訂單彈窗 */}
        {selectedEventForOrders && (
          <ReferrerOrdersModal
            isOpen={showReferrerOrdersModal}
            onClose={() => {
              setShowReferrerOrdersModal(false);
              setSelectedEventForOrders(null);
            }}
            itemId={selectedEventForOrders.id}
            itemName={selectedEventForOrders.name}
          />
        )}

        {/* 早鳥優惠設定彈窗（活動統一管理截止日期）*/}
        {showBasePriceEarlyBirdModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <i className="ri-vip-crown-line text-orange-600"></i>
                  早鳥優惠設定
                </h3>
                <button
                  onClick={() => setShowBasePriceEarlyBirdModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-lg"></i>
                </button>
              </div>

              {/* 說明文字 */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700">
                  💡 此設定為全活動統一管理。早鳥截止日期對基本價格及所有表單選項的早鳥價都有效。
                </p>
              </div>

              {/* 啟用開關 */}
              <div className="mb-4 flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">啟用早鳥優惠</span>
                <button
                  type="button"
                  onClick={() => setBasePriceEarlyBirdForm({
                    ...basePriceEarlyBirdForm,
                    enabled: !basePriceEarlyBirdForm.enabled
                  })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    basePriceEarlyBirdForm.enabled ? 'bg-orange-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      basePriceEarlyBirdForm.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {basePriceEarlyBirdForm.enabled && (
                <>
                  {/* 截止日期（統一管理）*/}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      早鳥優惠截止時間 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={basePriceEarlyBirdForm.endDate}
                      onChange={(e) => setBasePriceEarlyBirdForm({
                        ...basePriceEarlyBirdForm,
                        endDate: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      此截止時間適用於所有早鳥優惠
                    </p>
                  </div>

                  {/* 原價顯示 */}
                  <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="text-sm text-purple-700">
                      <span className="font-medium">活動基本價格：</span>
                      <span className="font-bold">NT$ {eventForm.base_price.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* 基本價格的早鳥價 */}
                  {eventForm.base_price > 0 && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        基本價格早鳥優惠價（可選）
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">NT$</span>
                        <input
                          type="number"
                          min="0"
                          max={eventForm.base_price}
                          value={basePriceEarlyBirdForm.price}
                          onChange={(e) => setBasePriceEarlyBirdForm({
                            ...basePriceEarlyBirdForm,
                            price: parseInt(e.target.value) || 0
                          })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="設定為原價即可取消"
                        />
                        {basePriceEarlyBirdForm.price !== eventForm.base_price && (
                          <button
                            type="button"
                            onClick={() => setBasePriceEarlyBirdForm({
                              ...basePriceEarlyBirdForm,
                              price: eventForm.base_price
                            })}
                            className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors flex-shrink-0"
                            title="取消早鳥優惠"
                          >
                            移除
                          </button>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {basePriceEarlyBirdForm.price === eventForm.base_price
                          ? '設定為原價表示取消早鳥優惠'
                          : `早鳥價可設定 0 ~ ${eventForm.base_price}，設定為原價 (NT$ ${eventForm.base_price}) 即可取消`}
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* 按鈕 */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowBasePriceEarlyBirdModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={saveBasePriceEarlyBird}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  確認
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 圖片查看器彈窗 */}
      {showImageViewer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4"
          onClick={() => setShowImageViewer(false)}
        >
          <div className="relative max-w-6xl max-h-full">
            {/* 關閉按鈕 */}
            <button
              onClick={() => setShowImageViewer(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <i className="ri-close-line text-3xl"></i>
            </button>

            {/* 圖片 */}
            <img
              src={viewingImageUrl}
              alt="查看圖片"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* 參與者管理彈窗 */}
      {showParticipantsModal && selectedEventForParticipants && (
        <EventParticipantsModal
          isOpen={showParticipantsModal}
          onClose={() => {
            setShowParticipantsModal(false);
            setSelectedEventForParticipants(null);
          }}
          eventId={selectedEventForParticipants.id}
          eventName={selectedEventForParticipants.name}
        />
      )}
    </div>
  );
};

export default ActivitySettings;
