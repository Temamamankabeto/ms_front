import api from "@/lib/api";

import {
  ServiceFormFieldPayload,
} from "@/types/service-form-field";

export const serviceFormFieldService = {
  async getAll() {
    const response = await api.get(
      "/service-form-fields"
    );

    return response.data;
  },

  async create(
    payload: ServiceFormFieldPayload
  ) {
    const response = await api.post(
      "/service-form-fields",
      payload
    );

    return response.data;
  },
};