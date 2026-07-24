import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateScheduleInput {
  @Field({ description: 'Consultation objective' })
  objective: string;

  @Field({ description: 'Customer unique identifier' })
  customerId: string;

  @Field({ description: 'Doctor unique identifier' })
  doctorId: string;

  @Field({ description: 'Scheduled date and time' })
  scheduledAt: Date;
}
