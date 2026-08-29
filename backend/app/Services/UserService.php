<?php

namespace App\Services;

use App\Models\User;
use App\Support\AppRoles;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role;

class UserService
{
    public function __construct(
        protected UserActivationRequestService $activationRequestService
    ) {}

    public function paginateUsers(array $filters = [], ?User $actor = null): LengthAwarePaginator
    {
        $perPage = max(1, min((int) ($filters['per_page'] ?? 10), 100));
        $search = trim((string) ($filters['search'] ?? ''));
        $status = $filters['status'] ?? null;
        $role = AppRoles::normalize($filters['role'] ?? null);

        $query = User::query()
            ->with(['city', 'subcity', 'woreda', 'roles', 'latestActivationRequest']);

        if ($actor) {
            $this->applyLocationScope($query, $actor);
        }

        $this->applyRequestedLocationFilters($query, $filters, $actor);

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($status === 'active') {
            $query->where('is_active', true);
        } elseif ($status === 'disabled') {
            $query->where('is_active', false);
        }

        if ($role) {
            $query->role($role);
        } else {
            // Customers live under their own "Customers" menu, not "Users".
            $query->whereDoesntHave('roles', function ($q) {
                $q->where('name', AppRoles::CUSTOMER);
            });
        }

        return $query->latest()->paginate($perPage);
    }

    public function transformPaginatedUsers(LengthAwarePaginator $users): array
    {
        return [
            'success' => true,
            'message' => 'Users retrieved successfully',
            'data' => collect($users->items())->map(fn (User $user) => $this->payload($user))->values(),
            'meta' => [
                'current_page' => $users->currentPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
                'last_page' => $users->lastPage(),
            ],
        ];
    }

    public function getUser(int|string $id): User
    {
        return User::with(['city', 'subcity', 'woreda', 'roles', 'latestActivationRequest'])->findOrFail($id);
    }

    public function getRolesLite()
    {
        return collect(AppRoles::orderedRoleOptions())
            ->map(function (array $roleOption) {
                $role = Role::firstOrCreate([
                    'name' => $roleOption['name'],
                    'guard_name' => 'sanctum',
                ]);

                return [
                    'id' => $role->id,
                    ...$roleOption,
                ];
            })
            ->values();
    }

    public function createUser(array $data, ?User $actor = null): User
    {
        $roleName = AppRoles::normalize($data['role'] ?? null);

        if (!$roleName || !AppRoles::isBuiltin($roleName)) {
            throw ValidationException::withMessages([
                'role' => ['Invalid role selected.'],
            ]);
        }

        $location = $this->normalizeLocationForRole(
            $roleName,
            $data['location_level'] ?? null,
            $data['city_id'] ?? null,
            $data['subcity_id'] ?? null,
            $data['woreda_id'] ?? null
        );

        $this->assertActorCanCreateUser($actor, $roleName, $location);

        unset(
            $data['role'],
            $data['location_level'],
            $data['city_id'],
            $data['subcity_id'],
            $data['woreda_id']
        );

        $activeByDefault = $this->createdUserIsActiveByDefault($actor);

        $payload = [
            ...$data,
            ...$location,
            'password' => Hash::make($data['password']),
            'created_by' => $actor?->id,
            'is_active' => $activeByDefault,
            'status' => $activeByDefault ? 'active' : 'disabled',
            'activated_by' => $activeByDefault ? $actor?->id : null,
            'activated_at' => $activeByDefault ? now() : null,
        ];

        $user = User::create($payload);
        $user->assignRole($roleName);

        if (! $activeByDefault) {
            $this->activationRequestService->createForUser(
                $user,
                $actor,
                'Activation requested automatically after officer creation.'
            );
        }

        $this->audit(
            'user_created',
            $activeByDefault
                ? 'User created and activated by city admin.'
                : 'Officer created disabled and activation request created.',
            'user',
            $user->id,
            null,
            $this->payload($user->fresh(['roles', 'city', 'subcity', 'woreda', 'latestActivationRequest']))
        );

        return $user->fresh(['city', 'subcity', 'woreda', 'roles', 'latestActivationRequest']);
    }

