export type WindowAvailability =
  | "city"
  | "subcity"
  | "woreda";

export interface Window {
  id: number;

  name: string;
  title?: string | null;
  city_title?: string | null;
  subcity_title?: string | null;
  woreda_title?: string | null;
  administrative_level?: WindowAvailability | null;

  availability: WindowAvailability[] | { levels?: WindowAvailability[] };

  created_at: string;

  updated_at: string;
}

export interface WindowPayload {
  name: string;

  availability: WindowAvailability[];

  city_title?: string | null;
  subcity_title?: string | null;
  woreda_title?: string | null;
}

export interface PaginatedWindowResponse {
  success: boolean;

  message: string;

  data: {
    current_page: number;

    data: Window[];

    last_page: number;

    per_page: number;

    total: number;
  };
}
