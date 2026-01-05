/**
 * Studio tRPC Router
 * Handles all studio-related procedures: projects, collections, nfts
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure, creatorProcedure } from "../index";
import { auth } from "@/lib/auth";
import { generateSlug } from "@/lib/utils";
import type { Prisma } from "@prisma/client";

// =============================================================================
// Input Schemas - Projects
// =============================================================================

const GetProjectsInput = z.object({
  address: z.string().min(1),
});

const GetProjectInput = z.object({
  id: z.string().uuid(),
});

const CreateProjectInput = z.object({
  address: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  banner: z.string().optional(),
  genre: z.string().optional(),
  concept: z.string().optional(),
});

const UpdateProjectInput = z.object({
  id: z.string().uuid(),
  address: z.string().min(1),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  banner: z.string().optional(),
  genre: z.string().optional(),
  concept: z.string().optional(),
  status: z.enum(["draft", "active", "archived"]).optional(),
});

// =============================================================================
// Input Schemas - Collections
// =============================================================================

const GetCollectionsInput = z.object({
  address: z.string().min(1),
  projectId: z.string().uuid().optional(),
});

const GetCollectionInput = z.object({
  id: z.string().uuid(),
});

const CreateCollectionInput = z.object({
  address: z.string().min(1),
  projectId: z.string().uuid().optional(),
  project: z.object({
    name: z.string().min(1),
    description: z.string().min(1),
    genre: z.string().optional(),
    concept: z.string().optional(),
    banner: z.string().optional(),
  }).optional(),
  name: z.string().min(1),
  symbol: z.string().min(1),
  description: z.string().optional(),
  image: z.string().optional(),
  bannerImage: z.string().optional(),
  contractAddress: z.string().min(1),
  royaltyPercentage: z.number().min(0).max(100).default(5),
  chainId: z.number().default(11155111),
  maxSupply: z.number().optional(),
  contractType: z.string().default("DropERC721"),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  transactionHash: z.string().optional(),
  isDeployed: z.boolean().default(true),
  claimPhases: z.string().optional(),
});

const UpdateCollectionInput = z.object({
  collectionId: z.string().uuid(),
  walletAddress: z.string().min(1),
  sharedMetadata: z.any().optional(),
  description: z.string().optional(),
  bannerImage: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// =============================================================================
// Input Schemas - NFTs
// =============================================================================

const GetNftsInput = z.object({
  address: z.string().min(1),
  collectionId: z.string().uuid().optional(),
});

const GetNftInput = z.object({
  id: z.string().uuid(),
});

const CreateNftInput = z.object({
  address: z.string().min(1),
  collectionId: z.string().uuid(),
  tokenId: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  image: z.string().min(1),
  metadataUri: z.string().min(1),
  attributes: z.array(z.object({
    trait_type: z.string(),
    value: z.string(),
    display_type: z.string().optional(),
  })).optional(),
  transactionHash: z.string().optional(),
  ownerAddress: z.string().optional(),
});

const BatchCreateNftsInput = z.object({
  collectionId: z.string().uuid(),
  walletAddress: z.string().min(1),
  nfts: z.array(z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    image: z.string().min(1),
    attributes: z.array(z.object({
      trait_type: z.string(),
      value: z.string(),
      display_type: z.string().optional(),
    })).optional(),
    tokenId: z.string().optional(),
    ownerAddress: z.string().optional(),
    metadataUri: z.string().optional(),
    isOnChain: z.boolean().optional(),
    onChainTokenId: z.string().nullable().optional(),
  })),
});

const SaveTraitsInput = z.object({
  collectionId: z.string().uuid(),
  traits: z.array(z.object({
    trait_type: z.string().min(1),
    value: z.string().min(1),
    display_type: z.string().optional(),
  })),
});

const SaveClaimPhasesInput = z.object({
  collectionId: z.string().uuid(),
  claimPhases: z.string(), // JSON stringified claim phases
});

// =============================================================================
// Projects Router
// =============================================================================

const projectsRouter = router({
  /**
   * List projects for a user
   */
  list: publicProcedure.input(GetProjectsInput).query(async ({ ctx, input }) => {
    const { address } = input;

    // Find user
    const user = await auth.getUserByWallet(address);
    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Fetch user's projects with computed fields
    const projects = await ctx.prisma.project.findMany({
      where: {
        creatorId: user.id,
      },
      include: {
        collections: {
          include: {
            nfts: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Transform projects with computed fields
    const transformedProjects = projects.map((project) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      banner: project.banner,
      genre: project.genre,
      concept: project.concept,
      status: project.status,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      // Computed fields
      collections: project.collections.length,
      totalNFTs: project.collections.reduce((sum, col) => sum + col.nfts.length, 0),
      totalValue: project.collections.reduce((sum, col) => {
        // Mock total value calculation - in production, calculate from marketplace data
        return sum + col.nfts.length * 0.1; // 0.1 ETH average
      }, 0),
      holders: project.collections.reduce((sum, col) => {
        // Mock unique holders - in production, count unique owner addresses
        return sum + Math.floor(col.nfts.length * 0.8); // Assume 80% unique holders
      }, 0),
    }));

    return { projects: transformedProjects };
  }),

  /**
   * Get a single project by ID
   */
  byId: publicProcedure.input(GetProjectInput).query(async ({ ctx, input }) => {
    const project = await ctx.prisma.project.findUnique({
      where: { id: input.id },
      include: {
        collections: {
          include: {
            nfts: true,
            _count: {
              select: { nfts: true },
            },
          },
        },
        creator: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
            walletAddress: true,
          },
        },
      },
    });

    if (!project) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Project not found",
      });
    }

    return {
      ...project,
      totalNFTs: project.collections.reduce((sum, col) => sum + col.nfts.length, 0),
      totalCollections: project.collections.length,
    };
  }),

  /**
   * Create a new project
   */
  create: protectedProcedure.input(CreateProjectInput).mutation(async ({ ctx, input }) => {
    const { address, name, description, banner, genre, concept } = input;

    // Verify the caller matches the wallet address
    if (ctx.walletAddress.toLowerCase() !== address.toLowerCase()) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You can only create projects from your own wallet",
      });
    }

    // Find user
    const user = await auth.getUserByWallet(address);
    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Create project
    const project = await ctx.prisma.project.create({
      data: {
        name,
        description,
        banner,
        genre,
        concept,
        creatorId: user.id,
        status: "draft",
      },
    });

    return {
      success: true as const,
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        banner: project.banner,
        genre: project.genre,
        concept: project.concept,
        status: project.status,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        collections: 0,
        totalNFTs: 0,
        totalValue: 0,
        holders: 0,
      },
    };
  }),

  /**
   * Update a project
   */
  update: protectedProcedure.input(UpdateProjectInput).mutation(async ({ ctx, input }) => {
    const { id, address, ...updateData } = input;

    // Verify the caller matches the wallet address
    if (ctx.walletAddress.toLowerCase() !== address.toLowerCase()) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You can only update projects from your own wallet",
      });
    }

    // Find user
    const user = await auth.getUserByWallet(address);
    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Verify ownership
    const project = await ctx.prisma.project.findFirst({
      where: {
        id,
        creatorId: user.id,
      },
    });

    if (!project) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Project not found or unauthorized",
      });
    }

    // Filter out undefined values
    const filteredUpdateData: Prisma.ProjectUpdateInput = {};
    if (updateData.name !== undefined) filteredUpdateData.name = updateData.name;
    if (updateData.description !== undefined) filteredUpdateData.description = updateData.description;
    if (updateData.banner !== undefined) filteredUpdateData.banner = updateData.banner;
    if (updateData.genre !== undefined) filteredUpdateData.genre = updateData.genre;
    if (updateData.concept !== undefined) filteredUpdateData.concept = updateData.concept;
    if (updateData.status !== undefined) filteredUpdateData.status = updateData.status;

    const updatedProject = await ctx.prisma.project.update({
      where: { id },
      data: filteredUpdateData,
    });

    return { success: true as const, project: updatedProject };
  }),
});

