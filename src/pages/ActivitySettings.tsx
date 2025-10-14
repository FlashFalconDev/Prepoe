import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import ConfirmDialog from '../components/ConfirmDialog';
import ImagePlaceholder from '../components/ImagePlaceholder';
import { AI_COLORS } from '../constants/colors';
import { 
  getItemEventItems,
  getItemEventItemDetail,
  createItemEventItem,
  updateItemEventItem,
  deleteItemEventItem,
  getItemEventStatistics,
  refreshItemEventStatistics,
  createEventJoinUrl
} from '../config/api';

// 使用新的 ItemEvent 介面
import type { 
  ItemEventItem, 
  ItemEventStatistics,
  SingleResponse,
  PaginatedResponse
} from '../config/api';

const ActivitySettings: React.FC = () => {
  console.log('🎯 ActivitySettings 組件已載入');
  
  const { showSuccess, showError } = useToast();
  const { confirm, isOpen, options, handleConfirm, handleCancel } = useConfirm();
  
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
  
  const [eventForm, setEventForm] = useState({
    name: '',
    description: '',
    base_price: 0,
    start_time: '',
    end_time: '',
    location: '',
    min_participants: 1,
    max_participants: 100,
    max_participants_per_user: 1,
    use_check_in: true,
    event_status: 'draft' as 'draft' | 'registration_open' | 'registration_closed' | 'in_progress' | 'completed' | 'cancelled',
    form_fields: [] as any[],
    tags: [] as string[],
    main_image_file: undefined as File | undefined
  });

  // 圖片上傳相關狀態
  const [mainImagePreview, setMainImagePreview] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const mainImageRef = useRef<HTMLInputElement>(null);

  // 標籤相關狀態
  const [tagInput, setTagInput] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);



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
    try {
      if (editingEvent) {
        // 更新活動
        const response = await updateItemEventItem(editingEvent.id, eventForm);
        if (response.success) {
          showSuccess('更新成功', '活動已更新');
        } else {
          showError('更新失敗', response.message);
          return;
        }
      } else {
        // 創建新活動
        const response = await createItemEventItem(eventForm);
        if (response.success) {
          showSuccess('創建成功', '活動已創建');
        } else {
          showError('創建失敗', response.message);
          return;
        }
      }
      
      setShowEventModal(false);
      setEditingEvent(null);
      setEventForm({
        name: '',
        description: '',
        base_price: 0,
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
        main_image_file: undefined
      });
      setMainImagePreview('');
      setTagInput('');
      setShowTagSuggestions(false);
      loadEvents();
    } catch (error: any) {
      showError('操作失敗', error.message || '未知錯誤');
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

      const joinUrl = createEventJoinUrl(event.sku);
      
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

  // 處理主圖上傳
  const handleMainImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    processImageFile(file);
    e.target.value = '';
  };

  // 處理拖拽上傳
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        processImageFile(file);
      }
    }
  };

  // 處理圖片檔案
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showError('檔案格式錯誤', '請選擇圖片檔案');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === 'string') {
        setMainImagePreview(ev.target.result);
        setEventForm({ ...eventForm, main_image_file: file });
      }
    };
    reader.readAsDataURL(file);
  };

  // 移除主圖
  const removeMainImage = () => {
    setMainImagePreview('');
    setEventForm({ ...eventForm, main_image_file: undefined });
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
                    setEventForm({
                      name: '',
                      description: '',
                      base_price: 0,
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
                      main_image_file: undefined
                    });
                    setMainImagePreview('');
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
                    setEventForm({
                      name: '',
                      description: '',
                      base_price: 0,
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
                      main_image_file: undefined
                    });
                    setMainImagePreview('');
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
                   <div key={event.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                     {/* 活動主圖 */}
                     {event.main_image && (
                       <div className="relative h-48 bg-gray-100">
                         <img
                           src={event.main_image.url}
                           alt={event.name}
                           className="w-full h-full object-cover"
                         />
                       </div>
                     )}
                     
                     {/* 活動資訊 */}
                     <div className="p-6">
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
                                                               setEventForm({
                                  name: event.name,
                                  description: event.description,
                                  base_price: event.base_price,
                                  start_time: formatDateTimeForInput(event.start_time),
                                  end_time: formatDateTimeForInput(event.end_time),
                                  location: event.location,
                                  min_participants: event.min_participants,
                                  max_participants: event.max_participants,
                                  max_participants_per_user: event.max_participants_per_user,
                                  use_check_in: event.use_check_in,
                                  event_status: event.event_status,
                                  form_fields: event.form_fields,
                                  tags: event.item_tags?.map(tag => tag.name) || [],
                                  main_image_file: undefined
                                });
                               // 設定圖片預覽
                               if (event.main_image) {
                                 setMainImagePreview(event.main_image.url);
                               } else {
                                 setMainImagePreview('');
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
                           <span>{event.min_participants} - {event.max_participants} 人</span>
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
                       
                       {/* 活動狀態 */}
                       <div className="flex items-center gap-2 mb-3">
                         <span className={`px-2 py-1 text-xs rounded-full ${
                           event.event_status === 'draft' ? 'bg-gray-100 text-gray-700' :
                           event.event_status === 'registration_open' ? 'bg-green-100 text-green-700' :
                           event.event_status === 'registration_closed' ? 'bg-yellow-100 text-yellow-700' :
                           event.event_status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                           event.event_status === 'completed' ? 'bg-purple-100 text-purple-700' :
                           'bg-red-100 text-red-700'
                         }`}>
                           {event.event_status_display}
                         </span>
                       </div>
                       
                       {/* 活動統計資訊 */}
                       {event.statistics && (
                         <div className="border-t pt-3 mt-3">
                           <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                             <div>報名人數: {event.statistics.total_registrations}</div>
                             <div>參與人數: {event.statistics.total_participants}</div>
                             <div>已付款: {event.statistics.paid_registrations}</div>
                             <div>總收入: NT$ {event.statistics.total_revenue}</div>
                           </div>
                         </div>
                       )}
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
                      <input
                        type="number"
                        step="0.01"
                        value={eventForm.base_price}
                        onChange={(e) => setEventForm({ ...eventForm, base_price: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="0.00"
                        required
                      />
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="輸入活動描述"
                      rows={3}
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
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">主圖上傳</label>
                    <div className="flex items-center gap-4">
                      {/* 圖片預覽或上傳區域 */}
                      {mainImagePreview ? (
                        <div className="relative group">
                          <img
                            src={mainImagePreview}
                            alt="活動主圖預覽"
                            className="w-32 h-24 object-cover rounded-lg border border-gray-300"
                          />
                          <button
                            type="button"
                            onClick={removeMainImage}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                            title="移除圖片"
                          >
                            ×
                          </button>
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => mainImageRef.current?.click()}
                              className="opacity-0 group-hover:opacity-100 bg-white text-gray-700 px-3 py-1 rounded-lg text-sm font-medium hover:bg-gray-100 transition-all duration-200"
                            >
                              更換圖片
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`w-32 h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
                            isDragOver 
                              ? 'border-orange-500 bg-orange-50 text-orange-600' 
                              : 'border-gray-300 bg-gray-50 text-gray-400 hover:border-orange-400 hover:bg-orange-50 hover:text-orange-500'
                          }`}
                          onClick={() => mainImageRef.current?.click()}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                        >
                          <i className="ri-image-line text-2xl mb-1"></i>
                          <span className="text-xs text-center">
                            {isDragOver ? '放開上傳' : '點擊或拖拽上傳'}
                          </span>
                        </div>
                      )}
                      
                      {/* 上傳說明 */}
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 mb-2">
                          {mainImagePreview ? '已選擇圖片' : '上傳活動主圖'}
                        </p>
                        <p className="text-xs text-gray-500 mb-2">
                          支援 jpg, png, gif, webp 格式，建議尺寸 16:9
                        </p>
                        {!mainImagePreview && (
                          <div className="space-y-2">
                            <button
                              type="button"
                              onClick={() => mainImageRef.current?.click()}
                              className="px-3 py-1 bg-orange-600 text-white text-xs rounded-lg hover:bg-orange-700 transition-colors"
                            >
                              選擇圖片
                            </button>
                            <p className="text-xs text-gray-400">
                              或直接拖拽圖片到此區域
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
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
                  
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowEventModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      {editingEvent ? '更新' : '建立'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* 隱藏的檔案輸入 */}
        <input
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          ref={mainImageRef}
          onChange={handleMainImageUpload}
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
      </div>
    </div>
  );
};

export default ActivitySettings;
