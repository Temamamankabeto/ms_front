export interface ServiceFormField {
  id: number;

  service_form_id: number;

  service_form_section_id?: number | null;

  label: string;

  name: string;

  type: string;

  placeholder?: string | null;

  help_text?: string | null;

  default_value?: string | null;

  options?: string[] | null;

  validation_rules?: string[] | null;

  is_required: boolean;

  is_active: boolean;

  sort_order: number;

  width?: string | null;

  form?: {
    id: number;
    title: string;
  };

  section?: {
    id: number;
    title: string;
  };
}

export interface ServiceFormFieldPayload {
  service_form_id: number;

  service_form_section_id?: number;

  label: string;

  name: string;

  type: string;

  placeholder?: string;

  help_text?: string;

  default_value?: string;

  options?: string[];

  validation_rules?: string[];

  is_required?: boolean;

  is_active?: boolean;

  sort_order?: number;

  width?: string;
}