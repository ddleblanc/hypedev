'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useStudioNew, type StudioTab } from '@/contexts/studio-new-context';
import { useStudioData } from '@/hooks/use-studio-data';
import { LayoutGrid, FolderKanban, Plus, Megaphone } from 'lucide-react';
import { OverviewTab } from './tabs/overview-tab';
import { ProjectsTab } from './tabs/projects-tab';
import { CreateTab } from './tabs/create-tab';
import { CampaignsTab } from './tabs/campaigns-tab';
import { SkipLink, ErrorBoundary, ErrorFallback } from './shared';

// =============================================================================
// Tab Configuration
// =============================================================================

const tabs = [
  { id: 'overview' as const, label: 'Overview', icon: LayoutGrid },
  { id: 'projects' as const, label: 'Projects', icon: FolderKanban },
  { id: 'create' as const, label: 'Create', icon: Plus },
  { id: 'campaigns' as const, label: 'Campaigns', icon: Megaphone },
] as const;

// =============================================================================
// Props
// =============================================================================

interface StudioShellProps {
  children?: React.ReactNode;
}

// =============================================================================
// Component
// =============================================================================

export function StudioShell({ children }: StudioShellProps) {
  const { state, setTab, setLoading } = useStudioNew();
  const { isLoading } = useStudioData();

  // Sync loading state from data hook
  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  return (
    <div className="min-h-screen">
      {/* Skip Link for Accessibility */}
      <SkipLink targetId="studio-main-content" />

      {/* Header with tabs */}
      <header className="sticky top-0 z-40 border-b border-studio-border bg-studio-bg/80 backdrop-blur-xl" role="banner">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo/Title */}
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-studio-text">Studio</h1>
              {state.creatorTier !== 'starter' && (
                <span className="rounded-full bg-studio-accent/10 px-2.5 py-0.5 text-xs font-medium text-studio-accent capitalize">
                  {state.creatorTier}
                </span>
              )}
            </div>

            {/* Tab Navigation - Desktop */}
            <nav
              className="hidden sm:flex items-center gap-1"
              role="navigation"
              aria-label="Studio tabs"
            >
              <div role="tablist" className="flex items-center gap-1">
                {tabs.map((tab) => {
                  const isActive = state.activeTab === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setTab(tab.id)}
                      role="tab"
                      aria-selected={isActive}
                      aria-controls={`studio-tab-panel-${tab.id}`}
                      className={cn(
                        'relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-studio-accent focus-visible:ring-offset-2 focus-visible:ring-offset-studio-bg',
                        isActive
                          ? 'text-studio-text'
                          : 'text-studio-text-muted hover:text-studio-text hover:bg-studio-surface'
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      {tab.label}
                      {isActive && (
                        <motion.div
                          layoutId="studioActiveTab"
                          className="absolute inset-0 rounded-lg bg-studio-surface"
                          style={{ zIndex: -1 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </nav>

            {/* Mobile active tab indicator */}
            <div className="sm:hidden text-sm font-medium text-studio-text-muted">
              {tabs.find((t) => t.id === state.activeTab)?.label}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main
        id="studio-main-content"
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6"
        role="main"
        aria-label="Studio content"
      >
        <ErrorBoundary>
          <AnimatePresence mode="wait">
            <motion.div
              key={state.activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Tab content */}
              {children ?? (
                <>
                  {state.activeTab === 'overview' && <OverviewTab />}
                  {state.activeTab === 'projects' && <ProjectsTab />}
                  {state.activeTab === 'create' && <CreateTab />}
                  {state.activeTab === 'campaigns' && <CampaignsTab />}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </ErrorBoundary>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-studio-border bg-studio-bg/80 backdrop-blur-xl sm:hidden safe-area-bottom"
        role="navigation"
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-around h-16" role="tablist">
          {tabs.map((tab) => {
            const isActive = state.activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                role="tab"
                aria-selected={isActive}
                aria-controls={`studio-tab-panel-${tab.id}`}
                className={cn(
                  'relative flex flex-col items-center gap-1 px-6 py-2 transition-colors min-w-[80px]',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-studio-accent focus-visible:ring-offset-2 focus-visible:ring-offset-studio-bg rounded-lg',
                  isActive ? 'text-studio-accent' : 'text-studio-text-muted'
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className="text-xs font-medium">{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="studioMobileActiveTab"
                    className="absolute bottom-0 h-0.5 w-12 bg-studio-accent rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Safe area spacer for mobile bottom nav */}
      <div className="h-16 sm:hidden" aria-hidden="true" />
    </div>
  );
}

