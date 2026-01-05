/**
 * Root tRPC Router
 * Combines all sub-routers into a single API
 */
import { router } from "../index";
import { lootboxRouter } from "./lootbox";
import { marketplaceRouter } from "./marketplace";
import { p2pRouter } from "./p2p";
import { userRouter } from "./user";
import { gamingRouter } from "./gaming";
import { studioRouter } from "./studio";
import { museumRouter } from "./museum";
import { hypeNetworkRouter } from "./hype-network";
import { clanRouter } from "./clan";
import { clanChatRouter } from "./clan-chat";
import { whispersRouter } from "./whispers";

export const appRouter = router({
  lootbox: lootboxRouter,
  marketplace: marketplaceRouter,
  p2p: p2pRouter,
  user: userRouter,
  gaming: gamingRouter,
  studio: studioRouter,
  museum: museumRouter,
  hypeNetwork: hypeNetworkRouter,
  clan: clanRouter,
  clanChat: clanChatRouter,
  whispers: whispersRouter,
});

export type AppRouter = typeof appRouter;
