import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AI_COLORS } from '../constants/colors';
import { 
  Cloud, Bot, Video, FileText, Users, Calendar, ShoppingCart, 
  Sparkles, ArrowRight, CheckCircle, Star, Zap, Target, Shield, Briefcase
} from 'lucide-react';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    { icon: Cloud, title: '雲端名片', desc: '數位化個人品牌展示' },
    { icon: Bot, title: 'AI助手', desc: '智能對話與服務' },
    { icon: Video, title: 'AI影音', desc: '自動化內容創作' },
    { icon: FileText, title: '私域內容', desc: '專業內容管理' },
    { icon: Users, title: '互動模組', desc: '社群互動功能' },
    { icon: Calendar, title: '活動系統', desc: '活動策劃與管理' },
    { icon: ShoppingCart, title: '商城系統', desc: '電商解決方案' },
    { icon: Target, title: '預約系統', desc: '預約與排程管理' }
  ];

  const benefits = [
    'AI驅動的智能工具',
    '一站式商業解決方案',
    '專業級內容創作',
    '完整的客戶管理系統'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            {/* Logo/Brand */}
            <div className="mb-8">
              <div className={`inline-flex items-center justify-center w-20 h-20 ${AI_COLORS.bg} rounded-2xl mb-6`}>
                <Sparkles className={`w-10 h-10 ${AI_COLORS.text}`} />
              </div>
              <h1 className="text-7xl font-bold text-gray-900 mb-4">
                Prepoe
              </h1>
              <div className="flex items-center justify-center gap-2 mb-6">
                <Star className={`w-6 h-6 ${AI_COLORS.text} fill-current`} />
                <Star className={`w-6 h-6 ${AI_COLORS.text} fill-current`} />
                <Star className={`w-6 h-6 ${AI_COLORS.text} fill-current`} />
                <Star className={`w-6 h-6 ${AI_COLORS.text} fill-current`} />
                <Star className={`w-6 h-6 ${AI_COLORS.text} fill-current`} />
              </div>
            </div>

            {/* Main Headline */}
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              提供AI輔助工具
              <br />
              <span className={`${AI_COLORS.text}`}>打造超級個體</span>
            </h2>
            
            <p className="hidden md:block text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              整合雲端名片、AI助手、AI影音、私域內容、互動模組、活動系統、預約系統、商城系統的完整解決方案
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <button
                onClick={() => navigate('/provider')}
                className={`${AI_COLORS.button} px-8 py-4 rounded-xl text-lg font-semibold flex items-center justify-center gap-2 hover:scale-105 transition-all duration-200 shadow-lg`}
              >
                開始使用
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate('/client')}
                className={`${AI_COLORS.buttonOutline} px-8 py-4 rounded-xl text-lg font-semibold flex items-center justify-center gap-2 hover:scale-105 transition-all duration-200`}
              >
                瀏覽服務
                <Users className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate('/business')}
                className={`${AI_COLORS.buttonOutline} px-8 py-4 rounded-xl text-lg font-semibold flex items-center justify-center gap-2 hover:scale-105 transition-all duration-200`}
              >
                商務入口
                <Briefcase className="w-5 h-5" />
              </button>
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-16">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center justify-center md:justify-start gap-2 text-sm text-gray-600">
                  <CheckCircle className={`w-4 h-4 ${AI_COLORS.text} flex-shrink-0`} />
                  <span className="text-center md:text-left">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">核心功能</h3>
            <p className="text-lg text-gray-600">八大核心模組，打造完整的商業生態系統</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-orange-200 transition-all duration-300 cursor-pointer"
                onClick={() => navigate('/provider')}
              >
                <div className={`w-12 h-12 ${AI_COLORS.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                  <feature.icon className={`w-6 h-6 ${AI_COLORS.text}`} />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{feature.title}</h4>
                <p className="text-sm text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-orange-500 to-orange-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h3 className="text-4xl font-bold text-white mb-6">
            準備好開始您的超級個體之旅了嗎？
          </h3>
          <p className="text-xl text-orange-100 mb-8">
            立即體驗 Prepoe 的強大功能，讓AI成為您事業成長的最佳夥伴
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/provider')}
              className="bg-white text-orange-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 transition-colors duration-200 shadow-lg flex items-center justify-center gap-2"
            >
              <Zap className="w-5 h-5" />
              立即開始
            </button>
            <button
              onClick={() => navigate('/client')}
              className="border-2 border-white text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white hover:text-orange-600 transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <Shield className="w-5 h-5" />
              了解更多
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className={`w-6 h-6 ${AI_COLORS.text}`} />
            <span className="text-2xl font-bold">Prepoe</span>
          </div>
          <p className="text-gray-400 mb-6">
            提供AI輔助工具，打造超級個體
          </p>
          <div className="flex justify-center gap-6 text-sm text-gray-400">
            <span>© 2024 Prepoe. All rights reserved.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
