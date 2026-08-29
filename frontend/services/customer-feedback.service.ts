import api from "@/lib/api";

export type CustomerFeedbackPayload = {
  rating: number;
  comment?: string;
  application_id?: number | string;
};

export const CustomerFeedbackService = {
  /**
   * Get all feedbacks (admin / customer list)
   */
  getAll: () => {
    return api.get("/customer-feedbacks");
  },

  /**
   * Get single feedback by token (public form page)
   */
  getByToken: (token: string) => {
    return api.get(`/customer-feedbacks/${token}`);
  },

  /**
   * Submit feedback using token (customer form submit)
   */
  submitByToken: (token: string, data: CustomerFeedbackPayload) => {
    return api.post(`/customer-feedbacks/${token}/submit`, data);
  },

  /**
   * Create feedback manually (admin/internal use)
   */
  create: (data: CustomerFeedbackPayload) => {
    return api.post("/customer-feedbacks", data);
  },

  /**
   * Update feedback
   */
  update: (id: number | string, data: CustomerFeedbackPayload) => {
    return api.put(`/customer-feedbacks/${id}`, data);
  },

  /**
   * Delete feedback
   */
  delete: (id: number | string) => {
    return api.delete(`/customer-feedbacks/${id}`);
  },
};