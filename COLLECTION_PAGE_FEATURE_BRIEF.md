# Collection Detail Page - Feature Parity Briefing

## Objective
Bring the collection detail page to feature parity with OpenSea and Magic Eden.

---

## Current State Summary

### What's Already Implemented (Backend)
- **Direct Listings**: Full Thirdweb v5 integration (`lib/marketplace.ts`)
- **English Auctions**: Create, bid, buyout, settle, claim
- **Offers**: Make, accept, cancel offers on any NFT
- **Sweep Floor**: `sweepFloor()` function with price limits
- **Floor Price Caching**: 5-minute TTL with sync utilities
- **Activity Logging**: Database tracking for all events

### What's Broken/Incomplete (Frontend)
- Analytics charts use **mock data**, not real blockchain data
- Activity feed is **static**, no real-time updates
- Sweep/bulk buy dialogs exist but use **mock data**
- Filters are basic - no status filter, no trait combos
- No cart functionality connected to actual purchase flow

---

## Priority 1: Core Trading Features

### 1.1 Connect Sweep Floor UI to Backend

**Current State**: `components/collection/sweep-floor-dialog.tsx` exists with mock items

**Task**: Wire up to real data

**Files to modify**:
- `components/collection/sweep-floor-dialog.tsx`
- `components/collection/items-tab.tsx` (add sweep button)

**Backend already exists**:
```typescript
// lib/marketplace.ts
export async function sweepFloor(params: {
  collectionAddress: Address;
  maxItems: number;
  maxTotalPrice: bigint;
  account: Account;
})

// API: GET /api/marketplace/sweep - preview
// API: POST /api/marketplace/sweep - execute
```

**Implementation**:
1. Add "Sweep" button to items filter bar
2. Fetch floor listings via API: `GET /api/marketplace/sweep?collection={addr}&maxItems=10`
3. Show preview with total cost
4. Execute via POST with connected wallet
5. Handle transaction states (pending, success, error)

