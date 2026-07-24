import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../integrations/prisma/prisma.service';
import { CreateScheduleInput } from './graphql/inputs/create-schedule.input';

@Injectable()
export class ScheduleService {
  constructor(private readonly prisma: PrismaService) { }

  async create(input: CreateScheduleInput) {
    const [customer, doctor] = await Promise.all([
      this.prisma.customer.findUnique({ where: { id: input.customerId } }),
      this.prisma.doctor.findUnique({ where: { id: input.doctorId } }),
    ]);

    if (!customer) {
      throw new NotFoundException(
        `Customer with id ${input.customerId} not found`,
      );
    }
    if (!doctor) {
      throw new NotFoundException(`Doctor with id ${input.doctorId} not found`);
    }

    await this.validateSchedule(input.doctorId, input.scheduledAt);

    return this.prisma.schedule.create({ data: input });
  }

  async findAll(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.schedule.findMany({
        skip,
        take: limit,
        orderBy: { scheduledAt: 'desc' },
      }),
      this.prisma.schedule.count(),
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
    const schedule = await this.prisma.schedule.findUnique({ where: { id } });
    if (!schedule) {
      throw new NotFoundException(`Schedule with id ${id} not found`);
    }
    return schedule;
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.schedule.delete({ where: { id } });
  }

  private async validateSchedule(doctorId: string, scheduledAt: Date) {
    const windowStart = new Date(scheduledAt.getTime() - 60 * 60 * 1000);
    const windowEnd = new Date(scheduledAt.getTime() + 60 * 60 * 1000);

    const existing = await this.prisma.schedule.findFirst({
      where: {
        doctorId,
        scheduledAt: { gte: windowStart, lte: windowEnd },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Doctor ${doctorId} already has a schedule at ${existing.scheduledAt.toISOString()}`,
      );
    }
  }
}
