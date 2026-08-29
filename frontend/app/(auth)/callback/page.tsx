"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth/auth.service";

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    async function processLogin() {
      try {
        const params = new URLSearchParams(
          window.location.search
        );

        const code = params.get("code");

        if (!code) {
          console.error("No code received");
          router.replace("/login");
          return;
        }

        const response =
          await authService.faydaLogin(code);

        console.log("Fayda Response:", response);

        authService.saveSession(response);

        // Save token

        // Get role from backend response
        const role =
          response.user?.roles?.[0]?.name ||
          response.user?.role ||
          "customer";

        // Redirect based on role
        switch (role.toLowerCase()) {
          case "customer":
            router.replace("/dashboard");
            break;

          case "admin":
            router.replace("/dashboard");
            break;

          case "service_provider":
            router.replace("/dashboard");
            break;

          default:
            router.replace("/dashboard");
        }
      } catch (error) {
        console.error(
          "Fayda Login Error:",
          error
        );

        router.replace("/login");
      }
    }

    processLogin();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      Processing Fayda Login...
    </div>
  );
}