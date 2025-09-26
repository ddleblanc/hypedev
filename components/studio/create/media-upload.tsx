"use client";

import { Upload, Image } from "lucide-react";
import { Label } from "@/components/ui/label";
import { MediaRenderer } from "@/components/MediaRenderer";

interface MediaUploadProps {
  type: 'image' | 'bannerImage' | 'projectBanner';
  label: string;
  value: string;
  isUploading: boolean;
  onUpload: (type: 'image' | 'bannerImage' | 'projectBanner') => void;
  dimensions?: string;
  description?: string;
  className?: string;
}

export function MediaUpload({
  type,
  label,
  value,
  isUploading,
  onUpload,
  dimensions,
  description,
  className = ""
}: MediaUploadProps) {
  const getPreviewSize = () => {
    switch (type) {
      case 'image':
        return 'w-16 h-16';
      case 'bannerImage':
        return 'w-20 h-12';
      case 'projectBanner':
        return 'w-20 h-12';
      default:
        return 'w-16 h-16';
    }
  };

  return (
    <div className={className}>
      <Label className="text-white mb-2 block">{label}</Label>
      <div
        className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-white/40 transition-colors cursor-pointer"
        onClick={() => onUpload(type)}
      >
        {isUploading ? (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[rgb(163,255,18)] mx-auto mb-2"></div>
        ) : value ? (
          <div className="space-y-2">
            <div className={`mx-auto mb-2 rounded-lg overflow-hidden ${getPreviewSize()}`}>
              <MediaRenderer src={value} className="w-full h-full object-cover" />
            </div>
            <p className="text-xs text-[rgb(163,255,18)]">Click to change</p>
          </div>
        ) : (
          <>
            <Upload className="w-8 h-8 mx-auto mb-2 text-white/40" />
            <p className="text-sm text-white/60">Click to upload or drag and drop</p>
            {dimensions && (
              <p className="text-xs text-white/40 mt-1">{dimensions}</p>
            )}
            {description && (
              <p className="text-xs text-white/40 mt-1">{description}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface MediaUploadGridProps {
  collectionImage: string;
  bannerImage: string;
  uploadingField: string | null;
  onImageUpload: (type: 'image' | 'bannerImage') => void;
  isMobile?: boolean;
}

export function MediaUploadGrid({
  collectionImage,
  bannerImage,
  uploadingField,
  onImageUpload,
  isMobile = false
}: MediaUploadGridProps) {
  if (isMobile) {
    return (
      <MediaUpload
        type="image"
        label="Upload Collection Image"
        value={collectionImage}
        isUploading={uploadingField === 'image'}
        onUpload={onImageUpload}
        description="PNG, JPG, GIF, MP4 up to 10MB"
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <MediaUpload
        type="image"
        label="Collection Image"
        value={collectionImage}
        isUploading={uploadingField === 'image'}
        onUpload={onImageUpload}
        dimensions="400x400 recommended"
      />
      <MediaUpload
        type="bannerImage"
        label="Banner Image"
        value={bannerImage}
        isUploading={uploadingField === 'bannerImage'}
        onUpload={onImageUpload}
        dimensions="1400x350 recommended"
      />
    </div>
  );
}

export function ProjectBannerUpload({
  value,
  isUploading,
  onUpload,
  className = ""
}: {
  value: string;
  isUploading: boolean;
  onUpload: (type: 'projectBanner') => void;
  className?: string;
}) {
  return (
    <MediaUpload
      type="projectBanner"
      label="Project Banner"
      value={value}
      isUploading={isUploading}
      onUpload={onUpload}
      dimensions="1400x350 recommended"
      className={className}
    />
  );
}