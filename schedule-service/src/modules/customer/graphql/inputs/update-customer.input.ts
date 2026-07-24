import { InputType, Field, ID } from '@nestjs/graphql';

@InputType()
export class UpdateCustomerInput {
  @Field(() => ID, {
    description: 'Unique identifier of the customer to update',
  })
  id: string;

  @Field({ nullable: true, description: 'Updated full name' })
  name?: string;

  @Field({
    nullable: true,
    description: 'Updated email address (must be unique)',
  })
  email?: string;
}
