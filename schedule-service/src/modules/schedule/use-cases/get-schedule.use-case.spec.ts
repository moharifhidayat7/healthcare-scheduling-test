import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetScheduleUseCase } from './get-schedule.use-case';
import { ScheduleService } from '../schedule.service';
import { PrismaService } from '../../../integrations/prisma/prisma.service';
import { CacheService } from '../../../common/cache/cache.service';
import { MailService } from '../../../common/mail/mail.service';

type MockPrisma = {
  schedule: { findUnique: jest.Mock };
};

describe('GetScheduleUseCase', () => {
  let useCase: GetScheduleUseCase;
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
    schedule: { findUnique: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetScheduleUseCase,
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

    useCase = module.get(GetScheduleUseCase);
    prisma = module.get(PrismaService) as unknown as MockPrisma;
  });

  it('should return the schedule when found', async () => {
    prisma.schedule.findUnique.mockResolvedValue(mockSchedule);

    const result = await useCase.execute('1');

    expect(prisma.schedule.findUnique).toHaveBeenCalledWith({
      where: { id: '1' },
    });
    expect(result).toEqual(mockSchedule);
  });

  it('should throw NotFoundException when not found', async () => {
    prisma.schedule.findUnique.mockResolvedValue(null);

    await expect(useCase.execute('1')).rejects.toThrow(
      new NotFoundException('Schedule with id 1 not found'),
    );
  });
});
