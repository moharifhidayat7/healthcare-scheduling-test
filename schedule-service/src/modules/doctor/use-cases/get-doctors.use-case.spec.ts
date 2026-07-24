import { Test, TestingModule } from '@nestjs/testing';
import { GetDoctorsUseCase } from './get-doctors.use-case';
import { DoctorService } from '../doctor.service';
import { PrismaService } from '../../../integrations/prisma/prisma.service';
import { CacheService } from '../../../common/cache/cache.service';

type MockPrisma = {
  doctor: { findMany: jest.Mock; count: jest.Mock };
};

describe('GetDoctorsUseCase', () => {
  let useCase: GetDoctorsUseCase;
  let prisma: MockPrisma;

  const mockDoctor = {
    id: '1',
    name: 'Dr. Smith',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrisma: MockPrisma = {
    doctor: { findMany: jest.fn(), count: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetDoctorsUseCase,
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

    useCase = module.get(GetDoctorsUseCase);
    prisma = module.get(PrismaService) as unknown as MockPrisma;
  });

  it('should return paginated results', async () => {
    prisma.doctor.findMany.mockResolvedValue([mockDoctor]);
    prisma.doctor.count.mockResolvedValue(1);

    const result = await useCase.execute(1, 20);

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

  it('should use default page=1 and limit=20 when not provided', async () => {
    prisma.doctor.findMany.mockResolvedValue([]);
    prisma.doctor.count.mockResolvedValue(0);

    await useCase.execute();

    expect(prisma.doctor.findMany).toHaveBeenCalledWith({
      skip: 0,
      take: 20,
      orderBy: { createdAt: 'desc' },
    });
  });
});
