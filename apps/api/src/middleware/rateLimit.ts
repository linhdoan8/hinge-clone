import { Request, Response, NextFunction } from "express";
import redis from "../utils/redis.js";
import { tooManyRequests } from "../utils/errors.js";

/**
 * Redis-based rate limiter middleware factory.
 * @param keyPrefix - Prefix for the Redis key (e.g., "likes", "messages")
 * @param maxRequests - Maximum number of requests allowed in the window
 * @param windowSeconds - Time window in seconds
 */
export function rateLimit(
  keyPrefix: string,
  maxRequests: number,
  windowSeconds: number
) {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.userId;
      if (!userId) {
        next();
        return;
      }

      const key = `rate_limit:${keyPrefix}:${userId}`;
      const current = await redis.incr(key);

      if (current === 1) {
        await redis.expire(key, windowSeconds);
      }

      if (current > maxRequests) {
        const ttl = await redis.ttl(key);
        next(
          tooManyRequests(
            `Rate limit exceeded. Try again in ${ttl} seconds.`
          )
        );
        return;
      }

      next();
    } catch (error) {
      // If Redis is down, allow the request through (fail open)
      console.error("Rate limiter error:", error);
      next();
    }
  };
}
