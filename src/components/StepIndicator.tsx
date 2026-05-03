'use client';

import type { WorkflowStep } from '@/lib/types';

const STEPS = [
  { label: 'Foto analýza', icon: '📸' },
  { label: 'Nutričné hodnoty', icon: '📊' },
  { label: 'Recept', icon: '🔍' },
  { label: 'Nákupný zoznam', icon: '🛒' },
  { label: 'Lokalita', icon: '📍' },
  { label: 'Recenzie', icon: '✍️' },
];

interface StepIndicatorProps {
  currentStep: WorkflowStep;
  completedSteps: Set<WorkflowStep>;
  onStepClick: (step: WorkflowStep) => void;
}

export default function StepIndicator({ currentStep, completedSteps, onStepClick }: StepIndicatorProps) {
  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-center min-w-max mx-auto px-4">
        {STEPS.map((step, index) => {
          const stepNum = (index + 1) as WorkflowStep;
          const isCompleted = completedSteps.has(stepNum);
          const isCurrent = currentStep === stepNum;
          const isClickable = isCompleted && !isCurrent;

          return (
            <div key={stepNum} className="flex items-center">
              <button
                onClick={() => isClickable && onStepClick(stepNum)}
                disabled={!isClickable && !isCurrent}
                className={`flex flex-col items-center gap-1 group ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold transition-all
                    ${isCurrent ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg scale-110' : ''}
                    ${isCompleted && !isCurrent ? 'bg-green-100 text-green-700 hover:bg-green-200' : ''}
                    ${!isCompleted && !isCurrent ? 'bg-gray-100 text-gray-400' : ''}
                  `}
                >
                  {isCompleted && !isCurrent ? '✓' : step.icon}
                </div>
                <span
                  className={`text-xs font-medium whitespace-nowrap
                    ${isCurrent ? 'text-orange-600' : ''}
                    ${isCompleted && !isCurrent ? 'text-green-600' : ''}
                    ${!isCompleted && !isCurrent ? 'text-gray-400' : ''}
                  `}
                >
                  {step.label}
                </span>
              </button>

              {index < STEPS.length - 1 && (
                <div
                  className={`w-8 h-0.5 mx-1 mt-[-14px] transition-colors
                    ${completedSteps.has(stepNum) ? 'bg-green-300' : 'bg-gray-200'}
                  `}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
