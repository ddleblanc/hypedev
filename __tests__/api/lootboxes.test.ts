import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/lootboxes/route";

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    lootbox: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Mock rate limiter with applyHeaders method
vi.mock("@/lib/rate-limit", () => ({
  rateLimitCheck: vi.fn().mockResolvedValue({
    blocked: false,
    remaining: 100,
    applyHeaders: (response: Response) => response,
  }),
  rateLimit: vi.fn().mockResolvedValue(null),
}));

// Mock redis
vi.mock("@/lib/redis", () => ({
  getRedis: vi.fn().mockReturnValue({
    get: vi.fn(),
    set: vi.fn(),
  }),
}));

// Import after mocks are set up
import { prisma } from "@/lib/prisma";

const mockLootboxes = [
  {
    id: "lb-1",
    onChainId: 1,
    name: "Test Lootbox",
    description: "A test lootbox",
    image: "ipfs://test-image",
    price: 0.01,
    priceCurrency: "ETH",
    rarity: "common",
    totalSupply: 100,
    remainingSupply: 90,
    rewardsPerOpening: 1,
    contractAddress: "0x1234",
    isActive: true,
    createdAt: new Date(),
    creator: {
      id: "user-1",
      username: "creator",
      profilePicture: null,
      walletAddress: "0x1234567890abcdef",
    },
    rewards: [
      {
        id: "r1",
        name: "NFT 1",
        image: "ipfs://nft1",
        rarity: "common",
        weight: 100,
        claimed: false,
      },
    ],
    _count: { openings: 10 },
  },
];

describe("GET /api/lootboxes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns active lootboxes with pagination", async () => {
    vi.mocked(prisma.lootbox.findMany).mockResolvedValue(mockLootboxes as never);
    vi.mocked(prisma.lootbox.count).mockResolvedValue(1);

    const request = new NextRequest(
      "http://localhost:3000/api/lootboxes?limit=10&offset=0"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.lootboxes).toHaveLength(1);
    expect(data.data.pagination.total).toBe(1);
  });

  it("filters by rarity", async () => {
    vi.mocked(prisma.lootbox.findMany).mockResolvedValue([]);
    vi.mocked(prisma.lootbox.count).mockResolvedValue(0);

    const request = new NextRequest(
      "http://localhost:3000/api/lootboxes?rarity=epic"
    );
    await GET(request);

    expect(prisma.lootbox.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          rarity: "epic",
        }),
      })
    );
  });

  it("respects limit and offset parameters", async () => {
    vi.mocked(prisma.lootbox.findMany).mockResolvedValue([]);
    vi.mocked(prisma.lootbox.count).mockResolvedValue(0);

    const request = new NextRequest(
      "http://localhost:3000/api/lootboxes?limit=20&offset=10"
    );
    await GET(request);

    expect(prisma.lootbox.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 20,
        skip: 10,
      })
    );
  });

  it("calculates rarity distribution for each lootbox", async () => {
    const lootboxWithMultipleRewards = {
      ...mockLootboxes[0],
      rewards: [
        { id: "r1", name: "Common NFT", image: "ipfs://1", rarity: "common", weight: 70, claimed: false },
        { id: "r2", name: "Rare NFT", image: "ipfs://2", rarity: "rare", weight: 30, claimed: false },
      ],
    };

    vi.mocked(prisma.lootbox.findMany).mockResolvedValue([lootboxWithMultipleRewards] as never);
    vi.mocked(prisma.lootbox.count).mockResolvedValue(1);

    const request = new NextRequest("http://localhost:3000/api/lootboxes");
    const response = await GET(request);
    const data = await response.json();

    expect(data.data.lootboxes[0].rarityDistribution).toEqual({
      common: 70,
      rare: 30,
    });
  });
});

describe("POST /api/lootboxes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates input with Zod", async () => {
    const request = new NextRequest("http://localhost:3000/api/lootboxes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        // Missing required fields
        name: "",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    // Error should contain validation details
    expect(data.error).toBeDefined();
  });

  it("rejects invalid rarity values", async () => {
    const request = new NextRequest("http://localhost:3000/api/lootboxes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        onChainId: 1,
        name: "Test Lootbox",
        image: "ipfs://test",
        price: 0.01,
        totalSupply: 100,
        rewards: [
          {
            nftContractAddress: "0x456",
            nftTokenId: "1",
            name: "NFT 1",
            image: "ipfs://nft1",
            rarity: "invalid_rarity", // Invalid
            weight: 100,
          },
        ],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it("creates lootbox with valid input", async () => {
    const mockUser = { id: "user-1", walletAddress: "0x123" };
    const mockLootbox = {
      id: "lb-1",
      onChainId: 1,
      name: "Test Lootbox",
      description: "A test",
      image: "ipfs://test",
      price: 0.01,
      rarity: "common",
      totalSupply: 100,
      remainingSupply: 100,
      rewardsPerOpening: 1,
      contractAddress: "0xtest",
      creatorId: "user-1",
      isActive: true,
      createdAt: new Date(),
      creator: mockUser,
      rewards: [],
    };

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never);
    vi.mocked(prisma.lootbox.create).mockResolvedValue(mockLootbox as never);

    const request = new NextRequest("http://localhost:3000/api/lootboxes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        onChainId: 1,
        name: "Test Lootbox",
        description: "A test",
        image: "ipfs://test",
        price: 0.01,
        totalSupply: 100,
        creatorWalletAddress: "0x123",
        rewards: [
          {
            nftContractAddress: "0x456",
            nftTokenId: "1",
            name: "NFT 1",
            image: "ipfs://nft1",
            rarity: "common",
            weight: 100,
          },
        ],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.lootbox).toBeDefined();
  });

  it("creates a new user if not exists", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: "new-user-1",
      walletAddress: "0xnewuser",
    } as never);
    vi.mocked(prisma.lootbox.create).mockResolvedValue({
      id: "lb-1",
      name: "Test",
      creator: { id: "new-user-1", walletAddress: "0xnewuser" },
      rewards: [],
    } as never);

    const request = new NextRequest("http://localhost:3000/api/lootboxes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        onChainId: 1,
        name: "Test Lootbox",
        image: "ipfs://test",
        price: 0.01,
        totalSupply: 100,
        creatorWalletAddress: "0xnewuser",
        rewards: [
          {
            nftContractAddress: "0x456",
            nftTokenId: "1",
            name: "NFT 1",
            image: "ipfs://nft1",
            rarity: "rare",
            weight: 100,
          },
        ],
      }),
    });

    await POST(request);

    expect(prisma.user.create).toHaveBeenCalled();
  });

  it("rejects empty rewards array", async () => {
    const request = new NextRequest("http://localhost:3000/api/lootboxes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        onChainId: 1,
        name: "Test Lootbox",
        image: "ipfs://test",
        price: 0.01,
        totalSupply: 100,
        rewards: [], // Empty array should fail
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it("validates rewardsPerOpening range", async () => {
    const request = new NextRequest("http://localhost:3000/api/lootboxes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        onChainId: 1,
        name: "Test Lootbox",
        image: "ipfs://test",
        price: 0.01,
        totalSupply: 100,
        rewardsPerOpening: 15, // Invalid - max is 10
        rewards: [
          {
            nftContractAddress: "0x456",
            nftTokenId: "1",
            name: "NFT 1",
            image: "ipfs://nft1",
            rarity: "common",
            weight: 100,
          },
        ],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });
});
