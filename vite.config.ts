import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => {
  // 載入環境變數
  const env = loadEnv(mode, process.cwd(), '');
  
  // 統一使用根目錄
  const base = '/';
  
  return {
    plugins: [
      react(),
      // 動態替換 HTML 中的環境變數
      {
        name: 'html-transform',
        transformIndexHtml(html) {
          return html.replace(
            /<title>(.*?)<\/title>/,
            `<title>${env.VITE_APP_NAME || 'Prepoe'}</title>`
          );
        },
      },
    ],
    base: base,
    resolve: {
      alias: {
        '@': '/src',
      },
    },
    server: {
      port: 3000,
      open: true,
    },
    define: {
      'process.env': {}
    },
    // 環境變數配置
    envPrefix: 'VITE_',
    build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React 相關
          'react-vendor': ['react', 'react-dom'],
          'react-router': ['react-router-dom'],
          
          // UI 圖標庫
          'lucide-icons': ['lucide-react'],
          
          // 工具庫
          'utils': ['axios', 'qrcode'],
          
          // 大型頁面組件
          'chat-pages': [
            './src/pages/Chat.tsx',
            './src/pages/user/UserChat.tsx'
          ],
          'video-pages': [
            './src/pages/Video.tsx',
            './src/pages/Article.tsx'
          ],
          'business-card-pages': [
            './src/pages/CloudBusinessCard.tsx',
            './src/pages/BusinessCardEditForm.tsx'
          ],
          'ai-service-pages': [
            './src/pages/AIServiceManagement.tsx',
            './src/pages/AIAssistantForm.tsx'
          ]
        }
      }
    },
    // 增加 chunk 大小警告限制
    chunkSizeWarningLimit: 1000
  }
  };
});
