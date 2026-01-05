"use client";

import { useState, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  User,
  Briefcase,
  Palette,
  Target,
  Share2,
  FileText,
  Send,
  Gamepad2,
  Building2,
  Megaphone,
  MoreHorizontal,
  ExternalLink,
} from "lucide-react";

// =============================================================================
// Schema
// =============================================================================

const CreatorApplicationSchema = z.object({
  creatorType: z.enum(["game_developer", "artist", "brand", "influencer", "other"]),
  displayName: z.string().min(2, "Display name must be at least 2 characters").max(50),
  tagline: z.string().max(100, "Tagline must be under 100 characters").optional(),
  bio: z.string().min(50, "Bio must be at least 50 characters").max(1000),
  avatar: z.string().url().optional().or(z.literal("")),
  banner: z.string().url().optional().or(z.literal("")),
  skills: z.array(z.string()).min(1, "Select at least one skill").max(10),
  portfolio: z.string().url().optional().or(z.literal("")),
  achievements: z.string().max(500).optional(),
  socialLinks: z.object({
    twitter: z.string().optional(),
    discord: z.string().optional(),
    website: z.string().url().optional().or(z.literal("")),
    instagram: z.string().optional(),
  }),
  contentTypes: z.array(z.string()).min(1, "Select at least one content type").max(5),
  uploadFrequency: z.enum(["daily", "weekly", "biweekly", "monthly", "occasional"]),
  targetAudience: z.string().min(10, "Describe your target audience").max(300),
  uniqueValue: z.string().max(500).optional(),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: "You must accept the terms" }) }),
  acceptCreatorAgreement: z.literal(true, { errorMap: () => ({ message: "You must accept the creator agreement" }) }),
  understandFees: z.literal(true, { errorMap: () => ({ message: "You must acknowledge the fee structure" }) }),
});

type CreatorApplicationData = z.infer<typeof CreatorApplicationSchema>;

// =============================================================================
// Constants
// =============================================================================

const STEPS = [
  { id: "type", title: "Creator Type", description: "What kind of creator are you?", icon: User },
  { id: "profile", title: "Your Profile", description: "Tell us about yourself", icon: Briefcase },
  { id: "portfolio", title: "Portfolio", description: "Show us your work", icon: Palette },
  { id: "content", title: "Content Plan", description: "What will you create?", icon: Target },
  { id: "social", title: "Social Links", description: "Connect your accounts", icon: Share2 },
  { id: "terms", title: "Terms", description: "Review and accept", icon: FileText },
  { id: "review", title: "Review", description: "Submit your application", icon: Send },
];

const CREATOR_TYPES = [
  { value: "game_developer", label: "Game Developer", icon: Gamepad2, description: "Build games and interactive experiences" },
  { value: "artist", label: "Digital Artist", icon: Palette, description: "Create visual art and collectibles" },
  { value: "brand", label: "Brand / Company", icon: Building2, description: "Official brand NFT launches" },
  { value: "influencer", label: "Content Creator", icon: Megaphone, description: "Creators with an audience" },
  { value: "other", label: "Other", icon: MoreHorizontal, description: "Something unique" },
] as const;

const SKILLS_OPTIONS = [
  "3D Modeling", "2D Art", "Pixel Art", "Animation", "Game Design", "Smart Contracts",
  "Music & Audio", "Photography", "Generative Art", "VR/AR", "Motion Graphics", "UI/UX Design",
];

const CONTENT_TYPES = [
  "In-Game Items", "Collectible Art", "PFP Collections", "Lootboxes",
  "Season Passes", "Game Assets", "Music NFTs", "Photography",
];

const UPLOAD_FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Every 2 Weeks" },
  { value: "monthly", label: "Monthly" },
  { value: "occasional", label: "Occasionally" },
] as const;

// =============================================================================
// Component
// =============================================================================

interface CreatorApplicationFormProps {
  onSuccess?: () => void;
}

