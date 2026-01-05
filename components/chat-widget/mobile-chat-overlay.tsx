'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import {
  X,
  ChevronLeft,
  Send,
  Wifi,
  WifiOff,
  Loader2,
  Plus,
  Image as ImageIcon,
  MessageSquare,
  Users,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChat, ChatTab } from '@/contexts/chat-context';
import { useChatStream } from '@/hooks/use-chat-stream';
import { useWhispers, type AttachedNftData } from '@/hooks/use-whispers';
import { useClanChat } from '@/hooks/use-clan-chat';
import { NftAttachment } from './nft-attachment';
import { NftPicker } from './nft-picker';
import { formatDistanceToNow } from 'date-fns';
import { useActiveAccount } from 'thirdweb/react';

const TABS: { id: ChatTab; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'world', label: 'World', icon: Globe, color: 'text-amber-400' },
  { id: 'clan', label: 'Clan', icon: Users, color: 'text-emerald-400' },
  { id: 'whispers', label: 'DMs', icon: MessageSquare, color: 'text-purple-400' },
];

interface MobileChatOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SelectedNftForAttachment {
  id: string;
  name: string;
  image: string;
  tokenId: string;
  collectionId: string;
  collection?: { name: string; symbol: string };
  rarityTier?: string | null;
}

