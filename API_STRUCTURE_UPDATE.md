# API 數據結構更新

## 新的 emotion_stats 結構

你優化了 API 返回的數據結構，更清晰易懂！

### 新結構：
```json
"emotion_stats": {
    "recent_average_emotion": -1.0,           // 最近訊息的平均情緒
    "recent_average_urgency": 9.0,            // 最近訊息的平均緊急度
    "recent_average_sales_opportunities": 6.0, // 最近訊息的平均銷售機會
    "recent_message_count": 1,                // 最近訊息數量
    "last_emotion": -1,                       // 最後一條有情緒標註的訊息情緒
    "last_urgency": 9,                        // 最後一條有情緒標註的訊息緊急度
    "last_sales_opportunities": 6,            // 最後一條有情緒標註的訊息銷售機會
    "last_emotion_at": "2025-10-16T03:09:18.154Z" // 最後情緒標註時間
}
```

## 前端邏輯調整

### 1. 情緒顯示
```typescript
// 使用最近平均情緒
displayEmotion = Math.round(recent_average_emotion)

你的案例:
recent_average_emotion: -1.0
→ displayEmotion: -1
→ 顯示: [橙色] 😟 失望
```

### 2. 緊急程度
```typescript
// 使用最近平均緊急度
avgUrgency = recent_average_urgency

你的案例:
recent_average_urgency: 9.0
avgUrgency >= 8 → true
→ 顯示: [🚨 緊急] 紅底白字 pulse
```

### 3. 銷售機會
```typescript
// 使用最近平均銷售機會
avgSalesOpportunity = recent_average_sales_opportunities

你的案例:
recent_average_sales_opportunities: 6.0
avgSalesOpportunity >= 6 → true
→ 顯示: [💰 商機] 紫色標籤
```

### 4. 情緒趨勢
```typescript
// 比較最後情緒和平均情緒
trend = last_emotion - recent_average_emotion

你的案例:
last_emotion: -1
recent_average_emotion: -1.0
trend = -1 - (-1.0) = 0
|trend| < 1 → 不顯示趨勢標籤 ✓
```

## 你的案例分析

### Ethan Lee的對話（16則訊息）

**API 數據：**
```json
{
  "recent_average_emotion": -1.0,
  "recent_average_urgency": 9.0,
  "recent_average_sales_opportunities": 6.0,
  "last_emotion": -1,
  "last_urgency": 9,
  "last_sales_opportunities": 6
}
```

**前端顯示：**
```
┌────────────────────────────────────┐
│ [橙色] 😟 失望                      │
│ [🚨 緊急] [💰 商機] [💬 16]         │
│ Ethan Lee的對話                    │
│ 好喔，目前我們的親子房型...        │
└────────────────────────────────────┘
```

**解析：**
- ✅ 情緒色塊：橙色 😟（emotion: -1）
- ✅ 情緒文字：「失望」
- ✅ 緊急標籤：顯示 [🚨 緊急]（urgency: 9）
- ✅ 商機標籤：顯示 [💰 商機]（sales: 6）
- ✅ 趨勢標籤：不顯示（trend: 0）

## 趨勢判斷案例

### 案例1：客戶情緒轉好
```json
{
  "recent_average_emotion": -1.0,  // 平均失望
  "last_emotion": 1                // 最後禮貌
}

trend = 1 - (-1) = +2
→ 顯示 [↗ 轉好] ✓
```

### 案例2：客戶情緒轉差
```json
{
  "recent_average_emotion": 0,   // 平均中性
  "last_emotion": -3             // 最後不滿
}

trend = -3 - 0 = -3
→ 顯示 [↘ 轉差] ✓
```

### 案例3：情緒穩定（你的案例）
```json
{
  "recent_average_emotion": -1.0,
  "last_emotion": -1
}

trend = -1 - (-1) = 0
|trend| < 1
→ 不顯示趨勢標籤 ✓
```

## 命名優勢

### 改前（舊結構）：
```json
{
  "average_emotion": -1.0,
  "max_urgency": 9,
  "min_emotion": -1,
  "max_emotion": -1
}
```
→ 不清楚是全部歷史還是最近

### 改後（新結構）：
```json
{
  "recent_average_emotion": -1.0,  // 明確：最近平均
  "last_emotion": -1               // 明確：最後一條
}
```
→ 語義清晰！

## 前端代碼調整

### 使用 recent_average_*
```typescript
// 情緒
displayEmotion = Math.round(recent_average_emotion)

// 緊急度
avgUrgency = recent_average_urgency
isUrgent = avgUrgency >= 8

// 銷售機會
avgSalesOpportunity = recent_average_sales_opportunities
hasSalesOpportunity = avgSalesOpportunity >= 6
```

### 使用 last_emotion 計算趨勢
```typescript
trend = last_emotion - recent_average_emotion

if (|trend| >= 1) {
  顯示 [↗ 轉好] 或 [↘ 轉差]
}
```

## 代碼位置

- 數據使用: [`src/pages/Chat.tsx:1431-1442`](src/pages/Chat.tsx:1431-1442)
- 趨勢計算: [`src/pages/Chat.tsx:1573-1592`](src/pages/Chat.tsx:1573-1592)

## 測試結果

**刷新瀏覽器** http://localhost:3007

第一個對話應該顯示：
- ✅ [橙色] 😟 失望（-1）
- ✅ [🚨 緊急]（urgency: 9）
- ✅ [💰 商機]（sales: 6）
- ✅ 無趨勢標籤（trend: 0）

**完美！API 結構更清晰，前端邏輯正確！** 🎯
