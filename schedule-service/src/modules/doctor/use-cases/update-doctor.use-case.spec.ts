import { Test, TestingModule } from '@nestjs/testing';
import { UpdateDoctorUseCase } from './update-doctor.use-case';
import { DoctorService } from '../doctor.service';

describe('UpdateDoctorUseCase', () => {
  let useCase: UpdateDoctorUseCase;
  let doctorService: jest.Mocked<DoctorService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateDoctorUseCase,
        { provide: DoctorService, useValue: { update: jest.fn() } },
      ],
    }).compile();

    useCase = module.get(UpdateDoctorUseCase);
    doctorService = module.get(DoctorService) as jest.Mocked<DoctorService>;
  });

  it('should call doctorService.update with the input', async () => {
    const input = { id: '1', name: 'Dr. Updated' };
    const expected = { id: '1', name: 'Dr. Updated', createdAt: new Date(), updatedAt: new Date() };
    doctorService.update.mockResolvedValue(expected);

    const result = await useCase.execute(input);

    expect(doctorService.update).toHaveBeenCalledTimes(1);
    expect(doctorService.update).toHaveBeenCalledWith(input);
    expect(result).toEqual(expected);
  });
});
