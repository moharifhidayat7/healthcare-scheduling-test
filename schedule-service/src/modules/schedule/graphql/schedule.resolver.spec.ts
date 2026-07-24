import { Test, TestingModule } from '@nestjs/testing';
import { ExternalAuthGuard } from '../../../common/auth/external.guard';
import { ScheduleResolver } from './schedule.resolver';
import { CreateScheduleUseCase } from '../use-cases/create-schedule.use-case';
import { GetScheduleUseCase } from '../use-cases/get-schedule.use-case';
import { GetSchedulesUseCase } from '../use-cases/get-schedules.use-case';
import { DeleteScheduleUseCase } from '../use-cases/delete-schedule.use-case';

describe('ScheduleResolver', () => {
  let resolver: ScheduleResolver;
  let createScheduleUseCase: jest.Mocked<CreateScheduleUseCase>;
  let getScheduleUseCase: jest.Mocked<GetScheduleUseCase>;
  let getSchedulesUseCase: jest.Mocked<GetSchedulesUseCase>;
  let deleteScheduleUseCase: jest.Mocked<DeleteScheduleUseCase>;

  const mockSchedule = {
    id: '1',
    objective: 'Checkup',
    customerId: 'cust-1',
    doctorId: 'doc-1',
    scheduledAt: new Date('2026-07-24T10:00:00Z'),
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduleResolver,
        {
          provide: CreateScheduleUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: GetScheduleUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: GetSchedulesUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: DeleteScheduleUseCase,
          useValue: { execute: jest.fn() },
        },
      ],
    })
      .overrideGuard(ExternalAuthGuard)
      .useValue({ canActivate: jest.fn().mockResolvedValue(true) })
      .compile();

    resolver = module.get(ScheduleResolver);
    createScheduleUseCase = module.get(
      CreateScheduleUseCase,
    ) as jest.Mocked<CreateScheduleUseCase>;
    getScheduleUseCase = module.get(
      GetScheduleUseCase,
    ) as jest.Mocked<GetScheduleUseCase>;
    getSchedulesUseCase = module.get(
      GetSchedulesUseCase,
    ) as jest.Mocked<GetSchedulesUseCase>;
    deleteScheduleUseCase = module.get(
      DeleteScheduleUseCase,
    ) as jest.Mocked<DeleteScheduleUseCase>;
  });

  describe('schedules', () => {
    it('should delegate to getSchedulesUseCase.execute with page and limit', async () => {
      const expected = {
        data: [mockSchedule],
        meta: { pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } },
      };
      getSchedulesUseCase.execute.mockResolvedValue(expected);

      const result = await resolver.schedules(1, 20);

      expect(getSchedulesUseCase.execute).toHaveBeenCalledTimes(1);
      expect(getSchedulesUseCase.execute).toHaveBeenCalledWith(1, 20);
      expect(result).toEqual(expected);
    });

    it('should pass undefined page/limit when omitted', async () => {
      getSchedulesUseCase.execute.mockResolvedValue({
        data: [],
        meta: { pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } },
      });

      await resolver.schedules(undefined, undefined);

      expect(getSchedulesUseCase.execute).toHaveBeenCalledWith(
        undefined,
        undefined,
      );
    });
  });

  describe('schedule', () => {
    it('should delegate to getScheduleUseCase.execute with the id', async () => {
      getScheduleUseCase.execute.mockResolvedValue(mockSchedule);

      const result = await resolver.schedule('1');

      expect(getScheduleUseCase.execute).toHaveBeenCalledTimes(1);
      expect(getScheduleUseCase.execute).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockSchedule);
    });
  });

  describe('createSchedule', () => {
    it('should delegate to createScheduleUseCase.execute with the input', async () => {
      const input = {
        objective: 'Checkup',
        customerId: 'cust-1',
        doctorId: 'doc-1',
        scheduledAt: new Date('2026-07-24T10:00:00Z'),
      };
      createScheduleUseCase.execute.mockResolvedValue(mockSchedule);

      const result = await resolver.createSchedule(input);

      expect(createScheduleUseCase.execute).toHaveBeenCalledTimes(1);
      expect(createScheduleUseCase.execute).toHaveBeenCalledWith(input);
      expect(result).toEqual(mockSchedule);
    });
  });

  describe('deleteSchedule', () => {
    it('should delegate to deleteScheduleUseCase.execute with the id', async () => {
      deleteScheduleUseCase.execute.mockResolvedValue(mockSchedule);

      const result = await resolver.deleteSchedule('1');

      expect(deleteScheduleUseCase.execute).toHaveBeenCalledTimes(1);
      expect(deleteScheduleUseCase.execute).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockSchedule);
    });
  });
});
