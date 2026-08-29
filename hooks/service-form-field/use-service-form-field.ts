import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  serviceFormFieldService,
} from "@/services/service-form-field";

import {
  ServiceFormFieldPayload,
} from "@/types/service-form-field";

export function useServiceFormFields() {
  return useQuery({
    queryKey: ["service-form-fields"],

    queryFn: async () => {
      const response =
        await serviceFormFieldService.getAll();

      return Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.data?.data)
          ? response.data.data
          : [];
    },
  });
}

export function useCreateServiceFormField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      payload: ServiceFormFieldPayload
    ) =>
      serviceFormFieldService.create(
        payload
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          "service-form-fields",
        ],
      });
    },
  });
}