import { getContract, prepareContractCall, sendTransaction } from "thirdweb";
import { client } from "@/lib/thirdweb";
import { defineChain } from "thirdweb/chains";
import type { Account } from "thirdweb/wallets";
import { upload } from "thirdweb/storage";

// For Drop contracts, metadata is shared across all NFTs
// Each NFT just has its token ID appended to the name

interface SharedMetadata {
  name: string; // Base name - token ID will be appended
  description: string;
  image: string;
  external_url?: string;
  animation_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
    display_type?: string;
  }>;
}

// Set shared metadata for Drop contracts
export async function setSharedMetadata({
  contractAddress,
  chainId,
  metadata,
}: {
  contractAddress: string;
  chainId: number;
  metadata: SharedMetadata;
}, account: Account): Promise<string> {
  try {
    const chain = defineChain(chainId);
    const contract = getContract({
      client,
      chain,
      address: contractAddress,
    });

    // Validate input data types
    console.log('Input metadata received:', metadata);
    console.log('Type checks:', {
      name: typeof metadata.name,
      description: typeof metadata.description,
      image: typeof metadata.image,
      animation_url: typeof metadata.animation_url
    });

    // The Drop contract expects a metadata struct with specific fields
    // function setSharedMetadata((string name, string description, string imageURI, string animationURI) _metadata)
    // Structs are passed as tuple arrays in Solidity ABI encoding
    const metadataTuple = [
      String(metadata.name),
      String(metadata.description || ""),
      String(metadata.image),
      String(metadata.animation_url || "")
    ];

    console.log('Prepared metadata tuple:', metadataTuple);

    const transaction = prepareContractCall({
      contract,
      method: "function setSharedMetadata((string name, string description, string imageURI, string animationURI) _metadata)",
      params: [metadataTuple]
    });

    const result = await sendTransaction({
      transaction,
      account,
    });

    console.log('Set shared metadata transaction:', result);
    return result.transactionHash;

  } catch (error) {
    console.error('Error setting shared metadata:', error);
    throw error;
  }
}

// Set the base URI for all tokens (alternative method)
export async function setBaseURI({
  contractAddress,
  chainId,
  baseURI,
}: {
  contractAddress: string;
  chainId: number;
  baseURI: string;
}, account: Account): Promise<string> {
  try {
    const chain = defineChain(chainId);
    const contract = getContract({
      client,
      chain,
      address: contractAddress,
    });

    // Try to set base URI directly (some contracts support this)
    const transaction = prepareContractCall({
      contract,
      method: "function setBaseURI(string memory _baseURI)",
      params: [baseURI]
    });

    const result = await sendTransaction({
      transaction,
      account,
    });

    return result.transactionHash;
  } catch (error) {
    console.error('Error setting base URI:', error);
    throw error;
  }
}

// Get the shared metadata URI from the contract
export async function getSharedMetadataURI({
  contractAddress,
  chainId,
  tokenId = 0,
}: {
  contractAddress: string;
  chainId: number;
  tokenId?: number;
}): Promise<string | null> {
  try {
    const chain = defineChain(chainId);
    const contract = getContract({
      client,
      chain,
      address: contractAddress,
    });

    // Try to get token URI for a specific token
    const transaction = prepareContractCall({
      contract,
      method: "function tokenURI(uint256 tokenId) view returns (string)",
      params: [BigInt(tokenId)]
    });

    // This would need to be a read call, not a transaction
    // For now, return null as we need to use readContract
    return null;
  } catch (error) {
    console.error('Error getting metadata URI:', error);
    return null;
  }
}

// Batch mint tokens with shared metadata for Drop contracts
export async function batchMintWithSharedMetadata({
  contractAddress,
  chainId,
  baseMetadata,
  quantity,
}: {
  contractAddress: string;
  chainId: number;
  baseMetadata: SharedMetadata;
  quantity: number;
}, account: Account): Promise<string> {
  try {
    // First upload the shared metadata
    const metadataUri = await uploadSharedMetadata(baseMetadata);

    const chain = defineChain(chainId);
    const contract = getContract({
      client,
      chain,
      address: contractAddress,
    });

    // Lazy mint a batch of NFTs with shared metadata
    const transaction = prepareContractCall({
      contract,
      method: "function lazyMint(uint256 _amount, string calldata _baseURIForTokens, bytes calldata _data)",
      params: [
        BigInt(quantity),
        metadataUri,
        "0x"
      ]
    });

    const result = await sendTransaction({
      transaction,
      account,
    });

    return result.transactionHash;
  } catch (error) {
    console.error('Batch mint error:', error);
    throw error;
  }
}

// Upload shared metadata and return the URI
async function uploadSharedMetadata(metadata: SharedMetadata): Promise<string> {
  const metadataObject = {
    name: metadata.name,
    description: metadata.description,
    image: metadata.image,
    external_url: metadata.external_url,
    animation_url: metadata.animation_url,
    attributes: metadata.attributes || [],
  };

  const blob = new Blob([JSON.stringify(metadataObject, null, 2)], {
    type: 'application/json'
  });
  const file = new File([blob], 'metadata.json', { type: 'application/json' });

  const uris = await upload({
    client,
    files: [file],
  });

  return Array.isArray(uris) ? uris[0] : uris;
}