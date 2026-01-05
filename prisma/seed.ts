import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Slug generation utility (matching lib/utils.ts)
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ''); // Remove all non-alphanumeric characters
}

// Demo game data across all categories
const GAMES = [
  // Competitive Games
  {
    name: "FPS Arena Championship",
    slug: "fps-arena",
    description: "First-person shooter tournaments with professional-level competition",
    image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/ea507b10-5017-472d-8433-06c0676dee51/transcode=true,original=true,quality=90/WanVideoWrapper_I2V_00047.webm",
    category: "competitive",
    subcategory: "fps",
    minPlayers: 2,
    maxPlayers: 10,
  },
  {
    name: "MOBA Legends League",
    slug: "moba-legends",
    description: "Strategic team-based combat in the ultimate MOBA experience",
    image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/ea507b10-5017-472d-8433-06c0676dee51/transcode=true,original=true,quality=90/WanVideoWrapper_I2V_00047.webm",
    category: "competitive",
    subcategory: "moba",
    minPlayers: 10,
    maxPlayers: 10,
  },
  {
    name: "Battle Royale Masters",
    slug: "battle-royale",
    description: "Last player standing wins all in this intense battle royale",
    image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/ea507b10-5017-472d-8433-06c0676dee51/transcode=true,original=true,quality=90/WanVideoWrapper_I2V_00047.webm",
    category: "competitive",
    subcategory: "battle-royale",
    minPlayers: 2,
    maxPlayers: 100,
  },
  {
    name: "Racing Champions",
    slug: "racing-champions",
    description: "High-speed racing competition with crypto prizes",
    image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/1351be80-e8bd-4d05-8d60-31ced9a024ce/original=true,quality=90/96222521.jpeg",
    category: "competitive",
    subcategory: "racing",
    minPlayers: 2,
    maxPlayers: 20,
  },
  // 1v1 Games
  {
    name: "Cyber Arena",
    slug: "cyber-arena",
    description: "High-tech 1v1 combat in a cyberpunk arena",
    image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/080b9a0f-d103-4356-95fe-56e6816df24f/transcode=true,original=true,quality=90/Professional_Mode_A_hyper_realistic__cinematic_pok.webm",
    category: "1v1",
    subcategory: "fighting",
    minPlayers: 2,
    maxPlayers: 2,
  },
  {
    name: "Fantasy Colosseum",
    slug: "fantasy-colosseum",
    description: "Medieval duel grounds for epic 1v1 battles",
    image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/080b9a0f-d103-4356-95fe-56e6816df24f/transcode=true,original=true,quality=90/Professional_Mode_A_hyper_realistic__cinematic_pok.webm",
    category: "1v1",
    subcategory: "fighting",
    minPlayers: 2,
    maxPlayers: 2,
  },
  {
    name: "Space Battleground",
    slug: "space-battleground",
    description: "Zero-gravity 1v1 combat in the depths of space",
    image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/080b9a0f-d103-4356-95fe-56e6816df24f/transcode=true,original=true,quality=90/Professional_Mode_A_hyper_realistic__cinematic_pok.webm",
    category: "1v1",
    subcategory: "shooter",
    minPlayers: 2,
    maxPlayers: 2,
  },
  {
    name: "Chess Masters",
    slug: "chess-masters",
    description: "Classic chess with crypto wagers",
    image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/69281ee0-9883-441a-9a8e-e43ff4e05ad0/original=true,quality=90/94617017.jpeg",
    category: "1v1",
    subcategory: "strategy",
    minPlayers: 2,
    maxPlayers: 2,
  },
  // Casual Games
  {
    name: "Zen Gardens",
    slug: "zen-gardens",
    description: "Find peace in virtual meditation spaces",
    image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/e86e948f-56cd-4c15-9f70-315818aafa7e/transcode=true,original=true,quality=90/114308upscale_00001.webm",
    category: "casual",
    subcategory: "wellness",
    minPlayers: 1,
    maxPlayers: 1,
  },
  {
    name: "Daily Word Quest",
    slug: "daily-word-quest",
    description: "Expand your vocabulary with daily word puzzles",
    image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/e86e948f-56cd-4c15-9f70-315818aafa7e/transcode=true,original=true,quality=90/114308upscale_00001.webm",
    category: "casual",
    subcategory: "puzzle",
    minPlayers: 1,
    maxPlayers: 1,
  },
  {
    name: "Gemstone Gardens",
    slug: "gemstone-gardens",
    description: "Match colorful gems in peaceful settings",
    image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/e86e948f-56cd-4c15-9f70-315818aafa7e/transcode=true,original=true,quality=90/114308upscale_00001.webm",
    category: "casual",
    subcategory: "match",
    minPlayers: 1,
    maxPlayers: 1,
  },
  {
    name: "Cozy Town",
    slug: "cozy-town",
    description: "Build your dream neighborhood in this relaxing builder",
    image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/e86e948f-56cd-4c15-9f70-315818aafa7e/transcode=true,original=true,quality=90/114308upscale_00001.webm",
    category: "casual",
    subcategory: "simulation",
    minPlayers: 1,
    maxPlayers: 1,
  },
  // Casino Games
  {
    name: "Crypto Poker Championship",
    slug: "crypto-poker",
    description: "Texas Hold'em tournaments with crypto stakes",
    image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/2d89529b-6141-4d66-9992-9798d96dcd5d/transcode=true,width=450,optimized=true/Untitled%20(3).webm",
    category: "casino",
    subcategory: "poker",
    minPlayers: 2,
    maxPlayers: 9,
  },
  {
    name: "Slots Empire",
    slug: "slots-empire",
    description: "Progressive jackpot slots with massive payouts",
    image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/2d89529b-6141-4d66-9992-9798d96dcd5d/transcode=true,width=450,optimized=true/Untitled%20(3).webm",
    category: "casino",
    subcategory: "slots",
    minPlayers: 1,
    maxPlayers: 1,
  },
  {
    name: "VIP Blackjack",
    slug: "vip-blackjack",
    description: "High limit blackjack with live dealers",
    image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/2d89529b-6141-4d66-9992-9798d96dcd5d/transcode=true,width=450,optimized=true/Untitled%20(3).webm",
    category: "casino",
    subcategory: "blackjack",
    minPlayers: 1,
    maxPlayers: 7,
  },
  {
    name: "Crypto Roulette",
    slug: "crypto-roulette",
    description: "Classic roulette with provably fair spins",
    image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/2d89529b-6141-4d66-9992-9798d96dcd5d/transcode=true,width=450,optimized=true/Untitled%20(3).webm",
    category: "casino",
    subcategory: "roulette",
    minPlayers: 1,
    maxPlayers: 20,
  },
  {
    name: "Dice Duel",
    slug: "dice-duel",
    description: "Fast-paced dice games with instant results",
    image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/2d89529b-6141-4d66-9992-9798d96dcd5d/transcode=true,width=450,optimized=true/Untitled%20(3).webm",
    category: "casino",
    subcategory: "dice",
    minPlayers: 1,
    maxPlayers: 10,
  },
];

