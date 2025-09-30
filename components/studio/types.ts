export interface NFTFile {
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

export interface StudioCollectionPageProps {
  slug: string;
}
