"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import ApplicationFilesList from "@/components/application/ApplicationFilesList";
import ApplicationStatusBadge from "@/components/application/ApplicationStatusBadge";
import ApplicationWorkflowTimeline from "@/components/application/ApplicationWorkflowTimeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useBackOfficerApplicationAction,
  useOfficerApplication,
  useOfficerApplicationAction,
  useManagerApplicationAction,
  useOfficerSharingOfficers,
  useOfficerSharingWindows,
} from "@/hooks/application-workflow/use-application-workflow";
import { authService } from "@/services/auth/auth.service";

type FrontAction =
  | "accept"
  | "complete"
  | "return"
  | "reject"
  | "forward-to-back-officer"
  | "appointment"
  | "share-to-officer";

type BackAction =
  | "approve"
  | "reject"
  | "return"
  | "share"
  | "escalate-to-manager";

type ManagerAction =
  | "assign_officer"
  | "return_to_officer"
  | "escalate_up";

type PendingAction =
  | {
      actor: "front";
      action: FrontAction;
      label: string;
      requiresShare?: boolean;
    }
  | {
      actor: "back";
      action: BackAction;
      label: string;
      requiresShare?: boolean;
    }
  | {
      actor: "manager";
      action: ManagerAction;
      label: string;
      requiresShare?: boolean;
    };

function storedRoles() {
  return authService
    .getStoredRoles()
    .map((role) => String(role).toLowerCase());
}



function latestAppointment(application: any) {
  if (Array.isArray(application?.appointments) && application.appointments.length) {
    return application.appointments[0];
  }

  if (application?.appointment_at) {
    return {
      appointment_at: application.appointment_at,
      location: application.appointment_location,
      message: application.appointment_message,
      status: application.appointment_status,
    };
  }

  return null;
}

function isAppointmentStatus(application: any) {
  const status = normalize(application?.status);
  const stage = normalize(application?.current_stage);

  return status === "appointment_scheduled" || stage === "appointment_scheduled";
}

function isAppointmentLocked(application: any) {
  if (!isAppointmentStatus(application)) {
    return false;
  }

  const appointment = latestAppointment(application);

  /*
  |--------------------------------------------------------------------------
  | Fail-safe
  |--------------------------------------------------------------------------
  | If the application is appointment_scheduled but appointment_at is missing
  | from the API, keep actions locked instead of allowing work before appointment.
  */
  if (!appointment?.appointment_at) {
    return true;
  }

  return new Date(appointment.appointment_at).getTime() > Date.now();
}

function formatAppointmentDateTime(value?: string | null) {
  if (!value) return "appointment date not loaded";

  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}


function isBackOfficer() {
  return storedRoles().some((role) => role.includes("back"));
}

function isFrontOfficer() {
  return storedRoles().some((role) => role.includes("front"));
}

function isManager() {
  return storedRoles().some((role) => role.includes("manager"));
}

function normalize(value?: string | null) {
  return String(value || "").toLowerCase();
}

function isFinalStatus(status?: string | null) {
  return ["completed", "rejected", "returned_to_customer", "cancelled"].includes(
    normalize(status)
  );
}

function isBackApproved(status?: string | null, stage?: string | null) {
  const current = normalize(status);
  const currentStage = normalize(stage);

  return [
    "approved",
    "back_officer_approved",
    "returned_to_front_officer",
  ].includes(current) || [
    "approved",
    "back_officer_approved",
    "returned_to_front_officer",
  ].includes(currentStage);
}

function isBackOfficerDecisionDone(status?: string | null, stage?: string | null) {
  const current = normalize(status);
  const currentStage = normalize(stage);

  return [
    "back_officer_approved",
    "back_officer_rejected",
    "returned_to_front_officer",
    "approved",
  ].includes(current) || [
    "back_officer_approved",
    "back_officer_rejected",
    "returned_to_front_officer",
    "approved",
  ].includes(currentStage);
}

function isBackRejected(status?: string | null, stage?: string | null) {
  const current = normalize(status);
  const currentStage = normalize(stage);

  return [
    "back_officer_rejected",
    "returned_from_back_officer",
    "returned_to_front_officer_rejected",
  ].includes(current) || [
    "back_officer_rejected",
    "returned_from_back_officer",
    "returned_to_front_officer_rejected",
  ].includes(currentStage);
}

