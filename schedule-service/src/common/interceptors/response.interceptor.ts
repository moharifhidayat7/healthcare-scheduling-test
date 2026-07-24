import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SKIP_RESPONSE_WRAP } from '../decorators/skip-response-wrap.decorator';
import { PAGINATED } from '../decorators/paginated.decorator';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if ((context.getType() as string) === 'graphql') {
      return next.handle();
    }

    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_RESPONSE_WRAP, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) return next.handle();

    const paginated = this.reflector.getAllAndOverride<boolean>(PAGINATED, [
      context.getHandler(),
      context.getClass(),
    ]);

    const response = context.switchToHttp().getResponse();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((result: unknown) => {
        const res = result as Record<string, unknown> | null;

        if (paginated) {
          return {
            statusCode,
            message: 'Success',
            data: res?.data ?? result,
            meta: {
              timestamp: new Date().toISOString(),
              pagination:
                (res?.meta as Record<string, unknown>)?.pagination ?? null,
            },
          };
        }

        return {
          statusCode,
          message: 'Success',
          data: result,
          meta: {
            timestamp: new Date().toISOString(),
          },
        };
      }),
    );
  }
}
