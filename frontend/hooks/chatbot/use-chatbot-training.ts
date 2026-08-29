"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { chatbotAdminService } from "@/services/chatbot/chatbot-admin.service";

export function useChatbotCategories(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["chatbot-categories", params],
    queryFn: () => chatbotAdminService.categories(params),
  });
}

export function useChatbotTrainingQuestions(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["chatbot-training-questions", params],
    queryFn: () => chatbotAdminService.trainingQuestions(params),
  });
}

export function useCreateChatbotCategory() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: chatbotAdminService.createCategory,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chatbot-categories"] }),
  });
}

export function useUpdateChatbotCategory() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) =>
      chatbotAdminService.updateCategory(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chatbot-categories"] }),
  });
}

export function useDeleteChatbotCategory() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: chatbotAdminService.deleteCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chatbot-categories"] });
      qc.invalidateQueries({ queryKey: ["chatbot-training-questions"] });
    },
  });
}

export function useCreateChatbotTrainingQuestion() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: chatbotAdminService.createTrainingQuestion,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chatbot-training-questions"] });
      qc.invalidateQueries({ queryKey: ["chatbot-categories"] });
    },
  });
}

export function useUpdateChatbotTrainingQuestion() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) =>
      chatbotAdminService.updateTrainingQuestion(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chatbot-training-questions"] }),
  });
}

export function useDeleteChatbotTrainingQuestion() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: chatbotAdminService.deleteTrainingQuestion,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chatbot-training-questions"] });
      qc.invalidateQueries({ queryKey: ["chatbot-categories"] });
    },
  });
}
