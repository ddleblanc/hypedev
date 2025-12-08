"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Rocket,
  Calendar,
  Gift,
  Crown,
  Sparkles,
  Activity,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CollectionCarousel } from "@/components/shared/collection-carousel";
import {
  CollectionCard,
  NFTSaleCard,
  LaunchpadCard,
  LootboxCard
} from "@/components/shared/homepage-cards";

// Import new section components
import {
  HeroCarousel,
  HeroSearchBar,
  PlatformStatsBar,
  CategoryNavigation,
  TopCollectionsTable,
  LiveActivityFeed,
  HomepageFooter,
} from "@/components/homepage/sections";

import type {
  CollectionCardData,
  NFTSaleData,
  LaunchpadProjectData,
  LootboxData
} from "@/types/homepage";

// Section Header Component
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  viewAllHref?: string;
  viewAllLabel?: string;
  className?: string;
}

function SectionHeader({
  title,
  subtitle,
  icon,
  viewAllHref,
  viewAllLabel = "View All",
  className
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between mb-4 md:mb-6", className)}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className="p-2 rounded-lg bg-[rgb(163,255,18)]/10 text-[rgb(163,255,18)]">
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white">{title}</h2>
          {subtitle && (
            <p className="text-sm text-white/60">{subtitle}</p>
          )}
        </div>
      </div>
      {viewAllHref && (
        <Button
          variant="ghost"
          size="sm"
          className="text-white/70 hover:text-white hover:bg-white/10"
          asChild
        >
          <Link href={viewAllHref}>
            {viewAllLabel}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
      )}
    </div>
  );
}

