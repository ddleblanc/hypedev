"use client";

import { Button } from "@/components/ui/button";
import { Edit3, Plus, Settings } from "lucide-react";

interface StudioToolsPanelProps {
  onEdit: () => void;
  onMint: () => void;
  onSettings: () => void;
}

export function StudioToolsPanel({ onEdit, onMint, onSettings }: StudioToolsPanelProps) {
  return (
    <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
      <Button size="sm" variant="outline" className="text-white flex items-center gap-2" onClick={onEdit}>
        <Edit3 className="w-4 h-4" /> Edit
      </Button>
      <Button size="sm" className="bg-white text-black flex items-center gap-2" onClick={onMint}>
        <Plus className="w-4 h-4" /> Mint
      </Button>
      <Button size="sm" variant="ghost" className="text-white" onClick={onSettings}>
        <Settings className="w-4 h-4" />
      </Button>
    </div>
  );
}
