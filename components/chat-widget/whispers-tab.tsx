'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  ChevronLeft,
  MessageSquare,
  Users,
  Wifi,
  WifiOff,
  Loader2,
  Plus,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWhispers, type AttachedNftData } from '@/hooks/use-whispers';
import { formatDistanceToNow } from 'date-fns';
import { NftAttachment, type AttachedNft } from './nft-attachment';
import { NftPicker } from './nft-picker';
import { useActiveAccount } from 'thirdweb/react';

interface SelectedNftForAttachment {
  id: string;
  name: string;
  image: string;
  tokenId: string;
  collectionId: string;
  collection?: { name: string; symbol: string };
  rarityTier?: string | null;
}

export function WhispersTab() {
  const account = useActiveAccount();
  const {
    conversations,
    activeConversation,
    setActiveConversation,
    messages,
    friends,
    isConnected,
    loadingConversations,
    loadingMessages,
    sendMessage,
    startConversation,
    isSending,
    isStartingConversation,
    totalUnread,
  } = useWhispers();

  const [inputValue, setInputValue] = useState('');
  const [showFriendsList, setShowFriendsList] = useState(false);
  const [showNftPicker, setShowNftPicker] = useState(false);
  const [attachedNft, setAttachedNft] = useState<SelectedNftForAttachment | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Find active conversation details
  const activeConvo = conversations.find((c) => c.id === activeConversation);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return;

    const content = inputValue;
    const nftId = attachedNft?.id;
    setInputValue('');
    setAttachedNft(null);
    await sendMessage(content, nftId);
    inputRef.current?.focus();
  };

  const handleNftSelect = (nft: SelectedNftForAttachment) => {
    setAttachedNft(nft);
  };

  const handleRemoveAttachment = () => {
    setAttachedNft(null);
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

  // Friends list view - for starting new conversations
  if (showFriendsList) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
          <button
            onClick={() => setShowFriendsList(false)}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-white/60" />
          </button>
          <span className="text-white/80 text-sm font-medium">New Message</span>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-white/10">
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
                className={cn(
                  "w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors",
                  isStartingConversation && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="w-8 h-8 rounded-full bg-purple-500/30 flex items-center justify-center overflow-hidden">
                  {friend.avatar ? (
                    <img
                      src={friend.avatar}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-purple-400 text-xs font-bold">
                      {friend.username?.[0]?.toUpperCase() || '?'}
                    </span>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <div className="text-white/90 text-sm font-medium">
                    {friend.username || 'Anonymous'}
                  </div>
                  <div className="text-white/40 text-xs truncate">
                    {friend.walletAddress.slice(0, 6)}...{friend.walletAddress.slice(-4)}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  // Conversation view - chat with selected friend
  if (activeConversation && activeConvo) {
    return (
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
          <button
            onClick={() => setActiveConversation(null)}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-white/60" />
          </button>
          <div className="w-6 h-6 rounded-full bg-purple-500/30 flex items-center justify-center overflow-hidden">
            {activeConvo.friend?.avatar ? (
              <img
                src={activeConvo.friend.avatar}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-purple-400 text-[10px] font-bold">
                {activeConvo.friend?.username?.[0]?.toUpperCase() || '?'}
              </span>
            )}
          </div>
          <span className="text-white/80 text-sm font-medium truncate">
            {activeConvo.friend?.username || 'Anonymous'}
          </span>
          <div className="ml-auto">
            {isConnected ? (
              <Wifi className="w-3 h-3 text-purple-400" />
            ) : (
              <WifiOff className="w-3 h-3 text-red-400" />
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-white/10">
          {loadingMessages ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-white/30 text-sm">
              Start the conversation!
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((message) => {
                const isFromFriend = message.sender.id === activeConvo.friend?.id;
                const isOwnMessage = !isFromFriend;

                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm"
                  >
                    <div className="flex items-start gap-1">
                      <span className="text-purple-400 font-medium shrink-0">
                        {isFromFriend ? 'From' : 'To'}{' '}
                        {message.sender.username || 'Anonymous'}:
                      </span>
                      <span className="text-white/70 break-words">{message.content}</span>
                    </div>
                    {/* NFT Attachment */}
                    {message.attachedNft && (
                      <div className="mt-2 ml-0">
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
                            collection: message.attachedNft.collection ? {
                              name: message.attachedNft.collection.name,
                              symbol: message.attachedNft.collection.symbol,
                              image: message.attachedNft.collection.image || undefined,
                              floorPrice: message.attachedNft.collection.floorPrice || undefined,
                            } : undefined,
                          }}
                          senderAddress={message.sender.walletAddress || ''}
                          senderUsername={message.sender.username}
                          isOwnMessage={isOwnMessage}
                        />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Attachment Preview */}
        {attachedNft && (
          <div className="px-2 pt-2 border-t border-white/5">
            <div className="flex items-center gap-2 p-2 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <img
                src={attachedNft.image}
                alt={attachedNft.name}
                className="w-10 h-10 rounded object-cover"
              />
              <div className="flex-1 min-w-0">
                <div className="text-white text-xs font-medium truncate">{attachedNft.name}</div>
                <div className="text-white/50 text-[10px] truncate">
                  {attachedNft.collection?.name || 'Unknown Collection'}
                </div>
              </div>
              <button
                onClick={handleRemoveAttachment}
                className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                aria-label="Remove attachment"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-2 border-t border-white/5">
          <div className="flex items-center gap-2">
            {/* NFT Attach Button */}
            <button
              onClick={() => setShowNftPicker(true)}
              className={cn(
                "p-2 rounded-lg text-white/50 hover:text-purple-400 hover:bg-purple-500/10 transition-colors",
                attachedNft && "text-purple-400 bg-purple-500/10"
              )}
              title="Attach NFT"
              aria-label="Attach NFT"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={attachedNft ? "Add a message..." : "Whisper..."}
              maxLength={500}
              disabled={isSending}
              className={cn(
                "flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white",
                "placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-purple-500/50",
                "disabled:opacity-50"
              )}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isSending}
              className={cn(
                "p-2 rounded-lg bg-purple-500/20 text-purple-400",
                "hover:bg-purple-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              )}
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

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
      </div>
    );
  }

  // Conversation list view - default view
  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-purple-400" />
          <span className="text-white/80 text-sm font-medium">Whispers</span>
          {totalUnread > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-purple-500 text-[10px] font-bold text-white">
              {totalUnread}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {isConnected ? (
            <Wifi className="w-3 h-3 text-purple-400" />
          ) : (
            <WifiOff className="w-3 h-3 text-red-400" />
          )}
          <button
            onClick={() => setShowFriendsList(true)}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            title="New message"
          >
            <Plus className="w-4 h-4 text-purple-400" />
          </button>
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-white/10">
        {loadingConversations ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Users className="w-10 h-10 text-purple-400/50 mb-3" />
            <p className="text-white/50 text-sm mb-3">No conversations yet</p>
            <button
              onClick={() => setShowFriendsList(true)}
              className={cn(
                "px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400",
                "text-sm font-medium hover:bg-purple-500/30 transition-colors"
              )}
            >
              Start a Conversation
            </button>
          </div>
        ) : (
          conversations.map((convo) => (
            <button
              key={convo.id}
              onClick={() => setActiveConversation(convo.id)}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-purple-500/30 flex items-center justify-center overflow-hidden">
                  {convo.friend?.avatar ? (
                    <img
                      src={convo.friend.avatar}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-purple-400 text-sm font-bold">
                      {convo.friend?.username?.[0]?.toUpperCase() || '?'}
                    </span>
                  )}
                </div>
                {convo.unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                    <span className="text-[9px] font-bold text-white">
                      {convo.unreadCount}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="text-white/90 text-sm font-medium truncate">
                  {convo.friend?.username || 'Anonymous'}
                </div>
                {convo.lastMessage && (
                  <div className="text-white/40 text-xs truncate">
                    {convo.lastMessage.content}
                  </div>
                )}
              </div>
              {convo.lastMessage && (
                <div className="text-white/30 text-[10px]">
                  {formatDistanceToNow(new Date(convo.lastMessage.createdAt), {
                    addSuffix: false,
                  })}
                </div>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
