'use client';

import { useCallback, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStudioNew } from '@/contexts/studio-new-context';
import { useActiveAccount } from 'thirdweb/react';
import { deployCollection } from '@/lib/studio/deploy-collection';
import { StepIndicator } from './step-indicator';
import { StepNavigation } from './step-navigation';

// Collection step components
import { TypeStep } from './steps/type-step';
import { ProjectStep } from './steps/project-step';
import { BasicsStep } from './steps/basics-step';
import { ArtworkStep } from './steps/artwork-step';
import { ConfigStep } from './steps/config-step';
import { SupplyStep } from './steps/supply-step';
import { ReviewStep } from './steps/review-step';
import { SuccessStep } from './steps/success-step';

// Lootbox step components
import { LootboxBasicsStep } from './steps/lootbox-basics-step';
import { LootboxSupplyStep } from './steps/lootbox-supply-step';
import { LootboxNftStep } from './steps/lootbox-nft-step';
import { LootboxRatesStep } from './steps/lootbox-rates-step';
import { LootboxReviewStep } from './steps/lootbox-review-step';

// Collection steps (standard flow)
const collectionSteps = [
  { id: 1, title: 'Type', component: TypeStep },
  { id: 2, title: 'Project', component: ProjectStep },
  { id: 3, title: 'Basics', component: BasicsStep },
  { id: 4, title: 'Artwork', component: ArtworkStep },
  { id: 5, title: 'Config', component: ConfigStep },
  { id: 6, title: 'Supply', component: SupplyStep },
  { id: 7, title: 'Review', component: ReviewStep },
  { id: 8, title: 'Success', component: SuccessStep },
];

// Lootbox steps (lootbox flow)
const lootboxSteps = [
  { id: 1, title: 'Type', component: TypeStep },
  { id: 2, title: 'Project', component: ProjectStep },
  { id: 3, title: 'Basics', component: LootboxBasicsStep },
  { id: 4, title: 'Supply', component: LootboxSupplyStep },
  { id: 5, title: 'NFTs', component: LootboxNftStep },
  { id: 6, title: 'Rates', component: LootboxRatesStep },
  { id: 7, title: 'Review', component: LootboxReviewStep },
  { id: 8, title: 'Success', component: SuccessStep },
];

export function CreateWizard() {
  const { state, nextStep, prevStep, canProceed, setStep } = useStudioNew();
  const account = useActiveAccount();
  const currentStep = state.create.step;

  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentResult, setDeploymentResult] = useState<{
    contractAddress?: string;
    lootboxId?: number;
    error?: string;
  } | null>(null);

  // Select steps array based on creation type
  const isLootbox = state.create.draft.type === 'lootbox';
  const steps = useMemo(
    () => (isLootbox ? lootboxSteps : collectionSteps),
    [isLootbox]
  );

  const StepComponent = steps[currentStep - 1]?.component || TypeStep;
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === 8;
  const isReviewStep = currentStep === 7;

  const handleDeploy = useCallback(async () => {
    if (!account) {
      setDeploymentResult({ error: 'Please connect your wallet' });
      return;
    }

    setIsDeploying(true);
    setDeploymentResult(null);

    try {
      const { draft } = state.create;

      // Prepare project data
      const projectData = {
        name: draft.projectName || '',
        description: draft.projectDescription || '',
        genre: '',
        concept: '',
        banner: '',
      };

      // Prepare collection data
      const collectionData = {
        name: draft.name || '',
        symbol: draft.symbol || '',
        description: draft.description || '',
        image: draft.image || '',
        bannerImage: draft.bannerImage || '',
        maxSupply: String(draft.maxSupply || 10000),
        royaltyPercentage: String(draft.royaltyPercentage ?? 5),
        contractType: draft.contractType || 'DropERC721',
        chainId: String(draft.chainId || 11155111),
        category: 'art',
        tags: [],
      };

      // Determine create mode
      const createMode = draft.projectId ? 'existing-project' : 'new-project';
      const selectedProject = draft.projectId || '';

      const result = await deployCollection(
        createMode,
        selectedProject,
        projectData,
        collectionData,
        account
      );

      if (result.success) {
        setDeploymentResult({ contractAddress: result.contractAddress });
        // Move to success step
        setStep(8);
      } else {
        setDeploymentResult({ error: result.error || 'Deployment failed' });
      }
    } catch (error) {
      console.error('Deployment error:', error);
      setDeploymentResult({
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsDeploying(false);
    }
  }, [account, state.create, setStep]);

  const handleNext = useCallback(() => {
    if (!canProceed) return;

    if (isReviewStep && !isLootbox) {
      // On review step for collections, clicking "Deploy" triggers deployment
      // For lootbox, the LootboxReviewStep handles its own deployment
      handleDeploy();
    } else if (!isLastStep) {
      nextStep();
    }
  }, [canProceed, isReviewStep, isLastStep, isLootbox, handleDeploy, nextStep]);

  const handleBack = useCallback(() => {
    if (!isFirstStep) {
      prevStep();
    }
  }, [isFirstStep, prevStep]);

  // Render Success step with deployment result
  if (currentStep === 8) {
    return (
      <div className="min-h-[calc(100vh-12rem)] flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-lg">
            <SuccessStep
              contractAddress={deploymentResult?.contractAddress}
              lootboxId={isLootbox ? state.create.draft.deployedLootboxId : undefined}
              chainId={state.create.draft.chainId}
              isLootbox={isLootbox}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-12rem)] flex flex-col">
      {/* Step Indicator */}
      <div className="mb-8">
        <StepIndicator
          steps={steps.slice(0, 7)} // Don't show success in indicator
          currentStep={currentStep}
        />
      </div>

      {/* Deployment Error */}
      {deploymentResult?.error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
          <p className="text-sm text-red-500">{deploymentResult.error}</p>
        </div>
      )}

      {/* Step Content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <StepComponent />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Step Navigation - Hidden for lootbox review (has its own deploy button) */}
      {!(isLootbox && isReviewStep) && (
        <div className="mt-8">
          <StepNavigation
            onBack={handleBack}
            onNext={handleNext}
            canGoBack={!isFirstStep}
            canGoNext={canProceed}
            isReview={isReviewStep && !isLootbox}
            nextLabel={isReviewStep && !isLootbox ? 'Deploy' : 'Continue'}
            isLoading={isDeploying}
          />
        </div>
      )}
    </div>
  );
}
