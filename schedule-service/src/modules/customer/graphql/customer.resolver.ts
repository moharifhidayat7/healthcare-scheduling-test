import { Resolver, Query, Mutation, Args, Int, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ExternalAuthGuard } from '../../../common/auth/external.guard';
import { CustomerType, PaginatedCustomerType } from './types/customer.type';
import { CreateCustomerInput } from './inputs/create-customer.input';
import { UpdateCustomerInput } from './inputs/update-customer.input';
import { CreateCustomerUseCase } from '../use-cases/create-customer.use-case';
import { UpdateCustomerUseCase } from '../use-cases/update-customer.use-case';
import { GetCustomerUseCase } from '../use-cases/get-customer.use-case';
import { GetCustomersUseCase } from '../use-cases/get-customers.use-case';
import { DeleteCustomerUseCase } from '../use-cases/delete-customer.use-case';

@UseGuards(ExternalAuthGuard)
@Resolver(() => CustomerType)
export class CustomerResolver {
  constructor(
    private readonly createCustomerUseCase: CreateCustomerUseCase,
    private readonly updateCustomerUseCase: UpdateCustomerUseCase,
    private readonly getCustomerUseCase: GetCustomerUseCase,
    private readonly getCustomersUseCase: GetCustomersUseCase,
    private readonly deleteCustomerUseCase: DeleteCustomerUseCase,
  ) {}

  @Query(() => PaginatedCustomerType, {
    description:
      'Retrieve a paginated list of customers sorted by creation date descending',
  })
  async customers(
    @Args('page', {
      type: () => Int,
      nullable: true,
      description: 'Page number (starts at 1)',
    })
    page?: number,
    @Args('limit', {
      type: () => Int,
      nullable: true,
      description: 'Items per page (1-100, default 20)',
    })
    limit?: number,
  ) {
    return this.getCustomersUseCase.execute(page, limit);
  }

  @Query(() => CustomerType, {
    description: 'Retrieve a single customer by its unique identifier',
  })
  async customer(
    @Args('id', {
      type: () => ID,
      description: 'The unique identifier of the customer',
    })
    id: string,
  ) {
    return this.getCustomerUseCase.execute(id);
  }

  @Mutation(() => CustomerType, {
    description: 'Create a new customer with the provided name and email',
  })
  async createCustomer(
    @Args('input', { description: 'Customer creation payload' })
    input: CreateCustomerInput,
  ) {
    return this.createCustomerUseCase.execute(input);
  }

  @Mutation(() => CustomerType, {
    description:
      'Update an existing customer by ID. Only provided fields are changed',
  })
  async updateCustomer(
    @Args('input', { description: 'Customer update payload (id required)' })
    input: UpdateCustomerInput,
  ) {
    return this.updateCustomerUseCase.execute(input);
  }

  @Mutation(() => CustomerType, {
    description: 'Delete a customer permanently by its unique identifier',
  })
  async deleteCustomer(
    @Args('id', {
      type: () => ID,
      description: 'The unique identifier of the customer to delete',
    })
    id: string,
  ) {
    return this.deleteCustomerUseCase.execute(id);
  }
}
