import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class DoctorType {
  @Field(() => ID, { description: 'Unique identifier' })
  id: string;

  @Field({ description: 'Full name of the doctor' })
  name: string;

  @Field({ description: 'Timestamp when the doctor was created' })
  createdAt: Date;

  @Field({ description: 'Timestamp when the doctor was last updated' })
  updatedAt: Date;
}
