import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import { Observable, tap } from "rxjs";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger("Request");

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    const start = Date.now();

    let handlerName = "";
    let requestInfo = "";

    if (context.getType() === "http") {
      // REST API
      const request = context.switchToHttp().getRequest();

      handlerName = `${request.method} ${request.url}`;
      requestInfo = `${request.ip}`;
    } else if (context.getType<"graphql">() === "graphql") {
      // GraphQL API
      const gqlContext = GqlExecutionContext.create(context);
      const info = gqlContext.getInfo();

      handlerName = `${info.parentType.name}.${info.fieldName}`;

      const request = gqlContext.getContext().req;
      requestInfo = `${request.ip}`;
    }

    this.logger.log(
      `Started ${handlerName} ${requestInfo}`,
    );

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.log(
            `Completed ${handlerName} ${Date.now() - start}ms`,
          );
        },
        error: (error) => {
          this.logger.error(
            `Failed ${handlerName}: ${error.message}`,
          );
        },
      }),
    );
  }
}
