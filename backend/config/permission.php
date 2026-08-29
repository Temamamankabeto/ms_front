<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Guard
    |--------------------------------------------------------------------------
    | VERY IMPORTANT FOR API PROJECTS
    */
    'defaults' => [
        'guard' => 'sanctum',
    ],

    /*
    |--------------------------------------------------------------------------
    | Models
    |--------------------------------------------------------------------------
    */
    'models' => [

        'permission' => Spatie\Permission\Models\Permission::class,

        'role' => Spatie\Permission\Models\Role::class,

    ],

    /*
    |--------------------------------------------------------------------------
    | Table Names
    |--------------------------------------------------------------------------
    */
    'table_names' => [

        'roles' => 'roles',

        'permissions' => 'permissions',

        'model_has_permissions' => 'model_has_permissions',

        'model_has_roles' => 'model_has_roles',

        'role_has_permissions' => 'role_has_permissions',
    ],

    /*
    |--------------------------------------------------------------------------
    | Column Names
    |--------------------------------------------------------------------------
    */
    'column_names' => [

        'role_pivot_key' => null,
        'permission_pivot_key' => null,

        'model_morph_key' => 'model_id',

        'team_foreign_key' => 'team_id',
    ],

    /*
    |--------------------------------------------------------------------------
    | Permission Gate Registration
    |--------------------------------------------------------------------------
    */
    'register_permission_check_method' => true,

    'register_octane_reset_listener' => false,

    'events_enabled' => false,

    /*
    |--------------------------------------------------------------------------
    | Teams
    |--------------------------------------------------------------------------
    */
    'teams' => false,

    'team_resolver' => \Spatie\Permission\DefaultTeamResolver::class,

    /*
    |--------------------------------------------------------------------------
    | Passport
    |--------------------------------------------------------------------------
    */
    'use_passport_client_credentials' => false,

    /*
    |--------------------------------------------------------------------------
    | Exception Visibility
    |--------------------------------------------------------------------------
    */
    'display_permission_in_exception' => true,

    'display_role_in_exception' => true,

    /*
    |--------------------------------------------------------------------------
    | Wildcard Permission
    |--------------------------------------------------------------------------
    */
    'enable_wildcard_permission' => false,

    /*
    |--------------------------------------------------------------------------
    | Cache
    |--------------------------------------------------------------------------
    */
    'cache' => [

        'expiration_time' => \DateInterval::createFromDateString('24 hours'),

        'key' => 'spatie.permission.cache',

        'store' => 'default',
    ],
];