export function MobileChatOverlay({ isOpen, onClose }: MobileChatOverlayProps) {
  const account = useActiveAccount();
  const {
    activeTab,
    setTab,
    unreadCounts,
    connectionStatus,
    worldMessages,
    currentClan,
    clanMessages,
    clanConnectionStatus,
  } = useChat();

  const {
    conversations,
    activeConversation,
    setActiveConversation,
    messages: whisperMessages,
    friends,
    isConnected: whisperConnected,
    loadingConversations,
    loadingMessages,
    sendMessage: sendWhisper,
    startConversation,
    isSending: isWhisperSending,
    isStartingConversation,
  } = useWhispers();

  const {
    sendMessage: sendClanMessage,
    isSending: isClanSending,
  } = useClanChat();

  // Connect to streams
  useChatStream();

  // Local state
  const [inputValue, setInputValue] = useState('');
  const [showNftPicker, setShowNftPicker] = useState(false);
  const [attachedNft, setAttachedNft] = useState<SelectedNftForAttachment | null>(null);
  const [showFriendsList, setShowFriendsList] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Find active conversation details
  const activeConvo = conversations.find((c) => c.id === activeConversation);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [whisperMessages, clanMessages, worldMessages]);

  // Swipe to close
  const handleDragEnd = useCallback((_: unknown, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    }
  }, [onClose]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const content = inputValue;
    setInputValue('');

    if (activeTab === 'whispers' && activeConversation) {
      const nftId = attachedNft?.id;
      setAttachedNft(null);
      await sendWhisper(content, nftId);
    } else if (activeTab === 'clan' && currentClan) {
      await sendClanMessage(content);
    }

    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStartConversation = async (friendId: string) => {
    await startConversation(friendId);
    setShowFriendsList(false);
  };

  const handleNftSelect = (nft: SelectedNftForAttachment) => {
    setAttachedNft(nft);
  };

  const handleBack = () => {
    if (showFriendsList) {
      setShowFriendsList(false);
    } else if (activeConversation) {
      setActiveConversation(null);
    }
  };

  const getConnectionStatus = () => {
    if (activeTab === 'whispers') return whisperConnected ? 'connected' : 'disconnected';
    if (activeTab === 'clan') return clanConnectionStatus;
    return connectionStatus;
  };

  const currentConnectionStatus = getConnectionStatus();

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      className="fixed top-16 left-0 right-0 bottom-0 z-[45] bg-black/70 backdrop-blur-xl border-t border-white/10 flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label="Chat"
    >
      {/* Drag Handle */}
      <div className="flex justify-center pt-3 pb-2">
        <div className="w-12 h-1 rounded-full bg-white/30" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-3">
          {(activeConversation || showFriendsList) && (
            <button
              onClick={handleBack}
              className="p-2 -ml-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Go back"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
          )}
          <h1 className="text-white font-bold text-lg">
            {activeConversation
              ? activeConvo?.friend?.username || 'Chat'
              : showFriendsList
              ? 'New Message'
              : 'Chat'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Connection status */}
          <div
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-full text-xs',
              currentConnectionStatus === 'connected' && 'bg-emerald-500/20 text-emerald-400',
              currentConnectionStatus === 'connecting' && 'bg-amber-500/20 text-amber-400',
              currentConnectionStatus === 'disconnected' && 'bg-red-500/20 text-red-400'
            )}
          >
            {currentConnectionStatus === 'connected' ? (
              <Wifi className="w-3 h-3" />
            ) : (
              <WifiOff className="w-3 h-3" />
            )}
            <span className="capitalize">{currentConnectionStatus}</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close chat"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Tab Bar - Only show when not in conversation */}
      {!activeConversation && !showFriendsList && (
        <div className="flex border-b border-white/10">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-3 relative transition-colors',
                  activeTab === tab.id ? tab.color : 'text-white/50'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{tab.label}</span>
                {unreadCounts[tab.id] > 0 && (
                  <span className="absolute top-2 right-1/4 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCounts[tab.id] > 9 ? '9+' : unreadCounts[tab.id]}
                  </span>
                )}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="tab-indicator"
                    className={cn(
                      'absolute bottom-0 left-0 right-0 h-0.5',
                      tab.id === 'world' && 'bg-amber-400',
                      tab.id === 'clan' && 'bg-emerald-400',
                      tab.id === 'whispers' && 'bg-purple-400'
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {/* World Tab */}
        {activeTab === 'world' && !activeConversation && !showFriendsList && (
          <div className="p-4 space-y-2">
            {worldMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Globe className="w-12 h-12 text-amber-400/30 mb-3" />
                <p className="text-white/50">No world messages yet</p>
              </div>
            ) : (
              worldMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="p-3 rounded-lg bg-white/5 border border-amber-500/20"
                >
                  <div className="text-amber-400 text-sm">{msg.content}</div>
                  <div className="text-white/30 text-xs mt-1">
                    {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Clan Tab */}
        {activeTab === 'clan' && !activeConversation && !showFriendsList && (
          <div className="flex flex-col h-full">
            {!currentClan ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <Users className="w-12 h-12 text-emerald-400/30 mb-3" />
                <h3 className="text-white font-medium mb-2">No Clan</h3>
                <p className="text-white/50 text-sm">
                  Join a clan to chat with your clanmates
                </p>
              </div>
            ) : (
              <>
                <div className="p-3 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="text-emerald-400 font-bold">[{currentClan.tag}]</div>
                    <div className="text-white/80 font-medium">{currentClan.name}</div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {clanMessages.map((msg) => (
                    <div key={msg.id} className="text-sm">
                      <span className="text-emerald-400 font-medium">
                        {msg.sender.username || 'Anonymous'}:
                      </span>{' '}
                      <span className="text-white/70">{msg.content}</span>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </>
            )}
          </div>
        )}

        {/* Whispers Tab */}
        {activeTab === 'whispers' && (
          <>
            {/* Friends List for New Message */}
            {showFriendsList && (
              <div className="p-4 space-y-2">
                {friends.length === 0 ? (
                  <div className="text-center py-8 text-white/30 text-sm">
                    No friends yet. Follow users to become friends (mutual follows).
                  </div>
                ) : (
                  friends.map((friend) => (
                    <button
                      key={friend.id}
                      onClick={() => handleStartConversation(friend.id)}
                      disabled={isStartingConversation}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-full bg-purple-500/30 flex items-center justify-center overflow-hidden">
                        {friend.avatar ? (
                          <img src={friend.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-purple-400 font-bold">
                            {friend.username?.[0]?.toUpperCase() || '?'}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-white font-medium">{friend.username || 'Anonymous'}</div>
                        <div className="text-white/40 text-xs truncate">
                          {friend.walletAddress.slice(0, 6)}...{friend.walletAddress.slice(-4)}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Conversation View */}
            {activeConversation && activeConvo && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMessages ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                  </div>
                ) : whisperMessages.length === 0 ? (
                  <div className="text-center py-8 text-white/30">Start the conversation!</div>
                ) : (
                  whisperMessages.map((message) => {
                    const isFromFriend = message.sender.id === activeConvo.friend?.id;
                    const isOwnMessage = !isFromFriend;

                    return (
                      <div
                        key={message.id}
                        className={cn(
                          'max-w-[80%] rounded-2xl p-3',
                          isOwnMessage
                            ? 'ml-auto bg-purple-500/30 rounded-br-sm'
                            : 'mr-auto bg-white/10 rounded-bl-sm'
                        )}
                      >
                        <div className="text-white text-sm">{message.content}</div>
                        {message.attachedNft && (
                          <div className="mt-2">
                            <NftAttachment
                              nft={{
                                id: message.attachedNft.id,
                                name: message.attachedNft.name,
                                image: message.attachedNft.image,
                                tokenId: message.attachedNft.tokenId,
                                collectionId: message.attachedNft.collectionId,
                                ownerAddress: message.attachedNft.ownerAddress || undefined,
                                rarityTier: message.attachedNft.rarityTier || undefined,
                                listingPrice: message.attachedNft.listingPrice,
                                collection: message.attachedNft.collection
                                  ? {
                                      name: message.attachedNft.collection.name,
                                      symbol: message.attachedNft.collection.symbol,
                                      image: message.attachedNft.collection.image || undefined,
                                      floorPrice: message.attachedNft.collection.floorPrice || undefined,
                                    }
                                  : undefined,
                              }}
                              senderAddress={message.sender.walletAddress || ''}
                              senderUsername={message.sender.username}
                              isOwnMessage={isOwnMessage}
                            />
                          </div>
                        )}
                        <div className="text-white/30 text-[10px] mt-1">
                          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Conversation List */}
            {!activeConversation && !showFriendsList && (
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-white/60 text-sm font-medium">Messages</h2>
                  <button
                    onClick={() => setShowFriendsList(true)}
                    className="p-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {loadingConversations ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <MessageSquare className="w-12 h-12 text-purple-400/30 mb-3" />
                    <p className="text-white/50 mb-4">No conversations yet</p>
                    <button
                      onClick={() => setShowFriendsList(true)}
                      className="px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400 font-medium hover:bg-purple-500/30 transition-colors"
                    >
                      Start a Conversation
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {conversations.map((convo) => (
                      <button
                        key={convo.id}
                        onClick={() => setActiveConversation(convo.id)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
                      >
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-purple-500/30 flex items-center justify-center overflow-hidden">
                            {convo.friend?.avatar ? (
                              <img
                                src={convo.friend.avatar}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-purple-400 font-bold">
                                {convo.friend?.username?.[0]?.toUpperCase() || '?'}
                              </span>
                            )}
                          </div>
                          {convo.unreadCount > 0 && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                              <span className="text-[10px] font-bold text-white">
                                {convo.unreadCount}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="text-white font-medium truncate">
                            {convo.friend?.username || 'Anonymous'}
                          </div>
                          {convo.lastMessage && (
                            <div className="text-white/40 text-sm truncate">
                              {convo.lastMessage.content}
                            </div>
                          )}
                        </div>
                        {convo.lastMessage && (
                          <div className="text-white/30 text-xs">
                            {formatDistanceToNow(new Date(convo.lastMessage.createdAt), {
                              addSuffix: false,
                            })}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Input Area - Only show for clan chat or active whisper conversation */}
      {((activeTab === 'clan' && currentClan) ||
        (activeTab === 'whispers' && activeConversation)) && (
        <div className="flex-shrink-0 border-t border-white/10 p-4 bg-white/5 backdrop-blur-md">
          {/* Attachment Preview */}
          {attachedNft && (
            <div className="flex items-center gap-2 p-2 mb-2 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <img
                src={attachedNft.image}
                alt={attachedNft.name}
                className="w-10 h-10 rounded object-cover"
              />
              <div className="flex-1 min-w-0">
                <div className="text-white text-xs font-medium truncate">{attachedNft.name}</div>
              </div>
              <button
                onClick={() => setAttachedNft(null)}
                className="p-1 rounded hover:bg-white/10 text-white/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-3">
            {activeTab === 'whispers' && (
              <button
                onClick={() => setShowNftPicker(true)}
                className={cn(
                  'p-3 rounded-xl transition-colors',
                  attachedNft
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'bg-white/5 text-white/50 hover:bg-white/10'
                )}
                aria-label="Attach NFT"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
            )}
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={activeTab === 'clan' ? 'Message clan...' : 'Message...'}
              maxLength={500}
              className={cn(
                'flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white',
                'placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50'
              )}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isWhisperSending || isClanSending}
              className={cn(
                'p-3 rounded-xl transition-all',
                'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
                'disabled:opacity-30 disabled:cursor-not-allowed'
              )}
            >
              {isWhisperSending || isClanSending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* NFT Picker Modal */}
      <AnimatePresence>
        {showNftPicker && (
          <NftPicker
            isOpen={showNftPicker}
            onClose={() => setShowNftPicker(false)}
            onSelect={handleNftSelect}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
