/**
 * Thirdweb v5 NFT collection contract types (2025)
 * Updated list with only currently supported contracts
 */

export type ContractCategory =
  | "standard-collection"
  | "drop-collection"
  | "edition"
  | "open-edition"
  | "community";

export type MintingStrategy =
  | "direct" // Mint directly to addresses
  | "claim" // Users claim/mint themselves
  | "lazy" // Upload metadata without gas
  | "phased"; // Different conditions over time

export type MetadataType =
  | "unique" // Each NFT has unique metadata
  | "shared" // All NFTs share same metadata
  | "edition"; // Multiple copies of different designs

export interface ContractType {
  id: string;
  name: string;
  contractName: string;
  shortDescription: string;
  fullDescription: string;
  category: ContractCategory;
  metadataType: MetadataType;
  mintingStrategies: MintingStrategy[];
  bestFor: string[];
  features: string[];
  gasEfficiency: 1 | 2 | 3 | 4 | 5; // 1 = most efficient
  complexity: "beginner" | "intermediate" | "advanced";
  pros: string[];
  cons: string[];
  whenToUse: string[];
  whenNotToUse: string[];
  exampleUseCases: string[];
  supportsClaimConditions: boolean;
  supportsRoyalties: boolean;
  supportsBatchMint: boolean;
  supportsLazyMint: boolean;
  supportsDelayedReveal: boolean;
  supportsAllowlist: boolean;
  requiresGasForUpload: boolean;
  version: string;
  audited: boolean;
}

