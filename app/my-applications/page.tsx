"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MyApplicationsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/my-applications");
  }, [router]);

  return null;
}