// Demo user names for generating fake players
const DEMO_PLAYER_NAMES = [
  "CryptoKing",
  "DiamondHands",
  "MoonWalker",
  "DegenGamer",
  "NFTCollector",
  "BlockchainBoss",
  "EthereumEnthusiast",
  "SolanaSurfer",
  "PolygonPlayer",
  "ArbitrumAce",
  "OptimismOG",
  "BaseBuilder",
  "ZKMaster",
  "LayerTwoLord",
  "GasOptimizer",
  "WhaleWatcher",
  "AlphaHunter",
  "YieldFarmer",
  "LiquidityLord",
  "StakingSteve",
  "BridgeRunner",
  "ChainHopper",
  "DeFiDegen",
  "SmartContractor",
  "TokenTrader",
];

async function main() {
  console.log("Starting seed...\n");

  // Clear existing data
  console.log("Clearing existing gaming data...");
  await prisma.tournamentBracket.deleteMany();
  await prisma.tournamentParticipant.deleteMany();
  await prisma.match.deleteMany();
  await prisma.playerStats.deleteMany();
  await prisma.tournament.deleteMany();
  await prisma.game.deleteMany();

  // Create games
  console.log("Creating games...");
  const createdGames: Record<string, any> = {};

  for (const game of GAMES) {
    const created = await prisma.game.create({
      data: {
        name: game.name,
        slug: game.slug,
        description: game.description,
        image: game.image,
        category: game.category,
        subcategory: game.subcategory,
        minPlayers: game.minPlayers,
        maxPlayers: game.maxPlayers,
        isActive: true,
      },
    });
    createdGames[game.slug] = created;
    console.log(`  Created game: ${game.name}`);
  }

  // Create demo users if they don't exist
  console.log("\nCreating demo users...");
  const demoUsers: any[] = [];

  for (let i = 0; i < DEMO_PLAYER_NAMES.length; i++) {
    const walletAddress = `0x${i.toString(16).padStart(40, "0")}demo`;
    let user = await prisma.user.findFirst({
      where: { walletAddress },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          walletAddress,
          username: DEMO_PLAYER_NAMES[i],
          profilePicture: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${DEMO_PLAYER_NAMES[i]}`,
        },
      });
      console.log(`  Created user: ${DEMO_PLAYER_NAMES[i]}`);
    }
    demoUsers.push(user);
  }

  // Create player stats for competitive games
  console.log("\nCreating player stats...");
  const competitiveGames = Object.values(createdGames).filter(
    (g: any) => g.category === "competitive" || g.category === "1v1"
  );

  for (const game of competitiveGames) {
    for (let i = 0; i < Math.min(15, demoUsers.length); i++) {
      const user = demoUsers[i];
      const wins = Math.floor(Math.random() * 50) + 5;
      const losses = Math.floor(Math.random() * 30) + 5;
      const rating = 1000 + Math.floor(Math.random() * 1500);

      await prisma.playerStats.create({
        data: {
          userId: user.id,
          gameId: game.id,
          wins,
          losses,
          draws: Math.floor(Math.random() * 5),
          rating,
          peakRating: rating + Math.floor(Math.random() * 200),
          streak: Math.floor(Math.random() * 10) - 5,
          totalEarnings: parseFloat((Math.random() * 10).toFixed(4)),
        },
      });
    }
    console.log(`  Created stats for ${game.name}`);
  }

  // Create tournaments
  console.log("\nCreating tournaments...");
  const fpsGame = createdGames["fps-arena"];
  const chessGame = createdGames["chess-masters"];
  const pokerGame = createdGames["crypto-poker"];

  const tournaments = [
    {
      gameId: fpsGame?.id,
      name: "Weekly FPS Championship",
      description: "Compete for glory in the weekly FPS tournament",
      entryFee: 0.01,
      prizePool: 0.5,
      maxPlayers: 16,
      format: "single_elimination",
      status: "UPCOMING",
      startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
    },
    {
      gameId: fpsGame?.id,
      name: "Pro League Season 5",
      description: "The ultimate competitive FPS experience",
      entryFee: 0.1,
      prizePool: 5.0,
      maxPlayers: 32,
      format: "double_elimination",
      status: "IN_PROGRESS",
      startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Started 2 days ago
    },
    {
      gameId: chessGame?.id,
      name: "Chess Masters Invitational",
      description: "Elite chess tournament for the best players",
      entryFee: 0.05,
      prizePool: 2.0,
      maxPlayers: 8,
      format: "single_elimination",
      status: "UPCOMING",
      startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    },
    {
      gameId: pokerGame?.id,
      name: "High Stakes Poker Night",
      description: "Weekly poker tournament with massive prizes",
      entryFee: 0.5,
      prizePool: 20.0,
      maxPlayers: 64,
      format: "single_elimination",
      status: "REGISTRATION",
      startTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
    },
  ];

  for (const tournament of tournaments) {
    if (!tournament.gameId) continue;

    const created = await prisma.tournament.create({
      data: {
        gameId: tournament.gameId,
        name: tournament.name,
        description: tournament.description,
        entryFee: tournament.entryFee,
        prizePool: tournament.prizePool,
        maxPlayers: tournament.maxPlayers,
        currentPlayers: Math.floor(Math.random() * (tournament.maxPlayers / 2)),
        format: tournament.format,
        status: tournament.status as any,
        startTime: tournament.startTime,
      },
    });

    // Add some participants to in-progress tournament
    if (tournament.status === "IN_PROGRESS") {
      const participants = demoUsers.slice(0, 8);
      for (let i = 0; i < participants.length; i++) {
        await prisma.tournamentParticipant.create({
          data: {
            tournamentId: created.id,
            userId: participants[i].id,
            seed: i + 1,
            eliminated: i > 3, // First 4 still in
          },
        });
      }

      // Create bracket matches
      for (let round = 1; round <= 3; round++) {
        const matchesInRound = Math.pow(2, 3 - round);
        for (let match = 0; match < matchesInRound; match++) {
          await prisma.tournamentBracket.create({
            data: {
              tournamentId: created.id,
              round,
              matchNumber: match + 1,
              player1Id: round === 1 ? participants[match * 2]?.id : null,
              player2Id: round === 1 ? participants[match * 2 + 1]?.id : null,
              winnerId: round === 1 && match < 2 ? participants[match * 2]?.id : null,
              score1: round === 1 ? 3 : null,
              score2: round === 1 ? Math.floor(Math.random() * 3) : null,
              status: round === 1 ? "completed" : round === 2 && match === 0 ? "in_progress" : "pending",
            },
          });
        }
      }
    }

    console.log(`  Created tournament: ${tournament.name}`);
  }

  // Create some recent matches
  console.log("\nCreating recent matches...");
  for (const game of competitiveGames.slice(0, 3)) {
    for (let i = 0; i < 5; i++) {
      const player1 = demoUsers[Math.floor(Math.random() * demoUsers.length)];
      let player2 = demoUsers[Math.floor(Math.random() * demoUsers.length)];
      while (player2.id === player1.id) {
        player2 = demoUsers[Math.floor(Math.random() * demoUsers.length)];
      }

      await prisma.match.create({
        data: {
          gameId: game.id,
          player1Id: player1.id,
          player2Id: player2.id,
          winnerId: Math.random() > 0.5 ? player1.id : player2.id,
          wagerAmount: parseFloat((Math.random() * 0.1).toFixed(4)),
          wagerType: "eth",
          status: "COMPLETED",
          completedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        },
      });
    }
    console.log(`  Created matches for ${game.name}`);
  }

  // ============ LOOTBOX SEEDING ============
  console.log("\nSeeding lootboxes...");

  // Clear existing lootbox data
  await prisma.lootboxOpening.deleteMany();
  await prisma.lootboxReward.deleteMany();
  await prisma.lootbox.deleteMany();

  // Use first demo user as creator
  const lootboxCreator = demoUsers[0];

  // Lootbox definitions
  const LOOTBOXES = [
    {
      onChainId: 1,
      name: "Cosmic Genesis Box",
      description: "The rarest lootbox containing legendary cosmic NFTs. Only 100 ever created.",
      image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/ea507b10-5017-472d-8433-06c0676dee51/transcode=true,original=true,quality=90/WanVideoWrapper_I2V_00047.webm",
      price: 0.5,
      rarity: "cosmic",
      totalSupply: 100,
      remainingSupply: 87,
    },
    {
      onChainId: 2,
      name: "Mythic Dragon Vault",
      description: "Unlock mythical dragon-themed NFTs with guaranteed rare drops.",
      image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/1351be80-e8bd-4d05-8d60-31ced9a024ce/original=true,quality=90/96222521.jpeg",
      price: 0.25,
      rarity: "mythic",
      totalSupply: 500,
      remainingSupply: 423,
    },
    {
      onChainId: 3,
      name: "Epic Warriors Cache",
      description: "Battle-ready warrior NFTs await inside this epic lootbox.",
      image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/ea507b10-5017-472d-8433-06c0676dee51/transcode=true,original=true,quality=90/WanVideoWrapper_I2V_00047.webm",
      price: 0.1,
      rarity: "epic",
      totalSupply: 1000,
      remainingSupply: 756,
    },
    {
      onChainId: 4,
      name: "Rare Artifacts Box",
      description: "Discover rare digital artifacts from the metaverse.",
      image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/1351be80-e8bd-4d05-8d60-31ced9a024ce/original=true,quality=90/96222521.jpeg",
      price: 0.05,
      rarity: "rare",
      totalSupply: 2500,
      remainingSupply: 1832,
    },
    {
      onChainId: 5,
      name: "Starter Pack",
      description: "Perfect for newcomers. Common items with a chance at something special.",
      image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/ea507b10-5017-472d-8433-06c0676dee51/transcode=true,original=true,quality=90/WanVideoWrapper_I2V_00047.webm",
      price: 0.01,
      rarity: "common",
      totalSupply: 10000,
      remainingSupply: 8234,
    },
  ];

  // Mock NFT rewards for each rarity
  const MOCK_REWARDS: Record<string, { name: string; image: string; weight: number }[]> = {
    cosmic: [
      { name: "Cosmic Phoenix", image: "https://picsum.photos/seed/cosmic1/400/400", weight: 10 },
      { name: "Nebula Guardian", image: "https://picsum.photos/seed/cosmic2/400/400", weight: 15 },
      { name: "Stellar Dragon", image: "https://picsum.photos/seed/cosmic3/400/400", weight: 20 },
      { name: "Galaxy Titan", image: "https://picsum.photos/seed/cosmic4/400/400", weight: 25 },
      { name: "Astral Warden", image: "https://picsum.photos/seed/cosmic5/400/400", weight: 30 },
    ],
    mythic: [
      { name: "Golden Dragon", image: "https://picsum.photos/seed/mythic1/400/400", weight: 15 },
      { name: "Ancient Phoenix", image: "https://picsum.photos/seed/mythic2/400/400", weight: 20 },
      { name: "Divine Champion", image: "https://picsum.photos/seed/mythic3/400/400", weight: 25 },
      { name: "Legendary Blade", image: "https://picsum.photos/seed/mythic4/400/400", weight: 40 },
    ],
    epic: [
      { name: "Shadow Knight", image: "https://picsum.photos/seed/epic1/400/400", weight: 20 },
      { name: "Storm Mage", image: "https://picsum.photos/seed/epic2/400/400", weight: 25 },
      { name: "Frost Warrior", image: "https://picsum.photos/seed/epic3/400/400", weight: 30 },
      { name: "Fire Elemental", image: "https://picsum.photos/seed/epic4/400/400", weight: 25 },
    ],
    rare: [
      { name: "Crystal Sword", image: "https://picsum.photos/seed/rare1/400/400", weight: 30 },
      { name: "Magic Scroll", image: "https://picsum.photos/seed/rare2/400/400", weight: 35 },
      { name: "Enchanted Armor", image: "https://picsum.photos/seed/rare3/400/400", weight: 35 },
    ],
    common: [
      { name: "Bronze Coin", image: "https://picsum.photos/seed/common1/400/400", weight: 40 },
      { name: "Wooden Shield", image: "https://picsum.photos/seed/common2/400/400", weight: 35 },
      { name: "Basic Potion", image: "https://picsum.photos/seed/common3/400/400", weight: 25 },
    ],
  };

  const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_LOOTBOX_CONTRACT_ADDRESS || "0x74D47698Fb1772e960Bd00486A552b649d7022b6";

  for (const lb of LOOTBOXES) {
    const rewards = MOCK_REWARDS[lb.rarity] || MOCK_REWARDS.common;

    const lootbox = await prisma.lootbox.create({
      data: {
        onChainId: lb.onChainId,
        name: lb.name,
        description: lb.description,
        image: lb.image,
        price: lb.price,
        priceCurrency: "ETH",
        rarity: lb.rarity,
        totalSupply: lb.totalSupply,
        remainingSupply: lb.remainingSupply,
        contractAddress: CONTRACT_ADDRESS,
        isActive: true,
        creatorId: lootboxCreator.id,
        rewards: {
          create: rewards.map((reward, idx) => ({
            nftContractAddress: `0x${(lb.onChainId * 100 + idx).toString(16).padStart(40, "0")}`,
            nftTokenId: (idx + 1).toString(),
            tokenType: "ERC721",
            name: reward.name,
            description: `A ${lb.rarity} tier reward from ${lb.name}`,
            image: reward.image,
            collectionName: lb.name.replace(" Box", "").replace(" Cache", "").replace(" Vault", ""),
            rarity: lb.rarity,
            weight: reward.weight,
            claimed: false,
          })),
        },
      },
    });

    // Create some mock openings for activity
    const openingsCount = Math.floor(Math.random() * 5) + 2;
    for (let i = 0; i < openingsCount; i++) {
      const randomUser = demoUsers[Math.floor(Math.random() * demoUsers.length)];
      const randomReward = rewards[Math.floor(Math.random() * rewards.length)];

      // Get the reward that was created
      const lootboxReward = await prisma.lootboxReward.findFirst({
        where: {
          lootboxId: lootbox.id,
          name: randomReward.name,
        },
      });

      if (lootboxReward) {
        await prisma.lootboxOpening.create({
          data: {
            lootboxId: lootbox.id,
            userId: randomUser.id,
            rewardId: lootboxReward.id,
            vrfRequestId: `${Math.floor(Math.random() * 1000000)}`,
            txHash: `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`,
            fulfilled: true,
            openedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
            fulfilledAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          },
        });
      }
    }

    console.log(`  Created lootbox: ${lb.name} (${rewards.length} rewards)`);
  }

  // ============ COLLECTION SLUG BACKFILL ============
  console.log("\nBackfilling collection slugs...");

  const collectionsWithoutSlugs = await prisma.collection.findMany({
    where: { slug: null },
    select: { id: true, name: true },
  });

  let backfilledCount = 0;
  for (const collection of collectionsWithoutSlugs) {
    const baseSlug = generateSlug(collection.name);
    let slug = baseSlug;
    let counter = 0;

    // Check for existing slugs and make unique if necessary
    while (true) {
      const existing = await prisma.collection.findUnique({
        where: { slug },
      });
      if (!existing) break;
      counter++;
      slug = `${baseSlug}${counter}`;
    }

    await prisma.collection.update({
      where: { id: collection.id },
      data: { slug },
    });
    backfilledCount++;
    console.log(`  Set slug for "${collection.name}" -> "${slug}"`);
  }

  if (backfilledCount > 0) {
    console.log(`  Backfilled ${backfilledCount} collections with slugs`);
  } else {
    console.log("  All collections already have slugs");
  }

  console.log("\n✅ Seed completed successfully!");
  console.log(`   - ${GAMES.length} games created`);
  console.log(`   - ${demoUsers.length} demo users created`);
  console.log(`   - ${tournaments.length} tournaments created`);
  console.log(`   - ${LOOTBOXES.length} lootboxes created`);
  console.log(`   - Player stats and matches seeded`);
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
