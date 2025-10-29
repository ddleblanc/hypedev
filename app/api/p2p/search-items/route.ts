import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ results: [] });
    }

    // Search for NFTs that match the query
    const nfts = await prisma.nft.findMany({
      where: {
        OR: [
          {
            name: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            collection: {
              name: {
                contains: query,
                mode: "insensitive",
              },
            },
          },
        ],
        ownerAddress: {
          not: null,
        },
      },
      include: {
        collection: {
          select: {
            name: true,
          },
        },
      },
      take: 50,
    });

    // Get unique owner addresses
    const ownerAddresses = [
      ...new Set(nfts.map((nft) => nft.ownerAddress).filter(Boolean)),
    ] as string[];

    // Fetch user data for all owners
    const owners = await prisma.user.findMany({
      where: {
        walletAddress: {
          in: ownerAddresses,
        },
      },
      select: {
        id: true,
        username: true,
        walletAddress: true,
        profilePicture: true,
      },
    });

    // Create a map of walletAddress -> user
    const ownersMap = new Map(
      owners.map((owner) => [owner.walletAddress, owner])
    );

    // Group NFTs by unique item (same tokenId and collection)
    const groupedItems = new Map<string, any>();

    for (const nft of nfts) {
      const key = `${nft.collectionId}-${nft.tokenId}`;

      if (!groupedItems.has(key)) {
        groupedItems.set(key, {
          nft: {
            id: nft.id,
            name: nft.name,
            image: nft.image,
            collectionName: nft.collection?.name,
            collectionId: nft.collectionId,
            tokenId: nft.tokenId,
          },
          owners: [],
        });
      }

      const item = groupedItems.get(key);
      const owner = nft.ownerAddress
        ? ownersMap.get(nft.ownerAddress)
        : null;

      if (owner && !item.owners.some((o: any) => o.id === owner.id)) {
        item.owners.push(owner);
      }
    }

    const results = Array.from(groupedItems.values());

    return NextResponse.json({
      results,
      count: results.length,
    });
  } catch (error) {
    console.error("Error searching items:", error);
    return NextResponse.json(
      { error: "Failed to search items" },
      { status: 500 }
    );
  }
}
