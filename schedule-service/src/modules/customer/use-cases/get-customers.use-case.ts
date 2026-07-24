import { Injectable } from '@nestjs/common';
import { CustomerService } from '../customer.service';

@Injectable()
export class GetCustomersUseCase {
  constructor(private readonly customerService: CustomerService) {}

  async execute(page: number = 1, limit: number = 20) {
    return this.customerService.findAll(page, limit);
  }
}
