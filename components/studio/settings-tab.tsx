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
  Zap
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { NATIVE_TOKEN_ADDRESS } from 'thirdweb';
import type { ClaimCondition } from '@/lib/nft-minting';
import { setupClaimConditions } from '@/lib/nft-minting';
import { useActiveAccount } from 'thirdweb/react';

interface SettingsTabProps {
  collection: any;
}

export function SettingsTab({ collection }: SettingsTabProps) {
  const account = useActiveAccount();
  const [claimPhases, setClaimPhases] = useState<ClaimCondition[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Check if contract supports claim conditions
  const supportsClaimConditions = () => {
    return ['DropERC721', 'OpenEditionERC721', 'EditionDrop'].includes(collection.contractType);
  };

  // Load claim phases from database
  useEffect(() => {
    if (collection?.claimPhases) {
      try {
        const phases = JSON.parse(collection.claimPhases);
        setClaimPhases(phases);
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
            <Button
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
                const phaseStart = new Date(phase.startTimestamp);
                const isActive = phaseStart <= now && (!claimPhases[index + 1] || new Date(claimPhases[index + 1].startTimestamp) > now);
                const isPast = phaseStart <= now && !isActive;
                const isFuture = phaseStart > now;

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

                      {/* Start Time */}
                      <div>
                        <Label className="text-white/80 text-xs">Start Date & Time</Label>
                        <Input
                          type="datetime-local"
                          value={new Date(phase.startTimestamp).toISOString().slice(0, 16)}
                          onChange={(e) => updateClaimPhase(index, 'startTimestamp', new Date(e.target.value))}
                          className="bg-black/40 border-white/20 text-white"
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