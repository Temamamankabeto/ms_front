export type Office = {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
};

export type OfficeResponse = {
  data: Office;
};

export type OfficeListResponse = {
  data: Office[];
};