"use client";

import {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useCallback,
  useMemo,
} from 'react';

// Types
export type StudioView = 'dashboard' | 'projects' | 'collections' | 'nfts' | 'activity' | 'analytics' | 'settings' | 'lootbox';

export type ViewMode = 'grid' | 'list';

export type ContractType = 'DropERC721' | 'TokenERC721' | 'OpenEditionERC721' | 'DropERC1155';

export type CollectionStatus = 'draft' | 'active' | 'live' | 'paused';

export interface StudioFilters {
  search: string;
  status: CollectionStatus[];
  contractType: ContractType[];
  chain: number[];
  dateRange: 'all' | '7d' | '30d' | '90d' | '1y';
}

export interface StudioModals {
  createProject: boolean;
  createCollection: boolean;
  createNft: boolean;
  bulkActions: boolean;
  editCollection: string | null; // collection ID or null
  nftDetail: string | null; // NFT ID or null
}

export interface StudioSelection {
  projects: Set<string>;
  collections: Set<string>;
  nfts: Set<string>;
}

interface StudioState {
  // Creator Status
  isVerified: boolean;
  creatorTier: 'starter' | 'pro' | 'enterprise';

  // Active View
  activeView: StudioView;
  viewMode: ViewMode;

  // Filters
  filters: StudioFilters;

  // Modals
  modals: StudioModals;

  // Selection (for bulk operations)
  selection: StudioSelection;

  // Data (populated by useStudioData hook)
  projects: any[];
  collections: any[];
  nfts: any[];
  isLoading: boolean;
  error: string | null;
}

// Action Types
type StudioAction =
  | { type: 'SET_VIEW'; view: StudioView }
  | { type: 'SET_VIEW_MODE'; mode: ViewMode }
  | { type: 'SET_FILTER'; key: keyof StudioFilters; value: StudioFilters[keyof StudioFilters] }
  | { type: 'RESET_FILTERS' }
  | { type: 'OPEN_MODAL'; modal: keyof StudioModals; value?: string }
  | { type: 'CLOSE_MODAL'; modal: keyof StudioModals }
  | { type: 'CLOSE_ALL_MODALS' }
  | { type: 'TOGGLE_SELECT'; entityType: 'projects' | 'collections' | 'nfts'; id: string }
  | { type: 'SELECT_ALL'; entityType: 'projects' | 'collections' | 'nfts'; ids: string[] }
  | { type: 'CLEAR_SELECTION'; entityType?: 'projects' | 'collections' | 'nfts' }
  | { type: 'SET_DATA'; key: 'projects' | 'collections' | 'nfts'; data: any[] }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_CREATOR_STATUS'; isVerified: boolean; tier?: 'starter' | 'pro' | 'enterprise' };

// Initial State
const initialFilters: StudioFilters = {
  search: '',
  status: [],
  contractType: [],
  chain: [],
  dateRange: 'all',
};

const initialModals: StudioModals = {
  createProject: false,
  createCollection: false,
  createNft: false,
  bulkActions: false,
  editCollection: null,
  nftDetail: null,
};

const initialSelection: StudioSelection = {
  projects: new Set(),
  collections: new Set(),
  nfts: new Set(),
};

const initialState: StudioState = {
  isVerified: false,
  creatorTier: 'starter',
  activeView: 'dashboard',
  viewMode: 'grid',
  filters: initialFilters,
  modals: initialModals,
  selection: initialSelection,
  projects: [],
  collections: [],
  nfts: [],
  isLoading: true,
  error: null,
};

