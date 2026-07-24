import { Test, TestingModule } from '@nestjs/testing';
import { GetSchedulesUseCase } from './get-schedules.use-case';
import { ScheduleService } from '../schedule.service';

describe('GetSchedulesUseCase', () => {
  let useCase: GetSchedulesUseCase;
  let scheduleService: jest.Mocked<ScheduleService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetSchedulesUseCase,
        { provide: ScheduleService, useValue: { findAll: jest.fn() } },
      ],
    }).compile();

    useCase = module.get(GetSchedulesUseCase);
    scheduleService = module.get(
      ScheduleService,
    ) as jest.Mocked<ScheduleService>;
  });

  it('should call scheduleService.findAll with page and limit', async () => {
    const expected = {
      data: [],
      meta: { pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } },
    };
    scheduleService.findAll.mockResolvedValue(expected);

    const result = await useCase.execute(1, 20);

    expect(scheduleService.findAll).toHaveBeenCalledTimes(1);
    expect(scheduleService.findAll).toHaveBeenCalledWith(1, 20);
    expect(result).toEqual(expected);
  });

  it('should use default page=1 and limit=20 when not provided', async () => {
    const expected = {
      data: [],
      meta: { pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } },
    };
    scheduleService.findAll.mockResolvedValue(expected);

    const result = await useCase.execute();

    expect(scheduleService.findAll).toHaveBeenCalledWith(1, 20);
    expect(result).toEqual(expected);
  });
});
