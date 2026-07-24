import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateCustomerInput {
  @Field({ description: 'Full name of the customer' })
  name: string;

  @Field({ description: 'Email address of the customer (must be unique)' })
  email: string;
}