// =============================================================================
// Collections Router
// =============================================================================

const collectionsRouter = router({
  /**
   * List collections for a user
   */
  list: publicProcedure.input(GetCollectionsInput).query(async ({ ctx, input }) => {
    const { address, projectId } = input;

    // Find user
    const user = await auth.getUserByWallet(address);
    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Build query conditions
    const whereCondition: Prisma.CollectionWhereInput = {
      creatorAddress: address.toLowerCase(),
    };

    if (projectId) {
      whereCondition.projectId = projectId;
    }

    // Fetch collections with computed fields
    const collections = await ctx.prisma.collection.findMany({
      where: whereCondition,
      include: {
        nfts: {
          where: {
            isMinted: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Transform collections with computed fields
    const transformedCollections = collections.map((collection) => ({
      id: collection.id,
      projectId: collection.projectId,
      name: collection.name,
      symbol: collection.symbol,
      description: collection.description,
      image: collection.image,
      bannerImage: collection.bannerImage,
      address: collection.address,
      creatorAddress: collection.creatorAddress,
      royaltyPercentage: collection.royaltyPercentage,
      chainId: collection.chainId,
      contractType: collection.contractType,
      isDeployed: collection.isDeployed,
      deployedAt: collection.deployedAt,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
      maxSupply: collection.maxSupply,
      claimPhases: collection.claimPhases,
      sharedMetadata: collection.sharedMetadata,
      sharedMetadataSetAt: collection.sharedMetadataSetAt?.toISOString(),
      // Project information
      project: collection.project,
      // Computed fields
      mintedSupply: collection.nfts.length,
      floorPrice: collection.floorPrice || 0,
      volume: 0, // Would need to calculate from marketplace data
      holders: 0, // Would need to calculate unique owners
    }));

    return { collections: transformedCollections };
  }),

  /**
   * Get a single collection by ID
   */
  byId: publicProcedure.input(GetCollectionInput).query(async ({ ctx, input }) => {
    const collection = await ctx.prisma.collection.findUnique({
      where: { id: input.id },
      include: {
        nfts: {
          include: {
            traits: true,
          },
          orderBy: { tokenId: "asc" },
          take: 100, // Limit for performance
        },
        project: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        collectionTraits: {
          include: {
            values: true,
          },
        },
        _count: {
          select: { nfts: true },
        },
      },
    });

    if (!collection) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Collection not found",
      });
    }

    return {
      ...collection,
      mintedSupply: collection._count.nfts,
      floorPrice: collection.floorPrice || 0,
    };
  }),

  /**
   * Create a new collection
   */
  create: creatorProcedure.input(CreateCollectionInput).mutation(async ({ ctx, input }) => {
    const { address, project, projectId, ...collectionData } = input;
    const walletAddress = ctx.walletAddress!;

    // Verify the caller matches the wallet address
    if (walletAddress.toLowerCase() !== address.toLowerCase()) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You can only create collections from your own wallet",
      });
    }

    // Find user
    const user = await auth.getUserByWallet(address);
    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Check if contract address already exists
    const existingCollection = await ctx.prisma.collection.findUnique({
      where: {
        address: collectionData.contractAddress.toLowerCase(),
      },
    });

    if (existingCollection) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Collection with this contract address already exists",
      });
    }

    // Generate unique slug from collection name
    const baseSlug = generateSlug(collectionData.name);
    let slug = baseSlug;
    let slugCounter = 0;

    // Check for existing slugs and make unique if necessary
    while (true) {
      const existingSlug = await ctx.prisma.collection.findUnique({
        where: { slug },
      });
      if (!existingSlug) break;
      slugCounter++;
      slug = `${baseSlug}${slugCounter}`;
    }

    // Create new project if needed
    let finalProjectId = projectId;
    if (project && !projectId) {
      const newProject = await ctx.prisma.project.create({
        data: {
          name: project.name,
          description: project.description,
          genre: project.genre || null,
          concept: project.concept || null,
          banner: project.banner || null,
          creatorId: user.id,
          status: "active",
        },
      });
      finalProjectId = newProject.id;
    }

    // Create collection with IPFS URLs
    const newCollection = await ctx.prisma.collection.create({
      data: {
        projectId: finalProjectId,
        slug,
        name: collectionData.name,
        symbol: collectionData.symbol,
        description: collectionData.description,
        image: collectionData.image,
        bannerImage: collectionData.bannerImage,
        profileImage: collectionData.image,
        address: collectionData.contractAddress.toLowerCase(),
        creatorAddress: address.toLowerCase(),
        royaltyPercentage: collectionData.royaltyPercentage,
        chainId: collectionData.chainId,
        contractType: collectionData.contractType,
        maxSupply: collectionData.maxSupply,
        category: collectionData.category,
        tags: collectionData.tags || [],
        transactionHash: collectionData.transactionHash,
        isDeployed: collectionData.isDeployed,
        deployedAt: collectionData.isDeployed ? new Date() : null,
        claimPhases: collectionData.claimPhases,
      },
    });

    return {
      success: true as const,
      projectId: finalProjectId,
      collection: {
        id: newCollection.id,
        projectId: newCollection.projectId,
        name: newCollection.name,
        symbol: newCollection.symbol,
        description: newCollection.description,
        image: newCollection.image,
        bannerImage: newCollection.bannerImage,
        address: newCollection.address,
        creatorAddress: newCollection.creatorAddress,
        royaltyPercentage: newCollection.royaltyPercentage,
        chainId: newCollection.chainId,
        contractType: newCollection.contractType,
        isDeployed: newCollection.isDeployed,
        deployedAt: newCollection.deployedAt,
        createdAt: newCollection.createdAt,
        updatedAt: newCollection.updatedAt,
        maxSupply: newCollection.maxSupply,
        category: newCollection.category,
        tags: newCollection.tags,
        transactionHash: newCollection.transactionHash,
        claimPhases: newCollection.claimPhases,
        mintedSupply: 0,
        floorPrice: 0,
        volume: 0,
        holders: 0,
      },
    };
  }),

  /**
   * Update a collection
   */
  update: creatorProcedure.input(UpdateCollectionInput).mutation(async ({ ctx, input }) => {
    const { collectionId, walletAddress: inputWalletAddress, sharedMetadata, ...updateData } = input;
    const walletAddress = ctx.walletAddress!;

    // Verify the caller matches the wallet address
    if (walletAddress.toLowerCase() !== inputWalletAddress.toLowerCase()) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You can only update collections from your own wallet",
      });
    }

    // Verify user owns this collection
    const ownsCollection = await auth.doesUserOwnCollection(inputWalletAddress, collectionId);
    if (!ownsCollection) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not own this collection",
      });
    }

    // Build update data
    const prismaUpdateData: Prisma.CollectionUpdateInput = {};

    if (sharedMetadata !== undefined) {
      prismaUpdateData.sharedMetadata = sharedMetadata as Prisma.InputJsonValue;
      prismaUpdateData.sharedMetadataSetAt = new Date();
    }
    if (updateData.description !== undefined) prismaUpdateData.description = updateData.description;
    if (updateData.bannerImage !== undefined) prismaUpdateData.bannerImage = updateData.bannerImage;
    if (updateData.category !== undefined) prismaUpdateData.category = updateData.category;
    if (updateData.tags !== undefined) prismaUpdateData.tags = updateData.tags;

    // Update the collection
    const updatedCollection = await ctx.prisma.collection.update({
      where: { id: collectionId },
      data: prismaUpdateData,
    });

    return { success: true as const, collection: updatedCollection };
  }),

  /**
   * Save claim phases for a collection
   */
  saveClaimPhases: creatorProcedure.input(SaveClaimPhasesInput).mutation(async ({ ctx, input }) => {
    const { collectionId, claimPhases } = input;
    const walletAddress = ctx.walletAddress!;

    // Verify collection exists and user has permission
    const collection = await ctx.prisma.collection.findFirst({
      where: {
        id: collectionId,
        creatorAddress: walletAddress.toLowerCase(),
      },
    });

    if (!collection) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Collection not found or unauthorized",
      });
    }

    // Update collection with claim phases
    const updatedCollection = await ctx.prisma.collection.update({
      where: { id: collectionId },
      data: {
        claimPhases,
      },
    });

    return { success: true as const, collection: updatedCollection };
  }),
});

