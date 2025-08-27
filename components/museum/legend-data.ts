// Legend Data Types and Constants for the Museum

export interface Legend {
  id: string;
  name: string;
  title: string;
  tagline: string;
  era: string;
  category: string;
  impact: string;
  rarity: string;
  unlocked: boolean;
  completionPercentage: number;
  discoveryLevel: number;
  
  story: {
    heroLine: string;
    challenge: string;
    breakthrough: string;
    legacy: string;
    modernImpact: string;
    videoUrl: string;
  };
  
  interactiveElements: Array<{
    id: string;
    name: string;
    type: string;
    description: string;
    unlocked: boolean;
    completion: number;
  }>;
  
  achievements: Array<{
    name: string;
    year: string;
    description: string;
    unlocked: boolean;
  }>;
  
  timeline: Array<{
    year: string;
    event: string;
    detail: string;
    media: string;
    unlocked: boolean;
    quiz?: {
      question: string;
      type: 'multiple' | 'timeline' | 'connection' | 'truefalse';
      difficulty: 'easy' | 'medium' | 'hard';
      points: number;
      hint?: string;
      options: string[];
      correctAnswer: number;
      explanation: string;
      relatedArtifact?: string;
    };
  }>;
  
  quotes: Array<{
    text: string;
    context: string;
    unlocked: boolean;
  }>;
  
  artifacts: Array<{
    id: string;
    name: string;
    description: string;
    rarity: string;
    type: string;
    year: string;
    unlocked: boolean;
    collectionProgress: number;
    media: string;
  }>;
  
  stats: Record<string, string>;
  portrait: string;
  bannerImage: string;
  heroVideo: string;
  artifactImages: string[];
  color: string;
  gradientClass: string;
  accentColor: string;
}

