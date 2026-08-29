<?php

use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\PermissionController;
use App\Http\Controllers\Api\OfficeController;
use App\Http\Controllers\Api\ServiceProviderController;
use App\Http\Controllers\Api\CityController;
use App\Http\Controllers\Api\SubcityController;
use App\Http\Controllers\Api\WoredaController;
use App\Http\Controllers\Api\CustomerController;

use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\UserActivationRequestController;
use App\Http\Controllers\SmsController;
use Illuminate\Support\Facades\Route;
use App\Http\Middleware\EnforceIdleSessionTimeout;

Route::middleware(['auth:sanctum', EnforceIdleSessionTimeout::class])->group(function () {
    Route::get('/profile', [UserController::class, 'profile']);
    Route::post('/profile/update', [UserController::class, 'updateProfile']);
    Route::post('/profile/change-password', [UserController::class, 'changeOwnPassword']);
});

Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
    Route::get('/users', [UserController::class, 'index'])->middleware('permission:users.read');
    Route::get('/users/roles-lite', [UserController::class, 'rolesLite'])->middleware('permission:roles.read');
    Route::get('/users/{id}', [UserController::class, 'show'])->middleware('permission:users.read');
    Route::post('/users', [UserController::class, 'store'])->middleware('permission:users.create');
    Route::put('/users/{id}', [UserController::class, 'update'])->middleware('permission:users.update');
    Route::delete('/users/{id}', [UserController::class, 'destroy'])->middleware('permission:users.delete');
    Route::post('/users/{id}/roles', [UserController::class, 'assignRole'])->middleware('permission:roles.update');
    Route::post('/users/{id}/reset-password', [UserController::class, 'resetPassword'])->middleware('permission:users.update');
    Route::patch('/users/{id}/toggle', [UserController::class, 'toggle'])->middleware('permission:users.update');
    Route::post('/users/{id}/change-password', [UserController::class, 'changePassword'])->middleware('permission:users.update');
    Route::patch('/users/{id}/toggle-status', [UserController::class, 'toggleStatus'])->middleware('permission:users.update');

    Route::get('/user-activation-requests', [UserActivationRequestController::class, 'index'])->middleware('permission:users.read');
    Route::post('/user-activation-requests/bulk-verify', [UserActivationRequestController::class, 'bulkVerify'])->middleware('permission:users.activate');
    Route::post('/user-activation-requests/bulk-approve', [UserActivationRequestController::class, 'bulkApprove'])->middleware('permission:users.activate');
    Route::post('/user-activation-requests/{activationRequest}/verify', [UserActivationRequestController::class, 'verify'])->middleware('permission:users.activate');
    Route::post('/user-activation-requests/{activationRequest}/approve', [UserActivationRequestController::class, 'approve'])->middleware('permission:users.activate');
    Route::post('/user-activation-requests/{activationRequest}/reject', [UserActivationRequestController::class, 'reject'])->middleware('permission:users.activate');

    Route::get('/roles', [RoleController::class, 'index'])->middleware('permission:roles.read');
    Route::post('/roles', [RoleController::class, 'store'])->middleware('permission:roles.create');
    Route::put('/roles/{id}', [RoleController::class, 'update'])->middleware('permission:roles.update');
    Route::get('/roles/{id}/permissions', [RoleController::class, 'rolePermissions'])->middleware('permission:roles.read');
    Route::post('/roles/{id}/permissions', [RoleController::class, 'assignPermissions'])->middleware('permission:roles.assign_permissions');

    Route::get('/permissions', [PermissionController::class, 'index'])->middleware('permission:permissions.read');
    Route::post('/permissions', [PermissionController::class, 'store'])->middleware('permission:permissions.create');
    Route::put('/permissions/{id}', [PermissionController::class, 'update'])->middleware('permission:permissions.update');
    Route::delete('/permissions/{id}', [PermissionController::class, 'destroy'])->middleware('permission:permissions.delete');

    Route::get('/offices', [OfficeController::class, 'index'])->middleware('permission:users.read');
    Route::post('/offices', [OfficeController::class, 'store'])->middleware('permission:users.update');
    Route::get('/offices/{office}', [OfficeController::class, 'show'])->middleware('permission:users.read');
    Route::put('/offices/{office}', [OfficeController::class, 'update'])->middleware('permission:users.update');
    Route::delete('/offices/{office}', [OfficeController::class, 'destroy'])->middleware('permission:users.update');



    Route::get('/service-providers', [ServiceProviderController::class, 'index'])->middleware('permission:service_providers.read');
    Route::post('/service-providers', [ServiceProviderController::class, 'store'])->middleware('permission:service_providers.create');
    Route::get('/service-providers/{serviceProvider}', [ServiceProviderController::class, 'show'])->middleware('permission:service_providers.read');
    Route::put('/service-providers/{serviceProvider}', [ServiceProviderController::class, 'update'])->middleware('permission:service_providers.update');
    Route::delete('/service-providers/{serviceProvider}', [ServiceProviderController::class, 'destroy'])->middleware('permission:service_providers.delete');

    Route::apiResource('cities', CityController::class)->middleware('permission:users.read');
    Route::apiResource('subcities', SubcityController::class)->middleware('permission:users.read');
    Route::apiResource('woredas', WoredaController::class)->middleware('permission:users.read');

    Route::get('/audit-logs', [AuditLogController::class, 'index'])->middleware('permission:audit_logs.read');
    Route::post('/audit-logs', [AuditLogController::class, 'store'])->middleware('permission:audit_logs.read');
    Route::get('/audit-logs/{id}', [AuditLogController::class, 'show'])->middleware('permission:audit_logs.read');
    Route::put('/audit-logs/{id}', [AuditLogController::class, 'update'])->middleware('permission:audit_logs.read');
    Route::delete('/audit-logs/{id}', [AuditLogController::class, 'destroy'])->middleware('permission:audit_logs.read');
});

Route::middleware(['auth:sanctum', EnforceIdleSessionTimeout::class, 'permission:users.update'])->post('/sms/send-phone', [SmsController::class, 'sendPhone']);
Route::middleware(['auth:sanctum', EnforceIdleSessionTimeout::class, 'permission:users.update'])->post('/sms/send-otp', [SmsController::class, 'sendOtp']);
Route::middleware(['auth:sanctum', EnforceIdleSessionTimeout::class, 'permission:users.update'])->post('/sms/send-bulk', [SmsController::class, 'sendBulk']);

Route::get(
    '/feedback/{token}',
    [FeedbackController::class, 'show']
);

Route::post(
    '/feedback/{token}',
    [FeedbackController::class, 'store']
);

Route::middleware(['auth:sanctum', EnforceIdleSessionTimeout::class, 'permission:users.read'])->get('/customers', [CustomerController::class, 'customerlist']);
  Route::middleware(['auth:sanctum', EnforceIdleSessionTimeout::class, 'permission:users.read'])->get('/customers/{id}', [CustomerController::class, 'show']);
