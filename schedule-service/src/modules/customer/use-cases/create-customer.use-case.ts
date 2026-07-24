import { Injectable } from '@nestjs/common';
import { CustomerService } from '../customer.service';
import { CreateCustomerInput } from '../graphql/inputs/create-customer.input';

@Injectable()
export class CreateCustomerUseCase {
  constructor(private readonly customerService: CustomerService) {}

  async execute(input: CreateCustomerInput) {
    return this.customerService.create(input);
  }
}
