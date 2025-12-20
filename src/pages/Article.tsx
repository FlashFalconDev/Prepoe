import React, { useState, useRef, useCallback, useEffect } from 'react';
import { FileText, Image, Video, Tag, Edit3, Plus, Save, Send, ArrowLeft, X, Crop, Check, RotateCcw, Loader2, Play, Music } from 'lucide-react';
import ImagePlaceholder from '../components/ImagePlaceholder';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import ConfirmDialog from '../components/ConfirmDialog';
import { AI_COLORS } from '../constants/colors';
import FeatureGate from '../components/FeatureGate';
import {
  getArticles,
  createArticle,
  updateArticle,
  deleteArticle,
  getTags,
  uploadFile,
  refreshCSRFToken,
  type Article,
  type ArticleData,
  type Tag as ApiTag,
  type Article as ApiArticle
} from '../config/api';
import { base64ToFile, compressImage } from '../services/fileUpload';
import MediaPlayer from '../components/MediaPlayer';

// 預設標籤選項（作為備用）
const defaultTags = [
  '科技', '生活', '美食', '旅遊', '健康', '教育', '娛樂', '運動',
  '藝術', '音樂', '電影', '書籍', '時尚', '美容', '寵物', '園藝',
  '攝影', '設計', '程式', '商業', '投資', '理財', '心理', '哲學'
];

// 裁切區域接口
interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 移除假數據，使用真實API

