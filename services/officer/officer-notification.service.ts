import api, { unwrap } from "@/lib/api";

export type OfficerNotificationType = "new" | "shared" | "returned_from_back";

export type OfficerNotificationItem = {
  id: string;
  type: OfficerNotificationType;
  title: string;
  message: string;
  application_id: number;
  tracking_number?: string | null;
  service_name?: string | null;
  customer_name?: string | null;
  window_name?: string | null;
  date?: string | null;
  status?: string | null;
  href: string;
};

export type OfficerNotificationResponse = {
  success: boolean;
  message: string;
  data: {
    unread_count: number;
    new_count: number;
    shared_count: number;
    returned_from_back_count: number;
    notifications: OfficerNotificationItem[];
  };
};

export const officerNotificationService = {
  async list(): Promise<OfficerNotificationResponse["data"]> {
    const response = await api.get("/officer/notifications");
    const body = unwrap<OfficerNotificationResponse>(response);

    return body.data;
  },
};
