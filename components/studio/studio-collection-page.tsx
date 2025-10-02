"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ImageIcon, Video, Music, FileText } from "lucide-react";
import { NFTFile } from "./types";
import { DragOverlay } from "./drag-overlay";
import { HeroSection } from "./hero-section";
import { CollectionStats } from "./collection-stats";
import { TabNavigation } from "./tab-navigation";
import { UploadEmptyState } from "./upload-empty-state";
import { FileListMobile } from "./file-list-mobile";
import { FileGridDesktop } from "./file-grid-desktop";
import { MetadataEditor } from "./metadata-editor";
import {
  AboutTab,
  ItemsTab,
  OffersTab,
  HoldersTab,
  TraitsTab,
  ActivityTab
} from "./tab-contents";
import { SettingsTab } from "./settings-tab";
import { UploadBottomBar } from "./upload-bottom-bar";
import { MintNFTsModal } from "./mint-nfts-modal";

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
  const [showMintModal, setShowMintModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Check if contract is OpenEdition
  const isOpenEditionContract = () => {
    const contractType = collection.contractType || '';
    return ['OpenEdition', 'OpenEditionERC721'].includes(contractType);
  };

  // Studio management actions
  const handleEdit = () => alert('Open collection editor (studio)');
  const handleMint = () => {
    if (isOpenEditionContract()) {
      alert('OpenEdition contracts use shared metadata. Individual NFT minting is not supported.\n\nUsers can claim copies of the NFT using the claim flow.');
      return;
    }
    setShowMintModal(true);
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

      <DragOverlay dragActive={dragActive} />
      <div className="relative">
        <HeroSection
          collection={collection}
          onEdit={handleEdit}
          onMint={handleMint}
          onSettings={handleSettings}
          onPreview={() => {}}
        />

        {/* Content area */}
        <div className="bg-black/80 backdrop-blur-sm border-t border-white/10 px-4 md:px-6 py-6">
          <CollectionStats
            itemsCount={collection.nfts ? collection.nfts.length : 0}
            ownersCount={collection.stats?.owners ?? '—'}
            floorPrice={collection.stats?.floorPrice ?? '—'}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />

          <TabNavigation
            activeTab={activeTab}
            showUploadInterface={showUploadInterface}
            uploadFilesCount={uploadFiles.length}
            onTabChange={setActiveTab}
          />

          {/* Tab content (simplified, same structure as public page) */}
          <div>
            {activeTab === 'upload' && (
              <div className="space-y-6">
                {uploadFiles.length === 0 ? (
                  <UploadEmptyState onChooseFiles={() => fileInputRef.current?.click()} />
                ) : (
                  <div className="space-y-6">
                    <FileListMobile
                      uploadFiles={uploadFiles}
                      onAddMore={() => fileInputRef.current?.click()}
                      onUpdateFile={updateFileMetadata}
                      onSelectFile={setSelectedFileIndex}
                      onRemoveFile={removeFile}
                      getFileIcon={getFileIcon}
                    />

                    <div className="hidden md:flex gap-6">
                      <FileGridDesktop
                        uploadFiles={uploadFiles}
                        selectedFileIndex={selectedFileIndex}
                        onAddMore={() => fileInputRef.current?.click()}
                        onSelectFile={setSelectedFileIndex}
                        getFileIcon={getFileIcon}
                      />

                      {uploadFiles[selectedFileIndex] && (
                        <MetadataEditor
                          file={uploadFiles[selectedFileIndex]}
                          fileIndex={selectedFileIndex}
                          totalFiles={uploadFiles.length}
                          onUpdateFile={(updates) => updateFileMetadata(selectedFileIndex, updates)}
                          onUpdateAttribute={(attrIndex, updates) => updateAttribute(selectedFileIndex, attrIndex, updates)}
                          onAddAttribute={() => addAttribute(selectedFileIndex)}
                          onRemoveAttribute={(attrIndex) => removeAttribute(selectedFileIndex, attrIndex)}
                          onRemoveFile={() => removeFile(selectedFileIndex)}
                          getFileIcon={getFileIcon}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'about' && (
              <AboutTab
                collection={collection}
                onEdit={handleEdit}
                onAirdrop={handleAirdrop}
                onMint={handleMint}
              />
            )}

            {activeTab === 'items' && (
              <ItemsTab
                collection={collection}
                viewMode={viewMode}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onAddNFTs={() => setShowMintModal(true)}
              />
            )}

            {activeTab === 'offers' && <OffersTab />}

            {activeTab === 'holders' && <HoldersTab collection={collection} />}

            {activeTab === 'traits' && <TraitsTab collection={collection} />}

            {activeTab === 'activity' && <ActivityTab />}

            {activeTab === 'settings' && <SettingsTab collection={collection} />}
          </div>
        </div>

        {showUploadInterface && uploadFiles.length > 0 && (
          <UploadBottomBar
            uploadFilesCount={uploadFiles.length}
            isUploading={isUploading}
            onCancel={() => {
              setUploadFiles([]);
              setShowUploadInterface(false);
              setActiveTab('items');
            }}
            onMint={handleMintNFTs}
          />
        )}

        {/* Mint NFTs Modal */}
        <MintNFTsModal
          isOpen={showMintModal}
          onClose={() => setShowMintModal(false)}
          collection={collection}
          onSuccess={() => {
            setShowMintModal(false);
            // Optionally refresh the collection data
            window.location.reload();
          }}
        />
      </div>
    </motion.div>
  );
}
