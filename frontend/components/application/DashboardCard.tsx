import React from "react";

interface Props {
  title: string;
  value: number | string;
}

export default function DashboardCard({
  title,
  value,
}: Props) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">
        {title}
      </p>

      <h2 className="mt-2 text-3xl font-bold">
        {value}
      </h2>
    </div>
  );
}
