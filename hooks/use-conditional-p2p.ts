import { useP2PTrading } from "@/contexts/p2p-trading-context";

// Mock P2P state for non-P2P modes
const defaultP2PState = {
  selectedTrader: null as any,
  traderNFTs: [] as any[],
  selectTrader: () => {},
  toggleTraderNFTSelection: () => {},
  confirmTraderNFTs: () => {}
};

export function useConditionalP2P(isP2P: boolean) {
  try {
    // Only use P2P context when in P2P mode and context is available
    if (isP2P) {
      return useP2PTrading();
    }
  } catch (error) {
    // Context not available, use default state
  }
  
  return defaultP2PState;
}