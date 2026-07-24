import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../integrations/prisma/prisma.service';
import { CacheService } from '../../common/cache/cache.service';
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
    await this.invalidateListCache('customer');
    return customer;
  }

  async findAll(page: number, limit: number) {
    const cacheKey = `customer:list:${page}:${limit}`;
    const cached = await this.safeCacheGet<{
      data: unknown[];
      meta: { pagination: Record<string, unknown> };
    }>(cacheKey);
    if (cached) return cached;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.customer.count(),
    ]);

    const result = {
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

    await this.cache.set(cacheKey, result, 300);
    return result;
  }

  async findById(id: string) {
    const cacheKey = `customer:${id}`;
    const cached = await this.safeCacheGet<unknown>(cacheKey);
    if (cached) return cached;

    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      throw new NotFoundException(`Customer with id ${id} not found`);
    }

    await this.cache.set(cacheKey, customer, 300);
    return customer;
  }

  async update(input: UpdateCustomerInput) {
    const { id, ...data } = input;
    await this.findById(id);
    const updated = await this.prisma.customer.update({ where: { id }, data });
    await this.invalidateEntityCache('customer', id);
    return updated;
  }

  async delete(id: string) {
    await this.findById(id);
    const deleted = await this.prisma.customer.delete({ where: { id } });
    await this.invalidateEntityCache('customer', id);
    return deleted;
  }

  private async safeCacheGet<T>(key: string): Promise<T | null> {
    try {
      return await this.cache.get<T>(key);
    } catch {
      return null;
    }
  }

  private async invalidateListCache(entity: string) {
    try {
      await this.cache.delByPattern(`*${entity}:list:*`);
    } catch {
      /* noop */
    }
  }

  private async invalidateEntityCache(entity: string, id: string) {
    try {
      await Promise.all([
        this.cache.del(`${entity}:${id}`),
        this.cache.delByPattern(`*${entity}:list:*`),
      ]);
    } catch {
      /* noop */
    }
  }
}
