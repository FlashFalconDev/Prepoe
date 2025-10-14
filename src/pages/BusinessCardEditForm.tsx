import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import PreviewOverlay from '../components/PreviewOverlay';
import { ArrowLeft, Save, Upload, User, Tag, Link2, Share2, Palette, Plus, X, Trash2, GripVertical } from 'lucide-react';
import ImagePlaceholder from '../components/ImagePlaceholder';
import PreviewCard, { PreviewCardData } from '../components/PreviewCard';
import { useNavigate, useParams } from 'react-router-dom';
import { useBusinessCard } from '../contexts/BusinessCardContext';
import { useFileUpload } from '../hooks/useFileUpload';
import { AI_COLORS } from '../constants/colors';

interface Profile {
  id: number;
  name: string;
  bio: string;
  email: string;
  show_email: boolean;
  phone: string;
  show_phone: boolean;
  mobile: string;
  show_mobile: boolean;
  address: string;
  show_address: boolean;
  bg_color: string;
  text_color: string;
  button_color: string;
  button_text_color: string;
  ctag_bg_color: string;
  ctag_text_color: string;
  contact_bg_color: string;
  contact_icon_color: string;
  social_icon_color: string;
  page_bg_color: string;
  slug: string;
  social_position: string;
  social_size: string;
  profile_picture_url: string;
}

interface Tag {
  id: number;
  text: string;
  is_visible: boolean;
  order: number;
}

interface Link {
  id: number;
  title: string;
  url: string;
  is_active: boolean;
  is_fullwidth: boolean;
  order: number;
  icon_url: string;
}

interface SocialMediaItem {
  platform: string;
  url: string;
  is_active: boolean;
  style: string;
}

interface SocialMedia {
  [key: string]: SocialMediaItem;
}

interface FormData {
  profile: Profile;
  tags: Tag[];
  links: Link[];
  social_media: SocialMedia;
}

