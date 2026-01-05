"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Copy,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EarningsCardProps {
  label: string;
  value: string;
  count?: number;
  icon: React.ReactNode;
  color: string;
  tooltip?: string;
}

function EarningsCard({
  label,
  value,
  count,
  icon,
  color,
  tooltip,
}: EarningsCardProps) {
  const ethValue = parseFloat(value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className={cn("text-lg", color)}>{icon}</span>
        <span className="text-sm text-zinc-400">{label}</span>
      </div>
      <div className={cn("text-2xl font-bold", color)}>
        {ethValue.toFixed(4)} ETH
      </div>
      {count !== undefined && (
        <div className="text-xs text-zinc-500 mt-1">
          {count} commission{count !== 1 ? "s" : ""}
        </div>
      )}
      {tooltip && (
        <div className="text-xs text-zinc-600 mt-1">{tooltip}</div>
      )}
    </motion.div>
  );
}

interface CommissionRowProps {
  commission: {
    id: string;
    campaignName: string;
    totalCommission: string;
    multiplier: number;
    xpAwarded: number;
    status: string;
    createdAt: Date;
    linkCode: string;
    txHash: string;
  };
}

function CommissionRow({ commission }: CommissionRowProps) {
  const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
    PENDING: {
      color: "text-yellow-400 bg-yellow-400/10",
      icon: <Clock className="h-3 w-3" />,
    },
    APPROVED: {
      color: "text-blue-400 bg-blue-400/10",
      icon: <CheckCircle className="h-3 w-3" />,
    },
    PROCESSING: {
      color: "text-purple-400 bg-purple-400/10",
      icon: <Loader2 className="h-3 w-3 animate-spin" />,
    },
    PAID: {
      color: "text-green-400 bg-green-400/10",
      icon: <CheckCircle className="h-3 w-3" />,
    },
  };

  const config = statusConfig[commission.status] || statusConfig.PENDING;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center justify-between p-3 bg-zinc-900/30 rounded-lg hover:bg-zinc-900/50 transition-colors"
    >
      <div className="flex-1">
        <div className="font-medium">{commission.campaignName}</div>
        <div className="text-xs text-zinc-500 flex items-center gap-2">
          <span>
            {new Date(commission.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <span className="text-zinc-700">|</span>
          <span>{commission.multiplier}x multiplier</span>
          <span className="text-zinc-700">|</span>
          <span className="font-mono text-zinc-600">{commission.linkCode}</span>
        </div>
      </div>
      <div className="text-right">
        <div className="font-bold text-green-400">
          +{parseFloat(commission.totalCommission).toFixed(4)} ETH
        </div>
        <div className="flex items-center justify-end gap-2">
          <span className="text-xs text-blue-400">+{commission.xpAwarded} XP</span>
          <span
            className={cn(
              "text-xs px-2 py-0.5 rounded flex items-center gap-1",
              config.color
            )}
          >
            {config.icon}
            {commission.status}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

interface PayoutModalProps {
  availableAmount: number;
  onClose: () => void;
}

function PayoutModal({ availableAmount, onClose }: PayoutModalProps) {
  const [address, setAddress] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const { toast } = useToast();

  const utils = trpc.useUtils();

  const requestPayout = trpc.hypeNetwork.earnings.requestPayout.useMutation({
    onSuccess: () => {
      toast({
        title: "Payout Requested",
        description: "Processing within 24-48 hours.",
      });
      utils.hypeNetwork.earnings.invalidate();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setIsConfirming(false);
    },
  });

  const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(address);

  const handleSubmit = () => {
    if (!isValidAddress) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid Ethereum address",
        variant: "destructive",
      });
      return;
    }

    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }

    requestPayout.mutate({ recipientAddress: address });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-green-400" />
            Request Payout
          </DialogTitle>
          <DialogDescription>
            Withdraw your available commission earnings to an Ethereum wallet.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-zinc-800 rounded-lg p-4">
            <div className="text-sm text-zinc-400">Amount to withdraw</div>
            <div className="text-2xl font-bold text-green-400">
              {availableAmount.toFixed(4)} ETH
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Recipient Address
            </label>
            <Input
              type="text"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                setIsConfirming(false);
              }}
              placeholder="0x..."
              className="bg-zinc-800 border-zinc-700 font-mono text-sm"
            />
            {address && !isValidAddress && (
              <p className="text-xs text-red-400 mt-1">
                Please enter a valid Ethereum address
              </p>
            )}
          </div>

          {isConfirming && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-3"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-400 mt-0.5" />
                <div>
                  <p className="text-sm text-yellow-400 font-medium">
                    Confirm withdrawal
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    This will send {availableAmount.toFixed(4)} ETH to:
                  </p>
                  <p className="text-xs text-zinc-300 font-mono mt-1 break-all">
                    {address}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValidAddress || requestPayout.isPending}
            className={cn(
              "flex-1",
              isConfirming
                ? "bg-green-600 hover:bg-green-700"
                : "bg-blue-600 hover:bg-blue-700"
            )}
          >
            {requestPayout.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : isConfirming ? (
              "Confirm Withdrawal"
            ) : (
              "Request Payout"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EarningsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-zinc-800 rounded-xl" />
        ))}
      </div>
      <div className="h-24 bg-zinc-800 rounded-xl" />
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-zinc-800 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

interface PayoutHistoryItemProps {
  payout: {
    id: string;
    amount: string;
    status: string;
    recipientAddress: string;
    txHash: string | null;
    requestedAt: Date;
    completedAt: Date | null;
    failureReason: string | null;
  };
}

