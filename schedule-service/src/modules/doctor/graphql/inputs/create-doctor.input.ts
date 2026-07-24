import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateDoctorInput {
  @Field({ description: 'Full name of the doctor' })
  name: string;
}
