'use client';

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';

// =============================================================================
// Types
// =============================================================================

export type StudioTab = 'overview' | 'projects' | 'create' | 'campaigns';
export type CreateType = 'collection' | 'lootbox' | 'nft' | null;
export type CreatorTier = 'starter' | 'pro' | 'enterprise';
export type LootboxRarity = 'common' | 'rare' | 'epic' | 'mythic' | 'cosmic';

// Selected NFT for lootbox rewards
export interface SelectedNFT {
  id: string;
  contractAddress: string;
  tokenId: string;
  name: string;
  image: string;
  collectionName: string;
  tokenType: 'ERC721' | 'ERC1155';
  amount?: number;
  weight: number;
  rarity: LootboxRarity;
  isOnChain: boolean; // Whether NFT exists on-chain or needs to be minted
  collectionId?: string; // Database collection ID for minting
}

// Lootbox-specific draft
export interface LootboxDraft {
  name: string;
  description: string;
  price: string; // ETH as string
  supply: number;
  rewardsPerOpening: number;
  image: string | null;
  selectedNFTs: SelectedNFT[];
}

export interface CreateDraft {
  type: CreateType;
  projectId: string | null;
  projectName: string;
  projectDescription: string;
  name: string;
  symbol: string;
  description: string;
  image: string | null;
  bannerImage: string | null;
  chainId: number;
  contractType: 'NFTDrop' | 'NFTCollection' | 'OpenEdition' | 'EditionDrop' | 'Edition' | '';
  maxSupply: number;
  royaltyPercentage: number;
  // Lootbox-specific
  lootbox: LootboxDraft;
  // Deployment results
  deployedLootboxId?: number;
  txHash?: string;
}

interface ProjectsState {
  expandedProject: string | null;
  expandedCollection: string | null;
  searchQuery: string;
}

interface CreateState {
  step: number;
  totalSteps: number;
  draft: Partial<CreateDraft>;
  isDirty: boolean;
}

// NFT Modal collection type
export interface NftModalCollection {
  id: string;
  name: string;
  symbol: string;
  address?: string;
  chainId: number;
  contractType?: string;
  image?: string;
}

// Collection detail panel type (full collection for slide-in panel)
export interface CollectionForPanel {
  id: string;
  name: string;
  symbol: string;
  description?: string;
  image?: string;
  bannerImage?: string;
  address?: string;
  chainId: number;
  contractType?: string;
  isDeployed: boolean;
  maxSupply?: number;
  mintedSupply?: number;
  royaltyPercentage?: number;
  claimPhases?: Array<{
    id: string;
    name: string;
    startTime: string;
    maxClaimableSupply: number;
    maxClaimablePerWallet: number;
    price: number;
    currency?: string;
  }>;
  nfts?: Array<{
    id: string;
    name: string;
    image?: string;
    tokenId?: string;
    isMinted?: boolean;
  }>;
}

export interface StudioNewState {
  // Creator status (from auth)
  isVerified: boolean;
  creatorTier: CreatorTier;

  // Navigation
  activeTab: StudioTab;

  // Tab-specific state
  projects: ProjectsState;
  create: CreateState;

  // NFT Modal state
  nftModalCollection: NftModalCollection | null;

  // Collection detail panel state
  selectedCollectionForPanel: CollectionForPanel | null;

  // Loading state
  isLoading: boolean;
}

// =============================================================================
// Initial State
// =============================================================================

const initialLootboxDraft: LootboxDraft = {
  name: '',
  description: '',
  price: '',
  supply: 0,
  rewardsPerOpening: 1,
  image: null,
  selectedNFTs: [],
};

const initialDraft: Partial<CreateDraft> = {
  type: null,
  projectId: null,
  projectName: '',
  projectDescription: '',
  name: '',
  symbol: '',
  description: '',
  image: null,
  bannerImage: null,
  chainId: 0,
  contractType: '',
  maxSupply: 0,
  royaltyPercentage: 5,
  lootbox: initialLootboxDraft,
};

