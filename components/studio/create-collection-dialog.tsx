"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  ImageIcon,
  Layers3,
  Loader2,
  Wallet,
  Zap,
  Shield,
  Globe,
  AlertTriangle,
  Plus,
  Trash2,
  Calendar,
  Coins
} from "lucide-react";

// Thirdweb imports for contract deployment
import { deployPublishedContract } from 'thirdweb/deploys';
import { useActiveAccount } from 'thirdweb/react';
import { client } from '@/lib/thirdweb';
import { ethereum, polygon, arbitrum, optimism, base, sepolia } from 'thirdweb/chains';
import { setupClaimConditions, type ClaimCondition } from '@/lib/nft-minting';
import { NATIVE_TOKEN_ADDRESS } from 'thirdweb';

interface CreateCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: any[];
  selectedProject?: any;
  onSuccess?: (collection: any) => void;
}

const CHAINS = [
  { id: 1, name: "Ethereum", symbol: "ETH" },
  { id: 137, name: "Polygon", symbol: "MATIC" },
  { id: 42161, name: "Arbitrum", symbol: "ETH" },
  { id: 10, name: "Optimism", symbol: "ETH" },
  { id: 8453, name: "Base", symbol: "ETH" },
  { id: 11155111, name: "Sepolia (Testnet)", symbol: "ETH" },
];

// Map chain IDs to Thirdweb chain objects
const getThirdwebChain = (chainId: number) => {
  switch (chainId) {
    case 1: return ethereum;
    case 137: return polygon;
    case 42161: return arbitrum;
    case 10: return optimism;
    case 8453: return base;
    case 11155111: return sepolia;
    default: return ethereum;
  }
};

type DeploymentStep = 'setup' | 'prepare' | 'deploy' | 'save' | 'complete';

