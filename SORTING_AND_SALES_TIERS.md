# 排序功能與銷售機會分級

## 功能概覽

為客服對話列表新增了兩個重要功能：
1. **多維度排序** - 按時間、情緒、緊急度、銷售機會排序
2. **銷售機會分級** - 從二元顯示改為三級分類

## 1. 排序按鈕系統

### 視覺設計

在對話列表上方新增了排序按鈕列：

```
排序： [時間] [😡 情緒] [🚨 緊急] [💰 銷售]
```

### 按鈕狀態

**啟用狀態** - 有顏色背景：
- 時間：藍色底 `bg-blue-500 text-white`
- 情緒：紅色底 `bg-red-500 text-white`
- 緊急：橙色底 `bg-orange-500 text-white`
- 銷售：紫色底 `bg-purple-500 text-white`

**非啟用狀態** - 灰色底：
- `bg-gray-100 text-gray-700 hover:bg-gray-200`

### 排序邏輯

```typescript
// 未讀訊息永遠優先（跨所有排序模式）
if (aUnread !== bUnread) return bUnread - aUnread;

// 根據選擇的排序方式
switch (sortBy) {
  case 'emotion':
    // 負面情緒在前（升序）
    return aEmotion - bEmotion;
    // -5 → -3 → -1 → 0 → 1 → 3 → 5

  case 'urgency':
    // 緊急在前（降序）
    return bUrgency - aUrgency;
    // 10 → 9 → 8 → ... → 1 → 0

  case 'sales':
    // 高商機在前（降序）
    return bSales - aSales;
    // 10 → 9 → 8 → ... → 1 → 0

  case 'time':
  default:
    // 最新在前（降序）
    return bTime.localeCompare(aTime);
}
```

### 優先級規則

**第一優先：未讀訊息**
- 所有有未讀訊息的對話永遠排在最前面
- 不論選擇哪種排序模式

**第二優先：選擇的排序方式**
- 情緒排序：最負面的在前（方便客服優先處理不滿客戶）
- 緊急排序：最緊急的在前
- 銷售排序：最高商機在前
- 時間排序：最新的在前（預設）

## 2. 銷售機會分級系統

### 改前 ❌

二元顯示（有或無）：
```typescript
{hasSalesOpportunity && (
  <span className="...">💰 商機</span>
)}
```

### 改後 ✅

三級分類：

**高商機** - 分數 >= 8
```
[💰💰 高商機]
bg-purple-500 text-white font-bold
紫色底、白字、加粗
```

**中商機** - 分數 >= 5
```
[💰 中商機]
bg-purple-100 text-purple-800
淺紫底、深紫字
```

**低商機** - 分數 >= 3
```
[💵 低商機]
bg-purple-50 text-purple-600
極淺紫底、紫字
```

**無商機** - 分數 < 3
```
不顯示標籤
```

### 分級邏輯

```typescript
const avgSalesOpportunity = session.emotion_stats?.recent_average_sales_opportunities || 0;

const salesLevel = avgSalesOpportunity >= 8 ? 'high' :
                   avgSalesOpportunity >= 5 ? 'medium' :
                   avgSalesOpportunity >= 3 ? 'low' :
                   null;
```

### 視覺差異

**高商機** - 非常顯眼：
- 實心紫色背景
- 白色文字
- 加粗字體
- 雙💰符號

**中商機** - 中等顯眼：
- 淡紫色背景
- 深紫色文字
- 單💰符號

**低商機** - 輕微顯眼：
- 極淡紫色背景
- 紫色文字
- 💵符號（不同於💰）

## 3. 實際應用場景

### 場景1：優先處理不滿客戶

**客服操作：**
1. 點擊 [😡 情緒] 按鈕
2. 列表自動排序：最負面情緒在最前
3. 快速識別需要緊急處理的客戶

**排序結果示例：**
```
1. [紅色閃爍] 😡 極度不滿 [🚨 緊急] - Ethan
2. [紅色] 😠 不滿 [高優先] - Mary
3. [橙色] 😟 失望 [💰 中商機] - John
4. [灰色] 😐 中性 - Lisa
...
```

### 場景2：追蹤高價值客戶

**客服操作：**
1. 點擊 [💰 銷售] 按鈕
2. 列表自動排序：高商機在最前
3. 優先跟進有購買意向的客戶

**排序結果示例：**
```
1. [綠色] 😀 禮貌 [💰💰 高商機] - David (sales: 9)
2. [橙色] 😟 失望 [💰💰 高商機] - Ethan (sales: 8)
3. [灰色] 😐 中性 [💰 中商機] - Sarah (sales: 6)
4. [綠色] 🙂 滿意 [💵 低商機] - Tom (sales: 4)
...
```

### 場景3：處理緊急案件

