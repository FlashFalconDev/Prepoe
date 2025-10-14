# AI 模組 model_pk 和 model_sub_pk 使用說明

## 概述

當使用 `create_sound_clone/` API 時，需要傳遞兩個關鍵參數：
- `model_pk`：AI 模組的主鍵
- `model_sub_pk`：AI 模組分支的主鍵

這個文檔說明如何從 AI 模組列表 API 響應中提取並使用這兩個參數。

## API 響應結構範例

```json
{
    "success": true,
    "message": "AI模組列表獲取成功",
    "data": {
        "modules": {
            "t2s": [
                {
                    "6": {
                        "name": "Index-tts2",
                        "branch": [
                            {
                                "pk": 5,
                                "per_unit": 4,
                                "token_per_unit": 1,
                                "rate_type": "per_chars",
                                "limits": {
                                    "max_chars": 10000
                                }
                            }
                        ]
                    }
                }
            ]
        }
    }
}
```

## 參數位置說明

在上述響應中：
- **`model_pk`** 是 **"6"**（作為模組物件的鍵）
- **`model_sub_pk`** 是 **5**（位於 `branch[0].pk`）

## 程式碼實現

### 1. 獲取 AI 模組配置

在 `Audio.tsx` 中，使用 `getAIModules('t2s')` 獲取音頻相關的 AI 模組：

```typescript
const loadAIModuleConfig = async () => {
  try {
    const result = await getAIModules('t2s');
    
    if (result.success && result.data && result.data.modules.t2s) {
      setAiModuleConfig(result.data);
      
      // 提取可用的 T2S 模型
      const models: { id: string; model: any }[] = [];
      result.data.modules.t2s.forEach(item => {
        Object.entries(item).forEach(([id, model]) => {
          // id 就是 model_pk，例如 "6"
          models.push({ id, model });
        });
      });
      
      setAvailableT2SModels(models);
    }
  } catch (error) {
    console.error('載入 AI 模組配置失敗:', error);
  }
};
```

### 2. 調用 create_sound_clone API

使用 `generateAIAudio` 或 `createSoundClone` 函數時，需要傳遞 `model_pk` 和 `model_sub_pk` 參數：

```typescript
// 範例：生成 AI 音頻
const handleGenerateAudio = async () => {
  // ... 驗證邏輯 ...
  
  // 從選擇的 T2S 模型中獲取 model_pk
  const modelPk = selectedT2SModel.id; // 例如 "6"
  
  // 從 branch 中獲取 model_sub_pk
  const branch = selectedT2SModel.model.branch[0];
  const modelSubPk = branch.pk; // 例如 5
  
  // 調用 API，傳遞 model_pk 和 model_sub_pk
  const result = await generateAIAudio(
    title,
    voiceModelId,
    copywritingContent,
    modelPk,      // 傳遞 model_pk
    modelSubPk,   // 傳遞 model_sub_pk
    emotionValues
  );
  
  // 處理結果...
};
```

### 3. API 函數定義

在 `src/config/api.ts` 中：

```typescript
export const createSoundClone = async (
  voiceModelId: number,
  label: string,
  textContent: string,
  modelPk: string,      // AI模組的主鍵
  modelSubPk: number,   // AI模組分支的主鍵
  emotionValues?: {[key: string]: number}
): Promise<ApiResponse> => {
  try {
    const response = await api.post('/aigen/api/create_sound_clone/', {
      voice_model_id: voiceModelId,
      label: label,
      text_content: textContent,
      model_pk: modelPk,          // 傳遞給後端 API
      model_sub_pk: modelSubPk,   // 傳遞給後端 API
      emotion_values: emotionValues || {}
    });
    
    // ...
  }
};

export const generateAIAudio = async (
  title: string,
  voiceModelId: number,
  textContent: string,
  modelPk: string,      // AI模組的主鍵
  modelSubPk: number,   // AI模組分支的主鍵
  emotionValues: {[key: string]: number}
): Promise<ApiResponse> => {
  try {
    const response = await api.post('/aigen/api/create_sound_clone/', {
      voice_model_id: voiceModelId,
      label: title,
      text_content: textContent,
      model_pk: modelPk,          // 傳遞給後端 API
      model_sub_pk: modelSubPk,   // 傳遞給後端 API
      emotion_values: emotionValues
    });
    
    // ...
  }
};
```

## 使用範例

假設用戶選擇了 AI 模組，其中 `model_pk` 為 "6"、`model_sub_pk` 為 5：

```typescript
// 1. 獲取語音模型 ID
const voiceModelId = 123;

// 2. 從選擇的 T2S 模型中獲取 model_pk 和 model_sub_pk
const modelPk = "6";           // 從模組物件的鍵中獲取
const modelSubPk = 5;          // 從 branch[0].pk 中獲取

// 3. 調用 API
const result = await createSoundClone(
  voiceModelId,
  "我的音頻標題",
  "這是要生成的文字內容",
  modelPk,
  modelSubPk,
  { happy: 0.5, calm: 0.5 }
);
```

## 完整的數據流範例

```typescript
// 從 API 響應中提取數據
const apiResponse = {
  "success": true,
  "data": {
    "modules": {
      "t2s": [
        {
          "6": {  // ← 這就是 model_pk
            "name": "Index-tts2",
            "branch": [
              {
                "pk": 5,  // ← 這就是 model_sub_pk
                "per_unit": 4,
                "token_per_unit": 1,
                "rate_type": "per_chars",
                "limits": { "max_chars": 10000 }
              }
            ]
          }
        }
      ]
    }
  }
};

// 提取參數
const modelPk = "6";                                    // 模組鍵
const modelSubPk = apiResponse.data.modules.t2s[0]["6"].branch[0].pk;  // 5

// 使用參數
await generateAIAudio(
  "音頻標題",
  voiceModelId,
  "文字內容",
  modelPk,      // "6"
  modelSubPk,   // 5
  emotionValues
);
```

## 重要說明

1. **model_pk 的數據類型**：`model_pk` 是**字符串類型**（例如 `"6"`），而不是數字
2. **model_sub_pk 的數據類型**：`model_sub_pk` 是**數字類型**（例如 `5`）
3. **必要參數**：`model_pk` 和 `model_sub_pk` 都是必填參數，必須在調用 API 時傳遞
4. **獲取方式**：
   - `model_pk`：從 `getAIModules('t2s')` 返回的數據結構中，通過 `Object.entries()` 提取物件的鍵
   - `model_sub_pk`：從對應模組的 `branch[0].pk` 欄位中獲取
5. **branch 選擇**：當前實現使用第一個 branch（`branch[0]`），如果有多個 branch 選項，需要讓用戶選擇

## 相關檔案

- `src/config/api.ts` - API 函數定義與介面
- `src/pages/Audio.tsx` - 音頻生成頁面實現
- `src/pages/VideoCreation.tsx` - 影片生成頁面（使用 `s2v` 模式）
- `src/pages/Video.tsx` - 影片頁面

## TypeScript 介面定義

```typescript
// AI 模組配置介面
export interface AIModuleBranch {
  pk: number;  // branch 的主鍵，對應 model_sub_pk
  per_unit: number;
  token_per_unit: number;
  rate_type: 'per_chars' | 'per_second';
  branch?: string;
  limits?: {
    max_chars?: number;
  };
}

export interface AIModel {
  name: string;
  branch: AIModuleBranch[];
}
```

## 更新日期

2025-10-02 (新增 model_sub_pk 支援)

