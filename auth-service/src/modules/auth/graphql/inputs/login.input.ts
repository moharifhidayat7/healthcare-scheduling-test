import { InputType, Field } from '@nestjs/graphql';

@InputType({ description: 'Input for authenticating an existing user' })
export class LoginInput {
  @Field({ description: 'Registered email address' })
  email: string;

  @Field({ description: 'Account password' })
  password: string;
}
