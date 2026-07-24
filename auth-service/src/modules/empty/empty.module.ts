import { Module } from '@nestjs/common';
import { EmptyResolver } from './graphql/empty.resolver';
import { WebEmptyController } from './rest/web/empty.controller';
import { MobileEmptyController } from './rest/mobile/empty.controller';

@Module({
  providers: [EmptyResolver],
  controllers: [WebEmptyController, MobileEmptyController],
})
export class EmptyModule {}
