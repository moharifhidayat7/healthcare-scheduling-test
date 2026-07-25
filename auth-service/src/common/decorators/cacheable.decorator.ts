import { SetMetadata, UseInterceptors, applyDecorators } from '@nestjs/common';
import { CacheableInterceptor } from '../interceptors/cacheable.interceptor';

export const CACHEABLE_KEY = 'cacheable';

export interface CacheableMetadata {
  keyFn: (...args: unknown[]) => string;
  ttl: number;
}

export const Cacheable = (keyFn: (...args: unknown[]) => string, ttl = 300) =>
  applyDecorators(
    SetMetadata<string, CacheableMetadata>(CACHEABLE_KEY, { keyFn, ttl }),
    UseInterceptors(CacheableInterceptor),
  );
