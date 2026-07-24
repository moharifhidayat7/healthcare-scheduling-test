import { InputType, Field, ID } from '@nestjs/graphql';

@InputType()
export class UpdateEmptyInput {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  email?: string;
}
