import { getContract, prepareContractCall, sendTransaction, readContract } from "thirdweb"
import { upload } from "thirdweb/storage"
import { client } from "./thirdweb"
import { lazyMint } from "thirdweb/extensions/erc721"
import { claimTo } from "thirdweb/extensions/erc721"
import type { Account } from "thirdweb/wallets"
import { defineChain } from "thirdweb/chains"
import { NATIVE_TOKEN_ADDRESS } from "thirdweb"

// NFT Metadata structure
export interface NFTMetadata {
  name: string
  description?: string
  image: string
  external_url?: string
  animation_url?: string
  youtube_url?: string
  background_color?: string
  attributes?: Array<{
    trait_type: string
    value: string
    display_type?: string
  }>
}

// Minting options
export interface MintOptions {
  contractAddress: string
  chainId: number
  recipient: string
  metadata: NFTMetadata
  royaltyPercentage?: number
}

// Upload file to ThirdWeb storage
export async function uploadToThirdWeb(file: File): Promise<string> {
  try {
    const uris = await upload({
      client,
      files: [file],
    })
    return Array.isArray(uris) ? uris[0] : uris
  } catch (error) {
    console.error('Upload error:', error)
    throw new Error('Failed to upload file to storage')
  }
}

// Upload metadata to ThirdWeb storage
export async function uploadMetadata(metadata: NFTMetadata): Promise<string> {
  try {
    const blob = new Blob([JSON.stringify(metadata, null, 2)], {
      type: 'application/json'
    })
    const file = new File([blob], 'metadata.json', { type: 'application/json' })
    
    const uris = await upload({
      client,
      files: [file],
    })
    return Array.isArray(uris) ? uris[0] : uris
  } catch (error) {
    console.error('Metadata upload error:', error)
    throw new Error('Failed to upload metadata')
  }
}

// Lazy mint NFT for launchpad (batch mint for later claiming)
export async function lazyMintNFT({
  contractAddress,
  chainId,
  metadata,
}: Omit<MintOptions, 'recipient'>, account: Account): Promise<{ transactionHash: string; metadataUri: string }> {
  try {
    const chain = defineChain(chainId)

    const contract = getContract({
      client,
      chain,
      address: contractAddress,
    })

    // Upload metadata
    const metadataUri = await uploadMetadata(metadata)

    // For Drop contracts, use the lazyMint extension
    // This prepares NFTs that can be claimed later
    try {
      const transaction = lazyMint({
        contract,
        nfts: [{
          name: metadata.name,
          description: metadata.description,
          image: metadata.image,
          external_url: metadata.external_url,
          animation_url: metadata.animation_url,
          attributes: metadata.attributes
        }], // Pass the full metadata object
      })

      const result = await sendTransaction({
        transaction,
        account,
      })

      console.log('Lazy mint transaction result:', result)
      return {
        transactionHash: result.transactionHash,
        metadataUri
      }
    } catch (lazyMintError: any) {
      console.error('LazyMint extension failed, trying direct contract call:', lazyMintError)

      // Fallback: Try direct contract call for lazy minting
      const transaction = prepareContractCall({
        contract,
        method: "function lazyMint(uint256 amount, string calldata baseURIForTokens, bytes calldata data)",
        params: [BigInt(1), metadataUri, "0x"]
      })

      const result = await sendTransaction({
        transaction,
        account,
      })

      return {
        transactionHash: result.transactionHash,
        metadataUri
      }
    }
  } catch (error) {
    console.error('Lazy minting error:', error)
    throw error
  }
}

// Claim NFT from lazy minted batch (for launchpad)
export async function claimNFT({
  contractAddress,
  chainId,
  recipient,
  quantity = 1,
  value // Optional: ETH value to send with transaction
}: Omit<MintOptions, 'metadata'> & { quantity?: number; value?: bigint }, account: Account): Promise<string> {
  try {
    const chain = defineChain(chainId)

    const contract = getContract({
      client,
      chain,
      address: contractAddress,
    })

    // Use thirdweb's claimTo extension
    const transaction = claimTo({
      contract,
      to: recipient,
      quantity: BigInt(quantity),
    })

    // If value is provided, add it to the transaction
    const finalTransaction = value ? { ...transaction, value } : transaction;

    const result = await sendTransaction({
      transaction: finalTransaction,
      account
    })

    console.log('Claim transaction result:', result)
    return result.transactionHash
  } catch (error) {
    console.error('Claiming error:', error)
    throw new Error('Failed to claim NFT')
  }
}

// Set up claim conditions for launchpad
export interface ClaimCondition {
  startTimestamp: Date
  maxClaimableSupply?: number
  supplyClaimed?: number
  quantityLimitPerWallet: number
  merkleRootHash?: string // For allowlist
  pricePerToken: string // In wei
  currency: string // Contract address, use native token address for ETH
  metadata?: {
    name: string
    description?: string
  }
}

