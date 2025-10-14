# 環境變數設定說明

## 創建 .env 文件

請在專案根目錄手動創建 `.env` 文件，並添加以下內容：

```env
# 第三方登入配置

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

## 如何創建 .env 文件

### 方法 1: 使用檔案總管
1. 在專案根目錄右鍵 → 新增 → 文字文件
2. 將檔案名稱改為 `.env` (包含點號)
3. 用記事本或其他文字編輯器開啟
4. 複製上面的內容並貼上
5. 儲存檔案

### 方法 2: 使用命令列
```bash
# Windows (PowerShell)
New-Item -Path ".env" -ItemType File
notepad .env

# Windows (CMD)
echo. > .env
notepad .env

# macOS/Linux
touch .env
nano .env
# 或
touch .env
vim .env
```

### 方法 3: 使用 VS Code
1. 在 VS Code 中開啟專案
2. 在檔案總管中右鍵 → 新增檔案
3. 輸入檔案名稱 `.env`
4. 複製上面的內容並貼上
5. 儲存檔案 (Ctrl+S)

## 環境變數說明

| 變數名稱 | 說明 | 範例值 |
|---------|------|--------|
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth 客戶端 ID | `123456789-abcdef.apps.googleusercontent.com` |
| `VITE_LINE_CLIENT_ID` | LINE Login Channel ID | `1234567890` |
| `VITE_FACEBOOK_APP_ID` | Facebook 應用程式 ID | `123456789012345` |
| `VITE_APPLE_CLIENT_ID` | Apple Sign In Services ID | `com.yourcompany.yourapp` |
| `VITE_APP_NAME` | 應用程式名稱 | `FlashFalcon` |
| `VITE_APP_URL` | 應用程式網址 | `https://your-domain.com` |

## 開發環境設定

如果您只是在開發環境中測試，可以暫時使用以下測試值：

```env
# 開發環境測試配置
VITE_GOOGLE_CLIENT_ID=test_google_client_id
VITE_LINE_CLIENT_ID=test_line_channel_id
VITE_FACEBOOK_APP_ID=test_facebook_app_id
VITE_APPLE_CLIENT_ID=test_apple_client_id
VITE_APP_NAME=FlashFalcon
VITE_APP_URL=http://localhost:5173
```

## 注意事項

1. **不要提交 .env 文件**：`.env` 文件已經在 `.gitignore` 中被忽略
2. **保護敏感資訊**：不要將真實的客戶端 ID 分享給他人
3. **環境區分**：可以創建 `.env.local`、`.env.development`、`.env.production` 等不同環境的配置
4. **重新啟動**：修改 `.env` 文件後需要重新啟動開發伺服器

## 驗證配置

創建 `.env` 文件後，可以透過以下方式驗證：

1. 重新啟動開發伺服器：`npm run dev`
2. 檢查瀏覽器控制台是否有錯誤訊息
3. 在登入頁面查看第三方登入按鈕是否正常顯示

## 故障排除

### 問題：環境變數無法讀取
**解決方案**：
- 確認 `.env` 文件在專案根目錄
- 確認變數名稱以 `VITE_` 開頭
- 重新啟動開發伺服器

### 問題：第三方登入按鈕不顯示
**解決方案**：
- 檢查環境變數是否正確設定
- 確認沒有 JavaScript 錯誤
- 檢查瀏覽器控制台錯誤訊息

### 問題：第三方登入失敗
**解決方案**：
- 確認客戶端 ID 正確
- 檢查回調 URL 設定
- 確認第三方平台配置正確 