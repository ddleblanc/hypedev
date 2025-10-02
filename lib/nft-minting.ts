import { getContract, prepareContractCall, sendTransaction, readContract } from "thirdweb"
import { upload } from "thirdweb/storage"
import { client } from "./thirdweb"
import { lazyMint } from "thirdweb/extensions/erc721"
import { claimTo } from "thirdweb/extensions/erc721"
import { setClaimConditions } from "thirdweb/extensions/erc721"
import { getActiveClaimCondition } from "thirdweb/extensions/erc721"
import { lazyMint as lazyMintERC1155 } from "thirdweb/extensions/erc1155"
import { mintTo as mintToERC1155 } from "thirdweb/extensions/erc1155"
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
    // Preserve the original error instead of wrapping it
    throw error
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

// Diagnose contract to understand its capabilities
export async function diagnoseContract(
  contractAddress: string,
  chainId: number
): Promise<{
  hasSetClaimConditions: boolean;
  hasLazyMint: boolean;
  isInitialized: boolean;
  contractType: string;
  supportsInterface: { [key: string]: boolean };
}> {
  try {
    const chain = defineChain(chainId);
    const contract = getContract({
      client,
      chain,
      address: contractAddress,
    });

    const diagnosis: any = {
      hasSetClaimConditions: false,
      hasLazyMint: false,
      isInitialized: false,
      contractType: 'unknown',
      supportsInterface: {}
    };

    // Check for setClaimConditions function
    try {
      await readContract({
        contract,
        method: "function getClaimConditionById(uint256 _conditionId) view returns ((uint256 startTimestamp, uint256 maxClaimableSupply, uint256 supplyClaimed, uint256 quantityLimitPerWallet, bytes32 merkleRoot, uint256 pricePerToken, address currency, string metadata))",
        params: [BigInt(0)]
      });
      diagnosis.hasSetClaimConditions = true;
    } catch (e) {
      console.log('No getClaimConditionById function');
    }

    // Check if initialized
    try {
      const isInit = await readContract({
        contract,
        method: "function initialized() view returns (bool)",
      });
      diagnosis.isInitialized = isInit;
    } catch (e) {
      // Try alternative initialization check
      try {
        const owner = await readContract({
          contract,
          method: "function owner() view returns (address)",
        });
        diagnosis.isInitialized = !!owner;
      } catch (e2) {
        console.log('Could not determine initialization state');
      }
    }

    // Check contract type
    try {
      const name = await readContract({
        contract,
        method: "function name() view returns (string)",
      });
      diagnosis.contractType = name || 'ERC721';
    } catch (e) {
      diagnosis.contractType = 'unknown';
    }

    // Check for ERC721 Drop interface
    try {
      const supportsDropInterface = await readContract({
        contract,
        method: "function supportsInterface(bytes4 interfaceId) view returns (bool)",
        params: ["0x80ac58cd" as `0x${string}`] // ERC721 interface
      });
      diagnosis.supportsInterface['ERC721'] = supportsDropInterface;
    } catch (e) {
      console.log('No supportsInterface check');
    }

    console.log('Contract diagnosis:', diagnosis);
    return diagnosis;
  } catch (error) {
    console.error('Failed to diagnose contract:', error);
    throw error;
  }
}

