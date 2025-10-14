// vite.config.ts
// import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';

// export default defineConfig(({ mode }) => {
//   const isDev = mode === 'development';
  
//   return {
//     base: '/',
//     plugins: [react()],
//     resolve: {
//       alias: {
//         '@': '/src',
//       },
//     },
//     server: {
//       // 確保所有路由都返回index.html
//       historyApiFallback: {
//         index: '/index.html'
//       },
//       proxy: {
//         '/api/proxy': {
//           target: 'https://host.flashfalcon.info',
//           changeOrigin: true,
//           rewrite: (path) => path.replace(/^\/api\/proxy/, ''),
//           configure: (proxy, _options) => {
//             proxy.on('error', (err, _req, _res) => {
//               console.log('proxy error', err);
//             });
//             proxy.on('proxyReq', (proxyReq, req, _res) => {
//               console.log('Sending Request to the Target:', req.method, req.url);
//             });
//             proxy.on('proxyRes', (proxyRes, req, _res) => {
//               console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
//             });
//           },
//         },
//         // 添加對所有API路徑的代理
//         '/api': {
//           target: 'https://host.flashfalcon.info',
//           changeOrigin: true,
//           configure: (proxy, _options) => {
//             proxy.on('error', (err, _req, _res) => {
//               console.log('api proxy error', err);
//             });
//           },
//         },
//         '/ai': {
//           target: 'https://host.flashfalcon.info',
//           changeOrigin: true,
//         },
//         '/article': {
//           target: 'https://host.flashfalcon.info',
//           changeOrigin: true,
//         },
//         '/pp': {
//           target: 'https://host.flashfalcon.info',
//           changeOrigin: true,
//         },
//       },
//     },
//   };
// });
