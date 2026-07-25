import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsNotEmpty } from 'class-validator';

@InputType()
export class CreateDoctorInput {
  @Field({ description: 'Full name of the doctor' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
