"use client";

import DashboardCard from "@/components/application/DashboardCard";
import { useDashboardStats } from "@/hooks/application/use-application";

export default function ApplicationsPage() {

  const { data } = useDashboardStats();

  const stats = data?.data || {};

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-2xl font-bold">
          Application Dashboard
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">

        <DashboardCard
          title="Total"
          value={stats.total || 0}
        />

        <DashboardCard
          title="Submitted"
          value={stats.submitted || 0}
        />

        <DashboardCard
          title="Approved"
          value={stats.approved || 0}
        />

        <DashboardCard
          title="Completed"
          value={stats.completed || 0}
        />
      </div>
    </div>
  );
}
