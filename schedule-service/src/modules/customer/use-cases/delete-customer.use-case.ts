import { Injectable } from '@nestjs/common';
import { CustomerService } from '../customer.service';

@Injectable()
export class DeleteCustomerUseCase {
  constructor(private readonly customerService: CustomerService) {}

  async execute(id: string) {
    return this.customerService.delete(id);
  }
}