// Reducer
function studioReducer(state: StudioState, action: StudioAction): StudioState {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, activeView: action.view };

    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.mode };

    case 'SET_FILTER':
      return {
        ...state,
        filters: { ...state.filters, [action.key]: action.value },
      };

    case 'RESET_FILTERS':
      return { ...state, filters: initialFilters };

    case 'OPEN_MODAL':
      if (action.modal === 'editCollection' || action.modal === 'nftDetail') {
        return {
          ...state,
          modals: { ...state.modals, [action.modal]: action.value || null },
        };
      }
      return {
        ...state,
        modals: { ...state.modals, [action.modal]: true },
      };

    case 'CLOSE_MODAL':
      if (action.modal === 'editCollection' || action.modal === 'nftDetail') {
        return {
          ...state,
          modals: { ...state.modals, [action.modal]: null },
        };
      }
      return {
        ...state,
        modals: { ...state.modals, [action.modal]: false },
      };

    case 'CLOSE_ALL_MODALS':
      return { ...state, modals: initialModals };

    case 'TOGGLE_SELECT': {
      const newSet = new Set(state.selection[action.entityType]);
      if (newSet.has(action.id)) {
        newSet.delete(action.id);
      } else {
        newSet.add(action.id);
      }
      return {
        ...state,
        selection: { ...state.selection, [action.entityType]: newSet },
      };
    }

    case 'SELECT_ALL': {
      return {
        ...state,
        selection: {
          ...state.selection,
          [action.entityType]: new Set(action.ids),
        },
      };
    }

    case 'CLEAR_SELECTION':
      if (action.entityType) {
        return {
          ...state,
          selection: {
            ...state.selection,
            [action.entityType]: new Set(),
          },
        };
      }
      return { ...state, selection: initialSelection };

    case 'SET_DATA':
      return { ...state, [action.key]: action.data };

    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading };

    case 'SET_ERROR':
      return { ...state, error: action.error };

    case 'SET_CREATOR_STATUS':
      return {
        ...state,
        isVerified: action.isVerified,
        creatorTier: action.tier || state.creatorTier,
      };

    default:
      return state;
  }
}

