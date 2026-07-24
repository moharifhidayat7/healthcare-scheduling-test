import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../integrations/prisma/prisma.service';
import { CacheService } from '../../common/cache/cache.service';
import { CreateDoctorInput } from './graphql/inputs/create-doctor.input';
import { UpdateDoctorInput } from './graphql/inputs/update-doctor.input';

@Injectable()
export class DoctorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async create(input: CreateDoctorInput) {
    const doctor = await this.prisma.doctor.create({ data: input });
    await this.invalidateListCache('doctor');
    return doctor;
  }

  async findAll(page: number, limit: number) {
    const cacheKey = `doctor:list:${page}:${limit}`;
    const cached = await this.safeCacheGet<{
      data: unknown[];
      meta: { pagination: Record<string, unknown> };
    }>(cacheKey);
    if (cached) return cached;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.doctor.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.doctor.count(),
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
    const cacheKey = `doctor:${id}`;
    const cached = await this.safeCacheGet<unknown>(cacheKey);
    if (cached) return cached;

    const doctor = await this.prisma.doctor.findUnique({ where: { id } });
    if (!doctor) {
      throw new NotFoundException(`Doctor with id ${id} not found`);
    }

    await this.cache.set(cacheKey, doctor, 300);
    return doctor;
  }

  async update(input: UpdateDoctorInput) {
    const { id, ...data } = input;
    await this.findById(id);
    const updated = await this.prisma.doctor.update({ where: { id }, data });
    await this.invalidateEntityCache('doctor', id);
    return updated;
  }

  async delete(id: string) {
    await this.findById(id);
    const deleted = await this.prisma.doctor.delete({ where: { id } });
    await this.invalidateEntityCache('doctor', id);
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
