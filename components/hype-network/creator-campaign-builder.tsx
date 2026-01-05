"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  Image as ImageIcon,
  Loader2,
  Percent,
  Sparkles,
  Target,
  Users,
  Zap,
} from "lucide-react";

// Form validation schema
const CampaignFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100),
  description: z.string().max(500).optional(),
  bannerImage: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  collectionId: z.string().uuid().optional(),
  lootboxId: z.string().uuid().optional(),
  baseCommissionBps: z.number().min(100).max(5000),
  totalBudget: z.number().min(0).optional(),
  maxAgents: z.number().min(1).optional(),
  startAt: z.string().min(1, "Start date is required"),
  endAt: z.string().min(1, "End date is required"),
  xpPerReferral: z.number().min(0).max(1000),
  xpBonusFirstSale: z.number().min(0).max(2000),
  isPublic: z.boolean(),
});

type CampaignFormData = z.infer<typeof CampaignFormSchema>;

interface CampaignBuilderProps {
  collections: Array<{ id: string; name: string; image: string | null }>;
  lootboxes: Array<{ id: string; name: string; image: string | null }>;
  onSuccess?: (campaignId: string) => void;
  onCancel?: () => void;
}

type TargetType = "collection" | "lootbox";

const steps = [
  { id: "target", title: "What are you promoting?", icon: Target },
  { id: "details", title: "Campaign Details", icon: Sparkles },
  { id: "rewards", title: "Commission & Rewards", icon: Zap },
] as const;

