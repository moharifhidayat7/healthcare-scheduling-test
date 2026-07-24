import { Test, TestingModule } from '@nestjs/testing';
import { GetDoctorUseCase } from './get-doctor.use-case';
import { DoctorService } from '../doctor.service';

describe('GetDoctorUseCase', () => {
  let useCase: GetDoctorUseCase;
  let doctorService: jest.Mocked<DoctorService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetDoctorUseCase,
        { provide: DoctorService, useValue: { findById: jest.fn() } },
      ],
    }).compile();

    useCase = module.get(GetDoctorUseCase);
    doctorService = module.get(DoctorService) as jest.Mocked<DoctorService>;
  });

  it('should call doctorService.findById with the id', async () => {
    const id = '1';
    const expected = { id, name: 'Dr. Smith', createdAt: new Date(), updatedAt: new Date() };
    doctorService.findById.mockResolvedValue(expected);

    const result = await useCase.execute(id);

    expect(doctorService.findById).toHaveBeenCalledTimes(1);
    expect(doctorService.findById).toHaveBeenCalledWith(id);
    expect(result).toEqual(expected);
  });
});
