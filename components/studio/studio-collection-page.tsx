"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  Play,
  Edit3,
  Plus,
  Settings,
  Zap,
  Upload,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  Trash2,
  Check,
  AlertCircle,
  Sparkles,
  Tag,
  DollarSign,
  Eye,
  Info,
  Grid3x3,
  List,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { MediaRenderer } from "@/components/MediaRenderer";

interface StudioCollectionPageProps {
  slug: string;
}

interface NFTFile {
  id: string;
  file: File;
  preview: string;
  type: 'image' | 'video' | 'audio' | 'model';
  metadata: {
    name: string;
    description: string;
    attributes: Array<{ trait_type: string; value: string; }>;
    price?: string;
    royalty?: number;
    unlockable?: boolean;
    unlockableContent?: string;
  };
  status: 'ready' | 'uploading' | 'success' | 'error';
  error?: string;
}

// This is a Studio-specific copy of CollectionDetailPage. It intentionally
// duplicates layout so the studio can diverge (management tools, drafts, edit flows).
// Start with the same visual structure (full-bleed hero + content) and add a
// Studio Tools panel on the hero so collection managers can act without leaving Studio.

export function StudioCollectionPage({ collection }: { collection: any }) {
  const [activeTab, setActiveTab] = useState('items');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadFiles, setUploadFiles] = useState<NFTFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadInterface, setShowUploadInterface] = useState(false);

  const heroRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.06]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const getFileType = (file: File): 'image' | 'video' | 'audio' | 'model' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type.includes('model') || file.name.endsWith('.glb') || file.name.endsWith('.gltf')) return 'model';
    return 'image';
  };

  const createPreview = useCallback((file: File): Promise<string> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        const url = URL.createObjectURL(file);
        resolve(url);
      } else {
        resolve('/api/placeholder/200/200');
      }
    });
  }, []);

  const processFiles = useCallback(async (fileList: FileList | File[]) => {
    const newFiles: NFTFile[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const preview = await createPreview(file);
      const fileType = getFileType(file);

      const nftFile: NFTFile = {
        id: `${Date.now()}-${i}`,
        file,
        preview,
        type: fileType,
        metadata: {
          name: file.name.replace(/\.[^/.]+$/, ""),
          description: '',
          attributes: [],
        },
        status: 'ready'
      };

      newFiles.push(nftFile);
    }

    setUploadFiles(prev => [...prev, ...newFiles]);
    if (newFiles.length > 0) {
      setShowUploadInterface(true);
      setActiveTab('upload');
    }
  }, [createPreview]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  }, [processFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  }, [processFiles]);

  useEffect(() => {
    setActiveTab('items');
    setViewMode('grid');
    setSearchQuery('');
    console.log(collection)
  }, [collection?.id]);



  const updateFileMetadata = (index: number, updates: Partial<NFTFile['metadata']>) => {
    setUploadFiles(prev => prev.map((file, i) =>
      i === index
        ? { ...file, metadata: { ...file.metadata, ...updates } }
        : file
    ));
  };

  const addAttribute = (fileIndex: number) => {
    updateFileMetadata(fileIndex, {
      attributes: [...uploadFiles[fileIndex].metadata.attributes, { trait_type: '', value: '' }]
    });
  };

  const updateAttribute = (fileIndex: number, attrIndex: number, updates: Partial<NFTFile['metadata']['attributes'][0]>) => {
    const newAttributes = [...uploadFiles[fileIndex].metadata.attributes];
    newAttributes[attrIndex] = { ...newAttributes[attrIndex], ...updates };
    updateFileMetadata(fileIndex, { attributes: newAttributes });
  };

  const removeAttribute = (fileIndex: number, attrIndex: number) => {
    const newAttributes = uploadFiles[fileIndex].metadata.attributes.filter((_, i) => i !== attrIndex);
    updateFileMetadata(fileIndex, { attributes: newAttributes });
  };

  const removeFile = (index: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
    if (selectedFileIndex >= uploadFiles.length - 1) {
      setSelectedFileIndex(Math.max(0, uploadFiles.length - 2));
    }
  };

  const getFileIcon = (type: NFTFile['type']) => {
    switch (type) {
      case 'image': return <ImageIcon className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'audio': return <Music className="w-4 h-4" />;
      case 'model': return <FileText className="w-4 h-4" />;
      default: return <ImageIcon className="w-4 h-4" />;
    }
  };

  const handleMintNFTs = async () => {
    setIsUploading(true);

    try {
      for (let i = 0; i < uploadFiles.length; i++) {
        setUploadFiles(prev => prev.map((file, index) =>
          index === i ? { ...file, status: 'uploading' } : file
        ));

        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

        setUploadFiles(prev => prev.map((file, index) =>
          index === i ? { ...file, status: 'success' } : file
        ));
      }

      setTimeout(() => {
        setUploadFiles([]);
        setShowUploadInterface(false);
        setActiveTab('items');
      }, 1000);

    } catch (error) {
      setUploadFiles(prev => prev.map(file => ({ ...file, status: 'error', error: 'Failed to mint' })));
    } finally {
      setIsUploading(false);
    }
  };

  // Studio management actions
  const handleEdit = () => alert('Open collection editor (studio)');
  const handleMint = () => {
    setShowUploadInterface(true);
    setActiveTab('upload');
  };
  const handleSettings = () => alert('Open collection settings');
  const handleAirdrop = () => alert('Trigger airdrop tool');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45 }}
      className="w-full min-h-screen bg-black"
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
      onDragLeave={() => setDragActive(false)}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*,.glb,.gltf"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Drag overlay */}
      <AnimatePresence>
        {dragActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[rgb(163,255,18)]/20 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <div className="text-center">
              <div className="w-20 h-20 mx-auto bg-[rgb(163,255,18)] rounded-full flex items-center justify-center mb-4">
                <Upload className="w-10 h-10 text-black" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Drop files to upload</h3>
              <p className="text-white/60">Release to add NFTs to your collection</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="relative">
        {/* Hero Section - full-bleed like marketplace */}
        <motion.div
          ref={heroRef}
          className="relative h-[50vh] overflow-hidden"
          style={{ scale: heroScale }}
        >
          <div className="absolute inset-0">
            <MediaRenderer
              src={collection.bannerImage || collection.videoUrl}
              alt={collection.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent" />
          </div>

          {/* Studio Tools panel (top-right within hero) */}
          <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
            <Button size="sm" variant="outline" className="text-white flex items-center gap-2" onClick={handleEdit}>
              <Edit3 className="w-4 h-4" /> Edit
            </Button>
            <Button size="sm" className="bg-white text-black flex items-center gap-2" onClick={handleMint}>
              <Plus className="w-4 h-4" /> Mint
            </Button>
            <Button size="sm" variant="ghost" className="text-white" onClick={handleSettings}>
              <Settings className="w-4 h-4" />
            </Button>
          </div>

          {/* Close controls and play/mute in hero bottom-left */}
          <motion.div style={{ opacity: heroOpacity }} className="absolute bottom-4 left-4 right-4 p-2 md:p-6 z-20">
            <div className="max-w-4xl">
              <div className="flex items-center gap-4 mb-3">
                {collection.logo && <MediaRenderer src={collection.logo} alt={collection.title} className="h-12 w-auto rounded-md" />}
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white">{collection.title}</h2>
                  {collection.subtitle && <p className="text-white/70 text-sm">{collection.subtitle}</p>}
                </div>
              </div>
              {collection.description && (
                <p className="text-white/80 text-sm md:text-base leading-relaxed">{collection.longDescription || collection.description}</p>
              )}
              <div className="flex items-center gap-3 mt-4">
                <Button className="bg-white text-black font-bold" onClick={() => {}}>
                  <Play className="w-4 h-4 mr-2" /> Preview
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Content area */}
        <div className="bg-black/80 backdrop-blur-sm border-t border-white/10 px-4 md:px-6 py-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="text-white/70">{collection.nfts ? collection.nfts.length : 0} items</div>
              <div className="text-white/70">{collection.stats?.owners ?? '—'} owners</div>
              <div className="text-white/70">Floor: {collection.stats?.floorPrice ?? '—'}</div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="icon" onClick={() => setViewMode('grid')}>
                <svg className="w-4 h-4" />
              </Button>
              <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="icon" onClick={() => setViewMode('list')}>
                <svg className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-3 mb-6 overflow-x-auto">
            {(showUploadInterface
              ? ['upload', 'about', 'items', 'offers', 'holders', 'traits', 'activity']
              : ['about', 'items', 'offers', 'holders', 'traits', 'activity']
            ).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-[rgb(163,255,18)]/20 text-[rgb(163,255,18)]'
                    : 'text-white/70 hover:bg-white/6'
                }`}
              >
                {tab === 'upload' ? (
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Add NFTs
                    {uploadFiles.length > 0 && (
                      <Badge className="bg-[rgb(163,255,18)] text-black text-xs">
                        {uploadFiles.length}
                      </Badge>
                    )}
                  </div>
                ) : (
                  tab.charAt(0).toUpperCase() + tab.slice(1)
                )}
              </button>
            ))}
          </div>

          {/* Tab content (simplified, same structure as public page) */}
          <div>
            {activeTab === 'upload' && (
              <div className="space-y-6">
                {uploadFiles.length === 0 ? (
                  /* Upload Area */
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
                          onClick={() => fileInputRef.current?.click()}
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
                      className="border-2 border-dashed border-white/20 rounded-2xl p-8 md:p-12 text-center hover:border-[rgb(163,255,18)]/50 transition-all"
                      onClick={() => fileInputRef.current?.click()}
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
                ) : (
                  /* File Management Interface */
                  <div className="space-y-6">
                    {/* Mobile: File List View */}
                    <div className="block md:hidden space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white">
                          {uploadFiles.length} NFT{uploadFiles.length !== 1 ? 's' : ''} Ready
                        </h3>
                        <Button
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
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
                                  onChange={(e) => updateFileMetadata(index, { name: e.target.value })}
                                  className="bg-black/30 border-white/20 text-white mb-2"
                                  placeholder="NFT Name"
                                />
                                <Textarea
                                  value={file.metadata.description}
                                  onChange={(e) => updateFileMetadata(index, { description: e.target.value })}
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
                                  onClick={() => setSelectedFileIndex(index)}
                                  className="border-white/20 text-white hover:bg-white/10"
                                >
                                  <Edit3 className="w-4 h-4 mr-2" />
                                  Edit Details
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeFile(index)}
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

                    {/* Desktop: Grid + Detail View */}
                    <div className="hidden md:flex gap-6">
                      {/* File Grid */}
                      <div className="w-1/3">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-white">Files</h3>
                          <Button
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-[rgb(163,255,18)] text-black"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {uploadFiles.map((file, index) => (
                            <button
                              key={file.id}
                              onClick={() => setSelectedFileIndex(index)}
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

                      {/* Metadata Editor */}
                      <div className="flex-1">
                        {uploadFiles[selectedFileIndex] && (
                          <div className="space-y-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-white/10 rounded-xl overflow-hidden">
                                  {uploadFiles[selectedFileIndex].type === 'image' ? (
                                    <img
                                      src={uploadFiles[selectedFileIndex].preview}
                                      alt=""
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      {getFileIcon(uploadFiles[selectedFileIndex].type)}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <h3 className="text-xl font-bold text-white">Edit Metadata</h3>
                                  <p className="text-white/60">
                                    File {selectedFileIndex + 1} of {uploadFiles.length}
                                  </p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeFile(selectedFileIndex)}
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
                                  value={uploadFiles[selectedFileIndex].metadata.name}
                                  onChange={(e) => updateFileMetadata(selectedFileIndex, { name: e.target.value })}
                                  className="bg-black/30 border-white/20 text-white"
                                  placeholder="Enter NFT name"
                                />
                              </div>
                              <div>
                                <Label className="text-white">Price (ETH)</Label>
                                <Input
                                  type="number"
                                  step="0.001"
                                  value={uploadFiles[selectedFileIndex].metadata.price || ''}
                                  onChange={(e) => updateFileMetadata(selectedFileIndex, { price: e.target.value })}
                                  className="bg-black/30 border-white/20 text-white"
                                  placeholder="0.01"
                                />
                              </div>
                            </div>

                            <div>
                              <Label className="text-white">Description</Label>
                              <Textarea
                                value={uploadFiles[selectedFileIndex].metadata.description}
                                onChange={(e) => updateFileMetadata(selectedFileIndex, { description: e.target.value })}
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
                                  onClick={() => addAttribute(selectedFileIndex)}
                                  className="bg-[rgb(163,255,18)] text-black"
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  Add Trait
                                </Button>
                              </div>
                              <div className="space-y-3">
                                {uploadFiles[selectedFileIndex].metadata.attributes.map((attr, attrIndex) => (
                                  <div key={attrIndex} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                                    <Input
                                      placeholder="Trait type"
                                      value={attr.trait_type}
                                      onChange={(e) => updateAttribute(selectedFileIndex, attrIndex, { trait_type: e.target.value })}
                                      className="bg-black/30 border-white/20 text-white flex-1"
                                    />
                                    <Input
                                      placeholder="Value"
                                      value={attr.value}
                                      onChange={(e) => updateAttribute(selectedFileIndex, attrIndex, { value: e.target.value })}
                                      className="bg-black/30 border-white/20 text-white flex-1"
                                    />
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => removeAttribute(selectedFileIndex, attrIndex)}
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
                                  checked={uploadFiles[selectedFileIndex].metadata.unlockable || false}
                                  onCheckedChange={(checked) => updateFileMetadata(selectedFileIndex, { unlockable: checked })}
                                />
                              </div>

                              {uploadFiles[selectedFileIndex].metadata.unlockable && (
                                <Textarea
                                  value={uploadFiles[selectedFileIndex].metadata.unlockableContent || ''}
                                  onChange={(e) => updateFileMetadata(selectedFileIndex, { unlockableContent: e.target.value })}
                                  className="bg-black/30 border-white/20 text-white"
                                  placeholder="Enter unlockable content..."
                                  rows={3}
                                />
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                )}
              </div>
            )}

            {activeTab === 'about' && (
              <div className="space-y-4 text-white/80">
                <h3 className="text-lg font-bold text-white">About</h3>
                <p>{collection.longDescription || collection.description}</p>
                {/* Studio-only quick actions */}
                <div className="mt-4 flex items-center gap-3">
                  <Button size="sm" onClick={handleEdit} className="bg-white text-black">Edit Metadata</Button>
                  <Button size="sm" onClick={handleAirdrop} variant="outline">Airdrop</Button>
                  <Button size="sm" onClick={handleMint} className="bg-[rgb(163,255,18)] text-black">Quick Mint</Button>
                </div>
              </div>
            )}

            {activeTab === 'items' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-white/70">Showing {collection.nfts?.length ?? 0} items</div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Input placeholder="Search items..." value={searchQuery} onChange={(e:any)=>setSearchQuery(e.target.value)} className="pl-3 pr-3 py-2 bg-black/30 border-white/10 text-white" />
                    </div>
                  </div>
                </div>

                <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'}`}>
                  {collection.nfts?.map((item:any, idx:number) => (
                    <div key={item.id || idx} className="bg-black/40 rounded-xl overflow-hidden border border-white/10 p-3">
                      <div className="aspect-square mb-3 bg-gray-800">
                        <MediaRenderer src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-white font-semibold text-sm">{item.name}</h4>
                          <p className="text-white/60 text-xs">{item.lastSale ?? ''}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-[rgb(163,255,18)] font-bold">{item.price ?? '—'}</div>
                          <Button size="sm" className="bg-white text-black mt-2">Manage</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'offers' && (
              <div className="text-center py-12 text-white/70">No offers yet</div>
            )}

            {activeTab === 'holders' && (
              <div className="grid gap-3">
                {(collection.nfts || []).slice(0,10).map((item:any, i:number)=> (
                  <div key={item.id ?? i} className="flex items-center justify-between p-3 bg-black/40 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full" />
                      <div>
                        <p className="text-white font-medium">Holder #{i + 1}</p>
                        <p className="text-white/60 text-sm">{item.ownerAddress ? (item.ownerAddress.slice(0,6) + '...' + item.ownerAddress.slice(-4)) : '0x----...----'}</p>
                      </div>
                    </div>
                    <div className="text-white font-bold">{Math.floor(Math.random()*50)+1} items</div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'traits' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(collection.traits || []).map((trait:any) => (
                  <div key={trait.name} className="bg-black/40 rounded-xl p-4">
                    <h4 className="text-white font-bold mb-2">{trait.name}</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/80">Rarity</span>
                        <span className="text-white">{trait.rarity}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/80">Percentage</span>
                        <span className="text-[rgb(163,255,18)]">{trait.percentage}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-3">
                {[...Array(6)].map((_, i)=> (
                  <div key={i} className="flex items-center justify-between p-3 bg-black/40 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg" />
                      <div>
                        <p className="text-white font-medium">Activity #{i+1}</p>
                        <p className="text-white/60 text-sm">Some action</p>
                      </div>
                    </div>
                    <div className="text-white">{(Math.random()*5+0.1).toFixed(2)} ETH</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sticky Bottom Bar for Upload Tab */}
        {showUploadInterface && uploadFiles.length > 0 && (
          <div className="fixed bottom-16 left-0 right-0 md:left-80 md:right-0 bg-black/95 backdrop-blur-lg border-t border-white/10 z-30">
            <div className="px-4 md:px-8 py-4 md:py-6">
              <div className="flex flex-col md:flex-row gap-4 md:gap-0 md:justify-between md:items-center">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setUploadFiles([]);
                      setShowUploadInterface(false);
                      setActiveTab('items');
                    }}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                  <div className="text-white/60 text-sm">
                    {uploadFiles.length} NFT{uploadFiles.length !== 1 ? 's' : ''} ready to mint
                  </div>
                </div>

                <Button
                  onClick={handleMintNFTs}
                  disabled={isUploading || uploadFiles.length === 0}
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
                      Mint {uploadFiles.length} NFT{uploadFiles.length !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
