<?php

namespace App\Policies;

use App\Models\Service;
use App\Models\User;

class ServicePolicy
{
    /**
     * View services.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('services.read');
    }

    /**
     * Create service.
     */
    public function create(User $user): bool
    {
        return $user->can('services.create');
    }

    /**
     * Update service.
     */
    public function update(User $user, Service $service): bool
    {
        return $user->can('services.update');
    }

    /**
     * Delete service.
     */
    public function delete(User $user, Service $service): bool
    {
        return $user->can('services.delete');
    }
}