"use client";

import { Plus, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { NFTFile } from "./types";

interface MetadataEditorProps {
  file: NFTFile;
  fileIndex: number;
  totalFiles: number;
  onUpdateFile: (updates: Partial<NFTFile['metadata']>) => void;
  onUpdateAttribute: (attrIndex: number, updates: Partial<NFTFile['metadata']['attributes'][0]>) => void;
  onAddAttribute: () => void;
  onRemoveAttribute: (attrIndex: number) => void;
  onRemoveFile: () => void;
  getFileIcon: (type: NFTFile['type']) => React.ReactNode;
}

export function MetadataEditor({
  file,
  fileIndex,
  totalFiles,
  onUpdateFile,
  onUpdateAttribute,
  onAddAttribute,
  onRemoveAttribute,
  onRemoveFile,
  getFileIcon
}: MetadataEditorProps) {
  return (
    <div className="flex-1">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/10 rounded-xl overflow-hidden">
              {file.type === 'image' ? (
                <img
                  src={file.preview}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {getFileIcon(file.type)}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Edit Metadata</h3>
              <p className="text-white/60">
                File {fileIndex + 1} of {totalFiles}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={onRemoveFile}
            className="text-red-400 hover:text-red-300"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Remove
          </Button>
        </div>

        {/* Basic Metadata */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <Label className="text-white">Name *</Label>
            <Input
              value={file.metadata.name}
              onChange={(e) => onUpdateFile({ name: e.target.value })}
              className="bg-black/30 border-white/20 text-white"
              placeholder="Enter NFT name"
            />
          </div>
          <div>
            <Label className="text-white">Price (ETH)</Label>
            <Input
              type="number"
              step="0.001"
              value={file.metadata.price || ''}
              onChange={(e) => onUpdateFile({ price: e.target.value })}
              className="bg-black/30 border-white/20 text-white"
              placeholder="0.01"
            />
          </div>
        </div>

        <div>
          <Label className="text-white">Description</Label>
          <Textarea
            value={file.metadata.description}
            onChange={(e) => onUpdateFile({ description: e.target.value })}
            className="bg-black/30 border-white/20 text-white"
            placeholder="Describe your NFT..."
            rows={3}
          />
        </div>

        {/* Attributes */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <Label className="text-white">Attributes</Label>
            <Button
              size="sm"
              onClick={onAddAttribute}
              className="bg-[rgb(163,255,18)] text-black"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Trait
            </Button>
          </div>
          <div className="space-y-3">
            {file.metadata.attributes.map((attr, attrIndex) => (
              <div key={attrIndex} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                <Input
                  placeholder="Trait type"
                  value={attr.trait_type}
                  onChange={(e) => onUpdateAttribute(attrIndex, { trait_type: e.target.value })}
                  className="bg-black/30 border-white/20 text-white flex-1"
                />
                <Input
                  placeholder="Value"
                  value={attr.value}
                  onChange={(e) => onUpdateAttribute(attrIndex, { value: e.target.value })}
                  className="bg-black/30 border-white/20 text-white flex-1"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onRemoveAttribute(attrIndex)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Advanced Options */}
        <div className="space-y-4 p-4 bg-white/5 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-white flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Unlockable Content
              </Label>
              <p className="text-white/60 text-sm">Include content only the owner can access</p>
            </div>
            <Switch
              checked={file.metadata.unlockable || false}
              onCheckedChange={(checked) => onUpdateFile({ unlockable: checked })}
            />
          </div>

          {file.metadata.unlockable && (
            <Textarea
              value={file.metadata.unlockableContent || ''}
              onChange={(e) => onUpdateFile({ unlockableContent: e.target.value })}
              className="bg-black/30 border-white/20 text-white"
              placeholder="Enter unlockable content..."
              rows={3}
            />
          )}
        </div>
      </div>
    </div>
  );
}
