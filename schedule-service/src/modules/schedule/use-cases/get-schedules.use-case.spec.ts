import { Test, TestingModule } from '@nestjs/testing';
import { GetSchedulesUseCase } from './get-schedules.use-case';
import { ScheduleService } from '../schedule.service';
import { PrismaService } from '../../../integrations/prisma/prisma.service';
import { CacheService } from '../../../common/cache/cache.service';
import { MailService } from '../../../common/mail/mail.service';

type MockPrisma = {
  schedule: { findMany: jest.Mock; count: jest.Mock };
};

describe('GetSchedulesUseCase', () => {
  let useCase: GetSchedulesUseCase;
  let prisma: MockPrisma;

  const mockSchedule = {
    id: '1',
    objective: 'Checkup',
    customerId: 'cust-1',
    doctorId: 'doc-1',
    scheduledAt: new Date('2026-08-01T10:00:00Z'),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrisma: MockPrisma = {
    schedule: { findMany: jest.fn(), count: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetSchedulesUseCase,
        ScheduleService,
        {
          provide: MailService,
          useValue: { send: jest.fn().mockResolvedValue(undefined) },
        },
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
    }).compile();

    useCase = module.get(GetSchedulesUseCase);
    prisma = module.get(PrismaService) as unknown as MockPrisma;
  });

  it('should return paginated results', async () => {
    prisma.schedule.findMany.mockResolvedValue([mockSchedule]);
    prisma.schedule.count.mockResolvedValue(1);

    const result = await useCase.execute(1, 20);

    expect(prisma.schedule.findMany).toHaveBeenCalledWith({
      skip: 0,
      take: 20,
      orderBy: { scheduledAt: 'desc' },
    });
    expect(prisma.schedule.count).toHaveBeenCalled();
    expect(result).toEqual({
      data: [mockSchedule],
      meta: { pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } },
    });
  });

  it('should use default page=1 and limit=20 when not provided', async () => {
    prisma.schedule.findMany.mockResolvedValue([]);
    prisma.schedule.count.mockResolvedValue(0);

    await useCase.execute();

    expect(prisma.schedule.findMany).toHaveBeenCalledWith({
      skip: 0,
      take: 20,
      orderBy: { scheduledAt: 'desc' },
    });
  });
});
