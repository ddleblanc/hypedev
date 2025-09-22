"use client";

import React, { useState } from "react";
import { MarketplaceView } from "@/components/authenticated-homescreen/marketplace-view";
import { CollectionDetail } from "@/components/collection-detail";

interface MarketplaceContainerProps {
  setViewMode: (mode: string) => void;
}

export function MarketplaceContainer({ setViewMode }: MarketplaceContainerProps) {
  console.log('MarketplaceContainer props:', { setViewMode });
  const [currentView, setCurrentView] = useState<'marketplace' | 'collection'>('marketplace');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');

  const handleCollectionClick = (collectionId: string) => {
    console.log('Collection clicked:', collectionId);
    setSelectedCollectionId(collectionId);
    setCurrentView('collection');
  };

  const handleBackToMarketplace = () => {
    setCurrentView('marketplace');
    setSelectedCollectionId('');
  };

  console.log('MarketplaceContainer render - currentView:', currentView, 'selectedCollectionId:', selectedCollectionId);
  
  if (currentView === 'collection' && selectedCollectionId) {
    console.log('Rendering CollectionDetail');
    return (
      <CollectionDetail 
        collectionId={selectedCollectionId}
        onBack={handleBackToMarketplace}
      />
    );
  }

  console.log('Rendering MarketplaceView with onCollectionClick:', handleCollectionClick);
  return (
    <MarketplaceView 
      setViewMode={setViewMode}
      onCollectionClick={handleCollectionClick}
    />
  );
}