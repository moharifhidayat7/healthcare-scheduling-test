import { Test, TestingModule } from '@nestjs/testing';
import { GetCustomersUseCase } from './get-customers.use-case';
import { CustomerService } from '../customer.service';

describe('GetCustomersUseCase', () => {
  let useCase: GetCustomersUseCase;
  let customerService: jest.Mocked<CustomerService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetCustomersUseCase,
        { provide: CustomerService, useValue: { findAll: jest.fn() } },
      ],
    }).compile();

    useCase = module.get(GetCustomersUseCase);
    customerService = module.get(
      CustomerService,
    ) as jest.Mocked<CustomerService>;
  });

  it('should call customerService.findAll with page and limit', async () => {
    const expected = {
      data: [],
      meta: { pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } },
    };
    customerService.findAll.mockResolvedValue(expected);

    const result = await useCase.execute(1, 20);

    expect(customerService.findAll).toHaveBeenCalledTimes(1);
    expect(customerService.findAll).toHaveBeenCalledWith(1, 20);
    expect(result).toEqual(expected);
  });

  it('should use default page=1 and limit=20 when not provided', async () => {
    const expected = {
      data: [],
      meta: { pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } },
    };
    customerService.findAll.mockResolvedValue(expected);

    const result = await useCase.execute();

    expect(customerService.findAll).toHaveBeenCalledWith(1, 20);
    expect(result).toEqual(expected);
  });
});
