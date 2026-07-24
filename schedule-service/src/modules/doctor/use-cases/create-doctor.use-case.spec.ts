import { Test, TestingModule } from '@nestjs/testing';
import { CreateDoctorUseCase } from './create-doctor.use-case';
import { DoctorService } from '../doctor.service';
import { PrismaService } from '../../../integrations/prisma/prisma.service';
import { CacheService } from '../../../common/cache/cache.service';

type MockPrisma = {
  doctor: { create: jest.Mock };
};

describe('CreateDoctorUseCase', () => {
  let useCase: CreateDoctorUseCase;
  let prisma: MockPrisma;

  const mockPrisma: MockPrisma = {
    doctor: { create: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateDoctorUseCase,
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

    useCase = module.get(CreateDoctorUseCase);
    prisma = module.get(PrismaService) as unknown as MockPrisma;
  });

  it('should create a doctor', async () => {
    const input = { name: 'Dr. Smith' };
    const expected = {
      id: '1',
      ...input,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    prisma.doctor.create.mockResolvedValue(expected);

    const result = await useCase.execute(input);

    expect(prisma.doctor.create).toHaveBeenCalledWith({ data: input });
    expect(result).toEqual(expected);
  });
});
