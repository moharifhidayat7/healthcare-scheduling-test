import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DeleteCustomerUseCase } from './delete-customer.use-case';
import { CustomerService } from '../customer.service';
import { PrismaService } from '../../../integrations/prisma/prisma.service';
import { CacheService } from '../../../common/cache/cache.service';

type MockPrisma = {
  customer: { findUnique: jest.Mock; delete: jest.Mock };
};

describe('DeleteCustomerUseCase', () => {
  let useCase: DeleteCustomerUseCase;
  let prisma: MockPrisma;

  const mockCustomer = {
    id: '1',
    name: 'Test',
    email: 'test@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrisma: MockPrisma = {
    customer: { findUnique: jest.fn(), delete: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteCustomerUseCase,
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

    useCase = module.get(DeleteCustomerUseCase);
    prisma = module.get(PrismaService) as unknown as MockPrisma;
  });

  it('should delete and return the customer when found', async () => {
    prisma.customer.findUnique.mockResolvedValue(mockCustomer);
    prisma.customer.delete.mockResolvedValue(mockCustomer);

    const result = await useCase.execute('1');

    expect(prisma.customer.findUnique).toHaveBeenCalledWith({
      where: { id: '1' },
    });
    expect(prisma.customer.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    expect(result).toEqual(mockCustomer);
  });

  it('should throw NotFoundException when not found', async () => {
    prisma.customer.findUnique.mockResolvedValue(null);

    await expect(useCase.execute('1')).rejects.toThrow(
      new NotFoundException('Customer with id 1 not found'),
    );
    expect(prisma.customer.delete).not.toHaveBeenCalled();
  });
});
