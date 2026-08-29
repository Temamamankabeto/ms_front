// src/types/feedback.ts

/* ============================================================
 * Enums
 * ============================================================ */

export type Satisfaction =
    | "highly_satisfied"
    | "satisfied"
    | "not_satisfied";

export type Gender =
    | "male"
    | "female";

/* ============================================================
 * Window
 * ============================================================ */

export interface Window {
    id: number;
    name: string;
    title?: string | null;
    city_title?: string | null;
    subcity_title?: string | null;
    woreda_title?: string | null;
    administrative_level?: "city" | "subcity" | "woreda" | null;
    city_id?: number | null;
    subcity_id?: number | null;
    woreda_id?: number | null;
    city?: LocationRef | null;
    subcity?: LocationRef | null;
    woreda?: LocationRef | null;
    services?: Service[];
}

export interface LocationRef {
    id: number;
    name: string;
}

export interface FeedbackWindow {
    id: number;
    name: string;
}

/* ============================================================
 * Service
 * ============================================================ */

export interface Service {
    id: number;
    name: string;
    description?: string;
}

/* ============================================================
 * Feedback
 * ============================================================ */

export interface Feedback {
    id: number;

    service_id: number;

    service?: Service;

    window_id?: number | null;

    window?: FeedbackWindow | null;

    city?: LocationRef | null;

    subcity?: LocationRef | null;

    woreda?: LocationRef | null;

    overall_rating: number;

    staff_behavior: number | null;

    waiting_time: number | null;

    service_quality: number | null;

    cleanliness: number | null;

    satisfaction: Satisfaction;

    comment: string | null;

    gender: Gender | null;

    age: number | null;

    ip_address?: string | null;

    user_agent?: string | null;

    device?: string | null;

    created_at: string;

    updated_at: string;
}

/* ============================================================
 * Create Feedback
 * ============================================================ */

export interface FeedbackPayload {
    service_id: number;

    window_id?: number;

    overall_rating: number;

    staff_behavior?: number;

    waiting_time?: number;

    service_quality?: number;

    cleanliness?: number;

    satisfaction: Satisfaction;

    comment?: string;

    gender?: Gender;

    age?: number;
}

/* ============================================================
 * Update Feedback
 * ============================================================ */

export interface UpdateFeedbackPayload
    extends Partial<FeedbackPayload> {}

/* ============================================================
 * Filters
 * ============================================================ */

export interface FeedbackFilters {
    service_id?: number;

    window_id?: number;

    city_id?: number;

    subcity_id?: number;

    woreda_id?: number;

    rating?: number;

    satisfaction?: Satisfaction;

    date?: string;

    page?: number;

    per_page?: number;
}

/* ============================================================
 * Pagination
 * ============================================================ */

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface PaginationMeta {
    current_page: number;

    from: number | null;

    last_page: number;

    per_page: number;

    total: number;

    path: string;

    to: number | null;

    links: PaginationLink[];
}

export interface PaginationLinks {
    first: string | null;

    last: string | null;

    prev: string | null;

    next: string | null;
}

/* ============================================================
 * API Response
 * ============================================================ */

export interface FeedbackResponse {
    success: boolean;

    message: string;

    data: Feedback;
}

export interface FeedbackListResponse {
    data: Feedback[];

    links: PaginationLinks;

    meta: PaginationMeta;
}

/* ============================================================
 * Window Response
 * ============================================================ */

export interface WindowResponse {
    success: boolean;

    data: Window[];
}

/* ============================================================
 * Service Response
 * ============================================================ */

export interface ServiceResponse {
    success: boolean;

    data: Service[];
}