export type ServiceProvider = {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
};

export type ServiceProviderPayload = {
  name: string;
};

export type ServiceProviderListResponse = {
  success: boolean;
  message: string;
  data: ServiceProvider[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export type ServiceProviderResponse = {
  success: boolean;
  message: string;
  data: ServiceProvider;
};
