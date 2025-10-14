import { useState, useCallback, useEffect, useRef } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { PreviewCardData } from '../components/PreviewCard';

export const useBusinessCardData = (slug?: string) => {
  const [data, setData] = useState<PreviewCardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 使用 useRef 來追蹤是否已經載入過數據
  const hasLoadedRef = useRef(false);
  const isLoadingRef = useRef(false);

  const fetchData = useCallback(async (force: boolean = false) => {
    if (!slug) return;
    
    // 防止重複調用
    if (isLoadingRef.current) {
      console.log('🚫 已有API請求正在進行中，跳過重複調用');
      return;
    }
    
    // 如果已經有數據且不是強制刷新，則跳過
    if (hasLoadedRef.current && !force) {
      console.log('✅ 已有數據，跳過API調用');
      return;
    }

    console.log('🚀 開始載入名片資料...', { 
      slug,
      force, 
      hasLoaded: hasLoadedRef.current, 
      timestamp: new Date().toISOString()
    });
    
    isLoadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(API_ENDPOINTS.PUBLIC_BUSINESS_CARD(slug), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('useBusinessCardData 完整 API 響應:', result);
        
        // 檢查 API 返回的數據結構
        let apiData;
        if (result.success && result.data) {
          // 標準結構：result.data 包含所有數據
          apiData = result.data;
        } else if (result.success && result.profile) {
          // 直接結構：result 直接包含數據
          apiData = result;
        } else {
          throw new Error('API 返回的數據結構不符合預期');
        }
        
        console.log('useBusinessCardData 處理後的 API 數據:', apiData);
        console.log('useBusinessCardData apiData.share_pp:', apiData.share_pp);
        
        const previewData: PreviewCardData = {
          profile: apiData.profile || {},
          tags: apiData.tags || [],
          links: apiData.links || [],
          social_media: apiData.social_media || {},
          share_pp: apiData.share_pp // 確保包含 share_pp
        };
        
        console.log('useBusinessCardData 最終數據:', previewData);
        setData(previewData);
        hasLoadedRef.current = true;
      } else {
        throw new Error(`API 請求失敗: ${response.status}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知錯誤';
      console.error('獲取名片數據時出錯:', err);
      setError(errorMessage);
    } finally {
      isLoadingRef.current = false;
      setLoading(false);
    }
  }, [slug]); // 移除 data 依賴項，避免無限循環

  // 當 slug 改變時，重置狀態並重新載入
  useEffect(() => {
    if (slug) {
      hasLoadedRef.current = false;
      setData(null);
      setError(null);
      // 直接調用 fetchData 而不是通過依賴項
      const loadData = async () => {
        if (!slug) return;
        
        // 防止重複調用
        if (isLoadingRef.current) {
          console.log('🚫 已有API請求正在進行中，跳過重複調用');
          return;
        }
        
        console.log('🚀 開始載入名片資料...', { 
          slug,
          force: false, 
          hasLoaded: hasLoadedRef.current, 
          timestamp: new Date().toISOString()
        });
        
        isLoadingRef.current = true;
        setLoading(true);
        setError(null);

        try {
          const response = await fetch(API_ENDPOINTS.PUBLIC_BUSINESS_CARD(slug), {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const result = await response.json();
            console.log('useBusinessCardData 完整 API 響應:', result);
            
            // 檢查 API 返回的數據結構
            let apiData;
            if (result.success && result.data) {
              // 標準結構：result.data 包含所有數據
              apiData = result.data;
            } else if (result.success && result.profile) {
              // 直接結構：result 直接包含數據
              apiData = result;
            } else {
              throw new Error('API 返回的數據結構不符合預期');
            }
            
            console.log('useBusinessCardData 處理後的 API 數據:', apiData);
            console.log('useBusinessCardData apiData.share_pp:', apiData.share_pp);
            
            const previewData: PreviewCardData = {
              profile: apiData.profile || {},
              tags: apiData.tags || [],
              links: apiData.links || [],
              social_media: apiData.social_media || {},
              share_pp: apiData.share_pp // 確保包含 share_pp
            };
            
            console.log('useBusinessCardData 最終數據:', previewData);
            setData(previewData);
            hasLoadedRef.current = true;
          } else {
            throw new Error(`API 請求失敗: ${response.status}`);
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : '未知錯誤';
          console.error('獲取名片數據時出錯:', err);
          setError(errorMessage);
        } finally {
          isLoadingRef.current = false;
          setLoading(false);
        }
      };
      
      loadData();
    }
  }, [slug]); // 只依賴 slug，避免 fetchData 的依賴循環

  // 提供強制刷新的方法
  const refreshData = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    fetchData,
    refreshData
  };
}; 