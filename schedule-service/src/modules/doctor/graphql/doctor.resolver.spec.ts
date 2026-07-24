import { Test, TestingModule } from '@nestjs/testing';
import { ExternalAuthGuard } from '../../../common/auth/external.guard';
import { DoctorResolver } from './doctor.resolver';
import { CreateDoctorUseCase } from '../use-cases/create-doctor.use-case';
import { UpdateDoctorUseCase } from '../use-cases/update-doctor.use-case';
import { GetDoctorUseCase } from '../use-cases/get-doctor.use-case';
import { GetDoctorsUseCase } from '../use-cases/get-doctors.use-case';
import { DeleteDoctorUseCase } from '../use-cases/delete-doctor.use-case';

describe('DoctorResolver', () => {
  let resolver: DoctorResolver;
  let createDoctorUseCase: jest.Mocked<CreateDoctorUseCase>;
  let updateDoctorUseCase: jest.Mocked<UpdateDoctorUseCase>;
  let getDoctorUseCase: jest.Mocked<GetDoctorUseCase>;
  let getDoctorsUseCase: jest.Mocked<GetDoctorsUseCase>;
  let deleteDoctorUseCase: jest.Mocked<DeleteDoctorUseCase>;

  const mockDoctor = {
    id: '1',
    name: 'Dr. Smith',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DoctorResolver,
        {
          provide: CreateDoctorUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: UpdateDoctorUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: GetDoctorUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: GetDoctorsUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: DeleteDoctorUseCase,
          useValue: { execute: jest.fn() },
        },
      ],
    })
      .overrideGuard(ExternalAuthGuard)
      .useValue({ canActivate: jest.fn().mockResolvedValue(true) })
      .compile();

    resolver = module.get(DoctorResolver);
    createDoctorUseCase = module.get(CreateDoctorUseCase) as jest.Mocked<CreateDoctorUseCase>;
    updateDoctorUseCase = module.get(UpdateDoctorUseCase) as jest.Mocked<UpdateDoctorUseCase>;
    getDoctorUseCase = module.get(GetDoctorUseCase) as jest.Mocked<GetDoctorUseCase>;
    getDoctorsUseCase = module.get(GetDoctorsUseCase) as jest.Mocked<GetDoctorsUseCase>;
    deleteDoctorUseCase = module.get(DeleteDoctorUseCase) as jest.Mocked<DeleteDoctorUseCase>;
  });

  describe('doctors', () => {
    it('should delegate to getDoctorsUseCase.execute with page and limit', async () => {
      const expected = {
        data: [mockDoctor],
        meta: { pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } },
      };
      getDoctorsUseCase.execute.mockResolvedValue(expected);

      const result = await resolver.doctors(1, 20);

      expect(getDoctorsUseCase.execute).toHaveBeenCalledTimes(1);
      expect(getDoctorsUseCase.execute).toHaveBeenCalledWith(1, 20);
      expect(result).toEqual(expected);
    });

    it('should pass undefined page/limit when omitted', async () => {
      getDoctorsUseCase.execute.mockResolvedValue({
        data: [],
        meta: { pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } },
      });

      await resolver.doctors(undefined, undefined);

      expect(getDoctorsUseCase.execute).toHaveBeenCalledWith(undefined, undefined);
    });
  });

  describe('doctor', () => {
    it('should delegate to getDoctorUseCase.execute with the id', async () => {
      getDoctorUseCase.execute.mockResolvedValue(mockDoctor);

      const result = await resolver.doctor('1');

      expect(getDoctorUseCase.execute).toHaveBeenCalledTimes(1);
      expect(getDoctorUseCase.execute).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockDoctor);
    });
  });

  describe('createDoctor', () => {
    it('should delegate to createDoctorUseCase.execute with the input', async () => {
      const input = { name: 'Dr. Smith' };
      createDoctorUseCase.execute.mockResolvedValue(mockDoctor);

      const result = await resolver.createDoctor(input);

      expect(createDoctorUseCase.execute).toHaveBeenCalledTimes(1);
      expect(createDoctorUseCase.execute).toHaveBeenCalledWith(input);
      expect(result).toEqual(mockDoctor);
    });
  });

  describe('updateDoctor', () => {
    it('should delegate to updateDoctorUseCase.execute with the input', async () => {
      const input = { id: '1', name: 'Dr. Updated' };
      updateDoctorUseCase.execute.mockResolvedValue(mockDoctor);

      const result = await resolver.updateDoctor(input);

      expect(updateDoctorUseCase.execute).toHaveBeenCalledTimes(1);
      expect(updateDoctorUseCase.execute).toHaveBeenCalledWith(input);
      expect(result).toEqual(mockDoctor);
    });
  });

  describe('deleteDoctor', () => {
    it('should delegate to deleteDoctorUseCase.execute with the id', async () => {
      deleteDoctorUseCase.execute.mockResolvedValue(mockDoctor);

      const result = await resolver.deleteDoctor('1');

      expect(deleteDoctorUseCase.execute).toHaveBeenCalledTimes(1);
      expect(deleteDoctorUseCase.execute).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockDoctor);
    });
  });
});