    public function updateUser(User $user, array $data, ?User $actor = null): User
    {
        $roleName = AppRoles::normalize($data['role'] ?? optional($user->roles->first())->name);

        if (!$roleName || !AppRoles::isBuiltin($roleName)) {
            throw ValidationException::withMessages([
                'role' => ['Invalid role selected.'],
            ]);
        }

        $location = $this->normalizeLocationForRole(
            $roleName,
            $data['location_level'] ?? null,
            $data['city_id'] ?? null,
            $data['subcity_id'] ?? null,
            $data['woreda_id'] ?? null
        );

        $this->assertActorCanManageRole($actor, $roleName, $location);

        // A customer's phone is how they authenticate (Fayda/OTP) and must
        // never be changed through the admin edit form, even if a value
        // was submitted.
        $isCustomer = $user->hasRole(AppRoles::CUSTOMER) || $roleName === AppRoles::CUSTOMER;

        $payload = [
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $isCustomer ? $user->phone : $data['phone'],
            'gender' => $data['gender'] ?? null,
            'date_of_birth' => $data['date_of_birth'] ?? null,
            'address' => $data['address'] ?? null,
            ...$location,
        ];

        if (!empty($data['password'])) {
            $payload['password'] = Hash::make($data['password']);
        }

        if (array_key_exists('is_active', $data)) {
            $payload['is_active'] = (bool) $data['is_active'];
        } elseif (array_key_exists('status', $data)) {
            $payload['is_active'] = $data['status'] === 'active';
        }

        $user->update($payload);
        $user->syncRoles([$roleName]);

        return $user->fresh(['city', 'subcity', 'woreda', 'roles', 'latestActivationRequest']);
    }

    public function assignRole(User $user, string $roleName, ?User $actor = null): User
    {
        $roleName = AppRoles::normalize($roleName);

        if (!$roleName || !AppRoles::isBuiltin($roleName)) {
            throw ValidationException::withMessages([
                'role' => ['Invalid role selected.'],
            ]);
        }

        $location = $this->normalizeLocationForRole(
            $roleName,
            AppRoles::levelFromLocation($user->city_id, $user->subcity_id, $user->woreda_id),
            $user->city_id,
            $user->subcity_id,
            $user->woreda_id
        );

        $this->assertActorCanManageRole($actor, $roleName, $location);

        $user->update($location);
        $user->syncRoles([$roleName]);

        return $user->fresh(['city', 'subcity', 'woreda', 'roles', 'latestActivationRequest']);
    }

    public function toggleUser(User $user): User
    {
        if (auth()->id() && (int) auth()->id() === (int) $user->id) {
            throw ValidationException::withMessages([
                'user' => ['You cannot enable or disable your own account.'],
            ]);
        }

        $user->is_active = !$user->is_active;
        $user->status = $user->is_active ? 'active' : 'disabled';

        if ($user->is_active) {
            $user->activated_by = auth()->id();
            $user->activated_at = now();
        }

        $user->save();

        return $user->load(['city', 'subcity', 'woreda', 'roles', 'latestActivationRequest']);
    }

    public function resetPassword(User $user, string $newPassword): User
    {
        $user->password = Hash::make($newPassword);
        $user->save();

        return $user;
    }

    public function getWaitersLite(?string $search = null)
    {
        $query = User::query()
            ->select('id', 'name')
            ->whereHas('roles', function ($q) {
                $q->whereIn('name', [
                    AppRoles::FRONT_OFFICER,
                    AppRoles::BACK_OFFICER,
                ]);
            })
            ->where('is_active', true);

        $search = trim((string) $search);

        if ($search !== '') {
            $query->where('name', 'like', "%{$search}%");
        }

        return $query->orderBy('name')->get();
    }

    public function updateProfile(User $user, array $data, ?UploadedFile $profileFile = null): User
    {
        $user->name = $data['name'];

        if (array_key_exists('gender', $data)) {
            $user->gender = $data['gender'];
        }

        if (array_key_exists('date_of_birth', $data)) {
            $user->date_of_birth = $data['date_of_birth'];
        }

        if (array_key_exists('address', $data)) {
            $user->address = $data['address'];
        }

        if ($profileFile) {
            if ($user->profile_image && Storage::disk('public')->exists($user->profile_image)) {
                Storage::disk('public')->delete($user->profile_image);
            }

            $path = $profileFile->store('users/profile-images', 'public');
            $user->profile_image = $path;
        }

        $user->save();

        return $user->fresh()->load(['roles', 'city', 'subcity', 'woreda']);
    }

