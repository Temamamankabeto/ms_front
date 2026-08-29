import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "@/lib/api";
import { toast } from "sonner";

export const useToggleUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await axios.patch(`/admin/users/${id}/toggle-status`);
      return res.data;
    },

    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });

      const isActive = res?.data?.is_active;

      toast.success(
        isActive ? "User enabled successfully" : "User disabled successfully"
      );
    },

    onError: () => {
      toast.error("Failed to update user status");
    },
  });
};