<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class RefreshTokenController extends Controller
{
    public function refresh(Request $request)
    {
        $refreshToken = $request->cookie('refresh_token');

        if (!$refreshToken) {
            return $this->refreshFailed('Refresh token missing');
        }

        $hashed = hash('sha256', $refreshToken);

        $user = User::where('refresh_token', $hashed)
            ->whereNotNull('refresh_token_expires_at')
            ->where('refresh_token_expires_at', '>', now())
            ->first();

        if (!$user) {
            return $this->refreshFailed('Invalid refresh token');
        }

        if (!$user->is_active) {
            $user->tokens()->delete();
            $user->forceFill([
                'refresh_token' => null,
                'refresh_token_expires_at' => null,
            ])->save();

            return $this->refreshFailed('Your account is disabled. Please contact the administrator.', 403);
        }

        $user->tokens()->delete();

        $newAccessToken = $user
            ->createToken('mesob-api-token', ['*'], now()->addMinutes(30))
            ->plainTextToken;

        $newRefreshToken = Str::random(64);

        $user->forceFill([
            'refresh_token' => hash('sha256', $newRefreshToken),
            'refresh_token_expires_at' => now()->addDays(7),
        ])->save();

        return response()
            ->json([
                'success' => true,
                'message' => 'Token refreshed successfully',
                'token' => $newAccessToken,
                'access_token' => $newAccessToken,
                'token_type' => 'Bearer',
                'expires_in' => 30 * 60,
                'data' => [
                    'access_token' => $newAccessToken,
                    'token_type' => 'Bearer',
                    'expires_in' => 30 * 60,
                ],
                'meta' => null,
            ])
            ->cookie($this->refreshCookie($newRefreshToken, $request));
    }

    protected function refreshFailed(string $message, int $status = 401)
    {
        return response()
            ->json([
                'success' => false,
                'message' => $message,
                'data' => null,
                'meta' => null,
            ], $status)
            ->withoutCookie('refresh_token')
            ->cookie($this->clearRefreshCookie());
    }

    protected function refreshCookie(string $refreshToken, Request $request)
    {
        return cookie(
            'refresh_token',
            $refreshToken,
            60 * 24 * 7,
            '/',
            config('session.domain'),
            $this->shouldUseSecureCookie($request),
            true
        )->withSameSite((string) config('session.same_site', 'lax'));
    }

    protected function clearRefreshCookie()
    {
        return cookie()->forget('refresh_token', '/', config('session.domain'));
    }

    protected function shouldUseSecureCookie(Request $request): bool
    {
        return app()->environment('production')
            || $request->isSecure()
            || $request->header('X-Forwarded-Proto') === 'https';
    }
}
