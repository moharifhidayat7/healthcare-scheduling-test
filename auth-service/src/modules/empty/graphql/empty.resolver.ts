import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { EmptyType } from './types/empty.type';
import { CreateEmptyInput } from './inputs/create-empty.input';
import { UpdateEmptyInput } from './inputs/update-empty.input';

@Resolver(() => EmptyType)
export class EmptyResolver {
  @Query(() => String)
  hello() {
    return 'Hello World!';
  }

  @Query(() => [EmptyType])
  empties() {
    return [];
  }

  @Query(() => EmptyType)
  empty(@Args('id') id: string) {}

  @Mutation(() => EmptyType)
  createEmpty(@Args('input') input: CreateEmptyInput) {}

  @Mutation(() => EmptyType)
  updateEmpty(@Args('input') input: UpdateEmptyInput) {}

  @Mutation(() => EmptyType)
  deleteEmpty(@Args('id') id: string) {}
}
