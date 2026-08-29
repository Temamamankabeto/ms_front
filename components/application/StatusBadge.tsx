import React from "react";

interface Props {
  status: string;
}

export default function StatusBadge({
  status,
}: Props) {

  const colors: Record<string, string> = {
    submitted: "bg-blue-100 text-blue-700",
    under_review: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    completed: "bg-emerald-100 text-emerald-700",
  };

  return (
    <span
      className={`rounded px-2 py-1 text-xs font-semibold ${
        colors[status] ||
        "bg-gray-100 text-gray-700"
      }`}
    >
      {status}
    </span>
  );
}
