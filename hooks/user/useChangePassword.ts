import axios from "@/lib/api";
import { useMutation } from "@tanstack/react-query";

export const useChangePassword = () => {
  return useMutation({
    mutationFn: async ({
      id,
      current_password,
      new_password,
    }: any) => {
      const res = await axios.post(
        `/admin/users/${id}/change-password`,
        {
          current_password,
          new_password,
          new_password_confirmation: new_password,
        }
      );

      return res.data;
    },
  });
};