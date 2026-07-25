import { InputType, Field, ID } from '@nestjs/graphql';
import { IsString, IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

@InputType()
export class UpdateCustomerInput {
  @Field(() => ID, {
    description: 'Unique identifier of the customer to update',
  })
  @IsNotEmpty()
  id: string;

  @Field({ nullable: true, description: 'Updated full name' })
  @IsOptional()
  @IsString()
  name?: string;

  @Field({
    nullable: true,
    description: 'Updated email address (must be unique)',
  })
  @IsOptional()
  @IsEmail()
  email?: string;
}
