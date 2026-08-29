<?php

namespace App\Http\Middleware;

use App\Support\AppRoles;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnforceIdleSessionTimeout
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return $next($request);
        }

        if (array_key_exists('is_active', $user->getAttributes()) && !$user->is_active) {
            $user->tokens()->delete();

            return response()
                ->json([
                    'success' => false,
                    'message' => 'Your account is disabled. Please contact the administrator.',
                    'data' => null,
                    'meta' => null,
                ], 403)
                ->withoutCookie('refresh_token');
        }

        $timeoutMinutes = $this->timeoutMinutes($user);

        /*
         * Sanctum may authenticate requests through:
         * 1. Bearer personal access token.
         * 2. SPA/session cookie.
         *
         * currentAccessToken() is not always a PersonalAccessToken object.
         * Some token variants do not have last_used_at, delete(), or forceFill().
         * This middleware must therefore check capabilities before using them,
         * otherwise /api/auth/me can fail with HTTP 500 and the dashboard stays blank.
         */
        $token = $user->currentAccessToken();

        if ($token && method_exists($token, 'forceFill')) {
            $lastUsedAt = $token->last_used_at ?? null;

            if ($lastUsedAt && $lastUsedAt->copy()->addMinutes($timeoutMinutes)->isPast()) {
                if (method_exists($token, 'delete')) {
                    $token->delete();
                }

                return $this->expiredResponse($timeoutMinutes);
            }

            $token->forceFill(['last_used_at' => now()])->save();

            return $next($request);
        }

        /*
         * Cookie/session fallback. Only use session APIs when a session really exists.
         */
        if ($request->hasSession()) {
            $session = $request->session();
            $lastActivity = $session->get('last_activity_at');

            if ($lastActivity && now()->parse($lastActivity)->addMinutes($timeoutMinutes)->isPast()) {
                $session->invalidate();
                $session->regenerateToken();
                $user->tokens()->delete();

                return $this->expiredResponse($timeoutMinutes);
            }

            $session->put('last_activity_at', now()->toISOString());
        }

        return $next($request);
    }

    protected function timeoutMinutes($user): int
    {
        $role = AppRoles::normalize($user->roles()->pluck('name')->first());

        if (in_array($role, [AppRoles::SUPER_ADMIN, AppRoles::ADMIN], true)) {
            return (int) env('PRIVILEGED_IDLE_TIMEOUT_MINUTES', 15);
        }

        return (int) env('IDLE_TIMEOUT_MINUTES', 30);
    }

    protected function expiredResponse(int $timeoutMinutes): Response
    {
        return response()
            ->json([
                'success' => false,
                'message' => 'Session expired because of inactivity. Please login again.',
                'data' => null,
                'meta' => ['idle_timeout_minutes' => $timeoutMinutes],
            ], 401)
            ->withoutCookie('refresh_token');
    }
}
