import { useState, useEffect } from 'react';
import { rightSidebarStore } from '@/lib/right-sidebar-store';

export function useRightSidebarStore() {
  const [isOpen, setIsOpen] = useState(rightSidebarStore.getState());

  useEffect(() => {
    const unsubscribe = rightSidebarStore.subscribe(() => {
      setIsOpen(rightSidebarStore.getState());
    });

    return unsubscribe;
  }, []);

  return {
    isRightSidebarOpen: isOpen,
    openRightSidebar: () => rightSidebarStore.open(),
    closeRightSidebar: () => rightSidebarStore.close(),
    toggleRightSidebar: () => rightSidebarStore.toggle()
  };
}