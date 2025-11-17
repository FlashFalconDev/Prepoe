
import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { BusinessCardProvider } from './contexts/BusinessCardContext';
import ToastProvider from './components/ToastContainer';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import FeatureGate from './components/FeatureGate';

// 立即載入的核心組件
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import HomePage from './pages/HomePage';
import BusinessCardView from './pages/BusinessCardView';

// 懶載入大型組件
const CloudBusinessCard = React.lazy(() => import('./pages/CloudBusinessCard'));
const BusinessCardEditForm = React.lazy(() => import('./pages/BusinessCardEditForm'));
const Assistants = React.lazy(() => import('./pages/Assistants'));
const Creator = React.lazy(() => import('./pages/Creator'));
const VideoCreation = React.lazy(() => import('./pages/VideoCreation'));
const Audio = React.lazy(() => import('./pages/Audio'));
const Article = React.lazy(() => import('./pages/Article'));
const Chat = React.lazy(() => import('./pages/Chat'));
const Settings = React.lazy(() => import('./pages/Settings'));
const ActivitySettings = React.lazy(() => import('./pages/ActivitySettings'));
const SurveyStatistics = React.lazy(() => import('./pages/SurveyStatistics'));
const AIServiceManagement = React.lazy(() => import('./pages/AIServiceManagement'));
const AIAssistantForm = React.lazy(() => import('./pages/AIAssistantForm'));
const DocumentForm = React.lazy(() => import('./pages/DocumentForm'));
const DocumentList = React.lazy(() => import('./pages/DocumentList'));
const PrivateDomain = React.lazy(() => import('./pages/PrivateDomain'));

// 懶載入商務客戶頁面
const BusinessOverview = React.lazy(() => import('./pages/business/BusinessOverview'));
const BusinessVisitors = React.lazy(() => import('./pages/business/BusinessVisitors'));
const BusinessAccounts = React.lazy(() => import('./pages/business/BusinessAccounts'));
const BusinessUsage = React.lazy(() => import('./pages/business/BusinessUsage'));

// 懶載入使用者頁面
const UserDashboard = React.lazy(() => import('./pages/user/UserDashboard'));
const UserChat = React.lazy(() => import('./pages/user/UserChat'));
const UserMentors = React.lazy(() => import('./pages/user/UserMentors'));
const UserEvent = React.lazy(() => import('./pages/user/UserEvent'));
const UserArticles = React.lazy(() => import('./pages/user/UserArticles'));
const EventJoin = React.lazy(() => import('./pages/user/EventJoin'));
const MentorDetail = React.lazy(() => import('./pages/user/MentorDetail'));
const UserViews = React.lazy(() => import('./pages/user/UserViews'));

// 載入中組件
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
  </div>
);

const basename = '/';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BusinessCardProvider>
          <BrowserRouter basename={basename}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/auth/callback/:provider" element={<AuthCallback />} />
              {/* 公開名片頁面，不需要 Layout */}
              <Route path="/card/:slug" element={<BusinessCardView />} />
              
              {/* 新的首頁 */}
              <Route path="/" element={<HomePage />} />
              
              {/* Provider 路由 - 服務提供者後台 */}
              <Route
                path="/provider/*"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Suspense fallback={<LoadingSpinner />}>
                        <Routes>
                          <Route path="/" element={<FeatureGate feature="namecard_enabled" requirePositive={false}><CloudBusinessCard /></FeatureGate>} />
                          <Route path="/cloud-business-card" element={<FeatureGate feature="namecard_enabled" requirePositive={false}><CloudBusinessCard /></FeatureGate>} />
                          <Route path="/business-card/edit/:tab" element={<BusinessCardEditForm />} />
                          <Route path="/assistants/*" element={<FeatureGate feature="ai_assistant_count"><Assistants /></FeatureGate>}>
                            <Route path="chat" element={<Chat />} />
                          </Route>
                          <Route path="/creator/*" element={<Creator />}>
                            <Route path="video-creation" element={<VideoCreation />} />
                            <Route path="audio" element={<Audio />} />
                            <Route path="article" element={<Article />} />
                          </Route>
                          {/* AI客服管理路由 */}
                          <Route path="/ai-service" element={<AIServiceManagement />} />
                          <Route path="/ai-service/assistants/create" element={<AIAssistantForm />} />
                          <Route path="/ai-service/assistants/edit/:id" element={<AIAssistantForm />} />
                          <Route path="/ai-service/assistants/:assistantId/documents" element={<DocumentList />} />
                          <Route path="/ai-service/assistants/:assistantId/documents/create" element={<DocumentForm />} />
                          
                          <Route path="/customer-service" element={<Chat />} />
                          <Route path="/profile" element={<Settings />} />
                          <Route path="/activity-settings" element={<ActivitySettings />} />
                          <Route path="/survey-statistics" element={<SurveyStatistics />} />
                          <Route path="/private-domain" element={<PrivateDomain />} />
                        </Routes>
                      </Suspense>
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              {/* Client 路由 - 客戶端（原 user 路由） */}
              <Route
                path="/client/*"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Suspense fallback={<LoadingSpinner />}>
                        <Routes>
                          <Route path="/" element={<UserMentors />} />
                          <Route path="/chat" element={<UserChat />} />
                          <Route path="/chat/:sessionId" element={<UserChat />} />
                          <Route path="/mentors" element={<UserMentors />} />
                          <Route path="/provider/:slug" element={<MentorDetail />} />
                          <Route path="/event" element={<UserEvent />} />
                          <Route path="/articles" element={<UserArticles />} />
                          <Route path="/profile" element={<UserDashboard />} />
                          <Route path="/event/join/:sku" element={<EventJoin />} />
                          <Route path="/views" element={<UserViews />} />
                        </Routes>
                      </Suspense>
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* Business 路由 - 商務客戶後台 */}
              <Route
                path="/business/*"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Suspense fallback={<LoadingSpinner />}>
                        <Routes>
                          <Route path="/" element={<BusinessOverview />} />
                          <Route path="/visitors" element={<BusinessVisitors />} />
                          <Route path="/accounts" element={<BusinessAccounts />} />
                          <Route path="/usage" element={<BusinessUsage />} />
                        </Routes>
                      </Suspense>
                    </Layout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </BusinessCardProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
