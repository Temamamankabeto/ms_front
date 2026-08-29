<?php

namespace Database\Seeders;

use App\Models\Office;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class MunicipalityUserSeeder extends Seeder
{
    public function run(): void
    {
        $city = Office::where('type', Office::TYPE_CITY)
            ->orderBy('id')
            ->first();

        $users = [
            [
                'name' => 'Super Admin',
                'email' => 'superadmin@adama.gov.et',
                'phone' => '+251900000001',
                'role' => User::ROLE_SUPER_ADMIN,
            ],
            [
                'name' => 'Manager',
                'email' => 'manager@adama.gov.et',
                'phone' => '+251900000002',
                'role' => User::ROLE_MANAGER,
            ],
            [
                'name' => 'Head of Development Branch',
                'email' => 'development@adama.gov.et',
                'phone' => '+251900000003',
                'role' => User::ROLE_HEAD_DEVELOPMENT_BRANCH,
            ],
            [
                'name' => 'Head of Service Branch',
                'email' => 'service@adama.gov.et',
                'phone' => '+251900000004',
                'role' => User::ROLE_HEAD_SERVICE_BRANCH,
            ],
            [
                'name' => 'Team Leader',
                'email' => 'teamleader@adama.gov.et',
                'phone' => '+251900000005',
                'role' => User::ROLE_TEAM_LEADER,
            ],
            [
                'name' => 'Expert',
                'email' => 'expert@adama.gov.et',
                'phone' => '+251900000006',
                'role' => User::ROLE_EXPERT,
            ],
            [
                'name' => 'Secretory',
                'email' => 'secretory@adama.gov.et',
                'phone' => '+251900000007',
                'role' => User::ROLE_SECRETORY,
            ],
            [
                'name' => 'Accountant',
                'email' => 'accountant@adama.gov.et',
                'phone' => '+251900000008',
                'role' => User::ROLE_ACCOUNTANT,
            ],
            [
                'name' => 'Record Officer',
                'email' => 'record@adama.gov.et',
                'phone' => '+251900000009',
                'role' => User::ROLE_RECORD_OFFICER,
            ],
        ];

        foreach ($users as $user) {
            $this->createUser(
                $user['name'],
                $user['email'],
                $user['phone'],
                $user['role'],
                $city
            );
        }
    }

    protected function createUser(
        string $name,
        string $email,
        string $phone,
        string $role,
        ?Office $office
    ): void {
        $user = User::query()
            ->where('email', $email)
            ->orWhere('phone', $phone)
            ->first();

        if (! $user) {
            $user = new User();
            $user->password = Hash::make('Admin@12345');
        }

        $user->forceFill([
            'name' => $name,
            'email' => $email,
            'phone' => $phone,
            'is_active' => true,
            'admin_level' => null,
            'office_id' => $office?->id,
            'department_id' => null,
            'sub_city_id' => null,
            'woreda_id' => null,
            'zone_id' => null,
        ])->save();

        $user->syncRoles([$role]);
    }
}