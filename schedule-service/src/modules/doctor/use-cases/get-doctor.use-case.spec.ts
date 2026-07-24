import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetDoctorUseCase } from './get-doctor.use-case';
import { DoctorService } from '../doctor.service';
import { PrismaService } from '../../../integrations/prisma/prisma.service';
import { CacheService } from '../../../common/cache/cache.service';

type MockPrisma = {
  doctor: { findUnique: jest.Mock };
};

describe('GetDoctorUseCase', () => {
  let useCase: GetDoctorUseCase;
  let prisma: MockPrisma;

  const mockDoctor = {
    id: '1',
    name: 'Dr. Smith',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrisma: MockPrisma = {
    doctor: { findUnique: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetDoctorUseCase,
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
    }).compile();

    useCase = module.get(GetDoctorUseCase);
    prisma = module.get(PrismaService) as unknown as MockPrisma;
  });

  it('should return the doctor when found', async () => {
    prisma.doctor.findUnique.mockResolvedValue(mockDoctor);

    const result = await useCase.execute('1');

    expect(prisma.doctor.findUnique).toHaveBeenCalledWith({
      where: { id: '1' },
    });
    expect(result).toEqual(mockDoctor);
  });

  it('should throw NotFoundException when not found', async () => {
    prisma.doctor.findUnique.mockResolvedValue(null);

    await expect(useCase.execute('1')).rejects.toThrow(
      new NotFoundException('Doctor with id 1 not found'),
    );
  });
});
