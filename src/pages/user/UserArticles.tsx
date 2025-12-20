import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Image, 
  Calendar,
  User,
  Eye,
  Heart,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { getArticlesAll, Article, ArticleListResponse } from '../../config/api';
import { AI_COLORS } from '../../constants/colors';

// 文章卡片組件
const ArticleCard: React.FC<{
  article: Article;
  onClick: () => void;
  isMobile: boolean;
}> = ({ article, onClick, isMobile }) => (
  <div
    onClick={onClick}
    className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-100 flex flex-col ${
      isMobile ? 'p-4' : 'p-6'
    }`}
  >
    <div className="mb-4">
      <div className="relative">
        <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
          {article.cover_image_url ? (
            <img 
              src={article.cover_image_url} 
              alt={article.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <FileText size={48} className="text-gray-400" />
          )}
        </div>
        {article.tags.length > 0 && (
          <div className="absolute top-2 left-2">
            <span className={`px-2 py-1 ${AI_COLORS.bgDark} text-white text-xs rounded-full`}>
              {article.tags[0]}
            </span>
          </div>
        )}
      </div>
    </div>
    
    <div className="flex flex-col flex-1">
      <h3 className={`font-semibold text-gray-900 mb-2 ${isMobile ? 'text-base' : 'text-lg'} line-clamp-2`}>
        {article.title}
      </h3>
      
      <p className={`text-gray-600 mb-3 ${isMobile ? 'text-sm' : 'text-base'} line-clamp-3`}>
        {article.content}
      </p>
      
      {/* 底部資訊（固定在卡片底部）：作者/日期 + 閱讀資訊 */}
      <div className="mt-auto">
        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <div className="flex items-center gap-2">
            {article.provider_avatar_url ? (
              <img src={article.provider_avatar_url} alt={article.provider_name || '作者'} className="w-5 h-5 rounded-full object-cover" />
            ) : (
              <User size={14} />
            )}
            <span>{article.provider_name || '系統'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={14} />
            <span>{article.published_at || article.created_at}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>約 {Math.ceil(article.content.length / 200)} 分鐘閱讀</span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Eye size={14} />
              <span>{article.view_count}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart size={14} />
              <span>{article.like_count}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// 影音文章主頁面
const UserArticles: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  // 若在個人頁（/client/provider/:slug），從路徑擷取 slug
  const providerSlugFromPath = React.useMemo(() => {
    const path = location.pathname || '';
    const idx = path.indexOf('/client/provider/');
    if (idx >= 0) {
      const rest = path.substring(idx + '/client/provider/'.length);
      const slug = rest.split('/')[0];
      return slug || undefined;
    }
    return undefined;
  }, [location.pathname]);
  const [activeTab, setActiveTab] = useState<'articles' | 'images'>('articles');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // 檢測設備類型
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // 載入文章數據
  useEffect(() => {
    const loadArticles = async () => {
      if (activeTab !== 'articles') return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await getArticlesAll(currentPage, 12, providerSlugFromPath);
        if (response.success) {
          setArticles(response.data.articles);
          setTotalPages(response.data.pagination.total_pages);
          setTotalCount(response.data.pagination.total_count);
        } else {
          setError('載入文章失敗');
        }
      } catch (error) {
        console.error('載入文章時發生錯誤:', error);
        setError('載入文章時發生錯誤');
      } finally {
        setLoading(false);
      }
    };

    loadArticles();
  }, [activeTab, currentPage, providerSlugFromPath]);

  // 獲取所有可用的分類
  const getAvailableCategories = () => {
    const categories = new Set<string>();
    articles.forEach(article => {
      article.tags.forEach(tag => categories.add(tag));
    });
    return ['all', ...Array.from(categories)];
  };

  // 過濾文章
  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || article.tags.includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  // 處理分頁
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 頁面標題 */}

      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        {/* 標籤頁導航 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('articles')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                activeTab === 'articles'
                  ? `${AI_COLORS.button}`
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FileText size={16} />
              <span className={isMobile ? 'text-sm' : 'text-base'}>文章</span>
            </button>
            <button
              onClick={() => setActiveTab('images')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                activeTab === 'images'
                  ? `${AI_COLORS.button}`
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Image size={16} />
              <span className={isMobile ? 'text-sm' : 'text-base'}>圖片</span>
            </button>
          </div>
        </div>

        {/* 搜索和篩選 */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索文章、內容或標籤..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              {getAvailableCategories().map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? '全部分類' : category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 內容區域 */}
        <div className="space-y-6">
          {activeTab === 'articles' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">精選文章</h2>
                <span className="text-sm text-gray-500">共 {totalCount} 篇文章</span>
              </div>
              
              {loading ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="text-center text-gray-500">
                    <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${AI_COLORS.border} mx-auto mb-4`}></div>
                    <p>載入文章中...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
                  <div className="text-center text-red-500">
                    <FileText size={48} className="mx-auto mb-4 text-red-300" />
                    <p className="font-medium">載入失敗</p>
                    <p className="text-sm mt-2">{error}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      重試
                    </button>
                  </div>
                </div>
              ) : filteredArticles.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="text-center text-gray-500">
                    <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                    <p>暫無文章</p>
                    <p className="text-sm mt-2">沒有找到符合條件的文章</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid gap-6">
                    {isMobile ? (
                      <div className="space-y-4">
                        {filteredArticles.map((article) => (
                          <ArticleCard
                            key={article.id}
                            article={article}
                            onClick={() => navigate(`/client/articles/${article.slug}`)}
                            isMobile={isMobile}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredArticles.map((article) => (
                          <ArticleCard
                            key={article.id}
                            article={article}
                            onClick={() => navigate(`/client/articles/${article.slug}`)}
                            isMobile={isMobile}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 分頁控制 */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      
                      <span className="px-4 py-2 text-sm text-gray-600">
                        第 {currentPage} 頁，共 {totalPages} 頁
                      </span>
                      
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'images' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">精選圖片</h2>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="text-center text-gray-500">
                  <Image size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>圖片功能正在開發中</p>
                  <p className="text-sm mt-2">敬請期待！</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserArticles;
