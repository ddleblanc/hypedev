"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { ChallengeType } from "@prisma/client";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Target,
  TrendingUp,
  DollarSign,
  Flame,
  Waves,
  Fish,
  Calendar,
  Trophy,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Challenge type display info
const CHALLENGE_TYPES: {
  type: ChallengeType;
  name: string;
  description: string;
  metric: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    type: "RACE_TO_TARGET",
    name: "Race to Target",
    description: "First agent to reach the target wins",
    metric: "referrals",
    icon: <Target className="h-6 w-6" />,
    color: "from-red-500 to-orange-500",
  },
  {
    type: "MOST_REFERRALS",
    name: "Most Referrals",
    description: "Agent with most referrals wins",
    metric: "referrals",
    icon: <TrendingUp className="h-6 w-6" />,
    color: "from-blue-500 to-cyan-500",
  },
  {
    type: "MOST_VOLUME",
    name: "Most Volume",
    description: "Agent with highest sales volume wins",
    metric: "volume (ETH)",
    icon: <DollarSign className="h-6 w-6" />,
    color: "from-green-500 to-emerald-500",
  },
  {
    type: "STREAK_MASTER",
    name: "Streak Master",
    description: "Longest consecutive days with referrals",
    metric: "days",
    icon: <Flame className="h-6 w-6" />,
    color: "from-orange-500 to-yellow-500",
  },
  {
    type: "VIRAL_WAVE",
    name: "Viral Wave",
    description: "Most unique link clicks",
    metric: "clicks",
    icon: <Waves className="h-6 w-6" />,
    color: "from-purple-500 to-pink-500",
  },
  {
    type: "WHALE_HUNTER",
    name: "Whale Hunter",
    description: "Single highest-value referral",
    metric: "sale amount (ETH)",
    icon: <Fish className="h-6 w-6" />,
    color: "from-indigo-500 to-blue-500",
  },
  {
    type: "CONSISTENCY",
    name: "Consistency King",
    description: "Most days with at least one referral",
    metric: "active days",
    icon: <Calendar className="h-6 w-6" />,
    color: "from-teal-500 to-green-500",
  },
];

const ChallengeFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().max(500).optional(),
  targetValue: z.number().min(1, "Target must be at least 1"),
  startAt: z.string().min(1, "Start date is required"),
  endAt: z.string().min(1, "End date is required"),
  prizePool: z.number().min(0).optional(),
  xpReward: z.number().min(0),
  winnersCount: z.number().min(1).max(10),
});

type ChallengeFormData = z.infer<typeof ChallengeFormSchema>;

interface ChallengeBuilderProps {
  campaignId: string;
  onSuccess?: (challengeId: string) => void;
  onCancel?: () => void;
}

