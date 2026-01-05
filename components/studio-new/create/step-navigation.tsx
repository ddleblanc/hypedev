'use client';

import { ArrowLeft, ArrowRight, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface StepNavigationProps {
  onBack: () => void;
  onNext: () => void;
  canGoBack: boolean;
  canGoNext: boolean;
  isReview?: boolean;
  nextLabel?: string;
  isLoading?: boolean;
}

export function StepNavigation({
  onBack,
  onNext,
  canGoBack,
  canGoNext,
  isReview,
  nextLabel = 'Continue',
  isLoading,
}: StepNavigationProps) {
  return (
    <div className="flex items-center justify-between">
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={onBack}
        disabled={!canGoBack}
        className={cn(
          'text-studio-text-muted hover:text-studio-text hover:bg-studio-surface',
          !canGoBack && 'invisible'
        )}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      {/* Next/Deploy button */}
      <Button
        onClick={onNext}
        disabled={!canGoNext || isLoading}
        className={cn(
          'min-w-[140px]',
          isReview
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-studio-accent hover:bg-studio-accent/90 text-white'
        )}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Deploying...
          </span>
        ) : (
          <>
            {isReview ? (
              <>
                <Rocket className="h-4 w-4 mr-2" />
                {nextLabel}
              </>
            ) : (
              <>
                {nextLabel}
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </>
        )}
      </Button>
    </div>
  );
}