// 圖片裁切組件
const ImageCropper: React.FC<{
  imageSrc: string;
  onCrop: (croppedImage: string) => void;
  onCancel: () => void;
}> = ({ imageSrc, onCrop, onCancel }) => {
  const [cropArea, setCropArea] = useState<CropArea>({ x: 50, y: 50, width: 300, height: 168.75 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // 初始化裁切區域
  React.useEffect(() => {
    if (imageRef.current && containerRef.current) {
      const img = imageRef.current;
      const container = containerRef.current;
      
      // 等待圖片載入完成
      img.onload = () => {
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // 計算適合的裁切區域大小（16:9 比例）
        const aspectRatio = 16 / 9;
        let cropWidth = containerWidth * 0.8;
        let cropHeight = cropWidth / aspectRatio;
        
        // 如果高度超出容器，則以高度為基準
        if (cropHeight > containerHeight * 0.8) {
          cropHeight = containerHeight * 0.8;
          cropWidth = cropHeight * aspectRatio;
        }
        
        // 居中放置
        const x = (containerWidth - cropWidth) / 2;
        const y = (containerHeight - cropHeight) / 2;
        
        setCropArea({ x, y, width: cropWidth, height: cropHeight });
      };
    }
  }, [imageSrc]);

  const getEventCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    
    const rect = containerRef.current.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in e) {
      // 觸控事件
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      // 滑鼠事件
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    handlePointerDown(e);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    handlePointerDown(e);
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    const { x, y } = getEventCoordinates(e);
    
    // 檢查是否點擊在裁切區域的角落（調整大小）
    const cornerSize = 30; // 手機上增加觸控區域
    const isInCorner = 
      (x >= cropArea.x + cropArea.width - cornerSize && x <= cropArea.x + cropArea.width &&
       y >= cropArea.y + cropArea.height - cornerSize && y <= cropArea.y + cropArea.height);
    
    if (isInCorner) {
      setIsResizing(true);
      setResizeStart({ x, y, width: cropArea.width, height: cropArea.height });
    } else if (x >= cropArea.x && x <= cropArea.x + cropArea.width &&
               y >= cropArea.y && y <= cropArea.y + cropArea.height) {
      // 檢查是否點擊在裁切區域內（拖拽）
      setIsDragging(true);
      setDragStart({ x: x - cropArea.x, y: y - cropArea.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handlePointerMove(e);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    handlePointerMove(e);
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    
    const { x, y } = getEventCoordinates(e);
    
    if (isDragging) {
      const newX = x - dragStart.x;
      const newY = y - dragStart.y;
      
      // 限制裁切區域在容器內
      const maxX = containerRef.current.clientWidth - cropArea.width;
      const maxY = containerRef.current.clientHeight - cropArea.height;
      
      setCropArea(prev => ({
        ...prev,
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      }));
    } else if (isResizing) {
      const deltaX = x - resizeStart.x;
      const deltaY = y - resizeStart.y;
      
      // 保持 16:9 比例
      const aspectRatio = 16 / 9;
      const newWidth = Math.max(100, resizeStart.width + deltaX);
      const newHeight = newWidth / aspectRatio;
      
      // 限制在容器內
      const maxWidth = containerRef.current.clientWidth - cropArea.x;
      const maxHeight = containerRef.current.clientHeight - cropArea.y;
      
      const finalWidth = Math.min(newWidth, maxWidth);
      const finalHeight = Math.min(newHeight, maxHeight);
      
      setCropArea(prev => ({
        ...prev,
        width: finalWidth,
        height: finalHeight
      }));
    }
  };

  const handleMouseUp = () => {
    handlePointerUp();
  };

  const handleTouchEnd = () => {
    handlePointerUp();
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  const handleCrop = () => {
    if (!imageRef.current || !containerRef.current) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const image = imageRef.current;
    
    // 計算實際裁切區域（考慮圖片縮放）
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    const cropX = cropArea.x * scaleX;
    const cropY = cropArea.y * scaleY;
    const cropWidth = cropArea.width * scaleX;
    const cropHeight = cropArea.height * scaleY;
    
    // 設置畫布大小為裁切區域大小
    canvas.width = cropWidth;
    canvas.height = cropHeight;
    
    // 繪製裁切後的圖片
    ctx.drawImage(
      image,
      cropX, cropY, cropWidth, cropHeight,
      0, 0, cropWidth, cropHeight
    );
    
    // 轉換為 base64
    const croppedImage = canvas.toDataURL('image/jpeg', 0.9);
    onCrop(croppedImage);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* 防止手機縮放 */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">裁切封面圖片</h3>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleCrop}
              className={`px-4 py-2 ${AI_COLORS.button} rounded-lg transition-colors flex items-center gap-2`}
            >
              <Check size={16} />
              確認裁切
            </button>
          </div>
        </div>
        
        <div className="mb-4 text-sm text-gray-600">
          <p className="hidden sm:block">拖拽裁切框移動位置，拖拽右下角調整大小（保持 16:9 比例）</p>
          <p className="sm:hidden">觸控裁切框移動位置，觸控右下角調整大小（保持 16:9 比例）</p>
        </div>
        
        <div
          ref={containerRef}
          className="relative border border-gray-300 rounded-lg overflow-hidden cursor-move bg-gray-100 touch-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <img
            ref={imageRef}
            src={imageSrc}
            alt="裁切圖片"
            className="w-full h-auto block"
            draggable={false}
          />
          
          {/* 裁切框 */}
          <div
            className="absolute border-2 border-white shadow-lg"
            style={{
              left: cropArea.x,
              top: cropArea.y,
              width: cropArea.width,
              height: cropArea.height,
              cursor: isDragging ? 'grabbing' : 'grab'
            }}
          >
            {/* 裁切框角落指示器 */}
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-white border-2 border-primary-600 rounded-full"></div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-white border-2 border-primary-600 rounded-full"></div>
            <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border-2 border-primary-600 rounded-full"></div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white border-2 border-primary-600 rounded-full cursor-nw-resize flex items-center justify-center">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#f97316' }}></div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 text-xs text-gray-500">
          <p>裁切區域：{Math.round(cropArea.width)} × {Math.round(cropArea.height)} 像素</p>
          <p className="sm:hidden mt-2 text-primary-600">💡 提示：雙指縮放可能會影響操作，建議使用單指觸控</p>
        </div>
      </div>
    </div>
  );
};

const ContentCreator: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { confirm, isOpen, options, handleConfirm, handleCancel } = useConfirm();
  
  // 添加調試信息
  console.log('ContentCreator 頁面載入中...');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState<string>('');
  const [originalImage, setOriginalImage] = useState<string>('');
  const [showCropper, setShowCropper] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [audioFiles, setAudioFiles] = useState<string[]>([]);
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [articles, setArticles] = useState<Article[]>([]);
  const [availableTags, setAvailableTags] = useState<ApiTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const coverImageRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const [readingConditionEnabled, setReadingConditionEnabled] = useState(false);
  const [generalReadable, setGeneralReadable] = useState(false);
  const [vipReadable, setVipReadable] = useState(false);
  const [generalFee, setGeneralFee] = useState(0);
  const [vipFee, setVipFee] = useState(0);
  
  // 日期區間條件
  const [dateConditions, setDateConditions] = useState<Array<{
    id: string;
    generalReadable: boolean;
    vipReadable: boolean;
    generalFee: number;
    vipFee: number;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
  }>>([]);

  // 多媒體播放狀態
  const [selectedMedia, setSelectedMedia] = useState<{
    url: string;
    type: 'image' | 'video' | 'audio' | 'other';
    name?: string;
    caption?: string;
  } | null>(null);
  const [isMediaPlayerOpen, setIsMediaPlayerOpen] = useState(false);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
      setShowTagSuggestions(false);
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSelectDefaultTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput('');
    setShowTagSuggestions(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'audio') => {
    const files = e.target.files;
    if (!files) return;
    const fileArr = Array.from(files);
    fileArr.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (typeof ev.target?.result === 'string') {
          if (type === 'image') setImages(prev => [...prev, ev.target!.result as string]);
          if (type === 'video') setVideos(prev => [...prev, ev.target!.result as string]);
          if (type === 'audio') setAudioFiles(prev => [...prev, ev.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === 'string') {
        setOriginalImage(ev.target.result);
        setShowCropper(true);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropComplete = (croppedImage: string) => {
    setCoverImage(croppedImage);
    setShowCropper(false);
    setOriginalImage('');
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setOriginalImage('');
  };

  const removeCoverImage = () => {
    setCoverImage('');
  };

  // 添加日期區間條件
  const addDateCondition = () => {
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().split(' ')[0].substring(0, 5); // HH:MM 格式
    
    const newCondition = {
      id: `condition-${Date.now()}`,
      generalReadable: false,
      vipReadable: false,
      generalFee: 0,
      vipFee: 0,
      startDate: today,
      endDate: today,
      startTime: currentTime,
      endTime: currentTime,
    };
    
    // 檢查新條件是否與現有條件重疊
    const overlapCheck = checkDateOverlap(newCondition.id, newCondition.startDate, newCondition.endDate, newCondition.startTime, newCondition.endTime);
    
    if (!overlapCheck.isValid) {
      showError('無法添加日期區間', overlapCheck.message);
      return;
    }
    
    setDateConditions([...dateConditions, newCondition]);
  };

  // 檢查日期區間是否重疊
  const checkDateOverlap = (currentId: string, startDate: string, endDate: string, startTime: string = '00:00', endTime: string = '23:59') => {
    const currentStart = new Date(`${startDate}T${startTime}`);
    const currentEnd = new Date(`${endDate}T${endTime}`);
    
    // 檢查日期時間是否有效
    if (currentStart > currentEnd) {
      return { isValid: false, message: '開始時間不能晚於結束時間' };
    }
    
    // 檢查與其他區間是否重疊
    for (const condition of dateConditions) {
      if (condition.id === currentId) continue; // 跳過當前條件
      
      const existingStart = new Date(`${condition.startDate}T${condition.startTime}`);
      const existingEnd = new Date(`${condition.endDate}T${condition.endTime}`);
      
      // 檢查重疊：新區間的開始時間在現有區間內，或新區間的結束時間在現有區間內，或新區間完全包含現有區間
      if (
        (currentStart >= existingStart && currentStart <= existingEnd) ||
        (currentEnd >= existingStart && currentEnd <= existingEnd) ||
        (currentStart <= existingStart && currentEnd >= existingEnd)
      ) {
        return { 
          isValid: false, 
          message: `與條件 ${dateConditions.findIndex(c => c.id === condition.id) + 1} 的時間區間重疊 (${condition.startDate} ${condition.startTime} ~ ${condition.endDate} ${condition.endTime})` 
        };
      }
    }
    
    return { isValid: true, message: '' };
  };

  // 更新日期區間條件
  const updateDateCondition = (id: string, field: string, value: any) => {
    setDateConditions(prev => {
      const updatedConditions = prev.map(condition => 
        condition.id === id ? { ...condition, [field]: value } : condition
      );
      
      // 如果是更新日期或時間，檢查重疊
      if (field === 'startDate' || field === 'endDate' || field === 'startTime' || field === 'endTime') {
        const updatedCondition = updatedConditions.find(c => c.id === id);
        if (updatedCondition) {
          const overlapCheck = checkDateOverlap(
            id, 
            updatedCondition.startDate, 
            updatedCondition.endDate,
            updatedCondition.startTime,
            updatedCondition.endTime
          );
          
          if (!overlapCheck.isValid) {
            showError('日期區間錯誤', overlapCheck.message);
            // 恢復原值
            return prev;
          }
        }
      }
      
      return updatedConditions;
    });
  };

  // 刪除日期區間條件
  const removeDateCondition = (id: string) => {
    setDateConditions(prev => prev.filter(condition => condition.id !== id));
  };

  // 載入文章列表
  const loadArticles = async (page = 1) => {
    try {
      setLoading(true);
      const response = await getArticles(page);
      if (response.success) {
        if (page === 1) {
          setArticles(response.data.articles);
        } else {
          setArticles(prev => [...prev, ...response.data.articles]);
        }
        setHasMore(response.data.pagination.has_next);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('載入文章失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  // 載入標籤列表
  const loadTags = async () => {
    try {
      const response = await getTags();
      if (response.success) {
        setAvailableTags(response.data.tags);
      }
    } catch (error) {
      console.error('載入標籤失敗:', error);
      // 如果API失敗，使用預設標籤
      setAvailableTags(defaultTags.map((tag, index) => ({ id: index + 1, text: tag })));
    }
  };

  // 初始化載入
  useEffect(() => {
    loadArticles();
    loadTags();
  }, []);

  // 開始編輯文章
  const handleEditArticle = (article: Article) => {
    setEditingArticle(article);
    setIsEditing(true);
    setTitle(article.title);
    setContent(article.content);
    setTags(article.tags);
    setStatus(article.status);
    setCoverImage(article.cover_image_url || '');

    // 載入現有的附加圖片、影片和音頻
    const existingImages = article.images ? article.images.map(img => img.url) : [];
    const existingVideos = article.videos ? article.videos.map(vid => vid.url) : [];
    const existingAudios = article.audios ? article.audios.map(aud => aud.url) : [];
    setImages(existingImages);
    setVideos(existingVideos);
    setAudioFiles(existingAudios);
    
    // 載入閱讀條件設定
    if (article.reading_conditions && Array.isArray(article.reading_conditions)) {
      setReadingConditionEnabled(true);
      
      // 找到預設條件（沒有時間的）
      const defaultCondition = article.reading_conditions.find(c => !c.start_time && !c.end_time);
      if (defaultCondition) {
        setGeneralFee(defaultCondition.general >= 0 ? defaultCondition.general : 0);
        setVipFee(defaultCondition.vip >= 0 ? defaultCondition.vip : 0);
        setGeneralReadable(defaultCondition.general >= 0);
        setVipReadable(defaultCondition.vip >= 0);
      } else {
        setGeneralFee(0);
        setVipFee(0);
        setGeneralReadable(false);
        setVipReadable(false);
      }
      
      // 載入日期區間條件
      const dateConditionsData = article.reading_conditions
        .filter(c => c.start_time && c.end_time)
        .map(c => {
          // 解析日期時間字符串
          const startDateTime = c.start_time!;
          const endDateTime = c.end_time!;
          
          // 轉換 UTC 時間為本地時間
          const startDate = new Date(startDateTime);
          const endDate = new Date(endDateTime);
          
          // 提取日期和時間
          const startDateStr = startDate.toISOString().split('T')[0];
          const startTimeStr = startDate.toTimeString().split(' ')[0].substring(0, 5);
          const endDateStr = endDate.toISOString().split('T')[0];
          const endTimeStr = endDate.toTimeString().split(' ')[0].substring(0, 5);
          
          return {
            id: `${startDateStr}-${endDateStr}`,
            generalReadable: c.general >= 0,
            vipReadable: c.vip >= 0,
            generalFee: c.general >= 0 ? c.general : 0,
            vipFee: c.vip >= 0 ? c.vip : 0,
            startDate: startDateStr,
            endDate: endDateStr,
            startTime: startTimeStr,
            endTime: endTimeStr
          };
        });
      setDateConditions(dateConditionsData);
    } else {
      setReadingConditionEnabled(false);
      setGeneralFee(0);
      setVipFee(0);
      setGeneralReadable(false);
      setVipReadable(false);
      setDateConditions([]);
    }

    // 滾動到編輯器
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 取消編輯
  const handleCancelEdit = () => {
    setEditingArticle(null);
    setIsEditing(false);
    setTitle('');
    setContent('');
    setTags([]);
    setStatus('draft');
    setCoverImage('');
    setImages([]);
    setVideos([]);
    setReadingConditionEnabled(false);
    setGeneralFee(0);
    setVipFee(0);
    setGeneralReadable(false);
    setVipReadable(false);
  };

  // 發布文章
  const handlePublishArticle = async (article: Article) => {
    try {
      const response = await updateArticle(article.id, {
        title: article.title,
        content: article.content,
        status: 'published', // 改為發布狀態
        tags: article.tags
      });

      if (response.success) {
        showSuccess('發布成功', '文章已成功發布！');
        loadArticles(); // 重新載入文章列表
      } else {
        showError('發布失敗', response.message || '未知錯誤');
      }
    } catch (error: any) {
      console.error('發布文章失敗:', error);
      showError('發布失敗', '請稍後再試');
    }
  };

  // 保存文章
  const handleSaveArticle = async (articleStatus: 'draft' | 'published' = status) => {
    if (!title.trim() || !content.trim()) {
      showError('輸入錯誤', '請填寫標題和內容');
      return;
    }

    try {
      setSaving(true);

      // 在保存前先刷新CSRF token
      console.log('保存前刷新CSRF token...');
      await refreshCSRFToken();

      const articleData: ArticleData = {
        title: title.trim(),
        content: content.trim(),
        status: articleStatus,
        tags
      };

      // 處理封面圖片 - 使用 uploadFile 獲取 pk
      if (coverImage && coverImage.startsWith('data:')) {
        const result = await base64ToFile(coverImage, 'cover.jpg', 'image/jpeg');
        if (result.success && result.file) {
          // 可選：壓縮圖片
          const compressedResult = await compressImage(result.file, 0.8);
          const fileToUpload = (compressedResult.success && compressedResult.file)
            ? compressedResult.file
            : result.file;

          // 上傳檔案獲取 pk
          const uploadResponse = await uploadFile(fileToUpload);
          if (uploadResponse.success) {
            articleData.cover_image_pk = uploadResponse.data.Static_Usage_Record_pk;
          }
        }
      }

      // 處理附加圖片
      const imagePks: number[] = [];
      for (const imageUrl of images) {
        if (imageUrl.startsWith('data:')) {
          // 新上傳的 base64 圖片
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          const timestamp = Date.now();
          const file = new File([blob], `image_${timestamp}_${Math.random().toString(36).substr(2, 9)}.jpg`, { type: 'image/jpeg' });

          // 上傳檔案獲取 pk
          const uploadResponse = await uploadFile(file);
          if (uploadResponse.success) {
            imagePks.push(uploadResponse.data.Static_Usage_Record_pk);
          }
        } else if (imageUrl.startsWith('http')) {
          // 現有的圖片 URL，從 editingArticle 中提取 pk
          if (isEditing && editingArticle && editingArticle.images) {
            const existingImage = editingArticle.images.find(img => img.url === imageUrl);
            if (existingImage && existingImage.static_usage_record_pk) {
              imagePks.push(existingImage.static_usage_record_pk);
            }
          }
        }
      }
      // 總是傳遞 image_pks（即使是空陣列），讓後端知道要清空
      articleData.image_pks = imagePks;

      // 處理附加影片
      const videoPks: number[] = [];
      for (const videoUrl of videos) {
        if (videoUrl.startsWith('data:')) {
          // 新上傳的 base64 影片
          const response = await fetch(videoUrl);
          const blob = await response.blob();
          const timestamp = Date.now();
          const file = new File([blob], `video_${timestamp}_${Math.random().toString(36).substr(2, 9)}.mp4`, { type: 'video/mp4' });

          // 上傳檔案獲取 pk
          const uploadResponse = await uploadFile(file);
          if (uploadResponse.success) {
            videoPks.push(uploadResponse.data.Static_Usage_Record_pk);
          }
        } else if (videoUrl.startsWith('http')) {
          // 現有的影片 URL，從 editingArticle 中提取 pk
          if (isEditing && editingArticle && editingArticle.videos) {
            const existingVideo = editingArticle.videos.find(vid => vid.url === videoUrl);
            if (existingVideo && existingVideo.static_usage_record_pk) {
              videoPks.push(existingVideo.static_usage_record_pk);
            }
          }
        }
      }
      // 總是傳遞 video_pks（即使是空陣列），讓後端知道要清空
      articleData.video_pks = videoPks;

      // 處理附加音訊
      const audioPks: number[] = [];
      for (const audioUrl of audioFiles) {
        if (audioUrl.startsWith('data:')) {
          // 新上傳的 base64 音訊
          const response = await fetch(audioUrl);
          const blob = await response.blob();
          const timestamp = Date.now();
          const file = new File([blob], `audio_${timestamp}_${Math.random().toString(36).substr(2, 9)}.mp3`, { type: 'audio/mpeg' });

          // 上傳檔案獲取 pk
          const uploadResponse = await uploadFile(file);
          if (uploadResponse.success) {
            audioPks.push(uploadResponse.data.Static_Usage_Record_pk);
          }
        } else if (audioUrl.startsWith('http') || audioUrl.startsWith('blob:')) {
          // 現有的音訊 URL，從 editingArticle 中提取 pk
          if (isEditing && editingArticle && editingArticle.audios) {
            const existingAudio = editingArticle.audios.find(aud => aud.url === audioUrl);
            if (existingAudio && existingAudio.static_usage_record_pk) {
              audioPks.push(existingAudio.static_usage_record_pk);
            }
          }
        }
      }
      // 總是傳遞 audio_pks（即使是空陣列），讓後端知道要清空
      articleData.audio_pks = audioPks;

      // 處理閱讀條件設定
      if (readingConditionEnabled) {
        // 驗證日期區間是否有重疊
        for (const condition of dateConditions) {
          const overlapCheck = checkDateOverlap(condition.id, condition.startDate, condition.endDate, condition.startTime, condition.endTime);
          if (!overlapCheck.isValid) {
            showError('時間區間錯誤', `條件 ${dateConditions.findIndex(c => c.id === condition.id) + 1}: ${overlapCheck.message}`);
            return;
          }
        }
        
        const conditions = [];
        
        // 添加預設條件（沒有時間的）
        conditions.push({
          general: generalReadable ? generalFee : -1,
          vip: vipReadable ? vipFee : -1,
          start_time: null,
          end_time: null,
        });
        
        // 添加日期區間條件
        dateConditions.forEach(condition => {
          // 轉換本地時間為 UTC 時間
          const startDateTime = new Date(`${condition.startDate}T${condition.startTime}`);
          const endDateTime = new Date(`${condition.endDate}T${condition.endTime}`);
          
          conditions.push({
            general: condition.generalReadable ? condition.generalFee : -1,
            vip: condition.vipReadable ? condition.vipFee : -1,
            start_time: startDateTime.toISOString(),
            end_time: endDateTime.toISOString(),
          });
        });
        
        articleData.reading_conditions = conditions;
        
        console.log('閱讀條件設定:', {
          enabled: readingConditionEnabled,
          generalReadable,
          vipReadable,
          generalFee,
          vipFee,
          dateConditions,
          reading_conditions: articleData.reading_conditions
        });
      } else {
        articleData.reading_conditions = undefined;
        console.log('閱讀條件設定已禁用');
      }

      console.log('準備發送文章數據:', {
        articleData,
        pks: {
          cover_image_pk: articleData.cover_image_pk,
          image_pks: articleData.image_pks,
          video_pks: articleData.video_pks,
          audio_pks: articleData.audio_pks
        }
      });

      // 保存文章
      let response;
      if (isEditing && editingArticle) {
        // 更新現有文章
        response = await updateArticle(editingArticle.id, articleData);
      } else {
        // 創建新文章
        response = await createArticle(articleData);
      }
      console.log('文章API響應:', response);
      
      if (response.success) {
        const isPublished = articleStatus === 'published';
        showSuccess(
          isEditing ? '更新成功' : (isPublished ? '發布成功' : '保存成功'), 
          isEditing 
            ? `文章已成功${isPublished ? '發布' : '更新'}！` 
            : `文章已成功${isPublished ? '發布' : '保存為草稿'}！`
        );
        // 清空表單
        handleCancelEdit();
        // 重新載入文章列表
        loadArticles();
      } else {
        const isPublished = articleStatus === 'published';
        showError(
          isEditing ? '更新失敗' : (isPublished ? '發布失敗' : '保存失敗'), 
          response.message || '未知錯誤'
        );
      }
    } catch (error: any) {
      console.error('保存文章失敗:', error);
      
      // 更詳細的錯誤信息
      const isPublished = articleStatus === 'published';
      let errorTitle = isPublished ? '發布失敗' : '保存失敗';
      let errorMessage = '請稍後再試';
      
      if (error.response) {
        // 服務器響應了錯誤狀態碼
        console.error('錯誤響應:', error.response.data);
        
        if (error.response.status === 403) {
          // CSRF token錯誤
          errorTitle = 'CSRF Token錯誤';
          errorMessage = '安全令牌已過期，請重新登入或刷新頁面';
        } else {
          errorTitle = `服務器錯誤 (${error.response.status})`;
          errorMessage = error.response.data?.message || error.response.data?.error || '未知錯誤';
        }
      } else if (error.request) {
        // 請求已發送但沒有收到響應
        errorTitle = '網絡錯誤';
        errorMessage = '無法連接到服務器';
      } else {
        // 其他錯誤
        errorTitle = '請求錯誤';
        errorMessage = error.message;
      }
      
      showError(errorTitle, errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const filteredDefaultTags = availableTags
    .map(tag => tag.text)
    .filter(tag => 
      tag.toLowerCase().includes(tagInput.toLowerCase()) && !tags.includes(tag)
    );

  // 處理多媒體點擊
  const handleMediaClick = (url: string, type: 'image' | 'video' | 'audio' | 'other', name?: string, caption?: string) => {
    setSelectedMedia({ url, type, name, caption });
    setIsMediaPlayerOpen(true);
  };

  // 關閉多媒體播放器
  const closeMediaPlayer = () => {
    setIsMediaPlayerOpen(false);
    setSelectedMedia(null);
  };

  return (
    <FeatureGate feature="article_enabled">
      <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* 新增文章按鈕 - 只在沒有編輯時顯示 */}
        {!isEditing && (
          <div className="mb-6">
            <button
              onClick={() => {
                setIsEditing(true);
                setEditingArticle(null);
                // 重置所有欄位
                setTitle('');
                setContent('');
                setTags([]);
                setStatus('draft');
                setCoverImage('');
                setImages([]);
                setVideos([]);
                setAudioFiles([]);
              }}
              className={`flex items-center gap-2 px-6 py-3 ${AI_COLORS.button} rounded-xl text-base font-medium shadow-sm`}
            >
              <Plus size={20} />
              新增文章
            </button>
          </div>
        )}

        {/* Editor Section - 只在編輯時顯示 */}
        {isEditing && (
        <div className="bg-white rounded-2xl shadow-sm mb-8">
          <div className="p-4 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
      
                {isEditing && editingArticle && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium whitespace-nowrap">
                    編輯中：{editingArticle.title}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1 justify-end">
                <button
                  onClick={handleCancelEdit}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  <X size={16} />
                  <span className="hidden sm:inline">取消編輯</span>
                  <span className="sm:hidden">取消</span>
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-6">
                {/* Title Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">文章標題</label>
                  <input
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-lg focus:ring-2 focus:ring-ai-500 focus:border-transparent"
                    placeholder="輸入您的文章標題..."
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                  />
                </div>

                {/* Cover Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">封面圖片</label>
                  {coverImage ? (
                    <div className="relative">
                      <img 
                        src={coverImage} 
                        alt="封面圖片" 
                        className="w-full aspect-video object-cover rounded-xl border border-gray-200" 
                      />
                      <div className="absolute top-2 right-2 flex gap-2">
                        <button
                          type="button"
                          className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors"
                          onClick={() => {
                            setOriginalImage(coverImage);
                            setShowCropper(true);
                          }}
                          title="重新裁切"
                        >
                          <Crop size={16} />
                        </button>
                        <button
                          type="button"
                          className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                          onClick={removeCoverImage}
                          title="移除圖片"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <ImagePlaceholder
                      type="cover"
                      size="xl"
                      className="w-full aspect-video"
                      onClick={() => coverImageRef.current?.click()}
                    />
                  )}
                </div>

                {/* Content Input */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">文章內容</label>
                    <div className={`text-sm ${
                      content.length > 3000 ? 'text-red-600 font-semibold' :
                      content.length > 2700 ? 'text-orange-600 font-medium' :
                      'text-gray-500'
                    }`}>
                      {content.length} / 3000 字
                    </div>
                  </div>
                  <textarea
                    className={`w-full border rounded-xl px-4 py-3 min-h-[200px] focus:ring-2 focus:ring-ai-500 focus:border-transparent resize-none ${
                      content.length > 3000 ? 'border-red-500' : 'border-gray-200'
                    }`}
                    placeholder="開始撰寫您的文章內容..."
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    maxLength={3000}
                  />
                  {content.length > 2700 && content.length <= 3000 && (
                    <p className="mt-1 text-sm text-orange-600">
                      <i className="ri-alert-line mr-1"></i>
                      即將達到字數上限
                    </p>
                  )}
                  {content.length >= 3000 && (
                    <p className="mt-1 text-sm text-red-600">
                      <i className="ri-error-warning-line mr-1"></i>
                      已達到字數上限 (3000字)
                    </p>
                  )}
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">標籤</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {tags.map(tag => (
                      <span key={tag} className={`${AI_COLORS.bg} ${AI_COLORS.textDark} px-3 py-1 rounded-full text-sm flex items-center gap-2`}>
                        <Tag size={14} />
                        {tag}
                        <button 
                          type="button" 
                          className={`${AI_COLORS.text} hover:${AI_COLORS.textDark}`} 
                          onClick={() => handleRemoveTag(tag)}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  
                  {/* Tag Input with Suggestions */}
                  <div className="relative">
                    <div className="flex gap-2">
                      <input
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ai-500 focus:border-transparent"
                        placeholder="選擇或新增標籤"
                        value={tagInput}
                        onChange={e => {
                          setTagInput(e.target.value);
                          setShowTagSuggestions(e.target.value.length > 0);
                        }}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                        onFocus={() => setShowTagSuggestions(tagInput.length > 0)}
                      />
                      <button 
                        type="button" 
                        className={`${AI_COLORS.button} px-4 py-2 rounded-lg text-sm font-medium transition-colors`}
                        onClick={handleAddTag}
                      >
                        新增
                      </button>
                    </div>
                    
                    {/* Tag Suggestions */}
                    {showTagSuggestions && filteredDefaultTags.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 mt-1 max-h-48 overflow-y-auto">
                        <div className="p-2 border-b border-gray-100">
                          <p className="text-xs text-gray-500 font-medium">建議標籤</p>
                        </div>
                        {filteredDefaultTags.map(tag => (
                          <button
                            key={tag}
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                            onClick={() => handleSelectDefaultTag(tag)}
                          >
                            <Tag size={14} className="text-gray-400" />
                            {tag}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Popular Tags */}
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-2">熱門標籤</p>
                    <div className="flex flex-wrap gap-2">
                      {availableTags.slice(0, 8).map(tag => (
                        <button
                          key={tag.id}
                          type="button"
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            tags.includes(tag.text)
                              ? `${AI_COLORS.bgDark} text-white`
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                          onClick={() => handleSelectDefaultTag(tag.text)}
                        >
                          {tag.text}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Additional Media Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">附加多媒體</label>
                  <p className="text-xs text-gray-500 mb-3">這些檔案會顯示在文章內容下方</p>
                  <div className="flex gap-3 mb-4">
                    <button 
                      type="button" 
                      className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-200 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Image size={16} />
                      插入圖片
                    </button>
                    <button 
                      type="button" 
                      className={`flex items-center gap-2 ${AI_COLORS.bg} ${AI_COLORS.textDark} px-4 py-2 rounded-lg text-sm font-medium hover:${AI_COLORS.bgHover} transition-colors`}
                      onClick={() => videoInputRef.current?.click()}
                    >
                      <Video size={16} />
                      插入影片
                    </button>
                    <button 
                      type="button" 
                      className="flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                      onClick={() => audioInputRef.current?.click()}
                    >
                      <Music size={16} />
                      插入音頻
                    </button>
                  </div>
                  
                  {/* Media Preview */}
                  {(images.length > 0 || videos.length > 0 || audioFiles.length > 0) && (
                    <div className="flex flex-wrap gap-4">
                      {images.map((img, idx) => (
                        <div key={`img-${idx}-${img.substring(0, 20)}`} className="relative group cursor-pointer">
                          <img 
                            src={img} 
                            alt="附加圖片" 
                            className="w-32 h-32 object-cover rounded-lg transition-transform group-hover:scale-105" 
                            onClick={() => handleMediaClick(img, 'image', `image_${idx + 1}`, '附加圖片')}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <Image size={24} className="text-white" />
                            </div>
                          </div>
                          <button
                            type="button"
                            className="absolute -top-2 -right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors z-20 shadow-lg"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const newImages = images.filter((_, i) => i !== idx);
                              setImages(newImages);
                            }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                      
                      {videos.map((video, idx) => (
                        <div key={`video-${idx}-${video.substring(0, 20)}`} className="relative group cursor-pointer">
                          <video 
                            src={video} 
                            className="w-32 h-32 object-cover rounded-lg transition-transform group-hover:scale-105"
                            muted
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center">
                            <div className="opacity-100 group-hover:opacity-100 transition-opacity">
                              <Play size={32} className="text-white" />
                            </div>
                          </div>
                          <button
                            type="button"
                            className="absolute -top-2 -right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors z-20 shadow-lg"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const newVideos = videos.filter((_, i) => i !== idx);
                              setVideos(newVideos);
                            }}
                          >
                            <X size={12} />
                          </button>
                          <div 
                            className="absolute inset-0 cursor-pointer"
                            onClick={() => handleMediaClick(video, 'video', `video_${idx + 1}`, '附加影片')}
                          />
                        </div>
                      ))}

                      {audioFiles.map((audio, idx) => (
                        <div key={`audio-${idx}-${audio.substring(0, 20)}`} className="relative group cursor-pointer">
                          <div 
                            className="w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105"
                            onClick={() => handleMediaClick(audio, 'audio', `audio_${idx + 1}`, '附加音頻')}
                          >
                            <Music size={48} className="text-white" />
                          </div>
                          <button
                            type="button"
                            className="absolute -top-2 -right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors z-20 shadow-lg"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const newAudioFiles = audioFiles.filter((_, i) => i !== idx);
                              setAudioFiles(newAudioFiles);
                            }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>


                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
                  <button 
                    type="button" 
                    className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-lg text-sm font-medium transition-colors ${
                      status === 'draft' 
                        ? 'bg-gray-600 text-white hover:bg-gray-700' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => {
                      setStatus('draft');
                      handleSaveArticle('draft');
                    }}
                    disabled={saving}
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    <span className="hidden sm:inline">
                      {saving ? (isEditing ? '保存中...' : '儲存中...') : (isEditing ? '保存修改' : '儲存草稿')}
                    </span>
                    <span className="sm:hidden">
                      {saving ? (isEditing ? '保存中...' : '儲存中...') : (isEditing ? '保存修改' : '儲存草稿')}
                    </span>
                  </button>
                  {!isEditing && (
                    <button 
                      type="button" 
                      className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-lg text-sm font-medium transition-colors ${
                        status === 'published' 
                          ? `${AI_COLORS.button}` 
                          : `${AI_COLORS.bg} ${AI_COLORS.textDark} hover:${AI_COLORS.bgHover}`
                      }`}
                      onClick={() => {
                        setStatus('published');
                        handleSaveArticle('published');
                      }}
                      disabled={saving}
                    >
                      {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      <span className="hidden sm:inline">
                        {saving ? '發布中...' : '發布文章'}
                      </span>
                      <span className="sm:hidden">
                        {saving ? '發布中...' : '發布文章'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
          </div>
        </div>
        )}

        {/* Articles List */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">我的文章</h2>
          
          {loading && articles.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className={`animate-spin ${AI_COLORS.text}`} />
              <span className="ml-3 text-gray-600">載入文章中...</span>
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">還沒有文章，開始創作您的第一篇吧！</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {articles.map(article => (
                  <div key={article.id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    {article.cover_image_url && (
                      <div className="relative mb-4">
                        <img 
                          src={article.cover_image_url} 
                          alt="封面圖片" 
                          className="w-full aspect-video object-cover rounded-lg" 
                        />
                        {/* 狀態標籤放在圖片右上角 */}
                        <div className={`absolute top-2 right-2 px-3 py-1 rounded-lg text-xs font-semibold shadow-lg ${
                          article.status === 'published' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {article.status === 'draft' ? '草稿' : '已發布'}
                        </div>
                      </div>
                    )}
                    
                    {/* 如果沒有封面圖片，狀態標籤放在頂部 */}
                    {!article.cover_image_url && (
                      <div className="flex justify-end mb-4">
                        <div className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                          article.status === 'published' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {article.status === 'draft' ? '草稿' : '已發布'}
                        </div>
                      </div>
                    )}
                    
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{article.title}</h3>
                      <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">{article.content}</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {article.tags.map(tag => (
                        <span key={tag} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                          #{tag}
                        </span>
                      ))}
                    </div>
                    
                    {/* 顯示附加圖片、影片和音頻 */}
                    {(article.images && article.images.length > 0) || (article.videos && article.videos.length > 0) || (article.audios && article.audios.length > 0) ? (
                      <div className="mb-4">
                        <h4 className="text-xs font-medium text-gray-700 mb-2">附加多媒體</h4>
                        <div className="flex flex-wrap gap-2">
                          {article.images && article.images.map((img, idx) => (
                            <div
                              key={idx}
                              className="relative group cursor-pointer"
                              onClick={() => handleMediaClick(img.url, 'image', img.caption || `附加圖片 ${idx + 1}`, img.caption)}
                            >
                              <img
                                src={img.url}
                                alt={img.caption || `附加圖片 ${idx + 1}`}
                                className="w-16 h-16 object-cover rounded-lg transition-transform group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Image size={16} className="text-white" />
                                </div>
                              </div>
                            </div>
                          ))}
                          {article.videos && article.videos.map((vid, idx) => (
                            <div
                              key={idx}
                              className="relative group cursor-pointer"
                              onClick={() => handleMediaClick(vid.url, 'video', vid.caption || `附加影片 ${idx + 1}`, vid.caption)}
                            >
                              <video
                                src={vid.url}
                                className="w-20 h-16 object-cover rounded-lg transition-transform group-hover:scale-105"
                                muted
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center">
                                <div className="opacity-100 group-hover:opacity-100 transition-opacity">
                                  <Play size={16} className="text-white" />
                                </div>
                              </div>
                            </div>
                          ))}
                          {article.audios && article.audios.map((aud, idx) => (
                            <div
                              key={idx}
                              className="relative group cursor-pointer"
                              onClick={() => handleMediaClick(aud.url, 'audio', aud.caption || `附加音頻 ${idx + 1}`, aud.caption)}
                            >
                              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105">
                                <Music size={24} className="text-white" />
                              </div>
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-500">
                        <div>{article.created_at}</div>
                        <div>瀏覽 {article.view_count} • 讚 {article.like_count}</div>
                      </div>
                      <div className="flex gap-2">
                        {article.status === 'draft' && (
                          <button 
                            onClick={() => handlePublishArticle(article)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-green-600 text-sm font-medium hover:bg-green-50 transition-colors"
                          >
                            發布
                            <Send size={14} />
                          </button>
                        )}
                        <button 
                          onClick={() => handleEditArticle(article)}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg text-primary-600 text-sm font-medium hover:bg-primary-50 transition-colors"
                        >
                          編輯
                          <Edit3 size={14} />
                        </button>
                        <button 
                          className="flex items-center gap-2 px-4 py-2 rounded-lg text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
                          onClick={async () => {
                            const confirmed = await confirm({
                              title: '刪除文章',
                              message: '確定要刪除這篇文章嗎？此操作無法撤銷。',
                              confirmText: '刪除',
                              cancelText: '取消',
                              type: 'danger'
                            });
                            
                            if (confirmed) {
                              try {
                                const response = await deleteArticle(article.id);
                                if (response.success) {
                                  showSuccess('刪除成功', '文章已成功刪除');
                                  loadArticles();
                                } else {
                                  showError('刪除失敗', response.message || '未知錯誤');
                                }
                              } catch (error: any) {
                                console.error('刪除文章失敗:', error);
                                showError('刪除失敗', '請稍後再試');
                              }
                            }
                          }}
                        >
                          刪除
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {hasMore && (
                <div className="text-center mt-8">
                  <button
                    onClick={() => loadArticles(currentPage + 1)}
                    disabled={loading}
                    className={`px-6 py-3 rounded-lg transition-colors disabled:opacity-50 ${AI_COLORS.button}`}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin inline mr-2" />
                        載入中...
                      </>
                    ) : (
                      '載入更多文章'
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Hidden file inputs */}
        <input
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          ref={coverImageRef}
          onChange={handleCoverImageUpload}
        />
        <input
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          ref={fileInputRef}
          onChange={(e) => handleFileUpload(e, 'image')}
        />
        <input
          type="file"
          accept="video/*"
          multiple
          style={{ display: 'none' }}
          ref={videoInputRef}
          onChange={(e) => handleFileUpload(e, 'video')}
        />
        <input
          type="file"
          accept="audio/*"
          multiple
          style={{ display: 'none' }}
          ref={audioInputRef}
          onChange={(e) => handleFileUpload(e, 'audio')}
        />
      </div>
      {showCropper && originalImage && (
        <ImageCropper
          imageSrc={originalImage}
          onCrop={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
      
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
      {selectedMedia && (
        <MediaPlayer
          file={selectedMedia}
          isOpen={isMediaPlayerOpen}
          onClose={closeMediaPlayer}
        />
      )}
      </div>
    </FeatureGate>
  );
};

export default ContentCreator; 