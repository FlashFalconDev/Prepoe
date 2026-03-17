import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../contexts/AuthContext';
import { getSpreadItemSkuList, SpreadItem } from '../../config/api';
import { AI_COLORS } from '../../constants/colors';

const UserSpreadItems: React.FC = () => {
  const navigate = useNavigate();
  const { showError } = useToast();
  const { user } = useAuth();

  // 狀態管理
  const [items, setItems] = useState<SpreadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // 載入牌陣商品列表
  const loadItems = async () => {
    try {
      setLoading(true);
      const response = await getSpreadItemSkuList();
      if (response.success) {
        const itemsData = response.data.items;
        if (Array.isArray(itemsData)) {
          setItems(itemsData);
        } else {
          setItems([]);
        }
      } else {
        showError('載入失敗', response.message);
      }
    } catch (error: any) {
      showError('載入失敗', error.message || '無法載入牌陣商品資料');
    } finally {
      setLoading(false);
    }
  };

  // 初始化載入
  useEffect(() => {
    loadItems();
  }, []);

  // 過濾商品
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' ||
                           (item.item_tags && item.item_tags.some(tag => tag.name === selectedCategory));
    return matchesSearch && matchesCategory;
  });

  // 獲取所有可用的標籤類別
  const getAvailableCategories = () => {
    const categories = new Set<string>();
    items.forEach(item => {
      if (item.item_tags) {
        item.item_tags.forEach(tag => categories.add(tag.name));
      }
    });
    return Array.from(categories);
  };

  // 跳轉到抽牌頁面
  const handleViewItem = (item: SpreadItem) => {
    const clientSid = localStorage.getItem('client_sid') || import.meta.env.VITE_CLIENT_SID || 'prepoe';
    navigate(`/card/${clientSid}/${item.spread.code}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* 搜尋和篩選 */}
        <div className="mb-6 flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" style={{ fontSize: '20px' }}></i>
              <input
                type="text"
                placeholder="搜尋牌陣名稱或描述..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">所有類別</option>
              {getAvailableCategories().map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 載入狀態 */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${AI_COLORS.border} mx-auto mb-4`}></div>
              <p className="text-gray-600">載入牌陣商品中...</p>
            </div>
          </div>
        )}

        {/* 無資料狀態 */}
        {!loading && filteredItems.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <i className="ri-layout-grid-line text-6xl"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">暫無牌陣商品</h3>
            <p className="text-gray-500">目前沒有符合條件的牌陣商品，請稍後再來查看</p>
          </div>
        )}

        {/* 商品列表 */}
        {!loading && filteredItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleViewItem(item)}
                className="bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all cursor-pointer p-4"
              >
                {/* 上方：縮圖 + 標題區 */}
                <div className="flex gap-4 mb-3">
                  {/* 卡背圖片堆疊效果 */}
                  <div className="relative w-14 h-[72px] flex-shrink-0">
                    {/* 底層卡片 - 第三張 */}
                    <div className="absolute top-0 left-2 w-11 h-16 rounded-md shadow-sm overflow-hidden transform rotate-6 bg-gray-200">
                      {item.main_image ? (
                        <img src={item.main_image.thumbnail_url || item.main_image.url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full ${AI_COLORS.bg} flex items-center justify-center`}>
                          <Layers size={14} className={AI_COLORS.text} />
                        </div>
                      )}
                    </div>
                    {/* 中層卡片 - 第二張 */}
                    <div className="absolute top-1 left-1 w-11 h-16 rounded-md shadow-sm overflow-hidden transform -rotate-3 bg-gray-200">
                      {item.main_image ? (
                        <img src={item.main_image.thumbnail_url || item.main_image.url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full ${AI_COLORS.bg} flex items-center justify-center`}>
                          <Layers size={14} className={AI_COLORS.text} />
                        </div>
                      )}
                    </div>
                    {/* 頂層卡片 - 第一張 */}
                    <div className="absolute top-2 left-0 w-11 h-16 rounded-md shadow-md overflow-hidden bg-gray-200">
                      {item.main_image ? (
                        <img src={item.main_image.thumbnail_url || item.main_image.url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full ${AI_COLORS.bg} flex items-center justify-center`}>
                          <Layers size={16} className={AI_COLORS.text} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 標題與描述 */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 line-clamp-1">{item.name}</h3>
                    <p className="text-gray-500 text-sm line-clamp-2 mt-1">{item.description}</p>
                  </div>
                </div>

                {/* 中間：metadata */}
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                  {item.spread && (
                    <div className="flex items-center gap-1">
                      <i className="ri-stack-line" style={{ fontSize: '14px' }}></i>
                      <span>{item.spread.draw_count} 張牌</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <i className="ri-money-dollar-circle-line" style={{ fontSize: '14px' }}></i>
                    <span>NT$ {item.base_price}</span>
                  </div>
                  {item.spread?.ai_interpretation_addon_price != null && item.spread.ai_interpretation_addon_price > 0 && (
                    <div className="flex items-center gap-1 text-purple-600">
                      <i className="ri-sparkling-line" style={{ fontSize: '14px' }}></i>
                      <span>+AI 解讀</span>
                    </div>
                  )}
                </div>

                {/* 底部：標籤 + 更新時間 */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {item.item_tags && item.item_tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="px-2 py-0.5 text-xs bg-purple-50 text-purple-600 rounded-full">
                        {tag.name}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    更新於 {new Date(item.updated_at).toLocaleDateString('zh-TW')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSpreadItems;
