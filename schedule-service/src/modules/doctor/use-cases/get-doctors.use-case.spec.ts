import { Test, TestingModule } from '@nestjs/testing';
import { GetDoctorsUseCase } from './get-doctors.use-case';
import { DoctorService } from '../doctor.service';

describe('GetDoctorsUseCase', () => {
  let useCase: GetDoctorsUseCase;
  let doctorService: jest.Mocked<DoctorService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetDoctorsUseCase,
        { provide: DoctorService, useValue: { findAll: jest.fn() } },
      ],
    }).compile();

    useCase = module.get(GetDoctorsUseCase);
    doctorService = module.get(DoctorService) as jest.Mocked<DoctorService>;
  });

  it('should call doctorService.findAll with page and limit', async () => {
    const expected = {
      data: [],
      meta: { pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } },
    };
    doctorService.findAll.mockResolvedValue(expected);

    const result = await useCase.execute(1, 20);

    expect(doctorService.findAll).toHaveBeenCalledTimes(1);
    expect(doctorService.findAll).toHaveBeenCalledWith(1, 20);
    expect(result).toEqual(expected);
  });

  it('should use default page=1 and limit=20 when not provided', async () => {
    const expected = {
      data: [],
      meta: { pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } },
    };
    doctorService.findAll.mockResolvedValue(expected);

    const result = await useCase.execute();

    expect(doctorService.findAll).toHaveBeenCalledWith(1, 20);
    expect(result).toEqual(expected);
  });
});
