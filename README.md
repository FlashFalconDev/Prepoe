# Prepoe Business Web

[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.0.6-646CFF?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3.5-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

企業級多租戶 SaaS 平台，提供 AI 客服助理、數位名片、內容創作等整合服務。

---

## 📋 專案概述

**Prepoe Business Web** 是一個基於 React + TypeScript + Vite 的現代化 Web 應用程式，專為企業提供：

- 🤖 **AI 智能客服** - 基於 RAG (檢索增強生成) 的文檔問答系統
- 💳 **雲端名片管理** - 可自訂設計的數位名片與 QR Code 分享
- 📝 **內容創作工具** - 文章、影片、音訊生成
- 💬 **聊天平台整合** - LINE、Facebook Messenger 機器人整合
- 📊 **活動管理系統** - 報名、簽到、訂單管理
- 🎨 **LINE Rich Menu 編輯器** - 視覺化選單配置工具

---

## 🏗️ 系統架構

### 多租戶路由設計

專案採用三層用戶架構，各自擁有獨立的路由空間：

```
/provider/*     → 服務提供者（管理服務、設定助理、創作內容）
/client/*       → 終端用戶（瀏覽服務、聊天、參加活動）
/business/*     → 商業客戶（數據分析、帳號管理、使用統計）
```

### 核心技術棧

| 類別 | 技術 |
|------|------|
| **前端框架** | React 18.2 + TypeScript 5.2 |
| **建構工具** | Vite 7.0 |
| **樣式方案** | Tailwind CSS 3.3 |
| **路由管理** | React Router v6 |
| **HTTP 客戶端** | Axios 1.10 |
| **狀態管理** | React Context API |
| **程式碼檢查** | ESLint + TypeScript ESLint |

---

## 🚀 快速開始

### 環境需求

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0

### 安裝步驟

```bash
# 1. Clone 專案
git clone https://github.com/FlashFalconDev/Prepoe.git
cd Prepoe

# 2. 安裝依賴
npm install

# 3. 設定環境變數（請參考下方「環境配置」章節）
cp .env.example .env
# 編輯 .env 填入必要的設定值

# 4. 啟動開發伺服器
npm run dev
```

開發伺服器將在 `http://localhost:3000` 啟動。

---

## ⚙️ 環境配置

### 必要環境變數

在專案根目錄建立 `.env` 檔案（**切勿提交到 Git**）：

```env
# 第三方登入配置
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_LINE_CLIENT_ID=your_line_channel_id
VITE_FACEBOOK_APP_ID=your_facebook_app_id
VITE_APPLE_CLIENT_ID=your_apple_client_id

# 應用程式配置
VITE_APP_NAME=Prepoe
VITE_APP_URL=https://your-domain.com
VITE_CLIENT_SID=prepoe
```

### API 環境切換

API Base URL 會根據 `MODE` 自動切換：

- **開發環境** (`npm run dev`): `https://host.flashfalcon.info`
- **生產環境** (`npm run build`): `https://www.flashfalcon.info`

> 詳細配置說明請參考 [ENV_SETUP.md](./ENV_SETUP.md)

---

## 📦 可用指令

| 指令 | 說明 |
|------|------|
| `npm run dev` | 啟動開發伺服器（開發 API） |
| `npm run dev:prod` | 啟動開發伺服器（生產 API） |
| `npm run build` | 建置生產版本 |
| `npm run build:dev` | 建置開發版本 |
| `npm run preview` | 預覽生產建置 |
| `npm run lint` | 執行 ESLint 檢查 |

---

## 🔑 核心功能

### 1️⃣ AI 助理系統 (RAG)

- 上傳文檔建立知識庫（支援 PDF、DOCX、TXT、Markdown）
- 向量化儲存與語義搜尋
- 多助理管理（依 Feature Flag 限制數量）
- 可調整 AI 模型、溫度、系統提示詞
- 對話歷史持久化

### 2️⃣ 雲端名片

- 拖放式連結排序 ([react-beautiful-dnd](https://github.com/atlassian/react-beautiful-dnd))
- 完整的外觀自訂（顏色、社群圖示樣式、可見性）
- QR Code 自動生成
- 分享追蹤（瀏覽次數、LINE 分享次數）
- 公開 URL: `/card/:slug`

### 3️⃣ 內容創作工具

#### 📄 文章系統
- Markdown 富文本編輯器
- 圖片/影片嵌入
- 標籤分類
- 閱讀權限設定（免費/VIP/付費 + 時效限制）

#### 🎬 影片生成
- 文字轉影片
- 圖片轉影片
- 多模型選擇
- 生成歷史記錄

#### 🎙️ 音訊生成
- 聲音克隆（上傳音檔訓練）
- 文字轉語音
- 多音色模型

### 4️⃣ 聊天平台整合

- LINE Bot 整合（Rich Menu 視覺化編輯器）
- Facebook Messenger 整合
- 助理嵌入外部平台
- 管理員介入功能（人工客服接手）

### 5️⃣ 活動管理

- 活動模組系統（可重用模板）
- 公開報名頁面: `/client/event/join/:sku`
- QR Code 簽到
- 參與者綁定碼驗證
- 訂單整合

---

## 🔒 安全機制

### CSRF 防護

所有 POST/PUT/DELETE/PATCH 請求自動處理 CSRF Token：

- 從 Cookie 自動讀取 Token
- 403 錯誤自動重試
- 支援多種 Cookie 命名格式

### 第三方 OAuth

- Google / LINE / Facebook / Apple Sign-In
- State 參數防止 CSRF 攻擊
- Callback 路由: `/auth/callback/:provider`

### 權限控制

- `ProtectedRoute` 元件保護需登入路由
- `FeatureGate` 元件基於 Feature Flag 控制功能可見性
- 後端 Session 驗證

---

## 🎨 UI/UX 設計

### Tailwind CSS 自訂主題

```js
colors: {
  primary: { ... },      // 紫色系（品牌主色）
  ai: { ... },           // 橙色系（AI 功能專用）
  gradient: { ... }      // 預設漸層色
}
```

### Toast 通知系統

使用 `useToast` Hook 顯示訊息：

```typescript
import { useToast } from '@/hooks/useToast';

const { showSuccess, showError } = useToast();

showSuccess('儲存成功！');
showError('操作失敗，請稍後再試');
```

### 確認對話框

使用 `useConfirm` Hook 進行二次確認：

```typescript
import { useConfirm } from '@/hooks/useConfirm';

const confirmed = await confirm({
  title: '確認刪除',
  message: '此操作無法復原，確定繼續？'
});
```

---

## 📂 專案結構

```
src/
├── config/
│   └── api.ts                    # API 配置與 CSRF 處理
├── contexts/
│   ├── AuthContext.tsx           # 認證狀態與 Feature Flags
│   └── BusinessCardContext.tsx   # 名片資料管理
├── pages/
│   ├── business/                 # 商業客戶頁面
│   ├── user/                     # 終端用戶頁面
│   ├── Login.tsx                 # 登入頁
│   └── ...
├── components/
│   ├── Layout.tsx                # 主佈局
│   ├── ProtectedRoute.tsx        # 路由保護
│   ├── FeatureGate.tsx           # 功能閘道
│   └── keys/                     # 金鑰管理元件
├── services/
│   ├── thirdPartyAuth.ts         # OAuth 整合
│   ├── chatPlatform.ts           # 聊天平台抽象層
│   ├── fileUpload.ts             # 檔案上傳處理
│   └── usageTracking.ts          # 使用量追蹤
└── hooks/
    ├── useToast.ts               # Toast 通知
    └── useConfirm.ts             # 確認對話框
```

---

## 🧪 測試與除錯

### CSRF Token 問題排查

如果遇到 403 錯誤：

1. 檢查瀏覽器 Cookie 是否包含 `csrftoken`
2. 確認 API 呼叫使用 `withCredentials: true`
3. 檢查後端 CORS 設定
4. 手動刷新 Token: `refreshCSRFToken()`

### 認證問題排查

1. 檢查 `localStorage` 中的 `user` 物件
2. 驗證 `/api/protected/` endpoint 回傳 200
3. 確認 Feature Flags 正確載入
4. 清除 localStorage 後重新登入

---

## 🛠️ 效能優化

### Code Splitting

Vite 配置手動分割 chunks：

- `react-vendor`: React 核心庫
- `react-router`: 路由庫
- `lucide-icons`: 圖示庫
- `utils`: Axios、QRCode 工具
- 功能專用 chunks: chat、video、business-card、ai-service

### Lazy Loading

所有頁面元件採用 `React.lazy()` + `Suspense` 延遲載入。

### 資料快取

- Business Card 資料快取於 Context（防止重複 API 呼叫）
- Feature Flags 每個 Session 只載入一次

---

## 📚 相關文件

- [環境變數設定指南](./ENV_SETUP.md)
- [登入系統實作說明](./LOGIN_SETUP.md)
- [第三方 OAuth 設定](./THIRD_PARTY_AUTH_SETUP.md)
- [Claude AI 開發指引](./CLAUDE.md)

---

## 🤝 貢獻指南

歡迎提交 Issue 或 Pull Request！

### 開發流程

1. Fork 本專案
2. 建立功能分支: `git checkout -b feature/amazing-feature`
3. 提交變更: `git commit -m 'Add amazing feature'`
4. 推送分支: `git push origin feature/amazing-feature`
5. 開啟 Pull Request

### 程式碼規範

- 使用 TypeScript 型別標註
- 遵循 ESLint 規則
- 元件命名採用 PascalCase
- 檔案命名與元件名稱一致

---

## 📄 授權

此專案為私有專案，版權所有 © FlashFalcon Dev Team

---

## 📞 聯絡資訊

- **官方網站**: [https://www.flashfalcon.info](https://www.flashfalcon.info)
- **開發環境**: [https://host.flashfalcon.info](https://host.flashfalcon.info)
- **問題回報**: [GitHub Issues](https://github.com/FlashFalconDev/Prepoe/issues)

---

## 🙏 致謝

本專案使用以下開源技術：

- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
- [React Router](https://reactrouter.com/)
- [Axios](https://axios-http.com/)
- [QRCode](https://github.com/soldair/node-qrcode)

---

<div align="center">
  <strong>Built with ❤️ by FlashFalcon Dev Team</strong>
</div>
