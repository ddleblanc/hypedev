'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, ArrowLeftRight, MessageCircle, History, User } from 'lucide-react';

export type P2PMobileTab = 'hub' | 'chats' | 'history' | 'profile';

interface MobileNavProps {
  activeTab: P2PMobileTab;
  onTabChange: (tab: P2PMobileTab) => void;
  unreadCount?: number;
}

export function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
  const router = useRouter();

  const tabs = [
    { id: 'home', icon: Home, isHome: true },
    { id: 'hub' as P2PMobileTab, icon: ArrowLeftRight },
    { id: 'chats' as P2PMobileTab, icon: MessageCircle },
    { id: 'history' as P2PMobileTab, icon: History },
    { id: 'profile' as P2PMobileTab, icon: User },
  ];

  const handleTabClick = (tabId: string) => {
    if (tabId === 'home') {
      router.push('/');
    } else {
      onTabChange(tabId as P2PMobileTab);
    }
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-30">
      <div className="bg-black/60 backdrop-blur-xl border-t border-white/10">
        <div className="grid grid-cols-5">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab && !tab.isHome;
            const Icon = tab.icon;

            return (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleTabClick(tab.id)}
                className={`flex flex-col items-center py-3 ${
                  isActive ? 'text-[rgb(163,255,18)]' : 'text-white/60'
                } transition-colors group`}
              >
                <Icon className="w-6 h-6 mb-1 group-active:scale-110 transition-transform" />
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
