"use client";

import {
  CheckCircle2,
  Clock3,
  FileText,
  RotateCcw,
  XCircle,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApplicationSummary } from "@/hooks/application-workflow/use-application-workflow";

const cards = [
  { key: "total", label: "Total", icon: FileText },
  { key: "submitted", label: "Submitted", icon: Clock3 },
  { key: "under_review", label: "Under Review", icon: Clock3 },
  { key: "returned", label: "Appointed", icon: RotateCcw },
  { key: "approved", label: "Approved", icon: CheckCircle2 },
  { key: "rejected", label: "Rejected", icon: XCircle },
  { key: "completed", label: "Completed", icon: CheckCircle2 },
];

export default function ApplicationSummaryPage() {
  const { data, isLoading } = useApplicationSummary();

  if (isLoading) return <div>Loading summary...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Application Summary</h1>
        <p className="text-sm text-muted-foreground">High-level service application analytics.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.key} className="rounded-3xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">{item.label}</CardTitle>
                <Icon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>

              <CardContent>
                <p className="text-3xl font-bold">{Number((data as any)?.[item.key] || 0)}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
