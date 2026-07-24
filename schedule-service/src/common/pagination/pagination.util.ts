import { PaginatedResult } from './pagination.interface';

export interface PaginationParams {
  page: number;
  limit: number;
}

export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  params: PaginationParams,
): PaginatedResult<T> {
  return {
    data,
    meta: {
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    },
  };
}
