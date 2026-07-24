import { Test, TestingModule } from '@nestjs/testing';
import { DeleteScheduleUseCase } from './delete-schedule.use-case';
import { ScheduleService } from '../schedule.service';

describe('DeleteScheduleUseCase', () => {
  let useCase: DeleteScheduleUseCase;
  let scheduleService: jest.Mocked<ScheduleService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteScheduleUseCase,
        { provide: ScheduleService, useValue: { delete: jest.fn() } },
      ],
    }).compile();

    useCase = module.get(DeleteScheduleUseCase);
    scheduleService = module.get(
      ScheduleService,
    ) as jest.Mocked<ScheduleService>;
  });

  it('should call scheduleService.delete with the id', async () => {
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
    scheduleService.delete.mockResolvedValue(expected);

    const result = await useCase.execute(id);

    expect(scheduleService.delete).toHaveBeenCalledTimes(1);
    expect(scheduleService.delete).toHaveBeenCalledWith(id);
    expect(result).toEqual(expected);
  });
});
