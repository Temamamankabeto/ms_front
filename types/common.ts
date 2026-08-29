export interface ApiResponse<T> {

  success: boolean;

  message: string;

  data: T;
}

/*
|--------------------------------------------------------------------------
| PAGINATION
|--------------------------------------------------------------------------
*/

export interface PaginationMeta {

  current_page: number;

  last_page: number;

  per_page: number;

  total: number;
}

export type PaginatedData<T> = {
  data: T[];

  current_page: number;
  last_page: number;
  per_page: number;
  total: number;

  from?: number | null;
  to?: number | null;

  first_page_url?: string | null;
  last_page_url?: string | null;
  next_page_url?: string | null;
  prev_page_url?: string | null;
  path?: string;
};

export interface PaginatedResponse<T> {

  success: boolean;

  message: string;

  data: PaginatedData<T>;
}

export type LaravelPaginatedResponse<T> =
  PaginatedResponse<T>;