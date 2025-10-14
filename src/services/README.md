# ChatPlatform API 使用注意事項

## 🔐 認證機制

- 所有API請求都需要用戶已登入
- 認證通過 Django session cookie 進行
- 必須設置 `credentials: 'include'` 確保cookie傳送
- 不需要在請求中傳送 `member_card_id` 或 `client_sid` 參數

## 🌐 CORS 配置

- 伺服器已正確配置CORS，允許跨域請求
- 請求來源: `https://react.flashfalcon.info`
- 響應標頭包含: `Access-Control-Allow-Credentials: true`

## 📡 請求格式

- **GET 請求**: 不要設置 `Content-Type` 標頭，讓瀏覽器自動處理
- **必要標頭**: 只設置 `Accept: 'application/json, text/plain, */*'`
- **其他標頭**: 避免設置可能導致CORS問題的標頭

## 🚫 常見問題與解決方案

### 1. 404 Not Found 錯誤
- **原因**: API路徑不正確
- **解決**: 使用正確的API路徑，包含 `/chatplatform/api/` 前綴

### 2. 認證失敗 (`request.user.is_authenticated = False`)
- **原因**: Cookie 未正確傳送
- **解決**: 確保設置 `credentials: 'include'`

### 3. CORS 錯誤
- **原因**: 請求標頭過於複雜或包含不允許的標頭
- **解決**: 簡化請求標頭，只保留必要的

### 4. 重複請求
- **原因**: `useEffect` 依賴項設置不當或組件重渲染
- **解決**: 使用 `useRef` 防重複調用機制

## 📋 API 端點列表

- **平台管理**: `/chatplatform/api/platforms/`
- **會話管理**: `/chatplatform/api/chat/`
- **管理員功能**: `/chatplatform/api/managers/`
- **工具功能**: `/chatplatform/api/tools/`

## ⚠️ 重要提醒

- 不要使用測試數據，直接調用真實API
- 所有錯誤都應該有適當的錯誤處理
- 使用 TypeScript 接口確保類型安全
- 添加詳細的日誌記錄用於調試

## 🔧 調試技巧

- 檢查網路面板中的請求標頭和響應
- 確認 Cookie 是否正確傳送
- 檢查控制台日誌中的API調用結果
- 使用瀏覽器開發工具的網路面板監控請求

## 📚 參考資料

- **成功的API請求**: `/api/protected/` (返回JSON，狀態碼200)
- **失敗的API請求**: 返回HTML錯誤頁面或404狀態碼

## 💡 最佳實踐

### 防重複調用機制
```typescript
const fetchInProgressRef = useRef(false);
const lastFetchTimeRef = useRef(0);

const fetchData = async () => {
  if (fetchInProgressRef.current) return;
  if (Date.now() - lastFetchTimeRef.current < 3000) return;
  
  fetchInProgressRef.current = true;
  try {
    // API調用邏輯
  } finally {
    fetchInProgressRef.current = false;
  }
};
```

### 正確的請求格式
```typescript
const response = await fetch(url, {
  method: 'GET',
  headers: {
    'Accept': 'application/json, text/plain, */*'
  },
  credentials: 'include'
});
```

## 🔍 調試檢查清單

- [ ] 用戶是否已登入？
- [ ] Cookie 是否正確傳送？
- [ ] API路徑是否正確？
- [ ] 請求標頭是否簡化？
- [ ] 是否有防重複調用機制？
- [ ] 錯誤處理是否完善？
- [ ] 日誌記錄是否詳細？ 