    public function deleteUser(User $user, ?int $authId = null): void
    {
        if ($authId && $authId === $user->id) {
            throw ValidationException::withMessages([
                'user' => ['You cannot delete your own account.'],
            ]);
        }

        if ($user->hasRole(AppRoles::CUSTOMER)) {
            throw ValidationException::withMessages([
                'user' => ['Customer accounts cannot be deleted.'],
            ]);
        }

        $user->syncRoles([]);

        if ($user->profile_image && Storage::disk('public')->exists($user->profile_image)) {
            Storage::disk('public')->delete($user->profile_image);
        }

        $user->delete();
    }

    public function changePassword(User $user, string $currentPassword, string $newPassword): void
    {
        if (!Hash::check($currentPassword, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Current password is incorrect'],
            ]);
        }

        $user->password = Hash::make($newPassword);
        $user->save();
    }

    protected function createdUserIsActiveByDefault(?User $actor): bool
    {
        if (!$actor || $actor->hasRole(AppRoles::SUPER_ADMIN)) {
            return true;
        }

        return $actor->hasRole(AppRoles::ADMIN)
            && AppRoles::userLevel($actor) === AppRoles::LEVEL_CITY;
    }

    protected function normalizeLocationForRole(string $roleName, ?string $locationLevel, int|string|null $cityId, int|string|null $subcityId, int|string|null $woredaId): array
    {
        if (!AppRoles::isScoped($roleName)) {
            return [
                'city_id' => null,
                'subcity_id' => null,
                'woreda_id' => null,
            ];
        }

        $locationLevel = AppRoles::normalizeLevel($locationLevel)
            ?? AppRoles::levelFromLocation($cityId, $subcityId, $woredaId)
            ?? AppRoles::LEVEL_CITY;

        $cityId = $cityId ? (int) $cityId : null;
        $subcityId = $subcityId ? (int) $subcityId : null;
        $woredaId = $woredaId ? (int) $woredaId : null;

        if (!$cityId) {
            throw ValidationException::withMessages(['city_id' => ['City is required for scoped roles.']]);
        }

        if (in_array($locationLevel, [AppRoles::LEVEL_SUBCITY, AppRoles::LEVEL_WOREDA], true) && !$subcityId) {
            throw ValidationException::withMessages(['subcity_id' => ['Subcity is required for this location level.']]);
        }

        if ($locationLevel === AppRoles::LEVEL_WOREDA && !$woredaId) {
            throw ValidationException::withMessages(['woreda_id' => ['Woreda is required for this location level.']]);
        }

        return match ($locationLevel) {
            AppRoles::LEVEL_CITY => ['city_id' => $cityId, 'subcity_id' => null, 'woreda_id' => null],
            AppRoles::LEVEL_SUBCITY => ['city_id' => $cityId, 'subcity_id' => $subcityId, 'woreda_id' => null],
            AppRoles::LEVEL_WOREDA => ['city_id' => $cityId, 'subcity_id' => $subcityId, 'woreda_id' => $woredaId],
        };
    }

    protected function assertActorCanCreateUser(?User $actor, string $targetRole, array $targetLocation): void
    {
        if (!$actor || $actor->hasRole(AppRoles::SUPER_ADMIN)) {
            return;
        }

        if (!$actor->can('users.create')) {
            throw ValidationException::withMessages(['role' => ['You do not have permission to create users.']]);
        }

        // Customer is an unscoped role, not part of the officer hierarchy
        // below — anyone with users.create can create a customer account.
        if ($targetRole === AppRoles::CUSTOMER) {
            return;
        }

        if (!$actor->hasRole(AppRoles::ADMIN)) {
            throw ValidationException::withMessages(['role' => ['Only admins can create officers/admin users.']]);
        }

        $actorLevel = AppRoles::userLevel($actor);

        if ($actorLevel === AppRoles::LEVEL_CITY) {
            if (!in_array($targetRole, [AppRoles::ADMIN, AppRoles::FRONT_OFFICER, AppRoles::BACK_OFFICER], true)) {
                throw ValidationException::withMessages(['role' => ['City admin can create admins, front officers, and back officers only.']]);
            }

            if ((int) $actor->city_id !== (int) ($targetLocation['city_id'] ?? 0)) {
                throw ValidationException::withMessages(['city_id' => ['User must belong to your city.']]);
            }

            return;
        }

        if ($actorLevel === AppRoles::LEVEL_SUBCITY) {
            if (!in_array($targetRole, [AppRoles::FRONT_OFFICER, AppRoles::BACK_OFFICER], true)) {
                throw ValidationException::withMessages(['role' => ['Subcity admin can create front and back officers only.']]);
            }

            if ((int) $actor->city_id !== (int) ($targetLocation['city_id'] ?? 0) ||
                (int) $actor->subcity_id !== (int) ($targetLocation['subcity_id'] ?? 0) ||
                !empty($targetLocation['woreda_id'])) {
                throw ValidationException::withMessages(['subcity_id' => ['Officer must belong to your assigned subcity.']]);
            }

            return;
        }

        if ($actorLevel === AppRoles::LEVEL_WOREDA) {
            if (!in_array($targetRole, [AppRoles::FRONT_OFFICER, AppRoles::BACK_OFFICER], true)) {
                throw ValidationException::withMessages(['role' => ['Woreda admin can create front and back officers only.']]);
            }

            if ((int) $actor->city_id !== (int) ($targetLocation['city_id'] ?? 0) ||
                (int) $actor->subcity_id !== (int) ($targetLocation['subcity_id'] ?? 0) ||
                (int) $actor->woreda_id !== (int) ($targetLocation['woreda_id'] ?? 0)) {
                throw ValidationException::withMessages(['woreda_id' => ['Officer must belong to your assigned woreda.']]);
            }

            return;
        }

        throw ValidationException::withMessages(['role' => ['Your admin account does not have a valid location scope.']]);
    }

    protected function assertActorCanManageRole(?User $actor, string $targetRole, array $targetLocation): void
    {
        if (!$actor || $actor->hasRole(AppRoles::SUPER_ADMIN)) {
            return;
        }

        if (!$actor->can('users.create') && !$actor->can('users.update') && !$actor->can('users.assign_role')) {
            throw ValidationException::withMessages(['role' => ['You do not have permission to manage users.']]);
        }

        if ($targetRole === AppRoles::SUPER_ADMIN) {
            throw ValidationException::withMessages(['role' => ['Only a super admin can manage super admin users.']]);
        }

        // Customer is an unscoped role — any actor with manage permission
        // can update a customer account regardless of their own location.
        if ($targetRole === AppRoles::CUSTOMER) {
            return;
        }

        $actorLevel = AppRoles::userLevel($actor);

        if (!$actorLevel) {
            return;
        }

        if ($actorLevel === AppRoles::LEVEL_CITY && (int) $actor->city_id !== (int) ($targetLocation['city_id'] ?? 0)) {
            throw ValidationException::withMessages(['city_id' => ['User must belong to your city.']]);
        }

        if ($actorLevel === AppRoles::LEVEL_SUBCITY) {
            if ((int) $actor->city_id !== (int) ($targetLocation['city_id'] ?? 0) ||
                (int) $actor->subcity_id !== (int) ($targetLocation['subcity_id'] ?? 0)) {
                throw ValidationException::withMessages(['subcity_id' => ['User must belong to your subcity.']]);
            }
        }

        if ($actorLevel === AppRoles::LEVEL_WOREDA) {
            if ((int) $actor->city_id !== (int) ($targetLocation['city_id'] ?? 0) ||
                (int) $actor->subcity_id !== (int) ($targetLocation['subcity_id'] ?? 0) ||
                (int) $actor->woreda_id !== (int) ($targetLocation['woreda_id'] ?? 0)) {
                throw ValidationException::withMessages(['woreda_id' => ['User must belong to your woreda.']]);
            }
        }
    }

    protected function applyRequestedLocationFilters($query, array $filters, ?User $actor = null): void
    {
        $actorLevel = $actor ? AppRoles::userLevel($actor) : null;

        /*
        |--------------------------------------------------------------------------
        | Important scope rule
        |--------------------------------------------------------------------------
        | Subcity Admin and Woreda Admin must not use request filters to expand
        | beyond their own level. Their list scope is already locked by
        | applyLocationScope(). Therefore we only allow optional location filters
        | for Super Admin and City-level users.
        */
        if ($actor && ! $actor->hasRole(AppRoles::SUPER_ADMIN) && $actorLevel !== AppRoles::LEVEL_CITY) {
            return;
        }

        if (! empty($filters['city_id'])) {
            $query->where('city_id', (int) $filters['city_id']);
        }

        if (! empty($filters['subcity_id'])) {
            $query->where('subcity_id', (int) $filters['subcity_id']);
        }

        if (! empty($filters['woreda_id'])) {
            $query->where('woreda_id', (int) $filters['woreda_id']);
        }
    }

    protected function applyLocationScope($query, User $actor): void
    {
        if ($actor->hasRole(AppRoles::SUPER_ADMIN)) {
            return;
        }

        $level = AppRoles::userLevel($actor);

        if ($level === AppRoles::LEVEL_CITY && $actor->city_id) {
            /*
            |----------------------------------------------------------------------
            | City Admin
            |----------------------------------------------------------------------
            | City admin can see all users inside the city scope.
            */
            $query->where('city_id', $actor->city_id);
            return;
        }

        if ($level === AppRoles::LEVEL_SUBCITY && $actor->subcity_id) {
            /*
            |----------------------------------------------------------------------
            | Subcity Admin
            |----------------------------------------------------------------------
            | Show ONLY users who belong directly to this subcity level.
            | Woreda users under the subcity are excluded intentionally.
            */
            $query
                ->where('city_id', $actor->city_id)
                ->where('subcity_id', $actor->subcity_id)
                ->whereNull('woreda_id');
            return;
        }

        if ($level === AppRoles::LEVEL_WOREDA && $actor->woreda_id) {
            /*
            |----------------------------------------------------------------------
            | Woreda Admin
            |----------------------------------------------------------------------
            | Show ONLY users who belong to the same woreda.
            */
            $query
                ->where('city_id', $actor->city_id)
                ->where('subcity_id', $actor->subcity_id)
                ->where('woreda_id', $actor->woreda_id);
            return;
        }

        $query->whereRaw('1 = 0');
    }

    protected function audit(
        string $action,
        string $message,
        string $entityType,
        int|string|null $entityId,
        mixed $before = null,
        mixed $after = null
    ): void {
        try {
            if (function_exists('audit_log')) {
                audit_log($action, $message, $entityType, $entityId, $before, $after);
                return;
            }

            logger()->info($message, [
                'action' => $action,
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'before' => $before,
                'after' => $after,
                'actor_id' => auth()->id(),
            ]);
        } catch (\Throwable $exception) {
            logger()->warning('User audit logging skipped: ' . $exception->getMessage());
        }
    }

    protected function payload(User $user): array
    {
        $roleNames = $user->getRoleNames()->values();
        $role = $roleNames->first();

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'gender' => $user->gender,
            'date_of_birth' => $user->date_of_birth,
            'address' => $user->address,
            'status' => $user->is_active ? 'active' : 'disabled',
            'is_active' => (bool) $user->is_active,
            'role' => $role,
            'role_names' => $roleNames,
            'location_level' => AppRoles::userLevel($user),
            'roles' => $user->roles,
            'city_id' => $user->city_id,
            'subcity_id' => $user->subcity_id,
            'woreda_id' => $user->woreda_id,
            'city' => $user->city,
            'subcity' => $user->subcity,
            'woreda' => $user->woreda,
            'created_by' => $user->created_by,
            'activated_by' => $user->activated_by,
            'activated_at' => $user->activated_at,
            'activation_request' => $user->latestActivationRequest,
            'profile_image_url' => $user->profile_image_url,
            'created_at' => $user->created_at,
        ];
    }
}
