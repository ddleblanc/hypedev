import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    
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

    // Fetch user's projects with computed fields
    const projects = await prisma.project.findMany({
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
        updatedAt: 'desc',
      },
    });

    // Transform projects with computed fields
    const transformedProjects = projects.map(project => ({
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
        return sum + (col.nfts.length * 0.1); // 0.1 ETH average
      }, 0),
      holders: project.collections.reduce((sum, col) => {
        // Mock unique holders - in production, count unique owner addresses
        return sum + Math.floor(col.nfts.length * 0.8); // Assume 80% unique holders
      }, 0),
    }));

    return NextResponse.json({
      success: true,
      projects: transformedProjects,
    });

  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch projects' },
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
    const { name, description, banner, genre, concept } = body;

    if (!name || !description) {
      return NextResponse.json(
        { success: false, error: 'Name and description are required' },
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

    // Create project
    const project = await prisma.project.create({
      data: {
        name,
        description,
        banner,
        genre,
        concept,
        creatorId: user.id,
        status: 'draft',
      },
    });

    return NextResponse.json({
      success: true,
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
    });

  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create project' },
      { status: 500 }
    );
  }
}