import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType({ description: 'Decoded user information from a valid JWT' })
export class UserInfo {
  @Field(() => ID, { description: 'Unique user identifier (UUID)' })
  id: string;

  @Field({ description: 'User email address' })
  email: string;

  @Field(() => [String], { description: 'Assigned roles (e.g. ["user"])' })
  roles: string[];
}