export const THIRDWEB_CONTRACTS: ContractType[] = [
  {
    id: "NFTDrop",
    name: "NFT Drop",
    contractName: "DropERC721",
    shortDescription: "Release collection of unique NFTs for a set price",
    fullDescription: "The most gas-efficient way to release a collection of unique NFTs. Upload metadata without paying gas (lazy mint), then let users claim NFTs with configurable conditions like allowlists, claim phases, and pricing.",
    category: "drop-collection",
    metadataType: "unique",
    mintingStrategies: ["lazy", "claim", "phased"],
    bestFor: [
      "10K PFP collections",
      "Large NFT drops with phases",
      "Collections with allowlists",
      "Gas-efficient launches"
    ],
    features: [
      "Lazy minting (no gas to upload)",
      "Claim conditions & phases",
      "Allowlist with merkle proofs",
      "Delayed reveal",
      "Max mints per wallet",
      "Time-based releases",
      "ERC721A optimized"
    ],
    gasEfficiency: 1,
    complexity: "beginner",
    pros: [
      "Most gas-efficient for large collections",
      "No upfront gas costs for creators",
      "Built-in allowlist system",
      "Flexible claim conditions",
      "Battle-tested contract"
    ],
    cons: [
      "Users pay gas to mint",
      "Fixed metadata after upload",
      "Requires IPFS for metadata"
    ],
    whenToUse: [
      "Launching a PFP collection",
      "Need phased release (presale, public)",
      "Want allowlist functionality",
      "Large collection (1000+ NFTs)",
      "Want to minimize creator gas costs"
    ],
    whenNotToUse: [
      "Need to airdrop to specific wallets",
      "Want dynamic/changing metadata",
      "Small collection (<100 items)"
    ],
    exampleUseCases: [
      "10K avatar collection with presale",
      "Art drops with allowlist",
      "Generative art collections",
      "Membership NFT launches"
    ],
    supportsClaimConditions: true,
    supportsRoyalties: true,
    supportsBatchMint: false,
    supportsLazyMint: true,
    supportsDelayedReveal: true,
    supportsAllowlist: true,
    requiresGasForUpload: false,
    version: "5.0.7",
    audited: true
  },
  {
    id: "NFTCollection",
    name: "NFT Collection",
    contractName: "TokenERC721",
    shortDescription: "Create collection of unique NFTs",
    fullDescription: "A standard NFT collection where you mint NFTs directly to addresses. You have full control over who gets what NFT. Perfect for airdrops, rewards, or when you need to mint specific NFTs to specific people.",
    category: "standard-collection",
    metadataType: "unique",
    mintingStrategies: ["direct"],
    bestFor: [
      "Airdrops to known addresses",
      "Reward distributions",
      "1:1 art pieces",
      "Corporate NFT programs"
    ],
    features: [
      "Direct minting to addresses",
      "Batch minting support",
      "Signature-based minting",
      "Full mint control",
      "On-chain metadata option",
      "Standard ERC721"
    ],
    gasEfficiency: 3,
    complexity: "beginner",
    pros: [
      "Complete control over distribution",
      "Can mint to any address",
      "Batch mint multiple NFTs",
      "No claim process needed",
      "Simple and straightforward"
    ],
    cons: [
      "Creator pays all gas costs",
      "Higher gas than lazy minting",
      "No built-in sale mechanics"
    ],
    whenToUse: [
      "Airdropping to specific wallets",
      "Corporate NFT programs",
      "Reward distributions",
      "Already sold NFTs off-chain",
      "Need immediate minting"
    ],
    whenNotToUse: [
      "Large public sales",
      "Want users to pay gas",
      "Need claim phases",
      "Budget conscious about gas"
    ],
    exampleUseCases: [
      "Employee badge NFTs",
      "Reward NFTs for users",
      "Pre-sold 1:1 artworks",
      "Partnership NFTs"
    ],
    supportsClaimConditions: false,
    supportsRoyalties: true,
    supportsBatchMint: true,
    supportsLazyMint: false,
    supportsDelayedReveal: false,
    supportsAllowlist: false,
    requiresGasForUpload: true,
    version: "5.0.4",
    audited: true
  },
  {
    id: "OpenEdition",
    name: "Open Edition",
    contractName: "OpenEditionERC721",
    shortDescription: "An open-to-mint ERC-721 NFT collection, where all NFTs have shared metadata",
    fullDescription: "Create an NFT where unlimited people can mint the exact same artwork. Perfect for commemorative NFTs, music releases, or any collection where everyone gets the same thing. Extremely gas-efficient since metadata is shared.",
    category: "open-edition",
    metadataType: "shared",
    mintingStrategies: ["claim", "direct"],
    bestFor: [
      "Music singles/albums",
      "Event commemoratives",
      "Unlimited memberships",
      "Participation tokens"
    ],
    features: [
      "Shared metadata (one for all)",
      "Unlimited or limited supply",
      "Claim conditions",
      "Time-limited minting",
      "Ultra gas-efficient",
      "Simple setup"
    ],
    gasEfficiency: 1,
    complexity: "beginner",
    pros: [
      "Extremely gas-efficient",
      "No scarcity pressure",
      "Perfect for music/content",
      "Simple to understand",
      "Minimal storage costs"
    ],
    cons: [
      "All NFTs identical",
      "No rarity/uniqueness",
      "Limited collectibility appeal"
    ],
    whenToUse: [
      "Music or content releases",
      "Event attendance NFTs",
      "Community participation tokens",
      "When everyone should get the same thing",
      "Celebrating milestones"
    ],
    whenNotToUse: [
      "Want unique/rare NFTs",
      "PFP collections",
      "Need different metadata per token",
      "Collectible trading cards"
    ],
    exampleUseCases: [
      "Album release NFT",
      "Conference attendance badge",
      "Community milestone NFT",
      "Charity donation receipt"
    ],
    supportsClaimConditions: true,
    supportsRoyalties: true,
    supportsBatchMint: false,
    supportsLazyMint: false,
    supportsDelayedReveal: false,
    supportsAllowlist: true,
    requiresGasForUpload: false,
    version: "5.0.3",
    audited: true
  },
  {
    id: "EditionDrop",
    name: "Edition Drop",
    contractName: "DropERC1155",
    shortDescription: "Release ERC1155 tokens for a set price",
    fullDescription: "Create multiple different NFTs where each can have multiple copies (editions). Like having multiple open editions in one contract. Users can claim different editions based on conditions you set.",
    category: "edition",
    metadataType: "edition",
    mintingStrategies: ["lazy", "claim", "phased"],
    bestFor: [
      "Game items with quantities",
      "Tiered memberships",
      "Music albums (tracks)",
      "Trading cards"
    ],
    features: [
      "Multiple NFT designs",
      "Multiple copies per design",
      "Per-edition claim conditions",
      "Lazy minting support",
      "ERC1155 standard",
      "Batch transfers"
    ],
    gasEfficiency: 2,
    complexity: "intermediate",
    pros: [
      "Multiple NFTs in one contract",
      "Efficient for editions",
      "Flexible supply per edition",
      "Good for gaming",
      "Batch operations"
    ],
    cons: [
      "More complex than ERC721",
      "Less marketplace support",
      "Confusing for beginners"
    ],
    whenToUse: [
      "Game items with quantities",
      "Multiple tier memberships",
      "Trading card packs",
      "Album with multiple tracks",
      "Items with limited quantities"
    ],
    whenNotToUse: [
      "Simple PFP collection",
      "Need maximum compatibility",
      "Want unique 1:1 NFTs",
      "Targeting NFT beginners"
    ],
    exampleUseCases: [
      "Game sword (100 copies) + shield (50 copies)",
      "Gold/Silver/Bronze memberships",
      "Album with 10 track NFTs",
      "Trading card rarities"
    ],
    supportsClaimConditions: true,
    supportsRoyalties: true,
    supportsBatchMint: false,
    supportsLazyMint: true,
    supportsDelayedReveal: false,
    supportsAllowlist: true,
    requiresGasForUpload: false,
    version: "5.0.7",
    audited: true
  },
  {
    id: "Edition",
    name: "Edition",
    contractName: "TokenERC1155",
    shortDescription: "Create editions of ERC1155 tokens",
    fullDescription: "Create and mint ERC1155 tokens directly. You control the minting process and can create multiple token types with multiple copies. Best for when you need direct control over edition distribution.",
    category: "edition",
    metadataType: "edition",
    mintingStrategies: ["direct"],
    bestFor: [
      "Game asset management",
      "Direct edition distribution",
      "Reward tokens with quantities",
      "Corporate token programs"
    ],
    features: [
      "Direct minting control",
      "Multiple token types",
      "Batch minting",
      "Batch transfers",
      "On-chain metadata option",
      "ERC1155 standard"
    ],
    gasEfficiency: 3,
    complexity: "intermediate",
    pros: [
      "Full control over minting",
      "Efficient for bulk operations",
      "Good for gaming",
      "Flexible token management"
    ],
    cons: [
      "Creator pays gas",
      "No claim mechanics",
      "More complex setup"
    ],
    whenToUse: [
      "Game asset distribution",
      "Corporate token programs",
      "Direct edition airdrops",
      "Reward programs with quantities"
    ],
    whenNotToUse: [
      "Public sales",
      "Need claim conditions",
      "Simple NFT collections",
      "Want users to pay gas"
    ],
    exampleUseCases: [
      "Game inventory system",
      "Tiered reward tokens",
      "Corporate badge levels",
      "Resource tokens"
    ],
    supportsClaimConditions: false,
    supportsRoyalties: true,
    supportsBatchMint: true,
    supportsLazyMint: false,
    supportsDelayedReveal: false,
    supportsAllowlist: false,
    requiresGasForUpload: true,
    version: "5.0.4",
    audited: true
  },
  {
    id: "CommunityStream",
    name: "Community Stream",
    contractName: "ERC721CommunityStream",
    shortDescription: "Equally distribute any token to community of NFT holders",
    fullDescription: "A special contract that allows you to stream tokens (like revenue or rewards) to NFT holders equally. Perfect for revenue sharing or community rewards.",
    category: "community",
    metadataType: "unique",
    mintingStrategies: ["direct"],
    bestFor: [
      "Revenue sharing",
      "Community rewards",
      "DAO distributions",
      "Royalty splitting"
    ],
    features: [
      "Token streaming to holders",
      "Equal distribution",
      "Multiple token support",
      "Automatic calculations",
      "Withdraw mechanics"
    ],
    gasEfficiency: 3,
    complexity: "advanced",
    pros: [
      "Automatic revenue sharing",
      "Fair distribution",
      "Supports any ERC20 token",
      "Transparent on-chain"
    ],
    cons: [
      "More complex setup",
      "Gas costs for claims",
      "Requires understanding"
    ],
    whenToUse: [
      "Revenue sharing with holders",
      "Community reward programs",
      "DAO treasury distributions",
      "Collaborative projects"
    ],
    whenNotToUse: [
      "Simple NFT collections",
      "No revenue to share",
      "Beginners to NFTs"
    ],
    exampleUseCases: [
      "Music NFT royalty sharing",
      "DAO membership distributions",
      "Community treasury sharing",
      "Creator collaboration splits"
    ],
    supportsClaimConditions: false,
    supportsRoyalties: true,
    supportsBatchMint: false,
    supportsLazyMint: false,
    supportsDelayedReveal: false,
    supportsAllowlist: false,
    requiresGasForUpload: true,
    version: "1.0.1",
    audited: false
  }
];

