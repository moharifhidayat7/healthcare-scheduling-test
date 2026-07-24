import { Test, TestingModule } from '@nestjs/testing';
import { CreateScheduleUseCase } from './create-schedule.use-case';
import { ScheduleService } from '../schedule.service';

describe('CreateScheduleUseCase', () => {
  let useCase: CreateScheduleUseCase;
  let scheduleService: jest.Mocked<ScheduleService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateScheduleUseCase,
        { provide: ScheduleService, useValue: { create: jest.fn() } },
      ],
    }).compile();

    useCase = module.get(CreateScheduleUseCase);
    scheduleService = module.get(
      ScheduleService,
    ) as jest.Mocked<ScheduleService>;
  });

  it('should call scheduleService.create with the input', async () => {
    const input = {
      objective: 'Checkup',
      customerId: 'cust-1',
      doctorId: 'doc-1',
      scheduledAt: new Date('2026-07-24T10:00:00Z'),
    };
    const expected = {
      id: '1',
      ...input,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    scheduleService.create.mockResolvedValue(expected);

    const result = await useCase.execute(input);

    expect(scheduleService.create).toHaveBeenCalledTimes(1);
    expect(scheduleService.create).toHaveBeenCalledWith(input);
    expect(result).toEqual(expected);
  });
});
