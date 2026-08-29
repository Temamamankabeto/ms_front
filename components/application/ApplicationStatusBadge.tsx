"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusClass: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 hover:bg-slate-100",
  submitted: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  front_officer_review: "bg-indigo-100 text-indigo-700 hover:bg-indigo-100",
  shared_to_front_officer: "bg-purple-100 text-purple-700 hover:bg-purple-100",
  returned_to_customer: "bg-orange-100 text-orange-700 hover:bg-orange-100",
  forwarded_to_back_officer: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  back_officer_review: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  back_officer_approved: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  returned: "bg-orange-100 text-orange-700 hover:bg-orange-100",
  approved: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  rejected: "bg-red-100 text-red-700 hover:bg-red-100",
  completed: "bg-green-100 text-green-700 hover:bg-green-100",
};

export default function ApplicationStatusBadge({ status }: { status?: string | null }) {
  const value = status || "unknown";

  return (
    <Badge className={cn("rounded-full capitalize", statusClass[value] ?? "bg-muted text-muted-foreground")}>
      {value.replaceAll("_", " ")}
    </Badge>
  );
}
