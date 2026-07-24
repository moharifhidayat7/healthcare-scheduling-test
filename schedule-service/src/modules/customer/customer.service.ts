import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../integrations/prisma/prisma.service';
import { CreateCustomerInput } from './graphql/inputs/create-customer.input';
import { UpdateCustomerInput } from './graphql/inputs/update-customer.input';

@Injectable()
export class CustomerService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateCustomerInput) {
    return this.prisma.customer.create({ data: input });
  }

  async findAll(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.customer.count(),
    ]);

    return {
      data,
      meta: {
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  async findById(id: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      throw new NotFoundException(`Customer with id ${id} not found`);
    }
    return customer;
  }

  async update(input: UpdateCustomerInput) {
    const { id, ...data } = input;
    await this.findById(id);
    return this.prisma.customer.update({ where: { id }, data });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.customer.delete({ where: { id } });
  }
}
