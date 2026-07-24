import { Test, TestingModule } from '@nestjs/testing';
import { GetScheduleUseCase } from './get-schedule.use-case';
import { ScheduleService } from '../schedule.service';

describe('GetScheduleUseCase', () => {
  let useCase: GetScheduleUseCase;
  let scheduleService: jest.Mocked<ScheduleService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetScheduleUseCase,
        { provide: ScheduleService, useValue: { findById: jest.fn() } },
      ],
    }).compile();

    useCase = module.get(GetScheduleUseCase);
    scheduleService = module.get(
      ScheduleService,
    ) as jest.Mocked<ScheduleService>;
  });

  it('should call scheduleService.findById with the id', async () => {
    const id = '1';
    const expected = {
      id,
      objective: 'Checkup',
      customerId: 'cust-1',
      doctorId: 'doc-1',
      scheduledAt: new Date('2026-07-24T10:00:00Z'),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    scheduleService.findById.mockResolvedValue(expected);

    const result = await useCase.execute(id);

    expect(scheduleService.findById).toHaveBeenCalledTimes(1);
    expect(scheduleService.findById).toHaveBeenCalledWith(id);
    expect(result).toEqual(expected);
  });
});
