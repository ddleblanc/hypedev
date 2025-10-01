"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  Calendar,
  Coins,
  Users,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  Sparkles,
  Shield,
  Globe,
  ArrowRight
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { NATIVE_TOKEN_ADDRESS } from 'thirdweb';
import type { ClaimCondition } from '@/lib/nft-minting';
import { setupClaimConditions, getClaimConditions } from '@/lib/nft-minting';
import { useActiveAccount } from 'thirdweb/react';
import { MagicDateTimePicker } from '@/components/ui/magic-datetime-picker';

interface SettingsTabProps {
  collection: any;
}

export function SettingsTab({ collection }: SettingsTabProps) {
  const account = useActiveAccount();
  const [claimPhases, setClaimPhases] = useState<ClaimCondition[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [contractConditions, setContractConditions] = useState<any[]>([]);

  // Check if contract supports claim conditions
  const supportsClaimConditions = () => {
    return ['DropERC721', 'OpenEditionERC721', 'EditionDrop'].includes(collection.contractType);
  };

  // Check if contract supports multiple phases
  const supportsMultiplePhases = () => {
    // OpenEditionERC721 only supports single phase
    // DropERC721 and EditionDrop support multiple phases
    return ['DropERC721', 'EditionDrop'].includes(collection.contractType);
  };

  // Load claim phases from database
  useEffect(() => {
    if (collection?.claimPhases) {
      try {
        const phases = JSON.parse(collection.claimPhases);
        // Ensure dates are properly converted
        const validatedPhases = phases.map((phase: any) => ({
          ...phase,
          startTimestamp: phase.startTimestamp ? new Date(phase.startTimestamp) : new Date()
        }));
        setClaimPhases(validatedPhases);
      } catch (error) {
        console.error('Error parsing claim phases:', error);
      }
    }
  }, [collection]);

  // Get chain symbol
  const getChainSymbol = () => {
    switch (collection?.chainId) {
      case 1: return 'ETH';
      case 137: return 'MATIC';
      case 42161: return 'ETH';
      case 11155111: return 'ETH';
      default: return 'ETH';
    }
  };

  // Add a new claim phase
  const addClaimPhase = () => {
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

  // Apply preset templates
  const applyPreset = (presetType: 'public' | 'allowlist' | 'public-allowlist') => {
    const now = new Date();
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // For single-phase contracts, only allow single phase presets
    if (!supportsMultiplePhases() && presetType === 'public-allowlist') {
      setErrorMessage('This contract type only supports single phase configurations. Please choose Public or Allowlist only.');
      setSaveStatus('error');
      setTimeout(() => {
        setSaveStatus('idle');
        setErrorMessage('');
      }, 3000);
      return;
    }

    switch (presetType) {
      case 'public':
        // Simple public mint
        setClaimPhases([
          {
            startTimestamp: now,
            quantityLimitPerWallet: 5, // Reasonable default limit
            pricePerToken: "0", // Free mint by default
            currency: NATIVE_TOKEN_ADDRESS,
            metadata: {
              name: "Public Sale",
              description: "Open to everyone"
            }
          }
        ]);
        break;

      case 'allowlist':
        // Allowlist only
        setClaimPhases([
          {
            startTimestamp: now,
            quantityLimitPerWallet: 1,
            pricePerToken: "0",
            currency: NATIVE_TOKEN_ADDRESS,
            merkleRootHash: "0x0000000000000000000000000000000000000000000000000000000000000000", // Will need to be set
            metadata: {
              name: "Allowlist Only",
              description: "Exclusive access for allowlisted wallets"
            }
          }
        ]);
        break;

      case 'public-allowlist':
        // Two phases: Allowlist first, then public
        // Only available for multi-phase contracts
        if (supportsMultiplePhases()) {
          const allowlistStart = now;
          const publicStart = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days after allowlist

          setClaimPhases([
            {
              startTimestamp: allowlistStart,
              quantityLimitPerWallet: 2,
              pricePerToken: "0",
              currency: NATIVE_TOKEN_ADDRESS,
              merkleRootHash: "0x0000000000000000000000000000000000000000000000000000000000000000", // Will need to be set
              metadata: {
                name: "Allowlist Presale",
                description: "Early access for allowlisted wallets"
              }
            },
            {
              startTimestamp: publicStart,
              quantityLimitPerWallet: 1,
              pricePerToken: (0.001 * 1e18).toString(), // 0.001 ETH
              currency: NATIVE_TOKEN_ADDRESS,
              metadata: {
                name: "Public Sale",
                description: "Open to everyone after presale"
              }
            }
          ]);
        }
        break;
    }
  };

  // Remove a claim phase
  const removeClaimPhase = (index: number) => {
    setClaimPhases(claimPhases.filter((_, i) => i !== index));
  };

  // Update a claim phase field
  const updateClaimPhase = (index: number, field: keyof ClaimCondition, value: any) => {
    const updated = [...claimPhases];
    if (field === 'metadata') {
      updated[index] = { ...updated[index], metadata: value };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setClaimPhases(updated);
  };

  // Verify claim conditions from smart contract
  const verifyClaimConditions = async () => {
    setIsVerifying(true);
    try {
      const conditions = await getClaimConditions(collection.address, collection.chainId);
      setContractConditions(conditions);
      console.log('Fetched claim conditions from contract:', conditions);

      // Show success message
      setSaveStatus('success');
      setErrorMessage('');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error verifying claim conditions:', error);
      setErrorMessage('Failed to fetch claim conditions from contract');
      setSaveStatus('error');
    } finally {
      setIsVerifying(false);
    }
  };

  // Save claim conditions to smart contract
  const saveClaimConditions = async () => {
    if (!account) {
      setErrorMessage('Please connect your wallet first');
      setSaveStatus('error');
      return;
    }

    setIsSaving(true);
    setSaveStatus('idle');
    setErrorMessage('');

    try {
      // Ensure all claim phases have proper data
      const formattedPhases = claimPhases.map(phase => ({
        ...phase,
        startTimestamp: phase.startTimestamp instanceof Date ? phase.startTimestamp : new Date(phase.startTimestamp),
        quantityLimitPerWallet: phase.quantityLimitPerWallet || 0, // 0 means unlimited in our UI, will be converted to max uint256 in setupClaimConditions
        pricePerToken: phase.pricePerToken || "0",
        currency: phase.currency || NATIVE_TOKEN_ADDRESS,
      }));

      console.log('Saving claim conditions:', formattedPhases);

      // Save to smart contract
      await setupClaimConditions(
        collection.address,
        collection.chainId,
        formattedPhases,
        account
      );

      // Also save to database
      const response = await fetch(`/api/studio/collections/${collection.id}/claim-phases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          claimPhases: JSON.stringify(claimPhases)
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save to database');
      }

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error saving claim conditions:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save claim conditions');
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!supportsClaimConditions()) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This contract type ({collection.contractType}) does not support claim conditions.
            Claim conditions are available for DropERC721, OpenEditionERC721, and EditionDrop contracts.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const now = new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-[rgb(163,255,18)]" />
            Contract Settings
          </h2>
          <p className="text-white/60 mt-1">
            Manage claim conditions and minting settings for your collection
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saveStatus === 'success' && (
            <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
              <CheckCircle className="w-3 h-3 mr-1" />
              Saved
            </Badge>
          )}
          {saveStatus === 'error' && (
            <Badge className="bg-red-500/20 text-red-500 border-red-500/30">
              <AlertCircle className="w-3 h-3 mr-1" />
              Error
            </Badge>
          )}
          <Button
            variant="outline"
            onClick={verifyClaimConditions}
            disabled={isVerifying}
            className="border-white/20 text-white hover:bg-white/10"
          >
            {isVerifying ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Verify On-Chain
              </>
            )}
          </Button>
          <Button
            onClick={saveClaimConditions}
            disabled={isSaving || claimPhases.length === 0}
            className="bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save to Contract
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <Alert className="border-red-500/30 bg-red-500/10">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-500">
            {errorMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Contract Info */}
      <Card className="bg-black/40 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Contract Information</CardTitle>
          <CardDescription className="text-white/60">
            Current contract configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-white/60 text-xs">Contract Type</Label>
            <p className="text-white font-medium">{collection.contractType}</p>
          </div>
          <div>
            <Label className="text-white/60 text-xs">Chain</Label>
            <p className="text-white font-medium">
              {collection.chainId === 1 ? 'Ethereum' :
               collection.chainId === 137 ? 'Polygon' :
               collection.chainId === 42161 ? 'Arbitrum' :
               collection.chainId === 11155111 ? 'Sepolia' : 'Unknown'}
            </p>
          </div>
          <div>
            <Label className="text-white/60 text-xs">Contract Address</Label>
            <p className="text-white font-mono text-sm">{collection.address}</p>
          </div>
        </CardContent>
      </Card>

      {/* On-Chain Verification Results */}
      {contractConditions.length > 0 && (
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              On-Chain Claim Conditions
            </CardTitle>
            <CardDescription className="text-white/60">
              Current conditions set on the smart contract
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-black/60 p-4 rounded-lg text-xs text-white/80 overflow-x-auto">
              {JSON.stringify(contractConditions, (key, value) => {
                // Convert BigInt values to strings for JSON serialization
                if (typeof value === 'bigint') {
                  return value.toString();
                }
                return value;
              }, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Preset Templates */}
      <Card className="bg-black/40 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[rgb(163,255,18)]" />
            Quick Setup Presets
          </CardTitle>
          <CardDescription className="text-white/60">
            Use a preset template to quickly configure your claim conditions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => applyPreset('public')}
              className="group relative p-4 rounded-lg border border-white/20 bg-black/40 hover:bg-white/5 hover:border-[rgb(163,255,18)]/50 transition-all"
            >
              <div className="flex items-center gap-3 mb-2">
                <Globe className="w-5 h-5 text-[rgb(163,255,18)]" />
                <span className="font-semibold text-white">Public Sale</span>
              </div>
              <p className="text-sm text-white/60 text-left">
                Simple public mint open to everyone with a per-wallet limit
              </p>
            </button>

            <button
              onClick={() => applyPreset('allowlist')}
              className="group relative p-4 rounded-lg border border-white/20 bg-black/40 hover:bg-white/5 hover:border-[rgb(163,255,18)]/50 transition-all"
            >
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-5 h-5 text-[rgb(163,255,18)]" />
                <span className="font-semibold text-white">Allowlist Only</span>
              </div>
              <p className="text-sm text-white/60 text-left">
                Exclusive access for pre-approved wallet addresses only
              </p>
            </button>

            <button
              onClick={() => applyPreset('public-allowlist')}
              disabled={!supportsMultiplePhases()}
              className={cn(
                "group relative p-4 rounded-lg border transition-all",
                supportsMultiplePhases()
                  ? "border-white/20 bg-black/40 hover:bg-white/5 hover:border-[rgb(163,255,18)]/50 cursor-pointer"
                  : "border-white/10 bg-black/20 cursor-not-allowed opacity-50"
              )}
            >
              <div className="flex items-center gap-3 mb-2">
                <Zap className={cn(
                  "w-5 h-5",
                  supportsMultiplePhases() ? "text-[rgb(163,255,18)]" : "text-white/30"
                )} />
                <span className={cn(
                  "font-semibold",
                  supportsMultiplePhases() ? "text-white" : "text-white/50"
                )}>
                  Presale + Public
                </span>
                {!supportsMultiplePhases() && (
                  <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30 text-xs">
                    Multi-phase only
                  </Badge>
                )}
              </div>
              <p className={cn(
                "text-sm text-left",
                supportsMultiplePhases() ? "text-white/60" : "text-white/30"
              )}>
                Allowlist presale followed by public sale phase
              </p>
            </button>
          </div>

          {claimPhases.some(phase => phase.merkleRootHash === "0x0000000000000000000000000000000000000000000000000000000000000000") && (
            <Alert className="mt-4 border-yellow-500/30 bg-yellow-500/10">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-yellow-500">
                Note: You'll need to set up the allowlist merkle root for allowlist phases.
                Upload a CSV with wallet addresses to generate the merkle tree.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Claim Phases */}
      <Card className="bg-black/40 border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[rgb(163,255,18)]" />
                Claim Phases
              </CardTitle>
              <CardDescription className="text-white/60">
                Configure when and how users can mint from this collection
              </CardDescription>
            </div>
            {supportsMultiplePhases() && claimPhases.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={addClaimPhase}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Plus className="w-3 h-3 mr-2" />
                Add Custom Phase
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Contract Type Warning */}
          {collection.contractType === 'OpenEditionERC721' && claimPhases.length > 1 && (
            <Alert className="mb-4 border-yellow-500/30 bg-yellow-500/10">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-yellow-500">
                <strong>Note:</strong> OpenEditionERC721 contracts only support one active claim condition at a time.
                When you save multiple phases, only the currently active one will be set on the contract.
                The phases are stored for your reference and you'll need to manually update the contract when transitioning between phases.
              </AlertDescription>
            </Alert>
          )}
          {claimPhases.length === 0 ? (
            <div className="p-8 border-2 border-dashed border-white/20 rounded-lg text-center">
              <Calendar className="w-10 h-10 text-white/40 mx-auto mb-3" />
              <p className="text-white/60 mb-1">No claim phases configured</p>
              <p className="text-sm text-white/40">
                Add a claim phase to control when and how users can mint
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {claimPhases.map((phase, index) => {
                const phaseStart = (() => {
                  try {
                    const date = phase.startTimestamp instanceof Date
                      ? phase.startTimestamp
                      : new Date(phase.startTimestamp);
                    return isNaN(date.getTime()) ? new Date() : date;
                  } catch {
                    return new Date();
                  }
                })();

                const nextPhaseStart = claimPhases[index + 1] ? (() => {
                  try {
                    const date = claimPhases[index + 1].startTimestamp instanceof Date
                      ? claimPhases[index + 1].startTimestamp
                      : new Date(claimPhases[index + 1].startTimestamp);
                    return isNaN(date.getTime()) ? null : date;
                  } catch {
                    return null;
                  }
                })() : null;

                const isActive = phaseStart <= now && (!nextPhaseStart || nextPhaseStart > now);
                const isPast = phaseStart <= now && !isActive;
                const hasAllowlist = phase.merkleRootHash && phase.merkleRootHash !== "0x0000000000000000000000000000000000000000000000000000000000000000";

                return (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 space-y-4 ${
                      isActive ? 'border-[rgb(163,255,18)]/50 bg-[rgb(163,255,18)]/5' :
                      isPast ? 'border-white/10 opacity-60' :
                      'border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-[rgb(163,255,18)]/20 text-[rgb(163,255,18)] border-[rgb(163,255,18)]/30">
                          Phase {index + 1}
                        </Badge>
                        {index > 0 && (
                          <div className="flex items-center gap-1 text-xs text-white/40">
                            <ArrowRight className="w-3 h-3" />
                            <span>
                              {(() => {
                                const prevDate = claimPhases[index - 1].startTimestamp;
                                const currDate = phase.startTimestamp;
                                const diff = new Date(currDate).getTime() - new Date(prevDate).getTime();
                                const hours = Math.floor(diff / (1000 * 60 * 60));
                                const days = Math.floor(hours / 24);
                                const weeks = Math.floor(days / 7);

                                if (weeks > 0) {
                                  return `${weeks} week${weeks > 1 ? 's' : ''} after Phase ${index}`;
                                } else if (days > 0) {
                                  return `${days} day${days > 1 ? 's' : ''} after Phase ${index}`;
                                } else if (hours > 0) {
                                  return `${hours} hour${hours > 1 ? 's' : ''} after Phase ${index}`;
                                } else {
                                  return `Same time as Phase ${index}`;
                                }
                              })()}
                            </span>
                          </div>
                        )}
                        {hasAllowlist && (
                          <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/30">
                            <Shield className="w-3 h-3 mr-1" />
                            Allowlist
                          </Badge>
                        )}
                        {isActive && (
                          <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                            <Zap className="w-3 h-3 mr-1" />
                            Active Now
                          </Badge>
                        )}
                        {isPast && (
                          <Badge variant="secondary" className="bg-white/10">
                            <Clock className="w-3 h-3 mr-1" />
                            Past
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white/60 hover:text-red-500"
                        onClick={() => removeClaimPhase(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Phase Name */}
                      <div>
                        <Label className="text-white/80 text-xs">Phase Name</Label>
                        <Input
                          placeholder="Public Sale"
                          value={phase.metadata?.name || ""}
                          onChange={(e) => updateClaimPhase(index, 'metadata', {
                            ...phase.metadata,
                            name: e.target.value
                          })}
                          className="bg-black/40 border-white/20 text-white"
                        />
                      </div>

                      {/* Start Time - Premium Mobile-First Picker */}
                      <div className="md:col-span-1">
                        <MagicDateTimePicker
                          label="Start Date & Time"
                          value={(() => {
                            try {
                              const date = phase.startTimestamp instanceof Date
                                ? phase.startTimestamp
                                : new Date(phase.startTimestamp);

                              // Check if date is valid
                              if (isNaN(date.getTime())) {
                                // Return current date as fallback
                                return new Date();
                              }

                              return date;
                            } catch (e) {
                              // Return current date as fallback
                              return new Date();
                            }
                          })()}
                          onChange={(newDate) => updateClaimPhase(index, 'startTimestamp', newDate)}
                          minDate={index > 0 && claimPhases[index - 1] ?
                            (() => {
                              try {
                                const prevDate = claimPhases[index - 1].startTimestamp instanceof Date
                                  ? claimPhases[index - 1].startTimestamp
                                  : new Date(claimPhases[index - 1].startTimestamp);
                                return isNaN(prevDate.getTime()) ? new Date() : prevDate;
                              } catch {
                                return new Date();
                              }
                            })()
                            : new Date()}
                          previousPhaseEnd={index > 0 && claimPhases[index - 1] ?
                            (() => {
                              try {
                                const prevDate = claimPhases[index - 1].startTimestamp instanceof Date
                                  ? claimPhases[index - 1].startTimestamp
                                  : new Date(claimPhases[index - 1].startTimestamp);
                                return isNaN(prevDate.getTime()) ? new Date() : prevDate;
                              } catch {
                                return new Date();
                              }
                            })()
                            : undefined}
                          phaseIndex={index}
                        />
                      </div>

                      {/* Price */}
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
                                if (value === "" || value === "0") {
                                  updateClaimPhase(index, 'pricePerToken', "0");
                                } else if (/^\d*\.?\d*$/.test(value)) {
                                  const priceInWei = (parseFloat(value) * 1e18).toFixed(0);
                                  updateClaimPhase(index, 'pricePerToken', priceInWei);
                                }
                              }}
                              className="bg-black/40 border-white/20 text-white"
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

                      {/* Max Per Wallet */}
                      <div>
                        <Label className="text-white/80 text-xs">Max Per Wallet (0 or empty = unlimited)</Label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0 for unlimited"
                          value={phase.quantityLimitPerWallet || ""}
                          onChange={(e) => {
                            const value = e.target.value === "" ? 0 : parseInt(e.target.value);
                            updateClaimPhase(index, 'quantityLimitPerWallet', value);
                          }}
                          className="bg-black/40 border-white/20 text-white placeholder:text-white/40"
                        />
                      </div>

                      {/* Max Supply for Phase */}
                      <div className="md:col-span-2">
                        <Label className="text-white/80 text-xs">Max Supply for Phase (Optional)</Label>
                        <Input
                          type="number"
                          placeholder="Leave empty for unlimited"
                          value={phase.maxClaimableSupply || ""}
                          onChange={(e) => updateClaimPhase(index, 'maxClaimableSupply', e.target.value ? parseInt(e.target.value) : undefined)}
                          className="bg-black/40 border-white/20 text-white placeholder:text-white/40"
                        />
                      </div>

                      {/* Description */}
                      <div className="md:col-span-2">
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
                          className="bg-black/40 border-white/20 text-white placeholder:text-white/40 resize-none"
                        />
                      </div>

                      {/* Allowlist Section */}
                      <div className="md:col-span-2">
                        <Label className="text-white/80 text-xs flex items-center gap-2">
                          <Shield className="w-3 h-3" />
                          Allowlist Configuration (Optional)
                        </Label>
                        <div className="mt-2 p-3 bg-black/20 rounded-lg space-y-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={!!phase.merkleRootHash && phase.merkleRootHash !== "0x0000000000000000000000000000000000000000000000000000000000000000"}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  updateClaimPhase(index, 'merkleRootHash', "0x0000000000000000000000000000000000000000000000000000000000000000");
                                } else {
                                  updateClaimPhase(index, 'merkleRootHash', undefined);
                                }
                              }}
                              className="rounded border-white/20 bg-black/40 text-[rgb(163,255,18)] focus:ring-[rgb(163,255,18)]"
                            />
                            <Label className="text-white text-sm cursor-pointer">
                              Enable allowlist for this phase
                            </Label>
                          </div>

                          {phase.merkleRootHash && phase.merkleRootHash !== "0x0000000000000000000000000000000000000000000000000000000000000000" && (
                            <Alert className="border-yellow-500/30 bg-yellow-500/10">
                              <AlertCircle className="h-3 w-3 text-yellow-500" />
                              <AlertDescription className="text-yellow-500 text-xs">
                                Upload a CSV file with wallet addresses to generate the merkle root automatically
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}