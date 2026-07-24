import { Injectable } from '@nestjs/common';
import { CustomerService } from '../customer.service';
import { UpdateCustomerInput } from '../graphql/inputs/update-customer.input';

@Injectable()
export class UpdateCustomerUseCase {
  constructor(private readonly customerService: CustomerService) {}

  async execute(input: UpdateCustomerInput) {
    return this.customerService.update(input);
  }
}
