"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import DashboardHeader from "@/layouts/components/DashboardHeader";
import Sidebar from "@/layouts/components/Sidebar";
import ChatbotWidget from "@/components/chatbot/ChatbotWidget";
import { authService } from "@/services/auth/auth.service";

export default function DashboardLayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        await authService.profile();

        if (active) {
          setAuthError(null);
          setReady(true);
        }
      } catch (error) {
        if (!active) return;

        setAuthError(
          error instanceof Error ? error.message : "Authentication session expired. Please login again."
        );

        setTimeout(() => {
          if (active) {
            router.replace("/login?redirect=/dashboard");
          }
        }, 900);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
        <div className="rounded-2xl border bg-card p-6 text-center shadow-sm">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm font-medium text-muted-foreground">
            Loading dashboard...
          </p>
          {authError ? (
            <p className="mt-2 text-sm text-destructive">{authError}</p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 md:pl-72">
      <Sidebar />

      <div className="flex min-h-screen min-w-0 flex-col">
        <DashboardHeader />

        <main className="min-w-0 flex-1 overflow-x-hidden p-4 md:p-6">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>

      <ChatbotWidget />
    </div>
  );
}
