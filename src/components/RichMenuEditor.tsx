import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, Plus, Trash2, Save, Upload, Edit3, Download, Play } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { richMenuApi, convertAreasToApiFormat, convertApiFormatToAreas, RichMenu, RichMenuImage, CreateRichMenuRequest, AddImageRequest } from '../services/richMenuApi';
import { previewImage, compressImage } from '../services/fileUploadApi';

// Rich Menu 區域介面
interface RichMenuArea {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  action: {
    type: 'postback' | 'message' | 'uri' | 'liff' | 'phone' | 'email' | 'datetimepicker' | 'camera' | 'cameraRoll' | 'location' | 'switch';
    data?: string;
    text?: string;
    uri?: string;
    liffId?: string;
    phone?: string;
    email?: string;
    switchMenuId?: number;
    mode?: string;
    initial?: string;
    max?: string;
    min?: string;
  };
  label?: string;
}

// Rich Menu 頁面介面
interface RichMenuPage {
  id: string;
  name: string;
  image: string;
  areas: RichMenuArea[];
  imageId?: number;
  isDefault?: boolean;
}

interface RichMenuEditorProps {
  isOpen: boolean;
  onClose: () => void;
  botId: string;
  botName: string;
  clientSid?: string;
}

// 獲取動作類型的中文顯示名稱
const getActionTypeDisplayName = (type: string): string => {
  const typeMap: { [key: string]: string } = {
    'postback': 'Postback',
    'message': '訊息',
    'uri': '網址',
    'liff': 'LIFF開啟',
    'phone': '電話',
    'email': '電子郵件',
    'datetimepicker': '日期時間選擇器',
    'camera': '相機',
    'cameraRoll': '相簿',
    'location': '位置',
    'switch': '切換'
  };
  return typeMap[type] || type;
};

