import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { PrismaService } from '../../integrations/prisma/prisma.service';

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

describe('ScheduleService', () => {
  let service: ScheduleService;
  let prisma: MockPrisma;

  const mockCustomer = { id: 'cust-1', name: 'Test', email: 'test@test.com', createdAt: new Date(), updatedAt: new Date() };
  const mockDoctor = { id: 'doc-1', name: 'Dr. Smith', createdAt: new Date(), updatedAt: new Date() };
  const baseInput = { objective: 'Checkup', customerId: 'cust-1', doctorId: 'doc-1', scheduledAt: new Date('2026-07-24T10:00:00Z') };
  const mockSchedule = { id: '1', ...baseInput, createdAt: new Date(), updatedAt: new Date() };

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
        ScheduleService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(ScheduleService);
    prisma = module.get(PrismaService) as unknown as MockPrisma;
  });

  describe('create', () => {
    it('should create a schedule when customer, doctor exist and no conflict', async () => {
      prisma.customer.findUnique.mockResolvedValue(mockCustomer);
      prisma.doctor.findUnique.mockResolvedValue(mockDoctor);
      prisma.schedule.findFirst.mockResolvedValue(null);
      prisma.schedule.create.mockResolvedValue(mockSchedule);

      const result = await service.create(baseInput);

      expect(prisma.customer.findUnique).toHaveBeenCalledWith({ where: { id: 'cust-1' } });
      expect(prisma.doctor.findUnique).toHaveBeenCalledWith({ where: { id: 'doc-1' } });
      expect(prisma.schedule.findFirst).toHaveBeenCalled();
      expect(prisma.schedule.create).toHaveBeenCalledWith({ data: baseInput });
      expect(result).toEqual(mockSchedule);
    });

    it('should throw NotFoundException when customer does not exist', async () => {
      prisma.customer.findUnique.mockResolvedValue(null);
      prisma.doctor.findUnique.mockResolvedValue(mockDoctor);

      await expect(service.create(baseInput)).rejects.toThrow(
        new NotFoundException('Customer with id cust-1 not found'),
      );
      expect(prisma.schedule.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when doctor does not exist', async () => {
      prisma.customer.findUnique.mockResolvedValue(mockCustomer);
      prisma.doctor.findUnique.mockResolvedValue(null);

      await expect(service.create(baseInput)).rejects.toThrow(
        new NotFoundException('Doctor with id doc-1 not found'),
      );
      expect(prisma.schedule.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when schedule overlaps within 1-hour window', async () => {
      prisma.customer.findUnique.mockResolvedValue(mockCustomer);
      prisma.doctor.findUnique.mockResolvedValue(mockDoctor);
      prisma.schedule.findFirst.mockResolvedValue(mockSchedule);

      await expect(service.create(baseInput)).rejects.toThrow(ConflictException);
      expect(prisma.schedule.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      prisma.schedule.findMany.mockResolvedValue([mockSchedule]);
      prisma.schedule.count.mockResolvedValue(1);

      const result = await service.findAll(1, 20);

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

    it('should compute correct skip for page 2', async () => {
      prisma.schedule.findMany.mockResolvedValue([]);
      prisma.schedule.count.mockResolvedValue(0);

      await service.findAll(2, 10);

      expect(prisma.schedule.findMany).toHaveBeenCalledWith({
        skip: 10,
        take: 10,
        orderBy: { scheduledAt: 'desc' },
      });
    });
  });

  describe('findById', () => {
    it('should return the schedule when found', async () => {
      prisma.schedule.findUnique.mockResolvedValue(mockSchedule);

      const result = await service.findById('1');

      expect(prisma.schedule.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(result).toEqual(mockSchedule);
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.schedule.findUnique.mockResolvedValue(null);

      await expect(service.findById('1')).rejects.toThrow(
        new NotFoundException('Schedule with id 1 not found'),
      );
    });
  });

  describe('delete', () => {
    it('should delete and return the schedule when found', async () => {
      prisma.schedule.findUnique.mockResolvedValue(mockSchedule);
      prisma.schedule.delete.mockResolvedValue(mockSchedule);

      const result = await service.delete('1');

      expect(prisma.schedule.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(prisma.schedule.delete).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(result).toEqual(mockSchedule);
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.schedule.findUnique.mockResolvedValue(null);

      await expect(service.delete('1')).rejects.toThrow(
        new NotFoundException('Schedule with id 1 not found'),
      );
      expect(prisma.schedule.delete).not.toHaveBeenCalled();
    });
  });
});
