<?php

namespace Database\Seeders;

use App\Support\AppRoles;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class EserviceRolesSeeder extends Seeder
{
    public function run(): void
    {
        foreach (AppRoles::all() as $role) {
            Role::firstOrCreate([
                'name' => $role,
                'guard_name' => 'sanctum',
            ]);
        }
    }
}
