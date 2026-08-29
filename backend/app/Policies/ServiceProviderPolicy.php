<?php

namespace App\Policies;

use App\Models\ServiceProvider;
use App\Models\User;
use App\Support\AppRoles;

class ServiceProviderPolicy
{
    private function superAdmin(User $user): bool
    {
        return $user->hasRole(AppRoles::SUPER_ADMIN);
    }

    public function viewAny(User $user): bool
    {
        return $this->superAdmin($user) || $user->can('service_providers.read');
    }

    public function view(User $user, ServiceProvider $serviceProvider): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $this->superAdmin($user) || $user->can('service_providers.create');
    }

    public function update(User $user, ServiceProvider $serviceProvider): bool
    {
        return $this->superAdmin($user) || $user->can('service_providers.update');
    }

    public function delete(User $user, ServiceProvider $serviceProvider): bool
    {
        return $this->superAdmin($user) || $user->can('service_providers.delete');
    }
}
