"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { authService } from "@/services/auth/auth.service";

type PermissionGuardProps = {
  permission: string;
  children: ReactNode;
  redirectTo?: string;
  fallback?: ReactNode;
};

export default function PermissionGuard({
  permission,
  children,
  redirectTo,
  fallback,
}: PermissionGuardProps) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const permissions = useMemo(() => authService.getStoredPermissions(), []);
  const allowed = permissions.includes(permission);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || allowed || !redirectTo) return;
    router.replace(redirectTo);
  }, [allowed, ready, redirectTo, router]);

  if (!ready) return null;
  if (allowed) return <>{children}</>;
  if (redirectTo) return null;

  return fallback ?? (
    <Card className="border-destructive/30">
      <CardContent className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <div className="rounded-full bg-destructive/10 p-3 text-destructive">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">You are not authorized</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            You do not have the required permission: {permission}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
