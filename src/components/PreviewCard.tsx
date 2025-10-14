import React, { useState } from 'react';
import ImagePlaceholder from './ImagePlaceholder';

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

interface LinkItem {
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
  style: string; // 'outline' | 'fill'
}

interface SocialMedia {
  [key: string]: SocialMediaItem;
}

export interface PreviewCardData {
  profile: Profile | null;
  tags: Tag[];
  links: LinkItem[];
  social_media: SocialMedia;
  share_pp?: string; // 新增：後端提供的 LINE 分享連結
}

interface Props {
  data: PreviewCardData;
  onShare?: () => void;
}

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
    spotify: 'spotify'
  };
  const base = baseMap[platform] || 'link';
  const variant = style === 'outline' ? 'line' : 'fill';
  return `ri-${base}-${variant}`;
};

const buildContactList = (profile: Profile | null) => {
  const contacts: Array<{ type: string; value: string; icon: string }> = [];
  if (!profile) return contacts;
  if (profile.show_email && profile.email) contacts.push({ type: 'email', value: `mailto:${profile.email}`, icon: 'ri-mail-line' });
  if (profile.show_mobile && profile.mobile) contacts.push({ type: 'mobile', value: `tel:${profile.mobile}`, icon: 'ri-smartphone-line' });
  if (profile.show_phone && profile.phone) contacts.push({ type: 'phone', value: `tel:${profile.phone}`, icon: 'ri-phone-line' });
  if (profile.show_address && profile.address) contacts.push({ type: 'address', value: `https://maps.google.com/?q=${encodeURIComponent(profile.address)}`, icon: 'ri-map-pin-line' });
  return contacts;
};

