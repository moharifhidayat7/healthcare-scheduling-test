import { Injectable } from '@nestjs/common';
import { RedisService } from '../../integrations/redis/redis.service';

@Injectable()
export class CacheService {
  private static _instance: CacheService | null = null;
  static getInstance(): CacheService {
    if (!CacheService._instance)
      throw new Error('CacheService not initialized');
    return CacheService._instance;
  }

  constructor(private readonly redis: RedisService) {
    CacheService._instance = this;
  }
  async get<T>(key: string): Promise<T | null> {
    const raw = await this.redis.get(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw, (_key, value) => {
        if (
          typeof value === 'string' &&
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)
        ) {
          return new Date(value);
        }
        return value;
      }) as T;
    } catch {
      return null;
    }
  }

  /**
   * @param key Cache key
   * @param value Value to cache (JSON-serialized)
   * @param ttl TTL in seconds (default 300 = 5 min)
   */
  async set(key: string, value: unknown, ttl = 300): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  /** Delete all keys matching a glob pattern. Uses SCAN + DEL on the underlying Redis. */
  async delByPattern(pattern: string): Promise<void> {
    let cursor = '0';
    do {
      const result = await this.redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100,
      );
      cursor = result[0];
      const keys = result[1];
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } while (cursor !== '0');
  }
}
