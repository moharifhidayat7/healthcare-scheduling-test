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

    const response = context.switchToHttp().getResponse();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((result: unknown) => {
        const res = result as Record<string, unknown> | null;
        const hasPagination =
          res &&
          typeof res === 'object' &&
          'meta' in res &&
          res.meta &&
          typeof res.meta === 'object' &&
          'pagination' in (res.meta as Record<string, unknown>);

        return {
          statusCode,
          message: 'Success',
          data: hasPagination ? (res as Record<string, unknown>).data : result,
          meta: {
            timestamp: new Date().toISOString(),
            ...(hasPagination
              ? { pagination: (res as Record<string, unknown>).meta }
              : {}),
          },
        };
      }),
    );
  }
}
