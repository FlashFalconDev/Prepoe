import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Sparkles, Wand2, Layers, FileText } from 'lucide-react';
import { AI_COLORS } from '../constants/colors';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import { api, API_ENDPOINTS } from '../config/api';

// 嚮導子組件
import WizardStepper from '../components/cardWizard/WizardStepper';
import CategorySelector from '../components/cardWizard/CategorySelector';
import StyleConfigurator from '../components/cardWizard/StyleConfigurator';
import OrderSummary from '../components/cardWizard/OrderSummary';

// 預設卡牌資料
import {
  DeckCategory,
  DECK_CATEGORIES,
  convertToCardTemplates,
  CardTemplate
} from '../data/cardPresets';

// 類型定義
export type WizardStep = 1 | 2 | 3;

export type LoraStyleId = 'E01' | 'E02' | 'E03' | 'E04' | 'E05' | 'E06' | 'E07' | 'E08' | 'E09' | 'E10' | 'E11' | 'E12' | '';
export type StyleTemplateId = 'S01' | 'S02' | 'S03' | 'S04' | 'S05' | 'S06';

export interface DeckStyle {
  styleTemplate: StyleTemplateId;  // 藝術風格模板
  colorPalette: string[];  // 色票陣列，例如 ['#9333ea', '#eab308', '#1e1b4b']
  loraStyle: LoraStyleId;  // 材質風格 LORA
  customPromptSuffix: string;
}

export interface WizardState {
  step: WizardStep;
  category: DeckCategory | null;
  deckName: string;
  deckDescription: string;
  style: DeckStyle;
  cards: CardTemplate[];
}

const WIZARD_STEPS = [
  { id: 1, title: '選擇類別', description: '預設卡組或自建' },
  { id: 2, title: '設計風格', description: '確認視覺風格' },
  { id: 3, title: '確認需求單', description: '提交生成' },
];

const DEFAULT_STYLE: DeckStyle = {
  styleTemplate: 'S01',  // 預設黑暗超現實
  colorPalette: ['#9333ea', '#eab308', '#1e1b4b'],  // 預設神秘紫金
  loraStyle: '',  // 預設不選
  customPromptSuffix: '',
};

