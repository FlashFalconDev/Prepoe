# 會員狀態顯示更新說明

## 更新日期
2025-10-02

## 更新內容

### 1. 代幣改為金幣
- **位置**：設定頁面 > 用戶統計資料
- **變更**：將「代幣」改為「金幣」
- **數據來源**：從 `member_card.tokens` 改為 `member_card.coins`

### 2. 新增 member_status 顯示區域

在設定頁面新增了完整的會員訂閱狀態顯示，標題為「目前計畫」，包含以下區塊：

#### 訂閱方案資訊
- 方案名稱（如：Provider）
- 自動續訂狀態
- 剩餘天數
- 到期日期

#### Token 餘額
- **顯示順序**：訂閱 → 加購 → 總剩餘
- 右上角有圖表圖標按鈕，點擊可查看使用記錄

#### 待處理變更（條件顯示）
- 僅在有待處理變更時顯示
- 顯示目標方案和生效日期

### 3. 使用記錄彈窗
- 點擊 Token 餘額區塊右上角的圖表圖標開啟
- 以彈窗形式顯示所有使用記錄
- 每筆記錄包含：
  - 使用類型（帶圖標）
  - Token 數量
  - 完整時間戳記（年月日時分秒）
- 支援滾動查看所有記錄
- 無記錄時顯示空狀態提示

## API 響應結構

```json
{
    "success": true,
    "message": "完整會員資料獲取成功",
    "data": {
        "member_card": {
            "id": 9492,
            "card_id": "9492F",
            "exp": 0,
            "points": 0,
            "coins": 100,
            "tokens": 0,
            "mdt_add": "2025-08-23T02:02:37.993243+00:00",
            "client_info": {
                "id": 106,
                "name": null
            },
            "member_info": {
                "id": 8,
                "name": "Ethan Lee"
            }
        },
        "member_details": {
            "id": 5839,
            "nick_name": "EthanLee",
            "email": "ethanlee1101@gmail.com",
            "phone": "0939392188",
            "birthday": "1979-11-01",
            "gender": "male",
            "address": "林森路69號6F",
            "mdt_add": "2025-09-08T14:44:02.871752+00:00",
            "created": false
        },
        "member_status": {
            "success": true,
            "data": {
                "subscription": {
                    "plan": "Provider",
                    "start_at": "2025-09-30T21:29:40.544408+00:00",
                    "end_at": "2025-10-30T21:29:40.544408+00:00",
                    "days_left": 28,
                    "auto_renew": true
                },
                "balance": {
                    "total_remaining": 108,
                    "subscription": 0,
                    "addon": 108
                },
                "pending_change": {
                    "has_pending": false,
                    "target_plan": null,
                    "effective_at": null
                },
                "recent_usage": [
                    {
                        "kind": "chat",
                        "tokens": 46,
                        "created_at": "2025-10-02T20:55:54.750119+00:00"
                    }
                ]
            }
        }
    }
}
```

## TypeScript 介面定義

### 會員訂閱狀態
```typescript
export interface MemberSubscription {
  plan: string;
  start_at: string;
  end_at: string;
  days_left: number;
  auto_renew: boolean;
}
```

### 會員餘額
```typescript
export interface MemberBalance {
  total_remaining: number;
  subscription: number;
  addon: number;
}
```

### 待處理變更
```typescript
export interface MemberPendingChange {
  has_pending: boolean;
  target_plan: string | null;
  effective_at: string | null;
}
```

### 最近使用記錄
```typescript
export interface MemberRecentUsage {
  kind: string;
  tokens: number;
  created_at: string;
}
```

### 會員狀態
```typescript
export interface MemberStatus {
  success: boolean;
  data: {
    subscription: MemberSubscription;
    balance: MemberBalance;
    pending_change: MemberPendingChange;
    recent_usage: MemberRecentUsage[];
  };
}
```

### 完整會員資料
```typescript
export interface MemberComplete {
  member_card: MemberCard;
  member_details: MemberDetails;
  member_status?: MemberStatus | null;  // 可選，支援 null
}
```

## 例外處理

### member_status 可能為 null
使用可選鏈接運算符處理：
```typescript
{memberData.member_status?.success && memberData.member_status.data && (
  // 顯示訂閱狀態
)}
```

### 待處理變更條件顯示
```typescript
{memberData.member_status.data.pending_change.has_pending && (
  // 只在有待處理變更時顯示
)}
```

### 日期可能為 null
```typescript
{memberData.member_status.data.pending_change.effective_at ? 
  new Date(memberData.member_status.data.pending_change.effective_at).toLocaleDateString('zh-TW') : 
  '未知日期'}
```

## UI 設計特點

1. **分層次的視覺設計**
   - 訂閱方案：橘色漸層背景
   - Token 餘額：藍色背景，右上角有圖表圖標按鈕
   - 待處理變更：黃色背景（警告色）
   - 使用記錄彈窗：灰色卡片背景，hover 效果

2. **響應式佈局**
   - 使用 Grid 佈局適應不同螢幕尺寸
   - 卡片式設計提升可讀性
   - 彈窗最大寬度 lg，最大高度 90vh

3. **視覺標記**
   - 使用 Lucide 圖標增強辨識度
   - 狀態標籤清晰標示（自動續訂/手動續訂）
   - Token 餘額區塊右上角的圖表圖標可點擊

4. **數據格式化**
   - 日期使用繁體中文格式
   - 數字使用千位分隔符
   - 使用記錄彈窗內顯示完整時間（年月日時分秒）

5. **互動設計**
   - 圖表圖標 hover 時有藍色背景
   - 使用記錄項目 hover 時背景變深
   - 彈窗背景半透明黑色遮罩
   - 支援點擊遮罩或關閉按鈕關閉彈窗

## 相關檔案

- `src/config/api.ts` - API 介面定義
- `src/pages/Settings.tsx` - 設定頁面實現
- `src/contexts/AuthContext.tsx` - 認證上下文

## 實作細節

### 狀態管理
```typescript
const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
```

### Token 餘額區塊
```tsx
<div className="flex items-center justify-between mb-3">
  <div className="flex items-center gap-2">
    <Coins size={20} className="text-blue-500" />
    <span className="font-semibold text-gray-900">Token 餘額</span>
  </div>
  <button
    onClick={() => setIsUsageModalOpen(true)}
    className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors"
    title="查看使用記錄"
  >
    <BarChart3 size={18} className="text-blue-600" />
  </button>
</div>
```

### 使用記錄彈窗結構
- 固定標題列（sticky top）
- 可滾動內容區
- 固定底部按鈕（sticky bottom）
- 支援點擊背景遮罩關閉（暫未實作）

## 測試要點

1. 確認 member_status 為 null 時不會崩潰
2. 確認待處理變更只在 has_pending 為 true 時顯示
3. 確認日期格式正確顯示
4. 確認金幣數值來自 coins 欄位
5. 確認 Token 餘額順序：訂閱 → 加購 → 總剩餘
6. 確認圖表圖標可點擊開啟彈窗
7. 確認使用記錄彈窗顯示所有記錄
8. 確認彈窗可正常關閉
9. 確認無使用記錄時顯示空狀態



