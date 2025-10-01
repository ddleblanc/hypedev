import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { fetchCollectionStats } from '@/lib/graph-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const projectId = searchParams.get('projectId');
    
    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await auth.getUserByWallet(address);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Build query conditions
    const whereCondition: any = {
      creatorAddress: address.toLowerCase(),
    };

    if (projectId) {
      whereCondition.projectId = projectId;
    }

    // Fetch collections with computed fields
    const collections = await prisma.collection.findMany({
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
        updatedAt: 'desc',
      },
    });

    // Transform collections with computed fields
    const transformedCollections = await Promise.all(
      collections.map(async (collection) => {
        // Try to fetch real stats from The Graph
        let realStats = null;
        if (collection.address && collection.isDeployed) {
          // Remove verbose logging
          // console.log('Collection from DB:', {
          //   id: collection.id,
          //   name: collection.name,
          //   address: collection.address,
          //   chainId: collection.chainId,
          //   isDeployed: collection.isDeployed
          // });

          try {
            realStats = await fetchCollectionStats(
              collection.address,
              collection.chainId
            );
            // console.log('Stats result for', collection.address, ':', realStats);
          } catch (error) {
            console.error('Error fetching stats for', collection.address, ':', error);
          }
        }

        // Use real stats if available, otherwise default to 0
        const floorPrice = realStats?.floorPrice || 0;

        const volume = realStats?.totalVolume || 0;

        const holders = realStats?.holders || 0;

        const mintedSupply = realStats?.totalSupply || collection.nfts.length;

        return {
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
          // Real or computed fields
          mintedSupply,
          floorPrice,
          volume,
          holders,
          // Additional stats from The Graph
          recentSales: realStats?.sales?.slice(0, 5) || []
        };
      })
    );

    return NextResponse.json({
      success: true,
      collections: transformedCollections,
    });

  } catch (error) {
    console.error('Error fetching collections:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch collections' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log('Received body:', JSON.stringify(body, null, 2));

    // Support both nested format { collection: {...} } and direct format {...}
    const {
      project,  // New project data if creating new
      projectId,  // Existing project ID if using existing
      collection  // Collection data with IPFS URLs (legacy format)
    } = body;

    // Extract collection data - support both formats
    const collectionData = collection || body;

    const {
      name,
      symbol,
      description,
      image,
      bannerImage,
      royaltyPercentage,
      chainId,
      maxSupply,
      contractAddress,
      contractType,
      category,
      tags,
      transactionHash,
      isDeployed,
      claimPhases
    } = collectionData;

    if (!name || !symbol || !contractAddress) {
      return NextResponse.json(
        { success: false, error: 'Name, symbol, and contract address are required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await auth.getUserByWallet(address);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if contract address already exists
    const existingCollection = await prisma.collection.findUnique({
      where: {
        address: contractAddress.toLowerCase(),
      },
    });

    if (existingCollection) {
      return NextResponse.json(
        { success: false, error: 'Collection with this contract address already exists' },
        { status: 400 }
      );
    }

    // Create new project if needed
    let finalProjectId = projectId;
    if (project && !projectId) {
      const newProject = await prisma.project.create({
        data: {
          name: project.name,
          description: project.description,
          genre: project.genre || null,
          concept: project.concept || null,
          banner: project.banner || null,
          creatorId: user.id,
          status: 'active',
        },
      });
      finalProjectId = newProject.id;
    }

    // Create collection with IPFS URLs
    const newCollection = await prisma.collection.create({
      data: {
        projectId: finalProjectId,
        name,
        symbol,
        description,
        image,  // IPFS URL from Thirdweb storage
        bannerImage,  // IPFS URL from Thirdweb storage
        profileImage: image,  // Using collection image as profile image for now
        address: contractAddress.toLowerCase(),
        creatorAddress: address.toLowerCase(),
        royaltyPercentage: parseFloat(royaltyPercentage) || 5,
        chainId: parseInt(chainId) || 11155111,  // Default to Sepolia
        contractType: contractType || 'DropERC721',
        maxSupply: maxSupply ? parseInt(maxSupply) : null,
        category: category || null,
        tags: tags || [],
        transactionHash: transactionHash || null,
        isDeployed: isDeployed !== undefined ? isDeployed : true,
        deployedAt: isDeployed ? new Date() : null,
        claimPhases: claimPhases || null,  // Store claim phases as JSON string
      },
    });

    return NextResponse.json({
      success: true,
      projectId: finalProjectId,
      collection: {
        id: newCollection.id,
        projectId: newCollection.projectId,
        name: newCollection.name,
        symbol: newCollection.symbol,
        description: newCollection.description,
        image: newCollection.image,  // IPFS URL
        bannerImage: newCollection.bannerImage,  // IPFS URL
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
    });

  } catch (error) {
    console.error('Error creating collection:', error);
    // Return more detailed error for debugging
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create collection',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { collectionId, sharedMetadata } = body;

    if (!collectionId) {
      return NextResponse.json(
        { success: false, error: 'Collection ID is required' },
        { status: 400 }
      );
    }

    // Update the collection with shared metadata
    const updatedCollection = await prisma.collection.update({
      where: { id: collectionId },
      data: {
        sharedMetadata: sharedMetadata,
        sharedMetadataSetAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      collection: updatedCollection
    });

  } catch (error) {
    console.error('Error updating collection:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update collection',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}