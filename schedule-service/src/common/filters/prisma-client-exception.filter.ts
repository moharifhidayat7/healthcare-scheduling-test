import {
  ArgumentsHost,
  Catch,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GqlArgumentsHost, GqlContextType } from '@nestjs/graphql';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';

/**
 * Maps known Prisma client error codes to NestJS HTTP exceptions.
 *
 * | Code | Meaning              | HTTP Exception    |
 * |------|----------------------|-------------------|
 * | P2001| Record not found    | NotFoundException |
 * | P2002| Unique constraint    | ConflictException |
 * | P2025| Record not found    | NotFoundException |
 */
const PRISMA_CODE_MAP: Record<
  string,
  {
    exception: new (message: string) => ConflictException | NotFoundException;
    message: (error: PrismaClientKnownRequestError) => string;
  }
> = {
  P2001: {
    exception: NotFoundException,
    message: () => 'Record not found',
  },
  P2002: {
    exception: ConflictException,
    message: (error) => {
      const target = (error.meta?.target as string[] | undefined) ?? [];
      const fields = target.join(', ');
      return fields
        ? `Resource with ${fields} already exists`
        : 'Resource already exists';
    },
  },
  P2025: {
    exception: NotFoundException,
    message: (error) =>
      (error.meta?.cause as string | undefined) ?? 'Record not found',
  },
};

@Catch(PrismaClientKnownRequestError)
@Injectable()
export class PrismaClientExceptionFilter {
  catch(exception: PrismaClientKnownRequestError, host: ArgumentsHost): never {
    if (host.getType<GqlContextType>() === 'graphql') {
      GqlArgumentsHost.create(host);
    }

    const mapping = PRISMA_CODE_MAP[exception.code];
    if (mapping) {
      throw new mapping.exception(mapping.message(exception));
    }

    throw exception;
  }
}
