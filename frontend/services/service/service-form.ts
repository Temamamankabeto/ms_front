export interface ServiceForm {
  id: number;
  service_id: number;
  title: string;
  description?: string;
  is_active: boolean;
}

export interface ServiceFormPayload {
  service_id: number;
  title: string;
  description?: string;
  is_active?: boolean;
}