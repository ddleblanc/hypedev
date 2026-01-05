/**
 * Museum Seed Data
 * Seeds the legends hall with Jugi Tandon and Alan Turing (coming soon)
 */
import { PrismaClient, LegendStatus, ArtifactUnlockType, AchievementUnlockType } from "@prisma/client";

const prisma = new PrismaClient();

async function seedMuseum() {
  console.log("\n🏛️  Seeding Museum / Legends Hall...\n");

  // ============================================
  // JUGI TANDON - THE SAVE GAME PIONEER
  // ============================================

  console.log("Creating Jugi Tandon legend...");

  const jugi = await prisma.legend.upsert({
    where: { slug: "jugi-tandon" },
    update: {},
    create: {
      slug: "jugi-tandon",
      name: "Jugi Tandon",
      title: "The Save Game Pioneer",
      tagline: "Without him, there would be no save games",
      era: "1980s - 1990s",
      category: "Gaming Innovation",
      impact: "Revolutionary",
      status: LegendStatus.ACTIVE,

      heroLine: "Before Jugi Tandon, games were temporary experiences. You played until you died, then started over. Forever.",
      challenge: "In the early days of computing, memory was precious and permanent storage was limited. Gaming was seen as a frivolous use of resources that couldn't justify the overhead of persistent state management.",
      breakthrough: "Jugi revolutionized gaming by pioneering save game technology, creating the first practical system for preserving player progress across sessions, transforming gaming from fleeting moments into persistent worlds.",
      legacy: "Every save file in every game today traces back to Jugi's innovative thinking. He didn't just create a feature - he fundamentally changed how humans relate to virtual worlds.",
      modernImpact: "Without save games, there would be no RPGs, no progress systems, no modern gaming as we know it. Billion-dollar franchises like Final Fantasy, Elder Scrolls, and World of Warcraft exist because of this one innovation.",

      portraitUrl: "https://picsum.photos/400/600?random=1001",
      bannerUrl: "https://picsum.photos/1200/800?random=1002",
      heroVideoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      trailerVideoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      trailerDuration: 90,

      primaryColor: "#a3ff12",
      accentColor: "#7bc400",
      gradientClass: "from-green-400/20 to-emerald-600/10",

      stats: {
        gamesInfluenced: "10,000+",
        playersImpacted: "3 Billion+",
        industryValue: "$180 Billion",
        yearsActive: "15+",
        saveFilesCreated: "Infinite",
        programmersInspired: "50,000+",
      },

      displayOrder: 1,
    },
  });

  console.log(`  ✓ Created legend: ${jugi.name} (${jugi.id})`);

  // ============================================
  // CHAPTERS
  // ============================================

  console.log("  Creating chapters...");

  const chapters = [
    {
      number: 1,
      title: "The Save Game Pioneer",
      subtitle: "Episode I: Genesis",
      description: "Before this moment, games were ephemeral. Progress was lost the instant you powered down. Then one innovator dared to make virtual worlds remember.",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      thumbnailUrl: "https://picsum.photos/600/800?random=2001",
      year: "1982",
      rarity: "Mythic",
      edition: "1 of 1",
    },
    {
      number: 2,
      title: "Breaking the Impossible",
      subtitle: "Episode II: Innovation",
      description: "Memory was precious. Every byte counted. When everyone said it couldn't be done, one mind proved them wrong and changed gaming forever.",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      thumbnailUrl: "https://picsum.photos/600/800?random=2002",
      year: "1984",
      rarity: "Legendary",
      edition: "1 of 1",
    },
    {
      number: 3,
      title: "The Eternal Legacy",
      subtitle: "Episode III: Impact",
      description: "Billions of players. Countless worlds. Every modern game traces its lineage to this singular breakthrough that redefined what virtual worlds could be.",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      thumbnailUrl: "https://picsum.photos/600/800?random=2003",
      year: "1986",
      rarity: "Mythic",
      edition: "1 of 1",
    },
    {
      number: 4,
      title: "The Code Revolution",
      subtitle: "Episode IV: Evolution",
      description: "From simple bytes to complex algorithms. Watch how persistent state transformed from a technical curiosity into the foundation of modern interactive entertainment.",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      thumbnailUrl: "https://picsum.photos/600/800?random=2004",
      year: "1988",
      rarity: "Epic",
      edition: "10 Editions",
    },
    {
      number: 5,
      title: "Industry Transformation",
      subtitle: "Episode V: Adoption",
      description: "The moment major studios realized the power of save games. RPGs, adventures, and epic narratives became possible, reshaping an entire industry overnight.",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      thumbnailUrl: "https://picsum.photos/600/800?random=2005",
      year: "1990",
      rarity: "Legendary",
      edition: "1 of 1",
    },
    {
      number: 6,
      title: "The Modern Era",
      subtitle: "Episode VI: Expansion",
      description: "Cloud saves, auto-saves, multiple save slots. The technology evolved, but the core innovation remained: your progress, preserved forever.",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      thumbnailUrl: "https://picsum.photos/600/800?random=2006",
      year: "2000",
      rarity: "Rare",
      edition: "100 Editions",
    },
    {
      number: 7,
      title: "Infinite Possibilities",
      subtitle: "Episode VII: Future",
      description: "Today, three billion players save their progress daily. The innovation continues to evolve, enabling experiences the pioneers could only dream of.",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      thumbnailUrl: "https://picsum.photos/600/800?random=2007",
      year: "2024",
      rarity: "Mythic",
      edition: "1 of 1",
    },
  ];

  for (const chapter of chapters) {
    await prisma.legendChapter.upsert({
      where: {
        legendId_number: {
          legendId: jugi.id,
          number: chapter.number,
        },
      },
      update: chapter,
      create: {
        ...chapter,
        legendId: jugi.id,
      },
    });
  }

  console.log(`    ✓ Created ${chapters.length} chapters`);

  // ============================================
  // TIMELINE EVENTS
  // ============================================

  console.log("  Creating timeline events...");

  // Delete existing timeline events for this legend to avoid duplicates
  await prisma.legendTimelineEvent.deleteMany({
    where: { legendId: jugi.id },
  });

  const timeline = [
    {
      year: "1982",
      event: "First experiments with game state preservation",
      detail: "Working late nights in his cramped apartment, Jugi began experimenting with ways to save player progress. Memory was precious - every byte counted.",
      mediaUrl: "https://picsum.photos/800/600?random=3001",
      displayOrder: 1,
      hasQuiz: true,
      quizQuestion: "What was the primary challenge Jugi faced when developing the first save game system?",
      quizType: "multiple",
      quizDifficulty: "medium",
      quizOptions: [
        "Games were too simple to need saving",
        "Memory was extremely limited and precious",
        "Players didn't want to save their games",
        "The technology didn't exist yet",
      ],
      quizCorrectIndex: 1,
      quizExplanation: "In 1982, computer memory was measured in kilobytes, not gigabytes. Every single byte had to be carefully managed, making persistent state storage a massive technical challenge.",
      quizPoints: 100,
      quizHint: "Think about the technological limitations of 1982 computers.",
    },
    {
      year: "1984",
      event: "Developed proprietary save file format",
      detail: "After countless iterations, he created the .SAV format that would become the blueprint for all future save systems.",
      mediaUrl: "https://picsum.photos/800/600?random=3002",
      displayOrder: 2,
      hasQuiz: true,
      quizQuestion: "The .SAV file format introduced a revolutionary concept. What made it special?",
      quizType: "multiple",
      quizDifficulty: "hard",
      quizOptions: [
        "It compressed data to save space",
        "It could persist game state between sessions",
        "It was the first file format for games",
        "It used cloud storage",
      ],
      quizCorrectIndex: 1,
      quizExplanation: "The .SAV format's revolutionary feature was its ability to persist complete game state between sessions, allowing players to turn off their computers and resume exactly where they left off.",
      quizPoints: 150,
      quizHint: "Consider what makes save files work across different play sessions.",
    },
    {
      year: "1986",
      event: "Save technology adopted by major studios",
      detail: "Nintendo, Atari, and other major companies began licensing his save system technology.",
      mediaUrl: "https://picsum.photos/800/600?random=3003",
      displayOrder: 3,
      hasQuiz: true,
      quizQuestion: "Which gaming genre was most directly enabled by Jugi's save game innovation?",
      quizType: "multiple",
      quizDifficulty: "medium",
      quizOptions: [
        "First-person shooters",
        "Role-playing games (RPGs)",
        "Racing games",
        "Puzzle games",
      ],
      quizCorrectIndex: 1,
      quizExplanation: "RPGs like Final Fantasy, Dragon Quest, and The Elder Scrolls series could only exist because of save games. These games require dozens or hundreds of hours to complete.",
      quizPoints: 120,
      quizHint: "Think about games that require long-term character progression.",
    },
    {
      year: "1990",
      event: "Industry standard established based on his work",
      detail: "The gaming industry officially standardized save file formats based on Jugi's original specifications.",
      mediaUrl: "https://picsum.photos/800/600?random=3004",
      displayOrder: 4,
      hasQuiz: true,
      quizQuestion: "True or False: Without save games, the modern gaming industry worth $180+ billion would likely not exist.",
      quizType: "truefalse",
      quizDifficulty: "easy",
      quizOptions: [
        "True - Save games enabled complex, long-form gaming experiences",
        "False - Gaming would have evolved the same way regardless",
      ],
      quizCorrectIndex: 0,
      quizExplanation: "True. Save games fundamentally transformed gaming from temporary arcade experiences into persistent worlds. This enabled RPGs, open-world games, progression systems, and the entire modern gaming ecosystem.",
      quizPoints: 80,
      quizHint: null,
    },
  ];

  for (const event of timeline) {
    await prisma.legendTimelineEvent.create({
      data: {
        ...event,
        legendId: jugi.id,
        quizOptions: event.quizOptions || null,
      },
    });
  }

  console.log(`    ✓ Created ${timeline.length} timeline events`);

  // ============================================
  // ARTIFACTS
  // ============================================

  console.log("  Creating artifacts...");

  // Delete existing artifacts for this legend
  await prisma.legendArtifact.deleteMany({
    where: { legendId: jugi.id },
  });

  const artifacts = [
    {
      name: "Original Save File Code",
      description: "The first functional save game implementation, handwritten on yellowed notebook paper",
      type: "Code",
      rarity: "Mythic",
      year: "1982",
      mediaUrl: "https://picsum.photos/800/600?random=4001",
      unlockType: ArtifactUnlockType.FREE,
      displayOrder: 1,
    },
    {
      name: "System Architecture Blueprints",
      description: "Hand-drawn diagrams showing the revolutionary save system architecture",
      type: "Document",
      rarity: "Legendary",
      year: "1983",
      mediaUrl: "https://picsum.photos/800/600?random=4002",
      unlockType: ArtifactUnlockType.CHAPTER,
      unlockValue: "2",
      displayOrder: 2,
    },
    {
      name: "Prototype Floppy Disk",
      description: "The original 5.25\" floppy disk containing the first working save game demo",
      type: "Hardware",
      rarity: "Legendary",
      year: "1984",
      mediaUrl: "https://picsum.photos/800/600?random=4003",
      unlockType: ArtifactUnlockType.CHAPTER,
      unlockValue: "3",
      displayOrder: 3,
    },
  ];

  for (const artifact of artifacts) {
    await prisma.legendArtifact.create({
      data: {
        ...artifact,
        legendId: jugi.id,
      },
    });
  }

  console.log(`    ✓ Created ${artifacts.length} artifacts`);

  // ============================================
  // QUOTES
  // ============================================

  console.log("  Creating quotes...");

  // Delete existing quotes for this legend
  await prisma.legendQuote.deleteMany({
    where: { legendId: jugi.id },
  });

  const quotes = [
    {
      text: "Games should be journeys, not just momentary experiences.",
      context: "Said during a 1985 interview with Computer Gaming World",
      year: "1985",
      displayOrder: 1,
    },
    {
      text: "The power to continue where you left off changes everything.",
      context: "From his 1987 technical paper on persistent game states",
      year: "1987",
      displayOrder: 2,
    },
    {
      text: "I wanted players to build relationships with their virtual worlds.",
      context: "Keynote speech at the 1989 Game Developer Conference",
      year: "1989",
      displayOrder: 3,
    },
  ];

  for (const quote of quotes) {
    await prisma.legendQuote.create({
      data: {
        ...quote,
        legendId: jugi.id,
      },
    });
  }

  console.log(`    ✓ Created ${quotes.length} quotes`);

  // ============================================
  // ACHIEVEMENTS
  // ============================================

  console.log("  Creating achievements...");

  // Delete existing achievements for this legend
  await prisma.legendAchievement.deleteMany({
    where: { legendId: jugi.id },
  });

  const achievements = [
    {
      name: "First Steps",
      description: "Enter the Legends Hall",
      points: 50,
      unlockType: AchievementUnlockType.FIRST_PURCHASE,
    },
    {
      name: "Save Collector",
      description: "Own 3 story chapters",
      points: 100,
      unlockType: AchievementUnlockType.CHAPTERS_OWNED,
      unlockValue: "3",
    },
    {
      name: "Full Archive",
      description: "Own all 7 story chapters",
      points: 500,
      unlockType: AchievementUnlockType.ALL_CHAPTERS,
    },
    {
      name: "Timeline Master",
      description: "Explore the complete timeline",
      points: 150,
      unlockType: AchievementUnlockType.TIMELINE_COMPLETE,
    },
    {
      name: "Quiz Champion",
      description: "Score 400+ points on quizzes",
      points: 200,
      unlockType: AchievementUnlockType.QUIZ_SCORE,
      unlockValue: "400",
    },
    {
      name: "Artifact Hunter",
      description: "Discover all artifacts",
      points: 250,
      unlockType: AchievementUnlockType.ARTIFACTS_FOUND,
      unlockValue: "3",
    },
  ];

  for (const achievement of achievements) {
    await prisma.legendAchievement.create({
      data: {
        ...achievement,
        legendId: jugi.id,
      },
    });
  }

  console.log(`    ✓ Created ${achievements.length} achievements`);

  // ============================================
  // ALAN TURING - COMING SOON
  // ============================================

  console.log("\nCreating Alan Turing legend (Coming Soon)...");

  const turing = await prisma.legend.upsert({
    where: { slug: "alan-turing" },
    update: {},
    create: {
      slug: "alan-turing",
      name: "Alan Turing",
      title: "The Father of Computer Science",
      tagline: "The mind that cracked codes and created the future",
      era: "1930s - 1950s",
      category: "Computer Science",
      impact: "Foundational",
      status: LegendStatus.COMING_SOON,

      heroLine: "When the world was at war and machines were simple tools, one mathematician envisioned thinking machines that would reshape humanity's future.",
      challenge: "World War II raged, the Enigma code seemed unbreakable, and the concept of artificial intelligence was pure science fiction.",
      breakthrough: "Turing didn't just break Enigma - he laid the theoretical foundation for all modern computing.",
      legacy: "Every computer, every algorithm, every AI system traces back to Turing's revolutionary ideas about computation.",
      modernImpact: "From your smartphone to ChatGPT, from the internet to space exploration, Turing's work is the invisible foundation.",

      portraitUrl: "https://picsum.photos/400/600?random=5001",
      bannerUrl: "https://picsum.photos/1200/800?random=5002",
      heroVideoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",

      primaryColor: "#3b82f6",
      accentColor: "#1d4ed8",
      gradientClass: "from-blue-400/20 to-blue-600/10",

      stats: {
        gamesInfluenced: "All Computing",
        playersImpacted: "8 Billion+",
        industryValue: "$5 Trillion",
        fieldsCreated: "Computer Science",
      },

      displayOrder: 2,
    },
  });

  console.log(`  ✓ Created legend: ${turing.name} (${turing.id}) - COMING SOON`);

  // ============================================
  // SUMMARY
  // ============================================

  console.log("\n✅ Museum seed completed successfully!");
  console.log("   - 2 legends created");
  console.log(`   - ${chapters.length} chapters for Jugi Tandon`);
  console.log(`   - ${timeline.length} timeline events`);
  console.log(`   - ${artifacts.length} artifacts`);
  console.log(`   - ${quotes.length} quotes`);
  console.log(`   - ${achievements.length} achievements`);
}

// Main execution
seedMuseum()
  .catch((e) => {
    console.error("Museum seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
