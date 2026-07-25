import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Request');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();

    let handlerName = '';
    let requestInfo = '';
    let variables: Record<string, unknown> | undefined;

    if (context.getType() === 'http') {
      const request = context.switchToHttp().getRequest();
      handlerName = `${request.method} ${request.url}`;
      requestInfo = `${request.ip}`;
    } else if (context.getType<'graphql'>() === 'graphql') {
      const gqlContext = GqlExecutionContext.create(context);
      const info = gqlContext.getInfo();
      const args = gqlContext.getArgs();
      handlerName = `${info.parentType.name}.${info.fieldName}`;
      variables = args && Object.keys(args).length > 0 ? args : undefined;
      const request = gqlContext.getContext().req;
      requestInfo = `${request.ip}`;
    }

    if (variables) {
      this.logger.log(
        `Started ${handlerName} input=${JSON.stringify(variables)} ${requestInfo}`,
      );
    } else {
      this.logger.log(`Started ${handlerName} ${requestInfo}`);
    }

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.log(`Completed ${handlerName} ${Date.now() - start}ms`);
        },
        error: (error) => {
          this.logger.error(
            `Failed ${handlerName} ${Date.now() - start}ms: ${error.message}`,
            error.stack,
          );
        },
      }),
    );
  }
}
