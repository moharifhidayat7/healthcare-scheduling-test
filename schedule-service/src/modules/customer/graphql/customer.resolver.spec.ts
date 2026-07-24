import { Test, TestingModule } from '@nestjs/testing';
import { ExternalAuthGuard } from '../../../common/auth/external.guard';
import { CustomerResolver } from './customer.resolver';
import { CreateCustomerUseCase } from '../use-cases/create-customer.use-case';
import { UpdateCustomerUseCase } from '../use-cases/update-customer.use-case';
import { GetCustomerUseCase } from '../use-cases/get-customer.use-case';
import { GetCustomersUseCase } from '../use-cases/get-customers.use-case';
import { DeleteCustomerUseCase } from '../use-cases/delete-customer.use-case';

describe('CustomerResolver', () => {
  let resolver: CustomerResolver;
  let createCustomerUseCase: jest.Mocked<CreateCustomerUseCase>;
  let updateCustomerUseCase: jest.Mocked<UpdateCustomerUseCase>;
  let getCustomerUseCase: jest.Mocked<GetCustomerUseCase>;
  let getCustomersUseCase: jest.Mocked<GetCustomersUseCase>;
  let deleteCustomerUseCase: jest.Mocked<DeleteCustomerUseCase>;

  const mockCustomer = {
    id: '1',
    name: 'Test',
    email: 'test@example.com',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerResolver,
        {
          provide: CreateCustomerUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: UpdateCustomerUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: GetCustomerUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: GetCustomersUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: DeleteCustomerUseCase,
          useValue: { execute: jest.fn() },
        },
      ],
    })
      .overrideGuard(ExternalAuthGuard)
      .useValue({ canActivate: jest.fn().mockResolvedValue(true) })
      .compile();

    resolver = module.get(CustomerResolver);
    createCustomerUseCase = module.get(CreateCustomerUseCase) as jest.Mocked<CreateCustomerUseCase>;
    updateCustomerUseCase = module.get(UpdateCustomerUseCase) as jest.Mocked<UpdateCustomerUseCase>;
    getCustomerUseCase = module.get(GetCustomerUseCase) as jest.Mocked<GetCustomerUseCase>;
    getCustomersUseCase = module.get(GetCustomersUseCase) as jest.Mocked<GetCustomersUseCase>;
    deleteCustomerUseCase = module.get(DeleteCustomerUseCase) as jest.Mocked<DeleteCustomerUseCase>;
  });

  describe('customers', () => {
    it('should delegate to getCustomersUseCase.execute with page and limit', async () => {
      const expected = {
        data: [mockCustomer],
        meta: { pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } },
      };
      getCustomersUseCase.execute.mockResolvedValue(expected);

      const result = await resolver.customers(1, 20);

      expect(getCustomersUseCase.execute).toHaveBeenCalledTimes(1);
      expect(getCustomersUseCase.execute).toHaveBeenCalledWith(1, 20);
      expect(result).toEqual(expected);
    });

    it('should pass undefined page/limit when omitted', async () => {
      getCustomersUseCase.execute.mockResolvedValue({
        data: [],
        meta: { pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } },
      });

      await resolver.customers(undefined, undefined);

      expect(getCustomersUseCase.execute).toHaveBeenCalledWith(undefined, undefined);
    });
  });

  describe('customer', () => {
    it('should delegate to getCustomerUseCase.execute with the id', async () => {
      getCustomerUseCase.execute.mockResolvedValue(mockCustomer);

      const result = await resolver.customer('1');

      expect(getCustomerUseCase.execute).toHaveBeenCalledTimes(1);
      expect(getCustomerUseCase.execute).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockCustomer);
    });
  });

  describe('createCustomer', () => {
    it('should delegate to createCustomerUseCase.execute with the input', async () => {
      const input = { name: 'Test', email: 'test@example.com' };
      createCustomerUseCase.execute.mockResolvedValue(mockCustomer);

      const result = await resolver.createCustomer(input);

      expect(createCustomerUseCase.execute).toHaveBeenCalledTimes(1);
      expect(createCustomerUseCase.execute).toHaveBeenCalledWith(input);
      expect(result).toEqual(mockCustomer);
    });
  });

  describe('updateCustomer', () => {
    it('should delegate to updateCustomerUseCase.execute with the input', async () => {
      const input = { id: '1', name: 'Updated' };
      updateCustomerUseCase.execute.mockResolvedValue(mockCustomer);

      const result = await resolver.updateCustomer(input);

      expect(updateCustomerUseCase.execute).toHaveBeenCalledTimes(1);
      expect(updateCustomerUseCase.execute).toHaveBeenCalledWith(input);
      expect(result).toEqual(mockCustomer);
    });
  });

  describe('deleteCustomer', () => {
    it('should delegate to deleteCustomerUseCase.execute with the id', async () => {
      deleteCustomerUseCase.execute.mockResolvedValue(mockCustomer);

      const result = await resolver.deleteCustomer('1');

      expect(deleteCustomerUseCase.execute).toHaveBeenCalledTimes(1);
      expect(deleteCustomerUseCase.execute).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockCustomer);
    });
  });
});
