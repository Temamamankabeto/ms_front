export interface ServiceForm {

  id: number;

  title: string;

  description?: string;

  is_active: boolean;

  service?: {
    id: number;
    name: string;
  };
}
