/**
 * Redis client singleton for rate limiting and caching
 * @module lib/redis
 */
import Redis from "ioredis";
import { z } from "zod";

/**
 * Environment validation schema for Redis configuration
 */
const RedisEnvSchema = z.object({
  REDIS_URL: z.string().url("REDIS_URL must be a valid URL").startsWith("redis", "REDIS_URL must start with redis:// or rediss://"),
});

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    const envResult = RedisEnvSchema.safeParse(process.env);

    if (!envResult.success) {
      const errorMessage = envResult.error.errors.map((e) => e.message).join(", ");
      console.warn(`Redis configuration error: ${errorMessage}`);
      throw new Error(`REDIS_URL is required for production: ${errorMessage}`);
    }

    const { REDIS_URL: redisUrl } = envResult.data;

    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 200, 1000);
      },
      enableReadyCheck: true,
      connectTimeout: 10000,
    });

    redis.on("error", (err) => {
      console.error("Redis connection error:", err);
    });

    redis.on("connect", () => {
      console.log("Redis connected");
    });
  }

  return redis;
}

export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}
