<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\FaydaService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class FaydaController extends Controller
{
    public function callback(Request $request, FaydaService $fayda)
    {
        try {
            $request->validate([
                'code' => ['required', 'string'],
            ]);

            $tokenData = $fayda->getToken($request->code);

            if (!isset($tokenData['access_token'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Fayda token exchange failed',
                ], 500);
            }

            $userInfo = $fayda->userInfo($tokenData['access_token']);

            if (!isset($userInfo['sub'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Fayda user information lookup failed',
                ], 500);
            }

            $user = User::updateOrCreate(
                ['fin' => $userInfo['sub']],
                [
                    'name' => $userInfo['name'] ?? 'Citizen',
                    'email' => $userInfo['email'] ?? null,
                    'is_fayda_verified' => true,
                    'fayda_payload' => $userInfo,
                    'is_active' => true,
                ]
            );

            $user->syncRoles(['customer']);
            $user->tokens()->delete();

            $accessToken = $user->createToken('mesob-api-token', ['*'], now()->addMinutes(30))->plainTextToken;
            $refreshToken = Str::random(64);

            $user->forceFill([
                'refresh_token' => hash('sha256', $refreshToken),
                'refresh_token_expires_at' => now()->addDays(7),
                'last_login_at' => now(),
                'failed_login_attempts' => 0,
                'locked_until' => null,
                'last_failed_login_at' => null,
            ])->save();

            return response()
                ->json([
                    'success' => true,
                    'message' => 'Authenticated successfully',
                    'token' => $accessToken,
                    'access_token' => $accessToken,
                    'token_type' => 'Bearer',
                    'expires_in' => 30 * 60,
                    'data' => [
                        'access_token' => $accessToken,
                        'token_type' => 'Bearer',
                        'expires_in' => 30 * 60,
                    ],
                ])
                ->cookie($this->refreshCookie($refreshToken, $request));
        } catch (\Throwable $exception) {
            report($exception);

            return response()->json([
                'success' => false,
                'message' => 'Fayda callback failed',
            ], 500);
        }
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
