# 活動設定系統使用說明

## 📋 概述

活動設定系統是一個完整的活動管理平台，提供活動模組管理、活動資訊管理、報名管理和統計分析等功能。系統完全按照後端 API 文件設計，支援所有必要的 CRUD 操作。

## 🚀 功能特色

### 1. 活動管理
- **建立活動**: 支援完整的活動資訊設定，包括名稱、描述、時間、參與人數限制等
- **編輯活動**: 可修改現有活動的所有資訊
- **刪除活動**: 安全刪除活動，支援確認對話框
- **搜尋篩選**: 支援按名稱、描述搜尋，按模組類型篩選

### 2. 模組管理
- **活動模組**: 支援抽獎活動、問卷調查、遊戲活動等不同類型
- **參數設定**: 可設定參與人數限制、答案檢查等參數
- **模組關聯**: 活動可關聯多個模組，實現複雜的活動流程

### 3. 報名管理
- **報名記錄**: 查看和管理所有活動報名
- **狀態管理**: 支援待付款、已付款、已取消等狀態
- **參與者管理**: 管理個別參與者資訊

### 4. 統計分析
- **活動統計**: 查看報名人數、付款狀態、收入等關鍵指標
- **模組統計**: 各模組的參與者數量統計
- **報到率**: 實際報到人數與報名人數的比率

## 🛠️ 技術架構

### 前端技術
- **React 18**: 使用最新的 React 功能
- **TypeScript**: 完整的類型安全
- **Tailwind CSS**: 現代化的 UI 設計
- **Lucide React**: 高品質的圖標庫

### 狀態管理
- **React Hooks**: 使用 useState、useEffect 等現代 React 模式
- **自定義 Hooks**: 封裝了 toast 通知和確認對話框邏輯

### API 整合
- **Axios**: HTTP 客戶端，支援攔截器和錯誤處理
- **統一錯誤處理**: 標準化的錯誤訊息格式
- **數據驗證**: 前端表單驗證，確保數據完整性

## 📁 文件結構

```
src/
├── pages/
│   └── ActivitySettings.tsx          # 主要活動設定頁面
├── services/
│   └── eventService.ts               # 活動相關 API 服務
└── components/
    ├── ConfirmDialog.tsx             # 確認對話框組件
    └── ...
```

## 🔧 安裝與設定

### 1. 環境變數
在 `.env` 文件中設定 API 基礎 URL：

```bash
REACT_APP_API_BASE_URL=https://your-api-domain.com
```

### 2. 依賴安裝
```bash
npm install axios lucide-react
```

### 3. 路由設定
在 `App.tsx` 或路由配置中添加：

```tsx
import ActivitySettings from './pages/ActivitySettings';

// 在路由中添加
<Route path="/activity-settings" element={<ActivitySettings />} />
```

## 📖 使用指南

### 1. 建立活動模組

1. 點擊「模組管理」標籤頁
2. 點擊「建立模組」按鈕
3. 填寫模組資訊：
   - 模組名稱
   - 模組類型（抽獎活動、問卷調查、遊戲活動）
   - 參與人數限制
   - 是否啟用答案檢查
4. 點擊「建立」按鈕

### 2. 建立活動

1. 點擊「活動管理」標籤頁
2. 點擊「建立活動」按鈕
3. 填寫活動資訊：
   - 活動名稱和描述
   - 開始和結束時間
   - 參與人數限制
   - 單價設定
   - 是否啟用報到功能
4. 點擊「建立」按鈕

### 3. 管理活動

- **編輯**: 點擊活動卡片右上角的編輯圖標
- **刪除**: 點擊刪除圖標，確認後刪除
- **搜尋**: 使用搜尋框按名稱或描述搜尋
- **篩選**: 使用下拉選單按模組類型篩選

### 4. 查看統計

1. 點擊「統計分析」標籤頁
2. 選擇要查看的活動
3. 查看詳細的統計資訊

## 🔌 API 整合

### 1. 活動模組 API

```typescript
// 獲取模組列表
const modules = await eventModuleAPI.getModules();

// 建立模組
const newModule = await eventModuleAPI.createModule({
  name: '抽獎活動',
  module_type: 'Lottery',
  min_participants: 1,
  max_participants: 100,
  is_check_answer: true
});

// 更新模組
const updatedModule = await eventModuleAPI.updateModule(moduleId, moduleData);

// 刪除模組
await eventModuleAPI.deleteModule(moduleId);
```

### 2. 活動 API

```typescript
// 獲取活動列表
const events = await eventAPI.getEvents();

// 建立活動
const newEvent = await eventAPI.createEvent({
  name: '週年慶活動',
  description: '慶祝週年慶的特別活動',
  start_time: '2024-01-01T10:00:00+08:00',
  end_time: '2024-01-01T18:00:00+08:00',
  // ... 其他參數
});

// 更新活動
const updatedEvent = await eventAPI.updateEvent(eventId, eventData);

// 刪除活動
await eventAPI.deleteEvent(eventId);

// 獲取統計資訊
const statistics = await eventAPI.getEventStatistics(eventId);
```