const initialState: StudioNewState = {
  isVerified: false,
  creatorTier: 'starter',
  activeTab: 'overview',
  projects: {
    expandedProject: null,
    expandedCollection: null,
    searchQuery: '',
  },
  create: {
    step: 1,
    totalSteps: 8,
    draft: initialDraft,
    isDirty: false,
  },
  nftModalCollection: null,
  selectedCollectionForPanel: null,
  isLoading: true,
};

// =============================================================================
// Actions (~10 vs 30+ in old context)
// =============================================================================

type StudioNewAction =
  | { type: 'SET_TAB'; tab: StudioTab }
  | { type: 'SET_CREATOR_STATUS'; isVerified: boolean; tier: CreatorTier }
  | { type: 'EXPAND_PROJECT'; projectId: string | null }
  | { type: 'EXPAND_COLLECTION'; collectionId: string | null }
  | { type: 'SET_SEARCH'; query: string }
  | { type: 'SET_CREATE_STEP'; step: number }
  | { type: 'UPDATE_DRAFT'; data: Partial<CreateDraft> }
  | { type: 'RESET_CREATE' }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'OPEN_NFT_MODAL'; collection: NftModalCollection }
  | { type: 'CLOSE_NFT_MODAL' }
  | { type: 'OPEN_COLLECTION_PANEL'; collection: CollectionForPanel }
  | { type: 'CLOSE_COLLECTION_PANEL' }
  | { type: 'UPDATE_LOOTBOX_DRAFT'; data: Partial<LootboxDraft> }
  | { type: 'UPDATE_LOOTBOX_NFT'; index: number; data: Partial<SelectedNFT> };

// =============================================================================
// Reducer
// =============================================================================

function studioNewReducer(
  state: StudioNewState,
  action: StudioNewAction
): StudioNewState {
  switch (action.type) {
    case 'SET_TAB':
      return { ...state, activeTab: action.tab };

    case 'SET_CREATOR_STATUS':
      return {
        ...state,
        isVerified: action.isVerified,
        creatorTier: action.tier,
      };

    case 'EXPAND_PROJECT':
      return {
        ...state,
        projects: {
          ...state.projects,
          expandedProject: action.projectId,
          // Reset collection when changing project
          expandedCollection: null,
        },
      };

    case 'EXPAND_COLLECTION':
      return {
        ...state,
        projects: {
          ...state.projects,
          expandedCollection: action.collectionId,
        },
      };

    case 'SET_SEARCH':
      return {
        ...state,
        projects: { ...state.projects, searchQuery: action.query },
      };

    case 'SET_CREATE_STEP':
      return {
        ...state,
        create: { ...state.create, step: action.step },
      };

    case 'UPDATE_DRAFT':
      return {
        ...state,
        create: {
          ...state.create,
          draft: { ...state.create.draft, ...action.data },
          isDirty: true,
        },
      };

    case 'RESET_CREATE':
      return {
        ...state,
        create: {
          step: 1,
          totalSteps: 8,
          draft: initialDraft,
          isDirty: false,
        },
      };

    case 'SET_LOADING':
      return { ...state, isLoading: action.loading };

    case 'OPEN_NFT_MODAL':
      return { ...state, nftModalCollection: action.collection };

    case 'CLOSE_NFT_MODAL':
      return { ...state, nftModalCollection: null };

    case 'OPEN_COLLECTION_PANEL':
      return { ...state, selectedCollectionForPanel: action.collection };

    case 'CLOSE_COLLECTION_PANEL':
      return { ...state, selectedCollectionForPanel: null };

    case 'UPDATE_LOOTBOX_DRAFT':
      return {
        ...state,
        create: {
          ...state.create,
          draft: {
            ...state.create.draft,
            lootbox: {
              ...(state.create.draft.lootbox || initialLootboxDraft),
              ...action.data,
            },
          },
          isDirty: true,
        },
      };

    case 'UPDATE_LOOTBOX_NFT': {
      const currentNFTs = state.create.draft.lootbox?.selectedNFTs || [];
      const updatedNFTs = [...currentNFTs];
      if (action.index >= 0 && action.index < updatedNFTs.length) {
        updatedNFTs[action.index] = { ...updatedNFTs[action.index], ...action.data };
      }
      return {
        ...state,
        create: {
          ...state.create,
          draft: {
            ...state.create.draft,
            lootbox: {
              ...(state.create.draft.lootbox || initialLootboxDraft),
              selectedNFTs: updatedNFTs,
            },
          },
          isDirty: true,
        },
      };
    }

    default:
      return state;
  }
}

