import React, { useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Share2, UserPlus, Film, FileText, Calendar, Clock, User, Eye, Heart } from 'lucide-react';
import { AI_COLORS } from '../../constants/colors';
import { useBusinessCardData } from '../../hooks/useBusinessCardData';
import { getArticlesAll, type Article, getEventSkuList } from '../../config/api';
import ShareModal from '../../components/ShareModal';

const tabs = [
  { key: 'about', label: '關於導師' },
  { key: 'media', label: '影音文章' },
  { key: 'events', label: '課程活動' },
  { key: 'booking', label: '預約個案' },
] as const;

const MentorDetail: React.FC = () => {
  const { state } = useLocation();
  const { slug } = useParams();
  const [active, setActive] = React.useState<(typeof tabs)[number]['key']>('about');
  const [mediaArticles, setMediaArticles] = React.useState<Article[]>([]);
  const [mediaLoading, setMediaLoading] = React.useState(false);
  const [mediaError, setMediaError] = React.useState<string | null>(null);
  const [eventItems, setEventItems] = React.useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = React.useState(false);
  const [eventsError, setEventsError] = React.useState<string | null>(null);
  const [showShare, setShowShare] = React.useState(false);

  const card = state?.businessCard;
  const { data: fetchedCard, loading, error } = useBusinessCardData(slug);

  const profile = useMemo(() => {
    if (card) {
      return {
        avatar: card.data?.profile?.profile_picture_url || '',
        name: card.data?.profile?.name || '導師',
        bio: card.data?.profile?.bio || '',
        tags: card.data?.tags || [],
      };
    }
    if (fetchedCard) {
      return {
        avatar: (fetchedCard as any).profile?.profile_picture_url || '',
        name: (fetchedCard as any).profile?.name || '導師',
        bio: (fetchedCard as any).profile?.bio || '',
        tags: (fetchedCard as any).tags || [],
      };
    }
    return { avatar: '', name: '導師', bio: '', tags: [] as any[] };
  }, [card, fetchedCard]);

  // 影音文章 API 請求
  const fetchMedia = React.useCallback(async () => {
    if (!slug) return;
    try {
      setMediaLoading(true);
      setMediaError(null);
      const res = await getArticlesAll(1, 12, slug);
      if (res.success) {
        setMediaArticles(res.data.articles || []);
      } else {
        setMediaError('載入文章失敗');
      }
    } catch (e) {
      setMediaError('載入文章時發生錯誤');
    } finally {
      setMediaLoading(false);
    }
  }, [slug]);

  // 載入此導師的課程活動
  const fetchEvents = React.useCallback(async () => {
    if (!slug) return;
    try {
      setEventsLoading(true);
      setEventsError(null);
      const res = await getEventSkuList(1, 12, slug);
      if (res.success) {
        const items = (res.data as any).events || [];
        const filtered = providerSlugFilter(items, slug);
        setEventItems(filtered);
      } else {
        setEventsError('載入活動失敗');
      }
    } catch (e) {
      setEventsError('載入活動時發生錯誤');
    } finally {
      setEventsLoading(false);
    }
  }, [slug]);

  // 點擊分頁時即刻發出請求，並顯示 Loading
  const handleTabClick = (key: (typeof tabs)[number]['key']) => {
    setActive(key);
    if (key === 'media') fetchMedia();
    if (key === 'events') fetchEvents();
  };

  function providerSlugFilter(items: any[], slug: string) {
    try {
      if (!Array.isArray(items)) return [];
      return items.filter((ev: any) => {
        if (!slug) return true;
        if (ev.provider_slug && typeof ev.provider_slug === 'string') return ev.provider_slug === slug;
        if (ev.provider && typeof ev.provider === 'string') return ev.provider.includes(slug);
        if (ev.provider_name && typeof ev.provider_name === 'string') return ev.provider_name.includes(slug);
        return true; // 無法判斷就先保留
      });
    } catch {
      return items || [];
    }
  }

  // 全頁載入狀態（僅在沒有帶 state 時才顯示全頁遮罩）
  if (!card && loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className={`animate-spin rounded-full h-10 w-10 border-b-2 ${AI_COLORS.border} mx-auto mb-3`}></div>
          <div className="text-gray-600">載入中...</div>
        </div>
      </div>
    );
  }

  // 錯誤或找不到資料
  if (!card && !loading && !fetchedCard) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-2">⚠️</div>
          <div className="text-gray-700 font-medium">找不到導師資料</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6">
          <div className="flex gap-4 items-start sm:items-center">
            <img src={profile.avatar} alt={profile.name} className="w-20 h-20 sm:w-28 sm:h-28 rounded-full object-cover" />
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{profile.name}</h1>
              <div className="flex items-center gap-3 mt-3">
                <button className={`px-3 py-2 sm:px-4 rounded-lg border ${AI_COLORS.border} ${AI_COLORS.text} hover:${AI_COLORS.bgLight}`}>
                  <UserPlus size={16} className="inline mr-2" /> 關注
                </button>
                <button onClick={() => setShowShare(true)} className={`${AI_COLORS.button} px-3 py-2 sm:px-4 rounded-lg`}>
                  <Share2 size={16} className="inline mr-2" /> 分享
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="flex border-b border-gray-100 px-4">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => handleTabClick(t.key)}
                className={`px-4 py-3 -mb-px border-b-2 text-sm font-medium transition-colors ${
                  active === t.key ? `${AI_COLORS.text} border-orange-500` : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {active === 'about' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">詳細介紹</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {profile.bio || '尚未提供詳細介紹。'}
                </p>
                {profile.tags?.length > 0 && (
                  <>
                    <h4 className="text-md font-semibold text-gray-900 mt-6 mb-2">標籤</h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.tags.map((tag: any, i: number) => (
                        <span key={i} className={`px-2 py-1 text-xs rounded-full ${AI_COLORS.bgLight} ${AI_COLORS.textDark}`}>
                          {tag.text}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {active === 'media' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">影音文章</h3>
                {mediaLoading ? (
                  <div className="text-center text-gray-500">
                    <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${AI_COLORS.border} mx-auto mb-3`}></div>
                    載入文章中...
                  </div>
                ) : mediaError ? (
                  <div className="text-center text-gray-500">{mediaError}</div>
                ) : mediaArticles.length === 0 ? (
                  <div className="text-center text-gray-500">暫無文章</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mediaArticles.map((a) => (
                      <div key={a.id} className="bg-white rounded-xl border border-gray-100 p-4">
                        <div className="w-full h-40 bg-gray-200 rounded mb-3 overflow-hidden flex items-center justify-center">
                          {a.cover_image_url ? (
                            <img src={a.cover_image_url} alt={a.title} className="w-full h-full object-cover" />
                          ) : (
                            <FileText size={40} className="text-gray-400" />
                          )}
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-1 line-clamp-1">{a.title}</h4>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">{a.content}</p>
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>約 {Math.ceil((a.content || '').length / 200)} 分鐘閱讀</span>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <Eye size={14} />
                              <span>{a.view_count}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Heart size={14} />
                              <span>{a.like_count}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {active === 'events' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">課程活動</h3>
                {eventsLoading ? (
                  <div className="text-center text-gray-500">
                    <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${AI_COLORS.border} mx-auto mb-3`}></div>
                    載入活動中...
                  </div>
                ) : eventsError ? (
                  <div className="text-center text-gray-500">{eventsError}</div>
                ) : eventItems.length === 0 ? (
                  <div className="text-center text-gray-500">暫無活動</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {eventItems.map((event: any) => (
                      <div key={event.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                        {/* 主圖 */}
                        {event.main_image && (
                          <div className="relative h-48 bg-gray-100">
                            <img src={event.main_image.url} alt={event.name} className="w-full h-full object-cover" />
                            <div className="absolute top-3 right-3">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                event.event_status === 'registration_open' ? 'bg-green-100 text-green-700' :
                                event.event_status === 'registration_closed' ? 'bg-yellow-100 text-yellow-700' :
                                event.event_status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                event.event_status === 'completed' ? `${AI_COLORS.bgLight} ${AI_COLORS.textDark}` :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {event.event_status_display}
                              </span>
                            </div>
                          </div>
                        )}
                        {/* 內容 */}
                        <div className="p-6 flex flex-col flex-1">
                          <div className="mb-3">
                            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2">{event.name}</h3>
                            <p className="text-gray-600 text-sm line-clamp-2">{event.description}</p>
                          </div>
                          <div className="space-y-2 mb-4 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                              <i className="ri-calendar-line" style={{ fontSize: '14px' }}></i>
                              <span>{event.start_time} - {event.end_time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <i className="ri-user-line" style={{ fontSize: '14px' }}></i>
                              <span>{event.min_participants} - {event.max_participants} 人</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <i className="ri-money-dollar-circle-line" style={{ fontSize: '14px' }}></i>
                              <span>NT$ {event.base_price}</span>
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-2">
                                <i className="ri-map-pin-line" style={{ fontSize: '14px' }}></i>
                                <span>{event.location}</span>
                              </div>
                            )}
                          </div>
                          {event.item_tags && event.item_tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-4">
                              {event.item_tags.map((tag: any, index: number) => (
                                <span key={index} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">{tag.name}</span>
                              ))}
                            </div>
                          )}
                          <div className="flex gap-2 mt-auto">
                            <button disabled={event.event_status !== 'registration_open'} className={`flex-1 px-4 py-2 ${AI_COLORS.button} rounded-xl disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm`}>
                              {event.event_status === 'registration_open' ? '立即報名' : '報名截止'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {active === 'booking' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">預約個案</h3>
                <div className="py-16 text-center text-gray-500">即將推出</div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* 分享彈窗（與名片預覽相同樣式） */}
      <ShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        profileSlug={slug || ''}
        sharePpUrl={(card as any)?.share_pp || (fetchedCard as any)?.share_pp}
      />
    </div>
  );
};

export default MentorDetail;


