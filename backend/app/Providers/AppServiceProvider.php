<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Schema;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use App\Models\ServiceApplication;
use App\Observers\ServiceApplicationObserver;
class AppServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Fix for older MySQL/MariaDB versions
        Schema::defaultStringLength(191);
        ServiceApplication::observe(ServiceApplicationObserver::class);

        RateLimiter::for('track-application', fn (Request $request) =>
            Limit::perMinute(10)->by($request->ip())
        );

        RateLimiter::for('login', function (Request $request) {
            $login = strtolower((string) ($request->input('login') ?? $request->input('email') ?? 'guest'));
            return [
                Limit::perMinute(5)->by($login.'|'.$request->ip()),
                Limit::perHour(30)->by($request->ip()),
            ];
        });
    }
}