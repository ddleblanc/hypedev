import React from 'react';
import { prisma } from '@/lib/prisma';
import { StudioCollectionPage } from '@/components/studio/studio-collection-page';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        nfts: {
          orderBy: { createdAt: 'desc' },
          include: { traits: true }
        },
        collectionTraits: {
          include: { values: true }
        }
      }
    });

    if (!collection) {
      return (
        <div className="min-h-screen flex items-center justify-center text-white bg-black">
          <div className="text-center">
            <h3 className="text-lg font-semibold">Collection not found</h3>
            <p className="text-white/60">The collection you are looking for does not exist.</p>
          </div>
        </div>
      );
    }

    // Compute unique owner count from NFTs
    const ownersSet = new Set<string>();
    for (const nft of collection.nfts) {
      if (nft.ownerAddress) ownersSet.add(nft.ownerAddress.toLowerCase());
    }

    const clientCollection = {
      id: collection.id,
      title: collection.name,
      subtitle: collection.symbol,
      description: collection.description ?? '',
      longDescription: (collection.story as any) ?? (collection.about as any) ?? collection.description ?? '',
      videoUrl: undefined,
      bannerImage: collection.bannerImage ?? collection.image ?? undefined,
      logo: collection.image ?? undefined,
      stats: {
        owners: ownersSet.size,
        floorPrice: null,
      },
      traits: (collection.collectionTraits || []).map((t: any) => ({
        name: t.traitType,
        rarity: '—',
        percentage: `${Math.round((t.totalValues || 0) / Math.max(1, t.totalNfts || 1) * 100)}%`
      })),
      nfts: (collection.nfts || []).map((nft: any) => ({
        id: nft.id,
        tokenId: nft.tokenId,
        name: nft.name || `#${nft.tokenId}`,
        description: nft.description,
        image: nft.image,
        metadataUri: nft.metadataUri,
        ownerAddress: nft.ownerAddress,
        price: null,
        traits: nft.traits || []
      }))
    };

    return (
      <div className="min-h-screen bg-black">
        <StudioCollectionPage collection={clientCollection} />
      </div>
    );
  } catch (err) {
    console.error('Error loading collection for studio page', err);
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-black">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Error loading collection</h3>
          <p className="text-white/60">Check the server logs for more details.</p>
        </div>
      </div>
    );
  }
}
