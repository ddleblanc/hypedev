"use client";

import { Upload, Sparkles, Tag, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UploadEmptyStateProps {
  onChooseFiles: () => void;
}

export function UploadEmptyState({ onChooseFiles }: UploadEmptyStateProps) {
  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white/5 rounded-xl">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto bg-[rgb(163,255,18)]/20 rounded-lg flex items-center justify-center mb-3">
            <Upload className="w-6 h-6 text-[rgb(163,255,18)]" />
          </div>
          <h3 className="text-white font-semibold mb-1">Bulk Upload</h3>
          <p className="text-white/60 text-sm mb-3">Upload multiple files at once</p>
          <Button
            onClick={onChooseFiles}
            className="bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90"
          >
            Choose Files
          </Button>
        </div>
        <div className="text-center">
          <div className="w-12 h-12 mx-auto bg-blue-500/20 rounded-lg flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6 text-blue-400" />
          </div>
          <h3 className="text-white font-semibold mb-1">AI Generation</h3>
          <p className="text-white/60 text-sm mb-3">Generate NFTs with AI</p>
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
            Coming Soon
          </Button>
        </div>
        <div className="text-center">
          <div className="w-12 h-12 mx-auto bg-purple-500/20 rounded-lg flex items-center justify-center mb-3">
            <Tag className="w-6 h-6 text-purple-400" />
          </div>
          <h3 className="text-white font-semibold mb-1">Batch Mint</h3>
          <p className="text-white/60 text-sm mb-3">Mint existing metadata</p>
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
            Import CSV
          </Button>
        </div>
      </div>

      {/* Drag & Drop Area */}
      <div
        className="border-2 border-dashed border-white/20 rounded-2xl p-8 md:p-12 text-center hover:border-[rgb(163,255,18)]/50 transition-all cursor-pointer"
        onClick={onChooseFiles}
      >
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto bg-white/10 rounded-full flex items-center justify-center">
            <Upload className="w-8 h-8 text-white/60" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Drag and drop your files here
            </h3>
            <p className="text-white/60 mb-4">
              or click to browse your device
            </p>
            <div className="flex items-center justify-center gap-4 text-white/40 text-sm">
              <span>Images</span>
              <span>•</span>
              <span>Videos</span>
              <span>•</span>
              <span>Audio</span>
              <span>•</span>
              <span>3D Models</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-blue-400 font-semibold mb-2">Pro Tips</h4>
            <ul className="text-white/80 text-sm space-y-1">
              <li>• Use consistent naming for easier batch processing</li>
              <li>• High-quality images (1000x1000px or larger) work best</li>
              <li>• You can edit metadata for each NFT individually</li>
              <li>• Drag and drop works on desktop and mobile</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
