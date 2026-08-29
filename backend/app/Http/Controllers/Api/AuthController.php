<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\SmsService;
use App\Support\AppRoles;
use App\Support\StrongPassword;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Log;

class AuthController extends Controller
{
    public function register(Request $request, SmsService $sms)
    {
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['required', 'string', 'max:20', 'unique:users,phone'],
            'password' => array_merge(StrongPassword::required(), ['confirmed']),
            'address' => ['nullable', 'string', 'max:500'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'address' => $request->address,
            'password' => Hash::make($request->password),
            'is_active' => true,
        ]);

        $user->syncRoles(['customer']);

        $accessToken = $user->createToken('mesob-api-token', ['*'], now()->addMinutes(30))->plainTextToken;
        $refreshToken = Str::random(64);

        $user->forceFill([
            'refresh_token' => hash('sha256', $refreshToken),
            'refresh_token_expires_at' => now()->addDays(7),
        ])->save();

        try {
            $message = "Welcome {$user->name}! Your Adama MESOB account has been created successfully. You can log in using your email or phone number. If you have any questions, please contact 9141 free call.";
            $sms->sendToPhone($user->phone, $message);
        } catch (\Throwable $exception) {
            Log::error('Registration SMS failed: ' . $exception->getMessage());
        }

        return response()
            ->json($this->authPayload($user, $accessToken))
            ->cookie($this->refreshCookie($refreshToken, $request));
    }

    public function login(Request $request)
    {
        $request->validate([
            'login' => ['required_without:email', 'nullable', 'string'],
            'email' => ['required_without:login', 'nullable', 'string'],
            'password' => ['required', 'string'],
        ]);

        $loginInput = $request->login ?? $request->email;
        $user = User::where('email', $loginInput)->orWhere('phone', $loginInput)->first();

        if ($user?->locked_until && now()->lessThan($user->locked_until)) {
            return response()->json([
                'success' => false,
                'message' => 'Account temporarily locked. Try again later.',
                'data' => null,
                'meta' => ['locked_until' => $user->locked_until],
            ], 423);
        }

        if (!$user || !Hash::check($request->password, $user->password)) {
            if ($user) {
                DB::transaction(function () use ($user) {
                    $attempts = ((int) $user->failed_login_attempts) + 1;

                    $user->forceFill([
                        'failed_login_attempts' => $attempts,
                        'last_failed_login_at' => now(),
                        'locked_until' => $attempts >= 5 ? now()->addMinutes(30) : null,
                    ])->save();

                    $user->tokens()->delete();
                });
            }

            throw ValidationException::withMessages([
                'login' => ['Invalid email/phone or password.'],
            ]);
        }

        if (!$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Your account is disabled. Please contact the administrator.',
                'data' => null,
                'meta' => null,
            ], 403);
        }

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
            ->json($this->authPayload($user, $accessToken))
            ->cookie($this->refreshCookie($refreshToken, $request));
    }

    public function me(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'data' => $this->userPayload($user),
            'user' => $this->userPayload($user),
            'roles' => $user->getRoleNames()->values()->all(),
            'permissions' => $user->getAllPermissions()->pluck('name')->values()->all(),
        ]);
    }

    public function logout(Request $request)
    {
        $user = $request->user();

        $user?->tokens()->delete();
        $user?->forceFill([
            'refresh_token' => null,
            'refresh_token_expires_at' => null,
        ])->save();

        return response()
            ->json([
                'success' => true,
                'message' => 'Logged out successfully',
            ])
            ->withoutCookie('refresh_token')
            ->cookie($this->clearRefreshCookie());
    }

    protected function authPayload(User $user, string $accessToken): array
    {
        return [
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
        ];
    }

    protected function userPayload(User $user): array
    {
        $user->loadMissing(['city', 'subcity', 'woreda', 'roles']);
        $role = $user->getRoleNames()->first();

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'address' => $user->address,
            'status' => $user->is_active ? 'active' : 'disabled',
            'city_id' => $user->city_id,
            'subcity_id' => $user->subcity_id,
            'woreda_id' => $user->woreda_id,
            'location_level' => AppRoles::userLevel($user),
            'city' => $user->city,
            'subcity' => $user->subcity,
            'woreda' => $user->woreda,
            'role' => $role,
            'roles' => $user->getRoleNames()->values()->all(),
            'permissions' => $user->getAllPermissions()->pluck('name')->values()->all(),
        ];
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
