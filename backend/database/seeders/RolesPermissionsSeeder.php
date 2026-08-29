<?php

namespace Database\Seeders;

use App\Models\User;
use App\Support\AppRoles;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $permissions = [
            'auth.me',

            'users.read',
            'users.create',
            'users.update',
            'users.delete',
            'users.activate',
            'users.deactivate',
            'users.reset_password',
            'users.assign_role',

            'roles.read',
            'roles.create',
            'roles.update',
            'roles.delete',
            'roles.assign_permissions',

            'permissions.read',
            'permissions.create',
            'permissions.update',
            'permissions.delete',

            'cities.read',
            'cities.create',
            'cities.update',
            'cities.delete',

            'subcities.read',
            'subcities.create',
            'subcities.update',
            'subcities.delete',

            'woredas.read',
            'woredas.create',
            'woredas.update',
            'woredas.delete',

            'services.read',
            'services.create',
            'services.update',
            'services.delete',

            'service_providers.read',
            'service_providers.create',
            'service_providers.update',
            'service_providers.delete',

            'windows.read',
            'windows.create',
            'windows.update',
            'windows.delete',

            'service_forms.read',
            'service_forms.create',
            'service_forms.update',
            'service_forms.delete',
            'service_forms.builder',

            'service_applications.read',
            'service_applications.create',
            'service_applications.update',
            'service_applications.delete',
            'service_applications.review',
            'service_applications.approve',
            'service_applications.reject',
            'service_applications.return',
            'service_applications.complete',
            'service_applications.certificate',

            'applications.read',
            'applications.create',
            'applications.update',
            'applications.delete',
            'applications.track',
            'applications.summary',
            'applications.own',

            'audit_logs.read',

            'reports.city',
            'reports.subcity',
            'reports.woreda',
            'reports.officer',
            'reports.customer',

            'feedback.read',
            'feedback.update',
            'feedback.delete',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => 'sanctum',
            ]);
        }

        $all = Permission::where('guard_name', 'sanctum')
            ->pluck('name')
            ->values()
            ->all();

        $managerPermissions = [
            'auth.me',

            'users.read',
            'users.create',
            'users.update',
            'users.activate',
            'users.deactivate',
            'users.reset_password',
            'users.assign_role',

            'roles.read',
            'permissions.read',

            'cities.read',
            'subcities.read',
            'woredas.read',

            'services.read',
            'services.create',
            'services.update',

            'windows.read',
            'windows.create',
            'windows.update',

            'service_forms.read',
            'service_forms.create',
            'service_forms.update',
            'service_forms.delete',
            'service_forms.builder',

            'service_applications.read',
            'service_applications.update',
            'service_applications.review',
            'service_applications.approve',
            'service_applications.reject',
            'service_applications.return',
            'service_applications.complete',
            'service_applications.certificate',

            'applications.read',
            'applications.update',
            'applications.summary',

            'audit_logs.read',

            'reports.city',
            'reports.subcity',
            'reports.woreda',

            'feedback.read',
            'feedback.update',
            'feedback.delete',
        ];

        $adminPermissions = [
            'auth.me',

            'users.read',
            'users.create',
            'users.update',
            'users.activate',
            'users.deactivate',
            'users.reset_password',
            'users.assign_role',

            'roles.read',
            'permissions.read',

            'cities.read',
            'subcities.read',
            'woredas.read',

            'services.read',
            'services.create',
            'services.update',

            'windows.read',
            'windows.create',
            'windows.update',

            'service_forms.read',
            'service_forms.create',
            'service_forms.update',
            'service_forms.builder',

            'service_applications.read',
            'service_applications.update',
            'service_applications.review',

            'applications.read',
            'applications.update',
            'applications.summary',

            'audit_logs.read',

            'feedback.read',
        ];

        $frontOfficerPermissions = [
            'auth.me',
            'users.read',
            'services.read',
            'service_forms.read',
            'service_applications.read',
            'service_applications.create',
            'service_applications.update',
            'service_applications.review',
            'service_applications.return',
            'applications.read',
            'applications.create',
            'applications.track',
            'reports.officer',
        ];

        $backOfficerPermissions = [
            'auth.me',
            'users.read',
            'services.read',
            'service_applications.read',
            'service_applications.update',
            'service_applications.review',
            'service_applications.approve',
            'service_applications.reject',
            'service_applications.return',
            'service_applications.complete',
            'service_applications.certificate',
            'applications.read',
            'applications.update',
            'reports.officer',
        ];

        $customerPermissions = [
            'auth.me',
            'services.read',
            'service_forms.read',
            'service_applications.create',
            'applications.own',
            'applications.track',
            'reports.customer',
        ];

        $feedbackPermissions = [
            'auth.me',
            'users.read',

            'services.read',
            'windows.read',

            'cities.read',
            'subcities.read',
            'woredas.read',

            'feedback.read',
            'feedback.update',
            'feedback.delete',

            'reports.city',
            'reports.subcity',
            'reports.woreda',
        ];

        $roleMap = [
            AppRoles::SUPER_ADMIN => $all,
            AppRoles::MANAGER => $managerPermissions,
            AppRoles::ADMIN => $adminPermissions,
            AppRoles::FRONT_OFFICER => $frontOfficerPermissions,
            AppRoles::BACK_OFFICER => $backOfficerPermissions,
            AppRoles::FEEDBACK => $feedbackPermissions,
            AppRoles::CUSTOMER => $customerPermissions,
        ];

        foreach ($roleMap as $roleName => $permissionsForRole) {
            $role = Role::firstOrCreate([
                'name' => $roleName,
                'guard_name' => 'sanctum',
            ]);

            $role->syncPermissions($permissionsForRole);
        }

        // Keep user creation out of this seeder to avoid unique email/phone
        // collisions when existing production/demo users are already present.
        // Users should be created through /api/admin/users or a dedicated
        // environment-specific seeder.

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
