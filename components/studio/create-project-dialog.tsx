"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Upload, ImageIcon, Sparkles, Folder, Loader2 } from "lucide-react";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (project: any) => void;
}

const GENRES = [
  "Fantasy RPG",
  "Sci-Fi Adventure", 
  "Medieval Fantasy",
  "Cyberpunk",
  "Post-Apocalyptic",
  "Steampunk",
  "Horror",
  "Abstract Art",
  "Pixel Art",
  "Photography",
  "Music & Audio",
  "Sports",
  "Gaming",
  "Collectibles",
  "Utility",
  "Other"
];

const CONCEPTS = [
  "Game Universe",
  "Shared Lore",
  "Character Collection",
  "World Building",
  "Story Driven",
  "Community Driven",
  "Utility Focused",
  "Art Collection",
  "PFP Project",
  "Metaverse Assets",
  "Trading Cards",
  "Music Albums",
  "Photography Series",
  "Digital Fashion",
  "Other"
];

export function CreateProjectDialog({ open, onOpenChange, onSuccess }: CreateProjectDialogProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    banner: "",
    genre: "",
    concept: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.walletAddress) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/studio/projects?address=${user.walletAddress}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        onSuccess?.(data.project);
        onOpenChange(false);
        setFormData({
          name: "",
          description: "",
          banner: "",
          genre: "",
          concept: "",
        });
      } else {
        const errorData = await response.json();
        console.error('Error creating project:', errorData.error);
      }
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-8 h-8 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-lg flex items-center justify-center">
              <Folder className="w-4 h-4 text-primary" />
            </div>
            Create New Project
          </DialogTitle>
          <DialogDescription>
            Projects help you organize your NFT collections and maintain a cohesive brand. 
            Think of them as your creative universes.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Project Name *
              </Label>
              <Input
                id="name"
                placeholder="Enter your project name..."
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description *
              </Label>
              <Textarea
                id="description"
                placeholder="Describe your project vision, story, and what makes it unique..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                required
                rows={4}
                className="resize-none"
              />
            </div>
          </div>

          <Separator />

          {/* Project Banner */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Project Banner</Label>
            </div>
            
            <div className="border-2 border-dashed border-border rounded-lg p-6">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-muted rounded-lg mx-auto flex items-center justify-center">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Upload project banner</p>
                  <p className="text-xs text-muted-foreground">
                    Recommended: 1200x400px, max 5MB
                  </p>
                </div>
                <Input
                  placeholder="Or paste image URL..."
                  value={formData.banner}
                  onChange={(e) => handleInputChange('banner', e.target.value)}
                  className="max-w-md mx-auto"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Classification */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Project Classification</Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="genre" className="text-sm">Genre</Label>
                <Select value={formData.genre} onValueChange={(value) => handleInputChange('genre', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select genre..." />
                  </SelectTrigger>
                  <SelectContent>
                    {GENRES.map((genre) => (
                      <SelectItem key={genre} value={genre}>
                        {genre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="concept" className="text-sm">Concept</Label>
                <Select value={formData.concept} onValueChange={(value) => handleInputChange('concept', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select concept..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CONCEPTS.map((concept) => (
                      <SelectItem key={concept} value={concept}>
                        {concept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Selected tags preview */}
            <div className="flex flex-wrap gap-2">
              {formData.genre && (
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/30">
                  {formData.genre}
                </Badge>
              )}
              {formData.concept && (
                <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/30">
                  {formData.concept}
                </Badge>
              )}
            </div>
          </div>

          <DialogFooter className="gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.name || !formData.description}
              className="gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}