import { client } from "@/lib/thirdweb";
import { defineChain, sepolia, polygon, ethereum, arbitrum } from "thirdweb/chains";
import { deployERC721Contract } from "thirdweb/deploys";

interface ProjectData {
  name: string;
  description: string;
  genre: string;
  concept: string;
  banner: string;
}

interface CollectionData {
  name: string;
  symbol: string;
  description: string;
  image: string;
  bannerImage: string;
  maxSupply: string;
  royaltyPercentage: string;
  contractType: string;
  chainId: string;
  category: string;
  tags: string[];
}

interface DeploymentResult {
  success: boolean;
  contractAddress?: string;
  transactionHash?: string;
  error?: string;
}

interface DeploymentData {
  project: ProjectData | null;
  projectId: string | null;
  collection: CollectionData & {
    contractAddress?: string;
    transactionHash?: string;
    deployedAt?: string;
    isDeployed: boolean;
  };
}

export async function deployCollection(
  createMode: 'new-project' | 'existing-project',
  selectedProject: string,
  projectData: ProjectData,
  collectionData: CollectionData,
  account: any
): Promise<DeploymentResult> {
  try {
    // Step 1: Validate all required data
    if (!collectionData.name || !collectionData.symbol) {
      return { success: false, error: "Please fill in all required collection fields" };
    }

    // Step 2: Check wallet connection
    if (!account) {
      return { success: false, error: "Please connect your wallet first" };
    }

    // Step 3: Get the correct chain based on selection
    const chainMap: { [key: string]: any } = {
      "11155111": sepolia,
      "1": ethereum,
      "137": polygon,
      "42161": arbitrum
    };
    const selectedChain = chainMap[collectionData.chainId] || sepolia;

    // Step 4: Deploy Thirdweb's prebuilt NFT Drop contract
    console.log("Deploying Thirdweb NFT Drop contract...");

    const contractAddress = await deployERC721Contract({
      client,
      chain: selectedChain,
      account,
      type: collectionData.contractType as "DropERC721" | "TokenERC721" | "OpenEditionERC721" | "LoyaltyCard",
      params: {
        name: collectionData.name,
        symbol: collectionData.symbol,
        description: collectionData.description || "",
        image: collectionData.image,
        defaultAdmin: account.address,
        saleRecipient: account.address,
        royaltyRecipient: account.address,
        royaltyBps: BigInt(Math.round(parseFloat(collectionData.royaltyPercentage) * 100)),
        platformFeeBps: BigInt(0),
        platformFeeRecipient: account.address,
        trustedForwarders: []
      }
    });

    const deployedContract = {
      contractAddress,
      transactionHash: "" // Transaction hash is handled internally by Thirdweb
    };

    console.log("Contract deployed:", deployedContract);

    // Step 5: Prepare data for backend
    const dataToSave: DeploymentData = {
      project: createMode === 'new-project' ? projectData : null,
      projectId: createMode === 'existing-project' ? selectedProject : null,
      collection: {
        name: collectionData.name,
        symbol: collectionData.symbol,
        description: collectionData.description,
        image: collectionData.image,
        bannerImage: collectionData.bannerImage,
        maxSupply: collectionData.maxSupply,
        royaltyPercentage: collectionData.royaltyPercentage,
        chainId: collectionData.chainId,
        contractType: collectionData.contractType,
        category: collectionData.category,
        tags: collectionData.tags,
        contractAddress: deployedContract.contractAddress,
        transactionHash: deployedContract.transactionHash,
        deployedAt: new Date().toISOString(),
        isDeployed: true
      }
    };

    // Step 6: Save to database via API
    const response = await fetch(`/api/studio/collections?address=${account.address}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataToSave),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to save collection data: ${errorData}`);
    }

    const result = await response.json();
    console.log('Collection saved:', result);

    return {
      success: true,
      contractAddress: deployedContract.contractAddress,
      transactionHash: deployedContract.transactionHash
    };

  } catch (error) {
    console.error('Deployment error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown deployment error'
    };
  }
}

export function validateDeploymentRequirements(
  collectionData: CollectionData,
  account: any
): { isValid: boolean; error?: string } {
  if (!collectionData.name || !collectionData.symbol) {
    return { isValid: false, error: "Please fill in all required collection fields" };
  }

  if (!account) {
    return { isValid: false, error: "Please connect your wallet first" };
  }

  if (!collectionData.chainId) {
    return { isValid: false, error: "Please select a blockchain" };
  }

  if (!collectionData.contractType) {
    return { isValid: false, error: "Please select a contract type" };
  }

  return { isValid: true };
}

export function getEstimatedGasCost(chainId: string): { deploy: string; mint: string; total: string } {
  // These are rough estimates and will vary based on network conditions
  const estimates: { [key: string]: { deploy: string; mint: string; total: string } } = {
    "1": { deploy: "~0.05 ETH", mint: "~0.003 ETH", total: "~0.053 ETH" }, // Ethereum Mainnet
    "11155111": { deploy: "~0.02 ETH", mint: "~0.001 ETH", total: "~0.021 ETH" }, // Sepolia
    "137": { deploy: "~0.05 MATIC", mint: "~0.002 MATIC", total: "~0.052 MATIC" }, // Polygon
    "42161": { deploy: "~0.01 ETH", mint: "~0.0005 ETH", total: "~0.0105 ETH" } // Arbitrum
  };

  return estimates[chainId] || estimates["11155111"]; // Default to Sepolia estimates
}