// Question flow for guided selection
export const CONTRACT_SELECTION_QUESTIONS = [
  {
    id: "metadata_type",
    question: "What kind of NFT collection are you creating?",
    description: "This helps determine the right contract type",
    options: [
      {
        value: "unique",
        label: "Unique NFTs",
        description: "Each NFT is different (art, PFPs, collectibles)",
        icon: "🎨"
      },
      {
        value: "shared",
        label: "Same for Everyone",
        description: "All NFTs identical (tickets, badges, music)",
        icon: "🎫"
      },
      {
        value: "editions",
        label: "Limited Editions",
        description: "Multiple designs with copies (cards, tiers)",
        icon: "📚"
      }
    ]
  },
  {
    id: "distribution",
    question: "How will people get your NFTs?",
    description: "Choose your distribution method",
    options: [
      {
        value: "claim",
        label: "They Claim/Buy",
        description: "Users mint themselves (pay gas)",
        icon: "🛒"
      },
      {
        value: "airdrop",
        label: "I Send Them",
        description: "You mint to specific addresses",
        icon: "🎁"
      },
      {
        value: "both",
        label: "Mix of Both",
        description: "Some claim, some airdrop",
        icon: "🔄"
      }
    ]
  },
  {
    id: "size",
    question: "Collection size?",
    description: "How many NFTs total",
    options: [
      {
        value: "small",
        label: "Under 100",
        icon: "🔢"
      },
      {
        value: "medium",
        label: "100-1,000",
        icon: "📊"
      },
      {
        value: "large",
        label: "1,000-10,000",
        icon: "📈"
      },
      {
        value: "unlimited",
        label: "Unlimited",
        icon: "♾️"
      }
    ]
  },
  {
    id: "phases",
    question: "Need different sale phases?",
    description: "Like presale, public sale, etc.",
    options: [
      {
        value: "yes",
        label: "Yes, Multiple Phases",
        description: "Presale, allowlist, public",
        icon: "📅"
      },
      {
        value: "no",
        label: "No, Simple Release",
        description: "Everyone at once",
        icon: "🚀"
      }
    ]
  },
  {
    id: "allowlist",
    question: "Need an allowlist?",
    description: "Restrict who can mint",
    options: [
      {
        value: "yes",
        label: "Yes, Allowlist",
        description: "Only specific wallets",
        icon: "✅"
      },
      {
        value: "no",
        label: "No, Public",
        description: "Anyone can mint",
        icon: "🌍"
      }
    ]
  }
];

