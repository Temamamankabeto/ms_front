"use client";

import { CheckCircle2, Circle, Clock3, Download, FileText, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { ServiceApplicationHistory, ServiceApplicationWorkflow } from "@/types/application-workflow";

type Props = {
  workflow?: ServiceApplicationWorkflow[];
  histories?: ServiceApplicationHistory[];
};

function statusLabel(status?: string | null) {
  return String(status || "-").replaceAll("_", " ");
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function appointmentDateLabel(item: any) {
  const date =
    item.metadata?.appointment_at ||
    item.metadata?.appointment_date ||
    item.appointment_at;

  if (!date) return item.remark || item.comment || null;

  const location = item.metadata?.appointment_location || item.metadata?.location;
  const message = item.metadata?.appointment_message || item.remark || item.comment;

  return [
    `Appointment Date: ${formatDateTime(date)}`,
    location ? `Location: ${location}` : null,
    message ? `Message: ${message}` : null,
  ].filter(Boolean).join(" • ");
}

function titleFromHistory(item: any) {
  const action = item.action || item.action_type || item.to_status || "workflow update";
  const windowName =
    item.to_window?.display_name ||
    item.toWindow?.display_name ||
    item.to_window?.name ||
    item.toWindow?.name;

  return windowName
    ? `${String(action).replaceAll("_", " ")} · ${windowName}`
    : String(action).replaceAll("_", " ");
}

function isDone(status?: string | null) {
  return ["completed", "closed", "approved", "back_officer_approved"].includes(String(status));
}

function isRejected(status?: string | null) {
  return ["rejected", "back_officer_rejected", "returned_to_customer"].includes(String(status));
}

function isActive(status?: string | null) {
  return [
    "submitted",
    "accepted",
    "under_review",
    "front_officer_review",
    "appointment_scheduled",
    "shared",
    "shared_to_front_officer",
    "shared_to_back_officer",
    "forwarded_to_back_officer",
    "back_officer_review",
    "under_back_review",
    "returned_to_front_officer",
    "escalated_to_manager",
  ].includes(String(status));
}

function fileUrl(file: any) {
  if (file.download_url) return file.download_url;
  if (!file.path) return "#";
  if (String(file.path).startsWith("http")) return file.path;
  return `/storage/${file.path}`;
}

function actionFiles(item: any) {
  return item.metadata?.files || item.files || [];
}

export default function ApplicationWorkflowTimeline({ workflow = [], histories = [] }: Props) {
  const historyItems = histories.map((item: any) => ({
    id: `history-${item.id}`,
    title: titleFromHistory(item),
    status: item.to_status || item.status,
    note: item.to_status === "appointment_scheduled" || item.action === "appointment_scheduled"
      ? appointmentDateLabel(item)
      : item.remark || item.comment,
    actor: item.actor?.name || item.sender?.name,
    receiver: item.receiver?.name,
    date: item.created_at,
    files: actionFiles(item),
  }));

  const workflowItems = workflow.map((item: any) => ({
    id: `workflow-${item.id}`,
    title: item.window?.display_name || item.window?.name || item.status || "workflow step",
    status: item.status,
    note: item.remark || item.comment,
    actor: item.officer?.name,
    receiver: null,
    date: item.acted_at || item.updated_at || item.created_at,
    files: actionFiles(item),
  }));

  const items = historyItems.length ? historyItems : workflowItems;

  if (!items.length) {
    return <p className="text-sm text-muted-foreground">No workflow history yet.</p>;
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => {
        const done = isDone(item.status);
        const rejected = isRejected(item.status);
        const active = isActive(item.status);

        return (
          <div key={item.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              {done ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : rejected ? (
                <XCircle className="h-5 w-5 text-red-600" />
              ) : active ? (
                <Clock3 className="h-5 w-5 text-amber-600" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}

              {index < items.length - 1 && <div className="mt-2 h-full w-px bg-border" />}
            </div>

            <div className={cn("flex-1 rounded-2xl border p-4", active && "bg-amber-50")}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-semibold capitalize">{item.title}</h4>
                <span className="rounded-full bg-muted px-2 py-1 text-xs capitalize">
                  {statusLabel(item.status)}
                </span>
              </div>

              <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                {item.actor && <span>By: {item.actor}</span>}
                {item.receiver && <span>To: {item.receiver}</span>}
                <span>Action Time: {formatDateTime(item.date)}</span>
              </div>

              {item.note && <p className="mt-2 text-sm text-muted-foreground">{item.note}</p>}

              {item.files?.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">Action Attachments</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {item.files.map((file: any) => (
                      <a
                        key={file.id || file.path || file.original_name}
                        href={fileUrl(file)}
                        target="_blank"
                        rel="noreferrer"
                        download
                        className="flex items-center justify-between gap-2 rounded-xl border bg-background px-3 py-2 text-sm transition hover:bg-muted"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="truncate">{file.original_name || "Attachment"}</span>
                        </span>
                        <Download className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
