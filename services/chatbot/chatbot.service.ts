import api, { unwrap } from "@/lib/api";

export type ChatbotResponseData = {
  reply: string;
  intent?: string;
  role?: string;
  scope?: string;
  language?: string;
  suggestions?: string[];
  context?: Record<string, unknown> | null;
};

export const chatbotService = {
  async send(payload: { message: string; session_id?: string; source?: string }, authenticated = false): Promise<ChatbotResponseData> {
    const endpoint = authenticated ? "/chatbot/message" : "/public/chatbot/message";
    const response = await api.post(endpoint, payload);
    const body = unwrap<{ success: boolean; message: string; data: ChatbotResponseData }>(response);
    return body.data;
  },
};
