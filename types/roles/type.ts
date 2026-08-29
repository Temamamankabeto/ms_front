export interface Role {
  id: number;
  name: string;
  guard_name: string;
  created_at: string;
  updated_at: string;
}

export interface RoleResponse {
  success: boolean;
  data: Role[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}