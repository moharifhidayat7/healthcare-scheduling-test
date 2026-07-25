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

@ObjectType()
export class PaginationMetaWrapper {
  @Field(() => PaginationMetaType, { description: 'Pagination metadata' })
  pagination: PaginationMetaType;
}

export function PaginatedType<T>(ItemType: Type<T>) {
  @ObjectType({ isAbstract: true })
  abstract class PaginatedEntity {
    @Field(() => [ItemType], {
      description: 'List of items for the current page',
    })
    data: T[];

    @Field(() => PaginationMetaWrapper, { description: 'Pagination metadata' })
    meta: PaginationMetaWrapper;
  }

  return PaginatedEntity;
}
