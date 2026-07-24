import { Test, TestingModule } from '@nestjs/testing';
import { GetCustomerUseCase } from './get-customer.use-case';
import { CustomerService } from '../customer.service';

describe('GetCustomerUseCase', () => {
  let useCase: GetCustomerUseCase;
  let customerService: jest.Mocked<CustomerService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetCustomerUseCase,
        { provide: CustomerService, useValue: { findById: jest.fn() } },
      ],
    }).compile();

    useCase = module.get(GetCustomerUseCase);
    customerService = module.get(
      CustomerService,
    ) as jest.Mocked<CustomerService>;
  });

  it('should call customerService.findById with the id', async () => {
    const id = '1';
    const expected = {
      id,
      name: 'Test',
      email: 'test@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    customerService.findById.mockResolvedValue(expected);

    const result = await useCase.execute(id);

    expect(customerService.findById).toHaveBeenCalledTimes(1);
    expect(customerService.findById).toHaveBeenCalledWith(id);
    expect(result).toEqual(expected);
  });
});
