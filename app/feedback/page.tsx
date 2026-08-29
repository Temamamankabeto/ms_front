"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    useAvailableWindows,
    useWindowServices,
    useCreateFeedback,
} from "@/hooks/use-feedback";
import type { FeedbackPayload } from "@/types/feedback";
import { toast } from "sonner";
import {
    Loader2,
    Heart,
    ChevronRight,
    Building2,
    Star,
    Users,
    CheckCircle2,
    ArrowLeft,
    Smile,
    Meh,
    Frown,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ==========================================================
| Validation Schema
========================================================== */

const feedbackSchema = z.object({
    window_id: z.number({
        required_error: "Please select a window.",
    }),
    service_id: z.number({
        required_error: "Please select a service.",
    }),
    satisfaction: z.enum(["highly_satisfied", "satisfied", "not_satisfied"]),
    comment: z.string().optional(),
    gender: z.enum(["male", "female"]).optional(),
});

type FeedbackFormValues = z.infer<typeof feedbackSchema>;

/* ==========================================================
| Helpers
========================================================== */

// Normalizes API responses that may come back either as a bare
// array or wrapped as { data: [...] }
function normalizeList<T = any>(input: unknown): T[] {
    if (Array.isArray(input)) return input as T[];
    if (
        input &&
        typeof input === "object" &&
        Array.isArray((input as { data?: unknown }).data)
    ) {
        return (input as { data: T[] }).data;
    }
    return [];
}

// Sorts by an assigned "level" (falls back to "order", then id)
// so windows/services always render in the sequence staff assigned.
function sortByLevel<T extends { level?: number; order?: number; id?: number }>(
    items: T[]
): T[] {
    return [...items].sort((a, b) => {
        const av = a.level ?? a.order ?? a.id ?? 0;
        const bv = b.level ?? b.order ?? b.id ?? 0;
        return av - bv;
    });
}

function getServiceCount(window: any, fallback: number): number {
    if (typeof window?.services_count === "number") return window.services_count;
    if (Array.isArray(window?.services)) return window.services.length;
    return fallback;
}

/* ==========================================================
| Service Selection Popup
========================================================== */

interface ServicePopupProps {
    isOpen: boolean;
    onClose: () => void;
    window: any;
    services: any[];
    onSelectService: (serviceId: number) => void;
    isLoading: boolean;
    windowName?: string;
}

function ServicePopup({
                          isOpen,
                          onClose,
                          window,
                          services,
                          onSelectService,
                          isLoading,
                          windowName,
                      }: ServicePopupProps) {
    const [selectedService, setSelectedService] = useState<number | null>(null);
    const [showFeedbackForm, setShowFeedbackForm] = useState(false);
    const [selectedServiceName, setSelectedServiceName] = useState("");

    const orderedServices = useMemo(() => sortByLevel(services), [services]);

    const handleServiceClick = (serviceId: number, serviceName: string) => {
        setSelectedService(serviceId);
        setSelectedServiceName(serviceName);
        setShowFeedbackForm(true);
    };

    const handleBack = () => {
        setShowFeedbackForm(false);
        setSelectedService(null);
    };

    if (showFeedbackForm && selectedService) {
        return (
            <FeedbackFormModal
                isOpen={isOpen}
                onClose={onClose}
                windowId={window?.id}
                windowName={windowName}
                serviceId={selectedService}
                serviceName={selectedServiceName}
                onBack={handleBack}
            />
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-white p-0 border-0 shadow-2xl">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 px-6 py-5 rounded-t-lg">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
                            <Building2 className="w-6 h-6" />
                            {windowName || window?.name || "Service Window"}
                        </DialogTitle>
                        <DialogDescription className="text-blue-100">
                            Choose the service you received today
                        </DialogDescription>
                        <Badge className="mt-1 w-fit bg-white/15 text-white border border-white/30 hover:bg-white/15">
                            {orderedServices.length} service{orderedServices.length === 1 ? "" : "s"}
                        </Badge>
                    </DialogHeader>
                </div>

                <div className="p-6">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                            <span className="ml-2 text-slate-600">Loading services...</span>
                        </div>
                    ) : orderedServices.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            No services available for this window
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {orderedServices.map((service: any, index: number) => (
                                <button
                                    key={service.id ?? index}
                                    type="button"
                                    onClick={() =>
                                        handleServiceClick(
                                            service.id ?? index,
                                            service.name || `Service ${index + 1}`
                                        )
                                    }
                                    className="group text-left rounded-xl border-2 border-slate-200 overflow-hidden hover:border-blue-500 hover:shadow-lg transition-all duration-200 bg-white"
                                >
                                    <div className="p-4 flex items-center justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-slate-800 text-sm truncate">
                                                {service.name || `Service ${index + 1}`}
                                            </p>
                                            {service.description && (
                                                <p className="text-xs text-slate-500 truncate">
                                                    {service.description}
                                                </p>
                                            )}
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-blue-500 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <DialogFooter className="px-6 pb-6">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="w-full border-slate-300 text-slate-700 hover:bg-slate-50"
                    >
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/* ==========================================================
| Feedback Form Modal
========================================================== */

interface FeedbackFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    windowId: number;
    windowName?: string;
    serviceId: number;
    serviceName: string;
    onBack: () => void;
}

const SATISFACTION_OPTIONS = [
    {
        value: "highly_satisfied" as const,
        label: "Highly Satisfied",
        icon: Smile,
        activeClass: "bg-emerald-600 border-emerald-600 text-white",
    },
    {
        value: "satisfied" as const,
        label: "Satisfied",
        icon: Meh,
        activeClass: "bg-amber-500 border-amber-500 text-white",
    },
    {
        value: "not_satisfied" as const,
        label: "Not Satisfied",
        icon: Frown,
        activeClass: "bg-rose-600 border-rose-600 text-white",
    },
];

const GENDER_OPTIONS = [
    { value: "male" as const, label: "Male", emoji: "👨" },
    { value: "female" as const, label: "Female", emoji: "👩" },
];

function FeedbackFormModal({
                               isOpen,
                               onClose,
                               windowId,
                               windowName,
                               serviceId,
                               serviceName,
                               onBack,
                           }: FeedbackFormModalProps) {
    const createFeedback = useCreateFeedback();

    const form = useForm<FeedbackFormValues>({
        resolver: zodResolver(feedbackSchema),
        defaultValues: {
            window_id: windowId,
            service_id: serviceId,
            satisfaction: "highly_satisfied",
            comment: "",
            gender: undefined,
        },
    });

    useEffect(() => {
        form.setValue("window_id", windowId);
        form.setValue("service_id", serviceId);
    }, [windowId, serviceId, form]);

    const satisfactionToRating: Record<
        FeedbackFormValues["satisfaction"],
        number
    > = {
        highly_satisfied: 5,
        satisfied: 3,
        not_satisfied: 1,
    };

    const onSubmit = async (values: FeedbackFormValues) => {
        try {
            await createFeedback.mutateAsync({
                ...values,
                overall_rating: satisfactionToRating[values.satisfaction],
            } as FeedbackPayload);
            toast.success("Thank you for your feedback! 🎉");
            form.reset({
                window_id: undefined,
                service_id: undefined,
                satisfaction: "highly_satisfied",
                comment: "",
                gender: undefined,
            });
            onClose();
        } catch (error: any) {
            const message =
                error?.response?.data?.message ||
                error.message ||
                "Failed to submit feedback";
            toast.error(message);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-0 shadow-2xl p-0">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 px-6 py-5 rounded-t-lg">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onBack}
                        type="button"
                        className="text-blue-100 hover:text-white hover:bg-white/10 -ml-2 mb-1"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back
                    </Button>
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
                            <Star className="w-6 h-6 fill-white" />
                            Customer Feedback Form
                        </DialogTitle>
                        <DialogDescription className="text-blue-100">
                            <span className="font-semibold text-white">{windowName}</span> —{" "}
                            <span className="font-semibold text-white">{serviceName}</span>
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
                        {/* Satisfaction — button group */}
                        <FormField
                            control={form.control}
                            name="satisfaction"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-700 font-medium">
                                        Overall, how satisfied were you?
                                    </FormLabel>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
                                        {SATISFACTION_OPTIONS.map((opt) => {
                                            const Icon = opt.icon;
                                            const isActive = field.value === opt.value;
                                            return (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() => field.onChange(opt.value)}
                                                    className={cn(
                                                        "flex items-center justify-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-all",
                                                        isActive
                                                            ? opt.activeClass
                                                            : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                                    )}
                                                >
                                                    <Icon className="w-4 h-4" />
                                                    {opt.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <FormMessage className="text-red-500" />
                                </FormItem>
                            )}
                        />

                        {/* Gender — button group */}
                        <FormField
                            control={form.control}
                            name="gender"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-700 font-medium">
                                        Gender <span className="text-slate-400 font-normal">(optional)</span>
                                    </FormLabel>
                                    <div className="flex gap-2 mt-1">
                                        {GENDER_OPTIONS.map((opt) => {
                                            const isActive = field.value === opt.value;
                                            return (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() =>
                                                        field.onChange(
                                                            isActive ? undefined : opt.value
                                                        )
                                                    }
                                                    className={cn(
                                                        "flex-1 flex items-center justify-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-all",
                                                        isActive
                                                            ? "bg-blue-600 border-blue-600 text-white"
                                                            : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                                    )}
                                                >
                                                    <span>{opt.emoji}</span>
                                                    {opt.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <FormMessage className="text-red-500" />
                                </FormItem>
                            )}
                        />

                        {/* Comment */}
                        <FormField
                            control={form.control}
                            name="comment"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-700 font-medium">
                                        Additional Comments
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            rows={4}
                                            placeholder="Share your experience in detail..."
                                            {...field}
                                            value={field.value ?? ""}
                                            className="bg-white border-slate-300 text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500 resize-none"
                                        />
                                    </FormControl>
                                    <FormMessage className="text-red-500" />
                                </FormItem>
                            )}
                        />

                        {/* Submit */}
                        <div className="flex gap-3 pt-1">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-50"
                            >
                                Cancel
                            </Button>
                            <Button
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                                type="submit"
                                disabled={createFeedback.isPending}
                            >
                                {createFeedback.isPending ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Submitting...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <Heart className="w-4 h-4" />
                                        Submit Feedback
                                    </span>
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

/* ==========================================================
| Main Page Component
========================================================== */

export default function FeedbackPage() {
    const [windowId, setWindowId] = useState<number>();
    const [selectedWindow, setSelectedWindow] = useState<any>(null);
    const [showServicePopup, setShowServicePopup] = useState(false);
    const [selectedServiceId, setSelectedServiceId] = useState<number>();

    /* Load Windows — scoped to the logged-in officer's own city /
       subcity / woreda when authenticated, all windows otherwise
       (anonymous kiosk). */
    const { data: windowsData, isLoading: windowsLoading } = useAvailableWindows();
    const windows = useMemo(
        () => sortByLevel(normalizeList(windowsData)),
        [windowsData]
    );

    /* The scoped (logged-in) window list already comes with its
       active services attached, so no extra request is needed —
       only fall back to fetching services separately for the
       public/anonymous kiosk list, which doesn't embed them. */
    const embeddedServices = Array.isArray(selectedWindow?.services)
        ? selectedWindow.services
        : null;

    const { data: servicesData, isLoading: servicesQueryLoading } =
        useWindowServices(embeddedServices ? undefined : windowId);

    const services = embeddedServices ?? normalizeList(servicesData);
    const servicesLoading = embeddedServices ? false : servicesQueryLoading;

    /* Handle Window Click */
    const handleWindowClick = (window: any) => {
        setWindowId(window.id);
        setSelectedWindow(window);
        setShowServicePopup(true);
    };

    /* Handle Service Selection */
    const handleServiceSelect = (serviceId: number) => {
        setSelectedServiceId(serviceId);
        setShowServicePopup(false);
    };

    /* Handle Close Popup */
    const handleClosePopup = () => {
        setShowServicePopup(false);
        setSelectedWindow(null);
        setWindowId(undefined);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-800">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 py-10 px-4 shadow-md">
                <div className="container mx-auto max-w-6xl">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/15 p-3 rounded-full border border-white/30">
                            <Building2 className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-white">
                                Adama City Customer Satisfaction Survey
                            </h1>
                            <p className="text-blue-100 mt-1">
                                Your feedback helps us improve our services
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto max-w-6xl py-8 px-4">
                {/* Service Windows Grid */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-blue-600" />
                            Select a Service Window
                        </h2>
                        <Badge className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-50">
                            {windows.length} window{windows.length === 1 ? "" : "s"}
                        </Badge>
                    </div>

                    {windowsLoading ? (
                        <div className="flex justify-center items-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                            <span className="ml-2 text-slate-600">Loading windows...</span>
                        </div>
                    ) : windows.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            No service windows are available right now.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {windows.map((win: any) => {
                                const isOpenWindow = windowId === win.id;
                                const count = getServiceCount(
                                    win,
                                    isOpenWindow ? services.length : win.services_count ?? 0
                                );
                                return (
                                    <Card
                                        key={win.id}
                                        className="group cursor-pointer overflow-hidden border-2 border-slate-200 bg-white transition-all duration-200 hover:-translate-y-1 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/10"
                                        onClick={() => handleWindowClick(win)}
                                    >
                                        <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-indigo-500 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
                                        <CardHeader className="pb-2">
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-base font-semibold text-slate-800">
                                                    {win.name || `Window ${win.id}`}
                                                </CardTitle>
                                                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-700 font-semibold text-sm border border-blue-100">
                                                    {win.level ?? win.order ?? win.id}
                                                </div>
                                            </div>
                                            <CardDescription className="text-xs text-slate-500 flex items-center gap-1">
                                                <Users className="w-3 h-3" />
                                                {isOpenWindow && servicesLoading
                                                    ? "Loading..."
                                                    : `${count} service${count === 1 ? "" : "s"} available`}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="pt-0">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-slate-400">
                                                    Click to view services
                                                </span>
                                                <ChevronRight className="w-4 h-4 text-blue-600 group-hover:translate-x-0.5 transition-transform" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Service Selection Popup */}
                <ServicePopup
                    isOpen={showServicePopup}
                    onClose={handleClosePopup}
                    window={selectedWindow}
                    windowName={selectedWindow?.name}
                    services={services}
                    onSelectService={handleServiceSelect}
                    isLoading={servicesLoading}
                />

                {/* Footer */}
                <p className="text-center text-sm text-slate-400 mt-8">
                    Your feedback helps us improve our services. Thank you for your time!
                </p>
            </div>
        </div>
    );
}