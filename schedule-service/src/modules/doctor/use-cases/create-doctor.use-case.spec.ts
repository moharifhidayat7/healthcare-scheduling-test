import { Test, TestingModule } from '@nestjs/testing';
import { CreateDoctorUseCase } from './create-doctor.use-case';
import { DoctorService } from '../doctor.service';

describe('CreateDoctorUseCase', () => {
  let useCase: CreateDoctorUseCase;
  let doctorService: jest.Mocked<DoctorService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateDoctorUseCase,
        { provide: DoctorService, useValue: { create: jest.fn() } },
      ],
    }).compile();

    useCase = module.get(CreateDoctorUseCase);
    doctorService = module.get(DoctorService) as jest.Mocked<DoctorService>;
  });

  it('should call doctorService.create with the input', async () => {
    const input = { name: 'Dr. Smith' };
    const expected = {
      id: '1',
      ...input,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    doctorService.create.mockResolvedValue(expected);

    const result = await useCase.execute(input);

    expect(doctorService.create).toHaveBeenCalledTimes(1);
    expect(doctorService.create).toHaveBeenCalledWith(input);
    expect(result).toEqual(expected);
  });
});
