"use client";

import SidebarContent from "@/layouts/components/SidebarContent";

type SidebarProps = {
  collapsed?: boolean;
};

export default function Sidebar({ collapsed = false }: SidebarProps) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r bg-background shadow-sm md:block">
      <SidebarContent collapsed={collapsed} />
    </aside>
  );
}
