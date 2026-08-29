<?php

namespace App\Policies;

use App\Models\User;
use Spatie\Permission\Models\Role;

class RolePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('roles.read');
    }

    public function view(User $user, Role $role): bool
    {
        return $user->can('roles.read');
    }

    public function create(User $user): bool
    {
        return $user->can('roles.create');
    }

    public function update(User $user, Role $role): bool
    {
        return $user->can('roles.update');
    }

    public function assignPermissions(User $user, Role $role): bool
    {
        return $user->can('roles.assign_permissions');
    }

    public function delete(User $user, Role $role): bool
    {
        return $user->can('roles.delete');
    }
}