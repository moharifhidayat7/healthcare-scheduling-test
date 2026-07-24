import { Injectable } from '@nestjs/common';
import { ScheduleService } from '../schedule.service';
import { CreateScheduleInput } from '../graphql/inputs/create-schedule.input';

@Injectable()
export class CreateScheduleUseCase {
  constructor(private readonly scheduleService: ScheduleService) {}

  async execute(input: CreateScheduleInput) {
    return this.scheduleService.create(input);
  }
}
