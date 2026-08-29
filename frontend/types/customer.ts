// types/customer.ts

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string | null;
  profile_image: string | null;

  is_active?: boolean;
  is_verified?: boolean;
  verification_status?: "pending" | "verified" | "rejected";

  email_verified_at: string | null;

  created_at: string;
  updated_at: string;

  roles: string[];

  city_id?: number | null;
  subcity_id?: number | null;
  woreda_id?: number | null;

  city?: {
    id: number;
    name: string;
  } | null;

  subcity?: {
    id: number;
    name: string;
  } | null;

  woreda?: {
    id: number;
    name: string;
  } | null;
}

export interface CustomerListResponse {
  success: boolean;
  message: string;
  data: Customer[];
  meta: PaginationMeta;
}

export interface CustomerResponse {
  success: boolean;
  message: string;
  data: Customer;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface CustomerQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
}

export interface UpdateCustomerPayload {
  name: string;
  email: string;
  phone: string;
  address?: string | null;
}

export interface VerifyCustomerResponse {
  success: boolean;
  message: string;
}

export interface RejectCustomerPayload {
  reason?: string;
}

export interface RejectCustomerResponse {
  success: boolean;
  message: string;
}