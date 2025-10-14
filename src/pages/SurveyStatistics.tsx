import React, { useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast';
import { AI_COLORS } from '../constants/colors';
import { 
  getSurveyList, 
  getSurveyAnalytics, 
  getSubmissionList,
  Survey,
  SurveyAnalytics,
  Submission
} from '../config/api';

const SurveyStatistics: React.FC = () => {
  const { showSuccess, showError } = useToast();
  
  // 狀態管理
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [analytics, setAnalytics] = useState<SurveyAnalytics | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'surveys' | 'analytics' | 'submissions'>('overview');
  
  // 載入問卷列表
  const loadSurveys = async () => {
    try {
      setLoading(true);
      const response = await getSurveyList(1, 100);
      if (response.success) {
        const surveysData = response.data.surveys;
        if (Array.isArray(surveysData)) {
          setSurveys(surveysData);
        } else {
          setSurveys([]);
        }
      } else {
        showError('載入失敗', response.message);
      }
    } catch (error: any) {
      showError('載入失敗', error.message || '未知錯誤');
    } finally {
      setLoading(false);
    }
  };

  // 載入問卷分析
  const loadAnalytics = async (surveyId: number) => {
    try {
      const response = await getSurveyAnalytics(surveyId);
      if (response.success) {
        setAnalytics(response.data);
      } else {
        showError('載入分析失敗', response.message);
      }
    } catch (error: any) {
      showError('載入分析失敗', error.message || '未知錯誤');
    }
  };

  // 載入提交記錄
  const loadSubmissions = async (surveyId: number) => {
    try {
      const response = await getSubmissionList(surveyId, 1, 100);
      if (response.success) {
        const submissionsData = response.data.submissions;
        if (Array.isArray(submissionsData)) {
          setSubmissions(submissionsData);
        } else {
          setSubmissions([]);
        }
      } else {
        showError('載入提交記錄失敗', response.message);
      }
    } catch (error: any) {
      showError('載入提交記錄失敗', error.message || '未知錯誤');
    }
  };

  // 選擇問卷
  const handleSurveySelect = async (survey: Survey) => {
    setSelectedSurvey(survey);
    await loadAnalytics(survey.id);
    await loadSubmissions(survey.id);
  };

  // 初始化載入
  useEffect(() => {
    loadSurveys();
  }, []);

  // 格式化日期
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  // 計算完成率
  const calculateCompletionRate = (total: number, completed: number) => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 頁面標題 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">問卷統計</h1>
          <p className="text-gray-600 mt-2">查看問卷分析、統計資料和提交記錄</p>
        </div>

        {/* 標籤頁導航 */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: '總覽', icon: 'ri-dashboard-line' },
                { id: 'surveys', label: '問卷管理', icon: 'ri-file-list-line' },
                { id: 'analytics', label: '統計分析', icon: 'ri-bar-chart-line' },
                { id: 'submissions', label: '提交記錄', icon: 'ri-user-line' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.id
                      ? `${AI_COLORS.border} ${AI_COLORS.text}`
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <i className={tab.icon} style={{ fontSize: '16px' }}></i>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* 總覽標籤頁 */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 統計卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <i className="ri-file-list-line text-blue-600" style={{ fontSize: '24px' }}></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">總問卷數</p>
                    <p className="text-2xl font-bold text-gray-900">{surveys.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <i className="ri-check-line text-green-600" style={{ fontSize: '24px' }}></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">啟用問卷</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {surveys.filter(s => s.is_active).length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <i className="ri-user-line text-purple-600" style={{ fontSize: '24px' }}></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">總提交數</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {surveys.reduce((total, s) => total + s.submission_count, 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <i className="ri-question-line text-orange-600" style={{ fontSize: '24px' }}></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">總問題數</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {surveys.reduce((total, s) => total + s.question_count, 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 最近問卷 */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">最近問卷</h3>
              </div>
              <div className="p-6">
                {surveys.length > 0 ? (
                  <div className="space-y-4">
                    {surveys.slice(0, 5).map((survey) => (
                      <div key={survey.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className={`p-2 ${AI_COLORS.bg} rounded-lg`}>
                            <i className={`ri-file-list-line ${AI_COLORS.text}`} style={{ fontSize: '20px' }}></i>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{survey.title}</h4>
                            <p className="text-sm text-gray-500">{survey.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>{survey.question_count} 個問題</span>
                            <span>{survey.submission_count} 個提交</span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              survey.is_active 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {survey.is_active ? '啟用' : '停用'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <i className="ri-file-list-line mx-auto text-gray-400 mb-4" style={{ fontSize: '48px' }}></i>
                    <p className="text-gray-500">尚無問卷資料</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 問卷管理標籤頁 */}
        {activeTab === 'surveys' && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">問卷管理</h3>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="text-center py-8">
                  <i className={`ri-loader-4-line mx-auto ${AI_COLORS.text} mb-4 animate-spin`} style={{ fontSize: '48px' }}></i>
                  <p className="text-gray-500">載入中...</p>
                </div>
              ) : surveys.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {surveys.map((survey) => (
                    <div 
                      key={survey.id} 
                      className={`p-6 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${
                        selectedSurvey?.id === survey.id 
                          ? 'border-primary-500 bg-primary-50' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                      onClick={() => handleSurveySelect(survey)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-2 ${AI_COLORS.bg} rounded-lg`}>
                          <i className={`ri-file-list-line ${AI_COLORS.text}`} style={{ fontSize: '24px' }}></i>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          survey.is_active 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {survey.is_active ? '啟用' : '停用'}
                        </span>
                      </div>
                      
                      <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">{survey.title}</h4>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{survey.description}</p>
                      
                      <div className="space-y-2 text-sm text-gray-500">
                        <div className="flex justify-between">
                          <span>問題數量：</span>
                          <span className="font-medium">{survey.question_count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>提交數量：</span>
                          <span className="font-medium">{survey.submission_count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>建立者：</span>
                          <span className="font-medium">{survey.created_by}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>建立時間：</span>
                          <span className="font-medium">{formatDate(survey.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <i className="ri-file-list-line mx-auto text-gray-400 mb-4" style={{ fontSize: '48px' }}></i>
                  <p className="text-gray-500">尚無問卷資料</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 統計分析標籤頁 */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {selectedSurvey ? (
              <>
                {/* 問卷基本資訊 */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">問卷分析：{selectedSurvey.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      selectedSurvey.is_active 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {selectedSurvey.is_active ? '啟用' : '停用'}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4">{selectedSurvey.description}</p>
                  
                  {analytics && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{analytics.total_submissions}</div>
                        <div className="text-sm text-blue-600">總提交數</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{analytics.completed_submissions}</div>
                        <div className="text-sm text-green-600">完成提交數</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{analytics.completion_rate}%</div>
                        <div className="text-sm text-purple-600">完成率</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 問題分析 */}
                {analytics && (
                  <div className="bg-white rounded-xl shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">問題分析</h3>
                    </div>
                    <div className="p-6">
                      <div className="space-y-6">
                        {analytics.questions.map((question) => (
                          <div key={question.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                            <h4 className="font-medium text-gray-900 mb-2">{question.text}</h4>
                            <div className="text-sm text-gray-500 mb-3">
                              類型：{question.type} | 回答數：{question.total_ratings || 0}
                            </div>
                            
                            {question.type === 'rating' && question.average_rating && (
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">平均評分：</span>
                                <div className="flex items-center">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <i
                                      key={star}
                                      className={`ri-star-${star <= question.average_rating! ? 'fill' : 'line'} ${
                                        star <= question.average_rating! ? 'text-yellow-400' : 'text-gray-300'
                                      }`}
                                      style={{ fontSize: '20px' }}
                                    ></i>
                                  ))}
                                  <span className="ml-2 text-sm font-medium text-gray-900">
                                    {question.average_rating.toFixed(1)}
                                  </span>
                                </div>
                              </div>
                            )}
                            
                            {question.choice_counts && (
                              <div className="mt-3">
                                <div className="space-y-2">
                                  {Object.entries(question.choice_counts).map(([choice, count]) => (
                                    <div key={choice} className="flex items-center justify-between">
                                      <span className="text-sm text-gray-600">{choice}</span>
                                      <div className="flex items-center space-x-2">
                                        <div className="w-32 bg-gray-200 rounded-full h-2">
                                          <div 
                                            className="bg-primary-500 h-2 rounded-full"
                                            style={{ 
                                              width: `${(count / (question.total_ratings || 1)) * 100}%` 
                                            }}
                                          ></div>
                                        </div>
                                        <span className="text-sm font-medium text-gray-900 w-12 text-right">
                                          {count}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <i className="ri-bar-chart-line mx-auto text-gray-400 mb-4" style={{ fontSize: '48px' }}></i>
                <h3 className="text-lg font-medium text-gray-900 mb-2">選擇問卷查看分析</h3>
                <p className="text-gray-500">請先在「問卷管理」標籤頁選擇一個問卷</p>
              </div>
            )}
          </div>
        )}

        {/* 提交記錄標籤頁 */}
        {activeTab === 'submissions' && (
          <div className="space-y-6">
            {selectedSurvey ? (
              <>
                {/* 提交統計 */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    提交記錄：{selectedSurvey.title}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{submissions.length}</div>
                      <div className="text-sm text-blue-600">總提交數</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {submissions.filter(s => s.is_completed).length}
                      </div>
                      <div className="text-sm text-green-600">已完成</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">
                        {submissions.filter(s => !s.is_completed).length}
                      </div>
                      <div className="text-sm text-yellow-600">未完成</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {calculateCompletionRate(submissions.length, submissions.filter(s => s.is_completed).length)}%
                      </div>
                      <div className="text-sm text-purple-600">完成率</div>
                    </div>
                  </div>
                </div>

                {/* 提交列表 */}
                <div className="bg-white rounded-xl shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">提交詳細記錄</h3>
                  </div>
                  <div className="p-6">
                    {submissions.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                提交ID
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                會話金鑰
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                狀態
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                建立時間
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                完成時間
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {submissions.map((submission) => (
                              <tr key={submission.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  #{submission.id}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {submission.session_key}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    submission.is_completed 
                                      ? 'bg-green-100 text-green-700' 
                                      : 'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {submission.is_completed ? '已完成' : '未完成'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {formatDate(submission.created_at)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {submission.completed_at ? formatDate(submission.completed_at) : '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <i className="ri-user-line mx-auto text-gray-400 mb-4" style={{ fontSize: '48px' }}></i>
                        <p className="text-gray-500">尚無提交記錄</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <i className="ri-user-line mx-auto text-gray-400 mb-4" style={{ fontSize: '48px' }}></i>
                <h3 className="text-lg font-medium text-gray-900 mb-2">選擇問卷查看提交記錄</h3>
                <p className="text-gray-500">請先在「問卷管理」標籤頁選擇一個問卷</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SurveyStatistics;