// Main Traditional Homepage Component
export function TraditionalHomepage() {
  // State for all sections
  const [featuredCollections, setFeaturedCollections] = useState<CollectionCardData[]>([]);
  const [trendingCollections, setTrendingCollections] = useState<CollectionCardData[]>([]);
  const [topSales, setTopSales] = useState<NFTSaleData[]>([]);
  const [currentLaunches, setCurrentLaunches] = useState<LaunchpadProjectData[]>([]);
  const [upcomingLaunches, setUpcomingLaunches] = useState<LaunchpadProjectData[]>([]);
  const [trendingLootboxes, setTrendingLootboxes] = useState<LootboxData[]>([]);

  // Loading states
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);
  const [isLoadingTrending, setIsLoadingTrending] = useState(true);
  const [isLoadingTopSales, setIsLoadingTopSales] = useState(true);
  const [isLoadingLaunches, setIsLoadingLaunches] = useState(true);
  const [isLoadingLootboxes, setIsLoadingLootboxes] = useState(true);

  // Fetch Featured Collections
  useEffect(() => {
    async function fetchFeatured() {
      try {
        const response = await fetch('/api/collections/featured');
        const data = await response.json();
        if (data.success && data.collections?.length > 0) {
          setFeaturedCollections(data.collections);
        }
      } catch (error) {
        console.error('Error fetching featured collections:', error);
      } finally {
        setIsLoadingFeatured(false);
      }
    }
    fetchFeatured();
  }, []);

  // Fetch Trending Collections
  useEffect(() => {
    async function fetchTrending() {
      try {
        const response = await fetch('/api/marketplace/trending');
        const data = await response.json();
        if (data.success && data.collections?.length > 0) {
          // Map API response to our type
          const mapped: CollectionCardData[] = data.collections.map((c: any) => ({
            id: c.id,
            name: c.title || c.name,
            slug: c.id,
            image: c.image,
            floorPrice: c.floor?.split(' ')[0] || '0',
            floorPriceCurrency: c.floor?.split(' ')[1] || 'ETH',
            change24h: c.change,
            creatorName: c.creatorName,
            isVerified: c.isVerified,
            isTrending: true,
          }));
          setTrendingCollections(mapped);
        }
      } catch (error) {
        console.error('Error fetching trending collections:', error);
      } finally {
        setIsLoadingTrending(false);
      }
    }
    fetchTrending();
  }, []);

  // Fetch Top Sales (placeholder - create API later)
  useEffect(() => {
    async function fetchTopSales() {
      try {
        // TODO: Create /api/marketplace/top-sales endpoint
        setTopSales([]);
      } catch (error) {
        console.error('Error fetching top sales:', error);
      } finally {
        setIsLoadingTopSales(false);
      }
    }
    fetchTopSales();
  }, []);

  // Fetch Launchpad Projects
  useEffect(() => {
    async function fetchLaunches() {
      try {
        const response = await fetch('/api/launchpad/projects');
        const data = await response.json();
        if (data.success && data.projects?.length > 0) {
          const current = data.projects.filter((p: any) => p.status === 'live');
          const upcoming = data.projects.filter((p: any) => p.status === 'upcoming');
          setCurrentLaunches(current);
          setUpcomingLaunches(upcoming);
        }
      } catch (error) {
        console.error('Error fetching launchpad projects:', error);
      } finally {
        setIsLoadingLaunches(false);
      }
    }
    fetchLaunches();
  }, []);

  // Fetch Lootboxes (placeholder - create API later)
  useEffect(() => {
    async function fetchLootboxes() {
      try {
        // TODO: Create /api/lootboxes/trending endpoint
        setTrendingLootboxes([]);
      } catch (error) {
        console.error('Error fetching lootboxes:', error);
      } finally {
        setIsLoadingLootboxes(false);
      }
    }
    fetchLootboxes();
  }, []);

  return (
    <div className="min-h-screen bg-black">
      {/* =============================================== */}
      {/* NEW: Hero Carousel with Search Bar */}
      {/* =============================================== */}
      <HeroCarousel
        collections={featuredCollections.slice(0, 5)}
        isLoading={isLoadingFeatured}
        autoPlayInterval={6000}
      >
        <HeroSearchBar placeholder="Search collections, NFTs, or users..." />
      </HeroCarousel>

      {/* =============================================== */}
      {/* NEW: Platform Stats Banner */}
      {/* =============================================== */}
      <PlatformStatsBar />

      {/* Main Content */}
      <div className="container mx-auto px-4 md:px-8 py-8 md:py-12 space-y-12 md:space-y-16">

        {/* =============================================== */}
        {/* NEW: Category Navigation */}
        {/* =============================================== */}
        <CategoryNavigation />

        {/* =============================================== */}
        {/* NEW: Top Collections Ranking Table */}
        {/* =============================================== */}
        <section>
          <SectionHeader
            title="Top Collections"
            subtitle="Ranked by 24h trading volume"
            icon={<TrendingUp className="w-5 h-5" />}
            viewAllHref="/marketplace/rankings"
          />
          <TopCollectionsTable limit={10} />
        </section>

        {/* =============================================== */}
        {/* NEW: Live Activity Feed */}
        {/* =============================================== */}
        <section>
          <SectionHeader
            title="Live Activity"
            subtitle="Real-time marketplace activity"
            icon={<Activity className="w-5 h-5" />}
            viewAllHref="/activity"
          />
          <LiveActivityFeed autoScroll={true} refreshInterval={30000} />
        </section>

        {/* Featured Collections Carousel */}
        <section>
          <SectionHeader
            title="Featured Collections"
            subtitle="Handpicked by our team"
            icon={<Crown className="w-5 h-5" />}
            viewAllHref="/marketplace?filter=featured"
          />
          <CollectionCarousel
            items={featuredCollections}
            renderItem={(collection) => (
              <CollectionCard collection={collection} variant="featured" />
            )}
            isLoading={isLoadingFeatured}
            loadingCount={4}
            itemClassName="w-56 md:w-64"
            config={{ gap: 16 }}
          />
        </section>

        {/* Trending Collections Carousel */}
        <section>
          <SectionHeader
            title="Trending Collections"
            subtitle="Most popular in the last 24 hours"
            icon={<TrendingUp className="w-5 h-5" />}
            viewAllHref="/marketplace?sort=trending"
          />
          <CollectionCarousel
            items={trendingCollections}
            renderItem={(collection) => (
              <CollectionCard collection={collection} />
            )}
            isLoading={isLoadingTrending}
            loadingCount={6}
            itemClassName="w-40 md:w-48"
          />
        </section>

        {/* Top Sales */}
        {(isLoadingTopSales || topSales.length > 0) && (
          <section>
            <SectionHeader
              title="Top Sales"
              subtitle="Highest value transactions"
              icon={<Sparkles className="w-5 h-5" />}
              viewAllHref="/activity?type=sales"
            />
            {topSales.length > 0 ? (
              <CollectionCarousel
                items={topSales}
                renderItem={(sale) => (
                  <NFTSaleCard sale={sale} />
                )}
                isLoading={isLoadingTopSales}
                loadingCount={6}
                itemClassName="w-40 md:w-48"
              />
            ) : !isLoadingTopSales && (
              <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                <Sparkles className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/60">Top sales data coming soon</p>
              </div>
            )}
          </section>
        )}

        {/* Current Launches */}
        {(isLoadingLaunches || currentLaunches.length > 0) && (
          <section>
            <SectionHeader
              title="Live Now"
              subtitle="Currently minting"
              icon={<Rocket className="w-5 h-5" />}
              viewAllHref="/launchpad?status=live"
            />
            {currentLaunches.length > 0 ? (
              <CollectionCarousel
                items={currentLaunches}
                renderItem={(project) => (
                  <LaunchpadCard project={project} variant="featured" />
                )}
                isLoading={isLoadingLaunches}
                loadingCount={4}
                itemClassName="w-64 md:w-72"
                config={{ gap: 16 }}
              />
            ) : !isLoadingLaunches && (
              <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                <Rocket className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/60">No live launches right now</p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link href="/launchpad">View Upcoming</Link>
                </Button>
              </div>
            )}
          </section>
        )}

        {/* Upcoming Launches */}
        {(isLoadingLaunches || upcomingLaunches.length > 0) && (
          <section>
            <SectionHeader
              title="Upcoming Launches"
              subtitle="Don't miss these drops"
              icon={<Calendar className="w-5 h-5" />}
              viewAllHref="/launchpad?status=upcoming"
            />
            {upcomingLaunches.length > 0 ? (
              <CollectionCarousel
                items={upcomingLaunches}
                renderItem={(project) => (
                  <LaunchpadCard project={project} />
                )}
                isLoading={isLoadingLaunches}
                loadingCount={4}
                itemClassName="w-48 md:w-56"
              />
            ) : !isLoadingLaunches && (
              <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                <Calendar className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/60">No upcoming launches scheduled</p>
              </div>
            )}
          </section>
        )}

        {/* Trending Lootboxes */}
        {(isLoadingLootboxes || trendingLootboxes.length > 0) && (
          <section>
            <SectionHeader
              title="Trending Lootboxes"
              subtitle="Mystery awaits"
              icon={<Gift className="w-5 h-5" />}
              viewAllHref="/lootboxes"
            />
            {trendingLootboxes.length > 0 ? (
              <CollectionCarousel
                items={trendingLootboxes}
                renderItem={(lootbox) => (
                  <LootboxCard lootbox={lootbox} />
                )}
                isLoading={isLoadingLootboxes}
                loadingCount={6}
                itemClassName="w-40 md:w-48"
              />
            ) : !isLoadingLootboxes && (
              <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                <Gift className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/60">Lootboxes coming soon</p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link href="/lootboxes">Explore Lootboxes</Link>
                </Button>
              </div>
            )}
          </section>
        )}

      </div>

      {/* =============================================== */}
      {/* NEW: Full Footer */}
      {/* =============================================== */}
      <HomepageFooter />
    </div>
  );
}
