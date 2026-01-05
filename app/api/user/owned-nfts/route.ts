import { NextRequest, NextResponse } from "next/server";
import { getContract } from "thirdweb";
import { getOwnedNFTs } from "thirdweb/extensions/erc721";
import { getOwnedTokenIds } from "thirdweb/extensions/erc1155";
import { client } from "@/lib/thirdweb";
import { defineChain } from "thirdweb/chains";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID || "11155111";
const chain = defineChain(parseInt(CHAIN_ID));

// GET /api/user/owned-nfts - Get NFTs owned by a wallet address
// Supports pagination with ?limit=12&offset=0
export async function GET(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, "api");
  if (rateLimitResult) return rateLimitResult;

  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");
    const limit = Math.min(parseInt(searchParams.get("limit") || "12"), 50); // Max 50 per request
    const offset = parseInt(searchParams.get("offset") || "0");

    if (!address) {
      return NextResponse.json(
        { success: false, error: "Missing address parameter" },
        { status: 400 }
      );
    }

    // First, get total count from database for pagination info
    const totalCount = await prisma.nft.count({
      where: {
        ownerAddress: address.toLowerCase(),
      },
    });

    // Fetch paginated NFTs from database (primary source for pagination)
    const dbNfts = await prisma.nft.findMany({
      where: {
        ownerAddress: address.toLowerCase(),
      },
      include: {
        collection: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        traits: {
          select: {
            traitType: true,
            value: true,
          },
        },
        marketplaceOffers: {
          where: {
            status: 'ACTIVE',
            expirationTimestamp: {
              gt: new Date(),
            },
          },
          orderBy: {
            offerAmount: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: offset,
      take: limit,
    });

    const ownedNFTs: Array<{
      id: string;
      dbId: string;
      contractAddress: string;
      tokenId: string;
      onChainTokenId: string | null;
      name: string;
      image: string;
      collectionName: string;
      collectionId: string;
      tokenType: "ERC721" | "ERC1155";
      balance?: number;
      rarity?: string;
      listed: boolean;
      listingId?: string;
      hasOffer: boolean;
      offerPrice?: string;
      traits: Array<{ trait_type: string; value: string }>;
    }> = [];

    // Map database NFTs
    for (const nft of dbNfts) {
      const contractAddr = nft.collection?.address || "";
      const cleanTokenId = nft.tokenId.includes("-")
        ? nft.tokenId.split("-")[0]
        : nft.tokenId;

      const highestOffer = nft.marketplaceOffers?.[0];

      ownedNFTs.push({
        id: `${contractAddr}-${cleanTokenId}`,
        dbId: nft.id,
        contractAddress: contractAddr,
        tokenId: cleanTokenId,
        onChainTokenId: nft.onChainTokenId,
        name: nft.name,
        image: nft.image || "/api/placeholder/400/400",
        collectionName: nft.collection?.name || "Unknown Collection",
        collectionId: nft.collection?.id || "",
        tokenType: "ERC721",
        rarity: nft.rarityTier || undefined,
        listed: nft.isListed,
        listingId: nft.listingId || undefined,
        hasOffer: !!highestOffer,
        offerPrice: highestOffer?.offerAmount?.toString(),
        traits: nft.traits?.map((t: { traitType: string; value: string }) => ({ trait_type: t.traitType, value: t.value })) || [],
      });
    }

    // Only fetch from blockchain on first page to supplement if DB is empty
    if (offset === 0 && ownedNFTs.length === 0) {
      const collections = await prisma.collection.findMany({
        where: {
          nfts: {
            some: {
              ownerAddress: address.toLowerCase(),
            },
          },
        },
        select: {
          id: true,
          name: true,
          address: true,
        },
      });

      if (collections.length > 0) {
        for (const collection of collections) {
          if (!collection.address) continue;

          try {
            const contract = getContract({
              client,
              chain,
              address: collection.address,
            });

            try {
              const nfts = await getOwnedNFTs({
                contract,
                owner: address,
              });

              for (const nft of nfts) {
                const nftId = `${collection.address}-${nft.id.toString()}`;
                if (!ownedNFTs.some((n) => n.id === nftId)) {
                  ownedNFTs.push({
                    id: nftId,
                    dbId: '',
                    contractAddress: collection.address,
                    tokenId: nft.id.toString(),
                    onChainTokenId: nft.id.toString(),
                    name: nft.metadata?.name || `#${nft.id.toString()}`,
                    image: nft.metadata?.image || "/api/placeholder/400/400",
                    collectionName: collection.name,
                    collectionId: collection.id,
                    tokenType: "ERC721",
                    listed: false,
                    hasOffer: false,
                    traits: [],
                  });
                }
              }
            } catch {
              try {
                const ownedTokens = await getOwnedTokenIds({
                  contract,
                  address,
                });

                for (const token of ownedTokens) {
                  const nftId = `${collection.address}-${token.tokenId.toString()}`;
                  if (!ownedNFTs.some((n) => n.id === nftId)) {
                    ownedNFTs.push({
                      id: nftId,
                      dbId: '',
                      contractAddress: collection.address,
                      tokenId: token.tokenId.toString(),
                      onChainTokenId: token.tokenId.toString(),
                      name: `${collection.name} #${token.tokenId.toString()}`,
                      image: "/api/placeholder/400/400",
                      collectionName: collection.name,
                      collectionId: collection.id,
                      tokenType: "ERC1155",
                      balance: Number(token.balance),
                      listed: false,
                      hasOffer: false,
                      traits: [],
                    });
                  }
                }
              } catch {
                // Neither standard worked, skip
              }
            }
          } catch (contractError) {
            console.error(`Error fetching from ${collection.address}:`, contractError);
          }
        }
      }
    }

    const hasMore = offset + ownedNFTs.length < totalCount;

    return NextResponse.json({
      success: true,
      nfts: ownedNFTs,
      count: ownedNFTs.length,
      total: totalCount,
      hasMore,
      nextOffset: hasMore ? offset + limit : null,
    });
  } catch (error) {
    console.error("Error fetching owned NFTs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch owned NFTs" },
      { status: 500 }
    );
  }
}
