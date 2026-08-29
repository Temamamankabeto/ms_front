import api, { unwrap } from "@/lib/api";

export type ChatbotCategory = {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  allowed_roles?: string[] | null;
  blocked_roles?: string[] | null;
  is_active: boolean;
  training_questions_count?: number;
};

export type ChatbotTrainingQuestion = {
  id: number;
  category_id: number;
  question: string;
  normalized_question?: string | null;
  keywords?: string[] | null;
  language: string;
  answer_template?: string | null;
  action_type: string;
  is_active: boolean;
  category?: Pick<ChatbotCategory, "id" | "name" | "code">;
};

type ListResponse<T> = {
  success: boolean;
  message: string;
  data: T[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

type SingleResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export const chatbotAdminService = {
  async categories(params?: Record<string, unknown>) {
    const response = await api.get("/admin/chatbot/categories", { params });
    return unwrap<ListResponse<ChatbotCategory>>(response);
  },

  async createCategory(payload: Partial<ChatbotCategory>) {
    const response = await api.post("/admin/chatbot/categories", payload);
    return unwrap<SingleResponse<ChatbotCategory>>(response);
  },

  async updateCategory(id: number, payload: Partial<ChatbotCategory>) {
    const response = await api.put(`/admin/chatbot/categories/${id}`, payload);
    return unwrap<SingleResponse<ChatbotCategory>>(response);
  },

  async deleteCategory(id: number) {
    const response = await api.delete(`/admin/chatbot/categories/${id}`);
    return unwrap(response);
  },

async trainingQuestions(params?: {
  page?: number;
  per_page?: number;
  search?: string;
  category_id?: number;
}) {
  const response = await api.get(
    "/admin/chatbot/training-questions",
    {
      params,
    }
  );

  return unwrap<ListResponse<ChatbotTrainingQuestion>>(response);
},

  async createTrainingQuestion(payload: Partial<ChatbotTrainingQuestion>) {
    const response = await api.post("/admin/chatbot/training-questions", payload);
    return unwrap<SingleResponse<ChatbotTrainingQuestion>>(response);
  },

  async updateTrainingQuestion(id: number, payload: Partial<ChatbotTrainingQuestion>) {
    const response = await api.put(`/admin/chatbot/training-questions/${id}`, payload);
    return unwrap<SingleResponse<ChatbotTrainingQuestion>>(response);
  },

  async deleteTrainingQuestion(id: number) {
    const response = await api.delete(`/admin/chatbot/training-questions/${id}`);
    return unwrap(response);
  },
};
