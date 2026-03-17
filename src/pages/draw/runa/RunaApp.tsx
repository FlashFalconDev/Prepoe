import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { RunaProvider } from './RunaContext';
import RunaLoadingScreen from './components/RunaLoadingScreen';
import WelcomePage from './WelcomePage';
import StoneSelectionPage from './StoneSelectionPage';
import ReadingPage from './ReadingPage';
import AnalysisPage from './AnalysisPage';
import './runa.css';

// ====== AnimatedRoutes ======

const AnimatedRoutes: React.FC = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/selection" element={<StoneSelectionPage />} />
        <Route path="/reading" element={<ReadingPage />} />
        <Route path="/analysis" element={<AnalysisPage />} />
      </Routes>
    </AnimatePresence>
  );
};

// ====== AppContent (data fetch + LIFF init + loading) ======

const RunaAppContent: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [loadingOpacity, setLoadingOpacity] = useState(1);
  const [welcomeReady, setWelcomeReady] = useState(false);
  useEffect(() => {
    // 預先加載歡迎頁面
    setTimeout(() => {
      setWelcomeReady(true);
      // 開始淡出 loading 頁面
      setTimeout(() => {
        setLoadingOpacity(0);
        // 完全移除 loading 頁面
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      }, 800);
    }, 4000);
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        overflow: 'hidden',
        backgroundColor: '#f8f8f5',
      }}
    >
      {welcomeReady && <AnimatedRoutes />}

      {loading && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100vh',
            zIndex: 1000,
            opacity: loadingOpacity,
            transition: 'opacity 0.8s ease',
          }}
        >
          <RunaLoadingScreen />
        </div>
      )}
    </div>
  );
};

// ====== RunaApp (entry point) ======

const RunaApp: React.FC = () => {
  return (
    <RunaProvider>
      <div className="runa-theme">
        <RunaAppContent />
      </div>
    </RunaProvider>
  );
};

export default RunaApp;