**Reference**: [OpenSea Sweep Feature](https://nftcalendar.io/news/opensea-new-sweep-feature-allows-users-to-sweep-nft-collections-by-feature-and-price-range/)

---

### 1.2 Shopping Cart for Bulk Purchases

**Current State**: No cart system

**Task**: Implement cart that aggregates multiple NFTs for single checkout

**Files to create/modify**:
- Create `components/collection/cart-provider.tsx` (React Context)
- Create `components/collection/cart-drawer.tsx` (slide-out cart UI)
- Modify `components/collection/item-card.tsx` (add to cart button)
- Modify `components/collection/items-tab.tsx` (cart summary)

**Features needed**:
- Add/remove items from cart
- Show running total (ETH + USD)
- Max 30 items per cart (OpenSea limit)
- Clear cart
- Checkout executes sequential purchases
- Persist cart in localStorage

**Reference**: OpenSea allows up to 30 NFTs from same chain in cart

---

### 1.3 Collection Offers (Offer on Any NFT in Collection)

**Current State**: Individual offers only

**Task**: Allow "Make Collection Offer" that any holder can accept

**Files to modify**:
- Create `components/collection/collection-offer-dialog.tsx`
- Modify `components/collection/collection-hero.tsx` (add button)
- Create `app/api/marketplace/collection-offers/route.ts`

**Implementation**:
- User specifies price in WETH
- Offer valid for any NFT in collection
- First holder to accept wins
- Support trait-based offers (offer only on items with specific traits)
- Duration: default 30 days, max 6 months

**Reference**: [OpenSea Collection Offers](https://support.opensea.io/en/articles/8866980-what-is-a-collection-offer)

---

### 1.4 Bulk Listing

**Current State**: Single item listing only

**Task**: Allow listing multiple NFTs at once

**Files to create**:
- Create `components/collection/bulk-list-dialog.tsx`
- Modify `lib/marketplace.ts` (add `bulkCreateListings()`)

**Features**:
- Select multiple owned NFTs
- Set individual prices OR global price
- Preview all listings with fees
- Single approval transaction (if not already approved)
- Batch create listings

**Reference**: [Magic Eden Bulk Listing](https://help.magiceden.io/en/articles/8264557-how-to-use-magic-eden-s-collection-page-for-nft-discovery-and-trading)

---

## Priority 2: Filtering & Discovery

### 2.1 Status Filter (Listed / Not Listed / Has Offers)

**Current State**: No status filtering

**Task**: Add status filter dropdown

**Files to modify**:
- `components/collection/items-filters-bar.tsx`
- `components/collection/items-tab.tsx`

**Implementation**:
```typescript
type ListingStatus = 'all' | 'listed' | 'not-listed' | 'has-offers' | 'on-auction';
```

Filter items based on:
- `item.listed === true` for listed
- `item.hasOffer === true` for has offers
- Check against MarketplaceListing table for auction status

---

### 2.2 Multi-Trait Combo Filtering

**Current State**: Single trait selection only

**Task**: Allow AND/OR trait combinations

**Files to modify**:
- `components/collection/advanced-filters-panel.tsx`
- `components/collection/items-tab.tsx`

**Implementation**:
- UI: Chips showing selected traits with AND/OR toggle
- Logic: `traits.every()` for AND, `traits.some()` for OR
- Show result count preview before applying

**Reference**: [Magic Eden Trait Filters](https://help.magiceden.io/en/articles/8351553-how-to-sweep-specific-nfts-using-trait-filters-on-magic-eden)

---

### 2.3 Dynamic Price Range

**Current State**: Fixed 0-100 ETH range

**Task**: Calculate min/max from actual listings

**Files to modify**:
- `components/collection/advanced-filters-panel.tsx`
- `components/collection/items-tab.tsx`

**Implementation**:
1. On collection load, calculate actual price range from items
2. Set slider min/max dynamically
3. Show "Floor: X ETH" and "Ceiling: Y ETH" labels
4. Add quick buttons: "Floor", "Under 2x Floor", "Custom"

---

### 2.4 Additional Sort Options

**Current State**: 5 sort options

**Task**: Add professional sorting

**Add to `items-filters-bar.tsx`**:
- "Best Offer" - highest offer amount
- "Ending Soon" - auctions ending soonest
- "Recently Sold" - most recent sales
- "Most Viewed" - requires view tracking
- "Rarity Score" - requires rarity calculation

---

## Priority 3: Real-Time Activity

### 3.1 Live Activity Feed

**Current State**: Static data, manual refresh

**Task**: Implement WebSocket for real-time updates

**Files to create/modify**:
- Create `lib/activity-socket.ts` (WebSocket client)
- Create `app/api/activity/stream/route.ts` (Server-Sent Events)
- Modify `components/collection/activity-tab.tsx`

**Implementation Options**:

**Option A: Server-Sent Events (Simpler)**
```typescript
// app/api/activity/stream/route.ts
export async function GET(request: Request) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Poll database every 5 seconds
      // Send new activities as SSE events
    }
  });
  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' }
  });
}
```

**Option B: WebSocket via Pusher/Ably (Production)**
- Use Pusher or Ably for managed WebSocket
- Trigger events from API routes on new activity
- Subscribe in frontend

**Reference**: [Alchemy Webhooks for NFT Events](https://www.alchemy.com/docs/how-to-use-custom-webhooks-for-nft-marketplace-alerts)

---

### 3.2 Activity Filtering

**Current State**: No filtering

**Task**: Add filters to activity tab

**Files to modify**:
- `components/collection/activity-tab.tsx`

**Filters needed**:
- Event type: Sales, Listings, Transfers, Offers, Bids
- Date range: Last 24h, 7d, 30d, Custom
- Price range: Min/Max ETH
- Address search: From/To wallet

---

### 3.3 Activity Export

**Task**: Export activity history

**Implementation**:
- Add "Export" button to activity tab
- Generate CSV with columns: Type, Item, Price, From, To, Timestamp, TX Hash
- Also support JSON format

---

## Priority 4: Analytics with Real Data

### 4.1 Replace Mock Chart Data

**Current State**: `generateMockData()` in analytics-tab.tsx

**Task**: Fetch real historical data

**Files to modify**:
- `components/collection/analytics-tab.tsx`
- Create `app/api/collections/[id]/analytics/route.ts`

**Data sources**:
1. **Floor Price History**: Query MarketplaceListing by date, get min price per day
2. **Volume**: Sum of sale prices from Activity table grouped by day
3. **Sales Count**: Count of Activity type='sale' grouped by day

**API Response Shape**:
```typescript
interface AnalyticsData {
  floorHistory: { date: string; price: number }[];
  volumeHistory: { date: string; volume: number }[];
  salesHistory: { date: string; count: number }[];
  holderDistribution: { range: string; count: number }[];
}
```

---

### 4.2 Rarity Score System

**Current State**: Basic rarity tiers (Common, Rare, etc.)

**Task**: Implement statistical rarity scoring

**Files to create**:
- Create `lib/rarity.ts`
- Modify `components/collection/item-card.tsx`

**Algorithm**:
```typescript
// Statistical rarity = 1 / (trait_frequency)
// Rarity score = sum of all trait rarities
function calculateRarityScore(item: NFT, collection: Collection): number {
  return item.traits.reduce((score, trait) => {
    const frequency = trait.count / collection.totalSupply;
    return score + (1 / frequency);
  }, 0);
}
```

**Display**:
- Show rarity rank (#1, #2, etc.)
- Show rarity score
- Color-code by percentile

**Reference**: Magic Eden supports Statistical, Moonrank, HowRare rarity sources

---

## Priority 5: User Features

### 5.1 Watchlist / Favorites

**Task**: Allow users to save items and collections

**Files to create**:
- Create Prisma model: `Watchlist { userId, itemId?, collectionId?, createdAt }`
- Create `app/api/user/watchlist/route.ts`
- Create `components/collection/watchlist-button.tsx`

**Features**:
- Heart icon on item cards
- "Add to Watchlist" on collection page
- View watchlist in user profile
- Optional: Price drop notifications

---

### 5.2 Price Alerts

**Task**: Notify when floor drops below threshold

**Files to create**:
- Create Prisma model: `PriceAlert { userId, collectionId, threshold, active }`
- Create `app/api/user/alerts/route.ts`
- Create `components/collection/price-alert-dialog.tsx`

**Implementation**:
- User sets alert: "Notify me when floor < X ETH"
- Background job checks floor prices
- Send notification (email, push, or in-app)

---

## File Reference Map

| Feature | Primary Files | API Routes |
|---------|---------------|------------|
| Sweep Floor | `sweep-floor-dialog.tsx`, `lib/marketplace.ts` | `/api/marketplace/sweep` |
| Cart | `cart-provider.tsx`, `cart-drawer.tsx` | N/A (client-side) |
| Collection Offers | `collection-offer-dialog.tsx` | `/api/marketplace/collection-offers` |
| Bulk Listing | `bulk-list-dialog.tsx` | `/api/marketplace/listings` (batch) |
| Status Filter | `items-filters-bar.tsx` | N/A (client-side filter) |
| Trait Combos | `advanced-filters-panel.tsx` | N/A (client-side filter) |
| Live Activity | `activity-tab.tsx`, `lib/activity-socket.ts` | `/api/activity/stream` |
| Real Analytics | `analytics-tab.tsx` | `/api/collections/[id]/analytics` |
| Rarity Scores | `lib/rarity.ts`, `item-card.tsx` | `/api/collections/[id]/rarity` |
| Watchlist | `watchlist-button.tsx` | `/api/user/watchlist` |
| Price Alerts | `price-alert-dialog.tsx` | `/api/user/alerts` |

---

## External Research Links

### OpenSea
- [OpenSea Sweep Feature](https://nftcalendar.io/news/opensea-new-sweep-feature-allows-users-to-sweep-nft-collections-by-feature-and-price-range/)
- [Collection Offers](https://support.opensea.io/en/articles/8866980-what-is-a-collection-offer)
- [Trait-Based Offers](https://support.opensea.io/en/articles/8867017-how-do-i-turn-on-collection-offers-for-traits)
- [OpenSea API Docs](https://docs.opensea.io/reference/api-overview)

### Magic Eden
- [Collection Page Guide](https://help.magiceden.io/en/articles/8264557-how-to-use-magic-eden-s-collection-page-for-nft-discovery-and-trading)
- [Sweep with Trait Filters](https://help.magiceden.io/en/articles/8351553-how-to-sweep-specific-nfts-using-trait-filters-on-magic-eden)
- [Trait-Based Offers](https://help.magiceden.io/en/articles/7222505-how-to-make-trait-based-collection-offers)

### Technical Resources
- [Alchemy NFT Webhooks](https://www.alchemy.com/docs/how-to-use-custom-webhooks-for-nft-marketplace-alerts)
- [Thirdweb Marketplace v5 Docs](https://portal.thirdweb.com/typescript/v5/extensions/marketplace)

---

## Implementation Order

### Phase 1: Trading Core (1-2 weeks effort)
1. Connect sweep floor UI to backend
2. Implement shopping cart
3. Add status filter (Listed/Not Listed)

### Phase 2: Discovery (1 week effort)
1. Multi-trait combo filtering
2. Dynamic price range slider
3. Additional sort options

### Phase 3: Real-Time (1-2 weeks effort)
1. Live activity feed (SSE or WebSocket)
2. Activity filtering
3. Replace mock analytics with real data

### Phase 4: Advanced Features (2+ weeks effort)
1. Collection offers with trait targeting
2. Bulk listing
3. Rarity scoring system
4. Watchlist and price alerts

---

## Success Metrics

After implementation, the collection page should support:

- [ ] Sweep up to 30 NFTs in one transaction
- [ ] Cart with running total and batch checkout
- [ ] Filter by listing status (Listed/Unlisted/Has Offers)
- [ ] Filter by multiple traits with AND/OR logic
- [ ] Real-time activity feed (< 5 second delay)
- [ ] Charts showing actual historical data
- [ ] Collection-wide offers
- [ ] Bulk listing multiple NFTs
- [ ] Rarity rankings with scores
- [ ] User watchlists and price alerts

---

## Notes for Developer

1. **Thirdweb v5 Only**: All blockchain interactions must use Thirdweb v5. No legacy code.

2. **Existing Backend**: Many functions already exist in `lib/marketplace.ts` - check before creating new ones.

3. **Database Models**: Check `prisma/schema.prisma` for existing models before creating new ones.

4. **Design System**: Use existing components from `components/ui/` (shadcn/ui). Match the dark theme with `rgb(163,255,18)` brand color.

5. **No Heavy Animations**: Keep transitions under 150ms. No staggered grid animations. Reference the recent cleanup in `items-tab.tsx` and `item-card.tsx`.

6. **Mobile First**: All features must work on mobile. Test at 375px width minimum.
