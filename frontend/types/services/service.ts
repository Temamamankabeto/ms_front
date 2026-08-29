import {
  LaravelPaginatedResponse,
} from "@/types/common";

export type ServiceAvailability =
  | "city"
  | "subcity"
  | "woreda";

export type ServiceStatus =
  | "active"
  | "inactive";

/*
|--------------------------------------------------------------------------
| ROLE TYPE
|--------------------------------------------------------------------------
*/

export type OfficerRole =
  | "front_officer"
  | "back_officer";

/*
|--------------------------------------------------------------------------
| ROLE
|--------------------------------------------------------------------------
*/

export interface Role {
  id: number;

  name: OfficerRole;
}

/*
|--------------------------------------------------------------------------
| ASSIGNED USER
|--------------------------------------------------------------------------
*/

export interface AssignedUser {
  id: number;

  name: string;

  email?: string;

  role?: OfficerRole;

  roles?: Role[];

  pivot?: {
    is_active: boolean;
  };
}

/*
|--------------------------------------------------------------------------
| SERVICE
|--------------------------------------------------------------------------
*/

export interface ServiceCriterion {
  id: number;
  service_id: number;
  title: string;
  criteria: string;
  criteria_items?: string[];
  sort_order?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Service {
  id: number;

  name: string;

  description?: string | null;

  has_back_officer: boolean;

  service_fee: number;

  availability: ServiceAvailability[];

  status: ServiceStatus;

  created_at: string;

  updated_at: string;

  /*
  |--------------------------------------------------------------------------
  | RELATIONSHIPS
  |--------------------------------------------------------------------------
  */

  assignedUsers?: AssignedUser[];

  assigned_users?: AssignedUser[];

  criteria?: ServiceCriterion[];
}

/*
|--------------------------------------------------------------------------
| SERVICE PAYLOAD
|--------------------------------------------------------------------------
*/

export interface ServicePayload {
  name: string;

  description?: string;

  has_back_officer: boolean;

  service_fee: number;

  availability: ServiceAvailability[];

  status: ServiceStatus;
}

/*
|--------------------------------------------------------------------------
| PAGINATED SERVICE RESPONSE
|--------------------------------------------------------------------------
*/

export type PaginatedServiceResponse =
  LaravelPaginatedResponse<Service>;

/*
|--------------------------------------------------------------------------
| USER ASSIGNED SERVICE
|--------------------------------------------------------------------------
*/

export interface UserAssignedService {
  id: number;

  name: string;

  pivot?: {
    user_id?: number;

    service_id?: number;

    is_active: boolean;

    created_at?: string;

    updated_at?: string;
  };
}

/*
|--------------------------------------------------------------------------
| USER SERVICE RESPONSE
|--------------------------------------------------------------------------
*/

export interface UserServiceAssignmentResponse {
  success: boolean;

  message: string;

  data: {
    id: number;

    name: string;

    email?: string;

    role?: OfficerRole;

    roles?: Role[];

    assigned_services: UserAssignedService[];

    assignedServices?: UserAssignedService[];
  };
}

/*
|--------------------------------------------------------------------------
| ASSIGN USER SERVICE PAYLOAD
|--------------------------------------------------------------------------
*/

export interface AssignUserServicePayload {
  service_ids: number[];
}

/*
|--------------------------------------------------------------------------
| OFFICER
|--------------------------------------------------------------------------
*/

export interface Officer {
  id: number;

  name: string;

  email?: string;

  phone?: string;

  gender?: string | null;

  address?: string | null;

  status?: string;

  profile_image_url?: string | null;

  role?: OfficerRole;

  roles?: Role[];

  assigned_services?: UserAssignedService[];

  assignedServices?: UserAssignedService[];
}

/*
|--------------------------------------------------------------------------
| OFFICER RESPONSE
|--------------------------------------------------------------------------
*/
 /*
|--------------------------------------------------------------------------
| OFFICER RESPONSE
|--------------------------------------------------------------------------
*/

export type PaginationMeta = {
  current_page: number;
  last_page: number;
  per_page?: number;
  total?: number;
};

export type OfficerListResponse = {
  data: Officer[];
  meta?: PaginationMeta;
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
};


/*
|--------------------------------------------------------------------------
| SERVICE FORM
|--------------------------------------------------------------------------
*/

export interface ServiceForm {
  id: number;

  service_id: number;

  title: string;

  description?: string | null;

  is_active: boolean;

  created_at: string;

  updated_at?: string;
}



/*
|--------------------------------------------------------------------------
| SERVICE FORM RESPONSE
|--------------------------------------------------------------------------
*/

export type ServiceFormResponse =
  LaravelPaginatedResponse<ServiceForm>;



/*
|--------------------------------------------------------------------------
| SINGLE SERVICE FORM RESPONSE
|--------------------------------------------------------------------------
*/

export interface SingleServiceFormResponse {
  success: boolean;

  message: string;

  data: ServiceForm;
}



/*
|--------------------------------------------------------------------------
| CREATE SERVICE FORM PAYLOAD
|--------------------------------------------------------------------------
*/

export interface CreateServiceFormPayload {
  title: string;

  description?: string;

  is_active?: boolean;
}



/*
|--------------------------------------------------------------------------
| UPDATE SERVICE FORM PAYLOAD
|--------------------------------------------------------------------------
*/

export interface UpdateServiceFormPayload {
  title?: string;

  description?: string;

  is_active?: boolean;
}




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
  created_at?: string;
  updated_at?: string;
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