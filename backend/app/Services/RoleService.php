<?php

namespace App\Services;

use App\Support\AppRoles;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RoleService
{
    protected string $guard = 'sanctum';

    public function paginateRoles(array $filters): LengthAwarePaginator
    {
        $search = trim((string) ($filters['search'] ?? ''));
        $perPage = max(1, min((int) ($filters['per_page'] ?? 50), 100));

        $query = Role::query()
            ->where('guard_name', $this->guard)
            ->whereIn('name', AppRoles::all())
            ->orderBy('name');

        if ($search !== '') {
            $query->where('name', 'like', "%{$search}%");
        }

        return $query->paginate(
            $perPage,
            ['id', 'name', 'guard_name', 'created_at', 'updated_at']
        );
    }

    public function transformPaginatedRoles(LengthAwarePaginator $roles): array
    {
        return [
            'success' => true,
            'data' => $roles->items(),
            'meta' => [
                'current_page' => $roles->currentPage(),
                'per_page' => $roles->perPage(),
                'total' => $roles->total(),
                'last_page' => $roles->lastPage(),
            ],
        ];
    }

    public function getRole(int|string $id): Role
    {
        return Role::query()
            ->where('guard_name', $this->guard)
            ->whereIn('name', AppRoles::all())
            ->findOrFail($id);
    }

    public function getPermissions(?string $search = null)
    {
        $query = Permission::query()
            ->where('guard_name', $this->guard)
            ->orderBy('name');

        $search = trim((string) $search);

        if ($search !== '') {
            $query->where('name', 'like', "%{$search}%");
        }

        return $query->get(['id', 'name', 'guard_name']);
    }

    public function createRole(array $data): Role
    {
        $roleName = AppRoles::normalize($data['name'] ?? null);

        if (!$roleName || !AppRoles::isBuiltin($roleName)) {
            throw ValidationException::withMessages([
                'name' => ['Only the predefined MESOB roles are allowed.'],
            ]);
        }

        $role = Role::firstOrCreate([
            'name' => $roleName,
            'guard_name' => $this->guard,
        ]);

        $this->clearPermissionCache();

        return $role;
    }

    public function updateRole(Role $role, array $data): Role
    {
        $roleName = AppRoles::normalize($data['name'] ?? null);

        if (!$roleName || !AppRoles::isBuiltin($roleName)) {
            throw ValidationException::withMessages([
                'name' => ['Only the predefined MESOB roles are allowed.'],
            ]);
        }

        $role->update([
            'name' => $roleName,
        ]);

        $this->clearPermissionCache();

        return $role->fresh();
    }

    public function getRolePermissions(Role $role)
    {
        return $role->permissions()
            ->where('guard_name', $this->guard)
            ->orderBy('name')
            ->get(['id', 'name', 'guard_name']);
    }

    public function assignPermissions($role, array $permissions)
    {
        $cleanPermissions = collect($permissions)
            ->map(function ($permission) {
                if (is_array($permission)) {
                    return $permission['name'] ?? null;
                }

                return $permission;
            })
            ->filter()
            ->values()
            ->toArray();

        $validPermissions = Permission::whereIn('name', $cleanPermissions)
            ->where('guard_name', $this->guard)
            ->pluck('name')
            ->toArray();

        $role->syncPermissions($validPermissions);

        $this->clearPermissionCache();

        return $role->load('permissions');
    }

    protected function clearPermissionCache(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
