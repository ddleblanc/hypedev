import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
  { params }: { params: { address: string } }
) {
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
            address: true
          }
        },
        traits: {
          include: {
            nft: false // Don't include circular reference
          }
        }
      }
    }

    // Apply ownership/creation filter
    if (filter === 'owned') {
      baseQuery.where = {
        ownerAddress: normalizedAddress,
        isMinted: true
      }
    } else if (filter === 'created') {
      baseQuery.where = {
        collection: {
          creatorAddress: normalizedAddress
        },
        isMinted: true
      }
    } else {
      // 'all' - both owned and created
      baseQuery.where = {
        OR: [
          {
            ownerAddress: normalizedAddress,
            isMinted: true
          },
          {
            collection: {
              creatorAddress: normalizedAddress
            },
            isMinted: true
          }
        ]
      }
    }

    // Get NFTs from database
    const allNFTs = await prisma.nft.findMany(baseQuery)

    // Transform database NFTs to frontend format
    let transformedNFTs = allNFTs.map(nft => ({
      id: nft.id,
      tokenId: nft.tokenId,
      name: nft.name,
      description: nft.description || '',
      image: nft.image,
      collectionName: nft.collection.name,
      collectionSlug: nft.collection.name.toLowerCase().replace(/\s+/g, '-'),
      contractAddress: nft.collection.address,
      chain: getChainName(nft.collection.chainId),
      rarity: nft.rarityTier || 'Common',
      rank: nft.rarityRank || Math.floor(Math.random() * 10000) + 1,
      traits: nft.traits.reduce((acc: any, trait) => {
        acc[trait.traitType] = trait.value
        return acc
      }, {}),
      // Ownership/creation status
      owned: nft.ownerAddress?.toLowerCase() === normalizedAddress,
      created: nft.collection.creatorAddress.toLowerCase() === normalizedAddress,
      // Market data (would come from marketplace APIs in production)
      price: null, // TODO: Integrate marketplace data
      lastSale: null, // TODO: Integrate marketplace data
      floorPrice: +(Math.random() * 2 + 0.1).toFixed(2), // Mock floor price
      listed: false, // TODO: Integrate marketplace data
      auction: false, // TODO: Integrate marketplace data
      new: (Date.now() - new Date(nft.createdAt).getTime()) < (7 * 24 * 60 * 60 * 1000), // New if created within 7 days
      topBid: null, // TODO: Integrate marketplace data
      // Social metrics (would come from separate service)
      likes: Math.floor(Math.random() * 500) + 10,
      views: Math.floor(Math.random() * 2000) + 100,
      lastViewed: nft.updatedAt,
      // Metadata
      royalty: 5.0,
      createdAt: nft.createdAt,
      updatedAt: nft.updatedAt,
    }))

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
      filteredNFTs = filteredNFTs.filter(nft => nft.listed && !nft.auction)
    } else if (status === 'auction') {
      filteredNFTs = filteredNFTs.filter(nft => nft.auction)
    } else if (status === 'new') {
      filteredNFTs = filteredNFTs.filter(nft => nft.new)
    } else if (status === 'hasOffers') {
      filteredNFTs = filteredNFTs.filter(nft => nft.topBid)
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
          totalOwned: transformedNFTs.filter(nft => nft.owned).length,
          totalCreated: transformedNFTs.filter(nft => nft.created).length,
          totalListed: transformedNFTs.filter(nft => nft.listed).length
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