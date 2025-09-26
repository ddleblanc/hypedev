import { createThirdwebClient } from "thirdweb";
import { upload } from "thirdweb/storage";

// Check if client ID is available
const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;

if (!clientId) {
  console.warn('ThirdWeb Client ID not found. Please set NEXT_PUBLIC_THIRDWEB_CLIENT_ID in your environment variables.');
}

// Initialize the thirdweb client
export const client = createThirdwebClient({
  clientId: clientId || 'demo-client-id', // Fallback for development
});

export async function uploadFileToThirdweb(file: File, onProgress?: (progress: number) => void): Promise<string> {
  try {
    if (onProgress) onProgress(0);

    // Upload returns the IPFS URI directly in v5
    const uris = await upload({
      client,
      files: [file],
    });

    if (onProgress) onProgress(100);

    // upload returns an array of URIs
    const uri = Array.isArray(uris) ? uris[0] : uris;
    console.log('Uploaded to thirdweb:', uri);

    return uri;
  } catch (error) {
    console.error('Error uploading to thirdweb storage:', error);
    throw new Error('Failed to upload file');
  }
}

// Legacy function name for backward compatibility
export const uploadImageToThirdweb = uploadFileToThirdweb;

// Utility to trigger file selection and upload
export function triggerFileUpload(
  onUpload: (uri: string) => void,
  onProgress?: (progress: number) => void,
  onError?: (error: string) => void,
  accept = 'image/*,video/*'
): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = accept;

  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    try {
      const uri = await uploadFileToThirdweb(file, onProgress);
      onUpload(uri);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      if (onError) {
        onError(errorMessage);
      } else {
        console.error('Upload error:', errorMessage);
      }
    }
  };

  input.click();
}

// Legacy function name for backward compatibility
export const triggerImageUpload = triggerFileUpload;

// Utility for multiple file uploads
export async function uploadMultipleFiles(files: File[], onProgress?: (fileIndex: number, progress: number) => void): Promise<string[]> {
  const uris: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      const uri = await uploadFileToThirdweb(file, (progress) => {
        if (onProgress) onProgress(i, progress);
      });
      uris.push(uri);
    } catch (error) {
      console.error(`Failed to upload file ${i + 1}:`, error);
      throw error;
    }
  }

  return uris;
}

// Legacy function name for backward compatibility
export const uploadMultipleImages = uploadMultipleFiles;

// Predefined file type constants for convenience
export const FILE_TYPES = {
  IMAGES: 'image/*',
  VIDEOS: 'video/*',
  IMAGES_AND_VIDEOS: 'image/*,video/*',
  AUDIO: 'audio/*',
  ALL_MEDIA: 'image/*,video/*,audio/*',
  DOCUMENTS: '.pdf,.doc,.docx,.txt',
  ALL: '*/*'
} as const;

// Note: No need for manual IPFS gateway handling
// ThirdWeb v5 MediaRenderer handles IPFS URIs automatically