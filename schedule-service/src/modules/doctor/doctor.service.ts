import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../integrations/prisma/prisma.service';
import { CreateDoctorInput } from './graphql/inputs/create-doctor.input';
import { UpdateDoctorInput } from './graphql/inputs/update-doctor.input';

@Injectable()
export class DoctorService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateDoctorInput) {
    return this.prisma.doctor.create({ data: input });
  }

  async findAll(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.doctor.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.doctor.count(),
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
    const doctor = await this.prisma.doctor.findUnique({ where: { id } });
    if (!doctor) {
      throw new NotFoundException(`Doctor with id ${id} not found`);
    }
    return doctor;
  }

  async update(input: UpdateDoctorInput) {
    const { id, ...data } = input;
    await this.findById(id);
    return this.prisma.doctor.update({ where: { id }, data });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.doctor.delete({ where: { id } });
  }
}
