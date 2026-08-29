import api, { unwrap } from "@/lib/api";

export type DashboardCardsResponse = {
  service_cards: { total_applications: number; on_progress_applications: number; completed_applications: number };
  feedback_cards: { highly_satisfied: number; satisfied: number; dissatisfied: number };
  feedback_by_location: FeedbackLocationRow[];
  feedback_by_window: FeedbackRow[];
  scope: { role: string; level?: string | null; label: string };
};

export type ReportRow = { city: string; subcity: string; woreda: string; window: string; service: string; officer: string; total: number; approved_rejected: number; on_progress: number; percent: number };
export type FeedbackRow = { city: string; subcity: string; woreda: string; window: string; service: string; highly_satisfied: number; satisfied: number; not_satisfied: number; total: number; percent: number };
export type FeedbackLocationRow = { city: string; subcity: string; woreda: string; highly_satisfied: number; satisfied: number; not_satisfied: number; total: number; percent: number };
export type Option = { id?: number; name?: string; label?: string; value?: string | number; subcity_id?: number };

export type ReportingDashboardResponse = {
  summary: { total_applications: number; approved_applications: number; rejected_applications: number; in_progress_applications: number };
  report: ReportRow[];
  feedback: FeedbackRow[];
  feedback_by_location: FeedbackLocationRow[];
  requires_filter?: boolean;
  filters: { levels: Option[]; subcities: Option[]; woredas: Option[]; times: Option[]; windows: Option[]; services: Option[]; officers: Option[]; statuses: string[] };
  scope: { role: string; level?: string | null; label: string };
};

export type ReportingDashboardParams = Record<string, string | number | undefined>;

export const reportingDashboardService = {
  async dashboard(): Promise<DashboardCardsResponse> {
    const response = await api.get("/admin/dashboard/reporting");
    const body = unwrap<{ data: DashboardCardsResponse }>(response);
    return body.data;
  },
  async report(params?: ReportingDashboardParams): Promise<ReportingDashboardResponse> {
    const response = await api.get("/admin/dashboard/reporting/report", { params });
    const body = unwrap<{ data: ReportingDashboardResponse }>(response);
    return body.data;
  },
};
