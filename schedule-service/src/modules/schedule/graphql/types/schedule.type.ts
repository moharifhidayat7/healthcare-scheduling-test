import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class ScheduleType {
  @Field(() => ID, { description: 'Unique identifier' })
  id: string;

  @Field({ description: 'Consultation objective' })
  objective: string;

  @Field({ description: 'Customer unique identifier' })
  customerId: string;

  @Field({ description: 'Doctor unique identifier' })
  doctorId: string;

  @Field({ description: 'Scheduled date and time' })
  scheduledAt: Date;

  @Field({ description: 'Timestamp when the schedule was created' })
  createdAt: Date;

  @Field({ description: 'Timestamp when the schedule was last updated' })
  updatedAt: Date;
}
