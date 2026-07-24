import { Test, TestingModule } from '@nestjs/testing';
import { UpdateCustomerUseCase } from './update-customer.use-case';
import { CustomerService } from '../customer.service';

describe('UpdateCustomerUseCase', () => {
  let useCase: UpdateCustomerUseCase;
  let customerService: jest.Mocked<CustomerService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateCustomerUseCase,
        { provide: CustomerService, useValue: { update: jest.fn() } },
      ],
    }).compile();

    useCase = module.get(UpdateCustomerUseCase);
    customerService = module.get(CustomerService) as jest.Mocked<CustomerService>;
  });

  it('should call customerService.update with the input', async () => {
    const input = { id: '1', name: 'Updated' };
    const expected = { id: '1', name: 'Updated', email: 'test@example.com', createdAt: new Date(), updatedAt: new Date() };
    customerService.update.mockResolvedValue(expected);

    const result = await useCase.execute(input);

    expect(customerService.update).toHaveBeenCalledTimes(1);
    expect(customerService.update).toHaveBeenCalledWith(input);
    expect(result).toEqual(expected);
  });
});
