"use client";

import {
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";

import { getToken } from "@/lib/api";
import feedbackService from "@/services/feedback.service";

import type {
    FeedbackFilters,
    FeedbackPayload,
    UpdateFeedbackPayload,
} from "@/types/feedback";

/* ==========================================================
 * Query Keys
 * ========================================================== */

export const feedbackKeys = {

    all: ["feedback"] as const,

    windows: ["feedback", "windows"] as const,

    scopedWindows: ["feedback", "scoped-windows"] as const,

    services: (windowId?: number) =>
        ["feedback", "services", windowId] as const,

    lists: ["feedback", "list"] as const,

    list: (filters?: FeedbackFilters) =>
        ["feedback", "list", filters] as const,

    detail: (id: number) =>
        ["feedback", "detail", id] as const,

};

/* ==========================================================
 * WINDOWS
 * ========================================================== */

export function useWindows() {

    return useQuery({

        queryKey: feedbackKeys.windows,

        queryFn: () =>
            feedbackService.getWindows(),

    });

}

/* ==========================================================
 * WINDOWS — scoped to the logged-in officer's own
 * city / subcity / woreda (with their active services attached)
 * ========================================================== */

export function useScopedWindows() {

    return useQuery({

        queryKey: feedbackKeys.scopedWindows,

        queryFn: () =>
            feedbackService.getScopedWindows(),

    });

}

/* ==========================================================
 * WINDOWS — location-aware.
 * A logged-in feedback officer (token present) gets the scoped,
 * server-filtered list for their own city / subcity / woreda
 * (with active services already attached). Everyone else — the
 * anonymous kiosk case — falls back to the unscoped public list,
 * since a walk-in customer at a window has no "location" of their
 * own to scope by.
 * ========================================================== */

export function useAvailableWindows() {

    const hasToken =
        typeof window !== "undefined" && !!getToken();

    const scoped = useQuery({

        queryKey: feedbackKeys.scopedWindows,

        queryFn: () =>
            feedbackService.getScopedWindows(),

        enabled: hasToken,

    });

    const publicWindows = useQuery({

        queryKey: feedbackKeys.windows,

        queryFn: () =>
            feedbackService.getWindows(),

        enabled: !hasToken,

    });

    return hasToken ? scoped : publicWindows;

}

/* ==========================================================
 * SERVICES OF WINDOW
 * ========================================================== */

export function useWindowServices(
    windowId?: number
) {

    return useQuery({

        queryKey: feedbackKeys.services(windowId),

        queryFn: () =>
            feedbackService.getServicesByWindow(
                windowId!
            ),

        enabled: !!windowId,

    });

}

/* ==========================================================
 * GET ALL FEEDBACK
 * ========================================================== */

export function useFeedback(
    filters?: FeedbackFilters
) {

    return useQuery({

        queryKey: feedbackKeys.list(filters),

        queryFn: () =>
            feedbackService.getAll(filters),

    });

}

/* ==========================================================
 * GET SINGLE FEEDBACK
 * ========================================================== */

export function useFeedbackDetails(
    id: number
) {

    return useQuery({

        queryKey: feedbackKeys.detail(id),

        queryFn: () =>
            feedbackService.getById(id),

        enabled: !!id,

    });

}

/* ==========================================================
 * CREATE FEEDBACK
 * ========================================================== */

export function useCreateFeedback() {

    const queryClient = useQueryClient();

    return useMutation({

        mutationFn: (
            payload: FeedbackPayload
        ) =>
            feedbackService.create(payload),

        onSuccess: () => {

            queryClient.invalidateQueries({

                queryKey: feedbackKeys.lists,

            });

        },

    });

}

/* ==========================================================
 * UPDATE FEEDBACK
 * ========================================================== */

export function useUpdateFeedback() {

    const queryClient = useQueryClient();

    return useMutation({

        mutationFn: ({
                         id,
                         payload,
                     }: {
            id: number;
            payload: UpdateFeedbackPayload;
        }) =>
            feedbackService.update(
                id,
                payload
            ),

        onSuccess: (_, variables) => {

            queryClient.invalidateQueries({

                queryKey: feedbackKeys.lists,

            });

            queryClient.invalidateQueries({

                queryKey: feedbackKeys.detail(
                    variables.id
                ),

            });

        },

    });

}

/* ==========================================================
 * DELETE FEEDBACK
 * ========================================================== */

export function useDeleteFeedback() {

    const queryClient = useQueryClient();

    return useMutation({

        mutationFn: (id: number) =>
            feedbackService.delete(id),

        onSuccess: () => {

            queryClient.invalidateQueries({

                queryKey: feedbackKeys.lists,

            });

        },

    });

}

/* ==========================================================
 * FILTER FEEDBACK
 * ========================================================== */

export function useFilteredFeedback(
    filters: FeedbackFilters
) {

    return useQuery({

        queryKey: ["feedback-filter", filters],

        queryFn: () =>
            feedbackService.filter(filters),

    });

}

/* ==========================================================
 * PAGINATION
 * ========================================================== */

export function useFeedbackPagination(
    page = 1,
    perPage = 20
) {

    return useQuery({

        queryKey: [
            "feedback-page",
            page,
            perPage,
        ],

        queryFn: () =>
            feedbackService.paginate(
                page,
                perPage
            ),

    });

}