// Context
interface StudioContextValue {
  state: StudioState;
  dispatch: React.Dispatch<StudioAction>;
  // Convenience methods
  setView: (view: StudioView) => void;
  setViewMode: (mode: ViewMode) => void;
  setFilter: <K extends keyof StudioFilters>(key: K, value: StudioFilters[K]) => void;
  resetFilters: () => void;
  openModal: (modal: keyof StudioModals, value?: string) => void;
  closeModal: (modal: keyof StudioModals) => void;
  closeAllModals: () => void;
  toggleSelect: (entityType: 'projects' | 'collections' | 'nfts', id: string) => void;
  selectAll: (entityType: 'projects' | 'collections' | 'nfts', ids: string[]) => void;
  clearSelection: (entityType?: 'projects' | 'collections' | 'nfts') => void;
  setData: (key: 'projects' | 'collections' | 'nfts', data: any[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setCreatorStatus: (isVerified: boolean, tier?: 'starter' | 'pro' | 'enterprise') => void;
  // Computed values
  hasSelection: boolean;
  selectedCount: number;
  hasActiveFilters: boolean;
  // Legacy compatibility
  studioData: {
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
    viewMode?: ViewMode;
    onViewModeChange?: (mode: ViewMode) => void;
    projects: any[];
    collections: any[];
    nfts: any[];
    isLoading?: boolean;
    error?: string | null;
  } | null;
  setStudioData: (data: any) => void;
}

const StudioContext = createContext<StudioContextValue | null>(null);

// Provider
export function StudioProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(studioReducer, initialState);

  const setView = useCallback((view: StudioView) => {
    dispatch({ type: 'SET_VIEW', view });
  }, []);

  const setViewMode = useCallback((mode: ViewMode) => {
    dispatch({ type: 'SET_VIEW_MODE', mode });
  }, []);

  const setFilter = useCallback(<K extends keyof StudioFilters>(
    key: K,
    value: StudioFilters[K]
  ) => {
    dispatch({ type: 'SET_FILTER', key, value });
  }, []);

  const resetFilters = useCallback(() => {
    dispatch({ type: 'RESET_FILTERS' });
  }, []);

  const openModal = useCallback((modal: keyof StudioModals, value?: string) => {
    dispatch({ type: 'OPEN_MODAL', modal, value });
  }, []);

  const closeModal = useCallback((modal: keyof StudioModals) => {
    dispatch({ type: 'CLOSE_MODAL', modal });
  }, []);

  const closeAllModals = useCallback(() => {
    dispatch({ type: 'CLOSE_ALL_MODALS' });
  }, []);

  const toggleSelect = useCallback((
    entityType: 'projects' | 'collections' | 'nfts',
    id: string
  ) => {
    dispatch({ type: 'TOGGLE_SELECT', entityType, id });
  }, []);

  const selectAll = useCallback((
    entityType: 'projects' | 'collections' | 'nfts',
    ids: string[]
  ) => {
    dispatch({ type: 'SELECT_ALL', entityType, ids });
  }, []);

  const clearSelection = useCallback((entityType?: 'projects' | 'collections' | 'nfts') => {
    dispatch({ type: 'CLEAR_SELECTION', entityType });
  }, []);

  const setData = useCallback((key: 'projects' | 'collections' | 'nfts', data: any[]) => {
    dispatch({ type: 'SET_DATA', key, data });
  }, []);

  const setLoading = useCallback((isLoading: boolean) => {
    dispatch({ type: 'SET_LOADING', isLoading });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', error });
  }, []);

  const setCreatorStatus = useCallback((isVerified: boolean, tier?: 'starter' | 'pro' | 'enterprise') => {
    dispatch({ type: 'SET_CREATOR_STATUS', isVerified, tier });
  }, []);

  const hasSelection = useMemo(() => {
    return (
      state.selection.projects.size > 0 ||
      state.selection.collections.size > 0 ||
      state.selection.nfts.size > 0
    );
  }, [state.selection]);

  const selectedCount = useMemo(() => {
    return (
      state.selection.projects.size +
      state.selection.collections.size +
      state.selection.nfts.size
    );
  }, [state.selection]);

  const hasActiveFilters = useMemo(() => {
    return (
      state.filters.search !== '' ||
      state.filters.status.length > 0 ||
      state.filters.contractType.length > 0 ||
      state.filters.chain.length > 0 ||
      state.filters.dateRange !== 'all'
    );
  }, [state.filters]);

  // Legacy compatibility layer
  const studioData = useMemo(() => ({
    searchQuery: state.filters.search,
    onSearchChange: (query: string) => setFilter('search', query),
    viewMode: state.viewMode,
    onViewModeChange: setViewMode,
    projects: state.projects,
    collections: state.collections,
    nfts: state.nfts,
    isLoading: state.isLoading,
    error: state.error,
  }), [state, setFilter, setViewMode]);

  const setStudioData = useCallback((data: any) => {
    if (data?.projects) setData('projects', data.projects);
    if (data?.collections) setData('collections', data.collections);
    if (data?.nfts) setData('nfts', data.nfts);
    if (data?.isLoading !== undefined) setLoading(data.isLoading);
    if (data?.error !== undefined) setError(data.error);
  }, [setData, setLoading, setError]);

  const value = useMemo(
    () => ({
      state,
      dispatch,
      setView,
      setViewMode,
      setFilter,
      resetFilters,
      openModal,
      closeModal,
      closeAllModals,
      toggleSelect,
      selectAll,
      clearSelection,
      setData,
      setLoading,
      setError,
      setCreatorStatus,
      hasSelection,
      selectedCount,
      hasActiveFilters,
      studioData,
      setStudioData,
    }),
    [
      state,
      setView,
      setViewMode,
      setFilter,
      resetFilters,
      openModal,
      closeModal,
      closeAllModals,
      toggleSelect,
      selectAll,
      clearSelection,
      setData,
      setLoading,
      setError,
      setCreatorStatus,
      hasSelection,
      selectedCount,
      hasActiveFilters,
      studioData,
      setStudioData,
    ]
  );

  return (
    <StudioContext.Provider value={value}>
      {children}
    </StudioContext.Provider>
  );
}

// Hook
export function useStudio() {
  const context = useContext(StudioContext);
  if (!context) {
    throw new Error('useStudio must be used within a StudioProvider');
  }
  return context;
}
