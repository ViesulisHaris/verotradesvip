// Pagination utilities for handling large datasets
export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  symbol?: string;
  market?: string;
  dateFrom?: string;
  dateTo?: string;
  pnlFilter?: string;
  side?: string;
  emotionalStates?: string[];
}

export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Calculate pagination parameters
 */
export function calculatePagination(
  totalCount: number,
  page: number,
  limit: number
): Omit<PaginatedResult<any>, 'data'> {
  const totalPages = Math.ceil(totalCount / limit);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  return {
    totalCount,
    currentPage: page,
    totalPages,
    hasNextPage,
    hasPreviousPage,
  };
}

/**
 * Apply pagination to an array
 */
export function paginateArray<T>(
  items: T[],
  options: PaginationOptions
): PaginatedResult<T> {
  const { page, limit } = options;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const data = items.slice(startIndex, endIndex);

  return {
    data,
    totalCount: items.length,
    currentPage: page,
    totalPages: Math.ceil(items.length / limit),
    hasNextPage: endIndex < items.length,
    hasPreviousPage: page > 1,
  };
}

/**
 * Generate pagination query for Supabase
 */
export function buildPaginationQuery(options: PaginationOptions) {
  const { page, limit, sortBy = 'created_at', sortOrder = 'desc' } = options;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  return {
    from,
    to,
    orderBy: { column: sortBy, ascending: sortOrder === 'asc' },
  };
}