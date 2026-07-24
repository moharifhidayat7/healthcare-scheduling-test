import { Type } from '@nestjs/common';
import { ObjectType, Field, Int } from '@nestjs/graphql';
import { PaginationMeta as PaginationMetaInterface } from './pagination.interface';

@ObjectType()
export class PaginationMetaType implements PaginationMetaInterface {
  @Field(() => Int, { description: 'Current page number' })
  page: number;

  @Field(() => Int, { description: 'Maximum items per page' })
  limit: number;

  @Field(() => Int, { description: 'Total number of items matching the query' })
  total: number;

  @Field(() => Int, { description: 'Total number of pages available' })
  totalPages: number;
}

export function PaginatedType<T>(ItemType: Type<T>) {
  @ObjectType({ isAbstract: true })
  abstract class PaginatedEntity {
    @Field(() => [ItemType], {
      description: 'List of items for the current page',
    })
    data: T[];

    @Field(() => PaginationMetaType, { description: 'Pagination metadata' })
    meta: { pagination: PaginationMetaType };
  }

  return PaginatedEntity;
}
