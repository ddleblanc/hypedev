import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

// Helper function to convert chainId to chain name
function getChainName(chainId: number): string {
  const chainMap: Record<number, string> = {
    1: 'ethereum',
    137: 'polygon',
    42161: 'arbitrum',
    10: 'optimism',
    8453: 'base',
    11155111: 'ethereum', // Sepolia testnet -> ethereum for display
  }
  return chainMap[chainId] || 'ethereum'
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ address: string }> }
) {
  const params = await context.params;
  try {
    const { address } = params
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '24')
    const filter = searchParams.get('filter') || 'owned' // owned, created, all
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'recent'
    const chains = searchParams.get('chains')?.split(',').filter(Boolean) || []
    const collections = searchParams.get('collections')?.split(',').filter(Boolean) || []
    const minPrice = parseFloat(searchParams.get('minPrice') || '0')
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '999999')
    const status = searchParams.get('status') // listed, auction, etc.
    
    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    // Find user first using auth service
    const user = await auth.getUserByWallet(address)

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    const normalizedAddress = user.walletAddress.toLowerCase()

    // Build the base query based on filter
    let baseQuery: any = {
      include: {
        collection: {
          select: {
            name: true,
            symbol: true,
            creatorAddress: true,
            chainId: true,
            address: true,
            floorPrice: true,
            lastFloorPriceSync: true,
            image: true
          }
        },
        traits: {
          include: {
            nft: false // Don't include circular reference
          }
        },
        // Include active marketplace listings for auction/offer data
        marketplaceListings: {
          where: {
            status: 'ACTIVE'
          },
          select: {
            id: true,
            listingId: true,
            listingType: true,
            pricePerToken: true,
            highestBid: true,
            highestBidder: true,
            minimumBidAmount: true,
            buyoutBidAmount: true,
            endTimestamp: true
          },
          take: 1,
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    }

    // Apply ownership/creation filter
    // Note: isOnChain = true means the NFT actually exists on blockchain (can be listed)
    // isMinted = true but isOnChain = false means lazy-minted only (drafts)
    if (filter === 'owned') {
      baseQuery.where = {
        ownerAddress: {
          equals: normalizedAddress,
          mode: 'insensitive'
        },
        isOnChain: true  // Only show NFTs that exist on-chain (listable)
      }
    } else if (filter === 'created') {
      baseQuery.where = {
        collection: {
          creatorAddress: {
            equals: normalizedAddress,
            mode: 'insensitive'
          }
        },
        isOnChain: true  // Only show NFTs that exist on-chain
      }
    } else if (filter === 'drafts') {
      // Draft NFTs - in database but not on-chain yet (cannot be listed)
      baseQuery.where = {
        collection: {
          creatorAddress: {
            equals: normalizedAddress,
            mode: 'insensitive'
          }
        },
        isMinted: true,
        isOnChain: false  // In DB but not on blockchain
      }
    } else {
      // 'all' - both owned and created (on-chain only)
      baseQuery.where = {
        OR: [
          {
            ownerAddress: {
              equals: normalizedAddress,
              mode: 'insensitive'
            },
            isOnChain: true
          },
          {
            collection: {
              creatorAddress: {
                equals: normalizedAddress,
                mode: 'insensitive'
              }
            },
            isOnChain: true
          }
        ]
      }
    }

    // Get NFTs from database
    const allNFTs = await prisma.nft.findMany(baseQuery)

    // Transform database NFTs to frontend format
    let transformedNFTs = allNFTs.map(nft => {
      const nftWithCollection = nft as any; // Type assertion for collection relation

      // Get active listing data if exists
      const activeListing = nftWithCollection.marketplaceListings?.[0] || null;
      const isAuction = nftWithCollection.listingType === 'auction' || activeListing?.listingType === 'auction';
      const hasOffer = activeListing?.highestBid != null && activeListing.highestBid > 0;

      return {
        id: nftWithCollection.id,
        tokenId: nftWithCollection.tokenId,
        name: nftWithCollection.name,
        description: nftWithCollection.description || '',
        image: nftWithCollection.image,
        collectionName: nftWithCollection.collection.name,
        collectionSlug: nftWithCollection.collection.name.toLowerCase().replace(/\s+/g, '-'),
        contractAddress: nftWithCollection.collection.address,
        chain: getChainName(nftWithCollection.collection.chainId),
        collectionId: nftWithCollection.collectionId,
        rarity: nftWithCollection.rarityTier || 'Common',
        rarityScore: nftWithCollection.rarityScore,
        rarityTier: nftWithCollection.rarityTier,
        rank: nftWithCollection.rarityRank || Math.floor(Math.random() * 10000) + 1,
        traits: nftWithCollection.traits.reduce((acc: any, trait: any) => {
          acc[trait.traitType] = trait.value
          return acc
        }, {}),
        // Ownership/creation status
        owned: nftWithCollection.ownerAddress?.toLowerCase() === normalizedAddress,
        created: nftWithCollection.collection.creatorAddress.toLowerCase() === normalizedAddress,
        // Real market data from database
        price: nftWithCollection.listingPrice,
        listingPrice: nftWithCollection.listingPrice,
        lastSale: null, // TODO: Track historical sales
        floorPrice: nftWithCollection.collection.floorPrice || 0,
        listed: nftWithCollection.isListed,
        isListed: nftWithCollection.isListed,
        listingType: nftWithCollection.listingType,
        // Auction status - check both NFT listingType and active marketplace listing
        auction: isAuction && nftWithCollection.isListed,
        new: (Date.now() - new Date(nftWithCollection.createdAt).getTime()) < (7 * 24 * 60 * 60 * 1000),
        // Offer/bid data from marketplace listing
        topBid: hasOffer ? {
          amount: activeListing.highestBid,
          bidder: activeListing.highestBidder,
          minimumBid: activeListing.minimumBidAmount,
          buyoutPrice: activeListing.buyoutBidAmount
        } : null,
        hasOffers: hasOffer,
        // Social metrics (would come from separate service)
        likes: Math.floor(Math.random() * 500) + 10,
        views: Math.floor(Math.random() * 2000) + 100,
        lastViewed: nftWithCollection.updatedAt,
        // Metadata
        royalty: 5.0,
        createdAt: nftWithCollection.createdAt,
        updatedAt: nftWithCollection.updatedAt,
        // On-chain status - critical for listing eligibility
        isOnChain: nftWithCollection.isOnChain || false,
        onChainTokenId: nftWithCollection.onChainTokenId,
        // Include collection for P2P context
        collection: {
          name: nftWithCollection.collection.name,
          symbol: nftWithCollection.collection.symbol,
          image: nftWithCollection.collection.image,
          address: nftWithCollection.collection.address,
          floorPrice: nftWithCollection.collection.floorPrice
        },
        // Listing details for auctions
        listingDetails: activeListing ? {
          listingId: activeListing.listingId,
          endTimestamp: activeListing.endTimestamp
        } : null
      };
    })

    // Apply filters
    let filteredNFTs = transformedNFTs

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase()
      filteredNFTs = filteredNFTs.filter(nft => 
        nft.name.toLowerCase().includes(searchLower) ||
        nft.collectionName.toLowerCase().includes(searchLower)
      )
    }

    // Chain filter
    if (chains.length > 0) {
      filteredNFTs = filteredNFTs.filter(nft => chains.includes(nft.chain))
    }

    // Collection filter
    if (collections.length > 0) {
      filteredNFTs = filteredNFTs.filter(nft => collections.includes(nft.collectionName))
    }

    // Price filter (only meaningful if we have price data)
    if (minPrice > 0 || maxPrice < 999999) {
      filteredNFTs = filteredNFTs.filter(nft => {
        const price = nft.price || nft.lastSale || 0
        return price >= minPrice && price <= maxPrice
      })
    }

    // Status filter
    if (status === 'listed') {
      // Listed but not on auction (direct listings only)
      filteredNFTs = filteredNFTs.filter(nft => nft.listed && !nft.auction)
    } else if (status === 'unlisted') {
      // Not currently listed for sale
      filteredNFTs = filteredNFTs.filter(nft => !nft.listed)
    } else if (status === 'on_auction' || status === 'auction') {
      // On auction - listed as auction type
      filteredNFTs = filteredNFTs.filter(nft => nft.auction)
    } else if (status === 'has_offers' || status === 'hasOffers') {
      // Has offers/bids - has a topBid with amount > 0
      filteredNFTs = filteredNFTs.filter(nft => nft.hasOffers || nft.topBid)
    } else if (status === 'new') {
      filteredNFTs = filteredNFTs.filter(nft => nft.new)
    }

    // Sorting
    switch (sortBy) {
      case 'price-low':
        filteredNFTs.sort((a, b) => (a.price || 999) - (b.price || 999))
        break
      case 'price-high':
        filteredNFTs.sort((a, b) => (b.price || 0) - (a.price || 0))
        break
      case 'rarity-rare':
        filteredNFTs.sort((a, b) => a.rank - b.rank)
        break
      case 'rarity-common':
        filteredNFTs.sort((a, b) => b.rank - a.rank)
        break
      case 'most-liked':
        filteredNFTs.sort((a, b) => b.likes - a.likes)
        break
      case 'oldest':
        filteredNFTs.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        break
      case 'recent':
      default:
        filteredNFTs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        break
    }

    // Pagination
    const skip = (page - 1) * limit
    const paginatedNFTs = filteredNFTs.slice(skip, skip + limit)
    const totalPages = Math.ceil(filteredNFTs.length / limit)

    // Get available collections and chains for filtering
    const availableCollections = [...new Set(transformedNFTs.map(nft => nft.collectionName))]
    const availableChains = [...new Set(transformedNFTs.map(nft => nft.chain))]

    // Count draft NFTs (in DB but not on-chain) - separate query for accuracy
    const totalDrafts = await prisma.nft.count({
      where: {
        collection: {
          creatorAddress: {
            equals: normalizedAddress,
            mode: 'insensitive'
          }
        },
        isMinted: true,
        isOnChain: false
      }
    })

    // Count on-chain owned and created separately for accurate tab counts
    const totalOwned = await prisma.nft.count({
      where: {
        ownerAddress: { equals: normalizedAddress, mode: 'insensitive' },
        isOnChain: true
      }
    })

    const totalCreated = await prisma.nft.count({
      where: {
        collection: {
          creatorAddress: { equals: normalizedAddress, mode: 'insensitive' }
        },
        isOnChain: true
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        nfts: paginatedNFTs,
        pagination: {
          page,
          limit,
          total: filteredNFTs.length,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        filters: {
          availableCollections,
          availableChains,
          totalOwned,
          totalCreated,
          totalDrafts,
          totalListed: transformedNFTs.filter(nft => nft.listed).length,
          totalOnAuction: transformedNFTs.filter(nft => nft.auction).length,
          totalWithOffers: transformedNFTs.filter(nft => nft.hasOffers || nft.topBid).length,
          totalUnlisted: transformedNFTs.filter(nft => !nft.listed).length
        }
      }
    })

  } catch (error) {
    console.error('Error fetching user NFTs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user NFTs' },
      { status: 500 }
    )
  }
}