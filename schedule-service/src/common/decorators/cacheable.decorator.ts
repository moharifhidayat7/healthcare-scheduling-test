import { CacheService } from '../cache/cache.service';

export const CACHEABLE_KEY = 'cacheable';

export interface CacheableMetadata {
  keyFn: (...args: unknown[]) => string;
  ttl: number;
}

/**
 * Marks a method for cache-aside behavior.
 *
 * Wraps the method directly (not via NestJS interceptor proxy) so it works
 * on any provider, not just controllers/resolvers.
 *
 * Falls through to the original method when CacheService is not initialized
 * (e.g. unit tests that instantiate the class outside NestJS DI).
 *
 * @param keyFn - Function receiving the method arguments, returning the cache key
 * @param ttl - TTL in seconds (default 300)
 *
 * ```ts
 * @Cacheable((page, limit) => `customer:list:${page}:${limit}`)
 * async findAll(page: number, limit: number) { ... }
 * ```
 */
export const Cacheable = (keyFn: (...args: unknown[]) => string, ttl = 300) => {
  return (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) => {
    const original = descriptor.value;

    descriptor.value = async function (this: unknown, ...args: unknown[]) {
      let cache: CacheService;
      try {
        cache = CacheService.getInstance();
      } catch {
        // CacheService not initialized — passthrough (e.g. unit tests)
        return original.apply(this, args);
      }

      const key = keyFn(...args);

      const cached = await cache.get<unknown>(key);
      if (cached !== null) return cached;

      const result = await original.apply(this, args);
      if (result !== undefined) {
        cache.set(key, result, ttl).catch(() => {});
      }
      return result;
    };
  };
};
