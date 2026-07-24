import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class AuthType {
  @Field()
  accessToken: string;
}