export const PreviewCard: React.FC<Props> = ({ data, onShare }) => {
  const { profile, tags, links, social_media } = data;

  if (!profile) return null;

  const contacts = buildContactList(profile);

  return (
    <div className="flex flex-row gap-6 items-start justify-center w-full mx-auto relative" style={{ width: 340 }}>
      {/* 左側聯絡 icon 欄 */}
      <div
        className="flex flex-col gap-2 pt-8 pb-4 px-2"
        style={{ position: 'absolute', left: '8px', top: '-12px', zIndex: 2 }}
      >
        {contacts.map((contact, index) => (
          <a
            key={index}
            href={contact.value}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full w-9 h-9 flex items-center justify-center transition-colors border border-white/10"
            style={{ backgroundColor: profile.contact_bg_color || '#e5e7eb', color: profile.contact_icon_color || '#6b7280' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = profile.button_color || '#6366f1';
              (e.currentTarget as HTMLElement).style.color = profile.button_text_color || '#ffffff';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = profile.contact_bg_color || '#e5e7eb';
              (e.currentTarget as HTMLElement).style.color = profile.contact_icon_color || '#6b7280';
            }}
            title={contact.type}
          >
            <i className={`${contact.icon} text-lg`}></i>
          </a>
        ))}
      </div>

      {/* 右側分享按鈕 */}
      {onShare && (
        <div
          className="flex flex-col gap-2 pt-8 pb-4 px-2"
          style={{ position: 'absolute', right: '8px', top: '-12px', zIndex: 2 }}
        >
          <button
            onClick={onShare}
            className="rounded-full w-9 h-9 flex items-center justify-center transition-colors border border-white/10 cursor-pointer"
            style={{ backgroundColor: profile.contact_bg_color || '#e5e7eb', color: profile.contact_icon_color || '#6b7280' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = profile.button_color || '#6366f1';
              (e.currentTarget as HTMLElement).style.color = profile.button_text_color || '#ffffff';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = profile.contact_bg_color || '#e5e7eb';
              (e.currentTarget as HTMLElement).style.color = profile.contact_icon_color || '#6b7280';
            }}
            title="分享"
          >
            <i className="ri-share-line text-lg"></i>
          </button>
        </div>
      )}

      {/* 主體內容 */}
      <div
        className="flex-1 flex flex-col items-center px-4 py-8"
        style={{ backgroundColor: profile.bg_color || '#ffffff', borderRadius: '16px' }}
      >
        {profile.profile_picture_url ? (
          <img src={profile.profile_picture_url} alt={profile.name} className="w-32 h-32 rounded-full object-cover shadow-lg mb-3" />
        ) : (
          <ImagePlaceholder
            type="avatar"
            size="xl"
            className="w-32 h-32 rounded-full shadow-lg mb-3"
            preview={true}
            iconColor={profile.text_color || '#111827'}
          />
        )}

        <h1 className="text-xl font-bold mb-2 text-center" style={{ color: profile.text_color || '#111827' }}>
          {profile.name}
        </h1>

        <div className="flex flex-wrap gap-1 mb-2 justify-center">
          {tags.filter(t => t.is_visible).slice(0, 3).map(tag => (
            <span key={tag.id} className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: profile.ctag_bg_color || '#e5e7eb', color: profile.ctag_text_color || '#374151' }}>
              #{tag.text}
            </span>
          ))}
        </div>

        <div className="text-center text-xs leading-relaxed mb-3" style={{ color: profile.text_color || '#6b7280' }}>
          {(profile.bio || '')
            .replace(/\\n/g, '\n')  // 處理字面量的 \n 字符串
            .split('\n')
            .map((line, i) => (
              <div key={i}>{line || <>&nbsp;</>}</div>
            ))}
        </div>

        {links.length > 0 && (
          <div className="grid grid-cols-2 gap-2 w-full mb-3">
            {links
              .filter(l => l.is_active)
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map(link => (
                link.is_fullwidth ? (
                  <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="relative col-span-2 block">
                    {link.icon_url ? (
                      <img src={link.icon_url} alt={link.title} className="w-full h-auto rounded-lg block" />
                    ) : (
                      <ImagePlaceholder
                        type="link"
                        size="xl"
                        className="w-full h-auto rounded-lg block"
                        preview={true}
                        iconColor="#ffffff"
                      />
                    )}
                    {link.title && (
                      <div className="absolute left-0 right-0 bottom-0 px-2 py-3 text-sm font-semibold text-center" style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', borderBottomLeftRadius: '0.5rem', borderBottomRightRadius: '0.5rem', height: '44px', width: '100%' }}>
                        {link.title}
                      </div>
                    )}
                  </a>
                ) : (
                  <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="col-span-2 w-full rounded-xl bg-black flex items-center px-3 py-2 mb-3 block" style={{ background: profile.button_color || '#6366f1', fontSize: 16 }}>
                    {link.icon_url ? (
                      <img src={link.icon_url} alt={link.title} className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <ImagePlaceholder
                        type="link"
                        size="md"
                        className="w-10 h-10"
                        preview={true}
                        iconColor={profile.button_text_color || '#6b7280'}
                      />
                    )}
                    <div className="flex-1 text-center text-white text-base font-semibold" style={{ color: profile.button_text_color || '#6b7280', fontSize: 14 }}>
                      {link.title}
                    </div>
                    <div style={{ width: '40px', height: '40px' }} />
                  </a>
                )
              ))}
          </div>
        )}

        <div className="flex justify-center gap-0 w-full">
          {Object.entries(social_media)
            .filter(([, social]) => social.is_active)
            .map(([platform, social]) => (
              <a
                key={platform}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 flex items-center justify-center transition-colors"
                style={{ color: profile.social_icon_color || '#6b7280', background: 'none', fontSize: 22 }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = profile.button_color || '#6366f1'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = profile.social_icon_color || '#6b7280'; }}
                title={platform}
              >
                <i className={`${getSocialIcon(platform, social.style)}`}></i>
              </a>
            ))}
        </div>
      </div>
    </div>
  );
};

export default PreviewCard;