// =============================================================================
// Context Value Interface
// =============================================================================

interface StudioNewContextValue {
  state: StudioNewState;

  // Navigation
  setTab: (tab: StudioTab) => void;
  goToOverview: () => void;
  goToProjects: () => void;
  goToCreate: () => void;
  goToCampaigns: () => void;

  // Projects
  expandProject: (projectId: string | null) => void;
  expandCollection: (collectionId: string | null) => void;
  setSearch: (query: string) => void;

  // Create wizard
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateDraft: (data: Partial<CreateDraft>) => void;
  resetCreate: () => void;
  canProceed: boolean;

  // Lootbox wizard
  updateLootboxDraft: (data: Partial<LootboxDraft>) => void;
  updateLootboxNft: (index: number, data: Partial<SelectedNFT>) => void;

  // NFT Modal
  openNftModal: (collection: NftModalCollection) => void;
  closeNftModal: () => void;

  // Collection Panel
  openCollectionPanel: (collection: CollectionForPanel) => void;
  closeCollectionPanel: () => void;

  // Status
  setCreatorStatus: (isVerified: boolean, tier: CreatorTier) => void;
  setLoading: (loading: boolean) => void;
}

// =============================================================================
// Context
// =============================================================================

const StudioNewContext = createContext<StudioNewContextValue | null>(null);

// =============================================================================
// Provider
// =============================================================================

