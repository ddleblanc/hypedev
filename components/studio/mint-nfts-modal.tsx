"use client";

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Upload, Image, Video, Music, FileText, Plus, Trash2, Copy, Sparkles,
  Wand2, Save, ChevronRight, ChevronLeft, Loader2, Check, AlertCircle,
  Grid3x3, FileUp, Link, Palette, Hash, Tag, Layers, Zap, Clock,
  DollarSign, User, Package, Folder, Download, RefreshCw, Eye, EyeOff, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import { uploadToThirdWeb, lazyMintNFT, generateOptimizedMetadata } from "@/lib/nft-minting";
import { setSharedMetadata, batchMintWithSharedMetadata } from "@/lib/nft-minting/shared-metadata";
import { useActiveAccount } from "thirdweb/react";
import { prepareContractCall, sendTransaction, getContract } from "thirdweb";
import { client } from "@/lib/thirdweb";
import { defineChain } from "thirdweb/chains";
import { MediaRenderer } from "@/components/MediaRenderer";

interface MintNFTsModalProps {
  isOpen: boolean;
  onClose: () => void;
  collection: {
    id: string;
    name: string;
    symbol: string;
    address?: string;
    chainId: number;
    contractType?: string;
    collectionTraits?: Array<{
      traitType: string;
      values: Array<{ value: string; count: number }>;
    }>;
  };
  onSuccess: () => void;
}

interface NFTData {
  name: string;
  description: string;
  image?: File;
  imageUrl?: string;
  externalUrl?: string;
  animationUrl?: string;
  youtubeUrl?: string;
  backgroundColor?: string;
  attributes: Array<{ trait_type: string; value: string; display_type?: string }>;
}

interface BatchTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  generateBatch: (baseData: NFTData, count: number) => NFTData[];
}

const batchTemplates: BatchTemplate[] = [
  {
    id: 'numbered',
    name: 'Numbered Series',
    description: 'Creates NFTs with sequential numbering (e.g., #1, #2, #3)',
    icon: <Hash className="w-5 h-5" />,
    generateBatch: (base, count) => {
      return Array.from({ length: count }, (_, i) => ({
        ...base,
        name: `${base.name} #${i + 1}`,
        attributes: [
          ...base.attributes,
          { trait_type: 'Edition', value: `${i + 1}` }
        ]
      }));
    }
  },
  {
    id: 'rarity',
    name: 'Rarity Tiers',
    description: 'Distributes NFTs across Common, Rare, Epic, Legendary tiers',
    icon: <Sparkles className="w-5 h-5" />,
    generateBatch: (base, count) => {
      const tiers = [
        { name: 'Common', weight: 50, color: '#9CA3AF' },
        { name: 'Rare', weight: 30, color: '#60A5FA' },
        { name: 'Epic', weight: 15, color: '#A78BFA' },
        { name: 'Legendary', weight: 5, color: '#FCD34D' }
      ];

      const nfts: NFTData[] = [];
      let remaining = count;

      tiers.forEach(tier => {
        const tierCount = Math.floor(count * tier.weight / 100);
        const actualCount = Math.min(tierCount, remaining);

        for (let i = 0; i < actualCount; i++) {
          nfts.push({
            ...base,
            name: `${base.name} (${tier.name})`,
            backgroundColor: tier.color,
            attributes: [
              ...base.attributes,
              { trait_type: 'Rarity', value: tier.name }
            ]
          });
        }
        remaining -= actualCount;
      });

      // Add any remaining as common
      for (let i = 0; i < remaining; i++) {
        nfts.push({
          ...base,
          name: `${base.name} (Common)`,
          attributes: [
            ...base.attributes,
            { trait_type: 'Rarity', value: 'Common' }
          ]
        });
      }

      return nfts;
    }
  },
  {
    id: 'variations',
    name: 'Color Variations',
    description: 'Creates NFTs with different color themes',
    icon: <Palette className="w-5 h-5" />,
    generateBatch: (base, count) => {
      const colors = [
        { name: 'Ruby', value: '#EF4444' },
        { name: 'Emerald', value: '#10B981' },
        { name: 'Sapphire', value: '#3B82F6' },
        { name: 'Amethyst', value: '#8B5CF6' },
        { name: 'Gold', value: '#F59E0B' }
      ];

      return Array.from({ length: count }, (_, i) => {
        const color = colors[i % colors.length];
        return {
          ...base,
          name: `${base.name} - ${color.name}`,
          backgroundColor: color.value,
          attributes: [
            ...base.attributes,
            { trait_type: 'Color', value: color.name }
          ]
        };
      });
    }
  }
];

