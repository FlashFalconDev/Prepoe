import React from 'react';
import { Routes, Route } from 'react-router-dom';
import RunaApp from './runa/RunaApp';

/**
 * DrawRoutes - 抽卡系統路由
 *
 * 目前功能：
 *   /draw/runa/*  → 北歐符文抽卡 (RunaApp)
 *
 * 未來擴充：
 *   /draw/tarot/* → 塔羅牌抽卡
 *   /draw/oracle/* → 神諭卡抽卡
 */
const DrawRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="runa/*" element={<RunaApp />} />
      {/* 未來抽卡功能在此新增 */}
    </Routes>
  );
};

export default DrawRoutes;