export function CreateCollectionDialog({ 
  open, 
  onOpenChange, 
  projects, 
  selectedProject,
  onSuccess 
}: CreateCollectionDialogProps) {
  const { user } = useAuth();
  const account = useActiveAccount();
  const [currentStep, setCurrentStep] = useState<DeploymentStep>('setup');
  const [progress, setProgress] = useState(0);
  
  const [formData, setFormData] = useState({
    projectId: selectedProject?.id || "",
    name: "",
    symbol: "",
    description: "",
    image: "",
    bannerImage: "",
    royaltyPercentage: "5",
    chainId: "1",
    maxSupply: "",
    contractType: "DropERC721", // Default to NFT Drop
  });

  const [deploymentData, setDeploymentData] = useState({
    contractAddress: "",
    transactionHash: "",
  });

  const [claimPhases, setClaimPhases] = useState<ClaimCondition[]>([]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setCurrentStep('setup');
      setProgress(0);
      setFormData({
        projectId: selectedProject?.id || "",
        name: "",
        symbol: "",
        description: "",
        image: "",
        bannerImage: "",
        royaltyPercentage: "5",
        chainId: "1",
        maxSupply: "",
        contractType: "DropERC721",
      });
      setDeploymentData({
        contractAddress: "",
        transactionHash: "",
      });
      setClaimPhases([]);
    }
  }, [open, selectedProject]);

  const getStepProgress = () => {
    switch (currentStep) {
      case 'setup': return 0;
      case 'prepare': return 25;
      case 'deploy': return 50;
      case 'save': return 75;
      case 'complete': return 100;
      default: return 0;
    }
  };

  useEffect(() => {
    setProgress(getStepProgress());
  }, [currentStep]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Check if current contract type supports claim conditions
  const supportsClaimConditions = () => {
    return ['DropERC721', 'OpenEditionERC721', 'EditionDrop'].includes(formData.contractType);
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

  const deployCollection = async () => {
    if (!account || !user?.walletAddress) {
      console.error('Wallet not connected');
      return;
    }

    try {
      setCurrentStep('prepare');
      
      // Get the selected chain
      const selectedChain = CHAINS.find(c => c.id === parseInt(formData.chainId));
      if (!selectedChain) {
        throw new Error('Invalid chain selected');
      }

      setCurrentStep('deploy');

      // Deploy the selected contract type using Thirdweb v5
      const thirdwebChain = getThirdwebChain(selectedChain.id);
      const contractAddress = await deployPublishedContract({
        client,
        chain: thirdwebChain,
        account,
        contractId: formData.contractType,
        contractParams: {
          name: formData.name,
          symbol: formData.symbol,
          primarySaleRecipient: account.address,
          royaltyRecipient: account.address,
          royaltyBps: parseInt(formData.royaltyPercentage) * 100, // Convert to basis points
        },
        publisher: "thirdweb.eth", // Official Thirdweb publisher
      });

      setDeploymentData({
        contractAddress,
        transactionHash: "", // Thirdweb v5 may not return transaction hash directly
      });

      // Set claim conditions if any phases are configured and contract supports them
      if (supportsClaimConditions() && claimPhases.length > 0) {
        try {
          await setupClaimConditions(
            contractAddress,
            selectedChain.id,
            claimPhases,
            account
          );
        } catch (error) {
          console.error('Error setting claim conditions:', error);
          // Continue with saving even if claim conditions fail
        }
      }

      setCurrentStep('save');

      // Save to database
      const response = await fetch(`/api/studio/collections?address=${user.walletAddress}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          contractAddress: contractAddress,
          contractType: formData.contractType,
          chainId: parseInt(formData.chainId),
          royaltyPercentage: parseInt(formData.royaltyPercentage),
          maxSupply: formData.maxSupply ? parseInt(formData.maxSupply) : null,
          claimPhases: claimPhases.length > 0 ? JSON.stringify(claimPhases) : null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentStep('complete');
        
        setTimeout(() => {
          onSuccess?.(data.collection);
          onOpenChange(false);
        }, 2000);
      } else {
        throw new Error('Failed to save collection to database');
      }

    } catch (error) {
      console.error('Error deploying collection:', error);
      setCurrentStep('setup');
    }
  };

  const getSelectedChain = () => CHAINS.find(c => c.id === parseInt(formData.chainId));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
              <Layers3 className="w-4 h-4 text-blue-500" />
            </div>
            Create NFT Collection
          </DialogTitle>
          <DialogDescription>
            Deploy a new NFT collection smart contract on the blockchain. 
            This will create a decentralized collection that you fully own and control.
          </DialogDescription>
        </DialogHeader>

        {/* Main scrollable content */}
        <div className="flex-1 overflow-y-auto px-1">
          {/* Progress Bar */}
          {currentStep !== 'setup' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Deployment Progress</span>
              <span className="text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="text-xs text-muted-foreground">
              {currentStep === 'prepare' && 'Preparing smart contract...'}
              {currentStep === 'deploy' && 'Deploying to blockchain...'}
              {currentStep === 'save' && 'Saving collection details...'}
              {currentStep === 'complete' && 'Collection created successfully!'}
            </div>
          </div>
        )}

        {currentStep === 'setup' && (
          <form className="space-y-6 pb-4">
            {/* Project Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Project</Label>
              <Select 
                value={formData.projectId} 
                onValueChange={(value) => handleInputChange('projectId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Basic Information */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Collection Name *
                  </Label>
                  <Input
                    id="name"
                    placeholder="My Awesome Collection"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="symbol" className="text-sm font-medium">
                    Symbol *
                  </Label>
                  <Input
                    id="symbol"
                    placeholder="MAC"
                    value={formData.symbol}
                    onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
                    maxLength={10}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe your NFT collection..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <Separator />

            {/* Collection Images */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Collection Images</Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Profile Image</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4">
                    <div className="text-center space-y-2">
                      <div className="w-12 h-12 bg-muted rounded-lg mx-auto flex items-center justify-center">
                        <Upload className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <Input
                        placeholder="Image URL..."
                        value={formData.image}
                        onChange={(e) => handleInputChange('image', e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Banner Image</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4">
                    <div className="text-center space-y-2">
                      <div className="w-12 h-12 bg-muted rounded-lg mx-auto flex items-center justify-center">
                        <Upload className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <Input
                        placeholder="Banner URL..."
                        value={formData.bannerImage}
                        onChange={(e) => handleInputChange('bannerImage', e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Smart Contract Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Smart Contract Settings</Label>
              </div>

              {/* Contract Type Selection */}
              <div className="space-y-2">
                <Label className="text-sm">Contract Type</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                      formData.contractType === 'DropERC721'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-muted-foreground'
                    }`}
                    onClick={() => handleInputChange('contractType', 'DropERC721')}
                  >
                    <div className="space-y-1">
                      <div className="font-medium text-sm">NFT Drop</div>
                      <div className="text-xs text-muted-foreground">ERC721A - Unique NFTs with claim phases</div>
                    </div>
                  </div>
                  <div
                    className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                      formData.contractType === 'OpenEditionERC721'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-muted-foreground'
                    }`}
                    onClick={() => handleInputChange('contractType', 'OpenEditionERC721')}
                  >
                    <div className="space-y-1">
                      <div className="font-medium text-sm">Open Edition</div>
                      <div className="text-xs text-muted-foreground">ERC721 - Unlimited same NFT</div>
                    </div>
                  </div>
                  <div
                    className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                      formData.contractType === 'Edition'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-muted-foreground'
                    }`}
                    onClick={() => handleInputChange('contractType', 'Edition')}
                  >
                    <div className="space-y-1">
                      <div className="font-medium text-sm">Edition</div>
                      <div className="text-xs text-muted-foreground">ERC1155 - Multiple editions</div>
                    </div>
                  </div>
                  <div
                    className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                      formData.contractType === 'EditionDrop'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-muted-foreground'
                    }`}
                    onClick={() => handleInputChange('contractType', 'EditionDrop')}
                  >
                    <div className="space-y-1">
                      <div className="font-medium text-sm">Edition Drop</div>
                      <div className="text-xs text-muted-foreground">ERC1155 - Multiple tokens with phases</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Blockchain</Label>
                  <Select 
                    value={formData.chainId} 
                    onValueChange={(value) => handleInputChange('chainId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CHAINS.map((chain) => (
                        <SelectItem key={chain.id} value={chain.id.toString()}>
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4" />
                            {chain.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Royalty %</Label>
                  <Input
                    type="number"
                    min="0"
                    max="20"
                    value={formData.royaltyPercentage}
                    onChange={(e) => handleInputChange('royaltyPercentage', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Max Supply</Label>
                  <Input
                    type="number"
                    placeholder="Unlimited"
                    value={formData.maxSupply}
                    onChange={(e) => handleInputChange('maxSupply', e.target.value)}
                  />
                </div>
              </div>

              {/* Chain info */}
              {getSelectedChain() && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="w-4 h-4" />
                    <span className="font-medium">Deploying to {getSelectedChain()?.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Gas fees will be paid in {getSelectedChain()?.symbol}
                  </p>
                </div>
              )}
            </div>

            {/* DEBUG INFO */}
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-xs font-mono">
                contractType: "{formData.contractType}"<br/>
                supportsClaimConditions: {supportsClaimConditions() ? "TRUE" : "FALSE"}<br/>
                Expected: ['DropERC721', 'OpenEditionERC721', 'EditionDrop']<br/>
                Match: {['DropERC721', 'OpenEditionERC721', 'EditionDrop'].includes(formData.contractType) ? "YES" : "NO"}
              </p>
            </div>

            {/* Claim Phases Section - Only show for supported contract types */}
            {(['DropERC721', 'OpenEditionERC721', 'EditionDrop'].includes(formData.contractType)) && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <Label className="text-sm font-medium">Claim Phases (Optional)</Label>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addClaimPhase}
                      className="gap-2"
                    >
                      <Plus className="w-3 h-3" />
                      Add Phase
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Configure when and how users can claim NFTs from this collection. Each phase can have different pricing, limits, and timing.
                  </p>

                  {/* Claim Phases List */}
                  {claimPhases.length === 0 ? (
                    <div className="p-4 border-2 border-dashed border-border rounded-lg text-center">
                      <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No claim phases configured</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Add a claim phase to control minting
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {claimPhases.map((phase, index) => (
                        <div key={index} className="border border-border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary" className="gap-1">
                              <Calendar className="w-3 h-3" />
                              Phase {index + 1}
                            </Badge>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => removeClaimPhase(index)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label className="text-xs">Phase Name</Label>
                              <Input
                                placeholder="Public Sale"
                                value={phase.metadata?.name || ""}
                                onChange={(e) => updateClaimPhase(index, 'metadata', {
                                  ...phase.metadata,
                                  name: e.target.value
                                })}
                                className="text-sm"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-xs">Start Date & Time</Label>
                              <Input
                                type="datetime-local"
                                value={new Date(phase.startTimestamp).toISOString().slice(0, 16)}
                                onChange={(e) => updateClaimPhase(index, 'startTimestamp', new Date(e.target.value))}
                                className="text-sm"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-xs">Price Per Token (in {getSelectedChain()?.symbol})</Label>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Coins className="w-4 h-4 text-muted-foreground" />
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
                                    className="text-sm"
                                  />
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateClaimPhase(index, 'pricePerToken', "0")}
                                    className="h-6 px-2 text-xs"
                                  >
                                    Free
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateClaimPhase(index, 'pricePerToken', (0.0001 * 1e18).toFixed(0))}
                                    className="h-6 px-2 text-xs"
                                  >
                                    0.0001
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateClaimPhase(index, 'pricePerToken', (0.001 * 1e18).toFixed(0))}
                                    className="h-6 px-2 text-xs"
                                  >
                                    0.001
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateClaimPhase(index, 'pricePerToken', (0.01 * 1e18).toFixed(0))}
                                    className="h-6 px-2 text-xs"
                                  >
                                    0.01
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateClaimPhase(index, 'pricePerToken', (0.1 * 1e18).toFixed(0))}
                                    className="h-6 px-2 text-xs"
                                  >
                                    0.1
                                  </Button>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-xs">Max Per Wallet (0 = unlimited)</Label>
                              <Input
                                type="number"
                                min="0"
                                placeholder="0 for unlimited"
                                value={phase.quantityLimitPerWallet || ""}
                                onChange={(e) => {
                                  const value = e.target.value === "" ? 0 : parseInt(e.target.value);
                                  updateClaimPhase(index, 'quantityLimitPerWallet', value);
                                }}
                                className="text-sm"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-xs">Max Supply for Phase (Optional)</Label>
                              <Input
                                type="number"
                                placeholder="Unlimited"
                                value={phase.maxClaimableSupply || ""}
                                onChange={(e) => updateClaimPhase(index, 'maxClaimableSupply', e.target.value ? parseInt(e.target.value) : undefined)}
                                className="text-sm"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs">Description (Optional)</Label>
                            <Textarea
                              placeholder="Details about this phase..."
                              value={phase.metadata?.description || ""}
                              onChange={(e) => updateClaimPhase(index, 'metadata', {
                                ...phase.metadata,
                                name: phase.metadata?.name || "",
                                description: e.target.value
                              })}
                              rows={2}
                              className="text-sm"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </form>
        )}

          {/* Deployment Success */}
          {currentStep === 'complete' && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-full mx-auto flex items-center justify-center">
                <Zap className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Collection Created Successfully!</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Your NFT collection has been deployed to the blockchain
                </p>
                <div className="space-y-2 max-w-md mx-auto">
                  <div className="text-xs bg-muted p-2 rounded font-mono">
                    {deploymentData.contractAddress}
                  </div>
                  <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                    Contract Deployed
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-3 mt-4">
          {currentStep === 'setup' && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={deployCollection}
                disabled={!formData.name || !formData.symbol || !account}
                className="gap-2"
              >
                {!account ? (
                  <>
                    <Wallet className="w-4 h-4" />
                    Connect Wallet
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Deploy Collection
                  </>
                )}
              </Button>
            </>
          )}
          
          {(currentStep === 'prepare' || currentStep === 'deploy' || currentStep === 'save') && (
            <Button disabled className="gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Deploying...
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}