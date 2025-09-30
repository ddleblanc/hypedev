import { Collection } from "./types";

export const mockCollection: Collection = {
  id: "cyber-legends",
  title: "Cyber Legends",
  subtitle: "Futuristic warriors collection",
  description: "Step into the neon-lit streets of Neo Tokyo where cyber-enhanced warriors battle for supremacy.",
  longDescription: "The Cyber Legends collection brings together the most elite warriors from across the digital frontier. Born from the convergence of advanced cybernetics and ancient martial arts, these legendary fighters have transcended the boundaries between the physical and virtual worlds. Each warrior possesses unique abilities, backstories, and visual traits that make them valuable assets in the metaverse.",
  videoUrl: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/9c5398c1-dcde-4d7c-ac6a-33fa6ff5d948/transcode=true,width=450,optimized=true/0e178c0604244fb9a44d5b87c6b2a815.webm",
  bannerImage: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/9c5398c1-dcde-4d7c-ac6a-33fa6ff5d948/original=true,quality=90/cyber-legends-banner.jpg",
  logo: "/api/placeholder/120/120",
  contractAddress: "0x1234567890abcdef1234567890abcdef12345678",
  blockchain: "Ethereum",
  tokenStandard: "ERC-721",
  createdDate: "2024-01-15",
  creator: {
    name: "NeonStudios",
    address: "0xCreator...5678",
    avatar: "/api/placeholder/80/80",
    verified: true,
    followers: "12.5K",
    description: "Award-winning digital art collective specializing in cyberpunk aesthetics"
  },
  stats: {
    totalSupply: 10000,
    owners: 7834,
    uniqueOwners: 6234,
    floorPrice: "2.1",
    floorPriceUSD: 3780,
    ceilingPrice: "125",
    volume24h: "287",
    volume7d: "1.8K",
    volume30d: "5.2K",
    volumeAll: "52.3K",
    volumeChange24h: 24.5,
    volumeChange7d: -12.3,
    avgPrice: "3.7",
    avgPrice24h: "3.2",
    marketCap: "21K",
    listedCount: 1523,
    listedPercentage: 15.23,
    sales24h: 89,
    sales7d: 486,
    royalty: 5,
    bestOffer: "1.95"
  },
  priceHistory: [
    { date: "Jan 1", price: 1.8 },
    { date: "Jan 5", price: 2.1 },
    { date: "Jan 10", price: 2.3 },
    { date: "Jan 15", price: 2.0 },
    { date: "Jan 20", price: 2.4 },
    { date: "Jan 25", price: 2.1 },
  ],
  traits: [
    {
      name: "Background",
      values: [
        { trait: "Neon City", count: 2341, percentage: 23.41 },
        { trait: "Cyber Grid", count: 1823, percentage: 18.23 },
        { trait: "Digital Rain", count: 1456, percentage: 14.56 },
        { trait: "Void", count: 892, percentage: 8.92 }
      ]
    },
    {
      name: "Cybernetics",
      values: [
        { trait: "Neural Interface", count: 3421, percentage: 34.21 },
        { trait: "Bionic Arms", count: 2156, percentage: 21.56 },
        { trait: "Optic Implants", count: 1823, percentage: 18.23 }
      ]
    },
    {
      name: "Weapon",
      values: [
        { trait: "Plasma Blade", count: 523, percentage: 5.23 },
        { trait: "Laser Rifle", count: 892, percentage: 8.92 },
        { trait: "Energy Shield", count: 1234, percentage: 12.34 }
      ]
    },
    {
      name: "Rarity Tier",
      values: [
        { trait: "Common", count: 4500, percentage: 45 },
        { trait: "Rare", count: 3000, percentage: 30 },
        { trait: "Epic", count: 1800, percentage: 18 },
        { trait: "Legendary", count: 600, percentage: 6 },
        { trait: "Mythic", count: 100, percentage: 1 }
      ]
    }
  ],
  items: Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    name: `Cyber Legend #${String(i + 1).padStart(4, '0')}`,
    price: (Math.random() * 20 + 1).toFixed(2),
    lastSale: (Math.random() * 15 + 0.5).toFixed(2),
    image: `https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/cyber${(i % 8) + 1}.jpg`,
    rarity: ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'][Math.floor(Math.random() * 5)],
    rank: i + 1,
    likes: Math.floor(Math.random() * 500) + 50,
    owner: `0x${Math.random().toString(16).slice(2, 10)}...`,
    listed: Math.random() > 0.5,
    hasOffer: Math.random() > 0.7,
    offerPrice: (Math.random() * 18 + 0.5).toFixed(2),
    traits: [
      { trait_type: "Background", value: ["Neon City", "Cyber Grid", "Digital Rain"][Math.floor(Math.random() * 3)] },
      { trait_type: "Cybernetics", value: ["Neural Interface", "Bionic Arms", "Optic Implants"][Math.floor(Math.random() * 3)] },
      { trait_type: "Weapon", value: ["Plasma Blade", "Laser Rifle", "Energy Shield"][Math.floor(Math.random() * 3)] }
    ]
  })),
  topHolders: [
    { address: "0xAbc1...2345", amount: 234, percentage: 2.34 },
    { address: "0xDef4...5678", amount: 189, percentage: 1.89 },
    { address: "0xGhi7...9012", amount: 156, percentage: 1.56 },
    { address: "0xJkl0...3456", amount: 134, percentage: 1.34 },
    { address: "0xMno3...7890", amount: 98, percentage: 0.98 }
  ],
  recentActivity: Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    type: ['Sale', 'List', 'Transfer', 'Offer', 'Bid'][Math.floor(Math.random() * 5)],
    item: `Cyber Legend #${String(Math.floor(Math.random() * 10000) + 1).padStart(4, '0')}`,
    price: (Math.random() * 10 + 0.5).toFixed(2),
    from: `0x${Math.random().toString(16).slice(2, 10)}...`,
    to: `0x${Math.random().toString(16).slice(2, 10)}...`,
    timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    txHash: `0x${Math.random().toString(16).slice(2, 66)}`
  })),
  socials: {
    website: "https://cyberlegends.io",
    twitter: "https://twitter.com/cyberlegends",
    discord: "https://discord.gg/cyberlegends",
    medium: "https://medium.com/@cyberlegends"
  }
};
