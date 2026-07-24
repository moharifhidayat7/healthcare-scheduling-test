import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateEmptyInput {
  @Field()
  name: string;

  @Field()
  email: string;
}
