import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DeleteScheduleUseCase } from './delete-schedule.use-case';
import { ScheduleService } from '../schedule.service';
import { PrismaService } from '../../../integrations/prisma/prisma.service';
import { CacheService } from '../../../common/cache/cache.service';

type MockPrisma = {
  schedule: { findUnique: jest.Mock; delete: jest.Mock };
};

describe('DeleteScheduleUseCase', () => {
  let useCase: DeleteScheduleUseCase;
  let prisma: MockPrisma;

  const mockSchedule = {
    id: '1',
    objective: 'Checkup',
    customerId: 'cust-1',
    doctorId: 'doc-1',
    scheduledAt: new Date('2026-07-24T10:00:00Z'),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrisma: MockPrisma = {
    schedule: { findUnique: jest.fn(), delete: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
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
    }).compile();

    useCase = module.get(DeleteScheduleUseCase);
    prisma = module.get(PrismaService) as unknown as MockPrisma;
  });

  it('should delete and return the schedule when found', async () => {
    prisma.schedule.findUnique.mockResolvedValue(mockSchedule);
    prisma.schedule.delete.mockResolvedValue(mockSchedule);

    const result = await useCase.execute('1');

    expect(prisma.schedule.findUnique).toHaveBeenCalledWith({
      where: { id: '1' },
    });
    expect(prisma.schedule.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    expect(result).toEqual(mockSchedule);
  });

  it('should throw NotFoundException when not found', async () => {
    prisma.schedule.findUnique.mockResolvedValue(null);

    await expect(useCase.execute('1')).rejects.toThrow(
      new NotFoundException('Schedule with id 1 not found'),
    );
    expect(prisma.schedule.delete).not.toHaveBeenCalled();
  });
});
