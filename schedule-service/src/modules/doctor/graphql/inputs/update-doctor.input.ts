import { InputType, Field, ID } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

@InputType()
export class UpdateDoctorInput {
  @Field(() => ID, { description: 'Unique identifier of the doctor to update' })
  @IsNotEmpty()
  id: string;

  @Field({ nullable: true, description: 'Updated full name' })
  @IsOptional()
  @IsString()
  name?: string;
}
