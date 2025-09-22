import { getContract, prepareContractCall, sendTransaction, readContract } from "thirdweb"
import { upload } from "thirdweb/storage"
import { client } from "./thirdweb"
import { lazyMint } from "thirdweb/extensions/erc721"
import { claimTo } from "thirdweb/extensions/erc721"
import { setClaimConditions } from "thirdweb/extensions/erc721"
import type { Account } from "thirdweb/wallets"
import { defineChain } from "thirdweb/chains"

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

    // Use thirdweb's lazyMint extension for creating claimable NFTs
    const transaction = lazyMint({
      contract,
      nfts: [metadataUri], // Array of metadata URIs
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
  } catch (error) {
    console.error('Lazy minting error:', error)
    throw new Error('Failed to lazy mint NFT')
  }
}

// Claim NFT from lazy minted batch (for launchpad)
export async function claimNFT({
  contractAddress,
  chainId,
  recipient,
  quantity = 1
}: Omit<MintOptions, 'metadata'> & { quantity?: number }, account: Account): Promise<string> {
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

    const result = await sendTransaction({
      transaction,
      account,
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
    const chain = defineChain(chainId)
    
    const contract = getContract({
      client,
      chain,
      address: contractAddress,
    })

    // Convert to thirdweb format
    const conditions = claimConditions.map(condition => ({
      startTimestamp: condition.startTimestamp,
      maxClaimableSupply: condition.maxClaimableSupply ? BigInt(condition.maxClaimableSupply) : undefined,
      supplyClaimed: condition.supplyClaimed ? BigInt(condition.supplyClaimed) : BigInt(0),
      quantityLimitPerWallet: BigInt(condition.quantityLimitPerWallet),
      merkleRootHash: condition.merkleRootHash || "0x0000000000000000000000000000000000000000000000000000000000000000",
      pricePerToken: BigInt(condition.pricePerToken),
      currency: condition.currency,
      metadata: condition.metadata,
    }))

    const transaction = setClaimConditions({
      contract,
      phases: conditions,
      resetClaimEligibility: false,
    })

    const result = await sendTransaction({
      transaction,
      account,
    })

    console.log('Claim conditions set:', result)
    return result.transactionHash
  } catch (error) {
    console.error('Error setting claim conditions:', error)
    throw new Error('Failed to set claim conditions')
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