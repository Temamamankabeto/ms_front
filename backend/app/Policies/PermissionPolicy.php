<?php

namespace App\Policies;

use App\Models\User;
use Spatie\Permission\Models\Permission;

class PermissionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('permissions.read');
    }

    public function view(User $user, Permission $permission): bool
    {
        return $user->can('permissions.read');
    }

    public function create(User $user): bool
    {
        return $user->can('permissions.create');
    }

    public function update(User $user, Permission $permission): bool
    {
        return $user->can('permissions.update');
    }

    public function delete(User $user, Permission $permission): bool
    {
        return $user->can('permissions.delete');
    }
}