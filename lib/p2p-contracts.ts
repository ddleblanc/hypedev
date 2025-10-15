import { getContract, prepareContractCall, sendTransaction, readContract } from "thirdweb";
import { client } from "./thirdweb";
import { defineChain } from "thirdweb/chains";
import type { Account } from "thirdweb/wallets";

// Contract addresses
const TRADE_ESCROW_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_TRADE_ESCROW_FACTORY_ADDRESS || "0x8dbc5dabB59A21A27886CB52200C59643da03817";
const TRADE_ESCROW_IMPLEMENTATION = process.env.NEXT_PUBLIC_TRADE_ESCROW_IMPLEMENTATION || "0xF479AA658f31cFabE09CEd1Ba391E21342aEff98";

// Chain configuration (using Sepolia testnet)
const CHAIN_ID = 11155111; // Sepolia

export interface TradeEscrowData {
  initiator: string;
  counterparty: string;
  metadata: string;
  escrowAddress: string;
}

export interface DepositData {
  nftContract: string;
  tokenId: string;
  amount?: number; // For ERC1155
}

export interface TradeItem {
  nftContract: string;
  tokenId: string;
  amount?: number;
  tokenType: 'ERC721' | 'ERC1155';
}

/**
 * Deploy a new TradeEscrow contract for a specific trade
 */
export async function deployTradeEscrow(
  counterpartyAddress: string,
  metadata: string,
  account: Account
): Promise<{ escrowAddress: string; transactionHash: string }> {
  try {
    const chain = defineChain(CHAIN_ID);
    
    const factoryContract = getContract({
      client,
      chain,
      address: TRADE_ESCROW_FACTORY_ADDRESS,
    });

    // Call createTrade function
    const transaction = prepareContractCall({
      contract: factoryContract,
      method: "function createTrade(address counterparty, string memory metadata) returns (address)",
      params: [counterpartyAddress, metadata]
    });

    const result = await sendTransaction({
      transaction,
      account,
    });

    // The contract should return the deployed escrow address
    // We'll need to get it from the transaction receipt or events
    const escrowAddress = await getEscrowAddressFromTransaction(result.transactionHash);

    return {
      escrowAddress,
      transactionHash: result.transactionHash
    };
  } catch (error) {
    console.error('Error deploying TradeEscrow:', error);
    throw new Error('Failed to deploy TradeEscrow contract');
  }
}

/**
 * Get escrow address from transaction (this would need to be implemented based on your contract)
 */
async function getEscrowAddressFromTransaction(txHash: string): Promise<string> {
  // This is a placeholder - you'd need to implement this based on your contract's events
  // For now, we'll return a mock address
  console.log('Getting escrow address from transaction:', txHash);
  
  // In a real implementation, you would:
  // 1. Get the transaction receipt
  // 2. Parse the events to find the TradeEscrowCreated event
  // 3. Extract the escrow address from the event data
  
  return "0x" + Math.random().toString(16).substr(2, 40); // Mock address
}

/**
 * Deposit NFTs into the TradeEscrow contract
 */
export async function depositToEscrow(
  escrowAddress: string,
  items: TradeItem[],
  account: Account
): Promise<string> {
  try {
    const chain = defineChain(CHAIN_ID);
    
    const escrowContract = getContract({
      client,
      chain,
      address: escrowAddress,
    });

    // For each item, approve and deposit
    for (const item of items) {
      // First, approve the escrow contract to transfer the NFT
      await approveNFTTransfer(item.nftContract, escrowAddress, item.tokenId, account);
      
      // Then deposit the NFT
      const depositTransaction = item.tokenType === 'ERC721' 
        ? prepareContractCall({
            contract: escrowContract,
            method: "function depositERC721(address nftContract, uint256 tokenId)",
            params: [item.nftContract, BigInt(item.tokenId)]
          })
        : prepareContractCall({
            contract: escrowContract,
            method: "function depositERC1155(address nftContract, uint256 tokenId, uint256 amount)",
            params: [item.nftContract, BigInt(item.tokenId), BigInt(item.amount || 1)]
          });

      await sendTransaction({
        transaction: depositTransaction,
        account,
      });
    }

    return "deposit_successful";
  } catch (error) {
    console.error('Error depositing to escrow:', error);
    throw new Error('Failed to deposit NFTs to escrow');
  }
}

/**
 * Approve NFT transfer to escrow contract
 */