export function MintNFTsModal({ isOpen, onClose, collection, onSuccess }: MintNFTsModalProps) {
  const account = useActiveAccount();
  const [mintMode, setMintMode] = useState<'single' | 'batch' | 'ai'>('single');
  const [currentStep, setCurrentStep] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Single NFT data
  const [nftData, setNftData] = useState<NFTData>({
    name: '',
    description: '',
    attributes: []
  });

  // Batch NFT data
  const [batchNFTs, setBatchNFTs] = useState<NFTData[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('numbered');
  const [batchCount, setBatchCount] = useState(10);

  // Saved traits from collection
  const [savedTraits, setSavedTraits] = useState<Array<{ trait_type: string; values: string[] }>>([]);
  const [showTraitSuggestions, setShowTraitSuggestions] = useState(false);
  const [activeTraitIndex, setActiveTraitIndex] = useState<number | null>(null);

  // AI Generation
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // File handling
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setNftData(prev => ({ ...prev, image: file }));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'video/*': ['.mp4', '.webm'],
      'audio/*': ['.mp3', '.wav'],
      'model/*': ['.glb', '.gltf']
    },
    maxFiles: mintMode === 'batch' ? 100 : 1
  });

  // Load saved traits from collection
  useEffect(() => {
    if (collection.collectionTraits) {
      const traits = collection.collectionTraits.map((t: any) => ({
        trait_type: t.traitType,
        values: t.values.map((v: any) => v.value)
      }));
      setSavedTraits(traits);
    }
  }, [collection]);

  // Contract type specific minting
  const getMintMethod = () => {
    const contractType = collection.contractType || 'ERC721';

    switch (contractType) {
      case 'ERC721A':
      case 'ERC721Drop':
      case 'DropERC721':
        return 'lazy'; // Lazy minting for gas efficiency
      case 'ERC1155':
        return 'edition'; // Edition minting
      case 'OpenEditionERC721':
        return 'open'; // Open edition
      default:
        return 'direct'; // Direct mint
    }
  };

  // Add trait to NFT
  const addTrait = () => {
    setNftData(prev => ({
      ...prev,
      attributes: [...prev.attributes, { trait_type: '', value: '' }]
    }));
  };

  // Update trait
  const updateTrait = (index: number, field: 'trait_type' | 'value', value: string) => {
    const newAttributes = [...nftData.attributes];
    newAttributes[index] = { ...newAttributes[index], [field]: value };
    setNftData(prev => ({ ...prev, attributes: newAttributes }));
  };

  // Remove trait
  const removeTrait = (index: number) => {
    setNftData(prev => ({
      ...prev,
      attributes: prev.attributes.filter((_, i) => i !== index)
    }));
  };

  // Apply saved trait suggestion
  const applySavedTrait = (traitType: string, value: string) => {
    if (activeTraitIndex !== null) {
      updateTrait(activeTraitIndex, 'trait_type', traitType);
      updateTrait(activeTraitIndex, 'value', value);
      setActiveTraitIndex(null);
      setShowTraitSuggestions(false);
    }
  };

  // Generate batch NFTs
  const generateBatch = () => {
    const template = batchTemplates.find(t => t.id === selectedTemplate);
    if (template) {
      const generated = template.generateBatch(nftData, batchCount);
      setBatchNFTs(generated);
    }
  };

  // AI Generation
  const generateWithAI = async () => {
    setIsGeneratingAI(true);
    try {
      // Here you would call your AI API to generate metadata
      // For now, we'll create a mock response
      await new Promise(resolve => setTimeout(resolve, 2000));

      setNftData({
        name: `AI Generated: ${aiPrompt.substring(0, 30)}`,
        description: `This NFT was generated based on the prompt: "${aiPrompt}"`,
        attributes: [
          { trait_type: 'Generation Method', value: 'AI' },
          { trait_type: 'Prompt', value: aiPrompt }
        ]
      });

      setMintMode('single');
      setCurrentStep(1);
    } catch (error) {
      console.error('AI generation failed:', error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Mint NFTs
  const handleMint = async () => {
    if (!account || !collection.address) {
      console.error('No wallet connected or collection address missing');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const nftsToMint = mintMode === 'batch' ? batchNFTs : [nftData];
      const chain = defineChain(collection.chainId);
      const contract = getContract({
        client,
        chain,
        address: collection.address
      });

      // Check if this is a Drop contract
      const isDropContract = ['DropERC721', 'ERC721Drop', 'OpenEditionERC721'].includes(collection.contractType || '');

      if (isDropContract) {
        // For Drop contracts, use shared metadata approach
        console.log('Using shared metadata for Drop contract');

        // Upload image if needed
        let imageUrl = nftData.imageUrl;
        if (nftData.image) {
          imageUrl = await uploadToThirdWeb(nftData.image);
        }

        // Set shared metadata for all NFTs in the collection
        const sharedMetadata = {
          name: nftData.name, // Base name - token IDs will be appended
          description: nftData.description,
          image: imageUrl || '',
          external_url: nftData.externalUrl,
          animation_url: nftData.animationUrl,
          attributes: nftData.attributes.filter(a => a.trait_type && a.value)
        };

        setUploadProgress(30);

        try {
          // Use the shared metadata approach for Drop contracts
          // This sets the metadata ONCE for the entire collection
          await setSharedMetadata({
            contractAddress: collection.address,
            chainId: collection.chainId,
            metadata: sharedMetadata
          }, account);

          setUploadProgress(80);

          // Save the shared metadata to our database for reference
          // We don't create individual NFT records yet - they're created when users claim
          await fetch('/api/studio/collections', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              collectionId: collection.id,
              sharedMetadata: sharedMetadata
            })
          });

          setUploadProgress(100);

          // Show success message
          setError(null);
          onSuccess();
          onClose();
          return;

        } catch (dropError: any) {
          console.error('Drop contract minting failed:', dropError);
          setError(`Failed to set shared metadata: ${dropError.message}`);
          throw dropError;
        }
      }

      // Original logic for non-Drop contracts
      const processedNfts = [];
      for (let i = 0; i < nftsToMint.length; i++) {
        const nft = nftsToMint[i];
        setUploadProgress((i / nftsToMint.length) * 50);

        // Upload image if exists
        let imageUrl = nft.imageUrl;
        if (nft.image) {
          imageUrl = await uploadToThirdWeb(nft.image);
        }

        // Create metadata
        const metadata = {
          name: nft.name,
          description: nft.description,
          image: imageUrl || '',
          external_url: nft.externalUrl,
          animation_url: nft.animationUrl,
          youtube_url: nft.youtubeUrl,
          background_color: nft.backgroundColor,
          attributes: nft.attributes.filter(a => a.trait_type && a.value)
        };

        setUploadProgress(50 + (i / nftsToMint.length) * 30);

        // Mint based on contract type
        const mintMethod = getMintMethod();

        try {
          if (mintMethod === 'lazy') {
            // Lazy mint for gas efficiency (for DropERC721 contracts)
            // These contracts use claim conditions instead of direct minting
            console.log('Using lazy mint for contract type:', collection.contractType);

            // For Drop contracts, we should use the claim function instead
            if (['DropERC721', 'ERC721Drop', 'OpenEditionERC721'].includes(collection.contractType || '')) {
              // Skip - these should use the claim flow, not mint
              console.log('Drop contract detected - NFTs should be claimed, not minted directly');
              // Just save metadata for now
            } else {
              await lazyMintNFT({
                contractAddress: collection.address,
                chainId: collection.chainId,
                metadata
              }, account);
            }
          } else {
            // Try different mint methods based on contract type
            console.log('Attempting direct mint for contract type:', collection.contractType);

            // First, let's check if this is a Thirdweb prebuilt contract
            // These contracts often have specific mint functions

            try {
              // Try mintTo (common for many NFT contracts)
              const transaction = prepareContractCall({
                contract,
                method: "function mintTo(address to, uint256 quantity)",
                params: [account.address, BigInt(1)]
              });
              await sendTransaction({ transaction, account });
            } catch (mintToError) {
              console.log('mintTo failed, trying mint...');

              try {
                // Try simple mint function
                const transaction = prepareContractCall({
                  contract,
                  method: "function mint(address to)",
                  params: [account.address]
                });
                await sendTransaction({ transaction, account });
              } catch (mintError) {
                console.log('mint failed, trying safeMint...');

                try {
                  // Try safeMint (ERC721A style)
                  const transaction = prepareContractCall({
                    contract,
                    method: "function safeMint(address to)",
                    params: [account.address]
                  });
                  await sendTransaction({ transaction, account });
                } catch (safeMintError) {
                  // If all standard methods fail, log the error
                  console.error('All mint methods failed. Contract might require special setup or different method.');
                  console.error('Contract address:', collection.address);
                  console.error('Contract type:', collection.contractType);
                  throw new Error('Unable to mint - contract may require different parameters or setup');
                }
              }
            }
          }
        } catch (mintError) {
          console.error('Minting failed for NFT:', nft.name, mintError);
          // Continue with other NFTs if one fails
        }

        // Store processed NFT data for database
        processedNfts.push({
          name: nft.name,
          description: nft.description,
          image: imageUrl || '',
          attributes: nft.attributes,
          tokenId: `${Date.now()}-${i}`,
          ownerAddress: account.address,
          metadataUri: imageUrl // Store the IPFS URI
        });

        setUploadProgress(80 + (i / nftsToMint.length) * 20);
      }

      // Save NFTs to database
      await saveNFTsToDatabase(processedNfts);

      // Save traits to database for future use
      await saveTraitsToDatabase();

      setUploadProgress(100);
      onSuccess();
      onClose();

    } catch (error) {
      console.error('Minting failed:', error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Save NFTs to database
  const saveNFTsToDatabase = async (nftsData: any[]) => {
    try {
      const response = await fetch('/api/studio/collections/nfts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collectionId: collection.id,
          nfts: nftsData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save NFTs to database');
      }

      const data = await response.json();
      console.log('NFTs saved to database:', data);
      return data.nfts;
    } catch (error) {
      console.error('Failed to save NFTs to database:', error);
      // Don't throw - we still want to complete the minting even if DB save fails
      // The NFTs are on-chain, we can sync them later
    }
  };

  // Save traits to database
  const saveTraitsToDatabase = async () => {
    const traits = nftData.attributes.filter(a => a.trait_type && a.value);
    if (traits.length === 0) return;

    try {
      await fetch('/api/studio/collections/traits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collectionId: collection.id,
          traits
        })
      });
    } catch (error) {
      console.error('Failed to save traits:', error);
    }
  };

  const steps = ['Choose Method', 'Add Details', 'Review & Mint'];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-black border-white/10">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-[rgb(163,255,18)]" />
            Add NFTs to {collection.name}
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Choose how you want to add NFTs to your collection
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between px-4 py-2">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                currentStep >= index
                  ? "bg-[rgb(163,255,18)] text-black"
                  : "bg-white/10 text-white/40"
              )}>
                {currentStep > index ? <Check className="w-4 h-4" /> : index + 1}
              </div>
              <span className={cn(
                "ml-2 text-sm",
                currentStep >= index ? "text-white" : "text-white/40"
              )}>
                {step}
              </span>
              {index < steps.length - 1 && (
                <ChevronRight className="w-4 h-4 mx-4 text-white/20" />
              )}
            </div>
          ))}
        </div>

        <Separator className="bg-white/10" />

        <ScrollArea className="flex-1 px-6 py-4" style={{ maxHeight: 'calc(90vh - 250px)' }}>
          {/* Show info for Drop contracts */}
          {['DropERC721', 'ERC721Drop', 'OpenEditionERC721'].includes(collection.contractType || '') && (
            <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-blue-400 font-medium mb-2">Drop Contract - One-Time Shared Metadata</p>
                  <div className="text-sm text-white/70 space-y-1">
                    <p>• You set the shared metadata once for the entire collection</p>
                    <p>• All NFTs will use this metadata with unique token IDs (e.g., "Cool NFT #1", "#2", "#3"...)</p>
                    <p>• Specify how many NFTs should be available for claiming</p>
                    <p>• Users claim individual NFTs through the launchpad</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-400 font-medium mb-1">Error</p>
                  <p className="text-sm text-white/70">{error}</p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 0 && (
            <div className="space-y-4">
              {/* For Drop contracts, show simplified interface */}
              {['DropERC721', 'ERC721Drop', 'OpenEditionERC721'].includes(collection.contractType || '') ? (
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Set Shared Metadata</CardTitle>
                    <CardDescription className="text-white/60">
                      This metadata will be shared by all NFTs in your collection. Each NFT will have a unique token ID appended to the name.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-[rgb(163,255,18)]/10 border border-[rgb(163,255,18)]/30 rounded-lg">
                      <p className="text-sm text-white/80">
                        You'll add the media and details on the next step. The number of available NFTs is controlled by your claim conditions in Settings.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                // For non-Drop contracts, show mode selection
                <div className="grid grid-cols-3 gap-4">
                  <Card
                    className={cn(
                      "cursor-pointer transition-all border-2",
                      mintMode === 'single'
                        ? "border-[rgb(163,255,18)] bg-[rgb(163,255,18)]/10"
                        : "border-white/10 hover:border-white/30"
                    )}
                    onClick={() => setMintMode('single')}
                  >
                    <CardContent className="p-6 text-center">
                      <Image className="w-12 h-12 mx-auto mb-3 text-white" />
                      <h3 className="font-bold text-white mb-1">Single NFT</h3>
                      <p className="text-sm text-white/60">
                        Add one NFT with custom metadata
                      </p>
                    </CardContent>
                  </Card>

                  <Card
                    className={cn(
                      "cursor-pointer transition-all border-2",
                      mintMode === 'batch'
                        ? "border-[rgb(163,255,18)] bg-[rgb(163,255,18)]/10"
                        : "border-white/10 hover:border-white/30"
                    )}
                    onClick={() => setMintMode('batch')}
                  >
                    <CardContent className="p-6 text-center">
                      <Grid3x3 className="w-12 h-12 mx-auto mb-3 text-white" />
                      <h3 className="font-bold text-white mb-1">Batch Mint</h3>
                      <p className="text-sm text-white/60">
                        Create multiple NFTs at once
                      </p>
                    </CardContent>
                  </Card>

                  <Card
                    className={cn(
                      "cursor-pointer transition-all border-2",
                      mintMode === 'ai'
                        ? "border-[rgb(163,255,18)] bg-[rgb(163,255,18)]/10"
                        : "border-white/10 hover:border-white/30"
                    )}
                    onClick={() => setMintMode('ai')}
                  >
                    <CardContent className="p-6 text-center">
                      <Wand2 className="w-12 h-12 mx-auto mb-3 text-white" />
                      <h3 className="font-bold text-white mb-1">AI Generate</h3>
                      <p className="text-sm text-white/60">
                        Use AI to create NFT metadata
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {mintMode === 'batch' && !['DropERC721', 'ERC721Drop', 'OpenEditionERC721'].includes(collection.contractType || '') && (
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Batch Options</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-white/80">Template</Label>
                      <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                        <SelectTrigger className="bg-black/40 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {batchTemplates.map(template => (
                            <SelectItem key={template.id} value={template.id}>
                              <div className="flex items-center gap-2">
                                {template.icon}
                                <div>
                                  <p className="font-medium">{template.name}</p>
                                  <p className="text-xs text-white/60">{template.description}</p>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-white/80">Number of NFTs</Label>
                      <Input
                        type="number"
                        value={batchCount}
                        onChange={(e) => setBatchCount(parseInt(e.target.value) || 1)}
                        min={1}
                        max={100}
                        className="bg-black/40 border-white/10 text-white"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {mintMode === 'ai' && (
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">AI Generation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-white/80">Describe your NFT</Label>
                      <Textarea
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="A mystical dragon with golden scales breathing fire in a fantasy landscape..."
                        className="bg-black/40 border-white/10 text-white min-h-[100px]"
                      />
                    </div>

                    <Button
                      onClick={generateWithAI}
                      disabled={!aiPrompt || isGeneratingAI}
                      className="w-full bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90"
                    >
                      {isGeneratingAI ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate NFT
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              {/* File Upload */}
              <div>
                <Label className="text-white/80 mb-2 block">Media</Label>
                <div
                  {...getRootProps()}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all",
                    isDragActive
                      ? "border-[rgb(163,255,18)] bg-[rgb(163,255,18)]/10"
                      : "border-white/20 hover:border-white/40"
                  )}
                >
                  <input {...getInputProps()} />
                  {nftData.image ? (
                    <div className="space-y-3">
                      <div className="w-24 h-24 mx-auto rounded-lg overflow-hidden bg-white/10">
                        <MediaRenderer
                          src={URL.createObjectURL(nftData.image)}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-white font-medium">{nftData.image.name}</p>
                      <p className="text-sm text-white/60">Click to replace</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-12 h-12 mx-auto text-white/60" />
                      <p className="text-white">Drop files here or click to browse</p>
                      <p className="text-sm text-white/60">
                        Supports images, videos, audio, and 3D models
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <Label className="text-white/80">Name *</Label>
                  <Input
                    value={nftData.name}
                    onChange={(e) => setNftData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="My Awesome NFT"
                    className="bg-black/40 border-white/10 text-white"
                  />
                </div>

                <div>
                  <Label className="text-white/80">Description</Label>
                  <Textarea
                    value={nftData.description}
                    onChange={(e) => setNftData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your NFT..."
                    className="bg-black/40 border-white/10 text-white"
                  />
                </div>
              </div>

              {/* Traits */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-white/80">Traits</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={addTrait}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Trait
                  </Button>
                </div>

                {showTraitSuggestions && savedTraits.length > 0 && (
                  <Card className="mb-3 bg-[rgb(163,255,18)]/10 border-[rgb(163,255,18)]/50">
                    <CardContent className="p-3">
                      <p className="text-sm text-white/80 mb-2">Suggested traits from collection:</p>
                      <div className="flex flex-wrap gap-2">
                        {savedTraits.map(trait => (
                          <Badge
                            key={trait.trait_type}
                            className="cursor-pointer bg-white/10 hover:bg-white/20"
                            onClick={() => applySavedTrait(trait.trait_type, trait.values[0])}
                          >
                            {trait.trait_type}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-2">
                  {nftData.attributes.map((attr, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={attr.trait_type}
                        onChange={(e) => updateTrait(index, 'trait_type', e.target.value)}
                        placeholder="Trait type"
                        className="bg-black/40 border-white/10 text-white"
                        onFocus={() => {
                          setActiveTraitIndex(index);
                          setShowTraitSuggestions(true);
                        }}
                      />
                      <Input
                        value={attr.value}
                        onChange={(e) => updateTrait(index, 'value', e.target.value)}
                        placeholder="Value"
                        className="bg-black/40 border-white/10 text-white"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeTrait(index)}
                        className="text-white/60 hover:text-white hover:bg-white/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {mintMode === 'batch' && (
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-white/80 mb-2">
                    This template will be applied to all {batchCount} NFTs
                  </p>
                  <Button
                    onClick={generateBatch}
                    className="bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90"
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate Batch
                  </Button>
                </div>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">
                    {['DropERC721', 'ERC721Drop', 'OpenEditionERC721'].includes(collection.contractType || '')
                      ? 'Review Shared Metadata'
                      : 'Review NFTs'}
                  </CardTitle>
                  <CardDescription className="text-white/60">
                    {['DropERC721', 'ERC721Drop', 'OpenEditionERC721'].includes(collection.contractType || '')
                      ? 'This metadata will be set once for all NFTs in your collection'
                      : mintMode === 'batch'
                      ? `You're about to mint ${batchNFTs.length} NFTs`
                      : 'Review your NFT before minting'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {mintMode === 'batch' ? (
                    <div className="space-y-3">
                      {batchNFTs.slice(0, 5).map((nft, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-black/40 rounded-lg">
                          <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                            <Image className="w-6 h-6 text-white/60" />
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-medium">{nft.name}</p>
                            <p className="text-sm text-white/60">
                              {nft.attributes.length} traits
                            </p>
                          </div>
                        </div>
                      ))}
                      {batchNFTs.length > 5 && (
                        <p className="text-center text-white/60 text-sm">
                          And {batchNFTs.length - 5} more...
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {nftData.image && (
                        <div className="w-32 h-32 bg-white/10 rounded-lg mx-auto overflow-hidden">
                          <MediaRenderer
                            src={URL.createObjectURL(nftData.image)}
                            alt={nftData.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="text-center">
                        <h3 className="text-xl font-bold text-white mb-2">{nftData.name}</h3>
                        <p className="text-white/60">{nftData.description}</p>
                      </div>
                      {nftData.attributes.length > 0 && (
                        <div className="flex flex-wrap gap-2 justify-center">
                          {nftData.attributes.map((attr, index) => (
                            <Badge key={index} className="bg-white/10 text-white">
                              {attr.trait_type}: {attr.value}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contract Info */}
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/60">Contract Type</p>
                      <p className="text-white font-medium">{collection.contractType || 'ERC721'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-white/60">Mint Method</p>
                      <p className="text-white font-medium">{getMintMethod()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-white/60">Chain ID</p>
                      <p className="text-white font-medium">{collection.chainId}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t border-white/10">
          <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              onClick={currentStep > 0 ? () => setCurrentStep(currentStep - 1) : onClose}
              className="border-white/20 text-white hover:bg-white/10"
              disabled={isUploading}
            >
              {currentStep > 0 ? (
                <>
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back
                </>
              ) : (
                'Cancel'
              )}
            </Button>

            {isUploading && (
              <div className="flex-1 mx-4">
                <div className="bg-white/10 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="bg-[rgb(163,255,18)] h-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            )}

            <Button
              onClick={() => {
                if (currentStep < steps.length - 1) {
                  setCurrentStep(currentStep + 1);
                  if (mintMode === 'batch' && currentStep === 1) {
                    generateBatch();
                  }
                } else {
                  handleMint();
                }
              }}
              className="bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90"
              disabled={
                isUploading ||
                (currentStep === 1 && !nftData.name) ||
                (mintMode === 'batch' && currentStep === 2 && batchNFTs.length === 0)
              }
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {['DropERC721', 'ERC721Drop', 'OpenEditionERC721'].includes(collection.contractType || '')
                    ? 'Setting Metadata...'
                    : 'Minting...'}
                </>
              ) : currentStep < steps.length - 1 ? (
                <>
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  {['DropERC721', 'ERC721Drop', 'OpenEditionERC721'].includes(collection.contractType || '')
                    ? 'Set Shared Metadata'
                    : mintMode === 'batch'
                    ? `Mint ${batchNFTs.length} NFTs`
                    : 'Mint NFT'}
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}