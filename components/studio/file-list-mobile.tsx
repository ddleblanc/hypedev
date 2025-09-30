"use client";

import { motion } from "framer-motion";
import { Edit3, Trash2, Check, AlertCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { NFTFile } from "./types";

interface FileListMobileProps {
  uploadFiles: NFTFile[];
  onAddMore: () => void;
  onUpdateFile: (index: number, updates: Partial<NFTFile['metadata']>) => void;
  onSelectFile: (index: number) => void;
  onRemoveFile: (index: number) => void;
  getFileIcon: (type: NFTFile['type']) => React.ReactNode;
}

export function FileListMobile({
  uploadFiles,
  onAddMore,
  onUpdateFile,
  onSelectFile,
  onRemoveFile,
  getFileIcon
}: FileListMobileProps) {
  return (
    <div className="block md:hidden space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          {uploadFiles.length} NFT{uploadFiles.length !== 1 ? 's' : ''} Ready
        </h3>
        <Button
          size="sm"
          onClick={onAddMore}
          className="bg-[rgb(163,255,18)] text-black"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add More
        </Button>
      </div>

      {uploadFiles.map((file, index) => (
        <motion.div
          key={file.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 rounded-xl p-4"
        >
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-white/10 rounded-lg flex-shrink-0 overflow-hidden">
              {file.type === 'image' ? (
                <img src={file.preview} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {getFileIcon(file.type)}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="mb-3">
                <Input
                  value={file.metadata.name}
                  onChange={(e) => onUpdateFile(index, { name: e.target.value })}
                  className="bg-black/30 border-white/20 text-white mb-2"
                  placeholder="NFT Name"
                />
                <Textarea
                  value={file.metadata.description}
                  onChange={(e) => onUpdateFile(index, { description: e.target.value })}
                  className="bg-black/30 border-white/20 text-white resize-none"
                  placeholder="Description..."
                  rows={2}
                />
              </div>

              {file.metadata.attributes.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {file.metadata.attributes.map((attr, i) => (
                    <Badge key={i} className="bg-[rgb(163,255,18)]/20 text-[rgb(163,255,18)] text-xs">
                      {attr.trait_type}: {attr.value}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSelectFile(index)}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Details
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRemoveFile(index)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {/* Status indicator */}
              {file.status !== 'ready' && (
                <div className="mt-3 flex items-center gap-2">
                  {file.status === 'uploading' && (
                    <>
                      <div className="w-4 h-4 border-2 border-[rgb(163,255,18)] border-t-transparent rounded-full animate-spin" />
                      <span className="text-white/80 text-sm">Minting...</span>
                    </>
                  )}
                  {file.status === 'success' && (
                    <>
                      <Check className="w-4 h-4 text-green-400" />
                      <span className="text-green-400 text-sm">Minted successfully!</span>
                    </>
                  )}
                  {file.status === 'error' && (
                    <>
                      <AlertCircle className="w-4 h-4 text-red-400" />
                      <span className="text-red-400 text-sm">{file.error}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
