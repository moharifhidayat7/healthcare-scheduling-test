import { Injectable } from '@nestjs/common';
import { CustomerService } from '../customer.service';

@Injectable()
export class GetCustomerUseCase {
  constructor(private readonly customerService: CustomerService) {}

  async execute(id: string) {
    return this.customerService.findById(id);
  }
}