export function CreatorCampaignBuilder({
  collections,
  lootboxes,
  onSuccess,
  onCancel,
}: CampaignBuilderProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [targetType, setTargetType] = useState<TargetType>("collection");
  const [selectedTarget, setSelectedTarget] = useState<string>("");

  // Default dates
  const now = new Date();
  const defaultStart = now.toISOString().slice(0, 16);
  const defaultEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16);

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(CampaignFormSchema),
    defaultValues: {
      name: "",
      description: "",
      bannerImage: "",
      baseCommissionBps: 500, // 5%
      xpPerReferral: 100,
      xpBonusFirstSale: 500,
      isPublic: true,
      startAt: defaultStart,
      endAt: defaultEnd,
    },
  });

  const createMutation = trpc.hypeNetwork.campaigns.create.useMutation({
    onSuccess: (data) => {
      toast({ title: "Campaign created successfully!" });
      onSuccess?.(data.id);
    },
    onError: (error) => {
      toast({ title: error.message || "Failed to create campaign", variant: "destructive" });
    },
  });

  const handleSubmit = async (data: CampaignFormData) => {
    // Validate target selection
    if (targetType === "collection" && !selectedTarget) {
      toast({ title: "Please select a collection", variant: "destructive" });
      setStep(0);
      return;
    }
    if (targetType === "lootbox" && !selectedTarget) {
      toast({ title: "Please select a lootbox", variant: "destructive" });
      setStep(0);
      return;
    }

    // Validate dates
    const startDate = new Date(data.startAt);
    const endDate = new Date(data.endAt);
    if (endDate <= startDate) {
      toast({ title: "End date must be after start date", variant: "destructive" });
      setStep(1);
      return;
    }

    await createMutation.mutateAsync({
      ...data,
      collectionId: targetType === "collection" ? selectedTarget : undefined,
      lootboxId: targetType === "lootbox" ? selectedTarget : undefined,
      startAt: startDate,
      endAt: endDate,
      bannerImage: data.bannerImage || undefined,
      totalBudget: data.totalBudget || undefined,
      maxAgents: data.maxAgents || undefined,
    });
  };

  const nextStep = () => {
    if (step === 0 && !selectedTarget) {
      toast({ title: `Please select a ${targetType}`, variant: "destructive" });
      return;
    }
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const targets = targetType === "collection" ? collections : lootboxes;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step Indicators */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === step;
          const isComplete = i < step;

          return (
            <div key={s.id} className="flex items-center">
              <button
                type="button"
                onClick={() => i < step && setStep(i)}
                disabled={i > step}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full transition-all",
                  isActive && "bg-white/10 text-white",
                  isComplete && "text-green-400 cursor-pointer hover:bg-white/5",
                  !isActive && !isComplete && "text-zinc-500"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    isActive && "bg-white text-black",
                    isComplete && "bg-green-500/20 text-green-400",
                    !isActive && !isComplete && "bg-zinc-800"
                  )}
                >
                  {isComplete ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                <span className="hidden sm:inline text-sm font-medium">
                  {s.title}
                </span>
              </button>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "w-8 h-px mx-2",
                    i < step ? "bg-green-500" : "bg-zinc-700"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <AnimatePresence mode="wait">
          {/* Step 1: Target Selection */}
          {step === 0 && (
            <motion.div
              key="target"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white">
                  What are you promoting?
                </h2>
                <p className="text-zinc-400 mt-2">
                  Select the collection or lootbox for this affiliate campaign
                </p>
              </div>

              {/* Target Type Toggle */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setTargetType("collection");
                    setSelectedTarget("");
                  }}
                  className={cn(
                    "p-6 rounded-xl border-2 text-left transition-all",
                    targetType === "collection"
                      ? "border-white bg-white/10"
                      : "border-zinc-700 hover:border-zinc-600"
                  )}
                >
                  <div className="text-3xl mb-3">🖼️</div>
                  <div className="font-semibold text-white">Collection</div>
                  <div className="text-sm text-zinc-400 mt-1">
                    NFT Drop or Collection
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTargetType("lootbox");
                    setSelectedTarget("");
                  }}
                  className={cn(
                    "p-6 rounded-xl border-2 text-left transition-all",
                    targetType === "lootbox"
                      ? "border-white bg-white/10"
                      : "border-zinc-700 hover:border-zinc-600"
                  )}
                >
                  <div className="text-3xl mb-3">🎁</div>
                  <div className="font-semibold text-white">Lootbox</div>
                  <div className="text-sm text-zinc-400 mt-1">
                    Mystery Box Campaign
                  </div>
                </button>
              </div>

              {/* Target Selection */}
              <div className="space-y-3">
                <Label className="text-zinc-300">
                  Select {targetType === "collection" ? "Collection" : "Lootbox"}
                </Label>
                {targets.length === 0 ? (
                  <div className="p-8 rounded-lg border border-zinc-700 text-center text-zinc-500">
                    No {targetType === "collection" ? "collections" : "lootboxes"}{" "}
                    available. Create one first.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto p-1">
                    {targets.map((target) => (
                      <button
                        key={target.id}
                        type="button"
                        onClick={() => setSelectedTarget(target.id)}
                        className={cn(
                          "p-3 rounded-lg border-2 transition-all text-left",
                          selectedTarget === target.id
                            ? "border-white bg-white/10"
                            : "border-zinc-700 hover:border-zinc-600"
                        )}
                      >
                        <div className="aspect-square rounded-md overflow-hidden bg-zinc-800 mb-2">
                          {target.image ? (
                            <img
                              src={target.image}
                              alt={target.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-8 h-8 text-zinc-600" />
                            </div>
                          )}
                        </div>
                        <div className="text-sm font-medium text-white truncate">
                          {target.name}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 2: Campaign Details */}
          {step === 1 && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white">Campaign Details</h2>
                <p className="text-zinc-400 mt-2">
                  Set up your campaign name, description, and timing
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-zinc-300">
                    Campaign Name *
                  </Label>
                  <Input
                    id="name"
                    {...form.register("name")}
                    placeholder="Summer NFT Blitz"
                    className="mt-1.5 bg-zinc-900 border-zinc-700"
                  />
                  {form.formState.errors.name && (
                    <p className="text-red-400 text-sm mt-1">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description" className="text-zinc-300">
                    Description (optional)
                  </Label>
                  <Textarea
                    id="description"
                    {...form.register("description")}
                    placeholder="Describe what affiliates will be promoting..."
                    className="mt-1.5 bg-zinc-900 border-zinc-700 min-h-[100px]"
                  />
                </div>

                <div>
                  <Label htmlFor="bannerImage" className="text-zinc-300">
                    Banner Image URL (optional)
                  </Label>
                  <Input
                    id="bannerImage"
                    {...form.register("bannerImage")}
                    placeholder="https://..."
                    className="mt-1.5 bg-zinc-900 border-zinc-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startAt" className="text-zinc-300 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Start Date *
                    </Label>
                    <Input
                      id="startAt"
                      type="datetime-local"
                      {...form.register("startAt")}
                      className="mt-1.5 bg-zinc-900 border-zinc-700"
                    />
                  </div>
                  <div>
                    <Label htmlFor="endAt" className="text-zinc-300 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      End Date *
                    </Label>
                    <Input
                      id="endAt"
                      type="datetime-local"
                      {...form.register("endAt")}
                      className="mt-1.5 bg-zinc-900 border-zinc-700"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-900 border border-zinc-700">
                  <div>
                    <Label className="text-zinc-300">Public Campaign</Label>
                    <p className="text-sm text-zinc-500 mt-0.5">
                      Visible to all Hype Agents
                    </p>
                  </div>
                  <Switch
                    checked={form.watch("isPublic")}
                    onCheckedChange={(checked) =>
                      form.setValue("isPublic", checked)
                    }
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Commission & Rewards */}
          {step === 2 && (
            <motion.div
              key="rewards"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white">
                  Commission & Rewards
                </h2>
                <p className="text-zinc-400 mt-2">
                  Set commission rates and XP rewards for your affiliates
                </p>
              </div>

              <div className="space-y-6">
                {/* Commission Slider */}
                <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-700">
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-zinc-300 flex items-center gap-2">
                      <Percent className="w-4 h-4" />
                      Base Commission
                    </Label>
                    <span className="text-2xl font-bold text-green-400">
                      {form.watch("baseCommissionBps") / 100}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="5000"
                    step="100"
                    {...form.register("baseCommissionBps", { valueAsNumber: true })}
                    className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                  />
                  <div className="flex justify-between text-xs text-zinc-500 mt-2">
                    <span>1%</span>
                    <span>25%</span>
                    <span>50%</span>
                  </div>
                  <p className="text-sm text-zinc-500 mt-3">
                    Affiliates earn this percentage of each sale. Higher ranks get
                    multiplied commission (up to 2x for Mythic).
                  </p>
                </div>

                {/* Budget & Limits */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="totalBudget" className="text-zinc-300">
                      Total Budget (ETH)
                    </Label>
                    <Input
                      id="totalBudget"
                      type="number"
                      step="0.1"
                      {...form.register("totalBudget", { valueAsNumber: true })}
                      placeholder="10.0"
                      className="mt-1.5 bg-zinc-900 border-zinc-700"
                    />
                    <p className="text-xs text-zinc-500 mt-1">
                      Optional. Pauses when exhausted.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="maxAgents" className="text-zinc-300 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Max Agents
                    </Label>
                    <Input
                      id="maxAgents"
                      type="number"
                      {...form.register("maxAgents", { valueAsNumber: true })}
                      placeholder="Unlimited"
                      className="mt-1.5 bg-zinc-900 border-zinc-700"
                    />
                    <p className="text-xs text-zinc-500 mt-1">
                      Optional. Limits affiliates.
                    </p>
                  </div>
                </div>

                {/* XP Rewards */}
                <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-700">
                  <Label className="text-zinc-300 flex items-center gap-2 mb-4">
                    <Zap className="w-4 h-4 text-amber-400" />
                    XP Rewards
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="xpPerReferral" className="text-sm text-zinc-400">
                        XP per Referral
                      </Label>
                      <Input
                        id="xpPerReferral"
                        type="number"
                        {...form.register("xpPerReferral", { valueAsNumber: true })}
                        className="mt-1.5 bg-zinc-800 border-zinc-600"
                      />
                    </div>
                    <div>
                      <Label htmlFor="xpBonusFirstSale" className="text-sm text-zinc-400">
                        First Sale Bonus XP
                      </Label>
                      <Input
                        id="xpBonusFirstSale"
                        type="number"
                        {...form.register("xpBonusFirstSale", { valueAsNumber: true })}
                        className="mt-1.5 bg-zinc-800 border-zinc-600"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-zinc-500 mt-3">
                    XP helps affiliates rank up and earn higher commission
                    multipliers.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-zinc-800">
          <div>
            {step > 0 ? (
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            ) : onCancel ? (
              <Button type="button" variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            ) : null}
          </div>

          <div>
            {step < steps.length - 1 ? (
              <Button type="button" onClick={nextStep} className="gap-2">
                Continue
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Launch Campaign
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
