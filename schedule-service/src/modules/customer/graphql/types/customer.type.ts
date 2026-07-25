import { ObjectType, Field, ID } from '@nestjs/graphql';
import { PaginatedType } from '../../../../common/pagination/pagination.type';

@ObjectType()
export class CustomerType {
  @Field(() => ID, { description: 'Unique identifier' })
  id: string;

  @Field({ description: 'Full name of the customer' })
  name: string;

  @Field({ description: 'Email address of the customer' })
  email: string;

  @Field({ description: 'Timestamp when the customer was created' })
  createdAt: Date;

  @Field({ description: 'Timestamp when the customer was last updated' })
  updatedAt: Date;
}

@ObjectType()
export class PaginatedCustomerType extends PaginatedType(CustomerType) {}
