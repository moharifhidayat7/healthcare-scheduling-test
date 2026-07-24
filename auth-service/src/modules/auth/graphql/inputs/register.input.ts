import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsString, MinLength } from 'class-validator';

@InputType({ description: 'Input for creating a new user account' })
export class RegisterInput {
  @Field({ description: 'User email address (must be unique)' })
  @IsEmail()
  email: string;

  @Field({ description: 'Plain-text password (will be hashed with bcrypt)' })
  @IsString()
  @MinLength(6)
  password: string;
}
