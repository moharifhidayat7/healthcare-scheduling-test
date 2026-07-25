import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../integrations/prisma/prisma.service';
import { CacheService } from '../../common/cache/cache.service';
import { Cacheable } from '../../common/decorators/cacheable.decorator';
import {
  buildPaginatedResult,
  normalizePagination,
} from '../../common/pagination/pagination.util';
import { MailService } from '../../common/mail/mail.service';
import { CreateScheduleInput } from './graphql/inputs/create-schedule.input';

@Injectable()
export class ScheduleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly mailService: MailService,
  ) {}

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

    const schedule = await this.prisma.schedule.create({ data: input });
    await this.cache.delByPattern('schedule:list:*');

    await this.mailService.send({
      to: customer.email,
      subject: 'Schedule Confirmed',
      template: 'schedule-created',
      context: {
        customerName: customer.name,
        doctorName: doctor.name,
        scheduledAt: schedule.scheduledAt.toISOString(),
        objective: schedule.objective,
      },
    });

    return schedule;
  }

  @Cacheable((page, limit) => `schedule:list:${page}:${limit}`)
  async findAll(page?: number, limit?: number) {
    const { page: p, limit: l } = normalizePagination(page, limit);
    const skip = (p - 1) * l;
    const [data, total] = await Promise.all([
      this.prisma.schedule.findMany({
        skip,
        take: l,
        orderBy: { scheduledAt: 'desc' },
      }),
      this.prisma.schedule.count(),
    ]);

    return buildPaginatedResult(data, total, { page: p, limit: l });
  }

  @Cacheable((id) => `schedule:${id}`)
  async findById(id: string) {
    const schedule = await this.prisma.schedule.findUnique({ where: { id } });
    if (!schedule) {
      throw new NotFoundException(`Schedule with id ${id} not found`);
    }
    return schedule;
  }

  async delete(id: string) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id },
      include: { customer: true, doctor: true },
    });
    if (!schedule) {
      throw new NotFoundException(`Schedule with id ${id} not found`);
    }

    await this.prisma.schedule.delete({ where: { id } });
    await this.cache.del(`schedule:${id}`);
    await this.cache.delByPattern('schedule:list:*');

    await this.mailService.send({
      to: schedule.customer.email,
      subject: 'Schedule Cancelled',
      template: 'schedule-deleted',
      context: {
        customerName: schedule.customer.name,
        doctorName: schedule.doctor.name,
        scheduledAt: schedule.scheduledAt.toISOString(),
        objective: schedule.objective,
      },
    });

    return schedule;
  }

  private async validateSchedule(doctorId: string, scheduledAt: string | Date) {
    const date =
      typeof scheduledAt === 'string' ? new Date(scheduledAt) : scheduledAt;

    if (date <= new Date()) {
      throw new ConflictException(
        `Scheduled time must be in the future, got ${date.toISOString()}`,
      );
    }

    const windowStart = new Date(date.getTime() - 15 * 60 * 1000);
    const windowEnd = new Date(date.getTime() + 15 * 60 * 1000);

    const existing = await this.prisma.schedule.findFirst({
      where: {
        doctorId,
        scheduledAt: { gte: windowStart, lte: windowEnd },
      },
      include: {
        doctor: {
          select: {
            name: true,
          },
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Doctor ${existing.doctor.name} already has a schedule at ${existing.scheduledAt.toISOString()}`,
      );
    }
  }
}
