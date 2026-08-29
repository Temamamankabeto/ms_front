export interface AuditLog {
  id: number;

  user_id?: number;
  role_name?: string;

  ip_address?: string;
  user_agent?: string;
  device_id?: string;

  entity_type?: string;
  entity_id?: number;

  action: string;
  message?: string;

  before?: any;
  after?: any;

  approved_by?: number;
  approved_at?: string;
  approval_reason?: string;

  created_at: string;
  updated_at: string;
}