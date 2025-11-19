import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  User,
  Eye,
  Heart,
  Share2,
  Clock,
  Image as ImageIcon,
  Video as VideoIcon,
  Music as MusicIcon,
  X,
  ChevronLeft,
  ChevronRight,
  Play
} from 'lucide-react';
import { getPublicArticle, Article } from '../../config/api';
import { AI_COLORS } from '../../constants/colors';
import { useToast } from '../../hooks/useToast';

const ArticleDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { showError } = useToast();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxType, setLightboxType] = useState<'image' | 'video'>('image');

  useEffect(() => {
    const loadArticle = async () => {
      if (!slug) {
        showError('文章 ID 無效');
        navigate('/client/articles');
        return;
      }

      try {
        setLoading(true);
        const response = await getPublicArticle(slug);
        if (response.success) {
          setArticle(response.data);
        } else {
          showError('載入文章失敗');
          navigate('/client/articles');
        }
      } catch (error: any) {
        console.error('載入文章錯誤:', error);
        showError('載入文章時發生錯誤');
        navigate('/client/articles');
      } finally {
        setLoading(false);
      }
    };

    loadArticle();
  }, [slug, navigate, showError]);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: article?.title,
          text: article?.content.substring(0, 100) + '...',
          url: window.location.href,
        });
      } else {
        // 複製連結到剪貼簿
        await navigator.clipboard.writeText(window.location.href);
        alert('連結已複製到剪貼簿！');
      }
    } catch (error) {
      console.error('分享失敗:', error);
    }
  };

  const openImageLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxType('image');
    setLightboxOpen(true);
  };

  const openVideoLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxType('video');
    setLightboxOpen(true);
  };

  const handlePrevious = () => {
    if (lightboxType === 'image' && article?.images) {
      setLightboxIndex((prev) => (prev > 0 ? prev - 1 : article.images!.length - 1));
    } else if (lightboxType === 'video' && article?.videos) {
      setLightboxIndex((prev) => (prev > 0 ? prev - 1 : article.videos!.length - 1));
    }
  };

  const handleNext = () => {
    if (lightboxType === 'image' && article?.images) {
      setLightboxIndex((prev) => (prev < article.images!.length - 1 ? prev + 1 : 0));
    } else if (lightboxType === 'video' && article?.videos) {
      setLightboxIndex((prev) => (prev < article.videos!.length - 1 ? prev + 1 : 0));
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!lightboxOpen) return;
    if (e.key === 'ArrowLeft') handlePrevious();
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === 'Escape') setLightboxOpen(false);
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, lightboxIndex, lightboxType]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${AI_COLORS.border} mx-auto mb-4`}></div>
          <p className="text-gray-600">載入文章中...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6 lg:py-8">
        {/* 返回按鈕 */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>返回</span>
        </button>

        {/* 文章主體 */}
        <article className="bg-white rounded-xl shadow-sm border border-gray-100">
          {/* 封面圖片 */}
          {article.cover_image_url && (
            <div className="w-full h-64 md:h-96 rounded-t-xl overflow-hidden">
              <img
                src={article.cover_image_url}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* 文章內容 */}
          <div className="p-6 md:p-8">
            {/* 標籤 */}
            {article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {article.tags.map((tag, index) => (
                  <span
                    key={index}
                    className={`px-3 py-1 ${AI_COLORS.bgLight} ${AI_COLORS.text} text-sm rounded-full`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* 標題 */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {article.title}
            </h1>

            {/* 元資訊 */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6 pb-6 border-b">
              {/* 作者 */}
              <div className="flex items-center gap-2">
                {article.provider_avatar_url ? (
                  <img
                    src={article.provider_avatar_url}
                    alt={article.provider_name || '作者'}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <User size={16} />
                  </div>
                )}
                <span className="font-medium">{article.provider_name || '系統'}</span>
              </div>

              {/* 發布日期 */}
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>{article.published_at || article.created_at}</span>
              </div>

              {/* 閱讀時間 */}
              <div className="flex items-center gap-2">
                <Clock size={16} />
                <span>約 {Math.ceil(article.content.length / 200)} 分鐘閱讀</span>
              </div>

              {/* 瀏覽數 */}
              <div className="flex items-center gap-2">
                <Eye size={16} />
                <span>{article.view_count}</span>
              </div>

              {/* 按讚數 */}
              <div className="flex items-center gap-2">
                <Heart size={16} />
                <span>{article.like_count}</span>
              </div>
            </div>

            {/* 文章內容 */}
            <div className="prose prose-lg max-w-none">
              <div
                className="text-gray-800 leading-relaxed whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />
            </div>

            {/* 圖片區域 */}
            {article.images && article.images.length > 0 && (
              <div className="mt-8 pt-8 border-t">
                <div className="flex items-center gap-2 mb-4">
                  <ImageIcon size={20} className={AI_COLORS.text} />
                  <h2 className="text-xl font-semibold text-gray-900">相關圖片</h2>
                  <span className="text-sm text-gray-500">({article.images.length})</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {article.images.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => openImageLightbox(index)}
                      className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-orange-400 transition-all group cursor-pointer"
                    >
                      <img
                        src={image.url}
                        alt={image.caption || `圖片 ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                        <ImageIcon className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={32} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 影片區域 */}
            {article.videos && article.videos.length > 0 && (
              <div className="mt-8 pt-8 border-t">
                <div className="flex items-center gap-2 mb-4">
                  <VideoIcon size={20} className={AI_COLORS.text} />
                  <h2 className="text-xl font-semibold text-gray-900">相關影片</h2>
                  <span className="text-sm text-gray-500">({article.videos.length})</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {article.videos.map((video, index) => (
                    <button
                      key={video.id}
                      onClick={() => openVideoLightbox(index)}
                      className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-orange-400 transition-all group cursor-pointer bg-black"
                    >
                      <video
                        src={video.url}
                        className="w-full h-full object-cover"
                        preload="metadata"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-60 transition-all flex items-center justify-center">
                        <div className="bg-white bg-opacity-90 rounded-full p-3 group-hover:scale-110 transition-transform">
                          <Play className="text-orange-600" size={32} fill="currentColor" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 音訊區域（如果將來有 audios 欄位） */}
            {article.audios && article.audios.length > 0 && (
              <div className="mt-8 pt-8 border-t">
                <div className="flex items-center gap-2 mb-4">
                  <MusicIcon size={20} className={AI_COLORS.text} />
                  <h2 className="text-xl font-semibold text-gray-900">相關音訊</h2>
                  <span className="text-sm text-gray-500">({article.audios.length})</span>
                </div>
                <div className="space-y-4">
                  {article.audios.map((audio, index) => (
                    <div key={audio.id} className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                      <audio
                        controls
                        className="w-full"
                        preload="metadata"
                      >
                        <source src={audio.url} type="audio/mpeg" />
                        您的瀏覽器不支援音訊播放
                      </audio>
                      {audio.caption && (
                        <p className="text-sm text-gray-700 mt-2">{audio.caption}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 分享按鈕 */}
            <div className="mt-8 pt-6 border-t flex justify-center">
              <button
                onClick={handleShare}
                className={`flex items-center gap-2 px-6 py-3 ${AI_COLORS.button} rounded-lg transition-colors`}
              >
                <Share2 size={18} />
                <span>分享文章</span>
              </button>
            </div>
          </div>
        </article>

        {/* 相關文章區塊（可選） */}
        {/* 可以在這裡添加相關文章推薦 */}
      </div>

      {/* Lightbox 彈窗 */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center">
          {/* 關閉按鈕 */}
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 z-10 p-2 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-full transition-all"
          >
            <X size={32} className="text-white" />
          </button>

          {/* 上一張按鈕 */}
          <button
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-full transition-all"
          >
            <ChevronLeft size={40} className="text-white" />
          </button>

          {/* 下一張按鈕 */}
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-full transition-all"
          >
            <ChevronRight size={40} className="text-white" />
          </button>

          {/* 媒體內容 */}
          <div className="w-full h-full flex items-center justify-center p-4">
            {lightboxType === 'image' && article?.images && article.images[lightboxIndex] && (
              <div className="max-w-7xl max-h-full flex flex-col items-center">
                <img
                  src={article.images[lightboxIndex].url}
                  alt={article.images[lightboxIndex].caption || `圖片 ${lightboxIndex + 1}`}
                  className="max-w-full max-h-[85vh] object-contain"
                />
                {article.images[lightboxIndex].caption && (
                  <div className="mt-4 text-white text-center max-w-2xl">
                    <p className="text-lg">{article.images[lightboxIndex].caption}</p>
                  </div>
                )}
                <div className="mt-4 text-white text-sm">
                  {lightboxIndex + 1} / {article.images.length}
                </div>
              </div>
            )}

            {lightboxType === 'video' && article?.videos && article.videos[lightboxIndex] && (
              <div className="max-w-7xl max-h-full flex flex-col items-center">
                <video
                  controls
                  autoPlay
                  className="max-w-full max-h-[85vh]"
                  key={article.videos[lightboxIndex].url}
                >
                  <source src={article.videos[lightboxIndex].url} type="video/mp4" />
                  您的瀏覽器不支援影片播放
                </video>
                {article.videos[lightboxIndex].caption && (
                  <div className="mt-4 text-white text-center max-w-2xl">
                    <p className="text-lg">{article.videos[lightboxIndex].caption}</p>
                  </div>
                )}
                <div className="mt-4 text-white text-sm">
                  {lightboxIndex + 1} / {article.videos.length}
                </div>
              </div>
            )}
          </div>

          {/* 點擊背景關閉 */}
          <div
            className="absolute inset-0 -z-10"
            onClick={() => setLightboxOpen(false)}
          />
        </div>
      )}
    </div>
  );
};

export default ArticleDetail;