// Smart recommendation engine
export function getRecommendedContract(answers: Record<string, string>): {
  primary: ContractType;
  alternatives: ContractType[];
  reasoning: string;
} {
  let primary: ContractType | null = null;
  let alternatives: ContractType[] = [];
  let reasoning = "";

  // Logic for recommendations
  if (answers.metadata_type === "shared") {
    primary = THIRDWEB_CONTRACTS.find(c => c.id === "OpenEdition")!;
    reasoning = "Open Edition is perfect for NFTs where everyone gets the same thing. It's extremely gas-efficient and simple to set up.";
    alternatives = [];
  }
  else if (answers.metadata_type === "editions") {
    if (answers.distribution === "claim") {
      primary = THIRDWEB_CONTRACTS.find(c => c.id === "EditionDrop")!;
      reasoning = "Edition Drop lets you create multiple NFTs with different quantities and set claim conditions for each.";
    } else {
      primary = THIRDWEB_CONTRACTS.find(c => c.id === "Edition")!;
      reasoning = "Edition gives you direct control over minting multiple NFTs with quantities.";
    }
    alternatives = [THIRDWEB_CONTRACTS.find(c => c.id !== primary?.id && c.category === "edition")!].filter(Boolean);
  }
  else if (answers.metadata_type === "unique") {
    if (answers.distribution === "airdrop") {
      primary = THIRDWEB_CONTRACTS.find(c => c.id === "NFTCollection")!;
      reasoning = "NFT Collection gives you full control to mint specific NFTs to specific addresses.";
      alternatives = [];
    }
    else if (answers.distribution === "claim" || answers.distribution === "both") {
      if (answers.size === "large" || answers.phases === "yes" || answers.allowlist === "yes") {
        primary = THIRDWEB_CONTRACTS.find(c => c.id === "NFTDrop")!;
        reasoning = "NFT Drop is the most gas-efficient for large collections with claim phases and allowlists. You don't pay gas upfront.";
        alternatives = [THIRDWEB_CONTRACTS.find(c => c.id === "NFTCollection")!];
      } else if (answers.size === "small") {
        primary = THIRDWEB_CONTRACTS.find(c => c.id === "NFTCollection")!;
        reasoning = "For small collections, NFT Collection gives you more control and flexibility.";
        alternatives = [THIRDWEB_CONTRACTS.find(c => c.id === "NFTDrop")!];
      } else {
        primary = THIRDWEB_CONTRACTS.find(c => c.id === "NFTDrop")!;
        reasoning = "NFT Drop provides the best balance of features and gas efficiency.";
        alternatives = [THIRDWEB_CONTRACTS.find(c => c.id === "NFTCollection")!];
      }
    }
  }

  // Fallback
  if (!primary) {
    primary = THIRDWEB_CONTRACTS.find(c => c.id === "NFTDrop")!;
    reasoning = "NFT Drop is the most versatile and popular choice for NFT collections.";
  }

  return {
    primary,
    alternatives: alternatives.filter(Boolean),
    reasoning
  };
}

