# 金鑰系統 - 管理員 Tokens 欄位

## 功能說明

當用戶為**公司管理員**（admin 角色）時，在建立金鑰的對話框中會顯示額外的 **Tokens** 欄位，允許管理員為金鑰配置 Tokens 贈送數量。

## 技術實現

### 1. 用戶介面更新

在 `src/contexts/AuthContext.tsx` 中，`User` 介面新增了 `is_superuser` 欄位：

```typescript
interface User {
  id: number;
  username: string;
  email?: string;
  member_card_id?: number;
  is_superuser?: boolean; // 系統管理員標識
}
```

### 2. 金鑰建立組件更新

以下兩個組件已更新以支援管理員的 Tokens 欄位：

#### KeysManagerModal.tsx
- 新增 `userRole` prop 接收用戶角色
- 引入 `useAuth` hook
- 使用 `isAdmin` 判斷：`userRole === 'admin' || user?.is_superuser`
- 根據 `isAdmin` 條件顯示 Tokens 輸入欄位
- 在即時預覽區域顯示 Tokens 數量（僅當是管理員時）

#### KeyBatchCreateModal.tsx
- 新增 `userRole` prop 接收用戶角色
- 引入 `useAuth` hook
- 使用 `isAdmin` 判斷：`userRole === 'admin' || user?.is_superuser`
- 根據 `isAdmin` 條件顯示 Tokens 輸入欄位
- 在即時預覽區域顯示 Tokens 數量（僅當是管理員時）

### 3. PrivateDomain 頁面更新

在 `src/pages/PrivateDomain.tsx` 中：
- 從 `extendClient?.role` 取得用戶在該公司的角色
- 將角色資訊透過 `userRole` prop 傳遞給 `KeysManagerModal`

## 使用方式

### 公司管理員（admin）

1. 以 **admin** 角色登入系統（藍色徽章）
2. 進入「私域經營」頁面
3. 找到您有管理權限的公司，點擊「擴增功能」按鈕
4. 選擇「金鑰設定」
5. 點擊「建立金鑰」標籤
6. 在表單中會看到以下欄位：
   - **批次標題**
   - **Points**
   - **Coins**
   - **Tokens**（僅 admin 可見）
   - **有效天數**
   - **角色設定**
   - 等等
7. 填寫 Tokens 數量並提交

### 其他角色（owner、一般成員等）

其他角色用戶登入時不會看到 Tokens 欄位，只能設定 Points 和 Coins。

## API 支援

後端 API 已支援 `tokens` 欄位在 `KeyBatchCreatePayload` 中：

```typescript
export interface KeyBatchCreatePayload {
  mode: 'unique' | 'event';
  title: string;
  days?: number;
  points?: number;
  coins?: number;
  tokens?: number; // 系統管理員可設定
  // ... 其他欄位
}
```

## 權限判斷邏輯

```typescript
const isAdmin = userRole === 'admin' || user?.is_superuser;
```

Tokens 欄位會在以下任一條件成立時顯示：
1. ✅ 用戶對該公司的角色為 `'admin'`（藍色徽章）
2. ✅ 用戶為系統超級用戶（`user?.is_superuser === true`）

## 角色說明

從 `PrivateDomain` 頁面的角色徽章可以看到不同角色：
- **owner**（擁有者）：綠色徽章，完全權限，**看不到 Tokens 欄位**
- **admin**（管理員）：藍色徽章，管理權限，**可以看到 Tokens 欄位**
- 其他角色：灰色徽章，一般權限，看不到 Tokens 欄位

## 安全性

- Tokens 欄位僅在前端對管理員顯示
- 後端應該同時驗證用戶權限，確保只有管理員可以設定 tokens 值
- 建議在後端 API 中增加角色權限檢查邏輯

## 注意事項

1. 系統需要從 LINE 管理內容 API 正確取得用戶角色資訊
2. 角色資訊應該包含在 `managed_clients` 的 `role` 欄位中
3. 確保 PrivateDomain 頁面正確傳遞 `extendClient?.role` 給 KeysManagerModal

## 測試建議

1. ✅ 以 **admin** 角色登入，驗證可以看到 Tokens 欄位
2. ❌ 以 **owner** 角色登入，驗證**看不到** Tokens 欄位
3. ❌ 以一般成員角色登入，驗證看不到 Tokens 欄位
4. ✅ 提交包含 Tokens 的金鑰，驗證後端正確處理
5. ✅ 驗證即時預覽區域正確顯示 Tokens 數量（僅 admin）

