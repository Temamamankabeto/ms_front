<?php

namespace Database\Seeders;

use App\Models\City;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class ScopedUserSeeder extends Seeder
{
    public function run(): void
    {
        $city = City::query()->first();

        if (! $city) {
            $this->command?->warn('No city found. Seed cities first.');
            return;
        }

        $keepEmails = [
            'superadmin@mesob.com',
            'cityadmin@mesob.com',
        ];

        $seedPhones = [
            '0992000001',
            '0992000002',
        ];

        User::query()
            ->where(function ($query) use ($keepEmails, $seedPhones) {
                $query
                    ->whereIn('phone', $seedPhones)
                    ->orWhereIn('email', $keepEmails);
            })
            ->whereNotIn('email', $keepEmails)
            ->delete();

        $superAdminRole = Role::firstOrCreate([
            'name' => 'super_admin',
            'guard_name' => 'sanctum',
        ]);

        $adminRole = Role::firstOrCreate([
            'name' => 'admin',
            'guard_name' => 'sanctum',
        ]);

        $superAdmin = User::updateOrCreate(
            ['email' => 'superadmin@mesob.com'],
            [
                'name' => 'Super Admin',
                'phone' => '0992000001',
                'password' => Hash::make('password'),
                'is_active' => true,
                'status' => 'active',
                'user_type' => 'staff',
                'city_id' => $city->id,
                'subcity_id' => null,
                'woreda_id' => null,
            ]
        );

        $superAdmin->syncRoles([$superAdminRole]);

        $cityAdmin = User::updateOrCreate(
            ['email' => 'cityadmin@mesob.com'],
            [
                'name' => 'Adama Admin',
                'phone' => '0992000002',
                'password' => Hash::make('password'),
                'is_active' => true,
                'status' => 'active',
                'user_type' => 'staff',
                'city_id' => $city->id,
                'subcity_id' => null,
                'woreda_id' => null,
            ]
        );

        $cityAdmin->syncRoles([$adminRole]);
    }
}