// services/customer/customer.service.ts

import api, { unwrap } from "@/lib/api";

import type {
  Customer,
  CustomerListResponse,
  CustomerQueryParams,
  CustomerResponse,
  UpdateCustomerPayload,
  VerifyCustomerResponse,
  RejectCustomerPayload,
  RejectCustomerResponse,
} from "@/types/customer";

class CustomerService {
  /**
   * GET /customers
   */
  async index(params?: CustomerQueryParams): Promise<CustomerListResponse> {
    const response = await api.get("/customers", {
      params,
    });

    return unwrap<CustomerListResponse>(response);
  }

  /**
   * GET /customers/list
   */
async list(params?: CustomerQueryParams): Promise<CustomerListResponse> {
  const response = await api.get("/customers", {
    params,
  });

  return unwrap<CustomerListResponse>(response);
}

  /**
   * GET /customers/{id}
   */
  async show(id: number | string): Promise<CustomerResponse> {
    const response = await api.get(`/customers/${id}`);

    return unwrap<CustomerResponse>(response);
  }

  /**
   * PUT /customers/{id}
   */
  async update(
    id: number | string,
    payload: UpdateCustomerPayload
  ): Promise<CustomerResponse> {
    const response = await api.put(
      `/customers/${id}`,
      payload
    );

    return unwrap<CustomerResponse>(response);
  }

  /**
   * PATCH /customers/{id}/verify
   */
  async verify(
    id: number | string
  ): Promise<VerifyCustomerResponse> {
    const response = await api.patch(
      `/customers/${id}/verify`
    );

    return unwrap<VerifyCustomerResponse>(response);
  }

  /**
   * PATCH /customers/{id}/reject
   */
  async reject(
    id: number | string,
    payload?: RejectCustomerPayload
  ): Promise<RejectCustomerResponse> {
    const response = await api.patch(
      `/customers/${id}/reject`,
      payload ?? {}
    );

    return unwrap<RejectCustomerResponse>(response);
  }
}

export const customerService = new CustomerService();