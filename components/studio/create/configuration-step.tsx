"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";

interface ConfigurationStepProps {
  collectionData: {
    chainId: string;
    contractType: string;
    maxSupply: string;
    royaltyPercentage: string;
  };
  setCollectionData: (data: any) => void;
  showAdvanced: boolean;
  setShowAdvanced: (show: boolean) => void;
  chains: Array<{ id: string; name: string; icon: string }>;
  contractTypes: Array<{ id: string; name: string; description: string }>;
  isMobile: boolean;
}

export function ConfigurationStep({
  collectionData,
  setCollectionData,
  showAdvanced,
  setShowAdvanced,
  chains,
  contractTypes,
  isMobile
}: ConfigurationStepProps) {
  const stepVariants = {
    initial: { opacity: 0, x: isMobile ? 20 : 0, y: isMobile ? 0 : 20 },
    animate: { opacity: 1, x: 0, y: 0 },
    exit: { opacity: 0, x: isMobile ? -20 : 0, y: isMobile ? 0 : -20 }
  };

  const GasEstimationCard = () => (
    <Card className="bg-gradient-to-br from-purple-900/20 to-[rgb(163,255,18)]/10 border-white/20">
      <CardHeader>
        <CardTitle className="text-white text-lg">Gas Estimation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-white/60">Contract Deploy</span>
            <span className="text-white">~0.02 ETH</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">First Mint</span>
            <span className="text-white">~0.001 ETH</span>
          </div>
          <div className="pt-3 border-t border-white/10">
            <div className="flex justify-between font-bold">
              <span className="text-white">Total Estimated</span>
              <span className="text-[rgb(163,255,18)]">~0.021 ETH</span>
            </div>
            <p className="text-xs text-white/40 mt-2">*Estimates may vary based on network conditions</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const ContractFeaturesCard = () => (
    <Card className="bg-black/40 border-white/20">
      <CardHeader>
        <CardTitle className="text-white text-lg">Contract Features</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {[
          "ERC-721 Compliant",
          "Royalty Support",
          "Metadata On-Chain",
          "Pausable Minting",
          "Bulk Transfers"
        ].map((feature) => (
          <div key={feature} className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[rgb(163,255,18)]" />
            <span className="text-sm text-white">{feature}</span>
          </div>
        ))}
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
        <h3 className="text-xl font-bold text-white mb-4">Contract Configuration</h3>

        <Card className="bg-black/40 border-white/20">
          <CardContent className="space-y-4 pt-6">
            <div>
              <Label className="text-white mb-2 block">Blockchain</Label>
              <RadioGroup value={collectionData.chainId} onValueChange={(value) => setCollectionData({...collectionData, chainId: value})}>
                {chains.map((chain) => (
                  <div key={chain.id} className="flex items-center space-x-2 mb-2">
                    <RadioGroupItem value={chain.id} id={`mobile-chain-${chain.id}`} className="border-white/40 text-[rgb(163,255,18)]" />
                    <Label htmlFor={`mobile-chain-${chain.id}`} className="text-white cursor-pointer flex items-center gap-2">
                      <span>{chain.icon}</span>
                      {chain.name}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="max-supply" className="text-white">Max Supply</Label>
              <Input
                id="max-supply"
                type="number"
                value={collectionData.maxSupply}
                onChange={(e) => setCollectionData({...collectionData, maxSupply: e.target.value})}
                placeholder="10000"
                className="bg-black/40 border-white/20 text-white placeholder:text-white/40"
              />
              <p className="text-xs text-white/40 mt-1">Leave empty for unlimited supply</p>
            </div>

            <div>
              <Label htmlFor="royalty" className="text-white">Royalty Percentage</Label>
              <Input
                id="royalty"
                type="number"
                min="0"
                max="10"
                step="0.5"
                value={collectionData.royaltyPercentage}
                onChange={(e) => setCollectionData({...collectionData, royaltyPercentage: e.target.value})}
                className="bg-black/40 border-white/20 text-white placeholder:text-white/40"
              />
              <p className="text-xs text-white/40 mt-1">Percentage of secondary sales (0-10%)</p>
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
        <h2 className="text-2xl font-bold text-white mb-2">Contract Configuration</h2>
        <p className="text-white/60">Configure your smart contract settings</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Card className="bg-black/40 border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Blockchain Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white mb-3 block">Select Blockchain</Label>
                <RadioGroup value={collectionData.chainId} onValueChange={(value) => setCollectionData({...collectionData, chainId: value})}>
                  <div className="grid grid-cols-2 gap-4">
                    {chains.map((chain) => (
                      <Label
                        key={chain.id}
                        htmlFor={`chain-${chain.id}`}
                        className={`flex items-center gap-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                          collectionData.chainId === chain.id
                            ? 'border-[rgb(163,255,18)] bg-[rgb(163,255,18)]/10'
                            : 'border-white/20 hover:border-white/40'
                        }`}
                      >
                        <RadioGroupItem value={chain.id} id={`chain-${chain.id}`} className="border-white/40 text-[rgb(163,255,18)]" />
                        <span className="text-2xl">{chain.icon}</span>
                        <div>
                          <p className="text-white font-semibold">{chain.name}</p>
                          <p className="text-xs text-white/60">Chain ID: {chain.id}</p>
                        </div>
                      </Label>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-white mb-3 block">Contract Type</Label>
                <RadioGroup value={collectionData.contractType} onValueChange={(value) => setCollectionData({...collectionData, contractType: value})}>
                  <div className="space-y-3">
                    {contractTypes.map((type) => (
                      <Label
                        key={type.id}
                        htmlFor={`contract-${type.id}`}
                        className={`flex items-start gap-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                          collectionData.contractType === type.id
                            ? 'border-[rgb(163,255,18)] bg-[rgb(163,255,18)]/10'
                            : 'border-white/20 hover:border-white/40'
                        }`}
                      >
                        <RadioGroupItem value={type.id} id={`contract-${type.id}`} className="border-white/40 text-[rgb(163,255,18)] mt-1" />
                        <div>
                          <p className="text-white font-semibold">{type.name}</p>
                          <p className="text-xs text-white/60">{type.description}</p>
                        </div>
                      </Label>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Supply & Economics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max-supply" className="text-white mb-2 block">Max Supply</Label>
                  <Input
                    id="max-supply"
                    type="number"
                    value={collectionData.maxSupply}
                    onChange={(e) => setCollectionData({...collectionData, maxSupply: e.target.value})}
                    placeholder="10000"
                    className="bg-black/40 border-white/20 text-white placeholder:text-white/40"
                  />
                  <p className="text-xs text-white/40 mt-1">Leave empty for unlimited</p>
                </div>
                <div>
                  <Label htmlFor="royalty" className="text-white mb-2 block">Royalty %</Label>
                  <Input
                    id="royalty"
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    value={collectionData.royaltyPercentage}
                    onChange={(e) => setCollectionData({...collectionData, royaltyPercentage: e.target.value})}
                    className="bg-black/40 border-white/20 text-white placeholder:text-white/40"
                  />
                  <p className="text-xs text-white/40 mt-1">0-10% recommended</p>
                </div>
              </div>

              <div className="pt-4">
                <div className="flex items-center justify-between mb-4">
                  <Label htmlFor="advanced" className="text-white">Advanced Settings</Label>
                  <Switch
                    id="advanced"
                    checked={showAdvanced}
                    onCheckedChange={setShowAdvanced}
                    className="data-[state=checked]:bg-[rgb(163,255,18)]"
                  />
                </div>
                {showAdvanced && (
                  <div className="space-y-4 pt-4 border-t border-white/10">
                    <p className="text-sm text-white/60">Advanced options coming soon...</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <GasEstimationCard />
          <ContractFeaturesCard />
        </div>
      </div>
    </motion.div>
  );
}