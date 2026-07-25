import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsString } from 'class-validator';

@InputType()
export class CreateCustomerInput {
  @Field({ description: 'Full name of the customer' })
  @IsString()
  name: string;

  @Field({ description: 'Email address of the customer (must be unique)' })
  @IsEmail()
  email: string;
}
