"use client";

import { motion } from "framer-motion";
import { Image, Sparkles, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MediaRenderer } from "@/components/MediaRenderer";

interface CollectionStepProps {
  collectionData: {
    name: string;
    symbol: string;
    description: string;
    image: string;
    bannerImage: string;
    category: string;
  };
  setCollectionData: (data: any) => void;
  uploadingField: string | null;
  handleImageUpload: (fieldType: 'image' | 'bannerImage') => void;
  categories: string[];
  isMobile: boolean;
}

export function CollectionStep({
  collectionData,
  setCollectionData,
  uploadingField,
  handleImageUpload,
  categories,
  isMobile
}: CollectionStepProps) {
  const stepVariants = {
    initial: { opacity: 0, x: isMobile ? 20 : 0, y: isMobile ? 0 : 20 },
    animate: { opacity: 1, x: 0, y: 0 },
    exit: { opacity: 0, x: isMobile ? -20 : 0, y: isMobile ? 0 : -20 }
  };

  const ImageUploadCard = ({
    type,
    label,
    dimensions
  }: {
    type: 'image' | 'bannerImage';
    label: string;
    dimensions: string;
  }) => (
    <div>
      <Label className="text-white mb-2 block">{label}</Label>
      <div
        className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-white/40 transition-colors cursor-pointer"
        onClick={() => handleImageUpload(type)}
      >
        {uploadingField === type ? (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[rgb(163,255,18)] mx-auto mb-2"></div>
        ) : collectionData[type] ? (
          <div className="space-y-2">
            <div className={`mx-auto mb-2 rounded-lg overflow-hidden ${
              type === 'image' ? 'w-16 h-16' : 'w-20 h-12'
            } ${isMobile && type === 'image' ? 'w-16 h-16' : ''}`}>
              <MediaRenderer src={collectionData[type]} className="w-full h-full object-cover" />
            </div>
            <p className="text-xs text-[rgb(163,255,18)]">Click to change</p>
          </div>
        ) : (
          <>
            <Image className="w-8 h-8 mx-auto mb-2 text-white/40" />
            <p className="text-sm text-white/60">Click to upload{!isMobile && ' or drag and drop'}</p>
            <p className="text-xs text-white/40 mt-1">
              {isMobile ? 'PNG, JPG, GIF, MP4 up to 10MB' : dimensions}
            </p>
          </>
        )}
      </div>
    </div>
  );

  const PreviewCard = () => (
    <Card className="bg-gradient-to-br from-purple-900/20 to-[rgb(163,255,18)]/10 border-white/20">
      <CardHeader>
        <CardTitle className="text-white text-lg">Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-black/40 rounded-lg p-4 border border-white/10">
          <div className="w-full aspect-square bg-white/5 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
            {collectionData.image ? (
              <MediaRenderer src={collectionData.image} className="w-full h-full object-cover" />
            ) : (
              <Image className="w-16 h-16 text-white/20" />
            )}
          </div>
          <h3 className="text-white font-bold text-lg mb-1">
            {collectionData.name || 'Collection Name'}
          </h3>
          <p className="text-white/60 text-sm mb-3">
            {collectionData.symbol || 'SYMBOL'}
          </p>
          <p className="text-white/80 text-sm">
            {collectionData.description || 'Your collection description will appear here...'}
          </p>
        </div>
      </CardContent>
    </Card>
  );

  const TipsCard = () => (
    <Card className="bg-black/40 border-white/20">
      <CardHeader>
        <CardTitle className="text-white text-lg">Quick Tips</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Sparkles className="w-4 h-4 text-[rgb(163,255,18)] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-white font-semibold">Choose a memorable name</p>
            <p className="text-xs text-white/60">It will be displayed everywhere</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Zap className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-white font-semibold">Keep symbol short</p>
            <p className="text-xs text-white/60">3-5 characters works best</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isMobile) {
    return (
      <motion.div
        variants={stepVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        <h3 className="text-xl font-bold text-white mb-4">Collection Details</h3>

        <Card className="bg-black/40 border-white/20">
          <CardContent className="space-y-4 pt-6">
            <div>
              <Label htmlFor="collection-name" className="text-white">Collection Name *</Label>
              <Input
                id="collection-name"
                value={collectionData.name}
                onChange={(e) => setCollectionData({...collectionData, name: e.target.value})}
                placeholder="My NFT Collection"
                className="bg-black/40 border-white/20 text-white placeholder:text-white/40"
              />
            </div>

            <div>
              <Label htmlFor="collection-symbol" className="text-white">Symbol *</Label>
              <Input
                id="collection-symbol"
                value={collectionData.symbol}
                onChange={(e) => setCollectionData({...collectionData, symbol: e.target.value.toUpperCase()})}
                placeholder="NFT"
                className="bg-black/40 border-white/20 text-white placeholder:text-white/40"
                maxLength={10}
              />
            </div>

            <div>
              <Label htmlFor="collection-description" className="text-white">Description</Label>
              <Textarea
                id="collection-description"
                value={collectionData.description}
                onChange={(e) => setCollectionData({...collectionData, description: e.target.value})}
                placeholder="Describe your collection..."
                className="bg-black/40 border-white/20 text-white placeholder:text-white/40"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="collection-category" className="text-white">Category</Label>
              <Select value={collectionData.category} onValueChange={(value) => setCollectionData({...collectionData, category: value})}>
                <SelectTrigger className="bg-black/40 border-white/20 text-white">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="bg-black/90 border-white/20">
                  {categories.map((category) => (
                    <SelectItem key={category} value={category} className="text-white hover:bg-white/10">
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ImageUploadCard type="image" label="Upload Collection Image" dimensions="400x400 recommended" />
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={stepVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Collection Details</h2>
        <p className="text-white/60">Define your NFT collection properties</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Card className="bg-black/40 border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="collection-name" className="text-white mb-2 block">Collection Name *</Label>
                  <Input
                    id="collection-name"
                    value={collectionData.name}
                    onChange={(e) => setCollectionData({...collectionData, name: e.target.value})}
                    placeholder="My NFT Collection"
                    className="bg-black/40 border-white/20 text-white placeholder:text-white/40"
                  />
                </div>
                <div>
                  <Label htmlFor="collection-symbol" className="text-white mb-2 block">Symbol *</Label>
                  <Input
                    id="collection-symbol"
                    value={collectionData.symbol}
                    onChange={(e) => setCollectionData({...collectionData, symbol: e.target.value.toUpperCase()})}
                    placeholder="NFT"
                    className="bg-black/40 border-white/20 text-white placeholder:text-white/40"
                    maxLength={10}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="collection-description" className="text-white mb-2 block">Description</Label>
                <Textarea
                  id="collection-description"
                  value={collectionData.description}
                  onChange={(e) => setCollectionData({...collectionData, description: e.target.value})}
                  placeholder="Tell the story of your collection..."
                  className="bg-black/40 border-white/20 text-white placeholder:text-white/40"
                  rows={5}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="collection-category" className="text-white mb-2 block">Category</Label>
                  <Select value={collectionData.category} onValueChange={(value) => setCollectionData({...collectionData, category: value})}>
                    <SelectTrigger className="bg-black/40 border-white/20 text-white">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-black/90 border-white/20">
                      {categories.map((category) => (
                        <SelectItem key={category} value={category} className="text-white hover:bg-white/10">
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-white mb-2 block">Tags</Label>
                  <Input
                    placeholder="art, digital, collectible"
                    className="bg-black/40 border-white/20 text-white placeholder:text-white/40"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Media</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <ImageUploadCard type="image" label="Collection Image" dimensions="400x400 recommended" />
                <ImageUploadCard type="bannerImage" label="Banner Image" dimensions="1400x350 recommended" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <PreviewCard />
          <TipsCard />
        </div>
      </div>
    </motion.div>
  );
}