**客服操作：**
1. 點擊 [🚨 緊急] 按鈕
2. 列表自動排序：最緊急在最前
3. 立即處理高緊急度客戶

**排序結果示例：**
```
1. [橙色] 😟 失望 [🚨 緊急] - Ethan (urgency: 9)
2. [紅色] 😠 不滿 [🚨 緊急] - Mary (urgency: 8)
3. [灰色] 😐 中性 [高優先] - John (urgency: 7)
...
```

### 場景4：處理最新訊息

**客服操作：**
1. 點擊 [時間] 按鈕（預設）
2. 列表按時間排序：最新在前
3. 依照訊息到達順序處理

## 4. 代碼位置

### 排序狀態管理
**檔案**: [src/pages/Chat.tsx:217-218](src/pages/Chat.tsx#L217-L218)
```typescript
// 排序狀態
const [sortBy, setSortBy] = useState<'time' | 'emotion' | 'urgency' | 'sales'>('time');
```

### 排序按鈕 UI
**檔案**: [src/pages/Chat.tsx:1412-1448](src/pages/Chat.tsx#L1412-L1448)

### 排序邏輯
**檔案**: [src/pages/Chat.tsx:1451-1477](src/pages/Chat.tsx#L1451-L1477)

### 銷售機會分級
**檔案**: [src/pages/Chat.tsx:1485-1487](src/pages/Chat.tsx#L1485-L1487)
```typescript
const avgSalesOpportunity = session.emotion_stats?.recent_average_sales_opportunities || 0;
const salesLevel = avgSalesOpportunity >= 8 ? 'high' :
                   avgSalesOpportunity >= 5 ? 'medium' :
                   avgSalesOpportunity >= 3 ? 'low' : null;
```

### 銷售標籤顯示
**檔案**: [src/pages/Chat.tsx:1668-1679](src/pages/Chat.tsx#L1668-L1679)

## 5. 資料來源

所有資料都從 API 返回的 `emotion_stats` 取得：

```json
{
  "emotion_stats": {
    "recent_average_emotion": -1.0,      // 用於情緒排序和顯示
    "recent_average_urgency": 9.0,       // 用於緊急度排序
    "recent_average_sales_opportunities": 6.0,  // 用於銷售排序和分級
    "recent_message_count": 1,
    "last_emotion": -1,
    "last_urgency": 9,
    "last_sales_opportunities": 6,
    "last_emotion_at": "2025-10-16T03:09:18.154Z"
  }
}
```

## 6. 使用者體驗優化

### 視覺反饋
- ✅ 按鈕顏色明確指示當前排序方式
- ✅ 滑鼠 hover 時非啟用按鈕會變色（灰色→淺灰色）
- ✅ 銷售分級用不同深度的紫色表示重要性

### 排序穩定性
- ✅ 未讀訊息永遠在最前（跨所有排序模式）
- ✅ 排序條件相同時保持原有順序

### 效能考量
- ✅ 排序在記憶體中完成（`.sort()`）
- ✅ 不需要重新請求 API
- ✅ 狀態切換即時反應（無延遲）

## 7. 測試步驟

### 測試排序功能

1. **開啟頁面** http://localhost:3007
2. **進入客服對話**標籤
3. **測試時間排序**（預設）：
   - 確認最新訊息在最前
4. **測試情緒排序**：
   - 點擊 [😡 情緒] 按鈕
   - 確認按鈕變紅色
   - 確認負面情緒對話在最前
5. **測試緊急排序**：
   - 點擊 [🚨 緊急] 按鈕
   - 確認按鈕變橙色
   - 確認高緊急度對話在最前
6. **測試銷售排序**：
   - 點擊 [💰 銷售] 按鈕
   - 確認按鈕變紫色
   - 確認高商機對話在最前

### 測試銷售分級

**檢查項目：**
1. ✅ sales >= 8: 顯示 [💰💰 高商機] 紫底白字加粗
2. ✅ sales >= 5: 顯示 [💰 中商機] 淺紫底深紫字
3. ✅ sales >= 3: 顯示 [💵 低商機] 極淺紫底紫字
4. ✅ sales < 3: 不顯示銷售標籤

### 測試未讀優先

**檢查項目：**
1. 不論選擇哪種排序方式
2. 有未讀訊息的對話永遠在最前
3. 藍色邊框和淡藍色背景正確顯示

## 8. 效果總結

✅ **四種排序模式** - 時間、情緒、緊急、銷售
✅ **視覺明確** - 按鈕顏色對應功能（藍/紅/橙/紫）
✅ **未讀優先** - 跨所有排序模式
✅ **銷售分級** - 三級視覺差異（高/中/低）
✅ **即時響應** - 點擊按鈕立即排序
✅ **靈活切換** - 隨時切換不同排序方式

**這套排序系統讓客服人員能夠根據不同情境快速找到需要優先處理的對話！** 🎯