export async function setupClaimConditions(
  contractAddress: string,
  chainId: number,
  claimConditions: ClaimCondition[],
  account: Account
): Promise<string> {
  try {
    console.log('Setting up claim conditions with Thirdweb v5 extension:', {
      contractAddress,
      chainId,
      numberOfPhases: claimConditions.length,
      claimConditions,
      account: account.address
    });

    // First, run diagnostics on the contract
    try {
      const diagnosis = await diagnoseContract(contractAddress, chainId);
      console.log('Contract diagnosis results:', diagnosis);

      if (!diagnosis.isInitialized) {
        throw new Error('Contract appears to not be initialized. Please ensure the contract is properly deployed and initialized.');
      }

      if (!diagnosis.hasSetClaimConditions) {
        console.warn('Contract may not support standard claim conditions interface');
      }
    } catch (diagError) {
      console.error('Diagnostic check failed:', diagError);
      // Continue anyway
    }

    const chain = defineChain(chainId)
    const contract = getContract({
      client,
      chain,
      address: contractAddress,
    })

    // First, check if the account has the necessary permissions
    try {
      // Try to check owner first
      try {
        const owner = await readContract({
          contract,
          method: "function owner() view returns (address)",
        });

        if (owner && owner.toLowerCase() !== account.address.toLowerCase()) {
          console.warn(`Warning: Current account ${account.address} is not the contract owner (${owner})`);

          // If not owner, check for admin/minter role
          try {
            const hasRole = await readContract({
              contract,
              method: "function hasRole(bytes32 role, address account) view returns (bool)",
              params: ["0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`, account.address] // DEFAULT_ADMIN_ROLE
            });

            if (!hasRole) {
              throw new Error(`Account ${account.address} is not the contract owner and does not have admin permissions. Contract owner is ${owner}`);
            }
          } catch (e) {
            // Role check failed, but owner check passed
            throw new Error(`Account ${account.address} is not the contract owner. Contract owner is ${owner}`);
          }
        } else {
          console.log('Account is the contract owner');
        }
      } catch (ownerError) {
        console.log('No owner() function, checking role-based permissions...');

        // Fallback to role checking
        const hasRole = await readContract({
          contract,
          method: "function hasRole(bytes32 role, address account) view returns (bool)",
          params: ["0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`, account.address] // DEFAULT_ADMIN_ROLE
        });

        if (!hasRole) {
          console.warn('Account does not have DEFAULT_ADMIN_ROLE');
        }
      }
    } catch (permissionError) {
      console.log('Could not verify permissions:', permissionError);
      // Continue anyway - the transaction will fail if permissions are wrong
    }

    // Check contract state and requirements
    let isOpenEdition = false;
    let needsLazyMint = false;

    try {
      // Check if it's an OpenEdition contract
      try {
        const contractURI = await readContract({
          contract,
          method: "function contractURI() view returns (string)",
        });
        console.log('Contract URI check passed - likely OpenEdition');
        isOpenEdition = true;
      } catch (e) {
        console.log('Not an OpenEdition contract or contractURI not available');
      }

      // Check if contract has lazy minted NFTs (required for Drop contracts)
      if (!isOpenEdition) {
        try {
          const totalSupply = await readContract({
            contract,
            method: "function nextTokenIdToMint() view returns (uint256)",
          });
          console.log('Contract has lazy minted tokens:', totalSupply);

          if (!totalSupply || totalSupply === BigInt(0)) {
            needsLazyMint = true;
            console.warn('Warning: Drop contract has no lazy minted NFTs. This may cause claim conditions to fail.');
          }
        } catch (e) {
          console.log('Could not check lazy minted supply');
        }
      }
    } catch (e: any) {
      console.log('Contract state check error:', e.message);
    }

    // Convert our ClaimCondition format to Thirdweb's ClaimConditionsInput format
    const phases = claimConditions.map((condition, index) => {
      // Convert Date/timestamp to Date object
      let startTime = condition.startTimestamp instanceof Date
        ? condition.startTimestamp
        : new Date(condition.startTimestamp);

      // Ensure unique start times (add 1 second if same as previous)
      if (index > 0) {
        const prevStartTime = phases[index - 1]?.startTime;
        if (prevStartTime && startTime.getTime() === prevStartTime.getTime()) {
          startTime = new Date(startTime.getTime() + 1000); // Add 1 second
          console.log(`Adjusted phase ${index + 1} start time to ensure uniqueness`);
        }
      }

      // Thirdweb v5 expects price as a string in ether format
      // Convert from wei string to ether string
      let priceInEther: string | number = "0";

      if (condition.pricePerToken && condition.pricePerToken !== "0") {
        const priceNum = parseFloat(condition.pricePerToken) / 1e18;
        // Keep as string to avoid precision issues
        priceInEther = priceNum.toString();
      }

      // Build the phase object using Thirdweb's EXACT expected format
      // Only include fields that Thirdweb SDK expects
      const phase: any = {
        startTime: startTime,
        price: priceInEther, // Price in ether format
      };

      // IMPORTANT: Only add optional fields that are non-zero/non-default
      // Thirdweb SDK may fail if we pass undefined or 0 for certain fields

      if (condition.maxClaimableSupply && condition.maxClaimableSupply > 0) {
        // Pass as number, not BigInt
        phase.maxClaimableSupply = Number(condition.maxClaimableSupply);
      }

      if (condition.quantityLimitPerWallet && condition.quantityLimitPerWallet > 0) {
        // Pass as number, not BigInt
        phase.maxClaimablePerWallet = Number(condition.quantityLimitPerWallet);
      }

      // Only set currencyAddress if it's NOT native token
      // DO NOT include this field at all for native token
      if (condition.currency && condition.currency !== NATIVE_TOKEN_ADDRESS) {
        phase.currencyAddress = condition.currency;
      }

      // DO NOT include metadata - it can cause issues
      // DO NOT include merkleRootHash - handle separately if needed

      console.log(`Phase ${index + 1} for Thirdweb SDK:`, phase);
      return phase;
    });

    // Try using Thirdweb's setClaimConditions extension
    try {
      console.log('Attempting to set claim conditions with Thirdweb extension...');
      console.log('Phases being sent:', JSON.stringify(phases, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      , 2));

      // Check if this is an OpenEdition contract that might need initialization
      if (isOpenEdition) {
        console.log('OpenEdition contract detected, checking if claim conditions module is installed...');

        // First check if the contract has the claim conditions extension installed
        try {
          const hasExtension = await readContract({
            contract,
            method: "function getActiveClaimCondition() view returns ((uint256 startTimestamp, uint256 maxClaimableSupply, uint256 supplyClaimed, uint256 quantityLimitPerWallet, bytes32 merkleRoot, uint256 pricePerToken, address currency, string metadata))",
          });
          console.log('Contract has claim conditions extension');
        } catch (e) {
          console.warn('Contract may not have claim conditions extension installed');

          // Try to install/initialize the extension
          try {
            console.log('Attempting to initialize claim conditions extension...');
            const initTx = prepareContractCall({
              contract,
              method: "function installExtension(string memory _extensionName, address _implementation)",
              params: ["ClaimCondition", contractAddress]
            });

            await sendTransaction({
              transaction: initTx,
              account,
            });
            console.log('Extension initialized');
          } catch (initError) {
            console.log('Could not initialize extension (may already be initialized):', initError);
          }
        }
      }

      // First, let's check what's currently set
      try {
        const currentConditions = await getClaimConditions(contractAddress, chainId);
        console.log('Current claim conditions on contract:', currentConditions);

        // If there are existing conditions, we might need to reset them
        if (currentConditions && currentConditions.length > 0) {
          console.log('Existing conditions found, will update them');
        }
      } catch (e) {
        console.log('Could not fetch current conditions:', e);
      }

      // Simplify the transaction to minimal required params
      console.log('Creating transaction with minimal params for better compatibility...');

      const transaction = setClaimConditions({
        contract,
        phases,
        resetClaimEligibility: false,
      });

      console.log('Transaction prepared, sending...');

      const result = await sendTransaction({
        transaction,
        account,
      });

      console.log('Claim conditions set successfully:', result);
      return result.transactionHash;
    } catch (extensionError: any) {
      console.error('SetClaimConditions extension failed:', extensionError);

      // Fallback: Try direct contract call for OpenEdition or older contracts
      if (phases.length === 1) {
        console.log('Attempting fallback methods for single phase...');

        const phase = phases[0];

        // Convert back to contract format
        const startTimestamp = Math.floor(phase.startTime.getTime() / 1000); // Unix timestamp
        const pricePerToken = BigInt(Math.floor(phase.price * 1e18)); // Convert back to wei
        const currency = phase.currencyAddress || NATIVE_TOKEN_ADDRESS;
        const maxClaimableSupply = phase.maxClaimableSupply ? BigInt(phase.maxClaimableSupply) : BigInt(2**256-1); // Max uint256 for unlimited
        const maxClaimablePerWallet = phase.maxClaimablePerWallet ? BigInt(phase.maxClaimablePerWallet) : BigInt(2**256-1);

        // Try OpenEdition specific method first
        try {
          console.log('Trying OpenEdition setSharedMetadata approach...');

          // OpenEdition contracts might use setSharedMetadata instead
          const sharedMetadata = {
            name: "OpenEdition NFT",
            description: "Claimable NFT",
            image: "",
            animation_url: ""
          };

          const transaction = prepareContractCall({
            contract,
            method: "function setSharedMetadata((string name, string description, string image, string animation_url))",
            params: [sharedMetadata]
          });

          const result = await sendTransaction({
            transaction,
            account,
          });

          console.log('Shared metadata set, now trying to set sale config...');

          // Now try to set the sale configuration
          const saleConfigTx = prepareContractCall({
            contract,
            method: "function setSaleConfig(uint256 publicSalePrice, uint256 maxSalePurchasePerAddress, uint256 publicSaleStart, uint256 publicSaleEnd)",
            params: [
              pricePerToken,
              maxClaimablePerWallet,
              BigInt(startTimestamp),
              BigInt(2**256-1) // No end time
            ]
          });

          const saleResult = await sendTransaction({
            transaction: saleConfigTx,
            account,
          });

          console.log('Sale config set successfully:', saleResult);
          return saleResult.transactionHash;
        } catch (openEditionError) {
          console.log('OpenEdition specific methods failed:', openEditionError);
        }

        // Try standard setClaimConditions as last resort
        try {
          console.log('Trying standard setClaimConditions...');
          const transaction = prepareContractCall({
            contract,
            method: "function setClaimConditions((uint256 startTimestamp, uint256 maxClaimableSupply, uint256 supplyClaimed, uint256 quantityLimitPerWallet, bytes32 merkleRoot, uint256 pricePerToken, address currency, string metadata), bool resetClaimEligibility)",
            params: [{
              startTimestamp: BigInt(startTimestamp),
              maxClaimableSupply: maxClaimableSupply,
              supplyClaimed: BigInt(0),
              quantityLimitPerWallet: maxClaimablePerWallet,
              merkleRoot: "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`,
              pricePerToken: pricePerToken,
              currency: currency,
              metadata: ""
            }, false] // resetClaimEligibility
          });

          const result = await sendTransaction({
            transaction,
            account,
          });

          console.log('Direct claim condition set successfully:', result);
          return result.transactionHash;
        } catch (directError) {
          console.error('Direct contract call also failed:', directError);
          throw extensionError; // Throw original error
        }
      }

      throw extensionError;
    }
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

// Check user's claim status
export async function getUserClaimStatus(
  contractAddress: string,
  chainId: number,
  userAddress: string
): Promise<{ claimed: number; limit: number; remaining: number }> {
  try {
    const chain = defineChain(chainId);
    const contract = getContract({
      client,
      chain,
      address: contractAddress,
    });

    // Try to get the active claim condition
    const activeCondition = await getActiveClaimCondition({
      contract,
    });

    // Default values
    let claimedAmount = 0;
    let claimLimit = 0;

    if (activeCondition) {
      // Get the claim limit from the condition
      claimLimit = activeCondition.quantityLimitPerWallet
        ? Number(activeCondition.quantityLimitPerWallet)
        : Number.MAX_SAFE_INTEGER; // Unlimited

      // Try to get how many the user has already claimed
      try {
        // First, try to get the active condition ID (usually 0 for single-phase contracts)
        let conditionId = BigInt(0);

        // Try to get the active condition ID if the contract supports it
        try {
          const activeId = await readContract({
            contract,
            method: "function getActiveClaimConditionId() view returns (uint256)",
          });
          conditionId = activeId;
          console.log('Active condition ID:', conditionId);
        } catch (e) {
          // Default to 0 if method doesn't exist
          console.log('Using default condition ID 0');
        }

        // Get the user's claimed amount for this condition
        try {
          const userClaimed = await readContract({
            contract,
            method: "function getSupplyClaimedByWallet(uint256 _conditionId, address _claimer) view returns (uint256 supplyClaimedByWallet)",
            params: [conditionId, userAddress]
          });
          claimedAmount = Number(userClaimed);
          console.log(`User ${userAddress} has claimed ${claimedAmount} NFTs in condition ${conditionId}`);
        } catch (e) {
          console.log('Could not get user-specific claim amount via getSupplyClaimedByWallet:', e);

          // Fallback: Try to get the user's NFT balance for this collection
          try {
            const balance = await readContract({
              contract,
              method: "function balanceOf(address owner) view returns (uint256)",
              params: [userAddress]
            });
            claimedAmount = Number(balance);
            console.log(`Fallback: User ${userAddress} owns ${claimedAmount} NFTs from this collection`);
          } catch (balanceError) {
            console.log('Could not get user balance either:', balanceError);
          }
        }
      } catch (e) {
        console.log('Could not get claim status:', e);
      }
    }

    const remaining = Math.max(0, claimLimit - claimedAmount);

    return {
      claimed: claimedAmount,
      limit: claimLimit === Number.MAX_SAFE_INTEGER ? -1 : claimLimit, // -1 means unlimited
      remaining: claimLimit === Number.MAX_SAFE_INTEGER ? -1 : remaining
    };
  } catch (error) {
    console.error('Error getting user claim status:', error);
    // Return default values on error
    return {
      claimed: 0,
      limit: -1, // Unknown
      remaining: -1
    };
  }
}

// Get current claim conditions from contract
export async function getClaimConditions(
  contractAddress: string,
  chainId: number
): Promise<any[]> {
  try {
    const chain = defineChain(chainId)
    const contract = getContract({
      client,
      chain,
      address: contractAddress,
    })

    console.log('Getting claim conditions from contract...')

    // First try to get all claim conditions (for multi-phase contracts)
    try {
      const allConditions = await readContract({
        contract,
        method: "function getClaimConditions() view returns ((uint256 startTimestamp, uint256 maxClaimableSupply, uint256 supplyClaimed, uint256 quantityLimitPerWallet, bytes32 merkleRoot, uint256 pricePerToken, address currency, string metadata)[])",
      })

      if (allConditions && allConditions.length > 0) {
        console.log('Retrieved all claim conditions:', allConditions)
        return [...allConditions]
      }
    } catch (e) {
      console.log('Multi-phase method not available, trying single phase...')
    }

    // Fallback to active condition only (single phase)
    const activeCondition = await getActiveClaimCondition({
      contract,
    })

    console.log('Active claim condition from contract:', activeCondition)
    return activeCondition ? [activeCondition] : []
  } catch (error) {
    console.error('Error getting claim conditions with Thirdweb extension:', error)

    // Fallback: Try reading the active claim condition directly
    try {
      const chain = defineChain(chainId)
      const contract = getContract({
        client,
        chain,
        address: contractAddress,
      })

      const activeCondition = await readContract({
        contract,
        method: "function getActiveClaimCondition() view returns ((uint256 startTimestamp, uint256 maxClaimableSupply, uint256 supplyClaimed, uint256 quantityLimitPerWallet, bytes32 merkleRoot, uint256 pricePerToken, address currency, string metadata))",
      })

      console.log('Active claim condition from contract:', activeCondition)
      return activeCondition ? [activeCondition] : []
    } catch (fallbackError) {
      console.error('Fallback method also failed:', fallbackError)

      // Return empty array if no claim conditions are set
      console.log('No claim conditions found on contract - this is expected if none have been set yet')
      return []
    }
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

// ============================================================================
// ERC1155 Edition Minting Functions
// ============================================================================

export interface EditionMetadata extends NFTMetadata {
  supply?: number; // Number of copies for this edition
}

// Lazy mint ERC1155 tokens (for EditionDrop contracts)
export async function lazyMintEdition({
  contractAddress,
  chainId,
  metadata,
}: Omit<MintOptions, 'recipient'> & { metadata: EditionMetadata }, account: Account): Promise<{ transactionHash: string; metadataUri: string; tokenId: string }> {
  try {
    const chain = defineChain(chainId)

    const contract = getContract({
      client,
      chain,
      address: contractAddress,
    })

    // Upload metadata
    const metadataUri = await uploadMetadata(metadata)

    console.log('Lazy minting ERC1155 edition with metadata:', metadata)

    // Use Thirdweb's ERC1155 lazyMint extension
    const transaction = lazyMintERC1155({
      contract,
      nfts: [{
        name: metadata.name,
        description: metadata.description,
        image: metadata.image,
        external_url: metadata.external_url,
        animation_url: metadata.animation_url,
        attributes: metadata.attributes
      }],
    })

    const result = await sendTransaction({
      transaction,
      account,
    })

    console.log('ERC1155 lazy mint result:', result)

    // Try to get the next token ID from the contract
    let tokenId = '0';
    try {
      const nextTokenId = await readContract({
        contract,
        method: "function nextTokenIdToMint() view returns (uint256)",
      });
      // The token ID that was just minted is nextTokenId - 1
      tokenId = (nextTokenId - BigInt(1)).toString();
    } catch (e) {
      console.log('Could not read nextTokenIdToMint, using default:', e);
    }

    return {
      transactionHash: result.transactionHash,
      metadataUri,
      tokenId
    }
  } catch (error) {
    console.error('ERC1155 lazy minting error:', error)
    throw error
  }
}

// Mint ERC1155 tokens directly (for Edition contracts)
export async function mintEdition({
  contractAddress,
  chainId,
  recipient,
  metadata,
  tokenId = 0,
  quantity = 1
}: MintOptions & { metadata: EditionMetadata; tokenId?: number; quantity?: number }, account: Account): Promise<{ transactionHash: string; tokenId: string }> {
  try {
    const chain = defineChain(chainId)

    const contract = getContract({
      client,
      chain,
      address: contractAddress,
    })

    console.log('Minting ERC1155 edition:', { tokenId, quantity, recipient })

    // For new token IDs, we need to upload metadata first
    let actualTokenId = BigInt(tokenId);

    if (tokenId === 0 || tokenId === undefined) {
      // Get the next available token ID
      try {
        const nextTokenId = await readContract({
          contract,
          method: "function nextTokenIdToMint() view returns (uint256)",
        });
        actualTokenId = nextTokenId;
      } catch (e) {
        console.log('Could not read nextTokenIdToMint, using 0');
      }

      // Upload metadata for the new token
      const metadataUri = await uploadMetadata(metadata);

      // Set the URI for this token ID
      try {
        const setUriTx = prepareContractCall({
          contract,
          method: "function setTokenURI(uint256 tokenId, string uri)",
          params: [actualTokenId, metadataUri]
        });
        await sendTransaction({ transaction: setUriTx, account });
      } catch (e) {
        console.log('setTokenURI not available, metadata may need to be set differently:', e);
      }
    }

    // Use Thirdweb's ERC1155 mintTo extension
    const transaction = mintToERC1155({
      contract,
      to: recipient,
      supply: BigInt(quantity),
      nft: {
        tokenId: actualTokenId,
      }
    })

    const result = await sendTransaction({
      transaction,
      account,
    })

    console.log('ERC1155 mint result:', result)
    return {
      transactionHash: result.transactionHash,
      tokenId: actualTokenId.toString()
    }
  } catch (error) {
    console.error('ERC1155 minting error:', error)
    throw error
  }
}

// Mint additional copies of an existing ERC1155 token
export async function mintAdditionalEditionCopies({
  contractAddress,
  chainId,
  recipient,
  tokenId,
  quantity = 1
}: Omit<MintOptions, 'metadata'> & { tokenId: number; quantity?: number }, account: Account): Promise<string> {
  try {
    const chain = defineChain(chainId)

    const contract = getContract({
      client,
      chain,
      address: contractAddress,
    })

    console.log('Minting additional copies of token ID:', tokenId, 'quantity:', quantity)

    // Use Thirdweb's ERC1155 mintTo extension
    const transaction = mintToERC1155({
      contract,
      to: recipient,
      supply: BigInt(quantity),
      nft: {
        tokenId: BigInt(tokenId),
      }
    })

    const result = await sendTransaction({
      transaction,
      account,
    })

    console.log('Additional copies minted:', result)
    return result.transactionHash
  } catch (error) {
    console.error('Error minting additional copies:', error)
    throw error
  }
}

// Get token supply for ERC1155
export async function getEditionSupply(
  contractAddress: string,
  chainId: number,
  tokenId: number
): Promise<{ totalSupply: number; maxSupply: number }> {
  try {
    const chain = defineChain(chainId)
    const contract = getContract({
      client,
      chain,
      address: contractAddress,
    })

    let totalSupply = 0;
    let maxSupply = 0;

    // Try to get total supply for this token
    try {
      const supply = await readContract({
        contract,
        method: "function totalSupply(uint256 tokenId) view returns (uint256)",
        params: [BigInt(tokenId)]
      });
      totalSupply = Number(supply);
    } catch (e) {
      console.log('Could not read totalSupply:', e);
    }

    // Try to get max supply if available
    try {
      const max = await readContract({
        contract,
        method: "function maxSupply(uint256 tokenId) view returns (uint256)",
        params: [BigInt(tokenId)]
      });
      maxSupply = Number(max);
    } catch (e) {
      console.log('maxSupply not available (unlimited)');
      maxSupply = -1; // Unlimited
    }

    return { totalSupply, maxSupply };
  } catch (error) {
    console.error('Error getting edition supply:', error);
    return { totalSupply: 0, maxSupply: -1 };
  }
}