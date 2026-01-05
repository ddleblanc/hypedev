"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useActiveAccount } from "thirdweb/react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LootboxBasicStep } from "@/components/studio/lootbox-wizard/lootbox-basic-step";
import { NftSelectorStep } from "@/components/studio/lootbox-wizard/nft-selector-step";
import { DropRatesStep } from "@/components/studio/lootbox-wizard/drop-rates-step";
import { ReviewDeployStep } from "@/components/studio/lootbox-wizard/review-deploy-step";

export interface LootboxConfig {
  name: string;
  description: string;
  image: string | null;
  price: string;
  supply: number;
  rewardsPerOpening: number; // Number of rewards per lootbox opening (1-10)
}

export interface SelectedNFT {
  id: string;
  contractAddress: string;
  tokenId: string;
  name: string;
  image: string;
  collectionName: string;
  tokenType: "ERC721" | "ERC1155";
  amount?: number;
  weight: number;
  rarity: string;
}

const STEPS = [
  { id: 1, name: "Basic Info", description: "Name, price & supply" },
  { id: 2, name: "Select NFTs", description: "Choose rewards" },
  { id: 3, name: "Drop Rates", description: "Set probabilities" },
  { id: 4, name: "Review", description: "Deploy lootbox" },
];

export default function CreateLootboxPage() {
  const router = useRouter();
  const account = useActiveAccount();
  const [currentStep, setCurrentStep] = useState(1);
  const [isDeploying, setIsDeploying] = useState(false);

  // Wizard state
  const [config, setConfig] = useState<LootboxConfig>({
    name: "",
    description: "",
    image: null,
    price: "0.01",
    supply: 10,
    rewardsPerOpening: 1,
  });
  const [selectedNFTs, setSelectedNFTs] = useState<SelectedNFT[]>([]);

  // Calculate required NFTs based on supply * rewardsPerOpening
  const requiredNfts = config.supply * config.rewardsPerOpening;

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return (
          config.name.trim() !== "" &&
          parseFloat(config.price) > 0 &&
          config.supply > 0 &&
          config.rewardsPerOpening >= 1 &&
          config.rewardsPerOpening <= 10
        );
      case 2:
        return selectedNFTs.length >= requiredNfts;
      case 3:
        return selectedNFTs.every((nft) => nft.weight > 0);
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 4 && canProceed()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDeployComplete = (lootboxId: number) => {
    router.push(`/studio/lootbox/${lootboxId}`);
  };

  if (!account) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">Connect Wallet</h2>
          <p className="text-white/60">Please connect your wallet to create a lootbox</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900/50 to-black/50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/studio")}
            className="text-white/60 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">Create Lootbox</h1>
            <p className="text-white/60 text-sm">
              Set up a lootbox with your NFTs as rewards
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            {/* Progress line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-white/10" />
            <div
              className="absolute top-5 left-0 h-0.5 bg-[rgb(163,255,18)] transition-all duration-300"
              style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
            />

            {STEPS.map((step) => (
              <div
                key={step.id}
                className="relative flex flex-col items-center z-10"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all ${
                    step.id < currentStep
                      ? "bg-[rgb(163,255,18)] text-black"
                      : step.id === currentStep
                      ? "bg-[rgb(163,255,18)] text-black"
                      : "bg-zinc-800 text-white/40"
                  }`}
                >
                  {step.id < currentStep ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step.id
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p
                    className={`text-sm font-medium ${
                      step.id <= currentStep ? "text-white" : "text-white/40"
                    }`}
                  >
                    {step.name}
                  </p>
                  <p className="text-xs text-white/40 hidden sm:block">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-zinc-900/50 border border-white/10 rounded-xl overflow-hidden min-h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="p-6"
            >
              {currentStep === 1 && (
                <LootboxBasicStep config={config} setConfig={setConfig} />
              )}
              {currentStep === 2 && (
                <NftSelectorStep
                  selectedNFTs={selectedNFTs}
                  setSelectedNFTs={setSelectedNFTs}
                  requiredCount={requiredNfts}
                  rewardsPerOpening={config.rewardsPerOpening}
                />
              )}
              {currentStep === 3 && (
                <DropRatesStep
                  selectedNFTs={selectedNFTs}
                  setSelectedNFTs={setSelectedNFTs}
                />
              )}
              {currentStep === 4 && (
                <ReviewDeployStep
                  config={config}
                  selectedNFTs={selectedNFTs}
                  account={account}
                  onDeployComplete={handleDeployComplete}
                  isDeploying={isDeploying}
                  setIsDeploying={setIsDeploying}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        {currentStep < 4 && (
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="border-white/10 text-white hover:bg-white/5"
            >
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-[rgb(163,255,18)] text-black hover:bg-[rgb(143,235,0)]"
            >
              Continue
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