// =============================================================================
// NFTs Router
// =============================================================================

const nftsRouter = router({
  /**
   * List NFTs for a user/collection
   */
  list: publicProcedure.input(GetNftsInput).query(async ({ ctx, input }) => {
    const { address, collectionId } = input;

    // Find user
    const user = await auth.getUserByWallet(address);
    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Build query conditions
    const whereCondition: Prisma.NftWhereInput = {};

    if (collectionId) {
      // Verify collection ownership
      const collection = await ctx.prisma.collection.findFirst({
        where: {
          id: collectionId,
          creatorAddress: address.toLowerCase(),
        },
      });

      if (!collection) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Collection not found or unauthorized",
        });
      }

      whereCondition.collectionId = collectionId;
    } else {
      // Get all NFTs from collections owned by this user
      whereCondition.collection = {
        creatorAddress: address.toLowerCase(),
      };
    }

    // Fetch NFTs with collection info
    const nfts = await ctx.prisma.nft.findMany({
      where: whereCondition,
      include: {
        collection: {
          select: {
            name: true,
            symbol: true,
            address: true,
          },
        },
        traits: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      nfts: nfts.map((nft) => ({
        id: nft.id,
        tokenId: nft.tokenId,
        collectionId: nft.collectionId,
        name: nft.name,
        description: nft.description,
        image: nft.image,
        metadataUri: nft.metadataUri,
        attributes: nft.attributes,
        ownerAddress: nft.ownerAddress,
        isMinted: nft.isMinted,
        mintedAt: nft.mintedAt,
        traitCount: nft.traitCount,
        rarityScore: nft.rarityScore,
        rarityRank: nft.rarityRank,
        rarityTier: nft.rarityTier,
        createdAt: nft.createdAt,
        collection: nft.collection,
        traits: nft.traits,
      })),
    };
  }),

  /**
   * Get a single NFT by ID
   */
  byId: publicProcedure.input(GetNftInput).query(async ({ ctx, input }) => {
    const nft = await ctx.prisma.nft.findUnique({
      where: { id: input.id },
      include: {
        collection: {
          select: {
            id: true,
            name: true,
            symbol: true,
            address: true,
            creatorAddress: true,
            chainId: true,
          },
        },
        traits: true,
        marketplaceListings: {
          where: { status: "ACTIVE" },
          take: 1,
        },
        marketplaceOffers: {
          where: { status: "ACTIVE" },
          orderBy: { offerAmount: "desc" },
          take: 5,
        },
      },
    });

    if (!nft) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "NFT not found",
      });
    }

    return nft;
  }),

  /**
   * Create a new NFT
   */
  create: creatorProcedure.input(CreateNftInput).mutation(async ({ ctx, input }) => {
    const { address, collectionId, tokenId, name, description, image, metadataUri, attributes, ownerAddress } = input;
    const walletAddress = ctx.walletAddress!;

    // Verify the caller matches the wallet address
    if (walletAddress.toLowerCase() !== address.toLowerCase()) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You can only create NFTs from your own wallet",
      });
    }

    // Find user
    const user = await auth.getUserByWallet(address);
    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Verify collection exists and user has permission
    const collection = await ctx.prisma.collection.findFirst({
      where: {
        id: collectionId,
        creatorAddress: address.toLowerCase(),
      },
    });

    if (!collection) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Collection not found or unauthorized",
      });
    }

    // Generate next token ID if not provided
    let nextTokenId = tokenId;
    if (!nextTokenId) {
      const lastNft = await ctx.prisma.nft.findFirst({
        where: { collectionId },
        orderBy: { tokenId: "desc" },
      });

      const lastTokenIdNum = lastNft ? parseInt(lastNft.tokenId) : 0;
      nextTokenId = (lastTokenIdNum + 1).toString();
    }

    // Create NFT record
    const nft = await ctx.prisma.nft.create({
      data: {
        tokenId: nextTokenId,
        collectionId,
        name,
        description: description || "",
        image,
        metadataUri,
        attributes: (attributes as Prisma.InputJsonValue) || {},
        ownerAddress: ownerAddress || address.toLowerCase(),
        isMinted: true, // Since we're using lazy minting, it's ready for claiming
        mintedAt: new Date(),
        traitCount: Array.isArray(attributes) ? attributes.length : 0,
      },
      include: {
        collection: {
          select: {
            name: true,
            symbol: true,
            address: true,
          },
        },
      },
    });

    // Process attributes to create individual trait records
    if (attributes && Array.isArray(attributes) && attributes.length > 0) {
      for (const attribute of attributes) {
        if (attribute.trait_type && attribute.value) {
          // Create or update collection trait
          const collectionTrait = await ctx.prisma.collectionTrait.upsert({
            where: {
              collectionId_traitType: {
                collectionId,
                traitType: attribute.trait_type,
              },
            },
            create: {
              collectionId,
              traitType: attribute.trait_type,
              totalValues: 1,
              totalNfts: 1,
            },
            update: {
              totalNfts: {
                increment: 1,
              },
            },
          });

          // Create or update trait value
          await ctx.prisma.collectionTraitValue.upsert({
            where: {
              traitId_value: {
                traitId: collectionTrait.id,
                value: attribute.value,
              },
            },
            create: {
              traitId: collectionTrait.id,
              value: attribute.value,
              frequency: 1,
              rarity: 100,
            },
            update: {
              frequency: {
                increment: 1,
              },
            },
          });

          // Create individual NFT trait record
          await ctx.prisma.nftTrait.create({
            data: {
              nftId: nft.id,
              traitType: attribute.trait_type,
              value: attribute.value,
              displayType: attribute.display_type,
            },
          });
        }
      }
    }

    // Update search index
    const existingSearchIndex = await ctx.prisma.searchIndex.findFirst({
      where: {
        entityType: "nft",
        entityId: nft.id,
      },
    });

    if (existingSearchIndex) {
      await ctx.prisma.searchIndex.update({
        where: {
          id: existingSearchIndex.id,
        },
        data: {
          title: name,
          description: description || "",
          keywords: [name, collection.name, collection.symbol],
          searchVector: `${name} ${description || ""} ${collection.name}`.toLowerCase(),
        },
      });
    } else {
      await ctx.prisma.searchIndex.create({
        data: {
          entityType: "nft",
          entityId: nft.id,
          title: name,
          description: description || "",
          keywords: [name, collection.name, collection.symbol],
          searchVector: `${name} ${description || ""} ${collection.name}`.toLowerCase(),
          collectionId,
          creatorAddress: address.toLowerCase(),
        },
      });
    }

    return {
      success: true as const,
      nft: {
        id: nft.id,
        tokenId: nft.tokenId,
        collectionId: nft.collectionId,
        name: nft.name,
        description: nft.description,
        image: nft.image,
        metadataUri: nft.metadataUri,
        attributes: nft.attributes,
        ownerAddress: nft.ownerAddress,
        isMinted: nft.isMinted,
        mintedAt: nft.mintedAt,
        traitCount: nft.traitCount,
        createdAt: nft.createdAt,
        collection: {
          name: nft.collection.name,
          symbol: nft.collection.symbol,
          address: nft.collection.address,
        },
        dropReady: true,
      },
    };
  }),

  /**
   * Batch create NFTs
   */
  batchCreate: creatorProcedure.input(BatchCreateNftsInput).mutation(async ({ ctx, input }) => {
    const { collectionId, walletAddress, nfts: nftsData } = input;

    // Verify the caller matches the wallet address
    if (ctx.walletAddress!.toLowerCase() !== walletAddress.toLowerCase()) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You can only create NFTs from your own wallet",
      });
    }

    // Verify collection exists and user has permission
    const collection = await ctx.prisma.collection.findFirst({
      where: {
        id: collectionId,
        creatorAddress: walletAddress.toLowerCase(),
      },
    });

    if (!collection) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Collection not found or unauthorized",
      });
    }

    // Get the last token ID in this collection
    const lastNft = await ctx.prisma.nft.findFirst({
      where: { collectionId },
      orderBy: { tokenId: "desc" },
    });
    let lastTokenIdNum = lastNft ? parseInt(lastNft.tokenId) : 0;

    // Create all NFTs in a transaction
    const createdNfts = await ctx.prisma.$transaction(async (tx) => {
      const results = [];

      for (const nftData of nftsData) {
        // Use provided tokenId or generate next one
        const tokenId = nftData.tokenId || (++lastTokenIdNum).toString();

        const nft = await tx.nft.create({
          data: {
            tokenId,
            collectionId,
            name: nftData.name,
            description: nftData.description || "",
            image: nftData.image,
            metadataUri: nftData.metadataUri || nftData.image,
            attributes: (nftData.attributes as Prisma.InputJsonValue) || {},
            ownerAddress: nftData.ownerAddress || walletAddress.toLowerCase(),
            isMinted: nftData.isOnChain !== false,
            mintedAt: new Date(),
            traitCount: nftData.attributes?.length || 0,
            onChainTokenId: nftData.onChainTokenId || null,
          },
        });

        // Process attributes to create trait records
        if (nftData.attributes && nftData.attributes.length > 0) {
          for (const attr of nftData.attributes) {
            if (attr.trait_type && attr.value) {
              // Create or update collection trait
              const collectionTrait = await tx.collectionTrait.upsert({
                where: {
                  collectionId_traitType: {
                    collectionId,
                    traitType: attr.trait_type,
                  },
                },
                create: {
                  collectionId,
                  traitType: attr.trait_type,
                  totalValues: 1,
                  totalNfts: 1,
                },
                update: {
                  totalNfts: { increment: 1 },
                },
              });

              // Create or update trait value
              await tx.collectionTraitValue.upsert({
                where: {
                  traitId_value: {
                    traitId: collectionTrait.id,
                    value: attr.value,
                  },
                },
                create: {
                  traitId: collectionTrait.id,
                  value: attr.value,
                  frequency: 1,
                  rarity: 100,
                },
                update: {
                  frequency: { increment: 1 },
                },
              });

              // Create individual NFT trait record
              await tx.nftTrait.create({
                data: {
                  nftId: nft.id,
                  traitType: attr.trait_type,
                  value: attr.value,
                  displayType: attr.display_type,
                },
              });
            }
          }
        }

        results.push(nft);
      }

      return results;
    });

    return {
      success: true as const,
      nfts: createdNfts.map((nft) => ({
        id: nft.id,
        tokenId: nft.tokenId,
        collectionId: nft.collectionId,
        name: nft.name,
        image: nft.image,
      })),
      count: createdNfts.length,
    };
  }),

  /**
   * Save traits for a collection
   */
  saveTraits: protectedProcedure.input(SaveTraitsInput).mutation(async ({ ctx, input }) => {
    const { collectionId, traits } = input;

    // Verify collection exists
    const collection = await ctx.prisma.collection.findFirst({
      where: {
        id: collectionId,
        creatorAddress: ctx.walletAddress!.toLowerCase(),
      },
    });

    if (!collection) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Collection not found or unauthorized",
      });
    }

    // Save each trait
    for (const trait of traits) {
      // Create or update collection trait
      const collectionTrait = await ctx.prisma.collectionTrait.upsert({
        where: {
          collectionId_traitType: {
            collectionId,
            traitType: trait.trait_type,
          },
        },
        create: {
          collectionId,
          traitType: trait.trait_type,
          totalValues: 1,
          totalNfts: 0,
        },
        update: {},
      });

      // Create or update trait value
      await ctx.prisma.collectionTraitValue.upsert({
        where: {
          traitId_value: {
            traitId: collectionTrait.id,
            value: trait.value,
          },
        },
        create: {
          traitId: collectionTrait.id,
          value: trait.value,
          frequency: 0,
          rarity: 100,
        },
        update: {},
      });
    }

    return { success: true as const };
  }),
});

