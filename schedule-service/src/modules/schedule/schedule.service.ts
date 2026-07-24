import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../integrations/prisma/prisma.service';
import { CacheService } from '../../common/cache/cache.service';
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
    await this.invalidateListCache('schedule');

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

  async findAll(page: number, limit: number) {
    const cacheKey = `schedule:list:${page}:${limit}`;
    const cached = await this.safeCacheGet<{
      data: unknown[];
      meta: { pagination: Record<string, unknown> };
    }>(cacheKey);
    if (cached) return cached;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.schedule.findMany({
        skip,
        take: limit,
        orderBy: { scheduledAt: 'desc' },
      }),
      this.prisma.schedule.count(),
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
    const cacheKey = `schedule:${id}`;
    const cached = await this.safeCacheGet<unknown>(cacheKey);
    if (cached) return cached;

    const schedule = await this.prisma.schedule.findUnique({ where: { id } });
    if (!schedule) {
      throw new NotFoundException(`Schedule with id ${id} not found`);
    }

    await this.cache.set(cacheKey, schedule, 300);
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
    await this.invalidateEntityCache('schedule', id);

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