export function CreatorChallengeBuilder({
  campaignId,
  onSuccess,
  onCancel,
}: ChallengeBuilderProps) {
  const [selectedType, setSelectedType] = useState<ChallengeType | null>(null);
  const [step, setStep] = useState<"type" | "details" | "prizes">("type");
  const { toast } = useToast();

  const form = useForm<ChallengeFormData>({
    resolver: zodResolver(ChallengeFormSchema),
    defaultValues: {
      xpReward: 1000,
      winnersCount: 3,
      prizePool: 0,
    },
  });

  const createMutation = trpc.hypeNetwork.challenges.create.useMutation({
    onSuccess: (data) => {
      toast({ title: "Challenge created successfully!" });
      onSuccess?.(data.id);
    },
    onError: (error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = async (data: ChallengeFormData) => {
    if (!selectedType) return;

    await createMutation.mutateAsync({
      ...data,
      campaignId,
      type: selectedType,
      startAt: new Date(data.startAt),
      endAt: new Date(data.endAt),
    });
  };

  const selectedTypeInfo = CHALLENGE_TYPES.find((t) => t.type === selectedType);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
          <Trophy className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Create Challenge</h2>
          <p className="text-sm text-zinc-400">
            Set up a competition for your agents
          </p>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-8">
        {["type", "details", "prizes"].map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                step === s
                  ? "bg-primary text-primary-foreground"
                  : i <
                      ["type", "details", "prizes"].indexOf(step)
                    ? "bg-green-500 text-white"
                    : "bg-zinc-800 text-zinc-400"
              )}
            >
              {i + 1}
            </div>
            {i < 2 && (
              <div
                className={cn(
                  "h-0.5 w-12 mx-2",
                  i < ["type", "details", "prizes"].indexOf(step)
                    ? "bg-green-500"
                    : "bg-zinc-800"
                )}
              />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Type Selection */}
        {step === "type" && (
          <motion.div
            key="type"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold mb-4">
              Choose Challenge Type
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CHALLENGE_TYPES.map((type) => (
                <button
                  key={type.type}
                  onClick={() => {
                    setSelectedType(type.type);
                    setStep("details");
                  }}
                  className={cn(
                    "p-4 bg-zinc-900 border rounded-xl text-left transition-all hover:scale-[1.02]",
                    selectedType === type.type
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-zinc-700 hover:border-zinc-600"
                  )}
                >
                  <div
                    className={cn(
                      "h-10 w-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-white mb-3",
                      type.color
                    )}
                  >
                    {type.icon}
                  </div>
                  <div className="font-semibold">{type.name}</div>
                  <div className="text-sm text-zinc-400 mt-1">
                    {type.description}
                  </div>
                  <div className="text-xs text-zinc-500 mt-2 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Metric: {type.metric}
                  </div>
                </button>
              ))}
            </div>

            {onCancel && (
              <Button variant="ghost" onClick={onCancel} className="mt-4">
                Cancel
              </Button>
            )}
          </motion.div>
        )}

        {/* Step 2: Details */}
        {step === "details" && selectedTypeInfo && (
          <motion.div
            key="details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => setStep("type")}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div
                className={cn(
                  "h-10 w-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-white",
                  selectedTypeInfo.color
                )}
              >
                {selectedTypeInfo.icon}
              </div>
              <div>
                <div className="font-semibold">{selectedTypeInfo.name}</div>
                <div className="text-xs text-zinc-400">
                  {selectedTypeInfo.description}
                </div>
              </div>
            </div>

            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Challenge Name
                </label>
                <Input
                  {...form.register("name")}
                  placeholder="Summer Showdown 2026"
                  className="bg-zinc-900 border-zinc-700"
                />
                {form.formState.errors.name && (
                  <p className="text-red-400 text-sm mt-1">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Description (optional)
                </label>
                <Textarea
                  {...form.register("description")}
                  placeholder="Tell agents what this challenge is about..."
                  className="bg-zinc-900 border-zinc-700 resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Target ({selectedTypeInfo.metric})
                </label>
                <Input
                  type="number"
                  {...form.register("targetValue", { valueAsNumber: true })}
                  placeholder={
                    selectedTypeInfo.type.includes("VOLUME")
                      ? "1.0"
                      : "100"
                  }
                  className="bg-zinc-900 border-zinc-700"
                />
                {form.formState.errors.targetValue && (
                  <p className="text-red-400 text-sm mt-1">
                    {form.formState.errors.targetValue.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Start Date
                  </label>
                  <Input
                    type="datetime-local"
                    {...form.register("startAt")}
                    className="bg-zinc-900 border-zinc-700"
                  />
                  {form.formState.errors.startAt && (
                    <p className="text-red-400 text-sm mt-1">
                      {form.formState.errors.startAt.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    End Date
                  </label>
                  <Input
                    type="datetime-local"
                    {...form.register("endAt")}
                    className="bg-zinc-900 border-zinc-700"
                  />
                  {form.formState.errors.endAt && (
                    <p className="text-red-400 text-sm mt-1">
                      {form.formState.errors.endAt.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("type")}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={() => setStep("prizes")}
                  className="flex-1"
                >
                  Next: Prizes
                </Button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Step 3: Prizes */}
        {step === "prizes" && selectedTypeInfo && (
          <motion.div
            key="prizes"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => setStep("details")}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <Trophy className="h-6 w-6 text-amber-400" />
              <div className="font-semibold">Prize Configuration</div>
            </div>

            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Prize Pool (ETH)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    {...form.register("prizePool", { valueAsNumber: true })}
                    placeholder="0.5"
                    className="bg-zinc-900 border-zinc-700"
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    Split among top winners
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Number of Winners
                  </label>
                  <Input
                    type="number"
                    {...form.register("winnersCount", { valueAsNumber: true })}
                    min={1}
                    max={10}
                    className="bg-zinc-900 border-zinc-700"
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    1st: 50%, 2nd: 30%, 3rd: 20%
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  XP Reward for Winner
                </label>
                <Input
                  type="number"
                  {...form.register("xpReward", { valueAsNumber: true })}
                  className="bg-zinc-900 border-zinc-700"
                />
                <p className="text-xs text-zinc-500 mt-1">
                  Additional XP awarded to the 1st place winner
                </p>
              </div>

              {/* Prize Preview */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 mt-4">
                <h4 className="text-sm font-medium mb-3">Prize Distribution</h4>
                <div className="space-y-2">
                  {[1, 2, 3].map((place) => {
                    const prizePool = form.watch("prizePool") || 0;
                    const percentages: Record<number, number> = { 1: 50, 2: 30, 3: 20 };
                    const amount = (prizePool * percentages[place]) / 100;

                    return (
                      <div
                        key={place}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold",
                              place === 1 && "bg-amber-500 text-black",
                              place === 2 && "bg-zinc-400 text-black",
                              place === 3 && "bg-orange-700 text-white"
                            )}
                          >
                            {place}
                          </span>
                          <span className="text-zinc-400">
                            {place === 1 ? "1st" : place === 2 ? "2nd" : "3rd"} Place
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-amber-400">
                            {amount.toFixed(2)} ETH
                          </span>
                          {place === 1 && (
                            <span className="text-blue-400 text-xs">
                              +{form.watch("xpReward") || 0} XP
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("details")}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1"
                >
                  {createMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    "Launch Challenge"
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