// Filter contracts based on features
export function filterContracts(filters: {
  needsClaimConditions?: boolean;
  needsAllowlist?: boolean;
  needsLazyMint?: boolean;
  maxComplexity?: "beginner" | "intermediate" | "advanced";
  category?: ContractCategory;
  metadataType?: MetadataType;
}): ContractType[] {
  return THIRDWEB_CONTRACTS.filter(contract => {
    if (filters.needsClaimConditions && !contract.supportsClaimConditions) return false;
    if (filters.needsAllowlist && !contract.supportsAllowlist) return false;
    if (filters.needsLazyMint && !contract.supportsLazyMint) return false;
    if (filters.category && contract.category !== filters.category) return false;
    if (filters.metadataType && contract.metadataType !== filters.metadataType) return false;

    if (filters.maxComplexity) {
      const complexityLevels = { beginner: 1, intermediate: 2, advanced: 3 };
      if (complexityLevels[contract.complexity] > complexityLevels[filters.maxComplexity]) {
        return false;
      }
    }

    return true;
  });
}

// Get contracts by use case
export function getContractsByUseCase(useCase: string): ContractType[] {
  const useCaseMap: Record<string, string[]> = {
    "pfp-collection": ["NFTDrop", "NFTCollection"],
    "music-release": ["OpenEdition", "EditionDrop"],
    "game-items": ["EditionDrop", "Edition"],
    "membership": ["OpenEdition", "NFTDrop", "NFTCollection"],
    "event-tickets": ["OpenEdition"],
    "art-collection": ["NFTDrop", "NFTCollection"],
    "rewards": ["NFTCollection", "Edition", "CommunityStream"],
    "airdrops": ["NFTCollection", "Edition"]
  };

  const contractIds = useCaseMap[useCase] || [];
  return THIRDWEB_CONTRACTS.filter(c => contractIds.includes(c.id));
}