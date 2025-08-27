import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type') // sale, list, offer, transfer, mint, burn
    const days = parseInt(searchParams.get('days') || '30') // last N days
    
    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    // Normalize the address
    const normalizedAddress = address.toLowerCase()

    // Find user first
    const user = await prisma.user.findUnique({
      where: {
        walletAddress: normalizedAddress
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Mock activity data generation (in real app, this would query blockchain/database activity)
    const generateMockActivity = (count: number) => {
      const activityTypes = ['sale', 'list', 'offer', 'transfer', 'mint', 'burn', 'bid']
      const collections = ['CyberPunks', 'Digital Arts', 'Meta Worlds', 'Future Tokens', 'Crypto Gems']
      const chains = ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base']
      
      return Array.from({ length: count }, (_, i) => {
        const activityType = type || activityTypes[Math.floor(Math.random() * activityTypes.length)]
        const collection = collections[Math.floor(Math.random() * collections.length)]
        const chain = chains[Math.floor(Math.random() * chains.length)]
        
        const activity = {
          id: `activity-${user.id}-${i}`,
          type: activityType,
          nft: {
            id: `nft-${i}`,
            name: `${collection} #${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`,
            image: `https://picsum.photos/100/100?random=${i}`,
            collectionName: collection,
            collectionSlug: collection.toLowerCase().replace(' ', '-'),
            tokenId: Math.floor(Math.random() * 9999).toString(),
            contractAddress: `0x${Math.random().toString(16).slice(2, 42)}`,
            chain
          },
          // Price data (if applicable)
          price: ['sale', 'list', 'offer', 'bid'].includes(activityType) 
            ? +(Math.random() * 10 + 0.1).toFixed(3) 
            : null,
          priceUsd: ['sale', 'list', 'offer', 'bid'].includes(activityType) 
            ? +(Math.random() * 20000 + 200).toFixed(2) 
            : null,
          // Addresses
          fromAddress: activityType === 'mint' 
            ? '0x0000000000000000000000000000000000000000'
            : `0x${Math.random().toString(16).slice(2, 42)}`,
          toAddress: activityType === 'burn' 
            ? '0x0000000000000000000000000000000000000000'
            : user.walletAddress,
          // Transaction data
          txHash: `0x${Math.random().toString(16).slice(2, 66)}`,
          blockNumber: Math.floor(Math.random() * 1000000) + 18000000,
          gasUsed: Math.floor(Math.random() * 200000) + 21000,
          gasPrice: +(Math.random() * 50 + 10).toFixed(2),
          // Timing
          timestamp: new Date(Date.now() - Math.random() * days * 24 * 60 * 60 * 1000),
          // Marketplace data (if applicable)
          marketplace: ['sale', 'list', 'offer'].includes(activityType) 
            ? ['OpenSea', 'Blur', 'X2Y2', 'LooksRare', 'Foundation'][Math.floor(Math.random() * 5)]
            : null,
          // Royalties (if applicable)
          royaltyFee: ['sale'].includes(activityType) ? 5.0 : null,
          marketplaceFee: ['sale', 'offer'].includes(activityType) ? 2.5 : null,
        }
        
        return activity
      })
    }

    // Generate mock activity
    const totalActivity = Math.floor(Math.random() * 200) + 50
    const allActivity = generateMockActivity(totalActivity)

    // Filter by type if specified
    let filteredActivity = allActivity
    if (type) {
      filteredActivity = allActivity.filter(activity => activity.type === type)
    }

    // Sort by timestamp (most recent first)
    filteredActivity.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    // Pagination
    const skip = (page - 1) * limit
    const paginatedActivity = filteredActivity.slice(skip, skip + limit)
    const totalPages = Math.ceil(filteredActivity.length / limit)

    // Calculate activity stats
    const stats = {
      total: filteredActivity.length,
      byType: activityTypes.reduce((acc, type) => {
        acc[type] = filteredActivity.filter(a => a.type === type).length
        return acc
      }, {} as Record<string, number>),
      totalVolume: filteredActivity
        .filter(a => a.type === 'sale' && a.price)
        .reduce((sum, a) => sum + (a.price || 0), 0),
      totalSales: filteredActivity.filter(a => a.type === 'sale').length,
      averagePrice: (() => {
        const sales = filteredActivity.filter(a => a.type === 'sale' && a.price)
        return sales.length > 0 
          ? +(sales.reduce((sum, a) => sum + (a.price || 0), 0) / sales.length).toFixed(3)
          : 0
      })(),
      uniqueCollections: new Set(filteredActivity.map(a => a.nft.collectionName)).size,
      lastActivity: filteredActivity.length > 0 ? filteredActivity[0].timestamp : null
    }

    return NextResponse.json({
      success: true,
      data: {
        activity: paginatedActivity,
        pagination: {
          page,
          limit,
          total: filteredActivity.length,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        stats,
        filters: {
          availableTypes: [...new Set(allActivity.map(a => a.type))],
          availableCollections: [...new Set(allActivity.map(a => a.nft.collectionName))],
          dateRange: {
            oldest: Math.min(...allActivity.map(a => a.timestamp.getTime())),
            newest: Math.max(...allActivity.map(a => a.timestamp.getTime()))
          }
        }
      }
    })

  } catch (error) {
    console.error('Error fetching user activity:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user activity' },
      { status: 500 }
    )
  }
}