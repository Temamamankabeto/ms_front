<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\ServiceFormController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\ServiceCriterionController;
use App\Http\Controllers\Api\UserServiceAssignmentController;
use App\Http\Controllers\Api\ServiceFormSectionController;
use App\Http\Controllers\Api\ServiceFormFieldController;
use App\Http\Controllers\SmsController;
use App\Http\Middleware\EnforceIdleSessionTimeout;

Route::middleware(['auth:sanctum', EnforceIdleSessionTimeout::class])->group(function () {
    Route::get('/services', [ServiceController::class, 'index'])->middleware('permission:services.read');
    Route::get('/services-dropdown', [ServiceController::class, 'allServices'])->middleware('permission:services.read');
    Route::post('/services', [ServiceController::class, 'store'])->middleware('permission:services.create');
    Route::put('/services/{service}', [ServiceController::class, 'update'])->middleware('permission:services.update');
    Route::delete('/services/{service}', [ServiceController::class, 'destroy'])->middleware('permission:services.delete');

    Route::apiResource('service-criteria', ServiceCriterionController::class)->middleware('permission:services.update');

    Route::apiResource('service-forms', ServiceFormController::class)->middleware('permission:service_forms.update');

    Route::get('/user-services/board', [UserServiceAssignmentController::class, 'board'])->middleware('permission:services.read');
    Route::post('/user-services/assign', [UserServiceAssignmentController::class, 'assignAdvanced'])->middleware('permission:services.update');
    Route::delete('/user-services/unassign', [UserServiceAssignmentController::class, 'unassignAdvanced'])->middleware('permission:services.update');

    Route::get('/users/{user}/services', [UserServiceAssignmentController::class, 'show'])->middleware('permission:services.read');
    Route::post('/users/{user}/services', [UserServiceAssignmentController::class, 'assign'])->middleware('permission:services.update');
    Route::delete('/users/{user}/services/{serviceId}', [UserServiceAssignmentController::class, 'remove'])->middleware('permission:services.update');
    Route::patch('/users/{user}/services/{serviceId}/toggle', [UserServiceAssignmentController::class, 'toggle'])->middleware('permission:services.update');

    Route::get('/service-officers', [UserServiceAssignmentController::class, 'officers'])->middleware('permission:services.read');

    Route::get('/service-form-sections', [ServiceFormSectionController::class, 'index'])->middleware('permission:service_forms.read');
    Route::post('/service-form-sections', [ServiceFormSectionController::class, 'store'])->middleware('permission:service_forms.create');
    Route::get('/service-form-sections/{serviceFormSection}', [ServiceFormSectionController::class, 'show'])->middleware('permission:service_forms.read');
    Route::put('/service-form-sections/{serviceFormSection}', [ServiceFormSectionController::class, 'update'])->middleware('permission:service_forms.update');
    Route::delete('/service-form-sections/{serviceFormSection}', [ServiceFormSectionController::class, 'destroy'])->middleware('permission:service_forms.delete');

    Route::get('/service-form-fields', [ServiceFormFieldController::class, 'index'])->middleware('permission:service_forms.read');
    Route::post('/service-form-fields', [ServiceFormFieldController::class, 'store'])->middleware('permission:service_forms.create');
    Route::get('/service-form-fields/{serviceFormField}', [ServiceFormFieldController::class, 'show'])->middleware('permission:service_forms.read');
    Route::put('/service-form-fields/{serviceFormField}', [ServiceFormFieldController::class, 'update'])->middleware('permission:service_forms.update');
    Route::delete('/service-form-fields/{serviceFormField}', [ServiceFormFieldController::class, 'destroy'])->middleware('permission:service_forms.delete');
});

    Route::middleware(['auth:sanctum', EnforceIdleSessionTimeout::class, 'permission:users.update'])->post('/sms/send-phone', [SmsController::class, 'sendPhone']);
    Route::middleware(['auth:sanctum', EnforceIdleSessionTimeout::class, 'permission:users.update'])->post('/sms/send-otp', [SmsController::class, 'sendOtp']);
    Route::middleware(['auth:sanctum', EnforceIdleSessionTimeout::class, 'permission:users.update'])->post('/sms/send-bulk', [SmsController::class, 'sendBulk']);
