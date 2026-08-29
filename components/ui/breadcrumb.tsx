import * as React from "react";
import Link from "next/link";

export function Breadcrumb({ children, ...props }: React.ComponentProps<"nav">) {
  return <nav aria-label="breadcrumb" {...props}>{children}</nav>;
}
export function BreadcrumbList({ children, className = "flex items-center gap-2 text-sm text-muted-foreground", ...props }: React.ComponentProps<"ol">) {
  return <ol className={className} {...props}>{children}</ol>;
}
export function BreadcrumbItem({ children, ...props }: React.ComponentProps<"li">) {
  return <li className="inline-flex items-center gap-2" {...props}>{children}</li>;
}
export function BreadcrumbLink({ href = "#", children, ...props }: React.ComponentProps<typeof Link>) {
  return <Link href={href} {...props}>{children}</Link>;
}
export function BreadcrumbPage({ children, ...props }: React.ComponentProps<"span">) {
  return <span aria-current="page" className="font-medium text-foreground" {...props}>{children}</span>;
}
export function BreadcrumbSeparator(props: React.ComponentProps<"span">) {
  return <span aria-hidden="true" {...props}>/</span>;
}
