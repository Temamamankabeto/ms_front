"use client";

import {
  BarChart3,
  CheckCircle2,
  Clock3,
  FileText,
  XCircle,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AnalyticsDashboardPage() {

  const stats = [
    {
      title: "Total Applications",
      value: "12,540",
      icon: FileText,
    },
    {
      title: "Approved",
      value: "10,240",
      icon: CheckCircle2,
    },
    {
      title: "Pending",
      value: "1,420",
      icon: Clock3,
    },
    {
      title: "Rejected",
      value: "880",
      icon: XCircle,
    },
  ];

  return (
    <div className="min-h-screen bg-muted/30 p-6">

      <div className="mx-auto max-w-7xl space-y-6">

        <div className="rounded-3xl border bg-background p-8 shadow-sm">

          <div className="flex items-center gap-4">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <BarChart3 className="h-7 w-7" />
            </div>

            <div>
              <h1 className="text-4xl font-bold tracking-tight">
                Enterprise Analytics
              </h1>

              <p className="mt-2 text-muted-foreground">
                Government service workflow and application insights.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

          {stats.map((stat) => (

            <Card
              key={stat.title}
              className="rounded-3xl"
            >

              <CardHeader className="flex flex-row items-center justify-between">

                <CardTitle className="text-base">
                  {stat.title}
                </CardTitle>

                <stat.icon className="h-5 w-5 text-primary" />
              </CardHeader>

              <CardContent>

                <div className="text-4xl font-bold">
                  {stat.value}
                </div>

                <p className="mt-2 text-sm text-muted-foreground">
                  Real-time enterprise metrics
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
