"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-xl font-bold text-red-500">
        You are not allowed to access this page
      </h1>

      <p className="text-sm text-muted-foreground">
        You don’t have permission to access this resource.
      </p>

      <div className="flex gap-3">
        <Button onClick={() => router.push("/services")}>
          Go Services
        </Button>

        <Button
          variant="outline"
          onClick={() => router.push("/dashboard")}
        >
          Go Dashboard
        </Button>
      </div>
    </div>
  );
}