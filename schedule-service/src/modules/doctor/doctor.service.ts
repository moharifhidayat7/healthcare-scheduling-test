import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../integrations/prisma/prisma.service';
import { CacheService } from '../../common/cache/cache.service';
import { Cacheable } from '../../common/decorators/cacheable.decorator';
import {
  buildPaginatedResult,
  normalizePagination,
} from '../../common/pagination/pagination.util';
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
    await this.cache.delByPattern('doctor:list:*');
    return doctor;
  }

  @Cacheable((page, limit) => `doctor:list:${page}:${limit}`)
  async findAll(page?: number, limit?: number) {
    const { page: p, limit: l } = normalizePagination(page, limit);
    const skip = (p - 1) * l;
    const [data, total] = await Promise.all([
      this.prisma.doctor.findMany({
        skip,
        take: l,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.doctor.count(),
    ]);

    return buildPaginatedResult(data, total, { page: p, limit: l });
  }

  @Cacheable((id) => `doctor:${id}`)
  async findById(id: string) {
    const doctor = await this.prisma.doctor.findUnique({ where: { id } });
    if (!doctor) {
      throw new NotFoundException(`Doctor with id ${id} not found`);
    }
    return doctor;
  }

  async update(input: UpdateDoctorInput) {
    const { id, ...data } = input;
    await this.findById(id);
    const updated = await this.prisma.doctor.update({ where: { id }, data });
    await this.cache.del(`doctor:${id}`);
    await this.cache.delByPattern('doctor:list:*');
    return updated;
  }

  async delete(id: string) {
    await this.findById(id);
    const deleted = await this.prisma.doctor.delete({ where: { id } });
    await this.cache.del(`doctor:${id}`);
    await this.cache.delByPattern('doctor:list:*');
    return deleted;
  }
}
