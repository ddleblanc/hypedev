"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc/client";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CreatorApplicationForm } from "./creator-application-form";
import {
  Sparkles,
  Clock,
  XCircle,
  Loader2,
  Wallet,
  RefreshCw,
  Calendar,
  MessageSquare,
  CheckCircle2,
} from "lucide-react";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { client } from "@/lib/thirdweb";
import { format } from "date-fns";

interface StudioGuardProps {
  children: ReactNode;
}

export function StudioGuard({ children }: StudioGuardProps) {
  const router = useRouter();
  const { user, isLoading: authLoading, isInitialized } = useAuth();
  const account = useActiveAccount();

  const {
    data: creatorStatus,
    isLoading: statusLoading,
    refetch: refetchStatus,
  } = trpc.studio.creator.status.useQuery(undefined, {
    enabled: !!user && isInitialized,
    staleTime: 30_000, // 30 seconds
  });

  const isLoading = authLoading || !isInitialized || (!!user && statusLoading);

  // Redirect to login when wallet disconnects
  useEffect(() => {
    if (!isLoading && isInitialized && !account && !user) {
      router.push("/login");
    }
  }, [account, user, isLoading, isInitialized, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="w-10 h-10 animate-spin text-[rgb(163,255,18)]" />
          <p className="text-white/60">Loading Studio...</p>
        </motion.div>
      </div>
    );
  }

  // Not connected
  if (!account || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 rounded-full bg-[rgb(163,255,18)]/10 flex items-center justify-center mx-auto mb-6">
            <Wallet className="w-10 h-10 text-[rgb(163,255,18)]" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Connect to Access Studio</h1>
          <p className="text-white/60 mb-8">
            Connect your wallet to access the HPX Creator Studio and start building amazing NFT collections.
          </p>
          <ConnectButton
            client={client}
            connectButton={{
              label: "Connect Wallet",
              className: "!bg-[rgb(163,255,18)] !text-black !font-bold !px-8 !py-3 !rounded-xl !text-lg hover:!bg-[rgb(163,255,18)]/90 transition-all",
            }}
          />
        </motion.div>
      </div>
    );
  }

  // Not a creator and no application (show application form)
  if (!creatorStatus?.isCreator && creatorStatus?.applicationStatus === "none") {
    return (
      <div className="min-h-screen bg-black py-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          {/* Hero Section */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 rounded-full bg-[rgb(163,255,18)]/10 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-[rgb(163,255,18)]" />
            </div>
            <Badge className="bg-[rgb(163,255,18)] text-black font-bold mb-4">CREATOR PROGRAM</Badge>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
              Become a Verified Creator
            </h1>
            <p className="text-white/60 max-w-lg mx-auto text-lg">
              HPX Studio is exclusively for verified creators. Apply now to unlock the power
              to deploy NFT collections, create lootboxes, and build your gaming empire.
            </p>
          </div>

          {/* Benefits Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="font-semibold text-white mb-1">Deploy Collections</h3>
                <p className="text-white/40 text-sm">Create and deploy NFT contracts with no code</p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="font-semibold text-white mb-1">Create Lootboxes</h3>
                <p className="text-white/40 text-sm">Build provably fair lootboxes with Chainlink VRF</p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="font-semibold text-white mb-1">Earn Royalties</h3>
                <p className="text-white/40 text-sm">Get royalties on secondary sales</p>
              </CardContent>
            </Card>
          </div>

          {/* Application Form */}
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6 md:p-8">
              <CreatorApplicationForm onSuccess={() => refetchStatus()} />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Application pending
  if (creatorStatus?.applicationStatus === "pending") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-lg"
        >
          <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-6 relative">
            <Clock className="w-10 h-10 text-yellow-500" />
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-yellow-500/30"
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>

          <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30 font-bold mb-4">
            UNDER REVIEW
          </Badge>

          <h1 className="text-3xl font-bold text-white mb-3">Application Under Review</h1>
          <p className="text-white/60 mb-6">
            Your creator application is being reviewed by our team. This typically takes 1-3 business days.
            We&apos;ll notify you once a decision has been made.
          </p>

          {creatorStatus?.appliedAt && (
            <Card className="bg-white/5 border-white/10 mb-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-center gap-2 text-white/60">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">
                    Applied on {format(new Date(creatorStatus.appliedAt), "MMMM d, yyyy")}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              onClick={() => refetchStatus()}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Check Status
            </Button>
            <p className="text-white/40 text-sm">
              Questions?{" "}
              <a href="mailto:support@hpx.gg" className="text-[rgb(163,255,18)] hover:underline">
                Contact Support
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Application rejected
  if (creatorStatus?.applicationStatus === "rejected") {
    return (
      <div className="min-h-screen bg-black py-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 font-bold mb-4">
              NOT APPROVED
            </Badge>
            <h1 className="text-3xl font-bold text-white mb-3">Application Not Approved</h1>
            <p className="text-white/60 max-w-md mx-auto">
              Unfortunately, your application was not approved at this time.
              You can update your application and resubmit below.
            </p>
          </div>

          {/* Feedback Card */}
          {creatorStatus?.application?.reviewNotes && (
            <Card className="bg-red-500/10 border-red-500/20 mb-8">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-5 h-5 text-red-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-400 mb-1">Reviewer Feedback</p>
                    <p className="text-white/80">{creatorStatus.application.reviewNotes}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Application Form for Resubmission */}
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6 md:p-8">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-white mb-2">Update & Resubmit</h2>
                <p className="text-white/60 text-sm">
                  Make changes to your application based on the feedback above.
                </p>
              </div>
              <CreatorApplicationForm onSuccess={() => refetchStatus()} />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Approved creator - render children
  if (creatorStatus?.isCreator) {
    return <>{children}</>;
  }

  // Fallback loading state (shouldn't happen)
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Skeleton className="w-32 h-8 bg-white/10" />
    </div>
  );
}

// =============================================================================
// Creator Badge Component (for use in headers/profiles)
// =============================================================================

interface CreatorBadgeProps {
  className?: string;
}

export function CreatorBadge({ className }: CreatorBadgeProps) {
  const { data: creatorStatus } = trpc.studio.creator.status.useQuery(undefined, {
    staleTime: 60_000,
  });

  if (!creatorStatus?.isCreator) return null;

  return (
    <Badge className={`bg-[rgb(163,255,18)] text-black font-bold ${className}`}>
      <CheckCircle2 className="w-3 h-3 mr-1" />
      Verified Creator
    </Badge>
  );
}
