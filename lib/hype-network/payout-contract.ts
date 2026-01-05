/**
 * Payout Contract Service - Direct ETH transfers via Thirdweb v5
 *
 * Uses direct transfers instead of Split contracts because:
 * - Split contract payees are immutable after deployment
 * - Affiliate payouts require dynamic recipients per batch
 * - Direct transfers allow any recipient, any amount
 */
import { createThirdwebClient, prepareTransaction, sendAndConfirmTransaction } from "thirdweb";
import { privateKeyToAccount } from "thirdweb/wallets";
import { getWalletBalance } from "thirdweb/wallets";
import { sepolia, mainnet } from "thirdweb/chains";
import { formatEther, parseEther } from "viem";
import { z } from "zod";

// Environment validation schema
const EnvSchema = z.object({
  THIRDWEB_SECRET_KEY: z.string().min(1, "THIRDWEB_SECRET_KEY is required"),
  PAYOUT_ADMIN_PRIVATE_KEY: z.string().min(66, "PAYOUT_ADMIN_PRIVATE_KEY must be a valid private key"),
  NEXT_PUBLIC_CHAIN_ID: z.string().optional().default("11155111"),
});

// Validate environment on module load
let envValidated = false;
let validatedEnv: z.infer<typeof EnvSchema>;

function validateEnv(): z.infer<typeof EnvSchema> {
  if (envValidated) return validatedEnv;

  const result = EnvSchema.safeParse({
    THIRDWEB_SECRET_KEY: process.env.THIRDWEB_SECRET_KEY,
    PAYOUT_ADMIN_PRIVATE_KEY: process.env.PAYOUT_ADMIN_PRIVATE_KEY,
    NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
  });

  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path}: ${i.message}`).join(", ");
    throw new Error(`[Payout] Environment validation failed: ${issues}`);
  }

  envValidated = true;
  validatedEnv = result.data;
  return validatedEnv;
}

// Lazy initialization of Thirdweb client
let _client: ReturnType<typeof createThirdwebClient> | null = null;

function getClient(): ReturnType<typeof createThirdwebClient> {
  if (_client) return _client;
  const env = validateEnv();
  _client = createThirdwebClient({
    secretKey: env.THIRDWEB_SECRET_KEY,
  });
  return _client;
}

/**
 * Get the appropriate chain based on environment
 */
function getChain() {
  const env = validateEnv();
  const chainId = parseInt(env.NEXT_PUBLIC_CHAIN_ID);
  return chainId === 1 ? mainnet : sepolia;
}

/**
 * Get admin account for executing payouts
 * This account holds the treasury funds and executes transfers
 */
export function getPayoutAccount() {
  const env = validateEnv();
  const client = getClient();

  return privateKeyToAccount({
    client,
    privateKey: env.PAYOUT_ADMIN_PRIVATE_KEY as `0x${string}`,
  });
}

export interface TransferResult {
  success: boolean;
  txHash?: string;
  error?: string;
  gasUsed?: string;
}

/**
 * Validate Ethereum address format
 */
function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Execute a direct ETH transfer to a recipient
 *
 * @param recipientAddress - The wallet address to send ETH to
 * @param amountEth - Amount in ETH (not wei) e.g., "0.05"
 * @returns TransferResult with success status and tx hash
 */
export async function executeDirectTransfer(
  recipientAddress: string,
  amountEth: string
): Promise<TransferResult> {
  try {
    const client = getClient();
    const account = getPayoutAccount();
    const chain = getChain();

    // Validate address format
    if (!isValidAddress(recipientAddress)) {
      return { success: false, error: "Invalid recipient address format" };
    }

    // Parse and validate amount
    let amountWei: bigint;
    try {
      amountWei = parseEther(amountEth);
    } catch {
      return { success: false, error: `Invalid amount format: ${amountEth}` };
    }

    if (amountWei <= BigInt(0)) {
      return { success: false, error: "Amount must be greater than 0" };
    }

    console.log(`[Payout] Preparing transfer: ${amountEth} ETH to ${recipientAddress}`);

    // Prepare the transaction
    const transaction = prepareTransaction({
      to: recipientAddress as `0x${string}`,
      chain,
      client,
      value: amountWei,
    });

    // Send and wait for confirmation
    const result = await sendAndConfirmTransaction({
      transaction,
      account,
    });

    console.log(`[Payout] Transfer successful: ${result.transactionHash}`);

    return {
      success: true,
      txHash: result.transactionHash,
      gasUsed: result.gasUsed?.toString(),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Payout] Transfer failed:`, errorMessage);

    // Parse common errors
    if (errorMessage.includes("insufficient funds")) {
      return { success: false, error: "Insufficient treasury balance for transfer and gas" };
    }
    if (errorMessage.includes("nonce")) {
      return { success: false, error: "Transaction nonce conflict - retry in a moment" };
    }
    if (errorMessage.includes("replacement transaction underpriced")) {
      return { success: false, error: "Transaction gas price too low - retry in a moment" };
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Get the treasury wallet balance
 */
export async function getTreasuryBalance(): Promise<{
  balanceWei: string;
  balanceEth: string;
  address: string;
}> {
  try {
    const client = getClient();
    const account = getPayoutAccount();
    const chain = getChain();

    const balance = await getWalletBalance({
      address: account.address,
      client,
      chain,
    });

    return {
      balanceWei: balance.value.toString(),
      balanceEth: formatEther(balance.value),
      address: account.address,
    };
  } catch (error) {
    console.error("[Payout] Failed to get treasury balance:", error);
    return {
      balanceWei: "0",
      balanceEth: "0",
      address: "",
    };
  }
}

/**
 * Check if treasury has sufficient balance for a payout
 * Adds a gas buffer to ensure transaction can complete
 */
export async function hasSufficientBalance(amountEth: string): Promise<boolean> {
  const { balanceWei } = await getTreasuryBalance();

  let requiredWei: bigint;
  try {
    requiredWei = parseEther(amountEth);
  } catch {
    return false;
  }

  // Add 20% buffer for gas (conservative estimate)
  // At 30 gwei and 21000 gas, transfer costs ~0.0006 ETH
  // Buffer ensures we don't fail mid-batch
  const gasBuffer = requiredWei / BigInt(5); // 20%
  const requiredWithBuffer = requiredWei + gasBuffer;

  return BigInt(balanceWei) >= requiredWithBuffer;
}

/**
 * Estimate if treasury can cover multiple payouts
 */
export async function canCoverPayoutBatch(totalAmountEth: string): Promise<{
  canCover: boolean;
  availableEth: string;
  requiredEth: string;
  shortfallEth?: string;
}> {
  const { balanceEth, balanceWei } = await getTreasuryBalance();

  let requiredWei: bigint;
  try {
    requiredWei = parseEther(totalAmountEth);
  } catch {
    return {
      canCover: false,
      availableEth: balanceEth,
      requiredEth: totalAmountEth,
      shortfallEth: totalAmountEth,
    };
  }

  // 20% buffer for gas
  const gasBuffer = requiredWei / BigInt(5);
  const requiredWithBuffer = requiredWei + gasBuffer;
  const balanceWeiN = BigInt(balanceWei);
  const canCover = balanceWeiN >= requiredWithBuffer;

  const result: {
    canCover: boolean;
    availableEth: string;
    requiredEth: string;
    shortfallEth?: string;
  } = {
    canCover,
    availableEth: balanceEth,
    requiredEth: formatEther(requiredWithBuffer),
  };

  if (!canCover) {
    const shortfall = requiredWithBuffer - balanceWeiN;
    result.shortfallEth = formatEther(shortfall);
  }

  return result;
}

/**
 * Get the treasury wallet address
 */
export function getTreasuryAddress(): string {
  const account = getPayoutAccount();
  return account.address;
}

/**
 * Check if payout system is configured (has required env vars)
 */
export function isPayoutSystemConfigured(): boolean {
  try {
    validateEnv();
    return true;
  } catch {
    return false;
  }
}

/**
 * Get payout system configuration status (for admin dashboard)
 */
export async function getPayoutSystemStatus(): Promise<{
  configured: boolean;
  treasuryAddress?: string;
  treasuryBalance?: string;
  chainId: number;
  chainName: string;
  error?: string;
}> {
  try {
    const env = validateEnv();
    const chainId = parseInt(env.NEXT_PUBLIC_CHAIN_ID);
    const chainName = chainId === 1 ? "Ethereum Mainnet" : "Sepolia Testnet";

    const balance = await getTreasuryBalance();

    return {
      configured: true,
      treasuryAddress: balance.address,
      treasuryBalance: balance.balanceEth,
      chainId,
      chainName,
    };
  } catch (error) {
    const env = validateEnv();
    const chainId = parseInt(env.NEXT_PUBLIC_CHAIN_ID);

    return {
      configured: false,
      chainId,
      chainName: chainId === 1 ? "Ethereum Mainnet" : "Sepolia Testnet",
      error: error instanceof Error ? error.message : "Unknown configuration error",
    };
  }
}
