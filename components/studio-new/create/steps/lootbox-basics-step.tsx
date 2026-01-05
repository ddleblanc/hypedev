'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Box, Upload, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useStudioNew } from '@/contexts/studio-new-context';

export function LootboxBasicsStep() {
  const { state, updateLootboxDraft } = useStudioNew();
  const lootbox = state.create.draft.lootbox;
  const [dragOver, setDragOver] = useState(false);

  const handleImageDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          updateLootboxDraft({ image: event.target?.result as string });
        };
        reader.readAsDataURL(file);
      }
    },
    [updateLootboxDraft]
  );

  const handleImageSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          updateLootboxDraft({ image: event.target?.result as string });
        };
        reader.readAsDataURL(file);
      }
    },
    [updateLootboxDraft]
  );

  return (
    <div className="text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-auto h-14 w-14 rounded-xl bg-studio-accent/10 flex items-center justify-center mb-4"
      >
        <Box className="h-7 w-7 text-studio-accent" />
      </motion.div>

      <h2 className="text-2xl font-semibold text-studio-text mb-2">
        Name your lootbox
      </h2>
      <p className="text-studio-text-muted mb-8">
        Give your lootbox a memorable name and description
      </p>

      <div className="space-y-6 text-left">
        {/* Image Upload */}
        <div className="space-y-2">
          <Label className="text-studio-text">Lootbox Image</Label>
          <div
            className={`relative aspect-square max-w-[200px] mx-auto rounded-xl border-2 border-dashed transition-colors ${
              dragOver
                ? 'border-studio-accent bg-studio-accent/5'
                : 'border-studio-border hover:border-studio-text-muted/40'
            } ${lootbox?.image ? 'border-solid border-studio-border' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleImageDrop}
          >
            {lootbox?.image ? (
              <div className="relative w-full h-full">
                <img
                  src={lootbox.image}
                  alt="Lootbox preview"
                  className="w-full h-full object-cover rounded-xl"
                />
                <button
                  onClick={() => updateLootboxDraft({ image: null })}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-lg hover:bg-black/70 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer py-8">
                <div className="p-3 rounded-full bg-studio-surface mb-3">
                  <Upload className="w-6 h-6 text-studio-text-muted" />
                </div>
                <p className="text-sm text-studio-text">Drop image here</p>
                <p className="text-xs text-studio-text-muted">or click to browse</p>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                />
              </label>
            )}
          </div>
          <p className="text-xs text-studio-text-muted text-center">
            PNG, JPG, GIF up to 10MB
          </p>
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="lootbox-name" className="text-studio-text">
            Lootbox Name
          </Label>
          <Input
            id="lootbox-name"
            placeholder="Epic Mystery Box"
            value={lootbox?.name || ''}
            onChange={(e) => updateLootboxDraft({ name: e.target.value })}
            className="bg-studio-surface border-studio-border text-studio-text"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="lootbox-description" className="text-studio-text">
            Description
            <span className="text-studio-text-muted ml-1">(optional)</span>
          </Label>
          <Textarea
            id="lootbox-description"
            placeholder="What's inside this lootbox?"
            value={lootbox?.description || ''}
            onChange={(e) => updateLootboxDraft({ description: e.target.value })}
            className="bg-studio-surface border-studio-border text-studio-text min-h-[100px] resize-none"
          />
        </div>
      </div>
    </div>
  );
}
