"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UploadBottomBarProps {
  uploadFilesCount: number;
  isUploading: boolean;
  onCancel: () => void;
  onMint: () => void;
}

export function UploadBottomBar({
  uploadFilesCount,
  isUploading,
  onCancel,
  onMint
}: UploadBottomBarProps) {
  return (
    <div className="fixed bottom-16 left-0 right-0 md:left-80 md:right-0 bg-black/95 backdrop-blur-lg border-t border-white/10 z-30">
      <div className="px-4 md:px-8 py-4 md:py-6">
        <div className="flex flex-col md:flex-row gap-4 md:gap-0 md:justify-between md:items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={onCancel}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <div className="text-white/60 text-sm">
              {uploadFilesCount} NFT{uploadFilesCount !== 1 ? 's' : ''} ready to mint
            </div>
          </div>

          <Button
            onClick={onMint}
            disabled={isUploading || uploadFilesCount === 0}
            className="bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90 font-bold"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
                Minting...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Mint {uploadFilesCount} NFT{uploadFilesCount !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
