import { client } from "@/lib/thirdweb";
import { defineChain, sepolia, polygon, ethereum, arbitrum } from "thirdweb/chains";
import { deployERC721Contract, deployERC1155Contract } from "thirdweb/deploys";
import type { ClaimCondition } from '@/lib/nft-minting';
import { setupClaimConditions } from '@/lib/nft-minting';
import { THIRDWEB_CONTRACTS } from '@/lib/thirdweb-contracts';

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
    claimPhases?: string | null;
  };
}

export async function deployCollection(
  createMode: 'new-project' | 'existing-project',
  selectedProject: string,
  projectData: ProjectData,
  collectionData: CollectionData,
  account: any,
  claimPhases?: ClaimCondition[],
  progressCallback?: (step: string, progress: number) => void
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

    // Step 4: Get the contract configuration
    const contractConfig = THIRDWEB_CONTRACTS.find(c => c.id === collectionData.contractType);
    if (!contractConfig) {
      return { success: false, error: "Invalid contract type selected" };
    }

    console.log(`Deploying ${contractConfig.name} contract...`);

    // Report confirming step
    if (progressCallback) {
      progressCallback("confirming", 60);
    }

    // Determine if this is an ERC721 or ERC1155 contract
    const isERC1155 = ["EditionDrop", "Edition"].includes(collectionData.contractType);

    let contractAddress: string;

    if (isERC1155) {
      // Map our contract IDs to Thirdweb's ERC1155 contract names
      const erc1155TypeMap: { [key: string]: string } = {
        "EditionDrop": "DropERC1155",
        "Edition": "TokenERC1155"
      };

      const thirdwebContractType = erc1155TypeMap[collectionData.contractType];

      // Deploy ERC1155 contract
      contractAddress = await deployERC1155Contract({
        client,
        chain: selectedChain,
        account,
        type: thirdwebContractType as "DropERC1155" | "TokenERC1155",
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
    } else {
      // Map our contract IDs to Thirdweb's ERC721 contract names
      const erc721TypeMap: { [key: string]: string } = {
        "NFTDrop": "DropERC721",
        "NFTCollection": "TokenERC721",
        "OpenEdition": "OpenEditionERC721",
        "CommunityStream": "ERC721CommunityStream"
      };

      const thirdwebContractType = erc721TypeMap[collectionData.contractType] || collectionData.contractType;

      // Deploy ERC721 contract
      contractAddress = await deployERC721Contract({
        client,
        chain: selectedChain,
        account,
        type: thirdwebContractType as "DropERC721" | "TokenERC721" | "OpenEditionERC721",
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
    }

    const deployedContract = {
      contractAddress,
      transactionHash: "" // Transaction hash is handled internally by Thirdweb
    };

    console.log("Contract deployed:", deployedContract);

    // Report pending step (blockchain confirmation)
    if (progressCallback) {
      progressCallback("pending", 80);
    }

    // Step 4.5: Set up claim conditions if provided and supported
    if (claimPhases && claimPhases.length > 0 && contractConfig.supportsClaimConditions) {
      try {
        console.log("Setting up claim conditions...");
        await setupClaimConditions(
          deployedContract.contractAddress,
          parseInt(collectionData.chainId),
          claimPhases,
          account
        );
        console.log("Claim conditions set successfully");
      } catch (error) {
        console.error("Error setting claim conditions:", error);
        // Continue with deployment even if claim conditions fail
      }
    }

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
        isDeployed: true,
        claimPhases: claimPhases && claimPhases.length > 0 ? JSON.stringify(claimPhases) : null
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