import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsString } from 'class-validator';

@InputType({ description: 'Input for authenticating an existing user' })
export class LoginInput {
  @Field({ description: 'Registered email address' })
  @IsEmail()
  email: string;

  @Field({ description: 'Account password' })
  @IsString()
  password: string;
}
