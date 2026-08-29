import type { Service } from "@/types/services/service";

export type ServiceCriterion = {
  id: number;
  service_id: number;
  title: string;
  criteria: string;
  criteria_items?: string[];
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  service?: Pick<Service, "id" | "name">;
};

export type ServiceCriterionPayload = {
  service_id: number;
  title: string;
  criteria: string;
  sort_order?: number;
  is_active?: boolean;
};

export type ServiceCriterionListResponse = {
  success: boolean;
  message: string;
  data: ServiceCriterion[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};
