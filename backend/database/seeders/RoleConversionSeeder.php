<?php

namespace Database\Seeders;

use App\Models\User;
use App\Support\AppRoles;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RoleConversionSeeder extends Seeder
{
    public function run(): void
    {
        foreach (AppRoles::all() as $role) {
            Role::firstOrCreate([
                'name' => $role,
                'guard_name' => 'sanctum',
            ]);
        }

        User::with('roles')
            ->chunkById(100, function ($users) {
                foreach ($users as $user) {
                    $currentRoles = $user->roles->pluck('name')->values();

                    if ($currentRoles->isEmpty()) {
                        $user->syncRoles([AppRoles::CUSTOMER]);
                        continue;
                    }

                    $convertedRoles = $currentRoles
                        ->map(fn (string $role) => AppRoles::normalize($role))
                        ->filter(fn (?string $role) => $role && AppRoles::isBuiltin($role))
                        ->unique()
                        ->values();

                    if ($convertedRoles->isNotEmpty()) {
                        $user->syncRoles($convertedRoles->all());
                    }
                }
            });

        Role::where('guard_name', 'sanctum')
            ->whereIn('name', AppRoles::legacyRoles())
            ->delete();

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
