import { Test, TestingModule } from '@nestjs/testing';
import { GetCustomersUseCase } from './get-customers.use-case';
import { CustomerService } from '../customer.service';
import { PrismaService } from '../../../integrations/prisma/prisma.service';
import { CacheService } from '../../../common/cache/cache.service';

type MockPrisma = {
  customer: { findMany: jest.Mock; count: jest.Mock };
};

describe('GetCustomersUseCase', () => {
  let useCase: GetCustomersUseCase;
  let prisma: MockPrisma;

  const mockCustomer = {
    id: '1',
    name: 'Test',
    email: 'test@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrisma: MockPrisma = {
    customer: { findMany: jest.fn(), count: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetCustomersUseCase,
        CustomerService,
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            delByPattern: jest.fn(),
          },
        },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    useCase = module.get(GetCustomersUseCase);
    prisma = module.get(PrismaService) as unknown as MockPrisma;
  });

  it('should return paginated results', async () => {
    prisma.customer.findMany.mockResolvedValue([mockCustomer]);
    prisma.customer.count.mockResolvedValue(1);

    const result = await useCase.execute(1, 20);

    expect(prisma.customer.findMany).toHaveBeenCalledWith({
      skip: 0,
      take: 20,
      orderBy: { createdAt: 'desc' },
    });
    expect(result).toEqual({
      data: [mockCustomer],
      meta: { pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } },
    });
  });

  it('should use default page=1 and limit=20 when not provided', async () => {
    prisma.customer.findMany.mockResolvedValue([]);
    prisma.customer.count.mockResolvedValue(0);

    await useCase.execute();

    expect(prisma.customer.findMany).toHaveBeenCalledWith({
      skip: 0,
      take: 20,
      orderBy: { createdAt: 'desc' },
    });
  });
});
