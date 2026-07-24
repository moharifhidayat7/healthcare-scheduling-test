import { Test, TestingModule } from '@nestjs/testing';
import { ExternalAuthGuard } from '../../../common/auth/external.guard';
import { ScheduleResolver } from './schedule.resolver';
import { ScheduleService } from '../schedule.service';
import { PrismaService } from '../../../integrations/prisma/prisma.service';
import { CreateScheduleUseCase } from '../use-cases/create-schedule.use-case';
import { GetScheduleUseCase } from '../use-cases/get-schedule.use-case';
import { GetSchedulesUseCase } from '../use-cases/get-schedules.use-case';
import { DeleteScheduleUseCase } from '../use-cases/delete-schedule.use-case';
import { CacheService } from '../../../common/cache/cache.service';

type MockPrisma = {
  customer: { findUnique: jest.Mock };
  doctor: { findUnique: jest.Mock };
  schedule: {
    findFirst: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    count: jest.Mock;
    create: jest.Mock;
    delete: jest.Mock;
  };
};

describe('ScheduleResolver', () => {
  let resolver: ScheduleResolver;
  let prisma: MockPrisma;

  const mockSchedule = {
    id: '1',
    objective: 'Checkup',
    customerId: 'cust-1',
    doctorId: 'doc-1',
    scheduledAt: new Date('2026-07-24T10:00:00Z'),
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  const mockPrisma: MockPrisma = {
    customer: { findUnique: jest.fn() },
    doctor: { findUnique: jest.fn() },
    schedule: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduleResolver,
        CreateScheduleUseCase,
        GetScheduleUseCase,
        GetSchedulesUseCase,
        DeleteScheduleUseCase,
        ScheduleService,
        {
          provide: CacheService,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn(),
            del: jest.fn(),
            delByPattern: jest.fn(),
          },
        },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    })
      .overrideGuard(ExternalAuthGuard)
      .useValue({ canActivate: jest.fn().mockResolvedValue(true) })
      .compile();

    resolver = module.get(ScheduleResolver);
    prisma = module.get(PrismaService) as unknown as MockPrisma;
  });

  describe('schedules', () => {
    it('should return paginated results', async () => {
      prisma.schedule.findMany.mockResolvedValue([mockSchedule]);
      prisma.schedule.count.mockResolvedValue(1);

      const result = await resolver.schedules(1, 20);

      expect(prisma.schedule.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 20,
        orderBy: { scheduledAt: 'desc' },
      });
      expect(result).toEqual({
        data: [mockSchedule],
        meta: { pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } },
      });
    });

    it('should pass undefined page/limit when omitted', async () => {
      prisma.schedule.findMany.mockResolvedValue([]);
      prisma.schedule.count.mockResolvedValue(0);

      await resolver.schedules(undefined, undefined);

      expect(prisma.schedule.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 20,
        orderBy: { scheduledAt: 'desc' },
      });
    });
  });

  describe('schedule', () => {
    it('should return the schedule when found', async () => {
      prisma.schedule.findUnique.mockResolvedValue(mockSchedule);

      const result = await resolver.schedule('1');

      expect(prisma.schedule.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(result).toEqual(mockSchedule);
    });
  });

  describe('createSchedule', () => {
    it('should create a schedule when valid', async () => {
      const input = {
        objective: 'Checkup',
        customerId: 'cust-1',
        doctorId: 'doc-1',
        scheduledAt: new Date('2026-07-24T10:00:00Z'),
      };
      const mockCustomer = {
        id: 'cust-1',
        name: 'Test',
        email: 't@t.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockDoctor = {
        id: 'doc-1',
        name: 'Dr',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.customer.findUnique.mockResolvedValue(mockCustomer);
      prisma.doctor.findUnique.mockResolvedValue(mockDoctor);
      prisma.schedule.findFirst.mockResolvedValue(null);
      prisma.schedule.create.mockResolvedValue(mockSchedule);

      const result = await resolver.createSchedule(input);

      expect(prisma.customer.findUnique).toHaveBeenCalledWith({
        where: { id: 'cust-1' },
      });
      expect(prisma.doctor.findUnique).toHaveBeenCalledWith({
        where: { id: 'doc-1' },
      });
      expect(prisma.schedule.findFirst).toHaveBeenCalled();
      expect(prisma.schedule.create).toHaveBeenCalledWith({ data: input });
      expect(result).toEqual(mockSchedule);
    });
  });

  describe('deleteSchedule', () => {
    it('should delete and return the schedule when found', async () => {
      prisma.schedule.findUnique.mockResolvedValue(mockSchedule);
      prisma.schedule.delete.mockResolvedValue(mockSchedule);

      const result = await resolver.deleteSchedule('1');

      expect(prisma.schedule.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(prisma.schedule.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(result).toEqual(mockSchedule);
    });
  });
});