// =============================================================================
// Input Schemas - Lootboxes
// =============================================================================

const GetLootboxesInput = z.object({
  address: z.string().min(1),
  projectId: z.string().uuid().optional(),
});

// =============================================================================
// Lootboxes Router
// =============================================================================

const lootboxesRouter = router({
  /**
   * List lootboxes for a user
   */
  list: publicProcedure.input(GetLootboxesInput).query(async ({ ctx, input }) => {
    const { address, projectId } = input;

    // Find user
    const user = await auth.getUserByWallet(address);
    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Build where clause
    const where: Prisma.LootboxWhereInput = {
      creatorId: user.id,
    };

    if (projectId) {
      where.projectId = projectId;
    }

    // Fetch lootboxes
    const lootboxes = await ctx.prisma.lootbox.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        rewards: {
          select: {
            id: true,
            name: true,
            image: true,
            rarity: true,
          },
        },
        _count: {
          select: {
            openings: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      lootboxes: lootboxes.map((lb) => ({
        id: lb.id,
        onChainId: lb.onChainId,
        name: lb.name,
        description: lb.description,
        image: lb.image,
        price: parseFloat(lb.price.toString()),
        priceCurrency: lb.priceCurrency,
        rarity: lb.rarity,
        totalSupply: lb.totalSupply,
        remainingSupply: lb.remainingSupply,
        rewardsPerOpening: lb.rewardsPerOpening,
        contractAddress: lb.contractAddress,
        isActive: lb.isActive,
        projectId: lb.projectId,
        project: lb.project,
        rewardCount: lb.rewards.length,
        rewardPreviews: lb.rewards.slice(0, 3),
        openingsCount: lb._count.openings,
        createdAt: lb.createdAt,
      })),
    };
  }),
});

// =============================================================================
// Input Schemas - Creator Application
// =============================================================================

const CreatorApplicationSchema = z.object({
  creatorType: z.enum(["game_developer", "artist", "brand", "influencer", "other"]),
  displayName: z.string().min(2, "Display name must be at least 2 characters").max(50),
  tagline: z.string().max(100, "Tagline must be under 100 characters").optional(),
  bio: z.string().min(50, "Bio must be at least 50 characters").max(1000),
  avatar: z.string().url().optional().nullable(),
  banner: z.string().url().optional().nullable(),
  skills: z.array(z.string()).min(1, "Select at least one skill").max(10),
  portfolio: z.string().url().optional().nullable(),
  achievements: z.string().max(500).optional().nullable(),
  socialLinks: z.object({
    twitter: z.string().optional(),
    discord: z.string().optional(),
    website: z.string().url().optional().or(z.literal("")),
    instagram: z.string().optional(),
  }).optional(),
  contentTypes: z.array(z.string()).min(1, "Select at least one content type").max(5),
  uploadFrequency: z.enum(["daily", "weekly", "biweekly", "monthly", "occasional"]),
  targetAudience: z.string().min(10, "Describe your target audience").max(300),
  uniqueValue: z.string().max(500).optional().nullable(),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: "You must accept the terms" }) }),
  acceptCreatorAgreement: z.literal(true, { errorMap: () => ({ message: "You must accept the creator agreement" }) }),
  understandFees: z.literal(true, { errorMap: () => ({ message: "You must acknowledge the fee structure" }) }),
});