### 3. 錯誤處理

```typescript
try {
  const response = await eventAPI.createEvent(eventData);
  if (response.success) {
    // 處理成功響應
  } else {
    // 處理業務邏輯錯誤
    showError('操作失敗', response.message);
  }
} catch (error) {
  // 處理網絡錯誤或服務器錯誤
  const errorMessage = handleEventAPIError(error);
  showError('操作失敗', errorMessage);
}
```

## 🎨 自定義與擴展

### 1. 添加新的模組類型

在 `eventService.ts` 中添加新的模組類型：

```typescript
export interface EventModule {
  // ... 現有屬性
  module_type: 'Lottery' | 'Survey' | 'Game' | 'NewType';
}
```

### 2. 自定義表單驗證

在 `eventService.ts` 中擴展驗證規則：

```typescript
export const validateEventData = (eventData: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // 現有驗證規則
  // ...
  
  // 添加新的驗證規則
  if (eventData.custom_field && eventData.custom_field.length < 5) {
    errors.push('自定義欄位長度不能少於 5 個字符');
  }
  
  return { isValid: errors.length === 0, errors };
};
```

### 3. 添加新的統計指標

在統計分析標籤頁中添加新的統計項目：

```typescript
// 在 ActivitySettings.tsx 中添加新的統計顯示
{statistics && (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {/* 現有統計項目 */}
    <div className="bg-white p-4 rounded-lg">
      <div className="text-2xl font-bold text-primary-600">
        {statistics.total_registrations}
      </div>
      <div className="text-sm text-gray-600">總報名數</div>
    </div>
    
    {/* 新的統計項目 */}
    <div className="bg-white p-4 rounded-lg">
      <div className="text-2xl font-bold text-green-600">
        {statistics.custom_metric}
      </div>
      <div className="text-sm text-gray-600">自定義指標</div>
    </div>
  </div>
)}
```

## 🐛 故障排除

### 1. API 連接問題

**症狀**: 無法載入數據，顯示網絡錯誤
**解決方案**:
- 檢查 `.env` 文件中的 API URL 設定
- 確認後端服務是否正常運行
- 檢查網絡連接和防火牆設定

### 2. 認證問題

**症狀**: API 調用返回 401 錯誤
**解決方案**:
- 確認用戶已登入
- 檢查認證 token 是否有效
- 重新登入獲取新的 token

### 3. 表單驗證問題

**症狀**: 表單無法提交，顯示驗證錯誤
**解決方案**:
- 檢查所有必填欄位是否已填寫
- 確認時間格式是否正確
- 檢查數值欄位是否在有效範圍內

### 4. 圖片上傳問題

**症狀**: 圖片無法上傳
**解決方案**:
- 確認圖片格式支援（JPG, PNG, GIF）
- 檢查圖片大小是否超過限制
- 確認上傳權限設定

## 📱 響應式設計

系統完全支援響應式設計，在不同螢幕尺寸下都能提供良好的使用體驗：

- **桌面版**: 完整功能，多欄位佈局
- **平板版**: 適中的佈局，保持主要功能
- **手機版**: 單欄佈局，優化觸控操作

## 🔒 安全性考量

### 1. 輸入驗證
- 前端表單驗證防止無效數據提交
- 後端 API 驗證確保數據完整性
- XSS 防護，所有用戶輸入都經過適當處理

### 2. 權限控制
- 基於用戶角色的功能訪問控制
- API 端點認證和授權
- 敏感操作的確認對話框

### 3. 數據保護
- HTTPS 加密傳輸
- 敏感數據不存儲在前端
- 定期清理臨時數據

## 📈 性能優化

### 1. 數據載入
- 分頁載入大量數據
- 懶載入非關鍵功能
- 緩存常用數據

### 2. 用戶體驗
- 載入狀態指示器
- 錯誤訊息友好化
- 操作成功反饋

### 3. 代碼優化
- 組件懶載入
- 記憶化計算結果
- 減少不必要的重新渲染

## 🤝 貢獻指南

### 1. 代碼風格
- 使用 TypeScript 嚴格模式
- 遵循 React 最佳實踐
- 使用 Tailwind CSS 工具類

### 2. 測試
- 為新功能添加單元測試
- 確保現有功能正常運行
- 測試不同瀏覽器兼容性

### 3. 文檔
- 更新相關的 README 文件
- 添加代碼註釋
- 更新 API 文檔

## 📞 技術支援

如果您在使用過程中遇到任何問題，請：

1. 檢查本文檔的故障排除部分
2. 查看瀏覽器控制台的錯誤訊息
3. 聯繫開發團隊或查看系統日誌
4. 提交 issue 到專案倉庫

## 📄 授權

本專案採用 MIT 授權條款，詳情請參見 LICENSE 文件。

---

**版本**: 1.0.0  
**最後更新**: 2024年1月  
**維護者**: 開發團隊
