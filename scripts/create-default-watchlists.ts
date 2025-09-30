import { prisma } from '../lib/prisma';

async function createDefaultWatchlists() {
  try {
    console.log('Starting to create default watchlists for existing users...');

    // Get all users who don't have a watchlist yet
    const usersWithoutWatchlist = await prisma.user.findMany({
      where: {
        lists: {
          none: {
            type: 'watchlist'
          }
        }
      },
      select: {
        id: true,
        walletAddress: true,
      }
    });

    console.log(`Found ${usersWithoutWatchlist.length} users without a watchlist`);

    if (usersWithoutWatchlist.length === 0) {
      console.log('All users already have a watchlist!');
      return;
    }

    // Create watchlists for all users without one
    const watchlists = await prisma.userList.createMany({
      data: usersWithoutWatchlist.map(user => ({
        userId: user.id,
        name: 'Watchlist',
        type: 'watchlist',
        isPublic: false,
      })),
      skipDuplicates: true,
    });

    console.log(`✅ Successfully created ${watchlists.count} watchlists`);
    console.log('Migration complete!');
  } catch (error) {
    console.error('Error creating default watchlists:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createDefaultWatchlists();