import * as React from "react";

import { cn } from "@/lib/utils";

type ChartContainerProps = React.ComponentProps<"div"> & {
  title?: string;
  description?: string;
};

function ChartContainer({ className, title, description, children, ...props }: ChartContainerProps) {
  return (
    <div
      data-slot="chart-container"
      className={cn("rounded-xl border bg-card p-4 text-card-foreground shadow-sm", className)}
      {...props}
    >
      {(title || description) && (
        <div className="mb-4 space-y-1">
          {title && <p className="text-sm font-semibold leading-none">{title}</p>}
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

type ChartBarRow = {
  label: string;
  value: number;
  suffix?: string;
};

type ChartBarListProps = React.ComponentProps<"div"> & {
  data: ChartBarRow[];
  valueFormatter?: (value: number) => string;
  emptyLabel?: string;
};

function ChartBarList({ className, data, valueFormatter, emptyLabel = "No chart data", ...props }: ChartBarListProps) {
  const maxValue = Math.max(...data.map((row) => Number(row.value) || 0), 0);

  if (!data.length || maxValue <= 0) {
    return <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{emptyLabel}</div>;
  }

  return (
    <div data-slot="chart-bar-list" className={cn("space-y-3", className)} {...props}>
      {data.map((row) => {
        const value = Number(row.value) || 0;
        const percent = Math.max(4, Math.min(100, (value / maxValue) * 100));

        return (
          <div key={row.label} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="truncate font-medium">{row.label}</span>
              <span className="shrink-0 text-muted-foreground">{valueFormatter ? valueFormatter(value) : value.toLocaleString()}{row.suffix ?? ""}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export { ChartContainer, ChartBarList };
export type { ChartBarRow };
