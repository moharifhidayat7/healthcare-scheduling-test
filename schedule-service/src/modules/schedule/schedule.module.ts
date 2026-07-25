import { Module } from '@nestjs/common';
import { PrismaModule } from '../../integrations/prisma/prisma.module';
import { AuthModule } from '../../common/auth/auth.module';
import { CustomerModule } from '../customer/customer.module';
import { DoctorModule } from '../doctor/doctor.module';
import { ScheduleResolver } from './graphql/schedule.resolver';
import { ScheduleService } from './schedule.service';
import { CreateScheduleUseCase } from './use-cases/create-schedule.use-case';
import { GetScheduleUseCase } from './use-cases/get-schedule.use-case';
import { GetSchedulesUseCase } from './use-cases/get-schedules.use-case';
import { DeleteScheduleUseCase } from './use-cases/delete-schedule.use-case';
@Module({
  imports: [PrismaModule, AuthModule, CustomerModule, DoctorModule],
  providers: [
    ScheduleResolver,
    ScheduleService,
    CreateScheduleUseCase,
    GetScheduleUseCase,
    GetSchedulesUseCase,
    DeleteScheduleUseCase,
  ],
  controllers: [],
})
export class ScheduleModule {}
