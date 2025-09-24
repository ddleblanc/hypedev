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

export async function uploadImageToThirdweb(file: File): Promise<string> {
  try {
    // Upload returns the IPFS URI directly in v5
    const uris = await upload({
      client,
      files: [file],
    });
    
    // upload returns an array of URIs
    const uri = Array.isArray(uris) ? uris[0] : uris;
    console.log('Uploaded to thirdweb:', uri);
    
    return uri;
  } catch (error) {
    console.error('Error uploading to thirdweb storage:', error);
    throw new Error('Failed to upload image');
  }
}

// Note: No need for manual IPFS gateway handling
// ThirdWeb v5 MediaRenderer handles IPFS URIs automatically