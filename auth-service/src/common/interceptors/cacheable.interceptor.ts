import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from '../cache/cache.service';
import {
  CACHEABLE_KEY,
  CacheableMetadata,
} from '../decorators/cacheable.decorator';

@Injectable()
export class CacheableInterceptor implements NestInterceptor {
  constructor(
    private readonly cache: CacheService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const metadata = this.reflector.get<CacheableMetadata | undefined>(
      CACHEABLE_KEY,
      context.getHandler(),
    );
    if (!metadata) return next.handle();

    const cacheKey = metadata.keyFn(...context.getArgs());

    return new Observable((observer) => {
      this.cache
        .get<unknown>(cacheKey)
        .then((cached) => {
          if (cached !== null) {
            observer.next(cached);
            observer.complete();
            return;
          }

          next
            .handle()
            .pipe(
              tap((result) => {
                if (result !== undefined) {
                  this.cache
                    .set(cacheKey, result, metadata.ttl)
                    .catch(() => {});
                }
              }),
            )
            .subscribe({
              next: (value) => observer.next(value),
              error: (err) => observer.error(err),
              complete: () => observer.complete(),
            });
        })
        .catch(() => {
          next.handle().subscribe({
            next: (value) => observer.next(value),
            error: (err) => observer.error(err),
            complete: () => observer.complete(),
          });
        });
    });
  }
}
