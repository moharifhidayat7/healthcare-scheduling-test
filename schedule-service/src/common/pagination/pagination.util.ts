import { PaginatedResult } from './pagination.interface';

export interface PaginationParams {
  page: number;
  limit: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export function normalizePagination(
  page?: number | null,
  limit?: number | null,
): PaginationParams {
  return {
    page: Math.max(DEFAULT_PAGE, page ?? DEFAULT_PAGE),
    limit: Math.min(MAX_LIMIT, Math.max(1, limit ?? DEFAULT_LIMIT)),
  };
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

export { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT };
