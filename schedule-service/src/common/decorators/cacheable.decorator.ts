import { SetMetadata, UseInterceptors, applyDecorators } from '@nestjs/common';
import { CacheableInterceptor } from '../interceptors/cacheable.interceptor';

export const CACHEABLE_KEY = 'cacheable';

export interface CacheableMetadata {
  keyFn: (...args: unknown[]) => string;
  ttl: number;
}

/**
 * Marks a method for cache-aside behavior.
 *
 * @param keyFn - Function receiving the method arguments, returning the cache key
 * @param ttl - TTL in seconds (default 300)
 *
 * ```ts
 * @Cacheable((page, limit) => `customer:list:${page}:${limit}`)
 * async findAll(page: number, limit: number) { ... }
 * ```
 */
export const Cacheable = (keyFn: (...args: unknown[]) => string, ttl = 300) =>
  applyDecorators(
    SetMetadata<string, CacheableMetadata>(CACHEABLE_KEY, { keyFn, ttl }),
    UseInterceptors(CacheableInterceptor),
  );
