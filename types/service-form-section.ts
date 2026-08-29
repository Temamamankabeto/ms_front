export interface ServiceFormSection {
  id: number;

  service_form_id: number;

  title: string;

  description?: string | null;

  sort_order: number;

  is_active: boolean;

  created_at?: string;

  updated_at?: string;

  form?: {
    id: number;

    title: string;
  };
}

export interface ServiceFormSectionPayload {
  service_form_id: number;

  title: string;

  description?: string;

  sort_order?: number;

  is_active?: boolean;
}

