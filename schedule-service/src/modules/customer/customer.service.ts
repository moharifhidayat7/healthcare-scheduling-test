import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../integrations/prisma/prisma.service';
import { CacheService } from '../../common/cache/cache.service';
import { Cacheable } from '../../common/decorators/cacheable.decorator';
import {
  buildPaginatedResult,
  normalizePagination,
} from '../../common/pagination/pagination.util';
import { CreateCustomerInput } from './graphql/inputs/create-customer.input';
import { UpdateCustomerInput } from './graphql/inputs/update-customer.input';

@Injectable()
export class CustomerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async create(input: CreateCustomerInput) {
    const customer = await this.prisma.customer.create({ data: input });
    await this.cache.delByPattern('customer:list:*');
    return customer;
  }

  @Cacheable((page, limit) => `customer:list:${page}:${limit}`)
  async findAll(page?: number, limit?: number) {
    const { page: p, limit: l } = normalizePagination(page, limit);
    const skip = (p - 1) * l;
    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        skip,
        take: l,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.customer.count(),
    ]);

    return buildPaginatedResult(data, total, { page: p, limit: l });
  }

  @Cacheable((id) => `customer:${id}`)
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
    const updated = await this.prisma.customer.update({ where: { id }, data });
    await this.cache.del(`customer:${id}`);
    await this.cache.delByPattern('customer:list:*');
    return updated;
  }

  async delete(id: string) {
    await this.findById(id);
    const deleted = await this.prisma.customer.delete({ where: { id } });
    await this.cache.del(`customer:${id}`);
    await this.cache.delByPattern('customer:list:*');
    return deleted;
  }
}
