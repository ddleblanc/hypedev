'use client';

import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStudioNew } from '@/contexts/studio-new-context';
import { upload } from 'thirdweb/storage';
import { client } from '@/lib/thirdweb';
import { MediaRenderer } from '@/components/media-renderer';

interface UploadZoneProps {
  label: string;
  hint: string;
  value: string | null;
  onChange: (url: string | null) => void;
  aspectRatio?: 'square' | 'banner';
}

function UploadZone({
  label,
  hint,
  value,
  onChange,
  aspectRatio = 'square',
}: UploadZoneProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = useCallback(
    async (file: File) => {
      setIsUploading(true);
      try {
        // Upload to IPFS via Thirdweb storage
        const uri = await upload({
          client,
          files: [file],
        });
        onChange(uri);
      } catch (error) {
        console.error('Upload failed:', error);
        // Fallback to local URL for preview
        const url = URL.createObjectURL(file);
        onChange(url);
      } finally {
        setIsUploading(false);
      }
    },
    [onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        handleUpload(file);
      }
    },
    [handleUpload]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleUpload(file);
      }
    },
    [handleUpload]
  );

  return (
    <div>
      <label className="block text-sm font-medium text-studio-text mb-2">
        {label}
      </label>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className={cn(
          'relative border-2 border-dashed rounded-xl transition-colors overflow-hidden',
          'hover:border-studio-accent hover:bg-studio-accent/5',
          value ? 'border-studio-accent' : 'border-studio-border',
          aspectRatio === 'banner' ? 'aspect-[3/1]' : 'aspect-square'
        )}
      >
        {value ? (
          <>
            <MediaRenderer
              src={value}
              alt="Upload preview"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full hover:bg-black/80 transition-colors z-10"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </>
        ) : (
          <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
            {isUploading ? (
              <div className="h-8 w-8 border-2 border-studio-accent/30 border-t-studio-accent rounded-full animate-spin" />
            ) : (
              <>
                <Upload className="h-8 w-8 text-studio-text-muted mb-2" />
                <span className="text-sm text-studio-text">
                  Drop image or click
                </span>
                <span className="text-xs text-studio-text-muted mt-1">
                  {hint}
                </span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleInputChange}
              className="hidden"
            />
          </label>
        )}
      </div>
    </div>
  );
}

export function ArtworkStep() {
  const { state, updateDraft } = useStudioNew();

  return (
    <div className="text-center">
      <h2 className="text-2xl font-semibold text-studio-text mb-2">
        Add artwork
      </h2>
      <p className="text-studio-text-muted mb-8">
        Upload images for your collection (you can skip this for now)
      </p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="grid grid-cols-2 gap-4">
          <UploadZone
            label="Collection Image"
            hint="500x500 recommended"
            value={state.create.draft.image || null}
            onChange={(url) => updateDraft({ image: url })}
            aspectRatio="square"
          />
          <UploadZone
            label="Banner Image"
            hint="1500x500 recommended"
            value={state.create.draft.bannerImage || null}
            onChange={(url) => updateDraft({ bannerImage: url })}
            aspectRatio="banner"
          />
        </div>

        <p className="text-xs text-studio-text-muted">
          These images represent your collection. Individual NFTs will have
          their own artwork.
        </p>
      </motion.div>
    </div>
  );
}
