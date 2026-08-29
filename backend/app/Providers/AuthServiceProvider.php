<?php

namespace App\Providers;

use App\Models\Service;
use App\Models\ServiceProvider;
use App\Models\Window;
use App\Policies\ServicePolicy;
use App\Policies\ServiceProviderPolicy;
use App\Policies\WindowPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as BaseAuthServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends BaseAuthServiceProvider
{
    protected $policies = [
        Service::class => ServicePolicy::class,
        ServiceProvider::class => ServiceProviderPolicy::class,
        Window::class => WindowPolicy::class,
    ];

    public function boot(): void
    {
        $this->registerPolicies();

        Gate::define('dashboard.waiter', fn ($user) => $user->can('dashboard.waiter'));
        Gate::define('dashboard.admin', fn ($user) => $user->can('dashboard.admin'));
        Gate::define('dashboard.customer', fn ($user) => $user->can('dashboard.customer'));
    }
}