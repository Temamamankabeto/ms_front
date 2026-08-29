<?php

namespace App\Policies;

use App\Models\User;
use App\Models\ServiceApplication;

class ApplicationPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, ServiceApplication $application): bool
    {
        return $user->id === $application->customer_id
            || $user->can('applications.view');
    }

    public function create(User $user): bool
    {
        return $user->can('applications.create');
    }

    public function assign(User $user): bool
    {
        return $user->can('applications.assign');
    }

    public function approve(User $user): bool
    {
        return $user->can('applications.approve');
    }

    public function reject(User $user): bool
    {
        return $user->can('applications.reject');
    }
}