// =============================================================================
// Creator Router
// =============================================================================

const creatorRouter = router({
  /**
   * Get current creator status for the authenticated user
   */
  status: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { walletAddress: ctx.walletAddress },
      include: {
        creatorApplication: true,
      },
    });

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    return {
      isCreator: user.isCreator,
      applicationStatus: user.creatorApplication?.status || "none",
      appliedAt: user.creatorAppliedAt,
      approvedAt: user.creatorApprovedAt,
      application: user.creatorApplication,
    };
  }),

  /**
   * Submit creator application
   */
  submitApplication: protectedProcedure
    .input(CreatorApplicationSchema)
    .mutation(async ({ ctx, input }) => {
      // Find user
      const user = await ctx.prisma.user.findUnique({
        where: { walletAddress: ctx.walletAddress },
        include: { creatorApplication: true },
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      // Check if user already has an application
      if (user.creatorApplication) {
        if (user.creatorApplication.status === "approved") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You are already a verified creator",
          });
        }
        if (user.creatorApplication.status === "pending") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You already have a pending application",
          });
        }
      }

      // Create or update application
      const application = await ctx.prisma.$transaction(async (tx) => {
        const app = await tx.creatorApplication.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            creatorType: input.creatorType,
            displayName: input.displayName,
            tagline: input.tagline || null,
            bio: input.bio,
            avatar: input.avatar || null,
            banner: input.banner || null,
            skills: input.skills,
            portfolio: input.portfolio || null,
            achievements: input.achievements || null,
            socialLinks: input.socialLinks || {},
            contentTypes: input.contentTypes,
            uploadFrequency: input.uploadFrequency,
            targetAudience: input.targetAudience,
            uniqueValue: input.uniqueValue || null,
            acceptTerms: input.acceptTerms,
            acceptCreatorAgreement: input.acceptCreatorAgreement,
            understandFees: input.understandFees,
            status: "pending",
            submittedAt: new Date(),
          },
          update: {
            creatorType: input.creatorType,
            displayName: input.displayName,
            tagline: input.tagline || null,
            bio: input.bio,
            avatar: input.avatar || null,
            banner: input.banner || null,
            skills: input.skills,
            portfolio: input.portfolio || null,
            achievements: input.achievements || null,
            socialLinks: input.socialLinks || {},
            contentTypes: input.contentTypes,
            uploadFrequency: input.uploadFrequency,
            targetAudience: input.targetAudience,
            uniqueValue: input.uniqueValue || null,
            acceptTerms: input.acceptTerms,
            acceptCreatorAgreement: input.acceptCreatorAgreement,
            understandFees: input.understandFees,
            status: "pending",
            submittedAt: new Date(),
            reviewedAt: null,
            reviewNotes: null,
          },
        });

        // Update user's appliedAt timestamp
        await tx.user.update({
          where: { id: user.id },
          data: { creatorAppliedAt: new Date() },
        });

        return app;
      });

      return {
        success: true as const,
        applicationId: application.id,
        status: application.status,
      };
    }),

  /**
   * Update existing application (if rejected, can reapply)
   */
  updateApplication: protectedProcedure
    .input(CreatorApplicationSchema.partial())
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { walletAddress: ctx.walletAddress },
        include: { creatorApplication: true },
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      if (!user.creatorApplication) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No application found",
        });
      }

      if (user.creatorApplication.status === "approved") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot modify an approved application",
        });
      }

      // Build update data, filtering out undefined values
      const updateData: Record<string, unknown> = {};
      if (input.creatorType !== undefined) updateData.creatorType = input.creatorType;
      if (input.displayName !== undefined) updateData.displayName = input.displayName;
      if (input.tagline !== undefined) updateData.tagline = input.tagline || null;
      if (input.bio !== undefined) updateData.bio = input.bio;
      if (input.avatar !== undefined) updateData.avatar = input.avatar || null;
      if (input.banner !== undefined) updateData.banner = input.banner || null;
      if (input.skills !== undefined) updateData.skills = input.skills;
      if (input.portfolio !== undefined) updateData.portfolio = input.portfolio || null;
      if (input.achievements !== undefined) updateData.achievements = input.achievements || null;
      if (input.socialLinks !== undefined) updateData.socialLinks = input.socialLinks || {};
      if (input.contentTypes !== undefined) updateData.contentTypes = input.contentTypes;
      if (input.uploadFrequency !== undefined) updateData.uploadFrequency = input.uploadFrequency;
      if (input.targetAudience !== undefined) updateData.targetAudience = input.targetAudience;
      if (input.uniqueValue !== undefined) updateData.uniqueValue = input.uniqueValue || null;
      if (input.acceptTerms !== undefined) updateData.acceptTerms = input.acceptTerms;
      if (input.acceptCreatorAgreement !== undefined) updateData.acceptCreatorAgreement = input.acceptCreatorAgreement;
      if (input.understandFees !== undefined) updateData.understandFees = input.understandFees;

      const updated = await ctx.prisma.creatorApplication.update({
        where: { userId: user.id },
        data: {
          ...updateData,
          status: "pending",
          submittedAt: new Date(),
        },
      });

      return {
        success: true as const,
        application: updated,
      };
    }),
});

// =============================================================================
// Export Combined Studio Router
// =============================================================================

export const studioRouter = router({
  creator: creatorRouter,
  projects: projectsRouter,
  collections: collectionsRouter,
  nfts: nftsRouter,
  lootboxes: lootboxesRouter,
});
