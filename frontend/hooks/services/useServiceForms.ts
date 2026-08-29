import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ServiceFormAPI } from "@/services/service-form/service-form";

export const useServiceForms = () =>
  useQuery({
    queryKey: ["service-forms"],
    queryFn: ServiceFormAPI.list,
  });

export const useCreateServiceForm = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ServiceFormAPI.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["service-forms"] }),
  });
};

export const useUpdateServiceForm = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: any) =>
      ServiceFormAPI.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["service-forms"] }),
  });
};

export const useDeleteServiceForm = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ServiceFormAPI.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["service-forms"] }),
  });
};