export const legends: Legend[] = [
  {
    id: "jugi-tandon",
    name: "Jugi Tandon",
    title: "The Save Game Pioneer",
    tagline: "Without him, there would be no save games",
    era: "1980s - 1990s",
    category: "Gaming Innovation",
    impact: "Revolutionary",
    rarity: "Legendary",
    unlocked: true,
    completionPercentage: 0,
    discoveryLevel: 1,
    
    story: {
      heroLine: "Before Jugi Tandon, games were temporary experiences. You played until you died, then started over. Forever.",
      challenge: "In the early days of computing, memory was precious and permanent storage was limited. Gaming was seen as a frivolous use of resources that couldn't justify the overhead of persistent state management.",
      breakthrough: "Jugi revolutionized gaming by pioneering save game technology, creating the first practical system for preserving player progress across sessions, transforming gaming from fleeting moments into persistent worlds.",
      legacy: "Every save file in every game today traces back to Jugi's innovative thinking. He didn't just create a feature - he fundamentally changed how humans relate to virtual worlds.",
      modernImpact: "Without save games, there would be no RPGs, no progress systems, no modern gaming as we know it. Billion-dollar franchises like Final Fantasy, Elder Scrolls, and World of Warcraft exist because of this one innovation.",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
    },
    
    interactiveElements: [
      {
        id: "code-simulator",
        name: "Save File Code Simulator",
        type: "interactive",
        description: "Experience the original save game implementation",
        unlocked: true,
        completion: 0
      },
      {
        id: "timeline-explorer",
        name: "Innovation Timeline",
        type: "timeline",
        description: "Navigate through the evolution of save systems",
        unlocked: false,
        completion: 0
      },
      {
        id: "impact-visualizer",
        name: "Impact Visualizer",
        type: "data-viz",
        description: "See how save games transformed the industry",
        unlocked: false,
        completion: 0
      }
    ],
    
    achievements: [
      { name: "First Save System", year: "1982", description: "Created the first practical save game implementation", unlocked: true },
      { name: "Industry Standard", year: "1986", description: "His save technology adopted by major studios", unlocked: false },
      { name: "RPG Revolution", year: "1990", description: "Enabled the RPG genre to flourish", unlocked: false },
      { name: "Modern Legacy", year: "Present", description: "Every modern game uses descendants of his system", unlocked: false }
    ],
    
    timeline: [
      { 
        year: "1982", 
        event: "First experiments with game state preservation",
        detail: "Working late nights in his cramped apartment, Jugi began experimenting with ways to save player progress. Memory was precious - every byte counted.",
        media: "https://picsum.photos/800/600?random=1010",
        unlocked: true,
        quiz: {
          question: "What was the primary challenge Jugi faced when developing the first save game system?",
          type: "multiple",
          difficulty: "medium",
          points: 100,
          hint: "Think about the technological limitations of 1982 computers.",
          options: [
            "Games were too simple to need saving",
            "Memory was extremely limited and precious",
            "Players didn't want to save their games",
            "The technology didn't exist yet"
          ],
          correctAnswer: 1,
          explanation: "In 1982, computer memory was measured in kilobytes, not gigabytes. Every single byte had to be carefully managed, making persistent state storage a massive technical challenge.",
          relatedArtifact: "original-code"
        }
      },
      { 
        year: "1984", 
        event: "Developed proprietary save file format",
        detail: "After countless iterations, he created the .SAV format that would become the blueprint for all future save systems.",
        media: "https://picsum.photos/800/600?random=1011",
        unlocked: false,
        quiz: {
          question: "The .SAV file format introduced a revolutionary concept. What made it special?",
          type: "multiple",
          difficulty: "hard",
          points: 150,
          hint: "Consider what makes save files work across different play sessions.",
          options: [
            "It compressed data to save space",
            "It could persist game state between sessions",
            "It was the first file format for games",
            "It used cloud storage"
          ],
          correctAnswer: 1,
          explanation: "The .SAV format's revolutionary feature was its ability to persist complete game state between sessions, allowing players to turn off their computers and resume exactly where they left off - something we take for granted today but was groundbreaking in 1984.",
          relatedArtifact: "design-docs"
        }
      },
      { 
        year: "1986", 
        event: "Save technology adopted by major studios",
        detail: "Nintendo, Atari, and other major companies began licensing his save system technology.",
        media: "https://picsum.photos/800/600?random=1012",
        unlocked: false,
        quiz: {
          question: "Which gaming genre was most directly enabled by Jugi's save game innovation?",
          type: "connection",
          difficulty: "medium",
          points: 120,
          hint: "Think about games that require long-term character progression.",
          options: [
            "First-person shooters",
            "Role-playing games (RPGs)",
            "Racing games",
            "Puzzle games"
          ],
          correctAnswer: 1,
          explanation: "RPGs like Final Fantasy, Dragon Quest, and The Elder Scrolls series could only exist because of save games. These games require dozens or hundreds of hours to complete, with complex character progression that would be impossible without the ability to save.",
          relatedArtifact: "prototype-disk"
        }
      },
      { 
        year: "1990", 
        event: "Industry standard established based on his work",
        detail: "The gaming industry officially standardized save file formats based on Jugi's original specifications.",
        media: "https://picsum.photos/800/600?random=1013",
        unlocked: false,
        quiz: {
          question: "True or False: Without save games, the modern gaming industry worth $180+ billion would likely not exist.",
          type: "truefalse",
          difficulty: "easy",
          points: 80,
          options: [
            "True - Save games enabled complex, long-form gaming experiences",
            "False - Gaming would have evolved the same way regardless"
          ],
          correctAnswer: 0,
          explanation: "True. Save games fundamentally transformed gaming from temporary arcade experiences into persistent worlds. This enabled RPGs, open-world games, progression systems, and the entire modern gaming ecosystem. Without saves, gaming would have remained limited to short, repeatable sessions."
        }
      }
    ],
    
    quotes: [
      {
        text: "Games should be journeys, not just momentary experiences.",
        context: "Said during a 1985 interview with Computer Gaming World",
        unlocked: true
      },
      {
        text: "The power to continue where you left off changes everything.",
        context: "From his 1987 technical paper on persistent game states",
        unlocked: false
      },
      {
        text: "I wanted players to build relationships with their virtual worlds.",
        context: "Keynote speech at the 1989 Game Developer Conference",
        unlocked: false
      }
    ],
    
    artifacts: [
      {
        id: "original-code",
        name: "Original Save File Code",
        description: "The first functional save game implementation, handwritten on yellowed notebook paper",
        rarity: "Mythic",
        type: "Code",
        year: "1982",
        unlocked: true,
        collectionProgress: 0,
        media: "https://picsum.photos/800/600?random=1003"
      },
      {
        id: "design-docs",
        name: "System Architecture Blueprints",
        description: "Hand-drawn diagrams showing the revolutionary save system architecture",
        rarity: "Legendary",
        type: "Document",
        year: "1983",
        unlocked: false,
        collectionProgress: 0,
        media: "https://picsum.photos/800/600?random=1004"
      },
      {
        id: "prototype-disk",
        name: "Prototype Floppy Disk",
        description: "The original 5.25\" floppy disk containing the first working save game demo",
        rarity: "Legendary",
        type: "Hardware",
        year: "1984",
        unlocked: false,
        collectionProgress: 0,
        media: "https://picsum.photos/800/600?random=1005"
      }
    ],
    
    stats: {
      gamesInfluenced: "10,000+",
      playersImpacted: "3 Billion+",
      industryValue: "$180 Billion",
      yearsActive: "15+",
      saveFilesCreated: "∞",
      programmersInspired: "50,000+"
    },
    
    portrait: "https://picsum.photos/400/600?random=1001",
    bannerImage: "https://picsum.photos/1200/800?random=1002",
    heroVideo: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    artifactImages: [
      "https://picsum.photos/800/600?random=1003",
      "https://picsum.photos/800/600?random=1004",
      "https://picsum.photos/800/600?random=1005"
    ],
    
    color: "rgb(163,255,18)",
    gradientClass: "from-green-400/20 to-emerald-600/10",
    accentColor: "#a3ff12"
  },
  {
    id: "alan-turing",
    name: "Alan Turing",
    title: "The Father of Computer Science",
    tagline: "The mind that cracked codes and created the future",
    era: "1930s - 1950s",
    category: "Computer Science",
    impact: "Foundational",
    rarity: "Mythic",
    unlocked: true,
    completionPercentage: 0,
    discoveryLevel: 1,
    
    story: {
      heroLine: "When the world was at war and machines were simple tools, one mathematician envisioned thinking machines that would reshape humanity's future.",
      challenge: "World War II raged, the Enigma code seemed unbreakable, and the concept of artificial intelligence was pure science fiction. The mathematical foundations of computation didn't even exist.",
      breakthrough: "Turing didn't just break Enigma - he laid the theoretical foundation for all modern computing, defined what it means for a machine to think, and created the blueprint for the digital age.",
      legacy: "Every computer, every algorithm, every AI system traces back to Turing's revolutionary ideas about computation. He didn't just solve problems - he invented entirely new ways of thinking.",
      modernImpact: "From your smartphone to ChatGPT, from the internet to space exploration, Turing's work is the invisible foundation supporting our entire digital civilization.",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"
    },
    
    interactiveElements: [
      {
        id: "enigma-simulator",
        name: "Enigma Machine Simulator",
        type: "interactive",
        description: "Try to break the unbreakable code",
        unlocked: true,
        completion: 0
      },
      {
        id: "turing-machine",
        name: "Turing Machine Simulator",
        type: "simulation",
        description: "Build and run your own Turing machine",
        unlocked: false,
        completion: 0
      },
      {
        id: "ai-evolution",
        name: "AI Evolution Tree",
        type: "interactive-tree",
        description: "Explore how Turing's ideas led to modern AI",
        unlocked: false,
        completion: 0
      }
    ],
    
    achievements: [
      { name: "Universal Machine Concept", year: "1936", description: "Conceptualized the universal computing machine", unlocked: true },
      { name: "Enigma Breaker", year: "1940", description: "Designed the Bombe to break Nazi codes", unlocked: false },
      { name: "AI Pioneer", year: "1950", description: "Proposed the Turing Test for machine intelligence", unlocked: false },
      { name: "Computer Science Father", year: "Legacy", description: "Founded the entire field of computer science", unlocked: false }
    ],
    
    timeline: [
      { 
        year: "1936", 
        event: "Published 'On Computable Numbers' - the Turing Machine concept",
        detail: "At just 24, Turing published a paper that would define the theoretical foundations of all computing. He imagined a machine that could simulate any other machine.",
        media: "https://picsum.photos/800/600?random=2010",
        unlocked: true
      },
      { 
        year: "1940", 
        event: "Designed the Bombe to break Enigma codes",
        detail: "Working in secret at Bletchley Park, Turing's code-breaking machine helped end WWII and saved millions of lives.",
        media: "https://picsum.photos/800/600?random=2011",
        unlocked: false
      },
      { 
        year: "1950", 
        event: "Proposed the Turing Test in 'Computing Machinery and Intelligence'",
        detail: "Turing asked the ultimate question: 'Can machines think?' His test remains the gold standard for AI evaluation today.",
        media: "https://picsum.photos/800/600?random=2012",
        unlocked: false
      },
      { 
        year: "1952", 
        event: "Early work on morphogenesis and pattern formation",
        detail: "Even in biology, Turing was ahead of his time, predicting how patterns form in nature using mathematical models.",
        media: "https://picsum.photos/800/600?random=2013",
        unlocked: false
      }
    ],
    
    quotes: [
      {
        text: "I believe that at the end of the century the use of words and general educated opinion will have altered so much that one will be able to speak of machines thinking without expecting to be contradicted.",
        context: "From 'Computing Machinery and Intelligence' (1950)",
        unlocked: true
      },
      {
        text: "We can only see a short distance ahead, but we can see plenty there that needs to be done.",
        context: "On the future of computing research",
        unlocked: false
      },
      {
        text: "Mathematical reasoning may be regarded rather schematically as the exercise of a combination of... intuition and ingenuity.",
        context: "From his foundational work on computability",
        unlocked: false
      }
    ],
    
    artifacts: [
      {
        id: "turing-machine-design",
        name: "Turing Machine Blueprints",
        description: "Original conceptual designs for the universal computing machine that started it all",
        rarity: "Mythic",
        type: "Blueprint",
        year: "1936",
        unlocked: true,
        collectionProgress: 0,
        media: "https://picsum.photos/800/600?random=2003"
      },
      {
        id: "enigma-notes",
        name: "Enigma Breaking Notes",
        description: "Personal notes and calculations used to crack the unbreakable Nazi code",
        rarity: "Legendary",
        type: "Document",
        year: "1940",
        unlocked: false,
        collectionProgress: 0,
        media: "https://picsum.photos/800/600?random=2004"
      },
      {
        id: "ai-paper",
        name: "Computing Machinery Paper",
        description: "The original manuscript that launched the field of artificial intelligence",
        rarity: "Legendary",
        type: "Manuscript",
        year: "1950",
        unlocked: false,
        collectionProgress: 0,
        media: "https://picsum.photos/800/600?random=2005"
      }
    ],
    
    stats: {
      gamesInfluenced: "All Computing",
      playersImpacted: "8 Billion+",
      industryValue: "$5 Trillion",
      yearsActive: "25+",
      livesChanged: "Immeasurable",
      fieldsCreated: "Computer Science"
    },
    
    portrait: "https://picsum.photos/400/600?random=2001",
    bannerImage: "https://picsum.photos/1200/800?random=2002",
    heroVideo: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    artifactImages: [
      "https://picsum.photos/800/600?random=2003",
      "https://picsum.photos/800/600?random=2004",
      "https://picsum.photos/800/600?random=2005"
    ],
    
    color: "rgb(59, 130, 246)",
    gradientClass: "from-blue-400/20 to-blue-600/10",
    accentColor: "#3b82f6"
  }
];

// Gamification System
export const museumProgress = {
  totalLegends: legends.length + 4, // Including coming soon
  unlockedLegends: legends.filter(l => l.unlocked).length,
  totalArtifacts: legends.reduce((sum, legend) => sum + legend.artifacts.length, 0),
  collectedArtifacts: 0,
  explorationLevel: 1,
  curatorPoints: 0,
  achievements: [
    { name: "First Steps", description: "Enter the Legends Hall", completed: true },
    { name: "Code Breaker", description: "Unlock all Turing artifacts", completed: false },
    { name: "Save Master", description: "Complete Jugi's interactive timeline", completed: false },
    { name: "Legend Curator", description: "Collect 10 artifacts", completed: false }
  ]
};