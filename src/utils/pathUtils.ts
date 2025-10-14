/**
 * 路徑工具函數
 * 用於處理不同環境下的路徑標準化
 */

/**
 * 獲取當前環境的 basename
 */
export const getBasename = (): string => {
  return '/';
};

/**
 * 標準化路徑，確保與當前環境的 basename 一致
 * @param path 原始路徑
 * @returns 標準化後的路徑
 */
export const normalizePath = (path: string): string => {
  const basename = getBasename();
  
  // 如果路徑已經包含 basename，直接返回
  if (path.startsWith(basename)) {
    return path;
  }
  
  // 如果路徑以 / 開頭，直接返回
  if (path.startsWith('/')) {
    return path;
  }
  
  // 否則添加 / 前綴
  return `/${path}`;
};

/**
 * 清理 URL 中的查詢參數，用於登入回調後清理
 * @param path 要清理到的路徑
 */
export const cleanUrlAndNavigate = (path: string = '/'): void => {
  const basename = getBasename();
  
  // 清理 URL 中的查詢參數
  window.history.replaceState({}, document.title, basename);
};
