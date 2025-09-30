"use client";

import { Plus, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NFTFile } from "./types";

interface FileGridDesktopProps {
  uploadFiles: NFTFile[];
  selectedFileIndex: number;
  onAddMore: () => void;
  onSelectFile: (index: number) => void;
  getFileIcon: (type: NFTFile['type']) => React.ReactNode;
}

export function FileGridDesktop({
  uploadFiles,
  selectedFileIndex,
  onAddMore,
  onSelectFile,
  getFileIcon
}: FileGridDesktopProps) {
  return (
    <div className="w-1/3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Files</h3>
        <Button
          size="sm"
          onClick={onAddMore}
          className="bg-[rgb(163,255,18)] text-black"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {uploadFiles.map((file, index) => (
          <button
            key={file.id}
            onClick={() => onSelectFile(index)}
            className={`w-full p-3 rounded-lg text-left transition-all ${
              selectedFileIndex === index
                ? 'bg-[rgb(163,255,18)]/20 border border-[rgb(163,255,18)]'
                : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/10 rounded-lg flex-shrink-0 overflow-hidden">
                {file.type === 'image' ? (
                  <img src={file.preview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {getFileIcon(file.type)}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white font-medium text-sm truncate">
                  {file.metadata.name || 'Untitled'}
                </p>
                <p className="text-white/60 text-xs capitalize">{file.type}</p>
                {file.status !== 'ready' && (
                  <div className="flex items-center gap-1 mt-1">
                    {file.status === 'uploading' && <div className="w-2 h-2 bg-[rgb(163,255,18)] rounded-full animate-pulse" />}
                    {file.status === 'success' && <Check className="w-3 h-3 text-green-400" />}
                    {file.status === 'error' && <AlertCircle className="w-3 h-3 text-red-400" />}
                    <span className="text-xs text-white/60 capitalize">{file.status}</span>
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