export function CreatorApplicationForm({ onSuccess }: CreatorApplicationFormProps) {
  const [step, setStep] = useState(0);
  const utils = trpc.useUtils();
  const { toast } = useToast();

  const form = useForm<CreatorApplicationData>({
    resolver: zodResolver(CreatorApplicationSchema),
    mode: "onChange",
    defaultValues: {
      skills: [],
      contentTypes: [],
      socialLinks: {
        twitter: "",
        discord: "",
        website: "",
        instagram: "",
      },
      bio: "",
      tagline: "",
      achievements: "",
      uniqueValue: "",
      targetAudience: "",
      portfolio: "",
      avatar: "",
      banner: "",
    },
  });

  const submitApplication = trpc.studio.creator.submitApplication.useMutation({
    onSuccess: () => {
      toast({
        title: "Application submitted successfully!",
        description: "We'll review your application and get back to you soon.",
      });
      utils.studio.creator.status.invalidate();
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit application",
        variant: "destructive",
      });
    },
  });

  const getFieldsForStep = useCallback((stepIndex: number): (keyof CreatorApplicationData)[] => {
    switch (stepIndex) {
      case 0: return ["creatorType"];
      case 1: return ["displayName", "bio"];
      case 2: return ["skills"];
      case 3: return ["contentTypes", "uploadFrequency", "targetAudience"];
      case 4: return []; // Social links are optional
      case 5: return ["acceptTerms", "acceptCreatorAgreement", "understandFees"];
      default: return [];
    }
  }, []);

  const handleNext = async () => {
    const fieldsToValidate = getFieldsForStep(step);
    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async (data: CreatorApplicationData) => {
    // Clean up empty strings to null for optional URL fields
    const cleanedData = {
      ...data,
      avatar: data.avatar || null,
      banner: data.banner || null,
      portfolio: data.portfolio || null,
      socialLinks: {
        ...data.socialLinks,
        website: data.socialLinks.website || undefined,
      },
    };
    await submitApplication.mutateAsync(cleanedData);
  };

  const watchedValues = form.watch();

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isCompleted = i < step;
            return (
              <div key={s.id} className="flex flex-col items-center relative">
                <motion.div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    transition-all duration-300
                    ${isCompleted ? "bg-[rgb(163,255,18)] text-black" : ""}
                    ${isActive ? "bg-[rgb(163,255,18)]/20 text-[rgb(163,255,18)] ring-2 ring-[rgb(163,255,18)]" : ""}
                    ${!isActive && !isCompleted ? "bg-white/5 text-white/40" : ""}
                  `}
                  whileHover={{ scale: 1.05 }}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </motion.div>
                <span className={`text-xs mt-2 hidden md:block ${isActive ? "text-[rgb(163,255,18)]" : "text-white/40"}`}>
                  {s.title}
                </span>
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div
                    className={`absolute top-5 left-[60%] w-[calc(100%-10px)] h-[2px] ${
                      isCompleted ? "bg-[rgb(163,255,18)]" : "bg-white/10"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Step Info */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">{STEPS[step].title}</h2>
        <p className="text-white/60">{STEPS[step].description}</p>
      </div>

      {/* Form */}
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Step 0: Creator Type */}
            {step === 0 && (
              <div className="space-y-4">
                <Controller
                  name="creatorType"
                  control={form.control}
                  render={({ field }) => (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {CREATOR_TYPES.map((type) => {
                        const Icon = type.icon;
                        const isSelected = field.value === type.value;
                        return (
                          <motion.button
                            key={type.value}
                            type="button"
                            onClick={() => field.onChange(type.value)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`
                              p-4 rounded-xl border-2 text-left transition-all
                              ${isSelected
                                ? "border-[rgb(163,255,18)] bg-[rgb(163,255,18)]/10"
                                : "border-white/10 bg-white/5 hover:border-white/20"
                              }
                            `}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`
                                w-10 h-10 rounded-lg flex items-center justify-center
                                ${isSelected ? "bg-[rgb(163,255,18)] text-black" : "bg-white/10 text-white/60"}
                              `}>
                                <Icon className="w-5 h-5" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-white">{type.label}</h3>
                                <p className="text-sm text-white/60">{type.description}</p>
                              </div>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                />
                {form.formState.errors.creatorType && (
                  <p className="text-red-500 text-sm">{form.formState.errors.creatorType.message}</p>
                )}
              </div>
            )}

            {/* Step 1: Profile */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="displayName" className="text-white">Display Name *</Label>
                  <Input
                    id="displayName"
                    {...form.register("displayName")}
                    placeholder="Your creator name"
                    className="mt-2 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  />
                  {form.formState.errors.displayName && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.displayName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="tagline" className="text-white">Tagline</Label>
                  <Input
                    id="tagline"
                    {...form.register("tagline")}
                    placeholder="A short description of what you do"
                    className="mt-2 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  />
                  <p className="text-white/40 text-xs mt-1">{(watchedValues.tagline?.length || 0)}/100 characters</p>
                </div>

                <div>
                  <Label htmlFor="bio" className="text-white">Bio *</Label>
                  <Textarea
                    id="bio"
                    {...form.register("bio")}
                    placeholder="Tell us about yourself, your journey, and what drives your creativity (min 50 characters)"
                    className="mt-2 bg-white/5 border-white/10 text-white placeholder:text-white/40 min-h-[120px]"
                  />
                  <p className="text-white/40 text-xs mt-1">{(watchedValues.bio?.length || 0)}/1000 characters</p>
                  {form.formState.errors.bio && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.bio.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="avatar" className="text-white">Avatar URL</Label>
                    <Input
                      id="avatar"
                      {...form.register("avatar")}
                      placeholder="https://..."
                      className="mt-2 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    />
                  </div>
                  <div>
                    <Label htmlFor="banner" className="text-white">Banner URL</Label>
                    <Input
                      id="banner"
                      {...form.register("banner")}
                      placeholder="https://..."
                      className="mt-2 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Portfolio */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <Label className="text-white mb-3 block">Skills & Expertise *</Label>
                  <Controller
                    name="skills"
                    control={form.control}
                    render={({ field }) => (
                      <div className="flex flex-wrap gap-2">
                        {SKILLS_OPTIONS.map((skill) => {
                          const isSelected = field.value.includes(skill);
                          return (
                            <Badge
                              key={skill}
                              variant="outline"
                              onClick={() => {
                                if (isSelected) {
                                  field.onChange(field.value.filter((s) => s !== skill));
                                } else if (field.value.length < 10) {
                                  field.onChange([...field.value, skill]);
                                }
                              }}
                              className={`
                                cursor-pointer transition-all
                                ${isSelected
                                  ? "bg-[rgb(163,255,18)] text-black border-[rgb(163,255,18)]"
                                  : "border-white/20 text-white/60 hover:border-white/40"
                                }
                              `}
                            >
                              {skill}
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  />
                  <p className="text-white/40 text-xs mt-2">{watchedValues.skills?.length || 0}/10 selected</p>
                  {form.formState.errors.skills && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.skills.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="portfolio" className="text-white">Portfolio URL</Label>
                  <Input
                    id="portfolio"
                    {...form.register("portfolio")}
                    placeholder="https://yourportfolio.com"
                    className="mt-2 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  />
                </div>

                <div>
                  <Label htmlFor="achievements" className="text-white">Notable Achievements</Label>
                  <Textarea
                    id="achievements"
                    {...form.register("achievements")}
                    placeholder="Awards, collaborations, milestones, etc."
                    className="mt-2 bg-white/5 border-white/10 text-white placeholder:text-white/40 min-h-[100px]"
                  />
                  <p className="text-white/40 text-xs mt-1">{(watchedValues.achievements?.length || 0)}/500 characters</p>
                </div>
              </div>
            )}

            {/* Step 3: Content Plan */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <Label className="text-white mb-3 block">Content Types *</Label>
                  <Controller
                    name="contentTypes"
                    control={form.control}
                    render={({ field }) => (
                      <div className="flex flex-wrap gap-2">
                        {CONTENT_TYPES.map((type) => {
                          const isSelected = field.value.includes(type);
                          return (
                            <Badge
                              key={type}
                              variant="outline"
                              onClick={() => {
                                if (isSelected) {
                                  field.onChange(field.value.filter((t) => t !== type));
                                } else if (field.value.length < 5) {
                                  field.onChange([...field.value, type]);
                                }
                              }}
                              className={`
                                cursor-pointer transition-all
                                ${isSelected
                                  ? "bg-purple-500 text-white border-purple-500"
                                  : "border-white/20 text-white/60 hover:border-white/40"
                                }
                              `}
                            >
                              {type}
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  />
                  <p className="text-white/40 text-xs mt-2">{watchedValues.contentTypes?.length || 0}/5 selected</p>
                  {form.formState.errors.contentTypes && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.contentTypes.message}</p>
                  )}
                </div>

                <div>
                  <Label className="text-white mb-3 block">Upload Frequency *</Label>
                  <Controller
                    name="uploadFrequency"
                    control={form.control}
                    render={({ field }) => (
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        {UPLOAD_FREQUENCIES.map((freq) => (
                          <button
                            key={freq.value}
                            type="button"
                            onClick={() => field.onChange(freq.value)}
                            className={`
                              px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all
                              ${field.value === freq.value
                                ? "border-[rgb(163,255,18)] bg-[rgb(163,255,18)]/10 text-[rgb(163,255,18)]"
                                : "border-white/10 text-white/60 hover:border-white/20"
                              }
                            `}
                          >
                            {freq.label}
                          </button>
                        ))}
                      </div>
                    )}
                  />
                </div>

                <div>
                  <Label htmlFor="targetAudience" className="text-white">Target Audience *</Label>
                  <Textarea
                    id="targetAudience"
                    {...form.register("targetAudience")}
                    placeholder="Describe who your content is for (gamers, collectors, specific communities, etc.)"
                    className="mt-2 bg-white/5 border-white/10 text-white placeholder:text-white/40 min-h-[100px]"
                  />
                  <p className="text-white/40 text-xs mt-1">{(watchedValues.targetAudience?.length || 0)}/300 characters</p>
                  {form.formState.errors.targetAudience && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.targetAudience.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="uniqueValue" className="text-white">What Makes You Unique?</Label>
                  <Textarea
                    id="uniqueValue"
                    {...form.register("uniqueValue")}
                    placeholder="What sets you apart from other creators?"
                    className="mt-2 bg-white/5 border-white/10 text-white placeholder:text-white/40 min-h-[80px]"
                  />
                </div>
              </div>
            )}

            {/* Step 4: Social Links */}
            {step === 4 && (
              <div className="space-y-4">
                <p className="text-white/60 text-sm mb-4">
                  Connect your social accounts to help us verify your identity (optional but recommended).
                </p>

                <div>
                  <Label htmlFor="twitter" className="text-white">Twitter / X</Label>
                  <Input
                    id="twitter"
                    {...form.register("socialLinks.twitter")}
                    placeholder="@username"
                    className="mt-2 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  />
                </div>

                <div>
                  <Label htmlFor="discord" className="text-white">Discord</Label>
                  <Input
                    id="discord"
                    {...form.register("socialLinks.discord")}
                    placeholder="username#0000"
                    className="mt-2 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  />
                </div>

                <div>
                  <Label htmlFor="instagram" className="text-white">Instagram</Label>
                  <Input
                    id="instagram"
                    {...form.register("socialLinks.instagram")}
                    placeholder="@username"
                    className="mt-2 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  />
                </div>

                <div>
                  <Label htmlFor="website" className="text-white">Website</Label>
                  <Input
                    id="website"
                    {...form.register("socialLinks.website")}
                    placeholder="https://yourwebsite.com"
                    className="mt-2 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  />
                </div>
              </div>
            )}

            {/* Step 5: Terms */}
            {step === 5 && (
              <div className="space-y-6">
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-4">
                    <Controller
                      name="acceptTerms"
                      control={form.control}
                      render={({ field }) => (
                        <div className="flex items-start gap-3">
                          <Checkbox
                            id="acceptTerms"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="mt-1"
                          />
                          <div>
                            <Label htmlFor="acceptTerms" className="text-white cursor-pointer">
                              I accept the Terms of Service
                            </Label>
                            <p className="text-white/40 text-sm mt-1">
                              I have read and agree to the HPX{" "}
                              <a href="/terms" target="_blank" className="text-[rgb(163,255,18)] hover:underline inline-flex items-center gap-1">
                                Terms of Service <ExternalLink className="w-3 h-3" />
                              </a>
                            </p>
                          </div>
                        </div>
                      )}
                    />
                    {form.formState.errors.acceptTerms && (
                      <p className="text-red-500 text-sm mt-2">{form.formState.errors.acceptTerms.message}</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-4">
                    <Controller
                      name="acceptCreatorAgreement"
                      control={form.control}
                      render={({ field }) => (
                        <div className="flex items-start gap-3">
                          <Checkbox
                            id="acceptCreatorAgreement"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="mt-1"
                          />
                          <div>
                            <Label htmlFor="acceptCreatorAgreement" className="text-white cursor-pointer">
                              I accept the Creator Agreement
                            </Label>
                            <p className="text-white/40 text-sm mt-1">
                              I understand that as a verified creator, I am responsible for the content I publish
                              and will adhere to community guidelines.
                            </p>
                          </div>
                        </div>
                      )}
                    />
                    {form.formState.errors.acceptCreatorAgreement && (
                      <p className="text-red-500 text-sm mt-2">{form.formState.errors.acceptCreatorAgreement.message}</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-4">
                    <Controller
                      name="understandFees"
                      control={form.control}
                      render={({ field }) => (
                        <div className="flex items-start gap-3">
                          <Checkbox
                            id="understandFees"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="mt-1"
                          />
                          <div>
                            <Label htmlFor="understandFees" className="text-white cursor-pointer">
                              I understand the fee structure
                            </Label>
                            <p className="text-white/40 text-sm mt-1">
                              I understand that HPX charges a 2.5% platform fee on primary sales and that
                              gas fees for blockchain transactions are my responsibility.
                            </p>
                          </div>
                        </div>
                      )}
                    />
                    {form.formState.errors.understandFees && (
                      <p className="text-red-500 text-sm mt-2">{form.formState.errors.understandFees.message}</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step 6: Review */}
            {step === 6 && (
              <div className="space-y-6">
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Application Summary</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-white/40">Creator Type</p>
                        <p className="text-white font-medium capitalize">
                          {watchedValues.creatorType?.replace("_", " ")}
                        </p>
                      </div>
                      <div>
                        <p className="text-white/40">Display Name</p>
                        <p className="text-white font-medium">{watchedValues.displayName}</p>
                      </div>
                    </div>

                    {watchedValues.tagline && (
                      <div>
                        <p className="text-white/40 text-sm">Tagline</p>
                        <p className="text-white">{watchedValues.tagline}</p>
                      </div>
                    )}

                    <div>
                      <p className="text-white/40 text-sm">Bio</p>
                      <p className="text-white text-sm">{watchedValues.bio}</p>
                    </div>

                    <div>
                      <p className="text-white/40 text-sm mb-2">Skills</p>
                      <div className="flex flex-wrap gap-1">
                        {watchedValues.skills?.map((skill) => (
                          <Badge key={skill} variant="secondary" className="bg-white/10 text-white/80">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-white/40 text-sm mb-2">Content Types</p>
                      <div className="flex flex-wrap gap-1">
                        {watchedValues.contentTypes?.map((type) => (
                          <Badge key={type} variant="secondary" className="bg-purple-500/20 text-purple-300">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-white/40">Upload Frequency</p>
                        <p className="text-white font-medium capitalize">{watchedValues.uploadFrequency}</p>
                      </div>
                      {watchedValues.portfolio && (
                        <div>
                          <p className="text-white/40">Portfolio</p>
                          <a
                            href={watchedValues.portfolio}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[rgb(163,255,18)] hover:underline flex items-center gap-1"
                          >
                            View <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-white/40 text-sm">Target Audience</p>
                      <p className="text-white text-sm">{watchedValues.targetAudience}</p>
                    </div>

                    {/* Social Links */}
                    {(watchedValues.socialLinks?.twitter ||
                      watchedValues.socialLinks?.discord ||
                      watchedValues.socialLinks?.instagram ||
                      watchedValues.socialLinks?.website) && (
                      <div>
                        <p className="text-white/40 text-sm mb-2">Social Links</p>
                        <div className="flex flex-wrap gap-2">
                          {watchedValues.socialLinks?.twitter && (
                            <Badge variant="outline" className="border-white/20 text-white/60">
                              X: {watchedValues.socialLinks.twitter}
                            </Badge>
                          )}
                          {watchedValues.socialLinks?.discord && (
                            <Badge variant="outline" className="border-white/20 text-white/60">
                              Discord: {watchedValues.socialLinks.discord}
                            </Badge>
                          )}
                          {watchedValues.socialLinks?.instagram && (
                            <Badge variant="outline" className="border-white/20 text-white/60">
                              IG: {watchedValues.socialLinks.instagram}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="bg-[rgb(163,255,18)]/10 border border-[rgb(163,255,18)]/20 rounded-xl p-4">
                  <p className="text-[rgb(163,255,18)] text-sm">
                    By submitting this application, you confirm that all information provided is accurate
                    and you agree to the terms above. Our team will review your application within 1-3 business days.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={step === 0}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button
              type="button"
              onClick={handleNext}
              className="bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90"
            >
              Continue
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={submitApplication.isPending}
              className="bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90"
            >
              {submitApplication.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Application
                  <Send className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
