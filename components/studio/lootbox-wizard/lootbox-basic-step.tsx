"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Coins, Package, Info, Gift } from "lucide-react";
import type { LootboxConfig } from "@/app/studio/lootbox/create/page";

interface LootboxBasicStepProps {
  config: LootboxConfig;
  setConfig: (config: LootboxConfig) => void;
}

export function LootboxBasicStep({ config, setConfig }: LootboxBasicStepProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleImageDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setConfig({ ...config, image: event.target?.result as string });
        };
        reader.readAsDataURL(file);
      }
    },
    [config, setConfig]
  );

  const handleImageSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setConfig({ ...config, image: event.target?.result as string });
        };
        reader.readAsDataURL(file);
      }
    },
    [config, setConfig]
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-[rgb(163,255,18)]/10">
          <Package className="w-6 h-6 text-[rgb(163,255,18)]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Basic Information</h2>
          <p className="text-sm text-white/60">
            Set up the core details for your lootbox
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column - Image Upload */}
        <div className="space-y-4">
          <Label className="text-white">Lootbox Image</Label>
          <div
            className={`relative aspect-square rounded-xl border-2 border-dashed transition-colors ${
              dragOver
                ? "border-[rgb(163,255,18)] bg-[rgb(163,255,18)]/5"
                : "border-white/20 hover:border-white/40"
            } ${config.image ? "border-solid border-white/10" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleImageDrop}
          >
            {config.image ? (
              <div className="relative w-full h-full">
                <img
                  src={config.image}
                  alt="Lootbox preview"
                  className="w-full h-full object-cover rounded-xl"
                />
                <button
                  onClick={() => setConfig({ ...config, image: null })}
                  className="absolute top-2 right-2 p-2 bg-black/50 rounded-lg hover:bg-black/70 transition-colors"
                >
                  <span className="text-white text-sm">Remove</span>
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                <div className="flex flex-col items-center gap-3 p-6 text-center">
                  <div className="p-4 rounded-full bg-white/5">
                    <Upload className="w-8 h-8 text-white/40" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Drop image here</p>
                    <p className="text-sm text-white/40">or click to browse</p>
                  </div>
                  <p className="text-xs text-white/30">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                />
              </label>
            )}
          </div>
        </div>

        {/* Right Column - Details */}
        <div className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white">
              Lootbox Name
            </Label>
            <Input
              id="name"
              placeholder="Epic Mystery Box"
              value={config.name}
              onChange={(e) => setConfig({ ...config, name: e.target.value })}
              className="bg-zinc-900 border-white/10 text-white"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-white">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="What's inside this lootbox?"
              value={config.description}
              onChange={(e) =>
                setConfig({ ...config, description: e.target.value })
              }
              className="bg-zinc-900 border-white/10 text-white min-h-[100px]"
            />
          </div>

          {/* Price and Supply Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price" className="text-white flex items-center gap-2">
                <Coins className="w-4 h-4 text-[rgb(163,255,18)]" />
                Price (ETH)
              </Label>
              <Input
                id="price"
                type="number"
                step="0.001"
                min="0"
                placeholder="0.01"
                value={config.price}
                onChange={(e) => setConfig({ ...config, price: e.target.value })}
                className="bg-zinc-900 border-white/10 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supply" className="text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-[rgb(163,255,18)]" />
                Total Supply
              </Label>
              <Input
                id="supply"
                type="number"
                min="1"
                max="1000"
                placeholder="10"
                value={config.supply}
                onChange={(e) =>
                  setConfig({ ...config, supply: parseInt(e.target.value) || 0 })
                }
                className="bg-zinc-900 border-white/10 text-white"
              />
            </div>
          </div>

          {/* Rewards Per Opening */}
          <div className="space-y-2">
            <Label htmlFor="rewardsPerOpening" className="text-white flex items-center gap-2">
              <Gift className="w-4 h-4 text-[rgb(163,255,18)]" />
              Rewards Per Opening
            </Label>
            <div className="flex items-center gap-4">
              <Input
                id="rewardsPerOpening"
                type="number"
                min="1"
                max="10"
                value={config.rewardsPerOpening}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    rewardsPerOpening: Math.min(10, Math.max(1, parseInt(e.target.value) || 1)),
                  })
                }
                className="bg-zinc-900 border-white/10 text-white w-24"
              />
              <p className="text-sm text-white/60">
                Each opening gives {config.rewardsPerOpening} random reward{config.rewardsPerOpening > 1 ? "s" : ""}
              </p>
            </div>
            {config.rewardsPerOpening > 1 && (
              <p className="text-xs text-amber-400/80">
                You'll need at least {config.supply * config.rewardsPerOpening} NFTs as rewards
                ({config.supply} supply × {config.rewardsPerOpening} rewards per opening)
              </p>
            )}
          </div>

        </div>
      </div>

      {/* Info about auto-calculated rarity */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-400">
          <p className="font-medium">Rarity is Auto-Calculated</p>
          <p className="text-blue-400/80 mt-1">
            The lootbox rarity tier is automatically determined by the rewards you add
            and their assigned rarities. This ensures honest classification.
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-white/60">Price:</span>
            <span className="text-white font-medium">
              {config.price || "0"} ETH
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/60">Supply:</span>
            <span className="text-white font-medium">{config.supply}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/60">Rewards/Open:</span>
            <span className="text-white font-medium">{config.rewardsPerOpening}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/60">NFTs Needed:</span>
            <span className="text-white font-medium">
              {config.supply * config.rewardsPerOpening}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
