'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: number;
  title: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {steps.map((step, index) => {
        const isComplete = step.id < currentStep;
        const isCurrent = step.id === currentStep;
        const isUpcoming = step.id > currentStep;

        return (
          <div key={step.id} className="flex items-center">
            {/* Step dot */}
            <div
              className={cn(
                'h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200',
                isComplete && 'bg-studio-accent text-white',
                isCurrent &&
                  'bg-studio-accent text-white ring-4 ring-studio-accent/20',
                isUpcoming &&
                  'bg-studio-surface text-studio-text-muted border border-studio-border'
              )}
            >
              {isComplete ? <Check className="h-4 w-4" /> : step.id}
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'h-0.5 w-8 mx-1 transition-colors duration-200',
                  step.id < currentStep ? 'bg-studio-accent' : 'bg-studio-border'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
