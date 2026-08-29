<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\AssignUserRoleRequest;
use App\Http\Requests\User\ResetUserPasswordRequest;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateProfileRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Models\User;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;
use App\Support\StrongPassword;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
    public function __construct(
        protected UserService $userService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', User::class);

        $users = $this->userService->paginateUsers(
            $request->only(['search', 'status', 'role', 'per_page', 'city_id', 'subcity_id', 'woreda_id']),
            $request->user()
        );

        return response()->json(
            $this->userService->transformPaginatedUsers($users)
        );
    }

    public function show(int|string $id): JsonResponse
    {
        $user = $this->userService->getUser($id);
        $this->authorize('view', $user);

        return response()->json([
            'success' => true,
            'message' => 'User retrieved successfully',
            'data' => $user,
        ]);
    }

    public function profile(Request $request): JsonResponse
    {
        $user = $request->user()->load(['roles', 'city', 'subcity', 'woreda']);

        return response()->json([
            'success' => true,
            'message' => 'Profile retrieved successfully',
            'data' => [
                ...$user->toArray(),
                'role' => $user->getRoleNames()->first(),
                'roles' => $user->getRoleNames()->values()->all(),
                'permissions' => $user->getAllPermissions()->pluck('name')->values()->all(),
                'profile_image_url' => $user->profile_image ? asset('storage/' . $user->profile_image) : null,
                'photo_url' => $user->profile_image ? asset('storage/' . $user->profile_image) : null,
            ],
        ]);
    }

    public function rolesLite(): JsonResponse
    {
        $this->authorize('rolesLite', User::class);

        return response()->json([
            'success' => true,
            'message' => 'Roles retrieved successfully',
            'data' => $this->userService->getRolesLite(),
        ]);
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $this->authorize('create', User::class);

        $user = $this->userService->createUser(
            $request->validated(),
            $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => 'User created successfully',
            'data' => $user,
        ], 201);
    }

    public function update(UpdateUserRequest $request, int|string $id): JsonResponse
    {
        $user = $this->userService->getUser($id);
        $this->authorize('update', $user);

        $updatedUser = $this->userService->updateUser(
            $user,
            $request->validated(),
            $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => 'User updated successfully',
            'data' => $updatedUser,
        ]);
    }

    public function assignRole(AssignUserRoleRequest $request, int|string $id): JsonResponse
    {
        $user = $this->userService->getUser($id);
        $this->authorize('assignRole', $user);

        $updatedUser = $this->userService->assignRole(
            $user,
            $request->validated()['role'],
            $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => 'Role updated successfully',
            'data' => $updatedUser,
        ]);
    }

    public function toggle(int|string $id): JsonResponse
    {
        $user = $this->userService->getUser($id);
        $this->authorize('toggle', $user);

        $updatedUser = $this->userService->toggleUser($user);

        return response()->json([
            'success' => true,
            'message' => 'User status updated successfully',
            'data' => $updatedUser,
        ]);
    }

    public function resetPassword(ResetUserPasswordRequest $request, int|string $id): JsonResponse
    {
        $user = $this->userService->getUser($id);
        $this->authorize('resetPassword', $user);

        $this->userService->resetPassword($user, $request->validated()['new_password']);

        return response()->json([
            'success' => true,
            'message' => 'Password reset successful',
            'data' => [
                'id' => $user->id,
            ],
        ]);
    }

    public function waitersLite(Request $request): JsonResponse
    {
        $this->authorize('waitersLite', User::class);

        return response()->json([
            'success' => true,
            'data' => $this->userService->getWaitersLite($request->get('search')),
        ]);
    }

    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $updatedUser = $this->userService->updateProfile(
            $request->user(),
            $request->validated(),
            $request->file('profile') ?: $request->file('profile_image')
        );

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully',
            'data' => [
                ...$updatedUser->toArray(),
                'role' => $updatedUser->getRoleNames()->first(),
                'roles' => $updatedUser->getRoleNames()->values()->all(),
                'permissions' => $updatedUser->getAllPermissions()->pluck('name')->values()->all(),
                'profile_image_url' => $updatedUser->profile_image ? asset('storage/' . $updatedUser->profile_image) : null,
                'photo_url' => $updatedUser->profile_image ? asset('storage/' . $updatedUser->profile_image) : null,
            ],
        ]);
    }

    public function destroy(int|string $id): JsonResponse
    {
        $user = $this->userService->getUser($id);
        $this->authorize('delete', $user);

        $this->userService->deleteUser($user, Auth::user()->id);

        return response()->json([
            'success' => true,
            'message' => 'User deleted successfully',
        ]);
    }

    public function changeOwnPassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => ['required', 'string'],
            'new_password' => array_merge(StrongPassword::required(), ['confirmed']),
        ]);

        $this->userService->changePassword(
            $request->user(),
            $request->input('current_password'),
            $request->input('new_password')
        );

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully',
        ]);
    }

    public function changePassword(Request $request, int|string $id): JsonResponse
    {
        $user = $this->userService->getUser($id);

        $request->validate([
            'current_password' => 'required|string',
            'new_password' => array_merge(StrongPassword::required(), ['confirmed']),
        ]);

        $this->userService->changePassword(
            $user,
            $request->input('current_password'),
            $request->input('new_password')
        );

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully',
        ]);
    }

    public function toggleStatus(int|string $id): JsonResponse
    {
        $user = $this->userService->getUser($id);
        $this->authorize('toggle', $user);

        $updatedUser = $this->userService->toggleUser($user);

        return response()->json([
            'success' => true,
            'message' => $updatedUser->is_active ? 'User enabled successfully' : 'User disabled successfully',
            'data' => $updatedUser,
        ]);
    }
}