function PayoutHistoryItem({ payout }: PayoutHistoryItemProps) {
  const statusConfig: Record<string, { color: string; text: string }> = {
    PENDING: { color: "text-yellow-400 bg-yellow-400/10", text: "Pending" },
    PROCESSING: { color: "text-purple-400 bg-purple-400/10", text: "Processing" },
    COMPLETED: { color: "text-green-400 bg-green-400/10", text: "Completed" },
    FAILED: { color: "text-red-400 bg-red-400/10", text: "Failed" },
  };

  const config = statusConfig[payout.status] || statusConfig.PENDING;

  return (
    <div className="flex items-center justify-between p-3 bg-zinc-900/30 rounded-lg">
      <div>
        <div className="font-medium flex items-center gap-2">
          {parseFloat(payout.amount).toFixed(4)} ETH
          <span className={cn("text-xs px-2 py-0.5 rounded", config.color)}>
            {config.text}
          </span>
        </div>
        <div className="text-xs text-zinc-500 mt-1">
          {new Date(payout.requestedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
          {payout.txHash && (
            <>
              {" | "}
              <a
                href={`https://sepolia.etherscan.io/tx/${payout.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline inline-flex items-center gap-1"
              >
                View tx <ExternalLink className="h-3 w-3" />
              </a>
            </>
          )}
        </div>
        {payout.failureReason && (
          <div className="text-xs text-red-400 mt-1">{payout.failureReason}</div>
        )}
      </div>
      <div className="text-xs text-zinc-500 font-mono truncate max-w-[120px]">
        {payout.recipientAddress.slice(0, 6)}...{payout.recipientAddress.slice(-4)}
      </div>
    </div>
  );
}

export function EarningsDashboard() {
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [showPayoutHistory, setShowPayoutHistory] = useState(false);

  const { data: summary, isLoading: summaryLoading } =
    trpc.hypeNetwork.earnings.summary.useQuery();
  const { data: history, isLoading: historyLoading } =
    trpc.hypeNetwork.earnings.history.useQuery({});
  const { data: canPayout } = trpc.hypeNetwork.earnings.canPayout.useQuery();
  const { data: payouts } = trpc.hypeNetwork.earnings.payouts.useQuery(
    undefined,
    { enabled: showPayoutHistory }
  );

  if (summaryLoading) {
    return <EarningsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <EarningsCard
          label="Total Earned"
          value={summary?.totalEarnings || "0"}
          icon={<TrendingUp className="h-5 w-5" />}
          color="text-green-400"
        />
        <EarningsCard
          label="Pending"
          value={summary?.pending.amount || "0"}
          count={summary?.pending.count}
          icon={<Clock className="h-5 w-5" />}
          color="text-yellow-400"
          tooltip="7-day cooldown before available"
        />
        <EarningsCard
          label="Available"
          value={summary?.available.amount || "0"}
          count={summary?.available.count}
          icon={<CheckCircle className="h-5 w-5" />}
          color="text-blue-400"
        />
        <EarningsCard
          label="Paid Out"
          value={summary?.paid.amount || "0"}
          count={summary?.paid.count}
          icon={<Wallet className="h-5 w-5" />}
          color="text-zinc-400"
        />
      </div>

      {/* Payout CTA */}
      {canPayout?.canRequest && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 border border-green-700/50 rounded-xl p-6"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-green-400 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Ready to Withdraw!
              </h3>
              <p className="text-sm text-zinc-400 mt-1">
                You have {canPayout.availableAmount.toFixed(4)} ETH available for
                withdrawal.
              </p>
            </div>
            <Button
              onClick={() => setShowPayoutModal(true)}
              className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
            >
              <Wallet className="h-4 w-4 mr-2" />
              Request Payout
            </Button>
          </div>
        </motion.div>
      )}

      {/* Not eligible for payout message */}
      {canPayout && !canPayout.canRequest && canPayout.reason && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <AlertCircle className="h-4 w-4" />
            {canPayout.reason}
          </div>
        </div>
      )}

      {/* Commission History */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Commission History</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPayoutHistory(!showPayoutHistory)}
            className="text-zinc-400 hover:text-white"
          >
            {showPayoutHistory ? "Hide" : "Show"} Payout History
            <ChevronRight
              className={cn(
                "h-4 w-4 ml-1 transition-transform",
                showPayoutHistory && "rotate-90"
              )}
            />
          </Button>
        </div>

        {/* Payout History */}
        <AnimatePresence>
          {showPayoutHistory && payouts && payouts.items.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 space-y-2"
            >
              <h4 className="text-sm font-medium text-zinc-400">Payout History</h4>
              {payouts.items.map((payout) => (
                <PayoutHistoryItem key={payout.id} payout={payout} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Commission List */}
        <div className="space-y-2">
          {historyLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-zinc-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : history?.items && history.items.length > 0 ? (
            history.items.map((commission) => (
              <CommissionRow key={commission.id} commission={commission} />
            ))
          ) : (
            <div className="text-center py-12 text-zinc-500">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No commissions yet</p>
              <p className="text-sm mt-2">
                Start promoting campaigns to earn your first commission!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Payout Modal */}
      {showPayoutModal && canPayout && (
        <PayoutModal
          availableAmount={canPayout.availableAmount}
          onClose={() => setShowPayoutModal(false)}
        />
      )}
    </div>
  );
}
