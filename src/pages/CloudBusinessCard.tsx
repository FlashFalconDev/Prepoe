import React, { useState, useEffect, useRef } from 'react';
import { User, FolderOpen, Link2, Users, Palette, Plus, Edit3, Share2, Tag } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useBusinessCard } from '../contexts/BusinessCardContext';
import PreviewCard, { PreviewCardData } from '../components/PreviewCard';
import PreviewOverlay from '../components/PreviewOverlay';
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

const CloudBusinessCard: React.FC = () => {
  const navigate = useNavigate();
  const { data, loading, loadData } = useBusinessCard();
  const location = useLocation();
  const [showCardPreview, setShowCardPreview] = useState(false);
  const previewContentRef = useRef<HTMLDivElement | null>(null);
  const [previewScale, setPreviewScale] = useState(1);
  const [scaledSize, setScaledSize] = useState<{ width: number; height: number }>({ width: 340, height: 0 });
  const [cardGapX, setCardGapX] = useState(24); // 額外的左右留白（加在卡片背景）

  useEffect(() => {
    // 載入數據 - 只有在没有数据时才调用
    if (!data) {
      console.log('☁️ CloudBusinessCard: 没有数据，调用 loadData');
      loadData();
    } else {
      console.log('☁️ CloudBusinessCard: 已有数据，跳过 loadData');
    }
  }, [loadData, data]);

  // 若從編輯頁帶 state.openPreview=true，進頁後自動打開預覽
  useEffect(() => {
    if ((location.state as any)?.openPreview) {
      setShowCardPreview(true);
      // 清一次 state，避免回退又自動開
      history.replaceState({}, document.title);
    }
  }, [location.state]);

  const profile = data?.profile || null;
  const tags = (data?.tags || []).filter((t: Tag) => t.is_visible);
  const links = (data?.links || [])
    .filter((l: Link) => l.is_active)
    .sort((a: Link, b: Link) => (a.order || 0) - (b.order || 0));
  const socialMedia = data?.social_media || {};

  // 根據內容等比縮放預覽，確保一目了然
  useEffect(() => {
    const BASE_WIDTH = 340; // 內部卡片預設內容寬度（與樣式保持一致）
    const recalc = () => {
      if (!showCardPreview) return setPreviewScale(1);
      const padY = 48; // 與 py-12 對齊
      const padX = 80; // 與 px-20 對齊，確保左右留白
      const maxHeight = window.innerHeight - padY * 2;
      const maxWidth = Math.min(window.innerWidth - padX * 2, BASE_WIDTH);

      const el = previewContentRef.current;
      if (!el) return setPreviewScale(1);

      // 使用 scrollHeight 取得未縮放的自然高度
      const naturalHeight = el.scrollHeight || el.getBoundingClientRect().height || 0;
      const scaleH = naturalHeight > 0 ? maxHeight / naturalHeight : 1;
      const scaleW = maxWidth / BASE_WIDTH;
      const next = Math.min(scaleH, scaleW, 1);
      setPreviewScale(next);
      setScaledSize({ width: Math.round(BASE_WIDTH * next), height: Math.round(naturalHeight * next) });
      // 動態卡片內部左右留白：視窗寬度 4%，介於 20~48px
      const gap = Math.max(20, Math.min(48, Math.round(window.innerWidth * 0.04)));
      setCardGapX(gap);
    };

    recalc();
    window.addEventListener('resize', recalc);
    return () => window.removeEventListener('resize', recalc);
  }, [showCardPreview, tags, links, socialMedia]);

  // 聯絡資訊列表（順序：信箱 → 行動電話 → 電話 → 地址；樣式採用 line）
  const getContactList = () => {
    const contacts = [] as Array<{ type: string; value: string; icon: string }>;
    if (profile?.show_email && profile.email) {
      contacts.push({ type: 'email', value: `mailto:${profile.email}`, icon: 'ri-mail-line' });
    }
    if (profile?.show_mobile && profile.mobile) {
      contacts.push({ type: 'mobile', value: `tel:${profile.mobile}`, icon: 'ri-smartphone-line' });
    }
    if (profile?.show_phone && profile.phone) {
      contacts.push({ type: 'phone', value: `tel:${profile.phone}`, icon: 'ri-phone-line' });
    }
    if (profile?.show_address && profile.address) {
      contacts.push({ type: 'address', value: `https://maps.google.com/?q=${encodeURIComponent(profile.address)}`, icon: 'ri-map-pin-line' });
    }
    return contacts;
  };

  // 社群媒體 icon 對應
  const getSocialIcon = (platform: string, style: string) => {
    const baseMap: { [key: string]: string } = {
      line: 'line',
      facebook: 'facebook',
      instagram: 'instagram',
      twitter: 'twitter',
      linkedin: 'linkedin',
      youtube: 'youtube',
      github: 'github',
      tiktok: 'tiktok',
      telegram: 'telegram',
      threads: 'threads',
      spotify: 'spotify',
    };
    const base = baseMap[platform] || 'link';
    const variant = style === 'outline' ? 'line' : 'fill';
    return `ri-${base}-${variant}`;
  };

  const quickActions = [
    { id: '1', title: '個人資料', icon: User, color: `${AI_COLORS.bg} ${AI_COLORS.text}`, action: () => navigate('/provider/business-card/edit/profile') },
    { id: '2', title: '標籤管理', icon: Tag, color: 'bg-cyan-100 text-cyan-600', action: () => navigate('/provider/business-card/edit/tags') },
    { id: '3', title: '連結管理', icon: Link2, color: 'bg-emerald-100 text-emerald-600', action: () => navigate('/provider/business-card/edit/links') },
    { id: '4', title: '社群管理', icon: Users, color: 'bg-amber-100 text-amber-600', action: () => navigate('/provider/business-card/edit/social') },
    { id: '5', title: '外觀設定', icon: Palette, color: 'bg-red-100 text-red-600', action: () => navigate('/provider/business-card/edit/appearance') },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* 移除 Header，直接顯示功能區域 */}
        
        {/* Business Card Preview */}
        <div className="mb-8 flex justify-center">
          <div className="bg-white rounded-2xl p-6 shadow-lg max-w-md w-full">
            <div className="flex flex-col items-center text-center space-y-4">
              {/* 頭像 */}
              {loading ? (
                // 載入中狀態：顯示載入動畫
                <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
                  <div className={`w-8 h-8 border-2 ${AI_COLORS.border} border-t-transparent rounded-full animate-spin`}></div>
                </div>
              ) : profile?.profile_picture_url ? (
                <img 
                  src={profile.profile_picture_url} 
                  alt={profile.name || ''}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                // 沒有圖片：顯示人像 icon
                <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
                  <User size={48} className="text-gray-400" />
                </div>
              )}
              {/* 名字 */}
              <h2 className="text-2xl font-bold text-gray-900">{profile?.name}</h2>
              {/* 預覽名片按鈕 */}
              <button
                className={`px-6 py-3 ${AI_COLORS.button} rounded-xl font-semibold transition-colors`}
                onClick={() => setShowCardPreview(true)}
                disabled={!profile}
              >
                預覽名片
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">名片編輯</h2>
          <div className="grid grid-cols-5 gap-2 md:gap-4">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={action.action}
                className="bg-white rounded-xl p-2 md:p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center"
              >
                <div className={`w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center mb-2 md:mb-3 ${action.color}`}>
                  <action.icon size={16} className="md:w-6 md:h-6" />
                </div>
                <span className="text-xs md:text-sm font-medium text-gray-700">{action.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Usage Statistics */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">使用統計</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <div className={`text-2xl font-bold ${AI_COLORS.text} mb-1`}>{profile?.view_web_count?.toLocaleString() || '0'}</div>
              <div className="text-sm text-gray-600">網頁瀏覽</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">{profile?.share_line_count?.toLocaleString() || '0'}</div>
              <div className="text-sm text-gray-600">LINE轉發</div>
            </div>
          </div>
        </div>

        {/* 名片預覽 Modal（統一共用元件） */}
        {showCardPreview && profile && (
                 <PreviewOverlay
         open={showCardPreview}
         onClose={() => setShowCardPreview(false)}
         data={{ profile, tags, links, social_media: socialMedia } as PreviewCardData}
         slug={profile?.slug} // 傳遞 slug 以獲取完整數據
         zIndex={50}
       />
        )}
      </div>
    </div>
  );
};

export default CloudBusinessCard;