export async function setupClaimConditions(
  contractAddress: string,
  chainId: number,
  claimConditions: ClaimCondition[],
  account: Account
): Promise<string> {
  try {
    console.log('Setting up claim conditions:', {
      contractAddress,
      chainId,
      claimConditions,
      account: account.address
    });

    const chain = defineChain(chainId)

    const contract = getContract({
      client,
      chain,
      address: contractAddress,
    })

    // Convert to the exact format the contract expects
    const conditions = claimConditions.map(condition => {
      // Convert Date to Unix timestamp in seconds
      const startTime = condition.startTimestamp instanceof Date
        ? Math.floor(condition.startTimestamp.getTime() / 1000)
        : typeof condition.startTimestamp === 'string'
        ? Math.floor(new Date(condition.startTimestamp).getTime() / 1000)
        : condition.startTimestamp;

      // Handle quantity limit per wallet (0 means unlimited, convert to max uint256)
      const quantityLimit = condition.quantityLimitPerWallet && condition.quantityLimitPerWallet > 0
        ? BigInt(condition.quantityLimitPerWallet)
        : BigInt("115792089237316195423570985008687907853269984665640564039457584007913129639935"); // max uint256

      // Handle max claimable supply (0 or undefined means unlimited)
      const maxSupply = condition.maxClaimableSupply && condition.maxClaimableSupply > 0
        ? BigInt(condition.maxClaimableSupply)
        : BigInt("115792089237316195423570985008687907853269984665640564039457584007913129639935"); // max uint256

      // Convert metadata to string
      const metadataString = condition.metadata
        ? JSON.stringify(condition.metadata)
        : "";

      // Create the tuple in the exact order expected by the contract
      const result = [
        BigInt(startTime), // startTimestamp
        maxSupply, // maxClaimableSupply
        BigInt(0), // supplyClaimed (always 0 for new conditions)
        quantityLimit, // quantityLimitPerWallet
        "0x0000000000000000000000000000000000000000000000000000000000000000", // merkleRoot (32 bytes)
        BigInt(condition.pricePerToken || "0"), // pricePerToken
        condition.currency || NATIVE_TOKEN_ADDRESS, // currency
        metadataString // metadata as string
      ];

      console.log('Converted condition:', {
        startTimestamp: result[0].toString(),
        maxClaimableSupply: result[1].toString(),
        supplyClaimed: result[2].toString(),
        quantityLimitPerWallet: result[3].toString(),
        merkleRoot: result[4],
        pricePerToken: result[5].toString(),
        currency: result[6],
        metadata: result[7]
      });

      return result;
    });

    // Use prepareContractCall with the exact method signature
    const transaction = prepareContractCall({
      contract,
      method: "function setClaimConditions((uint256 startTimestamp, uint256 maxClaimableSupply, uint256 supplyClaimed, uint256 quantityLimitPerWallet, bytes32 merkleRoot, uint256 pricePerToken, address currency, string metadata)[] _conditions, bool _resetClaimEligibility)",
      params: [conditions, false], // false = don't reset claim eligibility
    });

    const result = await sendTransaction({
      transaction,
      account,
    });

    console.log('Claim conditions set:', result);
    return result.transactionHash;
  } catch (error) {
    console.error('Error setting claim conditions:', error);
    throw error;
  }
}

// Alternative mint function for ERC721A or other contract types
export async function mintNFTWithQuantity({
  contractAddress,
  chainId,
  recipient,
  metadata,
  quantity = 1
}: MintOptions & { quantity?: number }, account: Account): Promise<string> {
  try {
    const chain = defineChain(chainId)
    
    const contract = getContract({
      client,
      chain,
      address: contractAddress,
    })

    const metadataUri = await uploadMetadata(metadata)

    // For contracts that support quantity minting
    const transaction = prepareContractCall({
      contract,
      method: "function mint(address to, uint256 quantity, string uri, uint256 pricePerToken) external payable",
      params: [recipient, BigInt(quantity), metadataUri, BigInt(0)], // 0 for free mint
    })

    const result = await sendTransaction({
      transaction,
      account,
    })

    return result.transactionHash
  } catch (error) {
    console.error('Batch minting error:', error)
    throw new Error('Failed to mint NFT batch')
  }
}

// Get contract information
export async function getContractInfo(contractAddress: string, chainId: number) {
  try {
    const chain = defineChain(chainId)
    
    const contract = getContract({
      client,
      chain,
      address: contractAddress,
    })

    // This would need to be implemented based on your contract's methods
    // Example for getting contract name and symbol
    // const name = await readContract({
    //   contract,
    //   method: "function name() view returns (string)",
    // })

    return {
      address: contractAddress,
      chainId,
      // name,
      // symbol,
      // ... other contract info
    }
  } catch (error) {
    console.error('Contract info error:', error)
    throw new Error('Failed to get contract information')
  }
}

// Validate Ethereum address
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

// Generate optimized metadata for different file types
export function generateOptimizedMetadata(
  baseMetadata: Partial<NFTMetadata>,
  file: File
): NFTMetadata {
  const optimized: NFTMetadata = {
    name: baseMetadata.name || 'Untitled NFT',
    description: baseMetadata.description || '',
    image: baseMetadata.image || '',
    ...baseMetadata
  }

  // Add file-specific enhancements
  if (file.type.startsWith('video/')) {
    optimized.animation_url = baseMetadata.animation_url || baseMetadata.image
  }
  
  if (file.type.startsWith('audio/')) {
    optimized.animation_url = baseMetadata.animation_url || baseMetadata.image
    if (!optimized.attributes) optimized.attributes = []
    optimized.attributes.push({
      trait_type: 'Media Type',
      value: 'Audio'
    })
  }

  // Add timestamp
  if (!optimized.attributes) optimized.attributes = []
  optimized.attributes.push({
    trait_type: 'Created',
    value: new Date().toISOString().split('T')[0]
  })

  return optimized
}

// Estimate gas for minting
export async function estimateMintGas(
  contractAddress: string,
  chainId: number,
  recipient: string,
  metadataUri: string
) {
  try {
    const chain = defineChain(chainId)
    
    const contract = getContract({
      client,
      chain,
      address: contractAddress,
    })

    // This would need to be implemented based on your specific requirements
    // return await estimateGas({
    //   contract,
    //   method: "function mintTo(address to, string uri) external",
    //   params: [recipient, metadataUri],
    // })
    
    return BigInt(0) // Placeholder
  } catch (error) {
    console.error('Gas estimation error:', error)
    return BigInt(0)
  }
}