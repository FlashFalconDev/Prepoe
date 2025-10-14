import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { getCSRFToken } from './config/api'

// 在應用啟動時預先獲取CSRF token
const initializeApp = async () => {
  try {
    console.log('初始化應用，獲取CSRF token...');
    await getCSRFToken();
    console.log('CSRF token初始化完成');
  } catch (error) {
    console.warn('CSRF token初始化失敗，將在需要時重試:', error);
  }
  
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
};

initializeApp();