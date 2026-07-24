import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DeleteDoctorUseCase } from './delete-doctor.use-case';
import { DoctorService } from '../doctor.service';
import { PrismaService } from '../../../integrations/prisma/prisma.service';

type MockPrisma = {
  doctor: { findUnique: jest.Mock; delete: jest.Mock };
};

describe('DeleteDoctorUseCase', () => {
  let useCase: DeleteDoctorUseCase;
  let prisma: MockPrisma;

  const mockDoctor = {
    id: '1',
    name: 'Dr. Smith',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrisma: MockPrisma = {
    doctor: { findUnique: jest.fn(), delete: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteDoctorUseCase,
        DoctorService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    useCase = module.get(DeleteDoctorUseCase);
    prisma = module.get(PrismaService) as unknown as MockPrisma;
  });

  it('should delete and return the doctor when found', async () => {
    prisma.doctor.findUnique.mockResolvedValue(mockDoctor);
    prisma.doctor.delete.mockResolvedValue(mockDoctor);

    const result = await useCase.execute('1');

    expect(prisma.doctor.findUnique).toHaveBeenCalledWith({
      where: { id: '1' },
    });
    expect(prisma.doctor.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    expect(result).toEqual(mockDoctor);
  });

  it('should throw NotFoundException when not found', async () => {
    prisma.doctor.findUnique.mockResolvedValue(null);

    await expect(useCase.execute('1')).rejects.toThrow(
      new NotFoundException('Doctor with id 1 not found'),
    );
    expect(prisma.doctor.delete).not.toHaveBeenCalled();
  });
});
