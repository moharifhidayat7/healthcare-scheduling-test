import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsUUID, IsDateString } from 'class-validator';

@InputType()
export class CreateScheduleInput {
  @Field({ description: 'Consultation objective' })
  @IsString()
  @IsNotEmpty()
  objective: string;

  @Field({ description: 'Customer unique identifier' })
  @IsUUID()
  customerId: string;

  @Field({ description: 'Doctor unique identifier' })
  @IsUUID()
  doctorId: string;

  @Field({ description: 'Scheduled date and time (ISO 8601)' })
  @IsDateString()
  scheduledAt: string;
}
