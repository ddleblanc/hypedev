"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Plus, Folder, Eye, Heart, Check, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWalletAuthOptimized } from "@/hooks/use-wallet-auth-optimized";
import { MediaRenderer } from "@/components/MediaRenderer";

interface UserList {
  id: string;
  name: string;
  type: string;
  _count: {
    items: number;
  };
}

interface AddToListModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: string;
    type: 'collection' | 'nft' | 'launchpad' | 'user' | 'game';
    name: string;
    image?: string;
    description?: string;
    collectionId?: string;
    metadata?: any;
  };
  onSuccess?: () => void;
}

export function AddToListModal({ isOpen, onClose, item, onSuccess }: AddToListModalProps) {
  const { user } = useWalletAuthOptimized();
  const [lists, setLists] = useState<UserList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [addingToList, setAddingToList] = useState<string | null>(null);
  const [itemInLists, setItemInLists] = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch user's lists and check which ones contain this item
  useEffect(() => {
    const fetchLists = async () => {
      if (!user?.id || !isOpen) return;

      setIsLoading(true);
      try {
        // Fetch all lists
        const listsResponse = await fetch(`/api/lists?userId=${user.id}&type=all`);
        const listsData = await listsResponse.json();

        if (listsData.success) {
          setLists(listsData.lists);

          // Check which lists contain this item
          const checkResponse = await fetch(
            `/api/lists/check?userId=${user.id}&itemType=${item.type}&itemId=${item.id}`
          );
          const checkData = await checkResponse.json();

          if (checkData.success && checkData.lists) {
            const listIds = new Set<string>(checkData.lists.map((l: any) => l.listId));
            setItemInLists(listIds);
          }
        }
      } catch (error) {
        console.error('Error fetching lists:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLists();
  }, [user?.id, item.id, item.type, isOpen]);

  const handleCreateList = async () => {
    if (!user?.id || !newListName.trim()) return;

    setIsCreating(true);
    try {
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name: newListName,
          type: 'custom',
          isPublic: false,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setLists([...lists, data.list]);
        setNewListName('');

        // Automatically add item to the newly created list
        await handleAddToList(data.list.id);
      }
    } catch (error) {
      console.error('Error creating list:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddToList = async (listId: string) => {
    if (!user?.id) return;

    setAddingToList(listId);
    try {
      const isInList = itemInLists.has(listId);

      if (isInList) {
        // Remove from list
        const response = await fetch(
          `/api/lists/items?listId=${listId}&itemType=${item.type}&itemId=${item.id}`,
          { method: 'DELETE' }
        );
        const data = await response.json();

        if (data.success) {
          setItemInLists(prev => {
            const newSet = new Set(prev);
            newSet.delete(listId);
            return newSet;
          });

          // Update the count
          setLists(lists.map(list =>
            list.id === listId
              ? { ...list, _count: { items: list._count.items - 1 } }
              : list
          ));
        }
      } else {
        // Add to list
        const response = await fetch('/api/lists/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            listId,
            itemType: item.type,
            itemId: item.id,
            collectionId: item.collectionId,
            metadata: {
              name: item.name,
              image: item.image,
              description: item.description,
              ...item.metadata,
            },
          }),
        });
        const data = await response.json();

        if (data.success) {
          setItemInLists(prev => new Set(prev).add(listId));

          // Update the count
          setLists(lists.map(list =>
            list.id === listId
              ? { ...list, _count: { items: list._count.items + 1 } }
              : list
          ));

          onSuccess?.();
        }
      }
    } catch (error) {
      console.error('Error toggling list item:', error);
    } finally {
      setAddingToList(null);
    }
  };

  const getListIcon = (type: string) => {
    switch (type) {
      case 'watchlist':
        return Eye;
      case 'favorites':
        return Heart;
      default:
        return Folder;
    }
  };

  if (!isOpen) return null;

  const content = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black text-white">Add to List</h2>
          <p className="text-sm text-white/60 mt-1">Choose which lists to add this item to</p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
          className="text-white hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Item Preview */}
      <div className="flex items-center gap-3 p-3 bg-black/40 rounded-lg border border-white/10 mb-6">
        {item.image && (
          <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
            <MediaRenderer
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold truncate">{item.name}</h3>
          <p className="text-white/60 text-xs capitalize">{item.type}</p>
        </div>
      </div>

      {/* Create New List */}
      <div className="mb-4">
        <div className="flex gap-2">
          <Input
            placeholder="Create new list..."
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCreateList();
              }
            }}
            className="bg-black/60 border-white/20 text-white"
          />
          <Button
            onClick={handleCreateList}
            disabled={!newListName.trim() || isCreating}
            className="bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90"
          >
            {isCreating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Create
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Lists */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="w-6 h-6 text-white/40 animate-spin mx-auto" />
          </div>
        ) : lists.length === 0 ? (
          <div className="text-center py-8">
            <Folder className="w-12 h-12 text-white/10 mx-auto mb-3" />
            <p className="text-white/40 text-sm">No lists yet. Create one above!</p>
          </div>
        ) : (
          lists.map((list) => {
            const Icon = getListIcon(list.type);
            const isInList = itemInLists.has(list.id);
            const isAdding = addingToList === list.id;

            return (
              <motion.button
                key={list.id}
                onClick={() => handleAddToList(list.id)}
                disabled={isAdding}
                className={cn(
                  "w-full text-left p-3 rounded-lg border transition-all",
                  isInList
                    ? "bg-[rgb(163,255,18)]/10 border-[rgb(163,255,18)] text-white"
                    : "bg-black/40 border-white/10 text-white/60 hover:border-white/20 hover:text-white"
                )}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Icon className={cn("w-4 h-4 flex-shrink-0", isInList ? "text-[rgb(163,255,18)]" : "text-white/40")} />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold truncate">{list.name}</h3>
                      <p className={cn("text-xs mt-0.5", isInList ? "text-[rgb(163,255,18)]/60" : "text-white/40")}>
                        {list._count.items} items
                      </p>
                    </div>
                  </div>
                  {isAdding ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[rgb(163,255,18)]" />
                  ) : isInList ? (
                    <Check className="w-4 h-4 text-[rgb(163,255,18)]" />
                  ) : null}
                </div>
              </motion.button>
            );
          })
        )}
      </div>
    </>
  );

  // Mobile bottom sheet
  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />

            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-black border-t border-white/20 rounded-t-2xl p-6 z-50 max-h-[85vh] overflow-y-auto"
            >
              {content}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  // Desktop modal
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-black border border-white/20 rounded-lg p-6 z-50"
          >
            {content}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}