import React from 'react';
import { Check } from 'lucide-react';
import { AI_COLORS } from '../../constants/colors';

interface Step {
  id: number;
  title: string;
  description: string;
}

interface WizardStepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick: (step: number) => void;
}

const WizardStepper: React.FC<WizardStepperProps> = ({
  steps,
  currentStep,
  onStepClick,
}) => {
  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => {
        const isCompleted = step.id < currentStep;
        const isCurrent = step.id === currentStep;
        const isClickable = step.id <= currentStep;

        return (
          <React.Fragment key={step.id}>
            {/* Step */}
            <button
              onClick={() => isClickable && onStepClick(step.id)}
              disabled={!isClickable}
              className={`flex items-center gap-3 ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'}`}
            >
              {/* Circle */}
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                  transition-all duration-200
                  ${isCompleted
                    ? `${AI_COLORS.bgDark} text-white`
                    : isCurrent
                      ? `${AI_COLORS.bg} ${AI_COLORS.text} ring-2 ring-orange-400`
                      : 'bg-gray-100 text-gray-400'
                  }
                `}
              >
                {isCompleted ? (
                  <Check size={18} />
                ) : (
                  step.id
                )}
              </div>

              {/* Text */}
              <div className="hidden sm:block text-left">
                <div
                  className={`text-sm font-medium ${
                    isCurrent ? 'text-gray-900' : isCompleted ? AI_COLORS.text : 'text-gray-400'
                  }`}
                >
                  {step.title}
                </div>
                <div className="text-xs text-gray-400">
                  {step.description}
                </div>
              </div>
            </button>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={`
                  flex-1 h-0.5 mx-4
                  ${step.id < currentStep ? AI_COLORS.bgDark : 'bg-gray-200'}
                `}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default WizardStepper;
