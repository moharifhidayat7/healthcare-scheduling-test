import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UpdateCustomerUseCase } from './update-customer.use-case';
import { CustomerService } from '../customer.service';
import { PrismaService } from '../../../integrations/prisma/prisma.service';

type MockPrisma = {
  customer: { findUnique: jest.Mock; update: jest.Mock };
};

describe('UpdateCustomerUseCase', () => {
  let useCase: UpdateCustomerUseCase;
  let prisma: MockPrisma;

  const mockCustomer = {
    id: '1',
    name: 'Test',
    email: 'test@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrisma: MockPrisma = {
    customer: { findUnique: jest.fn(), update: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateCustomerUseCase,
        CustomerService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    useCase = module.get(UpdateCustomerUseCase);
    prisma = module.get(PrismaService) as unknown as MockPrisma;
  });

  it('should update a customer when found', async () => {
    const input = { id: '1', name: 'Updated' };
    const expected = { ...mockCustomer, name: 'Updated' };
    prisma.customer.findUnique.mockResolvedValue(mockCustomer);
    prisma.customer.update.mockResolvedValue(expected);

    const result = await useCase.execute(input);

    expect(prisma.customer.findUnique).toHaveBeenCalledWith({
      where: { id: '1' },
    });
    expect(prisma.customer.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: { name: 'Updated' },
    });
    expect(result).toEqual(expected);
  });

  it('should throw NotFoundException when not found', async () => {
    prisma.customer.findUnique.mockResolvedValue(null);

    await expect(useCase.execute({ id: '1', name: 'Updated' })).rejects.toThrow(
      new NotFoundException('Customer with id 1 not found'),
    );
    expect(prisma.customer.update).not.toHaveBeenCalled();
  });
});
