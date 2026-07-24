import { Test, TestingModule } from '@nestjs/testing';
import { ExternalAuthGuard } from '../../../common/auth/external.guard';
import { CustomerResolver } from './customer.resolver';
import { CustomerService } from '../customer.service';
import { PrismaService } from '../../../integrations/prisma/prisma.service';
import { CreateCustomerUseCase } from '../use-cases/create-customer.use-case';
import { UpdateCustomerUseCase } from '../use-cases/update-customer.use-case';
import { GetCustomerUseCase } from '../use-cases/get-customer.use-case';
import { GetCustomersUseCase } from '../use-cases/get-customers.use-case';
import { DeleteCustomerUseCase } from '../use-cases/delete-customer.use-case';

type MockPrisma = {
  customer: {
    findUnique: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
};

describe('CustomerResolver', () => {
  let resolver: CustomerResolver;
  let prisma: MockPrisma;

  const mockCustomer = {
    id: '1',
    name: 'Test',
    email: 'test@example.com',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  const mockPrisma: MockPrisma = {
    customer: {
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
        CustomerResolver,
        CreateCustomerUseCase,
        UpdateCustomerUseCase,
        GetCustomerUseCase,
        GetCustomersUseCase,
        DeleteCustomerUseCase,
        CustomerService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    })
      .overrideGuard(ExternalAuthGuard)
      .useValue({ canActivate: jest.fn().mockResolvedValue(true) })
      .compile();

    resolver = module.get(CustomerResolver);
    prisma = module.get(PrismaService) as unknown as MockPrisma;
  });

  describe('customers', () => {
    it('should return paginated results', async () => {
      prisma.customer.findMany.mockResolvedValue([mockCustomer]);
      prisma.customer.count.mockResolvedValue(1);

      const result = await resolver.customers(1, 20);

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

    it('should pass undefined page/limit when omitted', async () => {
      prisma.customer.findMany.mockResolvedValue([]);
      prisma.customer.count.mockResolvedValue(0);

      await resolver.customers(undefined, undefined);

      expect(prisma.customer.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('customer', () => {
    it('should return the customer when found', async () => {
      prisma.customer.findUnique.mockResolvedValue(mockCustomer);

      const result = await resolver.customer('1');

      expect(prisma.customer.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(result).toEqual(mockCustomer);
    });
  });

  describe('createCustomer', () => {
    it('should create a customer', async () => {
      const input = { name: 'Test', email: 'test@example.com' };
      prisma.customer.create.mockResolvedValue(mockCustomer);

      const result = await resolver.createCustomer(input);

      expect(prisma.customer.create).toHaveBeenCalledWith({ data: input });
      expect(result).toEqual(mockCustomer);
    });
  });

  describe('updateCustomer', () => {
    it('should update a customer when found', async () => {
      const input = { id: '1', name: 'Updated' };
      prisma.customer.findUnique.mockResolvedValue(mockCustomer);
      prisma.customer.update.mockResolvedValue({
        ...mockCustomer,
        name: 'Updated',
      });

      const result = await resolver.updateCustomer(input);

      expect(prisma.customer.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(prisma.customer.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { name: 'Updated' },
      });
      expect(result).toEqual({ ...mockCustomer, name: 'Updated' });
    });
  });

  describe('deleteCustomer', () => {
    it('should delete and return the customer when found', async () => {
      prisma.customer.findUnique.mockResolvedValue(mockCustomer);
      prisma.customer.delete.mockResolvedValue(mockCustomer);

      const result = await resolver.deleteCustomer('1');

      expect(prisma.customer.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(prisma.customer.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(result).toEqual(mockCustomer);
    });
  });
});
