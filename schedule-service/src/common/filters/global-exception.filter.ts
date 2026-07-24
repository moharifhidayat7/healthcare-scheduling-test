import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;

    const isHttp = exception instanceof HttpException;
    const status = isHttp
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = isHttp ? exception.getResponse() : 'Internal server error';

    if (!isHttp) {
      this.logger.error(
        `Unhandled exception: ${exception instanceof Error ? exception.message : exception}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const responseBody = {
      statusCode: status,
      message:
        typeof message === 'string'
          ? message
          : ((message as Record<string, unknown>).message ?? message),
      data: null,
      meta: {
        timestamp: new Date().toISOString(),
        path: httpAdapter.getRequestUrl(host.switchToHttp().getRequest()),
      },
    };

    httpAdapter.reply(host.switchToHttp().getResponse(), responseBody, status);
  }
}
