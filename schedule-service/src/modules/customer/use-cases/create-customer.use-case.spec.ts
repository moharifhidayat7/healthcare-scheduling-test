import { Test, TestingModule } from '@nestjs/testing';
import { CreateCustomerUseCase } from './create-customer.use-case';
import { CustomerService } from '../customer.service';

describe('CreateCustomerUseCase', () => {
  let useCase: CreateCustomerUseCase;
  let customerService: jest.Mocked<CustomerService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateCustomerUseCase,
        { provide: CustomerService, useValue: { create: jest.fn() } },
      ],
    }).compile();

    useCase = module.get(CreateCustomerUseCase);
    customerService = module.get(CustomerService) as jest.Mocked<CustomerService>;
  });

  it('should call customerService.create with the input', async () => {
    const input = { name: 'Test', email: 'test@example.com' };
    const expected = { id: '1', ...input, createdAt: new Date(), updatedAt: new Date() };
    customerService.create.mockResolvedValue(expected);

    const result = await useCase.execute(input);

    expect(customerService.create).toHaveBeenCalledTimes(1);
    expect(customerService.create).toHaveBeenCalledWith(input);
    expect(result).toEqual(expected);
  });
});