async function approveNFTTransfer(
  nftContract: string,
  escrowAddress: string,
  tokenId: string,
  account: Account
): Promise<void> {
  try {
    const chain = defineChain(CHAIN_ID);
    
    const nftContractInstance = getContract({
      client,
      chain,
      address: nftContract,
    });

    // Check if already approved
    const isApproved = await readContract({
      contract: nftContractInstance,
      method: "function getApproved(uint256 tokenId) view returns (address)",
      params: [BigInt(tokenId)]
    });

    if (isApproved === escrowAddress) {
      return; // Already approved
    }

    // Approve the escrow contract
    const approveTransaction = prepareContractCall({
      contract: nftContractInstance,
      method: "function approve(address to, uint256 tokenId)",
      params: [escrowAddress, BigInt(tokenId)]
    });

    await sendTransaction({
      transaction: approveTransaction,
      account,
    });
  } catch (error) {
    console.error('Error approving NFT transfer:', error);
    throw new Error('Failed to approve NFT transfer');
  }
}

/**
 * Finalize the trade (swap assets)
 */
export async function finalizeTrade(
  escrowAddress: string,
  account: Account
): Promise<string> {
  try {
    const chain = defineChain(CHAIN_ID);
    
    const escrowContract = getContract({
      client,
      chain,
      address: escrowAddress,
    });

    const transaction = prepareContractCall({
      contract: escrowContract,
      method: "function finalize()",
      params: []
    });

    const result = await sendTransaction({
      transaction,
      account,
    });

    return result.transactionHash;
  } catch (error) {
    console.error('Error finalizing trade:', error);
    throw new Error('Failed to finalize trade');
  }
}

/**
 * Cancel the trade (return assets to original owners)
 */
export async function cancelTrade(
  escrowAddress: string,
  account: Account
): Promise<string> {
  try {
    const chain = defineChain(CHAIN_ID);
    
    const escrowContract = getContract({
      client,
      chain,
      address: escrowAddress,
    });

    const transaction = prepareContractCall({
      contract: escrowContract,
      method: "function cancel()",
      params: []
    });

    const result = await sendTransaction({
      transaction,
      account,
    });

    return result.transactionHash;
  } catch (error) {
    console.error('Error canceling trade:', error);
    throw new Error('Failed to cancel trade');
  }
}

/**
 * Get trade details from escrow contract
 */
export async function getEscrowTradeDetails(escrowAddress: string): Promise<any> {
  try {
    const chain = defineChain(CHAIN_ID);
    
    const escrowContract = getContract({
      client,
      chain,
      address: escrowAddress,
    });

    // Read trade details from contract
    const [initiator, counterparty, status, metadata] = await Promise.all([
      readContract({
        contract: escrowContract,
        method: "function initiator() view returns (address)",
        params: []
      }),
      readContract({
        contract: escrowContract,
        method: "function counterparty() view returns (address)",
        params: []
      }),
      readContract({
        contract: escrowContract,
        method: "function status() view returns (uint8)",
        params: []
      }),
      readContract({
        contract: escrowContract,
        method: "function metadata() view returns (string)",
        params: []
      })
    ]);

    return {
      initiator,
      counterparty,
      status: Number(status),
      metadata
    };
  } catch (error) {
    console.error('Error getting escrow details:', error);
    throw new Error('Failed to get escrow details');
  }
}

/**
 * Check if user has approved escrow contract for specific NFT
 */
export async function checkNFTApproval(
  nftContract: string,
  owner: string,
  escrowAddress: string,
  tokenId: string
): Promise<boolean> {
  try {
    const chain = defineChain(CHAIN_ID);
    
    const nftContractInstance = getContract({
      client,
      chain,
      address: nftContract,
    });

    const approvedAddress = await readContract({
      contract: nftContractInstance,
      method: "function getApproved(uint256 tokenId) view returns (address)",
      params: [BigInt(tokenId)]
    });

    return approvedAddress === escrowAddress;
  } catch (error) {
    console.error('Error checking NFT approval:', error);
    return false;
  }
}

/**
 * Get all trades between two users
 */
export async function getTradesBetweenUsers(
  user1Address: string,
  user2Address: string
): Promise<string[]> {
  try {
    const chain = defineChain(CHAIN_ID);
    
    const factoryContract = getContract({
      client,
      chain,
      address: TRADE_ESCROW_FACTORY_ADDRESS,
    });

    const trades = await readContract({
      contract: factoryContract,
      method: "function getTradesBetween(address user1, address user2) view returns (address[])",
      params: [user1Address, user2Address]
    });

    return trades as string[];
  } catch (error) {
    console.error('Error getting trades between users:', error);
    return [];
  }
}
