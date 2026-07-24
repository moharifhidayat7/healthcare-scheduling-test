import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtPayload } from './token-validator';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    if ((ctx.getType() as string) === 'graphql') {
      return GqlExecutionContext.create(ctx).getContext().req.user;
    }
    return ctx.switchToHttp().getRequest().user;
  },
);
