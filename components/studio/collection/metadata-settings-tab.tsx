"use client";

import { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { getContract, sendTransaction, prepareContractCall, readContract, waitForReceipt } from "thirdweb";
import { client } from "@/lib/thirdweb";
import { defineChain } from "thirdweb/chains";
import { upload } from "thirdweb/storage";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { motion } from "framer-motion";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  Save,
  Settings,
  DollarSign,
  FileText,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Shield,
  Lock,
  ExternalLink,
  Image as ImageIcon
} from "lucide-react";

interface MetadataSettingsTabProps {
  collection: {
    id: string;
    address: string;
    chainId: number;
    contractType: string;
    title?: string;
    name?: string;
    description?: string;
    image?: string | null;
    sharedMetadata?: any;
    royaltyPercentage?: number;
    royaltyRecipient?: string | null;
    creatorAddress?: string;
  };
  onRefresh?: () => void;
}

// Zod schemas
const MetadataSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  image: z.string().optional(),
  external_link: z.string().url().optional().or(z.literal("")),
  seller_fee_basis_points: z.number().min(0).max(10000).optional(),
  fee_recipient: z.string().optional(),
});

const RoyaltySchema = z.object({
  recipient: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid address"),
  percentage: z.number().min(0).max(100),
});

export function MetadataSettingsTab({ collection, onRefresh }: MetadataSettingsTabProps) {
  const account = useActiveAccount();
  const { toast } = useToast();

  // Form state
  const [contractName, setContractName] = useState(collection.title || collection.name || "");
  const [contractDescription, setContractDescription] = useState(collection.description || "");
  const [contractImage, setContractImage] = useState(collection.image || "");
  const [externalLink, setExternalLink] = useState("");

  // Royalty state
  const [royaltyRecipient, setRoyaltyRecipient] = useState(collection.royaltyRecipient || collection.creatorAddress || "");
  const [royaltyPercentage, setRoyaltyPercentage] = useState(collection.royaltyPercentage || 5);

  // On-chain state
  const [onChainMetadata, setOnChainMetadata] = useState<any>(null);
  const [onChainRoyalty, setOnChainRoyalty] = useState<{ recipient: string; bps: number } | null>(null);
  const [isMetadataFrozen, setIsMetadataFrozen] = useState(false);

  // Loading states
  const [isLoadingOnChain, setIsLoadingOnChain] = useState(false);
  const [isSavingMetadata, setIsSavingMetadata] = useState(false);
  const [isSavingRoyalty, setIsSavingRoyalty] = useState(false);
  const [isFreezingMetadata, setIsFreezingMetadata] = useState(false);
  const [showFreezeDialog, setShowFreezeDialog] = useState(false);

  // Status
  const [metadataStatus, setMetadataStatus] = useState<"idle" | "success" | "error">("idle");
  const [royaltyStatus, setRoyaltyStatus] = useState<"idle" | "success" | "error">("idle");

  // Fetch on-chain data
  const fetchOnChainData = async () => {
    if (!collection.address || !collection.chainId) return;

    setIsLoadingOnChain(true);
    const chain = defineChain(collection.chainId);
    const contract = getContract({
      client,
      chain,
      address: collection.address,
    });

    try {
      // Get contract metadata
      try {
        const contractURI = await readContract({
          contract,
          method: "function contractURI() view returns (string)",
        });

        if (contractURI) {
          // Fetch the metadata from IPFS or HTTP
          let metadata: any = {};
          try {
            const resolvedUri = contractURI.startsWith("ipfs://")
              ? contractURI.replace("ipfs://", "https://ipfs.io/ipfs/")
              : contractURI;
            const response = await fetch(resolvedUri);
            metadata = await response.json();
          } catch {
            // If we can't fetch, just store the URI
            metadata = { contractURI };
          }
          setOnChainMetadata(metadata);

          // Pre-fill form with on-chain data
          if (metadata.name) setContractName(metadata.name);
          if (metadata.description) setContractDescription(metadata.description);
          if (metadata.image) setContractImage(metadata.image);
          if (metadata.external_link) setExternalLink(metadata.external_link);
        }
      } catch (e) {
        console.log("No contractURI function or error reading:", e);
      }

      // Get royalty info
      try {
        const royaltyInfo = await readContract({
          contract,
          method: "function getDefaultRoyaltyInfo() view returns (address, uint16)",
        });

        if (royaltyInfo) {
          const [recipient, bps] = royaltyInfo;
          setOnChainRoyalty({ recipient, bps });
          setRoyaltyRecipient(recipient);
          setRoyaltyPercentage(bps / 100); // Convert bps to percentage
        }
      } catch {
        // Try alternative method
        try {
          const royaltyInfo = await readContract({
            contract,
            method: "function royaltyInfo(uint256 tokenId, uint256 salePrice) view returns (address, uint256)",
            params: [BigInt(0), BigInt(10000)],
          });

          if (royaltyInfo) {
            const [recipient, amount] = royaltyInfo;
            const bps = Number(amount); // If salePrice was 10000, amount is the bps
            setOnChainRoyalty({ recipient, bps });
            setRoyaltyRecipient(recipient);
            setRoyaltyPercentage(bps / 100);
          }
        } catch (e) {
          console.log("Could not read royalty info:", e);
        }
      }

      // Check if metadata is frozen
      try {
        const frozen = await readContract({
          contract,
          method: "function isMetadataFrozen() view returns (bool)",
        });
        setIsMetadataFrozen(frozen);
      } catch {
        // Frozen check not available on this contract
      }
    } catch (error) {
      console.error("Error fetching on-chain data:", error);
    } finally {
      setIsLoadingOnChain(false);
    }
  };

  useEffect(() => {
    fetchOnChainData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collection.address, collection.chainId]);

  // Update contract metadata on-chain
  const handleUpdateMetadata = async () => {
    if (!account) {
      toast({ title: "Error", description: "Please connect your wallet", variant: "destructive" });
      return;
    }

    if (isMetadataFrozen) {
      toast({ title: "Error", description: "Metadata is frozen and cannot be updated", variant: "destructive" });
      return;
    }

    setIsSavingMetadata(true);
    setMetadataStatus("idle");

    try {
      const chain = defineChain(collection.chainId);
      const contract = getContract({
        client,
        chain,
        address: collection.address,
      });

      // Build contract metadata
      const metadata: any = {
        name: contractName,
        description: contractDescription,
      };

      if (contractImage) metadata.image = contractImage;
      if (externalLink) metadata.external_link = externalLink;

      // Add royalty info to contract metadata (OpenSea format)
      if (royaltyRecipient && royaltyPercentage > 0) {
        metadata.seller_fee_basis_points = Math.round(royaltyPercentage * 100);
        metadata.fee_recipient = royaltyRecipient;
      }

      // Upload metadata to IPFS
      const blob = new Blob([JSON.stringify(metadata, null, 2)], {
        type: "application/json",
      });
      const file = new File([blob], "contract-metadata.json", {
        type: "application/json",
      });

      const uris = await upload({
        client,
        files: [file],
      });
      const metadataUri = Array.isArray(uris) ? uris[0] : uris;

      console.log("Uploaded contract metadata to:", metadataUri);

      // Update on-chain
      const transaction = prepareContractCall({
        contract,
        method: "function setContractURI(string uri)",
        params: [metadataUri],
      });

      const result = await sendTransaction({
        transaction,
        account,
      });

      await waitForReceipt({
        client,
        chain,
        transactionHash: result.transactionHash,
      });

      toast({ title: "Success", description: "Contract metadata updated on-chain!" });
      setMetadataStatus("success");

      // Refresh on-chain data
      await fetchOnChainData();
      onRefresh?.();
    } catch (error) {
      console.error("Error updating metadata:", error);
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to update metadata", variant: "destructive" });
      setMetadataStatus("error");
    } finally {
      setIsSavingMetadata(false);
      setTimeout(() => setMetadataStatus("idle"), 3000);
    }
  };

  // Update royalty info on-chain
  const handleUpdateRoyalty = async () => {
    if (!account) {
      toast({ title: "Error", description: "Please connect your wallet", variant: "destructive" });
      return;
    }

    const validation = RoyaltySchema.safeParse({
      recipient: royaltyRecipient,
      percentage: royaltyPercentage,
    });

    if (!validation.success) {
      toast({ title: "Validation Error", description: validation.error.errors[0].message, variant: "destructive" });
      return;
    }

    setIsSavingRoyalty(true);
    setRoyaltyStatus("idle");

    try {
      const chain = defineChain(collection.chainId);
      const contract = getContract({
        client,
        chain,
        address: collection.address,
      });

      // Convert percentage to basis points (e.g., 5% = 500 bps)
      const bps = Math.round(royaltyPercentage * 100);

      const transaction = prepareContractCall({
        contract,
        method: "function setDefaultRoyaltyInfo(address royaltyRecipient, uint256 royaltyBps)",
        params: [royaltyRecipient, BigInt(bps)],
      });

      const result = await sendTransaction({
        transaction,
        account,
      });

      await waitForReceipt({
        client,
        chain,
        transactionHash: result.transactionHash,
      });

      toast({ title: "Success", description: "Royalty settings updated on-chain!" });
      setRoyaltyStatus("success");

      // Refresh on-chain data
      await fetchOnChainData();
      onRefresh?.();
    } catch (error) {
      console.error("Error updating royalty:", error);
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to update royalty", variant: "destructive" });
      setRoyaltyStatus("error");
    } finally {
      setIsSavingRoyalty(false);
      setTimeout(() => setRoyaltyStatus("idle"), 3000);
    }
  };

  // Freeze metadata permanently
  const handleFreezeMetadata = async () => {
    if (!account) {
      toast({ title: "Error", description: "Please connect your wallet", variant: "destructive" });
      return;
    }

    setIsFreezingMetadata(true);

    try {
      const chain = defineChain(collection.chainId);
      const contract = getContract({
        client,
        chain,
        address: collection.address,
      });

      const transaction = prepareContractCall({
        contract,
        method: "function freezeMetadata()",
        params: [],
      });

      const result = await sendTransaction({
        transaction,
        account,
      });

      await waitForReceipt({
        client,
        chain,
        transactionHash: result.transactionHash,
      });

      toast({ title: "Success", description: "Metadata has been permanently frozen!" });
      setIsMetadataFrozen(true);
      setShowFreezeDialog(false);

      // Refresh on-chain data
      await fetchOnChainData();
      onRefresh?.();
    } catch (error) {
      console.error("Error freezing metadata:", error);
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to freeze metadata", variant: "destructive" });
    } finally {
      setIsFreezingMetadata(false);
    }
  };

  const getChainExplorerUrl = () => {
    switch (collection.chainId) {
      case 1:
        return `https://etherscan.io/address/${collection.address}`;
      case 137:
        return `https://polygonscan.com/address/${collection.address}`;
      case 42161:
        return `https://arbiscan.io/address/${collection.address}`;
      case 11155111:
        return `https://sepolia.etherscan.io/address/${collection.address}`;
      default:
        return null;
    }
  };

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
            Collection Settings
          </h2>
          <p className="text-white/60 mt-1">
            Manage on-chain metadata and royalty configuration
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isMetadataFrozen && (
            <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">
              <Lock className="w-3 h-3 mr-1" />
              Metadata Frozen
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOnChainData}
            disabled={isLoadingOnChain}
            className="border-white/20 text-white hover:bg-white/10"
          >
            {isLoadingOnChain ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
          {getChainExplorerUrl() && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(getChainExplorerUrl()!, "_blank")}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View on Explorer
            </Button>
          )}
        </div>
      </div>

      {/* Contract Metadata */}
      <Card className="bg-black/40 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-[rgb(163,255,18)]" />
            Contract Metadata
          </CardTitle>
          <CardDescription className="text-white/60">
            Update collection name, description, and image on-chain
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isMetadataFrozen && (
            <Alert className="border-blue-500/30 bg-blue-500/10">
              <Lock className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-blue-500">
                Metadata is frozen. These values cannot be changed.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Collection Name</Label>
              <Input
                value={contractName}
                onChange={(e) => setContractName(e.target.value)}
                placeholder="My Awesome Collection"
                disabled={isMetadataFrozen || isSavingMetadata}
                className="bg-black/40 border-white/20 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">External Link</Label>
              <Input
                value={externalLink}
                onChange={(e) => setExternalLink(e.target.value)}
                placeholder="https://your-website.com"
                disabled={isMetadataFrozen || isSavingMetadata}
                className="bg-black/40 border-white/20 text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-white">Description</Label>
            <Textarea
              value={contractDescription}
              onChange={(e) => setContractDescription(e.target.value)}
              placeholder="Describe your collection..."
              rows={3}
              disabled={isMetadataFrozen || isSavingMetadata}
              className="bg-black/40 border-white/20 text-white resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white">Collection Image URL</Label>
            <div className="flex gap-3">
              <Input
                value={contractImage}
                onChange={(e) => setContractImage(e.target.value)}
                placeholder="ipfs://... or https://..."
                disabled={isMetadataFrozen || isSavingMetadata}
                className="bg-black/40 border-white/20 text-white flex-1"
              />
              {contractImage && (
                <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                  <img
                    src={contractImage.startsWith("ipfs://")
                      ? contractImage.replace("ipfs://", "https://ipfs.io/ipfs/")
                      : contractImage}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          <div className="text-xs text-white/50">
            {onChainMetadata?.name && `Current: ${onChainMetadata.name}`}
          </div>
          <Button
            onClick={handleUpdateMetadata}
            disabled={isMetadataFrozen || isSavingMetadata || !contractName}
            className="bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90"
          >
            {isSavingMetadata ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : metadataStatus === "success" ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Update On-Chain
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Royalty Settings */}
      <Card className="bg-black/40 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[rgb(163,255,18)]" />
            Royalty Settings
          </CardTitle>
          <CardDescription className="text-white/60">
            Configure royalty payments for secondary sales
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Royalty Recipient</Label>
              <Input
                value={royaltyRecipient}
                onChange={(e) => setRoyaltyRecipient(e.target.value)}
                placeholder="0x..."
                disabled={isSavingRoyalty}
                className="bg-black/40 border-white/20 text-white font-mono"
              />
              <p className="text-xs text-white/50">
                Address that receives royalty payments
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Royalty Percentage</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={royaltyPercentage}
                  onChange={(e) => setRoyaltyPercentage(parseFloat(e.target.value) || 0)}
                  min="0"
                  max="100"
                  step="0.5"
                  disabled={isSavingRoyalty}
                  className="bg-black/40 border-white/20 text-white pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60">
                  %
                </span>
              </div>
              <p className="text-xs text-white/50">
                Max 10% for most marketplaces ({Math.round(royaltyPercentage * 100)} basis points)
              </p>
            </div>
          </div>

          {onChainRoyalty && (
            <Alert className="border-white/10 bg-white/5">
              <AlertCircle className="h-4 w-4 text-white/60" />
              <AlertDescription className="text-white/60">
                Current on-chain: {onChainRoyalty.bps / 100}% to{" "}
                {onChainRoyalty.recipient.slice(0, 6)}...{onChainRoyalty.recipient.slice(-4)}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button
            onClick={handleUpdateRoyalty}
            disabled={isSavingRoyalty || !royaltyRecipient}
            className="bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90"
          >
            {isSavingRoyalty ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : royaltyStatus === "success" ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Update Royalty
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Danger Zone */}
      <Card className="bg-black/40 border-red-500/30">
        <CardHeader>
          <CardTitle className="text-red-500 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Danger Zone
          </CardTitle>
          <CardDescription className="text-white/60">
            Irreversible actions - proceed with caution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border border-red-500/20 rounded-lg bg-red-500/5">
            <div>
              <h4 className="text-white font-medium">Freeze Metadata</h4>
              <p className="text-white/60 text-sm">
                Permanently prevent any future metadata changes. This action is irreversible.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFreezeDialog(true)}
              disabled={isMetadataFrozen}
              className="border-red-500/50 text-red-500 hover:bg-red-500/10"
            >
              {isMetadataFrozen ? (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Already Frozen
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Freeze Metadata
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Freeze Confirmation Dialog */}
      <Dialog open={showFreezeDialog} onOpenChange={setShowFreezeDialog}>
        <DialogContent className="bg-black/95 border-red-500/30">
          <DialogHeader>
            <DialogTitle className="text-red-500 flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Freeze Metadata
            </DialogTitle>
            <DialogDescription className="text-white/60">
              This action is permanent and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert className="border-red-500/30 bg-red-500/10">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-500">
                <strong>Warning:</strong> Once metadata is frozen, you will never be able to:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Change the collection name or description</li>
                  <li>Update the collection image</li>
                  <li>Modify individual NFT metadata</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowFreezeDialog(false)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleFreezeMetadata}
              disabled={isFreezingMetadata}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {isFreezingMetadata ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Freezing...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Freeze Forever
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
