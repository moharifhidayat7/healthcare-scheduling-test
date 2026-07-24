import { Test, TestingModule } from '@nestjs/testing';
import { DeleteCustomerUseCase } from './delete-customer.use-case';
import { CustomerService } from '../customer.service';

describe('DeleteCustomerUseCase', () => {
  let useCase: DeleteCustomerUseCase;
  let customerService: jest.Mocked<CustomerService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteCustomerUseCase,
        { provide: CustomerService, useValue: { delete: jest.fn() } },
      ],
    }).compile();

    useCase = module.get(DeleteCustomerUseCase);
    customerService = module.get(CustomerService) as jest.Mocked<CustomerService>;
  });

  it('should call customerService.delete with the id', async () => {
    const id = '1';
    const expected = { id, name: 'Test', email: 'test@example.com', createdAt: new Date(), updatedAt: new Date() };
    customerService.delete.mockResolvedValue(expected);

    const result = await useCase.execute(id);

    expect(customerService.delete).toHaveBeenCalledTimes(1);
    expect(customerService.delete).toHaveBeenCalledWith(id);
    expect(result).toEqual(expected);
  });
});
