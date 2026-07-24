import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CreateScheduleUseCase } from './create-schedule.use-case';
import { ScheduleService } from '../schedule.service';
import { PrismaService } from '../../../integrations/prisma/prisma.service';
import { MailService } from '../../../common/mail/mail.service';
import { CacheService } from '../../../common/cache/cache.service';

type MockPrisma = {
  customer: { findUnique: jest.Mock };
  doctor: { findUnique: jest.Mock };
  schedule: {
    findFirst: jest.Mock;
    create: jest.Mock;
  };
};

describe('CreateScheduleUseCase', () => {
  let useCase: CreateScheduleUseCase;
  let prisma: MockPrisma;

  const mockCustomer = {
    id: 'cust-1',
    name: 'Test',
    email: 'test@test.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const mockDoctor = {
    id: 'doc-1',
    name: 'Dr. Smith',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const baseInput = {
    objective: 'Checkup',
    customerId: 'cust-1',
    doctorId: 'doc-1',
    scheduledAt: new Date('2026-07-24T10:00:00Z'),
  };

  const mockPrisma: MockPrisma = {
    customer: { findUnique: jest.fn() },
    doctor: { findUnique: jest.fn() },
    schedule: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateScheduleUseCase,
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

    useCase = module.get(CreateScheduleUseCase);
    prisma = module.get(PrismaService) as unknown as MockPrisma;
  });

  it('should create a schedule when valid', async () => {
    const expected = {
      id: '1',
      ...baseInput,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    prisma.customer.findUnique.mockResolvedValue(mockCustomer);
    prisma.doctor.findUnique.mockResolvedValue(mockDoctor);
    prisma.schedule.findFirst.mockResolvedValue(null);
    prisma.schedule.create.mockResolvedValue(expected);

    const result = await useCase.execute(baseInput);

    expect(prisma.customer.findUnique).toHaveBeenCalledWith({
      where: { id: 'cust-1' },
    });
    expect(prisma.doctor.findUnique).toHaveBeenCalledWith({
      where: { id: 'doc-1' },
    });
    expect(prisma.schedule.findFirst).toHaveBeenCalled();
    expect(prisma.schedule.create).toHaveBeenCalledWith({ data: baseInput });
    expect(result).toEqual(expected);
  });

  it('should throw NotFoundException when customer does not exist', async () => {
    prisma.customer.findUnique.mockResolvedValue(null);
    prisma.doctor.findUnique.mockResolvedValue(mockDoctor);

    await expect(useCase.execute(baseInput)).rejects.toThrow(
      new NotFoundException('Customer with id cust-1 not found'),
    );
    expect(prisma.schedule.create).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException when doctor does not exist', async () => {
    prisma.customer.findUnique.mockResolvedValue(mockCustomer);
    prisma.doctor.findUnique.mockResolvedValue(null);

    await expect(useCase.execute(baseInput)).rejects.toThrow(
      new NotFoundException('Doctor with id doc-1 not found'),
    );
    expect(prisma.schedule.create).not.toHaveBeenCalled();
  });

  it('should throw ConflictException when schedule overlaps within 1-hour window', async () => {
    prisma.customer.findUnique.mockResolvedValue(mockCustomer);
    prisma.doctor.findUnique.mockResolvedValue(mockDoctor);
    prisma.schedule.findFirst.mockResolvedValue({
      id: 'existing',
      ...baseInput,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(useCase.execute(baseInput)).rejects.toThrow(ConflictException);
    expect(prisma.schedule.create).not.toHaveBeenCalled();
  });
});
