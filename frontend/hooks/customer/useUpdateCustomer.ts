// hooks/customer/useUpdateCustomer.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { customerService } from "@/services/customer/customer.service";
import { customerKeys } from "./useCustomers";
import type { UpdateCustomerPayload } from "@/types/customer";

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number | string;
      data: UpdateCustomerPayload;
    }) => customerService.update(id, data),

    onSuccess: (_, variables) => {
      toast.success("Customer updated successfully.");

      // Refresh customer list
      queryClient.invalidateQueries({
        queryKey: customerKeys.lists(),
      });

      // Refresh this customer
      queryClient.invalidateQueries({
        queryKey: customerKeys.detail(variables.id),
      });
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ??
          "Failed to update customer."
      );
    },
  });
}