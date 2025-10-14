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
  // 更多环境变量...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
