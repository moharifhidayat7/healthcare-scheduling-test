import { Injectable } from '@nestjs/common';
import { ScheduleService } from '../schedule.service';

@Injectable()
export class GetSchedulesUseCase {
  constructor(private readonly scheduleService: ScheduleService) {}

  async execute(page: number = 1, limit: number = 20) {
    return this.scheduleService.findAll(page, limit);
  }
}
