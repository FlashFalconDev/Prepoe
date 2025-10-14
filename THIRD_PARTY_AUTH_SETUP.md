# 第三方登入配置說明

## 概述

本系統已整合支援以下第三方登入方式：
- 🔵 Google 登入
- 🟢 LINE 登入  
- 🔵 Facebook 登入
- ⚫ Apple 登入

## 環境變數配置

在專案根目錄創建 `.env` 文件，並添加以下配置：

```env
# Google OAuth
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here

# LINE Login
VITE_LINE_CLIENT_ID=your_line_channel_id_here

# Facebook Login
VITE_FACEBOOK_APP_ID=your_facebook_app_id_here

# Apple Sign In
VITE_APPLE_CLIENT_ID=your_apple_client_id_here

# 其他配置
VITE_APP_NAME=FlashFalcon
VITE_APP_URL=https://your-domain.com
```

## 第三方平台配置指南

### 1. Google OAuth 配置

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 創建新專案或選擇現有專案
3. 啟用 Google+ API
4. 在「憑證」頁面創建 OAuth 2.0 客戶端 ID
5. 設定授權的重新導向 URI：`https://your-domain.com/auth/callback`
6. 複製客戶端 ID 到環境變數

### 2. LINE Login 配置

1. 前往 [LINE Developers Console](https://developers.line.biz/)
2. 創建新 Provider 或選擇現有 Provider
3. 創建新的 Channel (LINE Login)
4. 設定 Callback URL：`https://your-domain.com/auth/callback`
5. 複製 Channel ID 到環境變數

### 3. Facebook Login 配置

1. 前往 [Facebook Developers](https://developers.facebook.com/)
2. 創建新應用程式
3. 添加 Facebook Login 產品
4. 設定 OAuth 重新導向 URI：`https://your-domain.com/auth/callback`
5. 複製應用程式 ID 到環境變數

### 4. Apple Sign In 配置

1. 前往 [Apple Developer](https://developer.apple.com/)
2. 在 Certificates, Identifiers & Profiles 中創建 App ID
3. 啟用 Sign In with Apple
4. 設定回調 URL：`https://your-domain.com/auth/callback`
5. 複製 Services ID 到環境變數

## 後端 API 需求

您的後端需要實作以下 API 端點：

```typescript
// 第三方登入初始化端點
GET /api/auth/google/
GET /api/auth/line/
GET /api/auth/facebook/
GET /api/auth/apple/

// 第三方登入回調處理端點
POST /api/auth/callback/
```

### 回調端點預期格式

```typescript
// 請求格式
{
  "code": "authorization_code_from_oauth_provider",
  "state": "state_parameter_for_security"
}

// 回應格式
{
  "success": true,
  "user": {
    "id": 1,
    "username": "user@example.com",
    "email": "user@example.com",
    "name": "User Name",
    "avatar": "https://example.com/avatar.jpg"
  },
  "token": "jwt_token_here"
}
```

## 安全注意事項

1. **狀態碼驗證**：系統會自動生成和驗證 state 參數防止 CSRF 攻擊
2. **HTTPS 要求**：所有第三方登入都要求 HTTPS 環境
3. **回調 URL 驗證**：確保回調 URL 與第三方平台設定一致
4. **環境變數保護**：不要將 `.env` 文件提交到版本控制系統

## 測試流程

1. 設定環境變數
2. 啟動開發伺服器：`npm run dev`
3. 前往登入頁面
4. 點擊第三方登入按鈕
5. 完成第三方平台授權
6. 驗證回調處理和用戶登入

## 故障排除

### 常見問題

1. **回調 URL 不匹配**
   - 檢查第三方平台設定中的回調 URL
   - 確保與環境變數中的設定一致

2. **客戶端 ID 錯誤**
   - 確認環境變數名稱正確
   - 檢查客戶端 ID 是否有效

3. **CORS 錯誤**
   - 確保後端 API 支援 CORS
   - 檢查允許的來源域名

4. **狀態碼驗證失敗**
   - 清除瀏覽器 localStorage
   - 重新嘗試登入流程

## 自訂配置

如需自訂第三方登入配置，可修改 `src/services/thirdPartyAuth.ts` 文件中的：

- 授權範圍 (scope)
- 重新導向 URI
- 額外的 OAuth 參數

## 支援的瀏覽器

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 注意事項

- 第三方登入需要有效的 SSL 憑證
- 某些第三方平台可能需要驗證應用程式
- 建議在生產環境中實作適當的錯誤處理和日誌記錄 