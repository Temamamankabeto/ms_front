<?php

namespace App\Policies;

use App\Models\User;
use App\Policies\Concerns\ChecksPermissions;
use App\Support\AppRoles;

class UserPolicy
{
    use ChecksPermissions;

    public function viewAny(User $user): bool
    {
        return $this->allows($user, 'users.read');
    }

    public function view(User $user, User $model): bool
    {
        return $this->allows($user, 'users.read');
    }

    public function create(User $user): bool
    {
        return $this->allows($user, 'users.create');
    }

    public function update(User $user, User $model): bool
    {
        return $this->allows($user, 'users.update');
    }

    public function delete(User $user, User $model): bool
    {
        if ($user->id === $model->id) {
            return false;
        }

        return $this->allows($user, 'users.delete');
    }

    public function toggle(User $user, User $model): bool
    {
        if ((int) $user->id === (int) $model->id) {
            return false;
        }

        if (! $this->allows($user, 'users.activate', 'users.deactivate')) {
            return false;
        }

        if ($user->hasRole(AppRoles::SUPER_ADMIN)) {
            return true;
        }

        if (! $user->hasRole(AppRoles::ADMIN)) {
            return false;
        }

        /*
        |--------------------------------------------------------------------------
        | Final activation authority
        |--------------------------------------------------------------------------
        | Subcity and Woreda admins must not enable/disable users directly.
        | Only City Admin and Super Admin can toggle activation status.
        */
        return AppRoles::userLevel($user) === AppRoles::LEVEL_CITY;
    }

    public function resetPassword(User $user, User $model): bool
    {
        return $this->allows($user, 'users.reset_password');
    }

    public function assignRole(User $user, User $model): bool
    {
        return $this->allows($user, 'users.assign_role');
    }

    public function rolesLite(User $user): bool
    {
        return $this->allows($user, 'roles.read', 'users.read');
    }

    public function waitersLite(User $user): bool
    {
        return $this->allows($user, 'users.read');
    }
}
