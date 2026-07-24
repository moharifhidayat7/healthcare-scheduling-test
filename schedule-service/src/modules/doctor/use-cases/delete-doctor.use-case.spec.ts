import { Test, TestingModule } from '@nestjs/testing';
import { DeleteDoctorUseCase } from './delete-doctor.use-case';
import { DoctorService } from '../doctor.service';

describe('DeleteDoctorUseCase', () => {
  let useCase: DeleteDoctorUseCase;
  let doctorService: jest.Mocked<DoctorService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteDoctorUseCase,
        { provide: DoctorService, useValue: { delete: jest.fn() } },
      ],
    }).compile();

    useCase = module.get(DeleteDoctorUseCase);
    doctorService = module.get(DoctorService) as jest.Mocked<DoctorService>;
  });

  it('should call doctorService.delete with the id', async () => {
    const id = '1';
    const expected = { id, name: 'Dr. Smith', createdAt: new Date(), updatedAt: new Date() };
    doctorService.delete.mockResolvedValue(expected);

    const result = await useCase.execute(id);

    expect(doctorService.delete).toHaveBeenCalledTimes(1);
    expect(doctorService.delete).toHaveBeenCalledWith(id);
    expect(result).toEqual(expected);
  });
});
