"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Info,
  Check,
  ChevronRight,
  Sparkles,
  Zap,
  Shield,
  DollarSign,
  Users,
  Package,
  HelpCircle,
  AlertCircle,
  ArrowLeft,
  X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  THIRDWEB_CONTRACTS,
  CONTRACT_SELECTION_QUESTIONS,
  getRecommendedContract,
  filterContracts,
  getContractsByUseCase,
  type ContractType
} from "@/lib/thirdweb-contracts";

interface ContractSelectorProps {
  selectedContract: string;
  onSelectContract: (contractId: string) => void;
  isMobile?: boolean;
}

export function ContractSelector({
  selectedContract,
  onSelectContract,
  isMobile = false
}: ContractSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardAnswers, setWizardAnswers] = useState<Record<string, string>>({});
  const [selectedContractDetails, setSelectedContractDetails] = useState<ContractType | null>(null);
  const [filteredContracts, setFilteredContracts] = useState(THIRDWEB_CONTRACTS);

  // Filter contracts based on search and category
  useEffect(() => {
    let filtered = THIRDWEB_CONTRACTS;

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(c => c.category === selectedCategory);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.shortDescription.toLowerCase().includes(query) ||
        c.bestFor.some(b => b.toLowerCase().includes(query)) ||
        c.exampleUseCases.some(e => e.toLowerCase().includes(query))
      );
    }

    setFilteredContracts(filtered);
  }, [searchQuery, selectedCategory]);

  // Handle wizard completion
  const handleWizardComplete = () => {
    const recommendation = getRecommendedContract(wizardAnswers);
    if (recommendation.primary) {
      onSelectContract(recommendation.primary.id);
      setSelectedContractDetails(recommendation.primary);
    }
    setShowWizard(false);
    setWizardStep(0);
    setWizardAnswers({});
  };

  // Get complexity badge color
  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case "beginner":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "intermediate":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "advanced":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "";
    }
  };

  // Get gas efficiency indicator
  const GasIndicator = ({ efficiency }: { efficiency: number }) => {
    const bars = 5;
    return (
      <div className="flex items-center gap-1">
        {[...Array(bars)].map((_, i) => (
          <div
            key={i}
            className={`h-3 w-1 rounded-full ${
              i < (bars - efficiency + 1)
                ? "bg-green-500"
                : "bg-white/20"
            }`}
          />
        ))}
      </div>
    );
  };

  // Contract Card Component
  const ContractCard = ({ contract }: { contract: ContractType }) => {
    const isSelected = selectedContract === contract.id;

    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`cursor-pointer transition-all ${
          isSelected ? "ring-2 ring-[rgb(163,255,18)]" : ""
        }`}
        onClick={() => {
          onSelectContract(contract.id);
          setSelectedContractDetails(contract);
        }}
      >
        <Card className={`bg-black/40 border-white/20 hover:border-white/40 h-full ${
          isSelected ? "border-[rgb(163,255,18)]" : ""
        }`}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between mb-2">
              <CardTitle className="text-white text-lg">{contract.name}</CardTitle>
              {contract.audited && (
                <Tooltip>
                  <TooltipTrigger>
                    <Shield className="w-4 h-4 text-green-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Audited Contract</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getComplexityColor(contract.complexity)}>
                {contract.complexity}
              </Badge>
              <Badge variant="outline" className="border-white/30 text-white/60 text-xs">
                v{contract.version}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-white/80">{contract.shortDescription}</p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-3 h-3 text-yellow-400" />
                <span className="text-xs text-white/60">Gas</span>
                <GasIndicator efficiency={contract.gasEfficiency} />
              </div>
              <div className="flex items-center gap-2">
                {contract.supportsClaimConditions && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="outline" className="border-purple-500/30 text-purple-400 text-xs">
                        Claims
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Supports claim conditions</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {contract.supportsLazyMint && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="outline" className="border-blue-500/30 text-blue-400 text-xs">
                        Lazy
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Upload without gas</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-white/10">
              <p className="text-xs text-white/60 mb-2">Best for:</p>
              <div className="flex flex-wrap gap-1">
                {contract.bestFor.slice(0, 2).map((use, i) => (
                  <Badge key={i} variant="secondary" className="bg-white/10 text-white/80 text-xs">
                    {use}
                  </Badge>
                ))}
                {contract.bestFor.length > 2 && (
                  <Badge variant="secondary" className="bg-white/10 text-white/60 text-xs">
                    +{contract.bestFor.length - 2}
                  </Badge>
                )}
              </div>
            </div>

            {isSelected && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="pt-2"
              >
                <div className="flex items-center gap-2 text-[rgb(163,255,18)]">
                  <Check className="w-4 h-4" />
                  <span className="text-sm font-medium">Selected</span>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  // Wizard Question Component
  const WizardQuestion = () => {
    const currentQuestion = CONTRACT_SELECTION_QUESTIONS[wizardStep];

    return (
      <motion.div
        key={wizardStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-4"
      >
        <div>
          <h3 className="text-xl font-bold text-white mb-2">
            {currentQuestion.question}
          </h3>
          {currentQuestion.description && (
            <p className="text-sm text-white/60">{currentQuestion.description}</p>
          )}
        </div>

        <RadioGroup
          value={wizardAnswers[currentQuestion.id] || ""}
          onValueChange={(value) => {
            setWizardAnswers({ ...wizardAnswers, [currentQuestion.id]: value });
          }}
        >
          <div className="space-y-3">
            {currentQuestion.options.map((option) => (
              <Label
                key={option.value}
                htmlFor={`wizard-${option.value}`}
                className={`flex items-start gap-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                  wizardAnswers[currentQuestion.id] === option.value
                    ? "border-[rgb(163,255,18)] bg-[rgb(163,255,18)]/10"
                    : "border-white/20 hover:border-white/40"
                }`}
              >
                <RadioGroupItem
                  value={option.value}
                  id={`wizard-${option.value}`}
                  className="border-white/40 text-[rgb(163,255,18)] mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{option.icon}</span>
                    <span className="text-white font-medium">{option.label}</span>
                  </div>
                  {option.description && (
                    <p className="text-xs text-white/60">{option.description}</p>
                  )}
                </div>
              </Label>
            ))}
          </div>
        </RadioGroup>

        <div className="flex items-center justify-between pt-4">
          <Button
            variant="outline"
            onClick={() => {
              if (wizardStep > 0) {
                setWizardStep(wizardStep - 1);
              } else {
                setShowWizard(false);
                setWizardAnswers({});
              }
            }}
            className="border-white/30 text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            {CONTRACT_SELECTION_QUESTIONS.map((_, i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full ${
                  i === wizardStep ? "bg-[rgb(163,255,18)]" : "bg-white/20"
                }`}
              />
            ))}
          </div>

          <Button
            onClick={() => {
              if (wizardStep < CONTRACT_SELECTION_QUESTIONS.length - 1) {
                setWizardStep(wizardStep + 1);
              } else {
                handleWizardComplete();
              }
            }}
            disabled={!wizardAnswers[currentQuestion.id]}
            className="bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90"
          >
            {wizardStep < CONTRACT_SELECTION_QUESTIONS.length - 1 ? "Next" : "Get Recommendation"}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </motion.div>
    );
  };

  // Contract Details Dialog
  const ContractDetailsDialog = () => {
    if (!selectedContractDetails) return null;

    return (
      <Dialog
        open={!!selectedContractDetails && !showWizard}
        onOpenChange={(open) => !open && setSelectedContractDetails(null)}
      >
        <DialogContent className="bg-black/95 border-white/20 text-white max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-3">
              {selectedContractDetails.name}
              {selectedContractDetails.audited && (
                <Badge className="bg-green-500/20 text-green-400">
                  <Shield className="w-3 h-3 mr-1" />
                  Audited
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription className="text-white/80 text-base">
              {selectedContractDetails.fullDescription}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-6">
            {/* Key Features */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Key Features</h4>
              <div className="grid grid-cols-2 gap-2">
                {selectedContractDetails.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-400 mt-0.5" />
                    <span className="text-sm text-white/80">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pros & Cons */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-semibold text-white mb-3">Pros</h4>
                <div className="space-y-2">
                  {selectedContractDetails.pros.map((pro, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5" />
                      <span className="text-sm text-white/80">{pro}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white mb-3">Cons</h4>
                <div className="space-y-2">
                  {selectedContractDetails.cons.map((con, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5" />
                      <span className="text-sm text-white/80">{con}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* When to Use */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">When to Use</h4>
              <div className="space-y-2">
                {selectedContractDetails.whenToUse.map((use, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-[rgb(163,255,18)] mt-0.5" />
                    <span className="text-sm text-white/80">{use}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Example Use Cases */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Example Projects</h4>
              <div className="flex flex-wrap gap-2">
                {selectedContractDetails.exampleUseCases.map((example, i) => (
                  <Badge key={i} variant="outline" className="border-white/30 text-white/80">
                    {example}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Technical Details */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-white/5 rounded-lg">
              <div>
                <p className="text-xs text-white/60 mb-1">Gas Efficiency</p>
                <GasIndicator efficiency={selectedContractDetails.gasEfficiency} />
              </div>
              <div>
                <p className="text-xs text-white/60 mb-1">Complexity</p>
                <Badge className={getComplexityColor(selectedContractDetails.complexity)}>
                  {selectedContractDetails.complexity}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-white/60 mb-1">Contract</p>
                <code className="text-xs text-white/80">{selectedContractDetails.contractName}</code>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header with Wizard Button */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">Choose Contract Type</h3>
            <p className="text-sm text-white/60 mt-1">
              Select the smart contract that best fits your needs
            </p>
          </div>
          <Button
            onClick={() => setShowWizard(true)}
            className="bg-purple-500 text-white hover:bg-purple-600"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Use Smart Wizard
          </Button>
        </div>

        {/* Wizard Dialog */}
        <Dialog open={showWizard} onOpenChange={setShowWizard}>
          <DialogContent className="bg-black/95 border-white/20 text-white">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Smart Contract Wizard
              </DialogTitle>
              <DialogDescription className="text-white/60">
                Answer a few questions to find the perfect contract
              </DialogDescription>
            </DialogHeader>
            <AnimatePresence mode="wait">
              <WizardQuestion />
            </AnimatePresence>
          </DialogContent>
        </Dialog>

        {/* Quick Filters */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  placeholder="Search contracts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-black/40 border-white/20 text-white placeholder:text-white/40"
                />
              </div>
            </div>
          </div>

          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="bg-black/40 border border-white/20">
              <TabsTrigger value="all" className="data-[state=active]:bg-white/20">
                All Contracts
              </TabsTrigger>
              <TabsTrigger value="drop-collection" className="data-[state=active]:bg-white/20">
                Drops
              </TabsTrigger>
              <TabsTrigger value="standard-collection" className="data-[state=active]:bg-white/20">
                Standard
              </TabsTrigger>
              <TabsTrigger value="edition" className="data-[state=active]:bg-white/20">
                Editions
              </TabsTrigger>
              <TabsTrigger value="open-edition" className="data-[state=active]:bg-white/20">
                Open Edition
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Contract Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContracts.map((contract) => (
            <ContractCard key={contract.id} contract={contract} />
          ))}
        </div>

        {/* Empty State */}
        {filteredContracts.length === 0 && (
          <Card className="bg-black/40 border-white/20">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <HelpCircle className="w-12 h-12 text-white/40 mb-4" />
              <p className="text-white/60 text-center">
                No contracts match your search.
                <br />
                Try different keywords or use the wizard.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Contract Details Dialog */}
        <ContractDetailsDialog />
      </div>
    </TooltipProvider>
  );
}