const BusinessCardEditForm: React.FC = () => {
  const navigate = useNavigate();
  const { tab } = useParams<{ tab: string }>();
  const { data, loading, loadData, updateData, saveData, saveLink, deleteLink } = useBusinessCard();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeSocialPlatform, setActiveSocialPlatform] = useState<string | null>(null);
  const [activeAppearanceSection, setActiveAppearanceSection] = useState<string | null>(null);
  const [expandedLinkIndex, setExpandedLinkIndex] = useState<number | null>(null);
  const [activeContactKey, setActiveContactKey] = useState<'email' | 'mobile' | 'phone' | 'address' | null>(null);
  // 預覽（不離開編輯頁）
  const [showPreview, setShowPreview] = useState(false);
  const previewContentRef = useRef<HTMLDivElement | null>(null);
  const [previewScale, setPreviewScale] = useState(1);
  const [previewSize, setPreviewSize] = useState<{ width: number; height: number }>({ width: 340, height: 0 });
  const [previewGapX, setPreviewGapX] = useState(24);
  
  // 使用統一的檔案上傳 Hook
  const { uploadFile: uploadLinkIcon, uploading: uploadingLinkIcon, error: linkIconError } = useFileUpload({
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    compress: true,
    quality: 0.8
  });

  // 根據內容等比縮放預覽（移至 formData 定義之後再綁定於表單內容）

  const toggleLinkExpanded = (index: number) => {
    setExpandedLinkIndex(prev => (prev === index ? null : index));
  };

  // Remix Icon class helper for social icons
  const getRemixIconClass = (platform: string, style: string): string => {
    const baseMap: Record<string, string> = {
      facebook: 'facebook',
      instagram: 'instagram',
      twitter: 'twitter', // use twitter (more broadly supported than twitter-x)
      linkedin: 'linkedin',
      youtube: 'youtube',
      github: 'github',
      tiktok: 'tiktok',
      spotify: 'spotify'
    };
    const base = baseMap[platform] || platform;
    const variant = style === 'outline' ? 'line' : 'fill';
    return `ri-${base}-${variant}`;
  };

  const [formData, setFormData] = useState<FormData>({
    profile: {
      id: 1,
      name: '',
      bio: '',
      email: '',
      show_email: true,
      phone: '',
      show_phone: true,
      mobile: '',
      show_mobile: true,
      address: '',
      show_address: true,
      bg_color: '#2e3c6b',
      text_color: '#ffffff',
      button_color: '#8897d3',
      button_text_color: '#302c2c',
      ctag_bg_color: '#3d485c',
      ctag_text_color: '#ffffff',
      contact_bg_color: '#3d485c',
      contact_icon_color: '#ffffff',
      social_icon_color: '#f5f5f5',
      page_bg_color: '#3d485c',
      slug: '',
      social_position: 'bottom',
      social_size: 'medium',
      profile_picture_url: ''
    },
    tags: [],
    links: [],
    social_media: {
      facebook: { platform: 'facebook', url: '', is_active: false, style: 'fill' },
      instagram: { platform: 'instagram', url: '', is_active: false, style: 'fill' },
      line: { platform: 'line', url: '', is_active: false, style: 'fill' },
      telegram: { platform: 'telegram', url: '', is_active: false, style: 'fill' },
      threads: { platform: 'threads', url: '', is_active: false, style: 'fill' },
      twitter: { platform: 'twitter', url: '', is_active: false, style: 'fill' },
      youtube: { platform: 'youtube', url: '', is_active: false, style: 'fill' }
    }
  });

  // 等比縮放：隨預覽顯示與表單內容改變而重算
  useEffect(() => {
    const BASE_WIDTH = 340;
    const recalc = () => {
      if (!showPreview) return setPreviewScale(1);
      const padY = 48;
      const padX = 80;
      const maxHeight = window.innerHeight - padY * 2;
      const maxWidth = Math.min(window.innerWidth - padX * 2, BASE_WIDTH);
      const el = previewContentRef.current;
      if (!el) return setPreviewScale(1);
      const naturalHeight = el.scrollHeight || el.getBoundingClientRect().height || 0;
      const scaleH = naturalHeight > 0 ? maxHeight / naturalHeight : 1;
      const scaleW = maxWidth / BASE_WIDTH;
      const next = Math.min(scaleH, scaleW, 1);
      setPreviewScale(next);
      setPreviewSize({ width: Math.round(BASE_WIDTH * next), height: Math.round(naturalHeight * next) });
      const gap = Math.max(20, Math.min(48, Math.round(window.innerWidth * 0.04)));
      setPreviewGapX(gap);
    };
    recalc();
    window.addEventListener('resize', recalc);
    return () => window.removeEventListener('resize', recalc);
  }, [showPreview, formData]);

  // 由共用 PreviewOverlay 管理 body 滾動鎖定，這裡不再處理

  useEffect(() => {
    // 載入數據 - 只有在没有数据时才调用
    if (!data) {
      console.log('📝 BusinessCardEditForm: 没有数据，调用 loadData');
      loadData();
    } else {
      console.log('📝 BusinessCardEditForm: 已有数据，跳过 loadData');
    }
  }, [loadData, data]);

  // 當 Context 中的數據更新時，同步到本地狀態
  useEffect(() => {
    if (data) {
      setFormData(data);
    }
  }, [data]);

  const handleProfileChange = (field: keyof Profile, value: any) => {
    setFormData(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        [field]: value
      }
    }));
  };

  const handleTagChange = (index: number, field: keyof Tag, value: any) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.map((tag, i) => 
        i === index ? { ...tag, [field]: value } : tag
      )
    }));
  };

  // 拖拽排序相關函數
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
    (e.currentTarget as HTMLElement).style.opacity = '0.5';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    
    if (dragIndex === dropIndex) return;
    
    setFormData(prev => {
      const newTags = [...prev.tags];
      const draggedTag = newTags[dragIndex];
      
      // 移除拖拽的元素
      newTags.splice(dragIndex, 1);
      // 在目標位置插入
      newTags.splice(dropIndex, 0, draggedTag);
      
      // 重新分配順序編號
      newTags.forEach((tag, index) => {
        tag.order = index + 1;
      });
      
      return { ...prev, tags: newTags };
    });
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).style.opacity = '1';
  };

  // 連結拖拽排序相關函數
  const handleLinkDragStart = (e: React.DragEvent, index: number) => {
    // 存放拖拽元素的唯一資訊（用 id + order 組合，避免 id=0 的情況重複）
    const sortedLinks = [...formData.links].sort((a, b) => a.order - b.order);
    const item = sortedLinks[index];
    const payload = JSON.stringify({ id: item.id, order: item.order });
    e.dataTransfer.setData('text/plain', payload);
    e.dataTransfer.effectAllowed = 'move';
    (e.currentTarget as HTMLElement).style.opacity = '0.5';
  };

  const handleLinkDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleLinkDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('text/plain');
    if (!raw) return;
    let payload: { id: number; order: number } | null = null;
    try { payload = JSON.parse(raw); } catch {}
    if (!payload) return;

    setFormData(prev => {
      // 以排序後的視圖進行重排，再寫回 state
      const sorted = [...prev.links].sort((a, b) => a.order - b.order);
      const sourceIndex = sorted.findIndex(l => l.id === payload!.id && l.order === payload!.order);
      if (sourceIndex === -1 || sourceIndex === dropIndex) return prev;
      const [moved] = sorted.splice(sourceIndex, 1);
      const insertIndex = dropIndex;
      sorted.splice(insertIndex, 0, moved);
      sorted.forEach((link, idx) => {
        link.order = idx + 1;
      });
      return { ...prev, links: sorted };
    });
    // 移除立即保存的邏輯，讓用戶手動保存
  };

  const handleLinkDragEnd = (e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).style.opacity = '1';
  };

  const addTag = () => {
    const newTag: Tag = {
      id: 0, // 設為 0 表示新標籤，後端會自動生成 ID
      text: '',
      is_visible: true,
      order: formData.tags.length + 1
    };
    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, newTag]
    }));
  };

  const removeTag = (index: number) => {
    setFormData(prev => {
      const newTags = prev.tags.filter((_, i) => i !== index);
      // 重新分配順序編號
      newTags.forEach((tag, i) => {
        tag.order = i + 1;
      });
      return {
        ...prev,
        tags: newTags
      };
    });
  };

  const handleLinkChange = (index: number, field: keyof Link, value: any) => {
    setFormData(prev => {
      // 獲取排序後的連結列表
      const sortedLinks = [...prev.links].sort((a, b) => a.order - b.order);
      const linkToUpdate = sortedLinks[index];
      
      // 如果移除圖片且"滿版"功能已啟用，自動關閉"滿版"功能
      if (field === 'icon_url' && !value && linkToUpdate.is_fullwidth) {
        return {
          ...prev,
          links: prev.links.map(link => 
            link.id === linkToUpdate.id ? { ...link, [field]: value, is_fullwidth: false } : link
          )
        };
      }
      
      // 更新原始列表中對應的連結
      return {
        ...prev,
        links: prev.links.map(link => 
          link.id === linkToUpdate.id ? { ...link, [field]: value } : link
        )
      };
    });
    
    // 移除立即保存的邏輯，讓用戶手動保存
    // 新連結和現有連結的修改都只更新本地狀態
  };

  const addLink = () => {
    const newLink: Link = {
      id: 0, // 設為 0 表示新連結，後端會自動生成 ID
      title: '',
      url: '',
      is_active: true,
      is_fullwidth: false,
      order: formData.links.length + 1,
      icon_url: ''
    };
    
    // 只添加到本地狀態，不立即保存到後端
    setFormData(prev => ({
      ...prev,
      links: [...prev.links, newLink]
    }));
  };

  const removeLink = async (index: number) => {
    // 立即刪除：既有連結直接打 API，新增( id === 0 ) 僅本地移除
    const sortedLinks = [...formData.links].sort((a, b) => a.order - b.order);
    const linkToRemove = sortedLinks[index];

    if (!linkToRemove) return;

    if (linkToRemove.id !== 0) {
      const ok = await deleteLink(linkToRemove.id);
      if (!ok) {
        console.error('刪除連結失敗');
        return;
      }
    }

    setFormData(prev => {
      const newLinks = prev.links.filter(link => link.id !== linkToRemove.id);
      newLinks.forEach((link, i) => {
        link.order = i + 1;
      });
      return { ...prev, links: newLinks };
    });
  };

  const handleSocialMediaChange = (platform: string, field: keyof SocialMediaItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      social_media: {
        ...prev.social_media,
        [platform]: {
          ...prev.social_media[platform],
          [field]: value
        }
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 提交前驗證電話和手機格式
    const validatePhone = (value: string) => {
      if (!value) return null;
      if (!/^\+?[0-9]+$/.test(value)) {
        return '電話號碼只能包含數字，開頭可以加+號';
      }
      return null;
    };
    
    const validateMobile = (value: string) => {
      if (!value) return null;
      if (!/^\+?[0-9]+$/.test(value)) {
        return '手機號碼只能包含數字，開頭可以加+號';
      }
      return null;
    };
    
    if (formData.profile.phone) {
      const phoneError = validatePhone(formData.profile.phone);
      if (phoneError) {
        alert(`電話號碼格式錯誤：${phoneError}`);
        return;
      }
    }
    
    if (formData.profile.mobile) {
      const mobileError = validateMobile(formData.profile.mobile);
      if (mobileError) {
        alert(`手機號碼格式錯誤：${mobileError}`);
        return;
      }
    }
    
    // 驗證連結：沒有圖片的連結不能啟用滿版功能
    const invalidLinks = formData.links.filter(link => link.is_fullwidth && !link.icon_url);
    if (invalidLinks.length > 0) {
      alert('以下連結啟用了滿版功能但沒有圖片，請先上傳圖片或關閉滿版功能：\n' + 
            invalidLinks.map(link => link.title || '未命名連結').join('\n'));
      return;
    }
    
    setIsLoading(true);

    try {
      // 更新 Context 中的數據
      updateData(formData);
      
      // 保存數據 - 直接傳遞當前的 formData
      const success = await saveData(formData);
      if (success) {
        navigate('/provider/cloud-business-card');
      }
    } catch (error) {
      console.error('儲存失敗:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTabTitle = () => {
    switch (tab) {
      case 'profile': return '個人資料';
      case 'tags': return '標籤管理';
      case 'links': return '連結管理';
      case 'social': return '社群管理';
      case 'appearance': return '外觀設定';
      default: return '編輯名片';
    }
  };

  const renderProfileTab = () => {
    type BoolField = 'show_email' | 'show_phone' | 'show_mobile' | 'show_address';
    type TextField = 'email' | 'phone' | 'mobile' | 'address';

    const controls: Array<{ key: TextField; label: string; boolField: BoolField; placeholder: string; type?: string; icon: string; validation?: (value: string) => string | null }>= [
      { key: 'email', label: '電子郵件', boolField: 'show_email', placeholder: 'your@email.com', type: 'email', icon: 'ri-mail-line' },
      { 
        key: 'mobile', 
        label: '手機', 
        boolField: 'show_mobile', 
        placeholder: '0912345678', 
        type: 'tel', 
        icon: 'ri-smartphone-line',
        validation: (value: string) => {
          if (!value) return null;
          // 只允許數字和開頭的+號
          if (!/^\+?[0-9]+$/.test(value)) {
            return '手機號碼只能包含數字，開頭可以加+號';
          }
          return null;
        }
      },
      { 
        key: 'phone', 
        label: '電話', 
        boolField: 'show_phone', 
        placeholder: '0212345678', 
        type: 'tel', 
        icon: 'ri-phone-line',
        validation: (value: string) => {
          if (!value) return null;
          // 只允許數字和開頭的+號
          if (!/^\+?[0-9]+$/.test(value)) {
            return '電話號碼只能包含數字，開頭可以加+號';
          }
          return null;
        }
      },
      { key: 'address', label: '地址', boolField: 'show_address', placeholder: '您的地址', type: 'text', icon: 'ri-map-pin-line' }
    ];

    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">個人資料</h2>

        {/* 頭像上傳 */}
        <div className="flex items-center space-x-6">
          <div className="relative">
            {loading ? (
              // 載入中狀態：顯示載入動畫
              <div className="w-24 h-24 rounded-full border-4 border-gray-200 bg-gray-100 flex items-center justify-center">
                <div className={`w-8 h-8 border-2 ${AI_COLORS.border} border-t-transparent rounded-full animate-spin`}></div>
              </div>
            ) : formData.profile.profile_picture_url ? (
              // 有圖片：顯示圖片
              <img
                src={formData.profile.profile_picture_url}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
              />
            ) : (
              // 沒有圖片：顯示人像 icon
              <ImagePlaceholder
                type="avatar"
                size="xl"
                className="w-24 h-24 rounded-full border-4 border-gray-200"
                onClick={() => document.getElementById('profile-picture-input')?.click()}
              />
            )}
            <label className={`absolute bottom-0 right-0 p-2 rounded-full cursor-pointer transition-colors ${AI_COLORS.button}`}>
              <Upload size={16} />
              <input
                id="profile-picture-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const url = URL.createObjectURL(file);
                    handleProfileChange('profile_picture_url', url);
                  }
                }}
              />
            </label>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">個人頭像</h3>
            <p className="text-sm text-gray-500">建議尺寸 400x400 像素</p>
          </div>
        </div>

        {/* 姓名 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            姓名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.profile.name}
            onChange={(e) => handleProfileChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ai-500 focus:border-transparent"
            required
          />
        </div>

        {/* 連絡資訊 - 改為社群風格：Icon Grid + 單一展開卡 */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">連絡資訊</h3>
          <div className="grid grid-cols-4 gap-3 sm:gap-4">
            {controls.map(ctrl => {
              const enabled = (formData.profile as any)[ctrl.boolField] as boolean;
              const selected = activeContactKey === ctrl.key;
              return (
                <button
                  type="button"
                  key={ctrl.key}
                  onClick={() => setActiveContactKey(selected ? null : ctrl.key)}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-colors ${selected ? 'border-ai-500 bg-ai-50' : 'border-gray-200 bg-white'} ${enabled ? '' : 'opacity-50'}`}
                >
                  <div className={`w-8 h-8 flex items-center justify-center mb-2`}>
                    <i className={`${ctrl.icon} text-xl`}></i>
                  </div>
                  <span className="text-xs text-gray-700">{ctrl.label}</span>
                </button>
              );
            })}
          </div>

          {/* 展開的設定卡：與社群相同，含啟用切換與輸入框；一次只開一個 */}
          {activeContactKey && (() => {
            const ctrl = controls.find(c => c.key === activeContactKey)!;
            const enabled = (formData.profile as any)[ctrl.boolField] as boolean;
            return (
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">{ctrl.label}</h4>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => handleProfileChange(ctrl.boolField as any, e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600">顯示</span>
                  </label>
                </div>
                {enabled && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{ctrl.label}</label>
                    <input
                      type={ctrl.type || 'text'}
                      value={(formData.profile as any)[ctrl.key] as string}
                      onChange={(e) => {
                        let value = e.target.value;
                        
                        // 對於電話和手機，過濾掉非數字字符（除了開頭的+號）
                        if (ctrl.key === 'phone' || ctrl.key === 'mobile') {
                          // 保留開頭的+號
                          const hasPlus = value.startsWith('+');
                          // 移除所有非數字字符
                          const numbersOnly = value.replace(/[^0-9]/g, '');
                          // 重新組合
                          value = hasPlus ? `+${numbersOnly}` : numbersOnly;
                        }
                        
                        handleProfileChange(ctrl.key as any, value);
                      }}
                      placeholder={ctrl.placeholder}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-ai-500 focus:border-transparent ${
                        ctrl.validation && ctrl.validation((formData.profile as any)[ctrl.key] as string) 
                          ? 'border-red-300 focus:ring-red-500' 
                          : 'border-gray-300 focus:ring-ai-500'
                      }`}
                    />
                    {ctrl.validation && ctrl.validation((formData.profile as any)[ctrl.key] as string) && (
                      <p className="mt-1 text-sm text-red-500">
                        {ctrl.validation((formData.profile as any)[ctrl.key] as string)}
                      </p>
                    )}
                    {(ctrl.key === 'phone' || ctrl.key === 'mobile') && (
                      <p className="mt-1 text-sm text-gray-500">
                        提示：只能輸入數字，開頭可以加+號（如：+886912345678）
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* 個人簡介 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">個人簡介</label>
          <textarea
            value={formData.profile.bio}
            onChange={(e) => handleProfileChange('bio', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ai-500 focus:border-transparent"
            placeholder="介紹您自己..."
          />
          <p className="mt-1 text-sm text-gray-500">支援換行，使用 \n 來分隔段落</p>
        </div>
      </div>
    );
  };

  const renderTagsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">標籤管理</h2>
          <p className="text-sm text-gray-500 mt-1">拖拽標籤可以重新排列順序</p>
        </div>
        <button
          type="button"
          onClick={addTag}
          className={`flex items-center px-4 py-2 rounded-lg transition-colors ${AI_COLORS.button}`}
        >
          <Plus size={16} className="mr-2" />
          新增標籤
        </button>
      </div>

      {/* 預覽 Modal 由頁面最外層統一渲染，移除每分頁內各自渲染，避免只有標籤生效 */}
      <div className="space-y-2">
        {formData.tags.map((tag, index) => (
          <div 
            key={tag.id} 
            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-move hover:bg-gray-100 transition-colors"
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
          >
            {/* 拖拽手柄 */}
            <div className="flex items-center justify-center w-7 h-7 text-gray-400 hover:text-gray-600 shrink-0">
              <GripVertical size={14} />
            </div>

            {/* 單行內容（隱藏序號） */}
            <div className="flex-1 flex items-center gap-3 min-w-0">
              <input
                type="text"
                value={tag.text}
                onChange={(e) => handleTagChange(index, 'text', e.target.value)}
                placeholder="標籤文字"
                className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ai-500 focus:border-transparent"
              />
              <label className="flex items-center whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={tag.is_visible}
                  onChange={(e) => handleTagChange(index, 'is_visible', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-600">顯示</span>
              </label>
              <button
                type="button"
                onClick={() => removeTag(index)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                aria-label="刪除標籤"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderLinksTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">連結管理</h2>
          <p className="text-sm text-gray-500 mt-1">拖拽連結可以重新排列順序</p>
        </div>
        <button
          type="button"
          onClick={() => addLink()}
          className={`flex items-center px-4 py-2 rounded-lg transition-colors ${AI_COLORS.button}`}
        >
          <Plus size={16} className="mr-2" />
          新增連結
        </button>
      </div>

      <div className="space-y-2">
        {[...formData.links]
          .sort((a, b) => a.order - b.order)
          .map((link, index) => (
          <div 
            key={`${link.id}-${link.order}`}
            className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {/* Header row (draggable) */}
            <div
              className="flex items-center gap-3"
              draggable
              onDragStart={(e) => handleLinkDragStart(e, index)}
              onDragOver={handleLinkDragOver}
              onDrop={(e) => handleLinkDrop(e, index)}
              onDragEnd={handleLinkDragEnd}
            >
              {/* 拖拽手柄 */}
              <div className="flex items-center justify-center w-7 h-7 text-gray-400 hover:text-gray-600 shrink-0">
                <GripVertical size={14} />
              </div>

              {/* icon 預覽（可點選上傳） */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="relative">
                  {link.icon_url ? (
                    <div className="relative group">
                      <img
                        src={link.icon_url}
                        alt="Link icon"
                        className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                      />
                      {/* 懸停時顯示更換圖示的提示 */}
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload size={16} className="text-white" />
                      </div>
                    </div>
                  ) : (
                    <ImagePlaceholder
                      type="link"
                      size="md"
                      className="w-10 h-10"
                      onClick={() => document.getElementById(`link-icon-input-${index}`)?.click()}
                    />
                  )}
                  {uploadingLinkIcon && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  <input
                    id={`link-icon-input-${index}`}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const result = await uploadLinkIcon(file);
                          if (result.success && result.url) {
                            handleLinkChange(index, 'icon_url', result.url);
                          }
                        } catch (error) {
                          console.error('連結圖片上傳失敗:', error);
                        }
                      }
                    }}
                  />
                </div>
                {linkIconError && (
                  <div className="text-xs text-red-500 max-w-32">
                    {linkIconError}
                  </div>
                )}
              </div>

              {/* 將操作群靠近圖片：使用 grow 空間與小間距，使刪除留在最右 */}
              <div className="flex-1" />

              {/* 編輯切換 */}
              <button
                type="button"
                onClick={() => toggleLinkExpanded(index)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 shrink-0 order-1"
              >
                {expandedLinkIndex === index ? '收合' : '編輯'}
              </button>

              {/* 開關 */}
              <label className="flex items-center whitespace-nowrap order-2">
                <input
                  type="checkbox"
                  checked={link.is_active}
                  onChange={(e) => handleLinkChange(index, 'is_active', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-600">啟用</span>
              </label>
              <label className={`flex items-center whitespace-nowrap order-3 ${!link.icon_url ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <input
                  type="checkbox"
                  checked={link.is_fullwidth}
                  disabled={!link.icon_url}
                  onChange={(e) => {
                    if (link.icon_url) {
                      handleLinkChange(index, 'is_fullwidth', e.target.checked);
                    }
                  }}
                  className={`mr-2 ${!link.icon_url ? 'cursor-not-allowed' : ''}`}
                  title={!link.icon_url ? '需要先上傳圖片才能啟用滿版功能' : '啟用滿版顯示'}
                />
                <span className={`text-sm ${!link.icon_url ? 'text-gray-400' : 'text-gray-600'}`}>
                  <span className="inline-block w-12 text-left">
                    滿版
                    {!link.icon_url && (
                      <span className="ml-1 text-xs text-gray-400" title="需要先上傳圖片才能啟用滿版功能">
                        (無圖)
                      </span>
                    )}
                  </span>
                </span>
              </label>

              {/* 刪除 */}
              <button
                type="button"
                onClick={() => removeLink(index)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0 order-last ml-2"
                aria-label="刪除連結"
              >
                <Trash2 size={16} />
              </button>
            </div>

            {/* Expanded full-width editor */}
            {expandedLinkIndex === index && (
              <div className="mt-3 pt-3 border-t space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">連結標題</label>
                  <input
                    type="text"
                    value={link.title}
                    onChange={(e) => handleLinkChange(index, 'title', e.target.value)}
                    placeholder="連結標題"
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ai-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">連結網址</label>
                  <input
                    type="url"
                    value={link.url}
                    onChange={(e) => handleLinkChange(index, 'url', e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ai-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderSocialTab = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">社群管理</h2>

      {/* 一層目錄：Icon Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
        {Object.entries(formData.social_media)
          .filter(([platform]) => platform !== 'soundcloud')
          .map(([platform, social]) => {
          const isActive = !!social.is_active;
          const isSelected = activeSocialPlatform === platform;
          return (
            <button
              type="button"
              key={platform}
              onClick={() => setActiveSocialPlatform(isSelected ? null : platform)}
              className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-colors ${isSelected ? 'border-ai-500 bg-ai-50' : 'border-gray-200 bg-white'} ${isActive ? 'opacity-100' : 'opacity-50'}`}
            >
              <div className="w-8 h-8 flex items-center justify-center mb-2">
                <i className={`${getRemixIconClass(platform, social.style)} text-xl`}></i>
              </div>
              <span className="text-xs text-gray-700 capitalize">{platform}</span>
            </button>
          );
        })}
      </div>

      {/* 二層：設定卡片（點 icon 後展開） */}
      {activeSocialPlatform && activeSocialPlatform !== 'soundcloud' && (
        <div className="p-4 border border-gray-200 rounded-lg">
          {(() => {
            const platform = activeSocialPlatform as string;
            const social = formData.social_media[platform];
            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900 capitalize">{platform} 設定</h3>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={social.is_active}
                      onChange={(e) => handleSocialMediaChange(platform, 'is_active', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600">啟用</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">個人資料連結</label>
                  <input
                    type="url"
                    value={social.url}
                    onChange={(e) => handleSocialMediaChange(platform, 'url', e.target.value)}
                    placeholder={`${platform} 網址`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ai-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">圖標樣式</label>
                  <div className="flex items-center space-x-6">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name={`social-${platform}-style`}
                        value="fill"
                        checked={social.style === 'fill'}
                        onChange={() => handleSocialMediaChange(platform, 'style', 'fill')}
                        className="mr-2"
                      />
                      <span>填充</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name={`social-${platform}-style`}
                        value="outline"
                        checked={social.style === 'outline'}
                        onChange={() => handleSocialMediaChange(platform, 'style', 'outline')}
                        className="mr-2"
                      />
                      <span>線條</span>
                    </label>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );

  const renderAppearanceTab = () => {
    const sections: Array<{
      key: string;
      title: string;
      left: { label: string; field: keyof Profile };
      right: { label: string; field: keyof Profile };
    }> = [
      { key: 'background', title: '背景', left: { label: '背景顏色', field: 'bg_color' }, right: { label: '文字顏色', field: 'text_color' } },
      { key: 'link', title: '連結', left: { label: '按鈕顏色', field: 'button_color' }, right: { label: '按鈕文字顏色', field: 'button_text_color' } },
      { key: 'tag', title: '標籤', left: { label: '背景顏色', field: 'ctag_bg_color' }, right: { label: '文字顏色', field: 'ctag_text_color' } },
      { key: 'contact', title: '聯繫', left: { label: '圖示背景顏色', field: 'contact_bg_color' }, right: { label: '圖示顏色', field: 'contact_icon_color' } },
      { key: 'other', title: '其他', left: { label: '社群顏色', field: 'social_icon_color' }, right: { label: '背景顏色', field: 'page_bg_color' } }
    ];

    const profileObj = formData.profile;

    const renderColorSwatch = (color: string) => (
      <div className="w-6 h-6 rounded-md border border-gray-200" style={{ backgroundColor: color }} />
    );

    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">外觀設定</h2>

        {/* 第一層：卡片按鈕 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {sections.map(sec => {
            const isSelected = activeAppearanceSection === sec.key;
            return (
              <button
                key={sec.key}
                type="button"
                onClick={() => setActiveAppearanceSection(isSelected ? null : sec.key)}
                className={`p-4 rounded-xl border transition-colors text-left ${isSelected ? 'border-ai-500 bg-ai-50' : 'border-gray-200 bg-white'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{sec.title}</span>
                  <div className="flex items-center gap-2">
                    {renderColorSwatch(String(profileObj[sec.left.field]))}
                    {renderColorSwatch(String(profileObj[sec.right.field]))}
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">{sec.left.label} / {sec.right.label}</div>
              </button>
            );
          })}
        </div>

        {/* 第二層：被點擊的卡片內容 */}
        {activeAppearanceSection && (
          (() => {
            const sec = sections.find(s => s.key === activeAppearanceSection)!;
            return (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="font-medium text-gray-900 mb-4">{sec.title} 設定</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 左側 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{sec.left.label}</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={String(profileObj[sec.left.field])}
                        onChange={(e) => handleProfileChange(sec.left.field as any, e.target.value)}
                        className="w-12 h-10 border border-gray-300 rounded-lg"
                      />
                      <input
                        type="text"
                        value={String(profileObj[sec.left.field])}
                        onChange={(e) => handleProfileChange(sec.left.field as any, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ai-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  {/* 右側 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{sec.right.label}</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={String(profileObj[sec.right.field])}
                        onChange={(e) => handleProfileChange(sec.right.field as any, e.target.value)}
                        className="w-12 h-10 border border-gray-300 rounded-lg"
                      />
                      <input
                        type="text"
                        value={String(profileObj[sec.right.field])}
                        onChange={(e) => handleProfileChange(sec.right.field as any, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ai-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })()
        )}
      </div>
    );
  };

  const renderCurrentTab = () => {
    switch (tab) {
      case 'profile': return renderProfileTab();
      case 'tags': return renderTagsTab();
      case 'links': return renderLinksTab();
      case 'social': return renderSocialTab();
      case 'appearance': return renderAppearanceTab();
      default: return renderProfileTab();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/provider/cloud-business-card')}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft size={20} className="mr-2" />
                返回
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{getTabTitle()}</h1>
                <p className="text-gray-600">編輯您的雲端名片設定</p>
              </div>
            </div>
            {/* 保持原本留白，不影響版型：新增預覽按鈕 */}
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              預覽
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-center py-12">
              <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${AI_COLORS.border} mr-3`}></div>
              <span className="text-gray-600">載入中...</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              {renderCurrentTab()}
            </div>

          {/* 操作按鈕 */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/provider/cloud-business-card')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`flex items-center px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${AI_COLORS.button}`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  儲存中...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  儲存設定
                </>
              )}
            </button>
          </div>
        </form>
        )}
      </div>

      {/* 全域預覽 Modal（共用元件） */}
      {showPreview && (
               <PreviewOverlay
         open={showPreview}
         onClose={() => setShowPreview(false)}
         data={{
           profile: formData.profile as any,
           tags: formData.tags as any,
           links: formData.links as any,
           social_media: formData.social_media as any
         } as PreviewCardData}
         slug={formData.profile?.slug} // 傳遞 slug 以獲取完整數據
         zIndex={1000}
       />
      )}

      {/* 先前的內建預覽已移除，統一導向雲端名片預覽 */}
    </div>
  );
};

export default BusinessCardEditForm; 