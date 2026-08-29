<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            EserviceRolesSeeder::class,
            RolesPermissionsSeeder::class,

            RoleConversionSeeder::class,
            LocationSeeder::class,
            WindowSeeder::class,
            ServiceSeeder::class,
            ServiceProviderSeeder::class,



              ScopedUserSeeder::class,
            FeedbackSeeder::class,
        ]);
    }
}
