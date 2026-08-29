import api, { unwrap } from "@/lib/api";

export type DashboardCard = {
  key: string;
  label: string;
  value: number | string;
  description: string;
};

export type DashboardRecentApplication = {
  id: number;
  tracking_number?: string | null;
  service_name?: string | null;
  customer_name?: string | null;
  window_name?: string | null;
  status?: string | null;
  submitted_at?: string | null;
  updated_at?: string | null;
};

export type DashboardRecentUser = {
  id: number;
  name: string;
  email?: string | null;
  role?: string | null;
  is_active?: boolean;
  created_at?: string | null;
};

export type DashboardResponse = {
  profile: {
    id: number;
    name: string;
    email?: string | null;
    phone?: string | null;
    avatar_url?: string | null;
    role: string;
    role_label: string;
    location_level?: string | null;
    scope_label?: string | null;
    city?: string | null;
    subcity?: string | null;
    woreda?: string | null;
  };
  permissions: string[];
  cards: DashboardCard[];
  status_counts: Record<string, number>;
  module_counts?: Record<string, number>;
  payment_counts?: { pending: number; paid: number };
  appointment_counts?: { total: number; upcoming: number };
  complaint_counts?: { total: number; open: number };
  quick_links: Array<{ label: string; href: string; permission: string }>;
  recent_applications?: DashboardRecentApplication[];
  recent_users?: DashboardRecentUser[];
  role_dashboard?: {
    title: string;
    description: string;
    primary_action?: { label: string; href: string };
    sections: Array<{
      title: string;
      items: Array<{ label: string; value: number | string }>;
    }>;
  };
};

export const dashboardService = {
  async getOverview(): Promise<DashboardResponse> {
    const response = await api.get("/admin/dashboard");
    const body = unwrap<{ data: DashboardResponse }>(response);
    return body.data;
  },
};
