import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { api, API_ENDPOINTS } from '../config/api';
import { useToast } from '../hooks/useToast';
import { blobUrlToFile } from '../services/fileUpload';

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
  view_web_count?: number;
  share_line_count?: number;
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

interface BusinessCardData {
  profile: Profile;
  tags: Tag[];
  links: Link[];
  social_media: SocialMedia;
  share_pp?: string;
}

interface BusinessCardContextType {
  data: BusinessCardData | null;
  loading: boolean;
  error: string | null;
  loadData: (force?: boolean) => Promise<void>;
  updateData: (newData: BusinessCardData) => void;
  saveData: (dataToSave?: BusinessCardData) => Promise<boolean>;
  saveLink: (link: Link) => Promise<boolean>;
  deleteLink: (linkId: number) => Promise<boolean>;
}

const BusinessCardContext = createContext<BusinessCardContextType | undefined>(undefined);

export const useBusinessCard = () => {
  const context = useContext(BusinessCardContext);
  if (context === undefined) {
    throw new Error('useBusinessCard must be used within a BusinessCardProvider');
  }
  return context;
};

interface BusinessCardProviderProps {
  children: ReactNode;
}

export const BusinessCardProvider: React.FC<BusinessCardProviderProps> = ({ children }) => {
  const [data, setData] = useState<BusinessCardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showError, showSuccess } = useToast();
  
  // 使用 useRef 来跟踪是否已经加载过数据
  const hasLoadedRef = useRef(false);
  const isLoadingRef = useRef(false);
  
  // 使用 useRef 来缓存 toast 函数
  const toastRef = useRef({ showError, showSuccess });
  
  // 当 toast 函数更新时，同步更新 ref
  useEffect(() => {
    toastRef.current = { showError, showSuccess };
  }, [showError, showSuccess]);

  const loadData = useCallback(async (force: boolean = false) => {
    // 防止重复调用
    if (isLoadingRef.current) {
      console.log('🚫 已有API请求正在进行中，跳过重复调用');
      return;
    }
    
    // 如果已经有数据且不是强制刷新，则跳过
    if (hasLoadedRef.current && data && !force) {
      console.log('✅ 已有數據，跳過API調用');
      return;
    }

    console.log('🚀 開始載入名片資料...', { 
      force, 
      hasLoaded: hasLoadedRef.current, 
      hasData: !!data,
      timestamp: new Date().toISOString(),
      stack: new Error().stack?.split('\n').slice(1, 4).join('\n') // 记录调用栈
    });
    
    isLoadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const response = await api.get(API_ENDPOINTS.BUSINESS_CARD);
      console.log('✅ API 調用成功');
      
      if (response.data.success) {
        const apiData = response.data.data;
        const defaultSocial: SocialMedia = {
          facebook: { platform: 'facebook', url: '', is_active: false, style: 'fill' },
          instagram: { platform: 'instagram', url: '', is_active: false, style: 'fill' },
          twitter: { platform: 'twitter', url: '', is_active: false, style: 'fill' },
          linkedin: { platform: 'linkedin', url: '', is_active: false, style: 'fill' },
          youtube: { platform: 'youtube', url: '', is_active: false, style: 'fill' },
          github: { platform: 'github', url: '', is_active: false, style: 'fill' },
          tiktok: { platform: 'tiktok', url: '', is_active: false, style: 'fill' },
          spotify: { platform: 'spotify', url: '', is_active: false, style: 'fill' }
        };
        const { soundcloud, ...restServerSocial } = apiData.social_media || {};
        const mergedSocial: SocialMedia = { ...defaultSocial, ...restServerSocial };
        
        const businessCardData: BusinessCardData = {
          profile: apiData.profile,
          tags: apiData.tags || [],
          links: apiData.links || [],
          social_media: mergedSocial,
          share_pp: apiData.share_pp
        };
        
        setData(businessCardData);
        hasLoadedRef.current = true;
        console.log('✅ 數據設置完成，標記為已加載');
      } else {
        setError('載入名片資料失敗');
        toastRef.current.showError('載入名片資料失敗');
      }
    } catch (error) {
      console.error('❌ 載入名片資料失敗:', error);
      setError('載入名片資料失敗');
      toastRef.current.showError('載入名片資料失敗');
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
      console.log('🏁 載入完成，重置加載狀態');
    }
  }, []); // 无依赖项

  const updateData = useCallback((newData: BusinessCardData) => {
    setData(newData);
  }, []);

  const saveData = useCallback(async (dataToSave?: BusinessCardData): Promise<boolean> => {
    const dataToUse = dataToSave || data;
    if (!dataToUse) return false;

    setLoading(true);
    try {
      // 保持原始 ID，只重新排序 order
      const orderedLinks = [...dataToUse.links]
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((link, index) => ({ ...link, order: index + 1 }));
      
      const formData = new FormData();
      
      // 個人資料
      formData.append('username', dataToUse.profile.name || '');
      formData.append('bio', dataToUse.profile.bio || '');
      formData.append('email', dataToUse.profile.email || '');
      formData.append('phone', dataToUse.profile.phone || '');
      formData.append('mobile', dataToUse.profile.mobile || '');
      formData.append('address', dataToUse.profile.address || '');
      
      // 顯示設定
      if (dataToUse.profile.show_email) formData.append('show_email', 'on');
      if (dataToUse.profile.show_phone) formData.append('show_phone', 'on');
      if (dataToUse.profile.show_mobile) formData.append('show_mobile', 'on');
      if (dataToUse.profile.show_address) formData.append('show_address', 'on');
      
      // 外觀設定
      formData.append('bg_color', dataToUse.profile.bg_color || '');
      formData.append('text_color', dataToUse.profile.text_color || '');
      formData.append('button_color', dataToUse.profile.button_color || '');
      formData.append('button_text_color', dataToUse.profile.button_text_color || '');
      formData.append('ctag_bg_color', dataToUse.profile.ctag_bg_color || '');
      formData.append('ctag_text_color', dataToUse.profile.ctag_text_color || '');
      formData.append('contact_bg_color', dataToUse.profile.contact_bg_color || '');
      formData.append('contact_icon_color', dataToUse.profile.contact_icon_color || '');
      formData.append('social_icon_color', dataToUse.profile.social_icon_color || '');
      formData.append('page_bg_color', dataToUse.profile.page_bg_color || '');
      formData.append('social-position', dataToUse.profile.social_position || '');
      formData.append('social-size', dataToUse.profile.social_size || '');
      
      // 標籤 - 使用流水號，處理現有和新增的標籤
      dataToUse.tags.forEach((tag, index) => {
        const sequenceNumber = index + 1;  // 流水號：1, 2, 3...
        
        if (tag.id !== 0) {
          // 現有標籤 - 傳遞數據庫 ID
          formData.append(`tag-${sequenceNumber}-id`, tag.id.toString());
        } else {
          // 新增標籤 - 傳遞空字串或特殊標識
          formData.append(`tag-${sequenceNumber}-id`, '');
        }
        
        // 所有標籤都傳遞這些欄位
        formData.append(`tag-${sequenceNumber}-text`, tag.text || '');
        formData.append(`tag-${sequenceNumber}-order`, (tag.order || sequenceNumber).toString());
        if (tag.is_visible) {
          formData.append(`tag-${sequenceNumber}-visible`, 'on');
        }
      });
      
      // 連結 - 傳遞正確的數據庫 ID，包括新增的連結
      orderedLinks.forEach((link, index) => {
        if (link.id !== 0) {
          // 現有連結 - 傳遞數據庫 ID
          formData.append(`link-${link.id}-id`, link.id.toString());
          formData.append(`link-${link.id}-title`, link.title || '');
          formData.append(`link-${link.id}-url`, link.url || '');
          formData.append(`link-${link.id}-order`, (link.order || index + 1).toString());
          if (link.is_active) formData.append(`link-${link.id}-is_active`, 'on');
          if (link.is_fullwidth) formData.append(`link-${link.id}-is_fullwidth`, 'on');
          formData.append(`link-${link.id}-icon`, link.icon_url || '');
        } else {
          // 新增連結 - 使用臨時 ID 或特殊標識
          const tempId = `new_${index}`;
          formData.append(`link-${tempId}-id`, '');
          formData.append(`link-${tempId}-title`, link.title || '');
          formData.append(`link-${tempId}-url`, link.url || '');
          formData.append(`link-${tempId}-order`, (link.order || index + 1).toString());
          if (link.is_active) formData.append(`link-${tempId}-is_active`, 'on');
          if (link.is_fullwidth) formData.append(`link-${tempId}-is_fullwidth`, 'on');
          formData.append(`link-${tempId}-icon`, link.icon_url || '');
        }
      });
      
      // 社群媒體
      Object.entries(dataToUse.social_media).forEach(([platform, social]) => {
        if (social.url) {
          formData.append(`social-${platform}-url`, social.url);
          if (social.is_active) formData.append(`social-${platform}-active`, 'on');
          formData.append(`social-${platform}-style`, social.style || 'fill');
        }
      });

      // 處理封面圖片檔案上傳 - 使用統一模組
      if (dataToUse.profile.profile_picture_url && dataToUse.profile.profile_picture_url.startsWith('blob:')) {
        try {
          const result = await blobUrlToFile(
            dataToUse.profile.profile_picture_url, 
            'profile_picture.jpg', 
            'image/jpeg'
          );
          
          if (result.success && result.file) {
            formData.append('profile_picture', result.file);
          } else {
            console.error('封面圖片檔案處理失敗:', result.error);
          }
        } catch (error) {
          console.error('封面圖片檔案處理失敗:', error);
        }
      }

      // 處理連結圖片檔案上傳 - 使用統一模組
      for (let i = 0; i < orderedLinks.length; i++) {
        const link = orderedLinks[i];
        if (link.icon_url && link.icon_url.startsWith('blob:')) {
          try {
            const result = await blobUrlToFile(
              link.icon_url,
              `link_icon_${i + 1}.jpg`,
              'image/jpeg'
            );
            
            if (result.success && result.file) {
              // 根據連結類型決定 FormData 的 key
              if (link.id !== 0) {
                // 現有連結
                formData.append(`link-${link.id}-icon`, result.file);
              } else {
                // 新增連結
                const tempId = `new_${i}`;
                formData.append(`link-${tempId}-icon`, result.file);
              }
            } else {
              console.error(`連結 ${i + 1} 圖片檔案處理失敗:`, result.error);
            }
          } catch (error) {
            console.error(`連結 ${i + 1} 圖片檔案處理失敗:`, error);
          }
        }
      }

      const response = await api.post(API_ENDPOINTS.SAVE_BUSINESS_CARD, formData);
      if (response.data.status === 'success') {
        toastRef.current.showSuccess('名片資料儲存成功');
        // 重新載入數據以獲取最新的連結列表
        await loadData(true);
        return true;
      } else {
        toastRef.current.showError(response.data.message || '儲存失敗');
        return false;
      }
    } catch (error) {
      console.error('儲存失敗:', error);
      toastRef.current.showError('儲存失敗，請稍後再試');
      return false;
    } finally {
      setLoading(false);
    }
  }, [data, loadData]);

  const saveLink = useCallback(async (link: Link): Promise<boolean> => {
    try {
      const jsonData: any = {
        title: link.title || '',
        url: link.url || '',
        order: link.order || 0,
        is_active: link.is_active || false,
        is_fullwidth: link.is_fullwidth || false,
        icon_url: link.icon_url || ''
      };
      
      if (link.id !== 0) {
        jsonData.id = link.id;
      }
      
      const response = await api.post(API_ENDPOINTS.SAVE_LINK, jsonData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (response.data.status === 'success') {
        return true;
      } else {
        console.error('連結儲存失敗:', response.data.message || '未知錯誤');
        return false;
      }
    } catch (error) {
      console.error('連結儲存失敗:', error);
      return false;
    }
  }, []);

  const deleteLink = useCallback(async (linkId: number): Promise<boolean> => {
    try {
      const response = await api.post(API_ENDPOINTS.DELETE_LINK(linkId));
      if (response.data.status === 'success') {
        return true;
      } else {
        console.error('連結刪除失敗:', response.data.message || '未知錯誤');
        return false;
      }
    } catch (error) {
      console.error('連結刪除失敗:', error);
      return false;
    }
  }, []);

  const value: BusinessCardContextType = {
    data,
    loading,
    error,
    loadData,
    updateData,
    saveData,
    saveLink,
    deleteLink
  };

  return (
    <BusinessCardContext.Provider value={value}>
      {children}
    </BusinessCardContext.Provider>
  );
}; 