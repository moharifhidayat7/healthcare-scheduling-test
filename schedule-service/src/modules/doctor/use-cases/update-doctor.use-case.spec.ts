import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UpdateDoctorUseCase } from './update-doctor.use-case';
import { DoctorService } from '../doctor.service';
import { PrismaService } from '../../../integrations/prisma/prisma.service';
import { CacheService } from '../../../common/cache/cache.service';

type MockPrisma = {
  doctor: { findUnique: jest.Mock; update: jest.Mock };
};

describe('UpdateDoctorUseCase', () => {
  let useCase: UpdateDoctorUseCase;
  let prisma: MockPrisma;

  const mockDoctor = {
    id: '1',
    name: 'Dr. Smith',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrisma: MockPrisma = {
    doctor: { findUnique: jest.fn(), update: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateDoctorUseCase,
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

    useCase = module.get(UpdateDoctorUseCase);
    prisma = module.get(PrismaService) as unknown as MockPrisma;
  });

  it('should update a doctor when found', async () => {
    const input = { id: '1', name: 'Dr. Updated' };
    const expected = { ...mockDoctor, name: 'Dr. Updated' };
    prisma.doctor.findUnique.mockResolvedValue(mockDoctor);
    prisma.doctor.update.mockResolvedValue(expected);

    const result = await useCase.execute(input);

    expect(prisma.doctor.findUnique).toHaveBeenCalledWith({
      where: { id: '1' },
    });
    expect(prisma.doctor.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: { name: 'Dr. Updated' },
    });
    expect(result).toEqual(expected);
  });

  it('should throw NotFoundException when not found', async () => {
    prisma.doctor.findUnique.mockResolvedValue(null);

    await expect(
      useCase.execute({ id: '1', name: 'Dr. Updated' }),
    ).rejects.toThrow(new NotFoundException('Doctor with id 1 not found'));
    expect(prisma.doctor.update).not.toHaveBeenCalled();
  });
});