export function StudioNewProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(studioNewReducer, initialState);

  // Navigation actions
  const setTab = useCallback(
    (tab: StudioTab) => dispatch({ type: 'SET_TAB', tab }),
    []
  );
  const goToOverview = useCallback(() => setTab('overview'), [setTab]);
  const goToProjects = useCallback(() => setTab('projects'), [setTab]);
  const goToCreate = useCallback(() => setTab('create'), [setTab]);
  const goToCampaigns = useCallback(() => setTab('campaigns'), [setTab]);

  // Projects actions
  const expandProject = useCallback(
    (projectId: string | null) =>
      dispatch({ type: 'EXPAND_PROJECT', projectId }),
    []
  );
  const expandCollection = useCallback(
    (collectionId: string | null) =>
      dispatch({ type: 'EXPAND_COLLECTION', collectionId }),
    []
  );
  const setSearch = useCallback(
    (query: string) => dispatch({ type: 'SET_SEARCH', query }),
    []
  );

  // Create wizard actions
  const setStep = useCallback(
    (step: number) => dispatch({ type: 'SET_CREATE_STEP', step }),
    []
  );
  const nextStep = useCallback(() => {
    if (state.create.step < state.create.totalSteps) {
      dispatch({ type: 'SET_CREATE_STEP', step: state.create.step + 1 });
    }
  }, [state.create.step, state.create.totalSteps]);

  const prevStep = useCallback(() => {
    if (state.create.step > 1) {
      dispatch({ type: 'SET_CREATE_STEP', step: state.create.step - 1 });
    }
  }, [state.create.step]);

  const updateDraft = useCallback(
    (data: Partial<CreateDraft>) => dispatch({ type: 'UPDATE_DRAFT', data }),
    []
  );
  const resetCreate = useCallback(
    () => dispatch({ type: 'RESET_CREATE' }),
    []
  );

  // Lootbox wizard actions
  const updateLootboxDraft = useCallback(
    (data: Partial<LootboxDraft>) =>
      dispatch({ type: 'UPDATE_LOOTBOX_DRAFT', data }),
    []
  );
  const updateLootboxNft = useCallback(
    (index: number, data: Partial<SelectedNFT>) =>
      dispatch({ type: 'UPDATE_LOOTBOX_NFT', index, data }),
    []
  );

  // NFT Modal actions
  const openNftModal = useCallback(
    (collection: NftModalCollection) =>
      dispatch({ type: 'OPEN_NFT_MODAL', collection }),
    []
  );
  const closeNftModal = useCallback(
    () => dispatch({ type: 'CLOSE_NFT_MODAL' }),
    []
  );

  // Collection Panel actions
  const openCollectionPanel = useCallback(
    (collection: CollectionForPanel) =>
      dispatch({ type: 'OPEN_COLLECTION_PANEL', collection }),
    []
  );
  const closeCollectionPanel = useCallback(
    () => dispatch({ type: 'CLOSE_COLLECTION_PANEL' }),
    []
  );

  // Validation for current step (supports both collection and lootbox flows)
  const canProceed = useMemo((): boolean => {
    const { step, draft } = state.create;
    const isLootbox = draft.type === 'lootbox';

    // Lootbox-specific validation
    if (isLootbox) {
      const lootbox = draft.lootbox;
      switch (step) {
        case 1: // Type
          return draft.type === 'lootbox';
        case 2: // Project
          return Boolean(
            draft.projectId !== null ||
            (draft.projectName && draft.projectName.length >= 3)
          );
        case 3: // Lootbox Basics (name)
          return Boolean(lootbox?.name && lootbox.name.length >= 1);
        case 4: // Supply & Pricing
          return Boolean(
            lootbox?.price &&
            parseFloat(lootbox.price) > 0 &&
            lootbox.supply > 0 &&
            lootbox.rewardsPerOpening >= 1
          );
        case 5: // NFT Selection
          const required = (lootbox?.supply || 0) * (lootbox?.rewardsPerOpening || 1);
          return (lootbox?.selectedNFTs?.length || 0) >= required;
        case 6: // Drop Rates
          return true; // Rates have defaults
        case 7: // Review
          return true;
        case 8: // Success
          return true;
        default:
          return false;
      }
    }

    // Collection validation (original logic)
    switch (step) {
      case 1:
        return draft.type !== null && draft.type !== undefined;
      case 2:
        return Boolean(
          draft.projectId !== null ||
          (draft.projectName && draft.projectName.length >= 3)
        );
      case 3:
        return Boolean(
          draft.name &&
          draft.name.length >= 3 &&
          draft.symbol &&
          draft.symbol.length >= 2
        );
      case 4:
        // Artwork is optional
        return true;
      case 5:
        return Boolean(draft.chainId && draft.chainId > 0 && draft.contractType);
      case 6:
        return Boolean(draft.maxSupply && draft.maxSupply > 0);
      case 7:
        // Review step is always ready
        return true;
      case 8:
        // Success step
        return true;
      default:
        return false;
    }
  }, [state.create]);

  // Status actions
  const setCreatorStatus = useCallback(
    (isVerified: boolean, tier: CreatorTier) =>
      dispatch({ type: 'SET_CREATOR_STATUS', isVerified, tier }),
    []
  );
  const setLoading = useCallback(
    (loading: boolean) => dispatch({ type: 'SET_LOADING', loading }),
    []
  );

  const value = useMemo(
    () => ({
      state,
      setTab,
      goToOverview,
      goToProjects,
      goToCreate,
      goToCampaigns,
      expandProject,
      expandCollection,
      setSearch,
      setStep,
      nextStep,
      prevStep,
      updateDraft,
      resetCreate,
      canProceed,
      updateLootboxDraft,
      updateLootboxNft,
      openNftModal,
      closeNftModal,
      openCollectionPanel,
      closeCollectionPanel,
      setCreatorStatus,
      setLoading,
    }),
    [
      state,
      setTab,
      goToOverview,
      goToProjects,
      goToCreate,
      goToCampaigns,
      expandProject,
      expandCollection,
      setSearch,
      setStep,
      nextStep,
      prevStep,
      updateDraft,
      resetCreate,
      canProceed,
      updateLootboxDraft,
      updateLootboxNft,
      openNftModal,
      closeNftModal,
      openCollectionPanel,
      closeCollectionPanel,
      setCreatorStatus,
      setLoading,
    ]
  );

  return (
    <StudioNewContext.Provider value={value}>
      {children}
    </StudioNewContext.Provider>
  );
}

// =============================================================================
// Hook
// =============================================================================

export function useStudioNew() {
  const context = useContext(StudioNewContext);
  if (!context) {
    throw new Error('useStudioNew must be used within StudioNewProvider');
  }
  return context;
}
