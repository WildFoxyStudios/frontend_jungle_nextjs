export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    cursor?: string;
    has_more: boolean;
    total?: number;
    per_page?: number;
  };
}

export interface PagedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}
