import { Test, TestingModule } from '@nestjs/testing';
import { ExternalAuthGuard } from '../../../common/auth/external.guard';
import { DoctorResolver } from './doctor.resolver';
import { DoctorService } from '../doctor.service';
import { PrismaService } from '../../../integrations/prisma/prisma.service';
import { CreateDoctorUseCase } from '../use-cases/create-doctor.use-case';
import { UpdateDoctorUseCase } from '../use-cases/update-doctor.use-case';
import { GetDoctorUseCase } from '../use-cases/get-doctor.use-case';
import { GetDoctorsUseCase } from '../use-cases/get-doctors.use-case';
import { DeleteDoctorUseCase } from '../use-cases/delete-doctor.use-case';
import { CacheService } from '../../../common/cache/cache.service';

type MockPrisma = {
  doctor: {
    findUnique: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
};

describe('DoctorResolver', () => {
  let resolver: DoctorResolver;
  let prisma: MockPrisma;

  const mockDoctor = {
    id: '1',
    name: 'Dr. Smith',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  const mockPrisma: MockPrisma = {
    doctor: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DoctorResolver,
        CreateDoctorUseCase,
        UpdateDoctorUseCase,
        GetDoctorUseCase,
        GetDoctorsUseCase,
        DeleteDoctorUseCase,
        DoctorService,
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

    resolver = module.get(DoctorResolver);
    prisma = module.get(PrismaService) as unknown as MockPrisma;
  });

  describe('doctors', () => {
    it('should return paginated results', async () => {
      prisma.doctor.findMany.mockResolvedValue([mockDoctor]);
      prisma.doctor.count.mockResolvedValue(1);

      const result = await resolver.doctors(1, 20);

      expect(prisma.doctor.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual({
        data: [mockDoctor],
        meta: { pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } },
      });
    });

    it('should pass undefined page/limit when omitted', async () => {
      prisma.doctor.findMany.mockResolvedValue([]);
      prisma.doctor.count.mockResolvedValue(0);

      await resolver.doctors(undefined, undefined);

      expect(prisma.doctor.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('doctor', () => {
    it('should return the doctor when found', async () => {
      prisma.doctor.findUnique.mockResolvedValue(mockDoctor);

      const result = await resolver.doctor('1');

      expect(prisma.doctor.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(result).toEqual(mockDoctor);
    });
  });

  describe('createDoctor', () => {
    it('should create a doctor', async () => {
      const input = { name: 'Dr. Smith' };
      prisma.doctor.create.mockResolvedValue(mockDoctor);

      const result = await resolver.createDoctor(input);

      expect(prisma.doctor.create).toHaveBeenCalledWith({ data: input });
      expect(result).toEqual(mockDoctor);
    });
  });

  describe('updateDoctor', () => {
    it('should update a doctor when found', async () => {
      const input = { id: '1', name: 'Dr. Updated' };
      prisma.doctor.findUnique.mockResolvedValue(mockDoctor);
      prisma.doctor.update.mockResolvedValue({
        ...mockDoctor,
        name: 'Dr. Updated',
      });

      const result = await resolver.updateDoctor(input);

      expect(prisma.doctor.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(prisma.doctor.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { name: 'Dr. Updated' },
      });
      expect(result).toEqual({ ...mockDoctor, name: 'Dr. Updated' });
    });
  });

  describe('deleteDoctor', () => {
    it('should delete and return the doctor when found', async () => {
      prisma.doctor.findUnique.mockResolvedValue(mockDoctor);
      prisma.doctor.delete.mockResolvedValue(mockDoctor);

      const result = await resolver.deleteDoctor('1');

      expect(prisma.doctor.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(prisma.doctor.delete).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(result).toEqual(mockDoctor);
    });
  });
});
