import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType({
  description: 'JWT token returned after successful authentication',
})
export class AuthToken {
  @Field({
    description:
      'Signed JWT token. Include in Authorization header as Bearer token.',
  })
  token: string;
}
