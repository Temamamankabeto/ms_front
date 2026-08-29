<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Window;

class WindowPolicy
{
    /**
     * View windows.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('windows.read');
    }

    /**
     * Create window.
     */
    public function create(User $user): bool
    {
        return $user->can('windows.create');
    }

    /**
     * Update window.
     */
    public function update(
        User $user,
        Window $window
    ): bool {

        return $user->can('windows.update');
    }

    /**
     * Delete window.
     */
    public function delete(
        User $user,
        Window $window
    ): bool {

        return $user->can('windows.delete');
    }
}