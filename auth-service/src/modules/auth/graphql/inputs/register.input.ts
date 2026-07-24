import { InputType, Field } from '@nestjs/graphql';

@InputType({ description: 'Input for creating a new user account' })
export class RegisterInput {
  @Field({ description: 'User email address (must be unique)' })
  email: string;

  @Field({ description: 'Plain-text password (will be hashed with bcrypt)' })
  password: string;
}