const CardDeckWizard: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError, showInfo } = useToast();
  const confirm = useConfirm();

  const [state, setState] = useState<WizardState>({
    step: 1,
    category: null,
    deckName: '',
    deckDescription: '',
    style: DEFAULT_STYLE,
    cards: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 步驟導航
  const goToStep = useCallback((step: number) => {
    // 只能跳轉到已完成或當前步驟
    if (step <= state.step && step >= 1 && step <= 3) {
      setState(prev => ({ ...prev, step: step as WizardStep }));
    }
  }, [state.step]);

  const nextStep = useCallback(() => {
    if (state.step < 3) {
      setState(prev => ({ ...prev, step: (prev.step + 1) as WizardStep }));
    }
  }, [state.step]);

  const prevStep = useCallback(() => {
    if (state.step > 1) {
      setState(prev => ({ ...prev, step: (prev.step - 1) as WizardStep }));
    }
  }, [state.step]);

  // 類別選擇處理
  const handleCategorySelect = useCallback((category: DeckCategory) => {
    if (category === 'custom') {
      // 自建類別暫時顯示提示
      showInfo('自建類別功能開發中...');
      return;
    }

    const deckInfo = DECK_CATEGORIES[category];
    const cards = convertToCardTemplates(category);

    setState(prev => ({
      ...prev,
      category,
      cards,
      deckName: `我的${deckInfo.nameCN}`,
      deckDescription: deckInfo.description,
    }));
  }, [showInfo]);

  // 風格更新處理
  const handleStyleChange = useCallback((updates: { style?: Partial<DeckStyle>; deckName?: string; deckDescription?: string }) => {
    setState(prev => ({
      ...prev,
      deckName: updates.deckName !== undefined ? updates.deckName : prev.deckName,
      deckDescription: updates.deckDescription !== undefined ? updates.deckDescription : prev.deckDescription,
      style: updates.style ? { ...prev.style, ...updates.style } : prev.style,
    }));
  }, []);

  // 檢查是否可以進入下一步
  const canProceed = useCallback(() => {
    switch (state.step) {
      case 1:
        return state.category !== null;
      case 2:
        return state.deckName.trim() !== '';
      case 3:
        return true;
      default:
        return false;
    }
  }, [state]);

  // 返回確認
  const handleBack = useCallback(async () => {
    if (state.step === 1 && state.category) {
      const confirmed = await confirm.confirm({
        title: '確定離開？',
        message: '你已選擇了卡組類別，離開將會失去目前的設定。',
        confirmText: '確定離開',
        cancelText: '繼續編輯',
      });
      if (!confirmed) return;
    }
    navigate('/provider/creator/cardhack');
  }, [state.step, state.category, confirm, navigate]);

  // 提交需求單
  const handleSubmitOrder = useCallback(async () => {
    if (!state.category || state.cards.length === 0) {
      showError('請先選擇卡組類別');
      return;
    }

    setIsSubmitting(true);

    try {
      // 組裝請求資料
      const requestData = {
        deck_name: state.deckName,
        deck_description: state.deckDescription,
        category: state.category,
        style: {
          style_template: state.style.styleTemplate,  // 藝術風格模板，例如 'S01'
          color_palette: state.style.colorPalette,  // 直接傳色票陣列 ['#xxx', '#xxx', '#xxx']
          lora_style: state.style.loraStyle || null,  // 材質風格 LORA，例如 'E01'
          custom_prompt_suffix: state.style.customPromptSuffix,
        },
        cards: state.cards.map(c => ({
          name: c.name,
          name_cn: c.nameCN,
          category: c.category || '',
          number: c.number ?? null,
          keywords: c.keywords,
          base_prompt: c.defaultPrompt,
        })),
      };

      // 呼叫後端 API 提交需求單
      const response = await api.post(API_ENDPOINTS.CARDHACK_ORDER_CREATE, requestData);

      if (response.data.success) {
        showSuccess(response.data.message || '需求單已提交成功！');
        // 跳轉到需求單列表或卡組列表
        navigate('/provider/creator/cardhack');
      } else {
        // 後端回傳失敗
        showError(response.data.error?.message || '提交失敗，請稍後再試');
      }
    } catch (error: any) {
      console.error('提交需求單失敗:', error);
      // 處理不同錯誤狀態
      const errorMessage = error.response?.data?.error?.message
        || error.response?.data?.message
        || error.message
        || '提交失敗，請稍後再試';
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [state, showSuccess, showError, navigate]);

  // 渲染當前步驟
  const renderCurrentStep = () => {
    switch (state.step) {
      case 1:
        return (
          <CategorySelector
            selectedCategory={state.category}
            onSelect={handleCategorySelect}
          />
        );
      case 2:
        return (
          <StyleConfigurator
            style={state.style}
            deckName={state.deckName}
            deckDescription={state.deckDescription}
            category={state.category}
            onChange={handleStyleChange}
          />
        );
      case 3:
        return (
          <OrderSummary
            deckName={state.deckName}
            deckDescription={state.deckDescription}
            category={state.category}
            style={state.style}
            cards={state.cards}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmitOrder}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            返回卡組列表
          </button>
          <div className="flex items-center gap-3">
            <div className={`p-2 ${AI_COLORS.bg} rounded-xl`}>
              <Wand2 className={AI_COLORS.text} size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">卡牌創建嚮導</h1>
              <p className="text-gray-500 text-sm">選擇類別、設計風格、提交需求單</p>
            </div>
          </div>
        </div>

        {/* Stepper */}
        <WizardStepper
          steps={WIZARD_STEPS}
          currentStep={state.step}
          onStepClick={goToStep}
        />

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mt-6">
          {renderCurrentStep()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <button
            onClick={prevStep}
            disabled={state.step === 1}
            className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 rounded-xl
                       hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft size={18} />
            上一步
          </button>

          {state.step < 3 ? (
            <button
              onClick={nextStep}
              disabled={!canProceed()}
              className={`flex items-center gap-2 px-5 py-2.5 ${AI_COLORS.button} rounded-xl
                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
            >
              下一步
              <ArrowRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleSubmitOrder}
              disabled={isSubmitting || !canProceed()}
              className={`flex items-center gap-2 px-6 py-2.5 ${AI_COLORS.button} rounded-xl
                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  提交中...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  提交需求單
                </>
              )}
            </button>
          )}
        </div>

        {/* 提示資訊 */}
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-3">
            <FileText size={20} className="text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800">需求單模式說明</h4>
              <p className="text-sm text-amber-700 mt-1">
                提交需求單後，系統將在背景逐張生成卡牌圖片。
                生成過程可能需要一些時間，您可以隨時在「卡組管理」查看進度。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardDeckWizard;
