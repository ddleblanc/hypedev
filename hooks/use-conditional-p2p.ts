import { useP2PTrading } from "@/contexts/p2p-trading-context";

// Mock P2P state for non-P2P modes
const defaultP2PState = {
  selectedTrader: null as any,
  traderNFTs: [] as any[],
  traderBoardNFTs: [] as any[],
  selectTrader: () => {},
  toggleTraderNFTSelection: () => {},
  confirmTraderNFTs: () => {},
  isLoadingTraders: false,
  isLoadingTraderNFTs: false,
  tradersError: null,
  traderNFTsError: null,
  refreshTraders: () => {},
  traders: [] as any[]
};

export function useConditionalP2P(isP2P: boolean) {
  let p2pState;

  try {
    // Always call the hook to maintain hook order
    p2pState = useP2PTrading();
  } catch (error) {
    // Context not available, use default state
    p2pState = defaultP2PState;
  }

  // Only return P2P state when in P2P mode
  return isP2P ? p2pState : defaultP2PState;
}