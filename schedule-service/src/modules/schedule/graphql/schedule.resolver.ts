import { Resolver, Query, Mutation, Args, Int, ObjectType } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ExternalAuthGuard } from '../../../common/auth/external.guard';
import { PaginatedType } from '../../../common/pagination/pagination.type';
import { ScheduleType } from './types/schedule.type';
import { CreateScheduleInput } from './inputs/create-schedule.input';
import { CreateScheduleUseCase } from '../use-cases/create-schedule.use-case';
import { GetScheduleUseCase } from '../use-cases/get-schedule.use-case';
import { GetSchedulesUseCase } from '../use-cases/get-schedules.use-case';
import { DeleteScheduleUseCase } from '../use-cases/delete-schedule.use-case';

@ObjectType()
class PaginatedScheduleType extends PaginatedType(ScheduleType) {}

@UseGuards(ExternalAuthGuard)
@Resolver(() => ScheduleType)
export class ScheduleResolver {
  constructor(
    private readonly createScheduleUseCase: CreateScheduleUseCase,
    private readonly getScheduleUseCase: GetScheduleUseCase,
    private readonly getSchedulesUseCase: GetSchedulesUseCase,
    private readonly deleteScheduleUseCase: DeleteScheduleUseCase,
  ) {}

  @Query(() => PaginatedScheduleType, {
    description:
      'Retrieve a paginated list of schedules sorted by scheduled date descending',
  })
  async schedules(
    @Args('page', {
      type: () => Int,
      nullable: true,
      description: 'Page number (starts at 1)',
    })
    page?: number,
    @Args('limit', {
      type: () => Int,
      nullable: true,
      description: 'Items per page (1-100, default 20)',
    })
    limit?: number,
  ) {
    return this.getSchedulesUseCase.execute(page, limit);
  }

  @Query(() => ScheduleType, {
    description: 'Retrieve a single schedule by its unique identifier',
  })
  async schedule(
    @Args('id', { description: 'The unique identifier of the schedule' })
    id: string,
  ) {
    return this.getScheduleUseCase.execute(id);
  }

  @Mutation(() => ScheduleType, {
    description: 'Create a new schedule with objective, customer, doctor, and scheduled time',
  })
  async createSchedule(
    @Args('input', { description: 'Schedule creation payload' })
    input: CreateScheduleInput,
  ) {
    return this.createScheduleUseCase.execute(input);
  }

  @Mutation(() => ScheduleType, {
    description: 'Delete a schedule permanently by its unique identifier',
  })
  async deleteSchedule(
    @Args('id', {
      description: 'The unique identifier of the schedule to delete',
    })
    id: string,
  ) {
    return this.deleteScheduleUseCase.execute(id);
  }
}
