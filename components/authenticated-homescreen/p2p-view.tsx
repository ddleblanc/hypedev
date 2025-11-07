'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useWalletAuthOptimized } from '@/hooks/use-wallet-auth-optimized';
import { useP2PTrading } from '@/contexts/p2p-trading-context';
import { MobileP2PHub } from '@/components/p2p/mobile-hub';
import { MobileNav, P2PMobileTab } from '@/components/p2p/mobile-nav';
import { ConversationList } from '@/components/p2p/mobile-chat/conversation-list';
import { ChatView } from '@/components/p2p/mobile-chat/chat-view';
import { TradeHistory } from '@/components/p2p/trade-history';
import { MobileProfile } from '@/components/p2p/mobile-profile';
import { IntegratedTradeHistory } from '@/components/p2p/integrated-trade-history';
import { MediaRenderer } from '@/components/media-renderer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  X,
  History,
  ArrowRightLeft,
  Send,
  TrendingUp,
  Loader2,
  Check,
} from 'lucide-react';

interface P2PViewProps {
  setViewMode?: (mode: string) => void;
  initialTraderAddress?: string;
  initialNftId?: string;
  initialCollectionName?: string;
  initialTraderNftIds?: string;
  initialUserNftIds?: string;
}

export function P2PView({
  initialTraderAddress,
}: P2PViewProps) {
  const { user, signOut } = useWalletAuthOptimized();
  const router = useRouter();
  const address = user?.walletAddress;

  // P2P Trading Context (for desktop)
  const {
    userBoardNFTs,
    traderBoardNFTs,
    removeUserNFTFromBoard,
    removeTraderNFTFromBoard,
    loadTradeIntoBoard,
    loadedTrade,
    isViewingHistory,
    selectedTrader,
    clearAllSelections,
    activeTradeId,
    clearActiveTradeId,
  } = useP2PTrading();

  // Desktop tab state
  const [desktopActiveTab, setDesktopActiveTab] = useState<'trade' | 'history'>('trade');
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);
  const [refreshHistoryKey, setRefreshHistoryKey] = useState(0);
  const [desktopMessage, setDesktopMessage] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewFilter, setViewFilter] = useState<'all' | 'active' | 'completed'>('all');

  // Mobile tab state
  const [activeTab, setActiveTab] = useState<P2PMobileTab>(
    initialTraderAddress ? 'chats' : 'hub'
  );

  // Mobile chat state (separate from desktop's selectedTrader from context)
  const [mobileSelectedTrader, setMobileSelectedTrader] = useState<{
    address: string;
    name: string | null;
    tradeId: string | null;
    tradeStatus: string | null;
    userNFTs?: any[];
    traderNFTs?: any[];
  } | null>(null);

  // Stats (would be fetched from API in real implementation)
  const [stats, setStats] = useState({
    unreadMessages: 0,
    activeOffers: 0,
    pendingActions: 0,
    totalTrades: 0,
    successRate: 0,
    trustScore: 0,
    totalVolume: '0',
  });

  // Load stats on mount
  useEffect(() => {
    const loadStats = async () => {
      if (!user?.walletAddress) return;

      try {
        // Fetch user's trades for stats
        const response = await fetch(`/api/p2p/trades?userAddress=${user.walletAddress}`);
        const data = await response.json();

        if (data.success && data.data) {
          const trades = data.data.trades || [];
          const activeTrades = trades.filter((t: any) => t.status === 'PENDING' || t.status === 'AGREED');
          const completedTrades = trades.filter((t: any) => t.status === 'FINALIZED');

          setStats({
            unreadMessages: 0, // TODO: Calculate from messages
            activeOffers: activeTrades.length,
            pendingActions: activeTrades.filter((t: any) => t.counterpartyAddress === user.walletAddress && t.status === 'PENDING').length,
            totalTrades: trades.length,
            successRate: trades.length > 0 ? Math.round((completedTrades.length / trades.length) * 100) : 0,
            trustScore: 4.5, // TODO: Calculate from trade history
            totalVolume: '0', // TODO: Calculate from trade values
          });
        }
      } catch (error) {
        console.error('Failed to load stats:', error);
      }
    };

    loadStats();
  }, [user?.walletAddress]);

  // Desktop helper functions
  const extractRealNFTId = (id: string): string => {
    if (id.startsWith('user-') || id.startsWith('trader-')) {
      const parts = id.split('-');
      return parts.slice(1, -1).join('-');
    }
    return id;
  };

  const isBoardModified = () => {
    if (!loadedTrade || !activeTradeId) return false;

    const isInitiator = loadedTrade.initiator.walletAddress === address;
    const originalUserItems = loadedTrade.items
      .filter((item: any) => isInitiator ? item.side === 'INITIATOR' : item.side === 'COUNTERPARTY')
      .map((item: any) => item.nft.id);
    const originalTraderItems = loadedTrade.items
      .filter((item: any) => isInitiator ? item.side === 'COUNTERPARTY' : item.side === 'INITIATOR')
      .map((item: any) => item.nft.id);

    const currentUserIds = userBoardNFTs.map(nft => extractRealNFTId(nft.id));
    const currentTraderIds = traderBoardNFTs.map(nft => extractRealNFTId(nft.id));

    if (currentUserIds.length !== originalUserItems.length || currentTraderIds.length !== originalTraderItems.length) {
      return true;
    }

    const userIdsMatch = currentUserIds.every(id => originalUserItems.includes(id)) &&
                         originalUserItems.every((id: string) => currentUserIds.includes(id));
    const traderIdsMatch = currentTraderIds.every(id => originalTraderItems.includes(id)) &&
                           originalTraderItems.every((id: string) => currentTraderIds.includes(id));

    return !userIdsMatch || !traderIdsMatch;
  };

  const boardModified = isBoardModified();

  const handleResetBoard = () => {
    if (loadedTrade && activeTradeId) {
      loadTradeIntoBoard(loadedTrade);
    }
  };

  const sendOffer = async () => {
    if (!address || !selectedTrader) return;

    setIsCreating(true);

    try {
      const endpoint = activeTradeId ? `/api/p2p/trades/${activeTradeId}` : '/api/p2p/trades';
      const method = activeTradeId ? 'PUT' : 'POST';

      const fairnessScore = calculateFairnessScore();

      const body = activeTradeId ? {
        action: 'counteroffer',
        userAddress: address,
        items: [
          ...userBoardNFTs.map(nft => ({
            nftId: extractRealNFTId(nft.id),
            side: 'INITIATOR',
            tokenAmount: nft.value,
            metadata: { name: nft.name, image: nft.image, rarity: nft.rarity }
          })),
          ...traderBoardNFTs.map(nft => ({
            nftId: extractRealNFTId(nft.id),
            side: 'COUNTERPARTY',
            tokenAmount: nft.value,
            metadata: { name: nft.name, image: nft.image, rarity: nft.rarity }
          }))
        ],
        message: desktopMessage
      } : {
        initiatorAddress: address,
        counterpartyAddress: selectedTrader.walletAddress,
        initiatorItems: userBoardNFTs.map(nft => ({
          nftId: extractRealNFTId(nft.id),
          side: 'INITIATOR',
          tokenAmount: nft.value,
          metadata: { name: nft.name, image: nft.image, rarity: nft.rarity }
        })),
        counterpartyItems: traderBoardNFTs.map(nft => ({
          nftId: extractRealNFTId(nft.id),
          side: 'COUNTERPARTY',
          tokenAmount: nft.value,
          metadata: { name: nft.name, image: nft.image, rarity: nft.rarity }
        })),
        metadata: {
          message: desktopMessage,
          fairnessScore,
          createdAt: new Date().toISOString()
        }
      };

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (data.success) {
        clearAllSelections();
        setDesktopMessage('');
        if (activeTradeId) clearActiveTradeId();
        setRefreshHistoryKey(prev => prev + 1);
      } else {
        console.error('Trade error:', data.error || 'Failed to send offer');
      }
    } catch (error) {
      console.error('Error sending offer:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleAcceptTrade = async () => {
    if (!address || !activeTradeId) return;

    setIsCreating(true);
    try {
      const response = await fetch(`/api/p2p/trades/${activeTradeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'accept',
          userAddress: address,
          message: desktopMessage || 'Trade accepted!'
        })
      });

      const data = await response.json();

      if (data.success) {
        clearAllSelections();
        setDesktopMessage('');
        clearActiveTradeId();
        setRefreshHistoryKey(prev => prev + 1);
        setDesktopActiveTab('history');
        setSelectedTradeId(data.data.id);
      } else {
        console.error('Accept error:', data.error || 'Failed to accept trade');
      }
    } catch (error) {
      console.error('Error accepting trade:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRejectTrade = async () => {
    if (!address || !activeTradeId) return;

    setIsCreating(true);
    try {
      const response = await fetch(`/api/p2p/trades/${activeTradeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          userAddress: address,
          message: desktopMessage || 'Trade rejected'
        })
      });

      const data = await response.json();

      if (data.success) {
        clearAllSelections();
        setDesktopMessage('');
        clearActiveTradeId();
        setRefreshHistoryKey(prev => prev + 1);
        setDesktopActiveTab('history');
        setSelectedTradeId(data.data.id);
      } else {
        console.error('Reject error:', data.error || 'Failed to reject trade');
      }
    } catch (error) {
      console.error('Error rejecting trade:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const calculateFairnessScore = () => {
    const userValue = userBoardNFTs.reduce((sum, nft) => sum + nft.value, 0);
    const traderValue = traderBoardNFTs.reduce((sum, nft) => sum + nft.value, 0);

    if (userValue === 0 && traderValue === 0) return 0;
    if (userValue === 0 || traderValue === 0) return 0;

    const ratio = Math.min(userValue, traderValue) / Math.max(userValue, traderValue);
    return Math.round(ratio * 100);
  };

  const fairnessScore = calculateFairnessScore();
  const userTotal = userBoardNFTs.reduce((sum, nft) => sum + nft.value, 0);
  const traderTotal = traderBoardNFTs.reduce((sum, nft) => sum + nft.value, 0);
  const canSendOffer = userBoardNFTs.length > 0 && selectedTrader && !isCreating && !isViewingHistory;

  // Handle initial trader address
  useEffect(() => {
    if (initialTraderAddress && activeTab === 'chats') {
      // Automatically select this trader in chat view
      setMobileSelectedTrader({
        address: initialTraderAddress,
        name: null,
        tradeId: null,
        tradeStatus: null,
      });
    }
  }, [initialTraderAddress, activeTab]);

  // Navigation handlers
  const handleNavigateToHistory = () => {
    setActiveTab('history');
  };

  const handleNavigateToTraders = () => {
    // Navigate to traders browsing (TODO: implement)
    router.push('/p2p/traders');
  };

  const handleSelectConversation = (traderAddress: string, tradeId: string | null) => {
    // Load trader details and open chat
    setMobileSelectedTrader({
      address: traderAddress,
      name: null,
      tradeId,
      tradeStatus: null,
    });
  };

  const handleBackToConversations = () => {
    setMobileSelectedTrader(null);
  };

  const handleViewFullTrade = () => {
    if (mobileSelectedTrader?.tradeId) {
      router.push(`/p2p/board/review?trader=${mobileSelectedTrader.address}&tradeId=${mobileSelectedTrader.tradeId}`);
    }
  };

  const handleDisconnect = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  // Render mobile content based on active tab
  const renderContent = () => {
    // If in chat view and trader selected, show full-screen chat
    if (activeTab === 'chats' && mobileSelectedTrader) {
      return (
        <ChatView
          traderAddress={mobileSelectedTrader.address}
          traderName={mobileSelectedTrader.name}
          tradeId={mobileSelectedTrader.tradeId}
          tradeStatus={mobileSelectedTrader.tradeStatus}
          userNFTs={mobileSelectedTrader.userNFTs}
          traderNFTs={mobileSelectedTrader.traderNFTs}
          onBack={handleBackToConversations}
          onViewFullTrade={handleViewFullTrade}
        />
      );
    }

    // Otherwise show tab content with bottom nav
    switch (activeTab) {
      case 'hub':
        return (
          <MobileP2PHub
            onNavigateToHistory={handleNavigateToHistory}
            onNavigateToTraders={handleNavigateToTraders}
            statsData={{
              unreadMessages: stats.unreadMessages,
              activeOffers: stats.activeOffers,
              pendingActions: stats.pendingActions,
            }}
          />
        );

      case 'chats':
        return <ConversationList onSelectConversation={handleSelectConversation} />;

      case 'history':
        return (
          <div className="pt-[64px] pb-[80px]">
            <TradeHistory />
          </div>
        );

      case 'profile':
        return (
          <MobileProfile
            statsData={{
              totalTrades: stats.totalTrades,
              successRate: stats.successRate,
              trustScore: stats.trustScore,
              totalVolume: stats.totalVolume,
            }}
            onViewHistory={handleNavigateToHistory}
            onDisconnect={handleDisconnect}
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* Mobile View */}
      <div className="md:hidden relative min-h-screen bg-transparent">
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>

        {/* Mobile Navigation (hidden when in individual chat) */}
        {!(activeTab === 'chats' && mobileSelectedTrader) && (
          <MobileNav
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        )}
      </div>

      {/* Desktop View - Trading Board */}
      <div className="hidden md:flex h-screen relative px-6 pt-20 pb-8 flex-col">
        {/* Main Trading Board Container */}
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden flex flex-col flex-1">
          {/* Header with Integrated Tab Controls and Actions */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <AnimatePresence mode="wait">
                  {desktopActiveTab === 'trade' ? (
                    <motion.div
                      key="trade-info"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-4"
                    >
                      {/* Fairness Indicator */}
                      {fairnessScore > 0 && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-full",
                            fairnessScore >= 80 ? "bg-green-500/20" :
                            fairnessScore >= 60 ? "bg-yellow-500/20" :
                            "bg-red-500/20"
                          )}
                        >
                          <TrendingUp className={cn(
                            "h-4 w-4",
                            fairnessScore >= 80 ? "text-green-400" :
                            fairnessScore >= 60 ? "text-yellow-400" :
                            "text-red-400"
                          )} />
                          <span className={cn(
                            "text-sm font-medium",
                            fairnessScore >= 80 ? "text-green-400" :
                            fairnessScore >= 60 ? "text-yellow-400" :
                            "text-red-400"
                          )}>
                            {fairnessScore}% Fair
                          </span>
                        </motion.div>
                      )}

                      {/* Value Comparison */}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-white/60">You:</span>
                          <span className="text-[rgb(163,255,18)] font-mono font-medium">
                            {userTotal.toFixed(4)} ETH
                          </span>
                        </div>
                        <div className="w-px h-4 bg-white/20" />
                        <div className="flex items-center gap-2">
                          <span className="text-white/60">Them:</span>
                          <span className="text-purple-400 font-mono font-medium">
                            {traderTotal.toFixed(4)} ETH
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="history-filters"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-3"
                    >
                      {/* Quick Filters */}
                      <div className="flex gap-1 bg-black/60 rounded-full p-1 border border-white/10">
                        {(['all', 'active', 'completed'] as const).map((filter) => (
                          <button
                            key={filter}
                            onClick={() => setViewFilter(filter)}
                            className={cn(
                              "px-3 py-1 rounded-full text-xs font-medium transition-all",
                              viewFilter === filter
                                ? "bg-white text-black shadow-lg"
                                : "text-white/60 hover:text-white"
                            )}
                          >
                            {filter.charAt(0).toUpperCase() + filter.slice(1)}
                          </button>
                        ))}
                      </div>

                      {/* Search */}
                      <Input
                        placeholder="Search trades..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-48 h-8 bg-black/60 border-white/20 text-white text-xs placeholder:text-white/40"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Tab Controls */}
              <div className="flex items-center gap-2">
                {/* Tab Buttons */}
                <div className="flex gap-1 bg-black/60 rounded-full p-1 border border-white/10">
                  <button
                    onClick={() => setDesktopActiveTab('trade')}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                      desktopActiveTab === 'trade'
                        ? "bg-[rgb(163,255,18)] text-black shadow-lg shadow-[rgb(163,255,18)]/30"
                        : "text-white/60 hover:text-white"
                    )}
                  >
                    <ArrowRightLeft className="h-3.5 w-3.5" />
                    Trade
                  </button>
                  <button
                    onClick={() => setDesktopActiveTab('history')}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                      desktopActiveTab === 'history'
                        ? "bg-white text-black shadow-lg"
                        : "text-white/60 hover:text-white"
                    )}
                  >
                    <History className="h-3.5 w-3.5" />
                    History
                    {loadedTrade && (
                      <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-300 text-xs rounded-full">
                        1
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              {desktopActiveTab === 'trade' ? (
                <motion.div
                  key="trade"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Trading Boards - Desktop Layout */}
                  <div className="grid grid-cols-2 gap-8">
                    {/* Your Side */}
                    <div className="p-6 bg-black/20 rounded-xl border border-[rgb(163,255,18)]/10">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-white font-semibold flex items-center gap-2">
                          <div className="w-2 h-2 bg-[rgb(163,255,18)] rounded-full" />
                          Your Offer
                        </h3>
                        <span className="text-xs text-[rgb(163,255,18)]/60">{userBoardNFTs.length}/6 items</span>
                      </div>

                      <div className="grid grid-cols-3 gap-3 min-h-[200px]">
                        <AnimatePresence mode="popLayout">
                          {userBoardNFTs.map((nft) => (
                            <motion.div
                              key={`user-${nft.id}`}
                              layout
                              initial={{ opacity: 0, scale: 0.5, x: -200, rotateY: -90 }}
                              animate={{ opacity: 1, scale: 1, x: 0, rotateY: 0 }}
                              exit={{ opacity: 0, scale: 0.5, x: -200, rotateY: 90 }}
                              transition={{ type: "spring", stiffness: 260, damping: 20 }}
                              whileHover={{ scale: 1.05, z: 10 }}
                              className="relative group aspect-square"
                            >
                              <div className="relative h-full bg-black/40 rounded-lg overflow-hidden border border-white/10 hover:border-[rgb(163,255,18)]/50 transition-all">
                                {!isViewingHistory && (
                                  <button
                                    onClick={() => removeUserNFTFromBoard(nft.id)}
                                    className="absolute top-1 right-1 z-10 w-5 h-5 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="h-3 w-3 text-white" />
                                  </button>
                                )}
                                <MediaRenderer
                                  src={nft.image}
                                  alt={nft.name}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black to-transparent">
                                  <p className="text-[10px] text-white truncate">{nft.name}</p>
                                  {nft.value > 0 ? (
                                    <>
                                      <p className="text-[10px] text-[rgb(163,255,18)]/80 font-mono">
                                        ≈ {nft.value.toFixed(3)} ETH
                                      </p>
                                      <p className="text-[8px] text-white/40">
                                        {nft.collection?.floorPrice && nft.collection.floorPrice > 0 ? 'Floor price' : 'Est. value'}
                                      </p>
                                    </>
                                  ) : (
                                    <p className="text-[8px] text-white/40">Price TBD</p>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>

                        {userBoardNFTs.length === 0 && (
                          <div className="col-span-3 flex items-center justify-center">
                            <div className="text-center">
                              <p className="text-white/40 text-xs">Select NFTs from sidebar</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Their Side */}
                    <div className="p-6 bg-black/20 rounded-xl border border-purple-500/10">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-white font-semibold flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full" />
                          Their Offer
                        </h3>
                        <span className="text-xs text-purple-400/60">{traderBoardNFTs.length}/6 items</span>
                      </div>

                      <div className="grid grid-cols-3 gap-3 min-h-[200px]">
                        <AnimatePresence mode="popLayout">
                          {traderBoardNFTs.map((nft) => (
                            <motion.div
                              key={`trader-${nft.id}`}
                              layout
                              initial={{ opacity: 0, scale: 0.5, x: 200, rotateY: 90 }}
                              animate={{ opacity: 1, scale: 1, x: 0, rotateY: 0 }}
                              exit={{ opacity: 0, scale: 0.5, x: 200, rotateY: -90 }}
                              transition={{ type: "spring", stiffness: 260, damping: 20 }}
                              whileHover={{ scale: 1.05, z: 10 }}
                              className="relative group aspect-square"
                            >
                              <div className="relative h-full bg-black/40 rounded-lg overflow-hidden border border-white/10 hover:border-purple-500/50 transition-all">
                                {!isViewingHistory && (
                                  <button
                                    onClick={() => removeTraderNFTFromBoard(nft.id)}
                                    className="absolute top-1 right-1 z-10 w-5 h-5 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="h-3 w-3 text-white" />
                                  </button>
                                )}
                                <MediaRenderer
                                  src={nft.image}
                                  alt={nft.name}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black to-transparent">
                                  <p className="text-[10px] text-white truncate">{nft.name}</p>
                                  {nft.value > 0 ? (
                                    <>
                                      <p className="text-[10px] text-purple-400/80 font-mono">
                                        ≈ {nft.value.toFixed(3)} ETH
                                      </p>
                                      <p className="text-[8px] text-white/40">
                                        {nft.collection?.floorPrice && nft.collection.floorPrice > 0 ? 'Floor price' : 'Est. value'}
                                      </p>
                                    </>
                                  ) : (
                                    <p className="text-[8px] text-white/40">Price TBD</p>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>

                        {traderBoardNFTs.length === 0 && (
                          <div className="col-span-3 flex items-center justify-center">
                            <div className="text-center">
                              <p className="text-white/40 text-xs">Trader's NFTs</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="history"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <IntegratedTradeHistory
                    key={refreshHistoryKey}
                    searchQuery={searchQuery}
                    viewFilter={viewFilter}
                    onTradeSelect={(trade) => {
                      setSelectedTradeId(trade.id);
                    }}
                    onLoadTrade={(trade) => {
                      loadTradeIntoBoard(trade);
                      setDesktopActiveTab('trade');
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Desktop Message Input Footer */}
          {desktopActiveTab === 'trade' && (
            <div className="p-6 border-t border-white/10 bg-black/60">
              {selectedTrader && (
                <div className="mb-3">
                  <p className="text-xs text-white/60">Trading with <span className="text-white font-medium">{selectedTrader.name}</span></p>
                </div>
              )}
              <div className="flex items-stretch gap-3">
                <div className="flex-1">
                  <Textarea
                    value={desktopMessage}
                    onChange={(e) => setDesktopMessage(e.target.value)}
                    placeholder="Add a message to your trade offer (optional)..."
                    className="w-full bg-black/40 border-white/20 text-white placeholder:text-white/40 resize-none"
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && canSendOffer) {
                        e.preventDefault();
                        sendOffer();
                      }
                    }}
                  />
                  {desktopMessage.length > 0 && (
                    <p className="mt-1 text-xs text-white/40">{desktopMessage.length} characters</p>
                  )}
                </div>
                {/* Action Buttons */}
                {activeTradeId && loadedTrade ? (
                  boardModified ? (
                    // Board has been modified - show Reset and Counter-Offer
                    <div className="flex flex-col gap-3">
                      <div className="flex gap-3">
                        <Button
                          onClick={handleResetBoard}
                          variant="outline"
                          className="flex-1 px-6 bg-white/5 text-white/70 border-white/10 hover:bg-white/10"
                        >
                          <ArrowRightLeft className="h-4 w-4 mr-2" />
                          Reset to Original
                        </Button>
                        <Button
                          onClick={sendOffer}
                          disabled={!canSendOffer}
                          className={cn(
                            "flex-1 px-6",
                            canSendOffer
                              ? "bg-gradient-to-r from-[rgb(163,255,18)] to-green-500 text-black hover:shadow-lg hover:shadow-[rgb(163,255,18)]/30"
                              : "bg-white/10 text-white/40"
                          )}
                        >
                          {isCreating ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Send Counter-Offer
                            </>
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-white/40 text-center">
                        Board modified - Reset to accept/reject original offer
                      </p>
                    </div>
                  ) : (
                    // Board unchanged - show Accept/Reject buttons
                    <div className="flex flex-col gap-3">
                      <div className="flex gap-3">
                        <Button
                          onClick={handleRejectTrade}
                          disabled={isCreating}
                          className="flex-1 px-6 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
                        >
                          {isCreating ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Rejecting...
                            </>
                          ) : (
                            <>
                              <X className="h-4 w-4 mr-2" />
                              Reject
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={handleAcceptTrade}
                          disabled={isCreating}
                          className="flex-1 px-6 bg-gradient-to-r from-[rgb(163,255,18)] to-green-500 text-black hover:shadow-lg hover:shadow-[rgb(163,255,18)]/30"
                        >
                          {isCreating ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Accepting...
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Accept Trade
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )
                ) : (
                  // Show Send Offer button when creating new offer
                  <Button
                    onClick={sendOffer}
                    disabled={!canSendOffer}
                    className={cn(
                      "self-stretch px-6 transition-all min-w-[140px]",
                      canSendOffer
                        ? "bg-gradient-to-r from-[rgb(163,255,18)] to-green-500 text-black hover:shadow-lg hover:shadow-[rgb(163,255,18)]/30"
                        : "bg-white/10 text-white/40"
                    )}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        {activeTradeId ? 'Send Counter-Offer' : 'Send Offer'}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
