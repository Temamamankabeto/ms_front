// src/services/feedback.service.ts

import api, { unwrap } from "@/lib/api";

import type {
    Feedback,
    FeedbackFilters,
    FeedbackListResponse,
    FeedbackPayload,
    FeedbackResponse,
    Service,
    ServiceResponse,
    Window,
    WindowResponse,
} from "@/types/feedback";

class FeedbackService {
    private readonly feedbackUrl = "/feedback";
    private readonly windowsUrl = "/windows";
    private readonly publicWindowsUrl = "/public/feedback-windows";
    private readonly scopedWindowsUrl = "/feedback/windows";

    /* ==========================================================
     * WINDOWS (public kiosk)
     * No login required, matches how the feedback form itself is
     * submitted anonymously at a window — every window is shown
     * since the walk-in customer picks whichever one they're at.
     * ========================================================== */

    async getWindows(): Promise<Window[]> {
        const response = await api.get(this.publicWindowsUrl);

        return unwrap<WindowResponse>(response).data;
    }

    /* ==========================================================
     * WINDOWS (logged-in feedback officer)
     * Requires auth. Scoped server-side to the officer's own
     * city / subcity / woreda — a city-level officer only sees
     * their city's windows, a subcity-level officer sees their
     * subcity window plus every woreda window under it, and a
     * woreda-level officer sees only their own woreda window.
     * Each window comes with its active services attached.
     * ========================================================== */

    async getScopedWindows(): Promise<Window[]> {
        const response = await api.get(this.scopedWindowsUrl);

        return unwrap<WindowResponse>(response).data;
    }

    /* ==========================================================
     * SERVICES BY WINDOW
     * GET /windows/{window}/services
     * ========================================================== */

    async getServicesByWindow(
        windowId: number
    ): Promise<Service[]> {
        const response = await api.get(
            `${this.windowsUrl}/${windowId}/services`
        );

        return unwrap<ServiceResponse>(response).data;
    }

    /* ==========================================================
     * GET ALL FEEDBACK
     * ========================================================== */

    async getAll(
        filters?: FeedbackFilters
    ): Promise<FeedbackListResponse> {
        const response = await api.get(
            this.feedbackUrl,
            {
                params: filters,
            }
        );

        return unwrap<FeedbackListResponse>(
            response
        );
    }

    /* ==========================================================
     * GET SINGLE FEEDBACK
     * ========================================================== */

    async getById(
        id: number
    ): Promise<Feedback> {
        const response = await api.get(
            `${this.feedbackUrl}/${id}`
        );

        return unwrap<FeedbackResponse>(
            response
        ).data;
    }

    /* ==========================================================
     * CREATE FEEDBACK
     * ========================================================== */

    async create(
        payload: FeedbackPayload
    ): Promise<Feedback> {
        const response = await api.post(
            this.feedbackUrl,
            payload
        );

        return unwrap<FeedbackResponse>(
            response
        ).data;
    }

    /* ==========================================================
     * UPDATE FEEDBACK
     * ========================================================== */

    async update(
        id: number,
        payload: Partial<FeedbackPayload>
    ): Promise<Feedback> {
        const response = await api.put(
            `${this.feedbackUrl}/${id}`,
            payload
        );

        return unwrap<FeedbackResponse>(
            response
        ).data;
    }

    /* ==========================================================
     * DELETE FEEDBACK
     * ========================================================== */

    async delete(
        id: number
    ): Promise<void> {
        await api.delete(
            `${this.feedbackUrl}/${id}`
        );
    }

    /* ==========================================================
     * FILTERS
     * ========================================================== */

    async filter(
        filters: FeedbackFilters
    ): Promise<FeedbackListResponse> {
        const response = await api.get(
            this.feedbackUrl,
            {
                params: filters,
            }
        );

        return unwrap<FeedbackListResponse>(
            response
        );
    }

    async byService(
        serviceId: number
    ): Promise<FeedbackListResponse> {
        return this.filter({
            service_id: serviceId,
        });
    }

    async byRating(
        rating: number
    ): Promise<FeedbackListResponse> {
        return this.filter({
            rating,
        });
    }

    async bySatisfaction(
        satisfaction:
            | "highly_satisfied"
            | "satisfied"
            | "not_satisfied"
    ): Promise<FeedbackListResponse> {
        return this.filter({
            satisfaction,
        });
    }

    async byDate(
        date: string
    ): Promise<FeedbackListResponse> {
        return this.filter({
            date,
        });
    }

    /* ==========================================================
     * PAGINATION
     * ========================================================== */

    async paginate(
        page = 1,
        perPage = 20
    ): Promise<FeedbackListResponse> {
        const response = await api.get(
            this.feedbackUrl,
            {
                params: {
                    page,
                    per_page: perPage,
                },
            }
        );

        return unwrap<FeedbackListResponse>(
            response
        );
    }

    /* ==========================================================
     * DASHBOARD
     * ========================================================== */

    async dashboard(
        filters?: FeedbackFilters
    ): Promise<FeedbackListResponse> {
        const response = await api.get(
            this.feedbackUrl,
            {
                params: filters,
            }
        );

        return unwrap<FeedbackListResponse>(
            response
        );
    }
}

export default new FeedbackService();