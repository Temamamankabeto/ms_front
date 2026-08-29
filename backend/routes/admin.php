<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\{
    AuditLogController,
    CustomerController,
    DashboardController,
    EserviceReportController,
    NotificationController,
    PermissionController,
    RoleController,
    UserController
};

/*
|--------------------------------------------------------------------------
| AUTH USER
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/profile/update', [UserController::class, 'updateProfile']);
});

/*
|--------------------------------------------------------------------------
| ADMIN API
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->prefix('admin')->group(function ()
{


    /*
    |--------------------------------------------------------------------------
    | DASHBOARD
    |--------------------------------------------------------------------------
    */
    Route::prefix('dashboard')->group(function () {
        Route::get('/', [DashboardController::class, 'overview']);
        Route::get('/city', [DashboardController::class, 'cityDashboard']);
        Route::get('/subcity', [DashboardController::class, 'subcityDashboard']);
        Route::get('/woreda', [DashboardController::class, 'woredaDashboard']);
        Route::get('/officer', [DashboardController::class, 'officerDashboard']);
        Route::get('/customer', [DashboardController::class, 'customerDashboard']);
    });

    /*
    |--------------------------------------------------------------------------
    | USERS
    |--------------------------------------------------------------------------
    */
    Route::prefix('users')->group(function () {
        Route::get('/roles-lite', [UserController::class, 'rolesLite']);

        Route::get('/', [UserController::class, 'index']);
        Route::get('{id}', [UserController::class, 'show']);
        Route::post('/', [UserController::class, 'store']);
        Route::put('{id}', [UserController::class, 'update']);
        Route::delete('{id}', [UserController::class, 'destroy']);

        Route::patch('{id}/toggle', [UserController::class, 'toggle']);
        Route::post('{id}/reset-password', [UserController::class, 'resetPassword']);
        Route::post('{id}/roles', [UserController::class, 'assignRole']);
    });


    /*
    |--------------------------------------------------------------------------
    | PERMISSIONS
    |--------------------------------------------------------------------------
    */
    Route::prefix('permissions')->group(function () {
        Route::get('/', [PermissionController::class, 'index']);
        Route::post('/', [PermissionController::class, 'store']);
        Route::put('{id}', [PermissionController::class, 'update']);
        Route::delete('{id}', [PermissionController::class, 'destroy']);
    });

    /*
    |--------------------------------------------------------------------------
    | CUSTOMERS
    |--------------------------------------------------------------------------
    */
    Route::prefix('customers')->group(function () {
        Route::get('{id}', [CustomerController::class, 'show']);
        Route::put('{id}', [CustomerController::class, 'update']);

        Route::patch('{id}/verify', [CustomerController::class, 'verify']);
        Route::patch('{id}/reject', [CustomerController::class, 'reject']);
    });

    /*
    |--------------------------------------------------------------------------
    | AUDIT LOGS
    |--------------------------------------------------------------------------
    */


    /*
    |--------------------------------------------------------------------------
    | REPORTS
    |--------------------------------------------------------------------------
    */
    Route::prefix('reports')->group(function () {
        Route::get('/users-summary', [EserviceReportController::class, 'usersSummary']);
        Route::get('/users-by-location', [EserviceReportController::class, 'usersByLocation']);
        Route::get('/role-assignments', [EserviceReportController::class, 'roleAssignments']);
        Route::get('/customer-verification', [EserviceReportController::class, 'customerVerification']);
    });

    /*
    |--------------------------------------------------------------------------
    | NOTIFICATIONS
    |--------------------------------------------------------------------------
    */
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
        Route::post('{id}/read', [NotificationController::class, 'markRead']);
        Route::post('/read-all', [NotificationController::class, 'markAllRead']);
    });



});
