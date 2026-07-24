import { Module } from '@nestjs/common';
import { PrismaModule } from '../../integrations/prisma/prisma.module';
import { AuthModule } from '../../common/auth/auth.module';
import { DoctorResolver } from './graphql/doctor.resolver';
import { DoctorService } from './doctor.service';
import { CreateDoctorUseCase } from './use-cases/create-doctor.use-case';
import { UpdateDoctorUseCase } from './use-cases/update-doctor.use-case';
import { GetDoctorUseCase } from './use-cases/get-doctor.use-case';
import { GetDoctorsUseCase } from './use-cases/get-doctors.use-case';
import { DeleteDoctorUseCase } from './use-cases/delete-doctor.use-case';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [
    DoctorResolver,
    DoctorService,
    CreateDoctorUseCase,
    UpdateDoctorUseCase,
    GetDoctorUseCase,
    GetDoctorsUseCase,
    DeleteDoctorUseCase,
  ],
  controllers: [],
})
export class DoctorModule {}
