"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { authService } from "@/services/auth/auth.service";

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    async function processLogin() {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");

        if (!code) {
          console.error("No code received");
          router.replace("/login");
          return;
        }

        const response = await authService.faydaLogin(code);

        console.log("Fayda Response:", response);

        authService.saveSession(response);

        const role =
          response.user?.roles?.[0] ||
          response.user?.role ||
          "customer";

        switch (role.toLowerCase()) {
          case "customer":
          case "admin":
          case "service_provider":
            router.replace("/dashboard");
            break;

          default:
            router.replace("/dashboard");
            break;
        }
      } catch (error) {
        console.error("Fayda Login Error:", error);
        router.replace("/login");
      }
    }

    void processLogin();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      Processing Fayda Login...
    </div>
  );
}