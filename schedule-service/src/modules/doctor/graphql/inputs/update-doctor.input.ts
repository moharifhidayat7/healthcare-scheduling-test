import { InputType, Field, ID } from '@nestjs/graphql';

@InputType()
export class UpdateDoctorInput {
  @Field(() => ID, { description: 'Unique identifier of the doctor to update' })
  id: string;

  @Field({ nullable: true, description: 'Updated full name' })
  name?: string;
}
