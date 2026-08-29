<?php

namespace App\Support;

use App\Models\User;

class AppRoles
{
    public const SUPER_ADMIN = 'super_admin';
    public const MANAGER = 'manager';
    public const ADMIN = 'admin';
    public const BACK_OFFICER = 'back_officer';
    public const FRONT_OFFICER = 'front_officer';
    public const FEEDBACK = 'feedback';
    public const CUSTOMER = 'customer';

    public const LEVEL_CITY = 'city';
    public const LEVEL_SUBCITY = 'subcity';
    public const LEVEL_WOREDA = 'woreda';

    public static function all(): array
    {
        return [
            self::SUPER_ADMIN,
            self::MANAGER,
            self::ADMIN,
            self::BACK_OFFICER,
            self::FRONT_OFFICER,
            self::FEEDBACK,
            self::CUSTOMER,
        ];
    }

    public static function levels(): array
    {
        return [
            self::LEVEL_CITY,
            self::LEVEL_SUBCITY,
            self::LEVEL_WOREDA,
        ];
    }

    public static function scopedRoles(): array
    {
        return [
            self::MANAGER,
            self::ADMIN,
            self::BACK_OFFICER,
            self::FRONT_OFFICER,
            self::FEEDBACK,
        ];
    }

    public static function labels(): array
    {
        return [
            self::SUPER_ADMIN => 'Super Admin',
            self::MANAGER => 'Manager',
            self::ADMIN => 'Admin',
            self::BACK_OFFICER => 'Back Officer',
            self::FRONT_OFFICER => 'Front Officer',
            self::FEEDBACK => 'Feedback Officer',
            self::CUSTOMER => 'Customer',
        ];
    }

    public static function normalize(?string $role): ?string
    {
        if (!$role) {
            return null;
        }

        $value = strtolower(trim($role));
        $value = str_replace(['-', ' '], '_', $value);
        $value = preg_replace('/_+/', '_', $value);

        $aliases = [
            'super' => self::SUPER_ADMIN,
            'superadmin' => self::SUPER_ADMIN,
            'super_admin' => self::SUPER_ADMIN,
            'general_admin' => self::SUPER_ADMIN,

            'manager' => self::MANAGER,
            'managemer' => self::MANAGER,

            'administrator' => self::ADMIN,
            'admin' => self::ADMIN,

            'back' => self::BACK_OFFICER,
            'backofficer' => self::BACK_OFFICER,
            'back_officer' => self::BACK_OFFICER,

            'front' => self::FRONT_OFFICER,
            'frontofficer' => self::FRONT_OFFICER,
            'front_officer' => self::FRONT_OFFICER,

            'customer' => self::CUSTOMER,

            'feedback' => self::FEEDBACK,
            'feedback_officer' => self::FEEDBACK,
            'feedbackofficer' => self::FEEDBACK,

            // Legacy level-specific roles.
            'city_manager' => self::MANAGER,
            'subcity_manager' => self::MANAGER,
            'woreda_manager' => self::MANAGER,

            'city_admin' => self::ADMIN,
            'subcity_admin' => self::ADMIN,
            'woreda_admin' => self::ADMIN,

            'city_back_officer' => self::BACK_OFFICER,
            'subcity_back_officer' => self::BACK_OFFICER,
            'woreda_back_officer' => self::BACK_OFFICER,

            'city_front_officer' => self::FRONT_OFFICER,
            'subcity_front_officer' => self::FRONT_OFFICER,
            'woreda_front_officer' => self::FRONT_OFFICER,

            'city_feedback' => self::FEEDBACK,
            'subcity_feedback' => self::FEEDBACK,
            'woreda_feedback' => self::FEEDBACK,
        ];

        return $aliases[$value] ?? $value;
    }

    public static function isBuiltin(?string $role): bool
    {
        $role = self::normalize($role);

        return $role && in_array($role, self::all(), true);
    }

    public static function isScoped(?string $role): bool
    {
        return in_array(self::normalize($role), self::scopedRoles(), true);
    }

    public static function normalizeLevel(?string $level): ?string
    {
        if (!$level) {
            return null;
        }

        $level = strtolower(trim($level));
        $level = str_replace(['-', ' '], '_', $level);

        return in_array($level, self::levels(), true) ? $level : null;
    }

    public static function levelFromLocation(
        int|string|null $cityId,
        int|string|null $subcityId,
        int|string|null $woredaId
    ): ?string {
        if ($woredaId) {
            return self::LEVEL_WOREDA;
        }

        if ($subcityId) {
            return self::LEVEL_SUBCITY;
        }

        if ($cityId) {
            return self::LEVEL_CITY;
        }

        return null;
    }

    public static function userLevel(User $user): ?string
    {
        $role = $user->roles()->pluck('name')->first();

        if (!self::isScoped($role)) {
            return null;
        }

        return self::levelFromLocation(
            $user->city_id,
            $user->subcity_id,
            $user->woreda_id
        );
    }

    public static function orderedRoleOptions(): array
    {
        return collect(self::all())
            ->map(fn (string $role) => [
                'name' => $role,
                'label' => self::labels()[$role] ?? $role,
                'is_scoped' => self::isScoped($role),
                'levels' => self::isScoped($role) ? self::levels() : [],
            ])
            ->values()
            ->all();
    }

    public static function legacyRoles(): array
    {
        return [
            'city_manager',
            'subcity_manager',
            'woreda_manager',

            'city_admin',
            'subcity_admin',
            'woreda_admin',

            'city_back_officer',
            'subcity_back_officer',
            'woreda_back_officer',

            'city_front_officer',
            'subcity_front_officer',
            'woreda_front_officer',

            'city_feedback',
            'subcity_feedback',
            'woreda_feedback',

            'managemer',
        ];
    }
}
