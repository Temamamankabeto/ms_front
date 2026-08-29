import api, { unwrap } from "@/lib/api";

export type CustomerNotificationType = "appointment" | "payment";

export type CustomerNotificationItem = {
  id: string;
  type: CustomerNotificationType;
  title: string;
  message: string;
  application_id: number;
  tracking_number?: string | null;
  service_name?: string | null;
  date?: string | null;
  status?: string | null;
  href: string;
};

export type CustomerNotificationResponse = {
  success: boolean;
  message: string;
  data: {
    unread_count: number;
    appointment_count: number;
    payment_count: number;
    notifications: CustomerNotificationItem[];
  };
};

export const customerNotificationService = {
  async list(): Promise<CustomerNotificationResponse["data"]> {
    const response = await api.get("/customer/notifications");
    const body = unwrap<CustomerNotificationResponse>(response);
    return body.data;
  },
};
