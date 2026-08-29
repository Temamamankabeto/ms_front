export type ServiceFormFieldType =
  | "text"
  | "textarea"
  | "number"
  | "email"
  | "tel"
  | "date"
  | "select"
  | "radio"
  | "checkbox"
  | "file"
  | "image";

export interface ServiceFormField {
  id: number;
  service_form_id: number;
  label: string;
  name: string;
  type: ServiceFormFieldType;
  placeholder?: string | null;
  help_text?: string | null;
  default_value?: string | null;
  validation_rules?: string[] | string | null;
  options?: string[] | null;
  is_required?: boolean;
  is_active?: boolean;
  sort_order: number;
  width?: "full" | "half" | "third" | "quarter" | string;
}

export interface CreateServiceFormFieldPayload {
  service_form_id: number;
  label: string;
  name: string;
  type: ServiceFormFieldType;
  placeholder?: string;
  help_text?: string;
  default_value?: string;
  validation_rules?: string[] | string;
  options?: string[];
  is_required?: boolean;
  is_active?: boolean;
  sort_order?: number;
  width?: "full" | "half" | "third" | "quarter" | string;
}

export type UpdateServiceFormFieldPayload =
  Partial<CreateServiceFormFieldPayload>;

export interface ServiceForm {
  id: number;
  service_id: number;
  title: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  fields?: ServiceFormField[];
}

export type ServiceFormPayload = {
  service_id: number;
  title: string;
  description?: string | null;
  is_active?: boolean;
};