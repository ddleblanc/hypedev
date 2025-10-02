"use client";

import { motion } from "framer-motion";
import { Check, Plus, Trash2, Calendar, Coins } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { NATIVE_TOKEN_ADDRESS } from 'thirdweb';
import type { ClaimCondition } from '@/lib/nft-minting';
import { ContractSelector } from "./contract-selector";
import { THIRDWEB_CONTRACTS } from "@/lib/thirdweb-contracts";

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
  isMobile: boolean;
  claimPhases?: ClaimCondition[];
  setClaimPhases?: (phases: ClaimCondition[]) => void;
}

export function ConfigurationStep({
  collectionData,
  setCollectionData,
  showAdvanced,
  setShowAdvanced,
  chains,
  isMobile,
  claimPhases = [],
  setClaimPhases
}: ConfigurationStepProps) {
  const stepVariants = {
    initial: { opacity: 0, x: isMobile ? 20 : 0, y: isMobile ? 0 : 20 },
    animate: { opacity: 1, x: 0, y: 0 },
    exit: { opacity: 0, x: isMobile ? -20 : 0, y: isMobile ? 0 : -20 }
  };

  // Check if current contract type supports claim conditions
  const supportsClaimConditions = () => {
    const contract = THIRDWEB_CONTRACTS.find(c => c.id === collectionData.contractType);
    return contract?.supportsClaimConditions || false;
  };

  // Get chain symbol
  const getChainSymbol = () => {
    switch (collectionData.chainId) {
      case '1': return 'ETH';
      case '137': return 'MATIC';
      case '42161': return 'ETH';
      case '11155111': return 'ETH';
      default: return 'ETH';
    }
  };

  // Add a new claim phase
  const addClaimPhase = () => {
    if (!setClaimPhases) return;
    const newPhase: ClaimCondition = {
      startTimestamp: new Date(Date.now() + 24 * 60 * 60 * 1000), // Start tomorrow
      quantityLimitPerWallet: 0, // 0 means unlimited
      pricePerToken: "0",
      currency: NATIVE_TOKEN_ADDRESS,
      metadata: {
        name: `Phase ${claimPhases.length + 1}`,
        description: ""
      }
    };
    setClaimPhases([...claimPhases, newPhase]);
  };

  // Remove a claim phase
  const removeClaimPhase = (index: number) => {
    if (!setClaimPhases) return;
    setClaimPhases(claimPhases.filter((_, i) => i !== index));
  };

  // Update a claim phase field
  const updateClaimPhase = (index: number, field: keyof ClaimCondition, value: any) => {
    if (!setClaimPhases) return;
    const updated = [...claimPhases];
    if (field === 'metadata') {
      updated[index] = { ...updated[index], metadata: value };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setClaimPhases(updated);
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

      <div className="space-y-6">
        {/* Contract Selector */}
        <ContractSelector
          selectedContract={collectionData.contractType}
          onSelectContract={(contractId) => setCollectionData({...collectionData, contractType: contractId})}
          isMobile={isMobile}
        />

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

          {/* Claim Phases Section - Only show for supported contract types */}
          {supportsClaimConditions() && (
            <Card className="bg-black/40 border-white/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Claim Phases (Optional)</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addClaimPhase}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <Plus className="w-3 h-3 mr-2" />
                    Add Phase
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-white/60 mb-4">
                  Configure when and how users can claim NFTs from this collection. Each phase can have different pricing, limits, and timing.
                </p>

                {claimPhases.length === 0 ? (
                  <div className="p-6 border-2 border-dashed border-white/20 rounded-lg text-center">
                    <Calendar className="w-8 h-8 text-white/40 mx-auto mb-2" />
                    <p className="text-sm text-white/60">No claim phases configured</p>
                    <p className="text-xs text-white/40 mt-1">
                      Add a claim phase to control minting
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {claimPhases.map((phase, index) => (
                      <div key={index} className="border border-white/20 rounded-lg p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <Badge className="bg-[rgb(163,255,18)]/20 text-[rgb(163,255,18)] border-[rgb(163,255,18)]/30">
                            <Calendar className="w-3 h-3 mr-1" />
                            Phase {index + 1}
                          </Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-white/60 hover:text-red-500"
                            onClick={() => removeClaimPhase(index)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-white/80 text-xs">Phase Name</Label>
                            <Input
                              placeholder="Public Sale"
                              value={phase.metadata?.name || ""}
                              onChange={(e) => updateClaimPhase(index, 'metadata', {
                                ...phase.metadata,
                                name: e.target.value
                              })}
                              className="bg-black/40 border-white/20 text-white placeholder:text-white/40 text-sm"
                            />
                          </div>

                          <div>
                            <Label className="text-white/80 text-xs">Start Date & Time</Label>
                            <Input
                              type="datetime-local"
                              value={new Date(phase.startTimestamp).toISOString().slice(0, 16)}
                              onChange={(e) => updateClaimPhase(index, 'startTimestamp', new Date(e.target.value))}
                              className="bg-black/40 border-white/20 text-white text-sm"
                            />
                          </div>

                          <div>
                            <Label className="text-white/80 text-xs">Price Per Token ({getChainSymbol()})</Label>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Coins className="w-4 h-4 text-white/40" />
                                <Input
                                  type="text"
                                  placeholder="0"
                                  value={phase.pricePerToken === "0" ? "0" : (parseFloat(phase.pricePerToken) / 1e18).toString()}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    // Allow typing decimal numbers
                                    if (value === "" || value === "0") {
                                      updateClaimPhase(index, 'pricePerToken', "0");
                                    } else if (/^\d*\.?\d*$/.test(value)) {
                                      const priceInWei = (parseFloat(value) * 1e18).toFixed(0);
                                      updateClaimPhase(index, 'pricePerToken', priceInWei);
                                    }
                                  }}
                                  className="bg-black/40 border-white/20 text-white placeholder:text-white/40 text-sm"
                                />
                              </div>
                              <div className="flex flex-wrap gap-1">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateClaimPhase(index, 'pricePerToken', "0")}
                                  className="h-6 px-2 text-xs border-white/20 text-white/60 hover:bg-white/10"
                                >
                                  Free
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateClaimPhase(index, 'pricePerToken', (0.0001 * 1e18).toFixed(0))}
                                  className="h-6 px-2 text-xs border-white/20 text-white/60 hover:bg-white/10"
                                >
                                  0.0001
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateClaimPhase(index, 'pricePerToken', (0.001 * 1e18).toFixed(0))}
                                  className="h-6 px-2 text-xs border-white/20 text-white/60 hover:bg-white/10"
                                >
                                  0.001
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateClaimPhase(index, 'pricePerToken', (0.01 * 1e18).toFixed(0))}
                                  className="h-6 px-2 text-xs border-white/20 text-white/60 hover:bg-white/10"
                                >
                                  0.01
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateClaimPhase(index, 'pricePerToken', (0.1 * 1e18).toFixed(0))}
                                  className="h-6 px-2 text-xs border-white/20 text-white/60 hover:bg-white/10"
                                >
                                  0.1
                                </Button>
                              </div>
                            </div>
                          </div>

                          <div>
                            <Label className="text-white/80 text-xs">Max Per Wallet (0 = unlimited)</Label>
                            <Input
                              type="number"
                              min="0"
                              placeholder="0 for unlimited"
                              value={phase.quantityLimitPerWallet || ""}
                              onChange={(e) => {
                                const value = e.target.value === "" ? 0 : parseInt(e.target.value);
                                updateClaimPhase(index, 'quantityLimitPerWallet', value);
                              }}
                              className="bg-black/40 border-white/20 text-white placeholder:text-white/40 text-sm"
                            />
                          </div>

                          <div className="col-span-2">
                            <Label className="text-white/80 text-xs">Max Supply for Phase (Optional)</Label>
                            <Input
                              type="number"
                              placeholder="Leave empty for unlimited"
                              value={phase.maxClaimableSupply || ""}
                              onChange={(e) => updateClaimPhase(index, 'maxClaimableSupply', e.target.value ? parseInt(e.target.value) : undefined)}
                              className="bg-black/40 border-white/20 text-white placeholder:text-white/40 text-sm"
                            />
                          </div>

                          <div className="col-span-2">
                            <Label className="text-white/80 text-xs">Description (Optional)</Label>
                            <Textarea
                              placeholder="Details about this phase..."
                              value={phase.metadata?.description || ""}
                              onChange={(e) => updateClaimPhase(index, 'metadata', {
                                ...phase.metadata,
                                name: phase.metadata?.name || "",
                                description: e.target.value
                              })}
                              rows={2}
                              className="bg-black/40 border-white/20 text-white placeholder:text-white/40 text-sm resize-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

          <div className="space-y-6">
            <GasEstimationCard />
            <ContractFeaturesCard />
          </div>
        </div>
      </div>
    </motion.div>
  );
}