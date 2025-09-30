"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useWalletAuthOptimized } from "@/hooks/use-wallet-auth-optimized";

interface ListItem {
  id: string;
  itemType: string;
  itemId: string;
  metadata: any;
  addedAt: string;
}

interface UserList {
  id: string;
  name: string;
  description?: string;
  type: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  items: ListItem[];
  _count: {
    items: number;
  };
}

interface ListsContextType {
  lists: UserList[];
  selectedList: UserList | null;
  isCreatingList: boolean;
  newListName: string;
  isLoading: boolean;
  setSelectedList: (list: UserList | null) => void;
  setIsCreatingList: (value: boolean) => void;
  setNewListName: (name: string) => void;
  handleCreateList: () => Promise<void>;
  handleDeleteList: (listId: string) => Promise<void>;
  handleRemoveItem: (listId: string, itemType: string, itemId: string) => Promise<void>;
  refreshLists: () => Promise<void>;
}

const ListsContext = createContext<ListsContextType | undefined>(undefined);

export function ListsProvider({ children }: { children: ReactNode }) {
  const { user } = useWalletAuthOptimized();
  const [lists, setLists] = useState<UserList[]>([]);
  const [selectedList, setSelectedList] = useState<UserList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListName, setNewListName] = useState('');

  // Fetch all lists
  const fetchLists = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/lists?userId=${user.id}&type=all`);
      const data = await response.json();

      if (data.success) {
        setLists(data.lists);
        // Auto-select watchlist if it exists and no list is selected
        if (!selectedList) {
          const watchlist = data.lists.find((l: UserList) => l.type === 'watchlist');
          if (watchlist) {
            setSelectedList(watchlist);
          }
        } else {
          // Update selected list with fresh data
          const updatedSelected = data.lists.find((l: UserList) => l.id === selectedList.id);
          if (updatedSelected) {
            setSelectedList(updatedSelected);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching lists:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, [user?.id]);

  const handleCreateList = async () => {
    if (!user?.id || !newListName.trim()) return;

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
        setIsCreatingList(false);
        setSelectedList(data.list); // Auto-select the new list
      }
    } catch (error) {
      console.error('Error creating list:', error);
    }
  };

  const handleDeleteList = async (listId: string) => {
    if (!user?.id) return;

    if (!confirm('Are you sure you want to delete this list?')) return;

    try {
      const response = await fetch(`/api/lists?listId=${listId}&userId=${user.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setLists(lists.filter(l => l.id !== listId));
        if (selectedList?.id === listId) {
          setSelectedList(lists.find(l => l.type === 'watchlist') || null);
        }
      }
    } catch (error) {
      console.error('Error deleting list:', error);
    }
  };

  const handleRemoveItem = async (listId: string, itemType: string, itemId: string) => {
    try {
      const response = await fetch(
        `/api/lists/items?listId=${listId}&itemType=${itemType}&itemId=${itemId}`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (data.success) {
        // Update the selected list
        if (selectedList && selectedList.id === listId) {
          setSelectedList({
            ...selectedList,
            items: selectedList.items.filter(item => !(item.itemType === itemType && item.itemId === itemId)),
            _count: { items: selectedList._count.items - 1 }
          });
        }

        // Update the lists array
        setLists(lists.map(list => {
          if (list.id === listId) {
            return {
              ...list,
              items: list.items.filter(item => !(item.itemType === itemType && item.itemId === itemId)),
              _count: { items: list._count.items - 1 }
            };
          }
          return list;
        }));
      }
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const value: ListsContextType = {
    lists,
    selectedList,
    isCreatingList,
    newListName,
    isLoading,
    setSelectedList,
    setIsCreatingList,
    setNewListName,
    handleCreateList,
    handleDeleteList,
    handleRemoveItem,
    refreshLists: fetchLists,
  };

  return <ListsContext.Provider value={value}>{children}</ListsContext.Provider>;
}

export function useLists() {
  const context = useContext(ListsContext);
  if (context === undefined) {
    throw new Error('useLists must be used within a ListsProvider');
  }
  return context;
}