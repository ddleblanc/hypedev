import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
    const transformedCollections = collections.map(collection => ({
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
      // Project information
      project: collection.project,
      // Computed fields
      mintedSupply: collection.nfts.length,
      floorPrice: collection.nfts.length > 0 ? Math.random() * 2 + 0.1 : 0, // Mock floor price
      volume: collection.nfts.length * (Math.random() * 5 + 1), // Mock volume
      holders: Math.floor(collection.nfts.length * 0.7), // Mock unique holders
    }));

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
    const { 
      projectId,
      name, 
      symbol, 
      description, 
      image, 
      bannerImage,
      royaltyPercentage,
      chainId,
      maxSupply,
      contractAddress,
      contractType 
    } = body;

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

    // Create collection
    const collection = await prisma.collection.create({
      data: {
        projectId,
        name,
        symbol,
        description,
        image,
        bannerImage,
        address: contractAddress.toLowerCase(),
        creatorAddress: address.toLowerCase(),
        royaltyPercentage: royaltyPercentage || 5,
        chainId: chainId || 1,
        contractType: contractType || 'DropERC721',
        maxSupply,
        isDeployed: true,
        deployedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      collection: {
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
        mintedSupply: 0,
        floorPrice: 0,
        volume: 0,
        holders: 0,
      },
    });

  } catch (error) {
    console.error('Error creating collection:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create collection' },
      { status: 500 }
    );
  }
}