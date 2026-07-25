import { Global, Module } from '@nestjs/common';
import { RedisModule } from '../../integrations/redis/redis.module';
import { CacheService } from './cache.service';
import { CacheableInterceptor } from '../interceptors/cacheable.interceptor';

@Global()
@Module({
  imports: [RedisModule],
  providers: [CacheService, CacheableInterceptor],
  exports: [CacheService, CacheableInterceptor],
})
export class CacheModule {}
