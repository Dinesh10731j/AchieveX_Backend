export interface PaginationInput {
  page?: number;
  limit?: number;
}

export interface PaginationOutput {
  page: number;
  limit: number;
  offset: number;
}

export const normalizePagination = (input: PaginationInput): PaginationOutput => {
  const page = Math.max(1, input.page ?? 1);
  const limit = Math.min(100, Math.max(1, input.limit ?? 20));

  return {
    page,
    limit,
    offset: (page - 1) * limit
  };
};
