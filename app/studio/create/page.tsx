"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useStudioData } from "@/hooks/use-studio-data";
import { ArrowLeft, ChevronRight, Shield, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { triggerFileUpload, FILE_TYPES } from "@/lib/thirdweb";
import { useActiveAccount } from "thirdweb/react";

// Import our new components
import { ProjectStep } from "@/components/studio/create/project-step";
import { CollectionStep } from "@/components/studio/create/collection-step";
import { ConfigurationStep } from "@/components/studio/create/configuration-step";
import { ReviewStep } from "@/components/studio/create/review-step";
import { StepProgress } from "@/components/studio/create/step-progress";

// Import utilities
import {
  canProceedToNextStep,
  getStepValidationMessage
} from "@/lib/studio/create-validation";
import { deployCollection } from "@/lib/studio/deploy-collection";

function CreateContent() {
  const { projects, error, refreshData } = useStudioData();
  const account = useActiveAccount();
  const [currentStep, setCurrentStep] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [createMode, setCreateMode] = useState<'new-project' | 'existing-project' | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);

  // Form states
  const [projectData, setProjectData] = useState({
    name: "",
    description: "",
    genre: "",
    concept: "",
    banner: ""
  });

  const [collectionData, setCollectionData] = useState({
    name: "",
    symbol: "",
    description: "",
    image: "",
    bannerImage: "",
    maxSupply: "",
    royaltyPercentage: "5",
    contractType: "DropERC721",
    chainId: "11155111",
    category: "",
    tags: [] as string[]
  });

  const router = useRouter();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const chains = [
    { id: "11155111", name: "Sepolia Testnet", icon: "⚡" },
    { id: "1", name: "Ethereum Mainnet", icon: "💎" },
    { id: "137", name: "Polygon", icon: "🟣" },
    { id: "42161", name: "Arbitrum One", icon: "🔵" }
  ];

  const contractTypes = [
    { id: "DropERC721", name: "Drop (Lazy Mint)", description: "Most gas efficient for large collections" },
    { id: "TokenERC721", name: "Standard NFT", description: "Traditional NFT contract" },
    { id: "OpenEditionERC721", name: "Open Edition", description: "Multiple editions of the same NFT" },
    { id: "LoyaltyCard", name: "Loyalty Card", description: "NFT-based loyalty and rewards program" }
  ];

  const categories = [
    "Art", "Gaming", "Music", "Photography", "Sports",
    "Trading Cards", "Collectibles", "Utility", "Memberships", "Other"
  ];

  // Upload handlers
  const handleImageUpload = (fieldType: 'image' | 'bannerImage' | 'projectBanner') => {
    setUploadingField(fieldType);

    triggerFileUpload(
      (uri: string) => {
        if (fieldType === 'image') {
          setCollectionData(prev => ({ ...prev, image: uri }));
        } else if (fieldType === 'bannerImage') {
          setCollectionData(prev => ({ ...prev, bannerImage: uri }));
        } else if (fieldType === 'projectBanner') {
          setProjectData(prev => ({ ...prev, banner: uri }));
        }
        setUploadingField(null);
      },
      undefined,
      (error: string) => {
        console.error('Upload error:', error);
        alert('Upload failed: ' + error);
        setUploadingField(null);
      },
      FILE_TYPES.IMAGES_AND_VIDEOS
    );
  };

  const handleNext = () => {
    if (!canProceedToNextStep(currentStep, createMode, selectedProject, projectData, collectionData)) {
      const validationMessage = getStepValidationMessage(currentStep, createMode, selectedProject, projectData, collectionData);
      if (validationMessage) {
        alert(validationMessage);
      }
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep === 1) {
      router.back();
    } else {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDeploy = async () => {
    try {
      setIsDeploying(true);

      const result = await deployCollection(
        createMode!,
        selectedProject,
        projectData,
        collectionData,
        account
      );

      if (result.success) {
        alert('Collection deployed successfully!');
        router.push('/studio/collections');
      } else {
        alert('Deployment failed: ' + result.error);
      }
    } catch (error) {
      console.error('Deployment error:', error);
      alert('Deployment failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsDeploying(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertCircle className="text-red-500 w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Error Loading Data</h3>
          <p className="text-sm text-white/60 mb-4">{error}</p>
          <Button onClick={refreshData} className="bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <ProjectStep
            createMode={createMode}
            setCreateMode={setCreateMode}
            selectedProject={selectedProject}
            setSelectedProject={setSelectedProject}
            projectData={projectData}
            setProjectData={setProjectData}
            projects={projects}
            isMobile={isMobile}
          />
        );
      case 2:
        return (
          <CollectionStep
            collectionData={collectionData}
            setCollectionData={setCollectionData}
            uploadingField={uploadingField}
            handleImageUpload={handleImageUpload}
            categories={categories}
            isMobile={isMobile}
          />
        );
      case 3:
        return (
          <ConfigurationStep
            collectionData={collectionData}
            setCollectionData={setCollectionData}
            showAdvanced={showAdvanced}
            setShowAdvanced={setShowAdvanced}
            chains={chains}
            contractTypes={contractTypes}
            isMobile={isMobile}
          />
        );
      case 4:
        return (
          <ReviewStep
            createMode={createMode}
            projectData={projectData}
            selectedProject={selectedProject}
            projects={projects}
            collectionData={collectionData}
            chains={chains}
            contractTypes={contractTypes}
            isDeploying={isDeploying}
            handleDeploy={handleDeploy}
            isMobile={isMobile}
          />
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full min-h-screen bg-black"
    >
      {isMobile ? (
        // MOBILE LAYOUT
        <div className="relative">
          {/* Mobile Header */}
          <div className="sticky top-0 z-30 bg-black/95 backdrop-blur-lg border-b border-white/10">
            <div className="p-4 flex items-center justify-between">
              <Button size="icon" variant="ghost" onClick={handleBack} className="text-white">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h2 className="text-lg font-bold text-white">Create Collection</h2>
              <div className="w-10" />
            </div>

            <StepProgress currentStep={currentStep} isMobile={true} />
          </div>

          {/* Mobile Content */}
          <div className="p-4 pb-24">
            <AnimatePresence mode="wait">
              {renderStepContent()}
            </AnimatePresence>
          </div>

          {/* Mobile Footer */}
          <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-lg border-t border-white/10 p-4">
            <div className="flex gap-2">
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1 border-white/30 text-white hover:bg-white/10"
                >
                  Back
                </Button>
              )}
              {currentStep < 4 ? (
                <Button
                  onClick={handleNext}
                  className="flex-1 bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90 font-bold"
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleDeploy}
                  disabled={isDeploying}
                  className="flex-1 bg-purple-500 text-white hover:bg-purple-600 font-bold disabled:opacity-50"
                >
                  {isDeploying ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Deploying...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Deploy Collection
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        // DESKTOP LAYOUT
        <div className="relative">
          {/* Desktop Hero */}
          <motion.div
            ref={heroRef}
            className="relative h-[30vh] overflow-hidden"
            style={{ scale: heroScale }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-black to-[rgb(163,255,18)]/30" />
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239333ea' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }} />
            </div>

            <motion.div style={{ opacity: heroOpacity }} className="absolute bottom-0 left-0 right-0 px-8 py-6">
              <div className="max-w-6xl mx-auto">
                <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="flex items-center gap-3 mb-3">
                  <Badge className="bg-purple-500 text-white font-bold">CREATE</Badge>
                  <Badge variant="outline" className="border-[rgb(163,255,18)]/50 text-[rgb(163,255,18)]">COLLECTION WIZARD</Badge>
                </motion.div>

                <motion.h1 initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="text-4xl md:text-5xl font-bold text-white mb-3">
                  Create New Collection
                </motion.h1>

                <motion.p initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="text-lg text-white/90 max-w-2xl">
                  Deploy your NFT collection with powerful features and customizable smart contracts
                </motion.p>
              </div>
            </motion.div>
          </motion.div>

          {/* Desktop Progress Bar */}
          <div className="sticky top-16 z-50 bg-black/95 backdrop-blur-lg border-b border-white/10">
            <StepProgress currentStep={currentStep} isMobile={false} />
          </div>

          {/* Desktop Content */}
          <div className="px-8 py-8 pb-24 max-w-6xl mx-auto min-h-screen">
            <AnimatePresence mode="wait">
              {renderStepContent()}
            </AnimatePresence>
          </div>

          {/* Desktop Fixed Footer Actions */}
          <div className="fixed bottom-16 left-0 right-0 md:left-80 md:right-0 bg-black/95 backdrop-blur-lg border-t border-white/10 z-30">
            <div className="px-8 py-6 max-w-6xl mx-auto">
              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="border-white/30 text-white hover:bg-white/10"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {currentStep === 1 ? 'Cancel' : 'Back'}
                </Button>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-white/60">Step {currentStep} of 4</span>
                </div>

                {currentStep < 4 ? (
                  <Button
                    onClick={handleNext}
                    className="bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90 font-bold"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleDeploy}
                    disabled={isDeploying}
                    className="bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 font-bold disabled:opacity-50"
                  >
                    {isDeploying ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Deploying...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        Deploy Collection
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function StudioCreatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    }>
      <CreateContent />
    </Suspense>
  );
}