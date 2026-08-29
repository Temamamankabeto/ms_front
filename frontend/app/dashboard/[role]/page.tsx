import { notFound } from "next/navigation";
import {
  Activity,
  Bell,
  Building2,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileText,
  Layers3,
  ShieldCheck,
  UserCheck,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import {
  dashboardConfig,
  type AppRoleKey,
} from "@/config/dashboard.config";

function random(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateDashboardData(role: string) {
  const commonCharts = [
    {
      title: "Monthly Applications",
      value: random(1000, 10000),
    },
    {
      title: "Applications by Status",
      value: random(100, 5000),
    },
    {
      title: "Applications by Location",
      value: random(100, 3000),
    },
  ];

  const recentActivities = [
    "New application submitted",
    "Application approved",
    "Officer assigned",
    "Document uploaded",
    "Payment completed",
    "Workflow updated",
    "Application rejected",
    "Verification completed",
  ];

  switch (role) {
    case "super-admin":
      return {
        widgets: [
          {
            title: "Total Users",
            value: random(10000, 50000),
            icon: Users,
          },
          {
            title: "Total Applications",
            value: random(30000, 100000),
            icon: FileText,
          },
          {
            title: "Total Services",
            value: random(50, 300),
            icon: Layers3,
          },
          {
            title: "Pending Requests",
            value: random(100, 5000),
            icon: Clock3,
          },
          {
            title: "Approved Requests",
            value: random(10000, 70000),
            icon: CheckCircle2,
          },
          {
            title: "Rejected Requests",
            value: random(100, 3000),
            icon: XCircle,
          },
          {
            title: "System Activity",
            value: `${random(90, 100)}%`,
            icon: Activity,
          },
          {
            title: "Revenue",
            value: `ETB ${random(1, 9)}.${random(1, 9)}M`,
            icon: Wallet,
          },
        ],
        charts: commonCharts,
        activities: recentActivities,
      };

    case "city-admin":
      return {
        widgets: [
          {
            title: "City Statistics",
            value: random(1000, 20000),
            icon: Building2,
          },
          {
            title: "Subcity Performance",
            value: `${random(70, 99)}%`,
            icon: Activity,
          },
          {
            title: "Pending Approvals",
            value: random(50, 2000),
            icon: Clock3,
          },
          {
            title: "Officer Performance",
            value: `${random(70, 99)}%`,
            icon: UserCheck,
          },
        ],
        charts: commonCharts,
        activities: recentActivities,
      };

    case "subcity-admin":
      return {
        widgets: [
          {
            title: "Woreda Performance",
            value: `${random(70, 99)}%`,
            icon: Activity,
          },
          {
            title: "Application Workflow",
            value: random(100, 5000),
            icon: Layers3,
          },
          {
            title: "Assigned Officers",
            value: random(10, 200),
            icon: Users,
          },
        ],
        charts: commonCharts,
        activities: recentActivities,
      };

    case "woreda-admin":
      return {
        widgets: [
          {
            title: "Local Applications",
            value: random(100, 5000),
            icon: FileText,
          },
          {
            title: "Front Officer Monitoring",
            value: random(5, 100),
            icon: UserCheck,
          },
          {
            title: "Back Officer Monitoring",
            value: random(5, 100),
            icon: ShieldCheck,
          },
          {
            title: "Reports",
            value: random(1, 100),
            icon: FileCheck2,
          },
        ],
        charts: commonCharts,
        activities: recentActivities,
      };

    case "front-officer":
      return {
        widgets: [
          {
            title: "New Applications",
            value: random(10, 300),
            icon: FileText,
          },
          {
            title: "Verification Queue",
            value: random(5, 100),
            icon: Clock3,
          },
          {
            title: "Assigned Requests",
            value: random(10, 200),
            icon: UserCheck,
          },
        ],
        charts: commonCharts,
        activities: recentActivities,
      };

    case "back-officer":
      return {
        widgets: [
          {
            title: "Processing Queue",
            value: random(10, 500),
            icon: Activity,
          },
          {
            title: "Approvals",
            value: random(100, 3000),
            icon: CheckCircle2,
          },
          {
            title: "Rejections",
            value: random(1, 500),
            icon: XCircle,
          },
          {
            title: "Workflow Actions",
            value: random(100, 5000),
            icon: Layers3,
          },
        ],
        charts: commonCharts,
        activities: recentActivities,
      };

    case "feedback":
      return {
        widgets: [
          {
            title: "Total Feedback",
            value: random(100, 5000),
            icon: FileText,
          },
          {
            title: "Highly Satisfied",
            value: random(50, 3000),
            icon: CheckCircle2,
          },
          {
            title: "Not Satisfied",
            value: random(1, 500),
            icon: XCircle,
          },
          {
            title: "This Week",
            value: random(10, 500),
            icon: Clock3,
          },
        ],
        charts: commonCharts,
        activities: recentActivities,
      };

    default:
      return {
        widgets: [
          {
            title: "My Applications",
            value: random(1, 30),
            icon: FileText,
          },
          {
            title: "Timeline Tracking",
            value: random(1, 10),
            icon: Clock3,
          },
          {
            title: "Notifications",
            value: random(1, 50),
            icon: Bell,
          },
          {
            title: "Uploaded Documents",
            value: random(1, 100),
            icon: FileCheck2,
          },
        ],
        charts: commonCharts,
        activities: recentActivities,
      };
  }
}

export default async function RoleDashboardPage({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;

  const config = dashboardConfig[role as AppRoleKey];

  if (!config) notFound();

  const dashboardData = generateDashboardData(role);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="rounded-3xl border bg-card p-6 shadow-sm">
        <h1 className="text-3xl font-bold">
          {config.title}
        </h1>

        <p className="mt-2 text-muted-foreground">
          {config.subtitle}
        </p>
      </div>

      {/* WIDGETS */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardData.widgets.map((widget: any) => {
          const Icon = widget.icon;

          return (
            <Card key={widget.title} className="rounded-3xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardDescription>
                    {widget.title}
                  </CardDescription>

                  <CardTitle className="mt-2 text-3xl">
                    {widget.value}
                  </CardTitle>
                </div>

                <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {/* CHARTS */}
      <div className="grid gap-4 lg:grid-cols-3">
        {dashboardData.charts.map((chart: any) => (
          <Card key={chart.title} className="rounded-3xl">
            <CardHeader>
              <CardTitle>{chart.title}</CardTitle>

              <CardDescription>
                Dynamic mock analytics
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed bg-muted/20">
                <div className="text-center">
                  <p className="text-4xl font-bold">
                    {chart.value}
                  </p>

                  <p className="mt-2 text-sm text-muted-foreground">
                    Analytics Placeholder
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* RECENT ACTIVITIES */}
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>

          <CardDescription>
            Latest workflow activities
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {dashboardData.activities.map(
            (activity: string, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-2xl border p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-2 text-primary">
                    <Activity className="h-4 w-4" />
                  </div>

                  <span>{activity}</span>
                </div>

                <Badge>Live</Badge>
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}