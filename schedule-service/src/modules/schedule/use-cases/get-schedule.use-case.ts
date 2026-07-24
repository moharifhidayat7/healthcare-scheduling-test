import { Injectable } from '@nestjs/common';
import { ScheduleService } from '../schedule.service';

@Injectable()
export class GetScheduleUseCase {
  constructor(private readonly scheduleService: ScheduleService) {}

  async execute(id: string) {
    return this.scheduleService.findById(id);
  }
}
