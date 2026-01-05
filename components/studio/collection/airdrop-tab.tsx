"use client";

import { useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { getContract, sendTransaction, prepareContractCall, readContract, waitForReceipt } from "thirdweb";
import { client } from "@/lib/thirdweb";
import { defineChain } from "thirdweb/chains";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { motion } from "framer-motion";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Upload,
  CheckCircle2,
  AlertCircle,
  Send,
  FileText,
  Users,
  Sparkles,
  X
} from "lucide-react";

interface AirdropTabProps {
  collection: {
    id: string;
    address: string;
    chainId: number;
    contractType: string;
    title?: string;
    name?: string;
  };
}

const AddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address");

interface AirdropResult {
  address: string;
  status: "pending" | "success" | "error";
  error?: string;
  tokenId?: string;
  txHash?: string;
}

export function AirdropTab({ collection }: AirdropTabProps) {
  const account = useActiveAccount();
  const { toast } = useToast();
  const [addresses, setAddresses] = useState("");
  const [tokenUri, setTokenUri] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<AirdropResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentBatch, setCurrentBatch] = useState(0);

  // Parse addresses from input (newlines, commas, or spaces)
  const parseAddresses = (): string[] => {
    return addresses
      .split(/[\n,\s]+/)
      .map((a) => a.trim())
      .filter((a) => a.length > 0);
  };

  // Validate all addresses
  const validateAddresses = (): { valid: string[]; invalid: string[] } => {
    const parsed = parseAddresses();
    const valid: string[] = [];
    const invalid: string[] = [];

    for (const addr of parsed) {
      if (AddressSchema.safeParse(addr).success) {
        valid.push(addr);
      } else {
        invalid.push(addr);
      }
    }

    return { valid, invalid };
  };

  // Check if contract supports direct minting (TokenERC721)
  const isDirectMintContract = () => {
    const type = collection.contractType || "";
    return ["TokenERC721", "ERC721"].includes(type);
  };

  // Check if contract is a drop contract
  const isDropContract = () => {
    const type = collection.contractType || "";
    return ["DropERC721", "OpenEditionERC721", "ERC721Drop"].includes(type);
  };

  // Handle CSV file upload
  const handleCSVUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv,.txt";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          // Parse CSV - handle both comma-separated and newline-separated
          const parsedAddresses = content
            .split(/[\n,\r]+/)
            .map((line) => line.trim())
            .filter((line) => line.length > 0 && line.startsWith("0x"));
          setAddresses(parsedAddresses.join("\n"));
          toast({ title: "Import successful", description: `Imported ${parsedAddresses.length} addresses` });
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // Execute the airdrop
  const handleAirdrop = async () => {
    if (!account) {
      toast({ title: "Error", description: "Please connect your wallet", variant: "destructive" });
      return;
    }

    const { valid, invalid } = validateAddresses();

    if (invalid.length > 0) {
      toast({ title: "Invalid addresses", description: `${invalid.length} invalid address(es) found. Please fix them before proceeding.`, variant: "destructive" });
      return;
    }

    if (valid.length === 0) {
      toast({ title: "No addresses", description: "Please enter at least one valid address", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setResults(valid.map((addr) => ({ address: addr, status: "pending" })));

    const chain = defineChain(collection.chainId);
    const contract = getContract({
      client,
      chain,
      address: collection.address,
    });

    let successCount = 0;
    let errorCount = 0;

    // Process addresses in batches to avoid overwhelming the network
    const BATCH_SIZE = 5;
    const batches = [];
    for (let i = 0; i < valid.length; i += BATCH_SIZE) {
      batches.push(valid.slice(i, i + BATCH_SIZE));
    }

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      setCurrentBatch(batchIndex + 1);

      // Process batch in parallel
      const batchPromises = batch.map(async (address, indexInBatch) => {
        const overallIndex = batchIndex * BATCH_SIZE + indexInBatch;

        try {
          let txHash = "";
          let tokenId = "";

          if (isDirectMintContract()) {
            // For TokenERC721, use mintTo
            // First get the next token ID
            let nextTokenId: bigint;
            try {
              const totalSupply = await readContract({
                contract,
                method: "function totalSupply() view returns (uint256)",
              });
              nextTokenId = totalSupply;
            } catch {
              nextTokenId = BigInt(0);
            }

            const transaction = prepareContractCall({
              contract,
              method: "function mintTo(address to, string uri)",
              params: [address, tokenUri || "ipfs://"],
            });

            const result = await sendTransaction({
              transaction,
              account,
            });

            // Wait for receipt
            await waitForReceipt({
              client,
              chain,
              transactionHash: result.transactionHash,
            });

            txHash = result.transactionHash;
            tokenId = nextTokenId.toString();
          } else if (isDropContract()) {
            // For Drop contracts, use claimTo (claim on behalf of recipient)
            const transaction = prepareContractCall({
              contract,
              method: "function claimTo(address to, uint256 quantity)",
              params: [address, BigInt(1)],
            });

            const result = await sendTransaction({
              transaction,
              account,
            });

            // Wait for receipt
            await waitForReceipt({
              client,
              chain,
              transactionHash: result.transactionHash,
            });

            txHash = result.transactionHash;
          } else {
            // Fallback: try mintTo first, then claimTo
            try {
              const transaction = prepareContractCall({
                contract,
                method: "function mintTo(address to, string uri)",
                params: [address, tokenUri || "ipfs://"],
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

              txHash = result.transactionHash;
            } catch {
              // Try claim approach
              const transaction = prepareContractCall({
                contract,
                method: "function claimTo(address to, uint256 quantity)",
                params: [address, BigInt(1)],
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

              txHash = result.transactionHash;
            }
          }

          // Update result as success
          setResults((prev) =>
            prev.map((r) =>
              r.address === address
                ? { ...r, status: "success", tokenId, txHash }
                : r
            )
          );
          successCount++;
        } catch (error) {
          const message = error instanceof Error ? error.message : "Transaction failed";
          setResults((prev) =>
            prev.map((r) =>
              r.address === address ? { ...r, status: "error", error: message } : r
            )
          );
          errorCount++;
        }

        // Update progress
        setProgress(((overallIndex + 1) / valid.length) * 100);
      });

      // Wait for batch to complete
      await Promise.allSettled(batchPromises);
    }

    setIsProcessing(false);

    if (successCount === valid.length) {
      toast({ title: "Airdrop complete", description: `Successfully airdropped to all ${successCount} addresses!` });
    } else if (successCount > 0) {
      toast({ title: "Airdrop partially complete", description: `${successCount} successful, ${errorCount} failed` });
    } else {
      toast({ title: "Airdrop failed", description: "Airdrop failed for all addresses", variant: "destructive" });
    }
  };

  // Clear results and reset
  const handleReset = () => {
    setResults([]);
    setProgress(0);
    setAddresses("");
    setTokenUri("");
  };

  const successCount = results.filter((r) => r.status === "success").length;
  const errorCount = results.filter((r) => r.status === "error").length;
  const pendingCount = results.filter((r) => r.status === "pending").length;

  const { valid, invalid } = validateAddresses();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Send className="w-6 h-6 text-[rgb(163,255,18)]" />
          Airdrop NFTs
        </h2>
        <p className="text-white/60 mt-1">
          Send NFTs directly to multiple wallet addresses
        </p>
      </div>

      {/* Main Airdrop Card */}
      <Card className="bg-black/40 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-[rgb(163,255,18)]" />
            Recipient Addresses
          </CardTitle>
          <CardDescription className="text-white/60">
            Enter wallet addresses separated by newlines, commas, or spaces
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              value={addresses}
              onChange={(e) => setAddresses(e.target.value)}
              placeholder={`0x1234567890abcdef1234567890abcdef12345678\n0xabcdef1234567890abcdef1234567890abcdef12\n0x9876543210fedcba9876543210fedcba98765432`}
              rows={8}
              disabled={isProcessing}
              className="bg-black/40 border-white/20 text-white placeholder:text-white/30 font-mono text-sm"
            />
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span className="text-white/60">
                  {valid.length} valid address{valid.length !== 1 ? "es" : ""}
                </span>
                {invalid.length > 0 && (
                  <span className="text-red-500">
                    {invalid.length} invalid
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCSVUpload}
                disabled={isProcessing}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import CSV
              </Button>
            </div>
          </div>

          {/* Token URI (for TokenERC721 contracts) */}
          {isDirectMintContract() && (
            <div className="space-y-2">
              <Label className="text-white">Metadata URI (optional)</Label>
              <Input
                value={tokenUri}
                onChange={(e) => setTokenUri(e.target.value)}
                placeholder="ipfs://... or https://..."
                disabled={isProcessing}
                className="bg-black/40 border-white/20 text-white placeholder:text-white/40"
              />
              <p className="text-xs text-white/50">
                If left empty, each NFT will use the default collection metadata
              </p>
            </div>
          )}

          {/* Warning for Drop contracts */}
          {isDropContract() && (
            <Alert className="border-yellow-500/30 bg-yellow-500/10">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-yellow-500">
                This is a Drop contract. Airdrop will claim NFTs on behalf of recipients.
                Make sure you have NFTs available to claim and the claim conditions allow it.
              </AlertDescription>
            </Alert>
          )}

          {/* Invalid addresses warning */}
          {invalid.length > 0 && !isProcessing && (
            <Alert className="border-red-500/30 bg-red-500/10">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-500">
                <strong>{invalid.length} invalid address(es) found:</strong>
                <div className="mt-2 font-mono text-xs max-h-20 overflow-y-auto">
                  {invalid.slice(0, 5).map((addr, i) => (
                    <div key={i}>{addr}</div>
                  ))}
                  {invalid.length > 5 && (
                    <div>... and {invalid.length - 5} more</div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <Button
              onClick={handleAirdrop}
              disabled={isProcessing || valid.length === 0 || invalid.length > 0}
              className="bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90 flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing Batch {currentBatch}...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Airdrop to {valid.length} address{valid.length !== 1 ? "es" : ""}
                </>
              )}
            </Button>
            {results.length > 0 && !isProcessing && (
              <Button
                variant="outline"
                onClick={handleReset}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <X className="w-4 h-4 mr-2" />
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Progress & Results */}
      {(isProcessing || results.length > 0) && (
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[rgb(163,255,18)]" />
                Airdrop Progress
              </span>
              <div className="flex items-center gap-2">
                {successCount > 0 && (
                  <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                    {successCount} successful
                  </Badge>
                )}
                {errorCount > 0 && (
                  <Badge className="bg-red-500/20 text-red-500 border-red-500/30">
                    {errorCount} failed
                  </Badge>
                )}
                {pendingCount > 0 && (
                  <Badge className="bg-white/10 text-white/60 border-white/20">
                    {pendingCount} pending
                  </Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={progress} className="h-2" />

            {/* Results list */}
            <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
              {results.map((result, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    result.status === "success"
                      ? "bg-green-500/10 border border-green-500/20"
                      : result.status === "error"
                      ? "bg-red-500/10 border border-red-500/20"
                      : "bg-white/5 border border-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {result.status === "pending" && (
                      <Loader2 className="w-4 h-4 animate-spin text-white/60 flex-shrink-0" />
                    )}
                    {result.status === "success" && (
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    )}
                    {result.status === "error" && (
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    )}
                    <span className="font-mono text-sm text-white/80 truncate">
                      {result.address}
                    </span>
                  </div>
                  <div className="text-right text-sm flex-shrink-0 ml-4">
                    {result.status === "success" && result.tokenId && (
                      <span className="text-green-500">Token #{result.tokenId}</span>
                    )}
                    {result.status === "error" && (
                      <span className="text-red-500 max-w-[200px] truncate block" title={result.error}>
                        {result.error?.slice(0, 30)}...
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="bg-black/40 border-white/10">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-white/40 mt-0.5" />
            <div className="text-sm text-white/60">
              <p className="font-medium text-white/80 mb-1">Airdrop Tips</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Each airdrop transaction requires gas fees</li>
                <li>Addresses are processed in batches of 5 for efficiency</li>
                <li>Failed transactions can be retried individually</li>
                <li>Make sure you have enough supply for all recipients</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
