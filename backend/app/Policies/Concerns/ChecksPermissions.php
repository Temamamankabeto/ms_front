<?php

namespace App\Policies\Concerns;

use App\Models\User;

trait ChecksPermissions
{
    protected function allows(User $user, string ...$permissions): bool
    {
        foreach ($permissions as $permission) {
            if ($user->can($permission)) {
                return true;
            }
        }

        return false;
    }
}
