import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // The refresh_token is an HttpOnly cookie issued by the Laravel API host.
  // It is not necessarily available to Next.js on the frontend host.
  // Never use its absence here as proof that the user is logged out.

  const pathname = request.nextUrl.pathname;

  /**
   * =========================
   * PUBLIC ROUTES
   * =========================
   */
  const publicRoutes = [
  "/",
  "/login",
  "/register",

  // Fayda callback
  "/callback",

  "/about",
  "/news",
  "/service-provider",
  "/service-providers",
  "/resources",
  "/resources/reports",
  "/services",
  "/training/application-workflow",

  // Public kiosk feedback form — no login required at the service window.
  "/feedback",

  // Public MESOB ticket kiosk — no login required.
  "/ticket",
];

  const isServiceDetail = /^\/services\/\d+$/.test(pathname);
  const isApplyPage = /^\/services\/\d+\/apply$/.test(pathname);

  const isTrainingAsset = pathname.startsWith("/presentations/application-workflow/");
  const isTrainingPage = pathname.startsWith("/training/application-workflow");

  const isPublicRoute =
    publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`)) ||
    isServiceDetail ||
    isTrainingAsset ||
    isTrainingPage;

  // Authentication is validated by the dashboard's authenticated API request.
  // Public routes and private routes remain protected by their existing
  // client-side guards and Laravel's authorization middleware.
  // Do not redirect based on a cookie belonging to another origin.
  void isPublicRoute;
  void isApplyPage;

  return NextResponse.next();
}

/**
 * Apply middleware only where needed
 */
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};