/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly MODE: string
  // 第三方登入配置
  readonly VITE_GOOGLE_CLIENT_ID: string
  readonly VITE_LINE_CLIENT_ID: string
  readonly VITE_FACEBOOK_APP_ID: string
  readonly VITE_APPLE_CLIENT_ID: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_URL: string
  /** 金幣顯示名稱，例如 金幣、AIYA幣（未設時預設「金幣」） */
  readonly VITE_COIN_LABEL?: string
  // 更多环境变量...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
