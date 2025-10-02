"use client";

import { motion } from "framer-motion";
import { AlertCircle, Check, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { THIRDWEB_CONTRACTS } from "@/lib/thirdweb-contracts";

interface ReviewStepProps {
  createMode: 'new-project' | 'existing-project' | null;
  projectData: {
    name: string;
    description: string;
  };
  selectedProject: string;
  projects: any[];
  collectionData: {
    name: string;
    symbol: string;
    description: string;
    category: string;
    chainId: string;
    contractType: string;
    maxSupply: string;
    royaltyPercentage: string;
  };
  chains: Array<{ id: string; name: string; icon: string }>;
  isDeploying: boolean;
  handleDeploy: () => void;
  isMobile: boolean;
}

export function ReviewStep({
  createMode,
  projectData,
  selectedProject,
  projects,
  collectionData,
  chains,
  isDeploying,
  handleDeploy,
  isMobile
}: ReviewStepProps) {
  const stepVariants = {
    initial: { opacity: 0, x: isMobile ? 20 : 0, y: isMobile ? 0 : 20 },
    animate: { opacity: 1, x: 0, y: 0 },
    exit: { opacity: 0, x: isMobile ? -20 : 0, y: isMobile ? 0 : -20 }
  };

  const DeploymentChecklistCard = () => (
    <Card className="bg-gradient-to-br from-purple-900/20 to-[rgb(163,255,18)]/10 border-white/20">
      <CardHeader>
        <CardTitle className="text-white">Deployment Checklist</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-[rgb(163,255,18)] flex items-center justify-center">
            <Check className="w-3 h-3 text-black" />
          </div>
          <span className="text-sm text-white">Project configured</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-[rgb(163,255,18)] flex items-center justify-center">
            <Check className="w-3 h-3 text-black" />
          </div>
          <span className="text-sm text-white">Collection details set</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-[rgb(163,255,18)] flex items-center justify-center">
            <Check className="w-3 h-3 text-black" />
          </div>
          <span className="text-sm text-white">Contract configured</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white/60" />
          </div>
          <span className="text-sm text-white/60">Wallet connected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white/60" />
          </div>
          <span className="text-sm text-white/60">Gas fees ready</span>
        </div>
      </CardContent>
    </Card>
  );

  const NextStepsCard = () => (
    <Card className="bg-black/40 border-white/20">
      <CardHeader>
        <CardTitle className="text-white">Next Steps</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <div className="text-[rgb(163,255,18)]">1.</div>
          <p className="text-sm text-white/80">Deploy your contract to blockchain</p>
        </div>
        <div className="flex gap-2">
          <div className="text-[rgb(163,255,18)]">2.</div>
          <p className="text-sm text-white/80">Upload your NFT metadata and images</p>
        </div>
        <div className="flex gap-2">
          <div className="text-[rgb(163,255,18)]">3.</div>
          <p className="text-sm text-white/80">Configure minting phases and pricing</p>
        </div>
        <div className="flex gap-2">
          <div className="text-[rgb(163,255,18)]">4.</div>
          <p className="text-sm text-white/80">Launch and promote your collection</p>
        </div>
      </CardContent>
    </Card>
  );

  if (isMobile) {
    return (
      <motion.div
        variants={stepVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        <h3 className="text-xl font-bold text-white mb-4">Review & Deploy</h3>

        <Card className="bg-black/40 border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {createMode === 'new-project' && (
              <div className="pb-4 border-b border-white/10">
                <p className="text-xs text-white/60 uppercase mb-1">New Project</p>
                <p className="text-white font-semibold">{projectData.name}</p>
                <p className="text-sm text-white/60">{projectData.description}</p>
              </div>
            )}

            {createMode === 'existing-project' && selectedProject && (
              <div className="pb-4 border-b border-white/10">
                <p className="text-xs text-white/60 uppercase mb-1">Project</p>
                <p className="text-white font-semibold">
                  {projects.find((p: any) => p.id === selectedProject)?.name}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-white/60">Collection Name:</span>
                <span className="text-white">{collectionData.name || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Symbol:</span>
                <span className="text-white">{collectionData.symbol || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Chain:</span>
                <span className="text-white">
                  {chains.find(c => c.id === collectionData.chainId)?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Max Supply:</span>
                <span className="text-white">{collectionData.maxSupply || 'Unlimited'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Royalty:</span>
                <span className="text-white">{collectionData.royaltyPercentage}%</span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                <div className="flex gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-500 font-semibold">Deployment Cost</p>
                    <p className="text-xs text-white/60 mt-1">
                      Deploying this contract will require a gas fee. Make sure you have enough ETH in your wallet.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={stepVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Review & Deploy</h2>
        <p className="text-white/60">Review your settings before deploying to blockchain</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Card className="bg-black/40 border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Collection Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Project Info */}
              <div>
                <h4 className="text-sm font-semibold text-white/60 uppercase mb-3">Project</h4>
                <div className="bg-black/40 rounded-lg p-4 border border-white/10">
                  {createMode === 'new-project' ? (
                    <div>
                      <Badge className="bg-[rgb(163,255,18)]/20 text-[rgb(163,255,18)] mb-2">NEW PROJECT</Badge>
                      <p className="text-white font-semibold text-lg">{projectData.name}</p>
                      <p className="text-white/60 text-sm mt-1">{projectData.description}</p>
                    </div>
                  ) : (
                    <div>
                      <Badge className="bg-purple-500/20 text-purple-500 mb-2">EXISTING PROJECT</Badge>
                      <p className="text-white font-semibold text-lg">
                        {projects.find((p: any) => p.id === selectedProject)?.name}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Collection Info */}
              <div>
                <h4 className="text-sm font-semibold text-white/60 uppercase mb-3">Collection Details</h4>
                <div className="bg-black/40 rounded-lg p-4 border border-white/10">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-white/60">Name</p>
                      <p className="text-white font-semibold">{collectionData.name || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/60">Symbol</p>
                      <p className="text-white font-semibold">{collectionData.symbol || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/60">Category</p>
                      <p className="text-white font-semibold">{collectionData.category || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/60">Max Supply</p>
                      <p className="text-white font-semibold">{collectionData.maxSupply || 'Unlimited'}</p>
                    </div>
                  </div>
                  {collectionData.description && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-xs text-white/60 mb-1">Description</p>
                      <p className="text-white/80 text-sm">{collectionData.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Contract Info */}
              <div>
                <h4 className="text-sm font-semibold text-white/60 uppercase mb-3">Contract Settings</h4>
                <div className="bg-black/40 rounded-lg p-4 border border-white/10">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-white/60">Blockchain</p>
                      <p className="text-white font-semibold">
                        {chains.find(c => c.id === collectionData.chainId)?.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-white/60">Contract Type</p>
                      <p className="text-white font-semibold">
                        {THIRDWEB_CONTRACTS.find(t => t.id === collectionData.contractType)?.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-white/60">Royalty</p>
                      <p className="text-white font-semibold">{collectionData.royaltyPercentage}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/60">Status</p>
                      <Badge className="bg-yellow-500/20 text-yellow-500">Ready to Deploy</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-yellow-500/10 border-yellow-500/30">
            <CardHeader>
              <CardTitle className="text-yellow-500 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Important Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <div className="w-1 h-1 rounded-full bg-yellow-500 flex-shrink-0 mt-2" />
                <p className="text-sm text-white/80">
                  Deploying a smart contract is permanent and cannot be undone
                </p>
              </div>
              <div className="flex gap-2">
                <div className="w-1 h-1 rounded-full bg-yellow-500 flex-shrink-0 mt-2" />
                <p className="text-sm text-white/80">
                  You will need ETH in your wallet to pay for gas fees
                </p>
              </div>
              <div className="flex gap-2">
                <div className="w-1 h-1 rounded-full bg-yellow-500 flex-shrink-0 mt-2" />
                <p className="text-sm text-white/80">
                  Contract ownership will be assigned to your connected wallet
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <DeploymentChecklistCard />
          <NextStepsCard />
        </div>
      </div>
    </motion.div>
  );
}