const RichMenuEditor: React.FC<RichMenuEditorProps> = ({ isOpen, onClose, botId, botName, clientSid }) => {
  const { showSuccess, showError } = useToast();
  
  // 狀態管理
  const [pages, setPages] = useState<RichMenuPage[]>([
    {
      id: '1',
      name: '主頁面',
      image: '',
      areas: []
    }
  ]);
  const [currentPageId, setCurrentPageId] = useState('1');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [currentArea, setCurrentArea] = useState<RichMenuArea | null>(null);
  const [showAreaEditor, setShowAreaEditor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [hasImageUpdates, setHasImageUpdates] = useState(false);
  const [existingMenus, setExistingMenus] = useState<RichMenu[]>([]);
  const [selectedMenuId, setSelectedMenuId] = useState<number | null>(null);
  const [menuTitle, setMenuTitle] = useState('');
  const [menuDescription, setMenuDescription] = useState('');
  const [currentImageId, setCurrentImageId] = useState<number | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 獲取當前頁面
  const currentPage = pages.find(page => page.id === currentPageId);

  // 處理圖片上傳
  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      
      // 壓縮圖片
      const compressedFile = await compressImage(file);
      
      // 預覽圖片
      const imageUrl = await previewImage(compressedFile);
      
      if (currentPage) {
        setPages(pages.map(page => 
          page.id === currentPageId 
            ? { ...page, image: imageUrl }
            : page
        ));
        
        // 標記有圖片更新
        setHasImageUpdates(true);
        
        showSuccess('圖片載入成功');
      }
    } catch (error) {
      console.error('圖片上傳失敗:', error);
      showError(error instanceof Error ? error.message : '圖片上傳失敗');
    } finally {
      setUploadingImage(false);
    }
  }, [currentPageId, pages, showSuccess, showError]);

  // 處理畫布點擊事件（開始拖拽）
  const handleCanvasMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!currentPage?.image) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setIsDragging(true);
    setDragStart({ x, y });
  }, [currentPage?.image]);

  // 處理滑鼠移動事件（拖拽中）
  const handleCanvasMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !currentPage?.image) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // 重新繪製整個畫布
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清除畫布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 繪製背景圖片
    const img = imageRef.current;
    if (img) {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }

    // 繪製現有區域
    if (currentPage.areas && currentPage.areas.length > 0) {
      currentPage.areas.forEach(area => {
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 2;
        ctx.strokeRect(area.x, area.y, area.width, area.height);
        
        if (area.label) {
          ctx.fillStyle = 'rgba(59, 130, 246, 0.8)';
          ctx.fillRect(area.x, area.y, Math.min(area.width, 100), 20);
          ctx.fillStyle = 'white';
          ctx.font = '12px Arial';
          ctx.fillText(area.label, area.x + 4, area.y + 14);
        }
      });
    }

    // 繪製當前拖拽區域
    const width = x - dragStart.x;
    const height = y - dragStart.y;
    
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(dragStart.x, dragStart.y, width, height);
    ctx.setLineDash([]);
  }, [isDragging, currentPage, dragStart]);

  // 處理滑鼠釋放事件（結束拖拽）
  const handleCanvasMouseUp = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !currentPage?.image) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const width = Math.abs(x - dragStart.x);
    const height = Math.abs(y - dragStart.y);

    if (width > 10 && height > 10) {
      // 創建新區域
      const newArea: RichMenuArea = {
        id: Date.now().toString(),
        x: Math.min(dragStart.x, x),
        y: Math.min(dragStart.y, y),
        width,
        height,
        action: {
          type: 'message',
          text: '@'
        },
        label: `預設區域${(currentPage?.areas.length || 0) + 1}`
      };

      // 立即更新頁面狀態
      setPages(prevPages => 
        prevPages.map(page => 
          page.id === currentPageId 
            ? {
                ...page,
                areas: [...page.areas, newArea]
              }
            : page
        )
      );

      setCurrentArea(newArea);
      setShowAreaEditor(true);
    }

    setIsDragging(false);
  }, [isDragging, currentPage, dragStart, currentPageId]);

  // 繪製畫布
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !currentPage?.image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 設置畫布尺寸
    canvas.width = 800;
    canvas.height = 600;

    // 清除畫布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 繪製背景圖片
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // 繪製區域
    if (currentPage.areas && currentPage.areas.length > 0) {
      console.log('繪製區域數量:', currentPage.areas.length);
      currentPage.areas.forEach((area, index) => {
        console.log(`繪製區域 ${index + 1}:`, area);
        
        // 繪製區域邊框
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 2;
        ctx.strokeRect(area.x, area.y, area.width, area.height);
        
        // 繪製區域標籤背景
        if (area.label) {
          ctx.fillStyle = 'rgba(59, 130, 246, 0.8)';
          ctx.fillRect(area.x, area.y, Math.min(area.width, 100), 20);
          
          // 繪製區域標籤文字
          ctx.fillStyle = 'white';
          ctx.font = '12px Arial';
          ctx.fillText(area.label, area.x + 4, area.y + 14);
        }
      });
    } else {
      console.log('沒有區域需要繪製');
    }
  }, [currentPage]);

  // 當圖片載入完成時重新繪製
  const handleImageLoad = useCallback(() => {
    drawCanvas();
  }, [drawCanvas]);

  // 當頁面或區域變化時重新繪製
  useEffect(() => {
    if (currentPage?.image) {
      drawCanvas();
    }
  }, [currentPage, drawCanvas]);

  // 載入現有的 Rich Menu
  const loadExistingMenus = useCallback(async () => {
    if (!clientSid) {
      console.log('沒有 clientSid，無法載入選單');
      return;
    }
    
    console.log('載入選單，使用 clientSid:', clientSid);
    
    try {
      setLoading(true);
      const menus = await richMenuApi.getRichMenus(clientSid);
      console.log('載入到的選單:', menus);
      setExistingMenus(menus);
    } catch (error) {
      console.error('載入現有選單失敗:', error);
      showError('載入現有選單失敗');
    } finally {
      setLoading(false);
    }
  }, [clientSid, showError]);

  // 載入選定的 Rich Menu
  const loadSelectedMenu = useCallback(async (menuId: number) => {
    try {
      setLoading(true);
      const menu = existingMenus.find(m => m.id === menuId);
      if (!menu) return;

      setMenuTitle(menu.name || '');
      setMenuDescription(menu.description || '');
      setSelectedMenuId(menuId);

      // 轉換圖片為頁面格式
      const convertedPages = menu.images.map((image, index) => ({
        id: `page_${image.id}`,
        name: image.name || `圖片 ${index + 1}`,
        image: image.image_url,
        areas: convertApiFormatToAreas(image.button_areas),
        imageId: image.id,
        isDefault: image.is_default
      }));

      setPages(convertedPages);
      setCurrentPageId(convertedPages[0]?.id || '1');
      setCurrentImageId(convertedPages[0]?.imageId || null);
      
      // 重置圖片更新狀態
      setHasImageUpdates(false);
      
      showSuccess('選單載入成功');
    } catch (error) {
      console.error('載入選單失敗:', error);
      showError('載入選單失敗');
    } finally {
      setLoading(false);
    }
  }, [existingMenus, showSuccess, showError]);

  // 初始化載入
  useEffect(() => {
    if (isOpen && clientSid) {
      loadExistingMenus();
    }
  }, [isOpen, clientSid]);

  // 更新區域
  const updateArea = useCallback((updatedArea: RichMenuArea) => {
    if (!currentPage) return;

    setPages(prevPages => 
      prevPages.map(page => 
        page.id === currentPageId 
          ? {
              ...page,
              areas: page.areas.map(area => 
                area.id === updatedArea.id ? updatedArea : area
              )
            }
          : page
      )
    );
    
    setCurrentArea(null);
    setShowAreaEditor(false);
  }, [currentPage, currentPageId]);

  // 刪除區域
  const deleteArea = useCallback((areaId: string) => {
    if (!currentPage) return;

    setPages(prevPages => 
      prevPages.map(page => 
        page.id === currentPageId 
          ? {
              ...page,
              areas: page.areas.filter(area => area.id !== areaId)
            }
          : page
      )
    );
  }, [currentPage, currentPageId]);

  // 新增頁面
  const addPage = useCallback(() => {
    const newPage: RichMenuPage = {
      id: Date.now().toString(),
      name: `頁面 ${pages.length + 1}`,
      image: '',
      areas: []
    };
    setPages([...pages, newPage]);
    setCurrentPageId(newPage.id);
  }, [pages]);

  // 刪除頁面
  const deletePage = useCallback((pageId: string) => {
    if (pages.length <= 1) {
      showError('至少需要保留一個頁面');
      return;
    }

    setPages(pages.filter(page => page.id !== pageId));
    if (currentPageId === pageId) {
      setCurrentPageId(pages[0].id);
    }
  }, [pages, currentPageId, showError]);

  // 保存 Rich Menu
  const saveRichMenu = useCallback(async () => {
    // 檢查標題是否填寫
    if (!menuTitle || menuTitle.trim() === '') {
      showError('請填寫選單標題');
      return;
    }

    if (!currentPage?.image) {
      showError('請先上傳圖片');
      return;
    }

    try {
      setSaving(true);
      
      // 準備圖片文件
      const imageFiles: File[] = [];
      console.log('準備圖片文件，pages:', pages);
      
      for (const page of pages) {
        console.log(`頁面 ${page.id} 的圖片:`, page.image);
        if (page.image && (page.image.startsWith('blob:') || page.image.startsWith('data:'))) {
          // 如果是 blob URL 或 data URL，需要轉換為 File 對象
          try {
            const response = await fetch(page.image);
            const blob = await response.blob();
            const file = new File([blob], `image_${pages.indexOf(page)}.jpg`, { type: 'image/jpeg' });
            imageFiles.push(file);
            console.log(`成功轉換頁面 ${page.id} 的圖片為文件`);
          } catch (error) {
            console.error(`轉換頁面 ${page.id} 的圖片失敗:`, error);
          }
        } else {
          console.log(`頁面 ${page.id} 的圖片格式不支援:`, page.image);
        }
      }

      console.log('準備好的圖片文件數量:', imageFiles.length);
      
      if (imageFiles.length === 0) {
        showError('沒有有效的圖片文件，請先上傳圖片');
        return;
      }

      // 準備區域數據
      const allAreas = pages.flatMap(page => convertAreasToApiFormat(page.areas));
      console.log('準備的區域數據:', allAreas);

      const menuData = {
        bot_bid: botId,
        name: menuTitle || `${botName} 選單`,
        description: menuDescription,
        richmenu_num: 'main',
        menu_config: {
          size: { width: 2500, height: 1686 },
          chatBarText: '選單'
        },
        areas: allAreas
      };

      if (selectedMenuId) {
        if (hasImageUpdates) {
          // 有圖片更新時：使用更新 API，傳遞與創建時相同的內容
          console.log('檢測到圖片更新，使用更新 API 並傳遞圖片文件');
          
          const result = await richMenuApi.updateRichMenuWithFiles(selectedMenuId, menuData, imageFiles);
          console.log('更新結果:', result);
          showSuccess('選單已更新（包含圖片更新）');
        } else {
          // 沒有圖片更新時：只更新區域設定
          const updateData = {
            name: menuTitle || `${botName} 選單`,
            description: menuDescription,
            menu_config: {
              size: { width: 2500, height: 1686 },
              chatBarText: '選單'
            },
            areas: allAreas,
            update_images: false
          };
          
          const result = await richMenuApi.updateRichMenu(selectedMenuId, updateData);
          console.log('修改結果:', result);
          showSuccess('選單修改成功');
        }
      } else {
        // 創建新選單 (使用直接上傳方式)
        const newMenu = await richMenuApi.createRichMenuWithFiles(menuData, imageFiles);
        setSelectedMenuId(newMenu.id);
        showSuccess('選單創建成功');
      }

      // 重新載入選單列表
      await loadExistingMenus();
      
      // 重置圖片更新狀態
      setHasImageUpdates(false);
    } catch (error) {
      console.error('保存失敗:', error);
      showError('保存失敗，請重試');
    } finally {
      setSaving(false);
    }
  }, [botId, botName, pages, currentPage, menuTitle, menuDescription, selectedMenuId, showSuccess, showError, loadExistingMenus]);

  // 只更新區域設定
  const updateAreasOnly = useCallback(async () => {
    if (!selectedMenuId) {
      showError('請先選擇要更新的選單');
      return;
    }

    try {
      setSaving(true);
      
      // 準備區域數據
      const allAreas = pages.flatMap(page => convertAreasToApiFormat(page.areas));
      console.log('準備更新的區域數據:', allAreas);

      // 只更新區域設定
      await richMenuApi.updateAreas(selectedMenuId, allAreas);
      showSuccess('區域設定更新成功');
      
      // 重新載入選單列表
      await loadExistingMenus();
    } catch (error) {
      console.error('更新區域設定失敗:', error);
      showError('更新區域設定失敗，請重試');
    } finally {
      setSaving(false);
    }
  }, [selectedMenuId, pages, showSuccess, showError, loadExistingMenus]);


  // 部署 Rich Menu
  const deployRichMenu = useCallback(async (imageId?: number) => {
    if (!selectedMenuId) {
      showError('請先保存選單');
      return;
    }

    try {
      setDeploying(true);
      await richMenuApi.deployRichMenu(selectedMenuId, imageId);
      showSuccess('選單部署成功');
      
      // 重新載入選單列表
      await loadExistingMenus();
    } catch (error) {
      console.error('部署失敗:', error);
      showError('部署失敗，請重試');
    } finally {
      setDeploying(false);
    }
  }, [selectedMenuId, showSuccess, showError, loadExistingMenus]);

  // 切換圖片
  const switchImage = useCallback(async (imageId: number) => {
    if (!selectedMenuId) return;

    try {
      setLoading(true);
      await richMenuApi.switchImage(selectedMenuId, imageId);
      showSuccess('圖片切換成功');
      
      // 重新載入選單列表
      await loadExistingMenus();
    } catch (error) {
      console.error('切換圖片失敗:', error);
      showError('切換圖片失敗');
    } finally {
      setLoading(false);
    }
  }, [selectedMenuId, showSuccess, showError, loadExistingMenus]);

  // 添加圖片
  // 添加圖片到選單 (暫時停用，使用直接上傳方式)
  const addImage = useCallback(async (fileRecordId: number) => {
    showError('添加圖片功能已整合到創建選單中');
  }, [showError]);

  // 刪除 Rich Menu
  const deleteRichMenu = useCallback(async (menuId: number) => {
    if (!confirm('確定要刪除此選單嗎？此操作無法復原。')) {
      return;
    }

    try {
      setLoading(true);
      await richMenuApi.deleteRichMenu(menuId);
      showSuccess('選單刪除成功');
      
      // 重新載入選單列表
      await loadExistingMenus();
      
      // 如果刪除的是當前選單，清空編輯器
      if (selectedMenuId === menuId) {
        setSelectedMenuId(null);
        setMenuTitle('');
        setPages([{
          id: '1',
          name: '主頁面',
          image: '',
          areas: []
        }]);
        setCurrentPageId('1');
      }
    } catch (error) {
      console.error('刪除失敗:', error);
      showError('刪除失敗，請重試');
    } finally {
      setLoading(false);
    }
  }, [selectedMenuId, showSuccess, showError, loadExistingMenus]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* 標題列 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <i className="ri-menu-line text-2xl text-blue-600"></i>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Rich Menu 編輯器</h3>
              <p className="text-sm text-gray-500">{botName} - {botId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* 左側：頁面列表和工具 */}
          <div className="w-80 border-r border-gray-200 flex flex-col">
            {/* 選單管理 */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">選單管理</h4>
                <button
                  onClick={() => {
                    setSelectedMenuId(null);
                    setMenuTitle('');
                    setPages([{
                      id: '1',
                      name: '主頁面',
                      image: '',
                      areas: []
                    }]);
                    setCurrentPageId('1');
                  }}
                  className="flex items-center gap-1 px-2 py-1 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                >
                  <Plus size={14} />
                  新建選單
                </button>
              </div>
              
              {/* 選單資訊輸入 */}
              <div className="mb-3 space-y-2">
                <input
                  type="text"
                  value={menuTitle}
                  onChange={(e) => setMenuTitle(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    (!menuTitle || menuTitle.trim() === '') 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300'
                  }`}
                  placeholder="選單標題 *"
                />
                <input
                  type="text"
                  value={menuDescription}
                  onChange={(e) => setMenuDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="選單描述"
                />
              </div>

              {/* 現有選單列表 */}
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {existingMenus.map(menu => (
                  <div
                    key={menu.id}
                    className={`p-2 rounded-lg border cursor-pointer transition-colors ${
                      selectedMenuId === menu.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => loadSelectedMenu(menu.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {menu.name || menu.richmenu_num}
                        </div>
                        <div className="text-xs text-gray-500">
                          {menu.status_display} {menu.is_active ? '(活躍)' : ''}
                        </div>
                        <div className="text-xs text-gray-400">
                          {menu.images?.length || 0} 張圖片
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {menu.richmenu_id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deployRichMenu();
                            }}
                            disabled={deploying}
                            className="p-1 text-green-500 hover:bg-green-50 rounded transition-colors"
                            title="重新部署"
                          >
                            <Play size={12} />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteRichMenu(menu.id);
                          }}
                          className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="刪除選單"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {existingMenus.length === 0 && (
                  <div className="text-center text-gray-500 text-sm py-2">
                    尚無選單
                  </div>
                )}
              </div>
            </div>


            {/* 工具列 */}
            <div className="p-4 border-b border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3">工具</h4>
              <div className="space-y-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="w-full flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload size={16} />
                  {uploadingImage ? '上傳中...' : '上傳圖片'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* 區域列表 */}
            <div className="flex-1 p-4 overflow-y-auto">
              <h4 className="font-medium text-gray-900 mb-3">區域列表</h4>
              <div className="space-y-2">
                {currentPage?.areas.map(area => (
                  <div
                    key={area.id}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{area.label || '未命名區域'}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setCurrentArea(area);
                            setShowAreaEditor(true);
                          }}
                          className="p-1 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Edit3 size={12} />
                        </button>
                        <button
                          onClick={() => deleteArea(area.id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {getActionTypeDisplayName(area.action.type)}
                    </div>
                  </div>
                ))}
                {(!currentPage?.areas || currentPage.areas.length === 0) && (
                  <div className="text-center text-gray-500 text-sm py-4">
                    尚未設定區域
                    <br />
                    在圖片上拖拽來新增區域
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 右側：畫布區域 */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h4 className="font-medium text-gray-900">
                {currentPage?.name}
              </h4>
            </div>
            
            <div className="flex-1 p-4 overflow-auto">
              {currentPage?.image ? (
                <div className="relative inline-block">
                  <canvas
                    ref={canvasRef}
                    className="border border-gray-300 rounded-lg cursor-crosshair"
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    style={{ maxWidth: '100%', height: 'auto' }}
                  />
                  <img
                    ref={imageRef}
                    src={currentPage.image}
                    alt="Rich Menu"
                    className="hidden"
                    onLoad={handleImageLoad}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-96 border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-center">
                    <Upload size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 mb-2">請先上傳 Rich Menu 圖片</p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      選擇圖片
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 底部操作列 */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            拖拽滑鼠在圖片上繪製區域
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            
            {/* 根據是否有圖片更新來決定顯示哪個按鈕 */}
            {hasImageUpdates ? (
              // 有圖片更新時顯示保存選單按鈕
              <button
                onClick={saveRichMenu}
                disabled={saving || !currentPage?.image}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <Save size={16} />
                {saving ? '保存中...' : '保存選單'}
              </button>
            ) : selectedMenuId ? (
              // 沒有圖片更新但有選單時顯示更新區域按鈕
              <button
                onClick={updateAreasOnly}
                disabled={saving || !currentPage?.image}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <Edit3 size={16} />
                {saving ? '更新中...' : '更新區域'}
              </button>
            ) : (
              // 沒有選單時顯示保存選單按鈕（創建新選單）
              <button
                onClick={saveRichMenu}
                disabled={saving || !currentPage?.image}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <Save size={16} />
                {saving ? '保存中...' : '保存選單'}
              </button>
            )}
            {selectedMenuId && (
              <button
                onClick={() => deployRichMenu()}
                disabled={deploying}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <Play size={16} />
                {deploying ? '部署中...' : '部署選單'}
              </button>
            )}
          </div>
        </div>

        {/* 區域編輯器模態框 */}
        {showAreaEditor && currentArea && (
          <AreaEditor
            area={currentArea}
            onSave={updateArea}
            onCancel={() => {
              setCurrentArea(null);
              setShowAreaEditor(false);
            }}
            existingMenus={existingMenus}
            selectedMenuId={selectedMenuId}
          />
        )}
      </div>
    </div>
  );
};

// 區域編輯器組件
interface AreaEditorProps {
  area: RichMenuArea;
  onSave: (area: RichMenuArea) => void;
  onCancel: () => void;
  existingMenus: RichMenu[];
  selectedMenuId: number | null;
}

const AreaEditor: React.FC<AreaEditorProps> = ({ area, onSave, onCancel, existingMenus, selectedMenuId }) => {
  const [editedArea, setEditedArea] = useState<RichMenuArea>({ ...area });

  const handleSave = () => {
    onSave(editedArea);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">編輯區域</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">區域標籤</label>
            <input
              type="text"
              value={editedArea.label || ''}
              onChange={(e) => setEditedArea({ ...editedArea, label: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="輸入區域標籤"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">動作類型</label>
            <select
              value={editedArea.action.type}
              onChange={(e) => setEditedArea({
                ...editedArea,
                action: { ...editedArea.action, type: e.target.value as any }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="message">訊息</option>
              <option value="uri">網址</option>
              <option value="liff">LIFF開啟</option>
              <option value="phone">電話</option>
              <option value="email">電子郵件</option>
              {/* <option value="datetimepicker">日期時間選擇器</option> */}
              <option value="camera">相機</option>
              <option value="cameraRoll">相簿</option>
              <option value="location">位置</option>
              <option value="switch">切換</option>
              <option value="postback">Postback</option>
            </select>
          </div>

          {editedArea.action.type === 'postback' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Postback 資料</label>
              <input
                type="text"
                value={editedArea.action.data || ''}
                onChange={(e) => setEditedArea({
                  ...editedArea,
                  action: { ...editedArea.action, data: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="輸入 postback 資料"
              />
            </div>
          )}

          {editedArea.action.type === 'message' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">訊息內容</label>
              <input
                type="text"
                value={editedArea.action.text || ''}
                onChange={(e) => setEditedArea({
                  ...editedArea,
                  action: { ...editedArea.action, text: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="輸入訊息內容"
              />
            </div>
          )}

          {editedArea.action.type === 'uri' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">網址</label>
              <input
                type="url"
                value={editedArea.action.uri || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setEditedArea({
                    ...editedArea,
                    action: { ...editedArea.action, uri: value }
                  });
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  editedArea.action.uri && !editedArea.action.uri.startsWith('https://') && !editedArea.action.uri.startsWith('http://')
                    ? 'border-red-500' 
                    : 'border-gray-300'
                }`}
                placeholder="輸入網址 (必須以 https:// 或 http:// 開頭)"
              />
              {editedArea.action.uri && !editedArea.action.uri.startsWith('https://') && !editedArea.action.uri.startsWith('http://') && (
                <p className="text-red-500 text-sm mt-1">網址必須以 https:// 或 http:// 開頭</p>
              )}
            </div>
          )}

          {editedArea.action.type === 'liff' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">LIFF 網址</label>
              <input
                type="url"
                value={editedArea.action.liffId || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setEditedArea({
                    ...editedArea,
                    action: { ...editedArea.action, liffId: value }
                  });
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  editedArea.action.liffId && !editedArea.action.liffId.startsWith('https://') && !editedArea.action.liffId.startsWith('http://')
                    ? 'border-red-500' 
                    : 'border-gray-300'
                }`}
                placeholder="輸入網址 (必須以 https:// 或 http:// 開頭)"
              />
              {editedArea.action.liffId && !editedArea.action.liffId.startsWith('https://') && !editedArea.action.liffId.startsWith('http://') && (
                <p className="text-red-500 text-sm mt-1">網址必須以 https:// 或 http:// 開頭</p>
              )}
            </div>
          )}

          {editedArea.action.type === 'phone' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">電話號碼</label>
              <input
                type="tel"
                value={editedArea.action.phone || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setEditedArea({
                    ...editedArea,
                    action: { ...editedArea.action, phone: value }
                  });
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  editedArea.action.phone && !/^[\d\+]+$/.test(editedArea.action.phone)
                    ? 'border-red-500' 
                    : 'border-gray-300'
                }`}
                placeholder="輸入電話號碼 (只允許數字和 + 號)"
              />
              {editedArea.action.phone && !/^[\d\+]+$/.test(editedArea.action.phone) && (
                <p className="text-red-500 text-sm mt-1">電話號碼格式不正確，只允許數字和 + 號</p>
              )}
            </div>
          )}

          {editedArea.action.type === 'email' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">電子郵件</label>
              <input
                type="email"
                value={editedArea.action.email || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setEditedArea({
                    ...editedArea,
                    action: { ...editedArea.action, email: value }
                  });
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  editedArea.action.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editedArea.action.email)
                    ? 'border-red-500' 
                    : 'border-gray-300'
                }`}
                placeholder="輸入電子郵件地址"
              />
              {editedArea.action.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editedArea.action.email) && (
                <p className="text-red-500 text-sm mt-1">電子郵件格式不正確</p>
              )}
            </div>
          )}

          {editedArea.action.type === 'switch' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">選擇選單</label>
              <select
                value={editedArea.action.switchMenuId || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setEditedArea({
                    ...editedArea,
                    action: { ...editedArea.action, switchMenuId: value ? parseInt(value) : undefined }
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">請選擇要切換的選單</option>
                {existingMenus
                  .filter(menu => menu.id !== selectedMenuId) // 排除當前選單
                  .map(menu => (
                    <option key={menu.id} value={menu.id}>
                      {menu.name || menu.richmenu_num}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default RichMenuEditor;