function sharingWindowDisplayName(window: any) {
  if (!window) return "Window";
  return window.display_name || window.name || "Window";
}

function officerRoleName(officer: any) {
  return String(
    officer?.role ||
      officer?.role_names?.[0] ||
      officer?.roles?.[0]?.name ||
      ""
  ).toLowerCase();
}

export default function OfficerApplicationDetailPage() {
  const params = useParams();
  const id = Number(params.id);

  const { data, isLoading } = useOfficerApplication(id);
  const frontAction = useOfficerApplicationAction(id);
  const backAction = useBackOfficerApplicationAction(id);
  const managerAction = useManagerApplicationAction(id);

  const [remark, setRemark] = useState("");
  const [documents, setDocuments] = useState<File[]>([]);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [appointmentLocation, setAppointmentLocation] = useState("");
  const [shareWindowId, setShareWindowId] = useState<number | undefined>();
  const [shareOfficerId, setShareOfficerId] = useState<number | undefined>();
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [actionSubmitted, setActionSubmitted] = useState(false);

  const shouldFetchSharing = pendingAction?.requiresShare === true;
  const sharingParams = shouldFetchSharing
    ? {
        service_id: data?.service_id || data?.service?.id,
        level: data?.administrative_level,
      }
    : false;

  const { data: shareWindows = [], isLoading: loadingShareWindows } =
    useOfficerSharingWindows(sharingParams);

  const { data: rawShareOfficers = [], isLoading: loadingShareOfficers } =
    useOfficerSharingOfficers(shareWindowId, shouldFetchSharing);

  const front = isFrontOfficer();
  const back = isBackOfficer();
  const manager = isManager();
  const files = useMemo(() => documents, [documents]);

  const status = data?.status;
  const stage = data?.current_stage;
const serviceHasBackOfficer = Boolean(
  (data?.service as { has_back_officer?: boolean | number } | null | undefined)
    ?.has_back_officer
);
  const backApproved = isBackApproved(status, stage);
  const backRejected = isBackRejected(status, stage);
  const backDecisionDone = back && isBackOfficerDecisionDone(status, stage);
  const appointment = latestAppointment(data);
  const appointmentLocked = isAppointmentLocked(data);
  const actionVisible = !isFinalStatus(status) && !actionSubmitted && !appointmentLocked && !backDecisionDone;

  const shareOfficers = useMemo(() => {
    if (!pendingAction?.requiresShare) return [];

    return rawShareOfficers.filter((officer: any) => {
      const role = officerRoleName(officer);

      if (pendingAction.actor === "manager") {
        return role.includes("front") || role.includes("back");
      }

      if (pendingAction.actor === "back") {
        return role.includes("back");
      }

      return role.includes("front");
    });
  }, [rawShareOfficers, pendingAction]);

  const frontActions = useMemo<PendingAction[]>(() => {
    if (!front || !actionVisible) return [];

    const appointmentAction: PendingAction = {
      actor: "front",
      action: "appointment",
      label: "Set Appointment",
    };

    const shareAction: PendingAction = {
      actor: "front",
      action: "share-to-officer",
      label: "Share with Another Officer",
      requiresShare: true,
    };

    if (backApproved) {
      return [
        appointmentAction,
        { actor: "front", action: "complete", label: "Accept & Complete" },
        shareAction,
      ];
    }

    if (backRejected) {
      return [
        appointmentAction,
        {
          actor: "front",
          action: "reject",
          label: "Reject & Return to Customer",
        },
        shareAction,
      ];
    }

    if (serviceHasBackOfficer) {
      return [
        appointmentAction,
        {
          actor: "front",
          action: "forward-to-back-officer",
          label: "Accept & Forward to Back Officer",
        },
        {
          actor: "front",
          action: "reject",
          label: "Reject & Return to Customer",
        },
        shareAction,
      ];
    }

    return [
      appointmentAction,
      {
        actor: "front",
        action: "complete",
        label: "Accept & Complete",
      },
      {
        actor: "front",
        action: "reject",
        label: "Reject & Return to Customer",
      },
      shareAction,
    ];
  }, [front, actionVisible, serviceHasBackOfficer, backApproved, backRejected]);

  const backActions = useMemo<PendingAction[]>(() => {
    if (!back || !actionVisible) return [];

    return [
      {
        actor: "back",
        action: "approve",
        label: "Approve & Return to Front Officer",
      },
      {
        actor: "back",
        action: "reject",
        label: "Reject & Return to Front Officer",
      },
      {
        actor: "back",
        action: "share",
        label: "Share with Another Back Officer",
        requiresShare: true,
      },
      {
        actor: "back",
        action: "escalate-to-manager",
        label: "Escalate to Manager",
      },
    ];
  }, [back, actionVisible, backDecisionDone]);

  const managerActions = useMemo<PendingAction[]>(() => {
    if (!manager || !actionVisible) return [];

    return [
      {
        actor: "manager",
        action: "assign_officer",
        label: "Assign to Officer",
        requiresShare: true,
      },
      {
        actor: "manager",
        action: "return_to_officer",
        label: "Return to Officer",
      },
      {
        actor: "manager",
        action: "escalate_up",
        label: "Escalate Up",
      },
    ];
  }, [manager, actionVisible]);

  const activeActions = manager ? managerActions : back ? backActions : frontActions;

  function resetActionForm() {
    setPendingAction(null);
    setRemark("");
    setDocuments([]);
    setAppointmentDate("");
    setAppointmentTime("");
    setAppointmentLocation("");
    setShareWindowId(undefined);
    setShareOfficerId(undefined);
  }

  async function submitFrontAction(action: PendingAction) {
    if (action.actor !== "front") return;

    if (action.requiresShare) {
      if (!shareWindowId || !shareOfficerId) {
        toast.error("Select window and officer.");
        return;
      }

      await frontAction.mutateAsync({
        action: "share-to-officer",
        payload: {
          to_window_id: shareWindowId,
          to_officer_id: shareOfficerId,
          note: remark,
          remark,
        },
      });

      return;
    }

    if (action.action === "appointment") {
      if (!appointmentDate || !appointmentTime) {
        toast.error("Select appointment date and time.");
        return;
      }

      await frontAction.mutateAsync({
        action: "appointment",
        payload: {
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          appointment_location: appointmentLocation,
          message: remark,
          remark,
          documents: files,
        },
      });

      return;
    }

    await frontAction.mutateAsync({
      action: action.action,
      payload: {
        remark,
        note: remark,
        reason: remark,
        documents: files,
      },
    });
  }

  async function submitBackAction(action: PendingAction) {
    if (action.actor !== "back") return;

    if (action.action === "share") {
      if (!shareWindowId || !shareOfficerId) {
        toast.error("Select window and back officer.");
        return;
      }

      await backAction.mutateAsync({
        action: "share",
        payload: {
          to_window_id: shareWindowId,
          to_officer_id: shareOfficerId,
          window_id: shareWindowId,
          officer_id: shareOfficerId,
          note: remark,
          remark,
          documents: files,
        },
      });

      return;
    }

    await backAction.mutateAsync({
      action: action.action,
      payload: {
        remark,
        note: remark,
        reason: remark,
        documents: files,
      },
    });
  }

  async function submitManagerAction(action: PendingAction) {
    if (action.actor !== "manager") return;

    if (action.action === "assign_officer") {
      if (!shareWindowId || !shareOfficerId) {
        toast.error("Select window and officer.");
        return;
      }

      await managerAction.mutateAsync({
        action: "assign_officer",
        payload: {
          window_id: shareWindowId,
          officer_id: shareOfficerId,
          note: remark,
          remark,
          documents: files,
        },
      });

      return;
    }

    await managerAction.mutateAsync({
      action: action.action,
      payload: {
        remark,
        note: remark,
        reason: remark,
        documents: files,
      },
    });
  }

  async function submitSelectedAction() {
    if (!pendingAction) return;

    try {
      if (pendingAction.actor === "front") {
        await submitFrontAction(pendingAction);
      } else if (pendingAction.actor === "back") {
        await submitBackAction(pendingAction);
      } else {
        await submitManagerAction(pendingAction);
      }

      setActionSubmitted(true);
      resetActionForm();
      toast.success("Action completed successfully.");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          Object.values(error?.response?.data?.errors || {})?.flat()?.[0] ||
          error?.message ||
          "Action failed"
      );
    }
  }

  function selectAction(value: string) {
    const action = activeActions.find((item) => item.action === value);

    setPendingAction(action || null);
    setRemark("");
    setDocuments([]);
    setAppointmentDate("");
    setAppointmentTime("");
    setAppointmentLocation("");
    setShareWindowId(undefined);
    setShareOfficerId(undefined);
  }

  if (isLoading) return <div>Loading application...</div>;
  if (!data) return <div>Application not found.</div>;

  return (
    <div className="space-y-6">
      <Button asChild variant="outline">
        <Link href="/dashboard/officer/applications">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Queue
        </Link>
      </Button>

      <div className="rounded-3xl border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{data.tracking_number}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.service?.name} · {data.customer?.name || data.customer_id}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Level: {data.administrative_level || "-"} · Window:{" "}
              {data.current_window?.name || data.current_window_id || "-"}
            </p>
          </div>

          <ApplicationStatusBadge status={data.status} />
        </div>
      </div>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Workflow Action</CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          {actionVisible && activeActions.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-3">
              {backDecisionDone && (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
              <p className="font-semibold">Back officer decision already completed.</p>
              <p className="mt-1">
                This application has already been approved/rejected by the back officer and returned to the front officer.
              </p>
            </div>
          )}

          {appointmentLocked && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  <p className="font-semibold">Appointment Scheduled</p>
                  <p className="mt-1">
                    This application is locked until the appointment date and time:
                    <span className="ml-1 font-semibold">
                      {formatAppointmentDateTime(appointment?.appointment_at)}
                    </span>
                  </p>
                  {appointment?.location && (
                    <p className="mt-1">Location: {appointment.location}</p>
                  )}
                  {appointment?.message && (
                    <p className="mt-1">Message: {appointment.message}</p>
                  )}
                </div>
              )}

              {appointmentLocked && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  <p className="font-semibold">Appointment Scheduled</p>
                  <p className="mt-1">
                    Officer actions are disabled until:
                    <span className="ml-1 font-semibold">
                      {formatAppointmentDateTime(appointment?.appointment_at)}
                    </span>
                  </p>
                  {appointment?.location && <p className="mt-1">Location: {appointment.location}</p>}
                  {appointment?.message && <p className="mt-1">Message: {appointment.message}</p>}
                </div>
              )}

              <div>
                <label className="text-sm font-medium">
                  {manager ? "Manager Action" : back ? "Back Officer Action" : "Front Officer Action"}
                </label>
                <select
                  className="mt-2 w-full rounded-md border bg-background p-3 text-sm"
                  value={pendingAction?.action || ""}
                  disabled={appointmentLocked || backDecisionDone || activeActions.length === 0}
                  onChange={(event) => selectAction(event.target.value)}
                >
                  <option value="">Select action</option>
                  {activeActions.map((action) => (
                    <option key={action.action} value={action.action}>
                      {action.label}
                    </option>
                  ))}
                </select>
              </div>

              {pendingAction?.requiresShare && (
                <>
                  <div>
                    <label className="text-sm font-medium">Window</label>
                    <select
                      className="mt-2 w-full rounded-md border bg-background p-3 text-sm"
                      value={shareWindowId || ""}
                      onChange={(event) => {
                        setShareWindowId(
                          event.target.value
                            ? Number(event.target.value)
                            : undefined
                        );
                        setShareOfficerId(undefined);
                      }}
                    >
                      <option value="">
                        {loadingShareWindows ? "Loading windows..." : "Select window"}
                      </option>
                      {!loadingShareWindows && shareWindows.length === 0 && (
                        <option value="" disabled>No windows available</option>
                      )}
                      {shareWindows.map((window) => (
                        <option key={window.id} value={window.id}>
                          {window.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">
                      {manager ? "Officer" : back ? "Back Officer" : "Front Officer"}
                    </label>
                    <select
                      className="mt-2 w-full rounded-md border bg-background p-3 text-sm"
                      value={shareOfficerId || ""}
                      onChange={(event) =>
                        setShareOfficerId(
                          event.target.value
                            ? Number(event.target.value)
                            : undefined
                        )
                      }
                      disabled={!shareWindowId}
                    >
                      <option value="">
                        {loadingShareOfficers ? "Loading officers..." : "Select officer"}
                      </option>
                      {!loadingShareOfficers && shareWindowId && shareOfficers.length === 0 && (
                        <option value="" disabled>No officers available</option>
                      )}
                      {shareOfficers.map((officer) => (
                        <option key={officer.id} value={officer.id}>
                          {officer.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              No actions available for the current status, or action already submitted successfully.
            </div>
          )}

          {pendingAction && !appointmentLocked && !backDecisionDone && (
            <div className="space-y-5 rounded-2xl border bg-muted/20 p-4">
              <div>
                <h3 className="font-semibold">{pendingAction.label}</h3>
                <p className="text-sm text-muted-foreground">
                  Add note/description and attach files before submitting.
                </p>
              </div>

              {pendingAction?.action === "appointment" && (
                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <label className="text-sm font-medium">Appointment Date</label>
                    <input
                      type="date"
                      className="mt-2 w-full rounded-md border bg-background p-3 text-sm"
                      value={appointmentDate}
                      onChange={(event) => setAppointmentDate(event.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Appointment Time</label>
                    <input
                      type="time"
                      className="mt-2 w-full rounded-md border bg-background p-3 text-sm"
                      value={appointmentTime}
                      onChange={(event) => setAppointmentTime(event.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Appointment Location</label>
                    <input
                      type="text"
                      className="mt-2 w-full rounded-md border bg-background p-3 text-sm"
                      value={appointmentLocation}
                      onChange={(event) => setAppointmentLocation(event.target.value)}
                      placeholder="Office location"
                    />
                  </div>
                </div>
              )}

              <textarea
                className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={remark}
                onChange={(event) => setRemark(event.target.value)}
                placeholder="Description, comment, note, or reason"
              />

              <div className="space-y-2">
                <label className="text-sm font-medium">Attach Documents</label>
                <input
                  type="file"
                  multiple
                  className="block w-full rounded-md border bg-background p-2 text-sm"
                  onChange={(event) =>
                    setDocuments(Array.from(event.target.files || []))
                  }
                />
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetActionForm}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={submitSelectedAction}
                  disabled={
                    frontAction.isPending ||
                    backAction.isPending ||
                    managerAction.isPending ||
                    (pendingAction.requiresShare &&
                      (!shareWindowId || !shareOfficerId))
                  }
                >
                  Submit
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="rounded-3xl xl:col-span-2">
          <CardHeader>
            <CardTitle>Submitted Data</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {data.data?.length ? (
              data.data.map((item) => (
                <div key={item.id} className="grid gap-2 rounded-2xl border p-4 md:grid-cols-3">
                  <div className="font-medium">{item.field_name}</div>
                  <div className="text-muted-foreground md:col-span-2">
                    {item.field_value || "-"}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No data submitted.</p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Applicant</CardTitle>
          </CardHeader>

          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Name:</span>{" "}
              {data.customer?.name || data.customer_id}
            </p>
            <p>
              <span className="text-muted-foreground">Email:</span>{" "}
              {data.customer?.email || "-"}
            </p>
            <p>
              <span className="text-muted-foreground">Phone:</span>{" "}
              {data.customer?.phone || "-"}
            </p>
            <p>
              <span className="text-muted-foreground">Submitted:</span>{" "}
              {data.submitted_at
                ? new Date(data.submitted_at).toLocaleString()
                : "-"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Files</CardTitle>
          </CardHeader>
          <CardContent>
            <ApplicationFilesList files={data.files} />
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Workflow History & Action Attachments</CardTitle>
          </CardHeader>
          <CardContent>
            <ApplicationWorkflowTimeline
              workflow={data.workflow}
              histories={data.histories}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
