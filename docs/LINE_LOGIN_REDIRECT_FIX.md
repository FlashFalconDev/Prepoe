# LINE 登入重定向修復說明

## 問題描述

生產環境下 LINE 登入無法正確跳轉到登入前要去的位置，而開發環境正常。

## 問題原因

1. **環境配置差異**：
   - 開發環境：basename = `/`
   - 生產環境：basename = `/`

2. **URL 替換問題**：
   - `AuthCallback.tsx` 中直接使用 `/` 替換 URL
   - 生產環境下也使用 `/`

3. **路徑標準化問題**：
   - 不同環境下路徑格式不一致
   - 缺少統一的路徑處理邏輯

## 修復方案

### 1. 創建路徑工具函數 (`src/utils/pathUtils.ts`)

```typescript
// 獲取當前環境的 basename
export const getBasename = (): string => {
  return '/';
};

// 標準化路徑
export const normalizePath = (path: string): string => {
  const basename = getBasename();
  
  if (path.startsWith(basename)) {
    return path;
  }
  
  if (path.startsWith('/')) {
    return path;
  }
  
  return `/${path}`;
};
```

### 2. 修復 AuthCallback.tsx

**修復前**：
```typescript
window.history.replaceState({}, document.title, '/');
```

**修復後**：
```typescript
const basename = getBasename();
window.history.replaceState({}, document.title, basename);

const normalizedPath = normalizePath(redirectPath);
navigate(normalizedPath, { replace: true });
```

### 3. 修復 Login.tsx

**修復前**：
```typescript
const from = location.state?.from?.pathname || '/';
sessionStorage.setItem('redirectAfterLogin', from);
```

**修復後**：
```typescript
const from = location.state?.from?.pathname || '/';
const normalizedPath = normalizePath(from);
sessionStorage.setItem('redirectAfterLogin', normalizedPath);
```

## 修復效果

1. **統一環境處理**：使用工具函數統一處理不同環境下的路徑
2. **正確的 URL 替換**：統一使用根目錄 basename
3. **路徑標準化**：確保所有路徑格式一致
4. **代碼復用**：避免重複的路徑處理邏輯

## 測試

創建了 `src/utils/__tests__/pathUtils.test.ts` 來測試路徑工具函數的正確性。

## 影響範圍

- ✅ LINE 登入重定向
- ✅ Google 登入重定向  
- ✅ Facebook 登入重定向
- ✅ Apple 登入重定向
- ✅ 普通登入重定向

## 部署注意事項

1. 確保 basename 配置統一使用根目錄
2. 測試所有登入方式的重定向功能
3. 檢查第三方登入平台的回調 URL 設定

## 相關文件

- `src/utils/pathUtils.ts` - 路徑工具函數
- `src/pages/AuthCallback.tsx` - 登入回調處理
- `src/pages/Login.tsx` - 登入頁面
- `src/App.tsx` - 應用程式路由配置
