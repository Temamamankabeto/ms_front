<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ApplicationController;
use App\Http\Controllers\Api\ManagerApplicationController;
use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\ServiceApplicationController;
use App\Http\Controllers\Api\Admin\ServiceFormController;
use App\Http\Controllers\Api\Admin\ServiceFormFieldController;
use App\Http\Controllers\Api\Admin\ServiceFormFieldConditionController;
use App\Http\Controllers\Api\Admin\ServiceFormSectionController;
use App\Http\Controllers\Api\Admin\ServiceFormStepController;
use App\Http\Controllers\Api\Admin\ApplicationDashboardController;
use App\Http\Controllers\Api\Admin\ReportingDashboardController;
use App\Http\Controllers\Api\Customer\CustomerServiceApplicationController;
use App\Http\Controllers\Api\Customer\CustomerNotificationController;
use App\Http\Controllers\Api\OfficerApplicationShareController;
use App\Http\Controllers\Api\Public\PublicApplicationController;
use App\Http\Controllers\Api\Public\ApplicationTrackingController;
use App\Http\Controllers\Api\Officer\OfficerApplicationController;
use App\Http\Controllers\Api\Officer\CertificateController;
use App\Http\Controllers\Api\FeedbackController;
use App\Http\Controllers\Api\WindowController;
use App\Http\Controllers\Api\NewsController;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/applications', [ApplicationController::class, 'index'])->middleware('permission:applications.read');
    Route::post('/applications', [ApplicationController::class, 'store'])->middleware('permission:applications.create');
    Route::get('/applications/{application}', [ApplicationController::class, 'show'])->middleware('permission:service_applications.read');
    Route::put('/applications/{application}', [ApplicationController::class, 'update'])->middleware('permission:applications.update');
    Route::delete('/applications/{application}', [ApplicationController::class, 'destroy'])->middleware('permission:applications.delete');
    Route::get('/customer/notifications', [CustomerNotificationController::class, 'index'])->middleware('permission:applications.own');
    Route::get('/customer/service-applications', [CustomerServiceApplicationController::class, 'index'])->middleware('permission:applications.own');
    Route::get('/customer/service-applications/{application}', [CustomerServiceApplicationController::class, 'show'])->middleware('permission:applications.own');
Route::post('/customer/service-applications/{application}/resubmit', [CustomerServiceApplicationController::class, 'resubmit'])->middleware('permission:applications.own');
});

Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->middleware('permission:applications.summary');
    Route::apiResource('service-forms', ServiceFormController::class)->middleware('permission:service_forms.update');
    Route::apiResource('service-form-sections', ServiceFormSectionController::class)->middleware('permission:service_forms.update');
    Route::apiResource('service-form-steps', ServiceFormStepController::class)->middleware('permission:service_forms.update');
    Route::apiResource('service-form-fields', ServiceFormFieldController::class)->middleware('permission:service_forms.update');
    Route::apiResource('service-form-field-conditions', ServiceFormFieldConditionController::class)->middleware('permission:service_forms.update');
    Route::get('/service-applications', [ServiceApplicationController::class, 'index'])->middleware('permission:service_applications.read');
    Route::get('/service-applications/{serviceApplication}', [ServiceApplicationController::class, 'show'])->middleware('permission:service_applications.read');
    Route::put('/service-applications/{serviceApplication}', [ServiceApplicationController::class, 'update'])->middleware('permission:service_applications.update');
    Route::delete('/service-applications/{serviceApplication}', [ServiceApplicationController::class, 'destroy'])->middleware('permission:service_applications.delete');
    Route::get('/applications/summary', [ApplicationDashboardController::class, 'summary'])->middleware('permission:service_applications.read');
    Route::get('/dashboard/reporting', [ReportingDashboardController::class, 'index'])->middleware('permission:applications.summary');
    Route::get('/dashboard/reporting/report', [ReportingDashboardController::class, 'report'])->middleware('permission:applications.summary');


    Route::prefix('news')->group(function () {
        Route::get('/', [NewsController::class, 'index'])->middleware('permission:services.read');
        Route::post('/', [NewsController::class, 'store'])->middleware('permission:services.create');
        Route::get('{news}', [NewsController::class, 'show'])->middleware('permission:services.read');
        Route::put('{news}', [NewsController::class, 'update'])->middleware('permission:services.update');
        Route::patch('{news}', [NewsController::class, 'update'])->middleware('permission:services.update');
        Route::delete('{news}', [NewsController::class, 'destroy'])->middleware('permission:services.delete');
    });


});

Route::prefix('public')->group(function () {
    Route::get('/services/{service}/form', [PublicApplicationController::class, 'form']);
    Route::middleware('auth:sanctum')->post('/services/{service}/apply', [PublicApplicationController::class, 'apply']);
    Route::post('/track-application', [ApplicationTrackingController::class, 'track'])->middleware('throttle:track-application');
});

Route::middleware('auth:sanctum')->prefix('officer')->group(function () {
    Route::get('/applications/queue', [OfficerApplicationController::class, 'queue'])->middleware('permission:service_applications.read');
    Route::get('/notifications', [OfficerApplicationController::class, 'notifications']);
    Route::get('/applications/{application}', [OfficerApplicationController::class, 'show'])->middleware('permission:service_applications.read');
    Route::get('/sharing/windows', [OfficerApplicationShareController::class, 'windows']);
    Route::get('/sharing/windows/{window}/officers', [OfficerApplicationShareController::class, 'officers']);
    Route::post('/applications/{application}/share-to-officer', [OfficerApplicationShareController::class, 'share'])->middleware('permission:applications.create');
    Route::post('/applications/{application}/accept', [OfficerApplicationController::class, 'accept'])->middleware('permission:applications.create');
    Route::post('/applications/{application}/appointment', [OfficerApplicationController::class, 'appointment'])->middleware('permission:applications.create');
    Route::post('/applications/{application}/share', [OfficerApplicationController::class, 'share'])->middleware('permission:applications.create');
    Route::post('/applications/{application}/forward-to-back-officer', [OfficerApplicationController::class, 'forwardToBackOfficer'])->middleware('permission:applications.create');
    Route::post('/applications/{application}/approve', [OfficerApplicationController::class, 'approve'])->middleware('permission:service_applications.approve');
    Route::post('/applications/{application}/reject', [OfficerApplicationController::class, 'reject'])->middleware('permission:service_applications.reject');
    Route::post('/applications/{application}/return', [OfficerApplicationController::class, 'returnApplication'])->middleware('permission:service_applications.return');
    Route::post('/applications/{application}/complete', [OfficerApplicationController::class, 'complete'])->middleware('permission:service_applications.complete');
    Route::post('/applications/{application}/escalate-to-manager', [OfficerApplicationController::class, 'escalateToManager'])->middleware('permission:applications.create');
    Route::get('/applications/{application}/certificate', [CertificateController::class, 'download'])->middleware('permission:service_applications.read');
});

Route::middleware('auth:sanctum')->prefix('manager')->group(function () {
    Route::get('/applications/queue', [ManagerApplicationController::class, 'queue'])->middleware('permission:service_applications.read');
    Route::get('/applications/{application}', [ManagerApplicationController::class, 'show'])->middleware('permission:service_applications.read');
    Route::post('/applications/{application}/assign-officer', [ManagerApplicationController::class, 'assign'])->middleware('permission:applications.create');
    Route::post('/applications/{application}/return-to-officer', [ManagerApplicationController::class, 'returnToOfficer'])->middleware('permission:service_applications.return');
    Route::post('/applications/{application}/escalate-up', [ManagerApplicationController::class, 'escalateUp'])->middleware('permission:applications.create');
});


// Public kiosk submission — no login required at the service window.
Route::post('feedback', [FeedbackController::class, 'store'])->middleware('permission:feedback.update');

// Viewing / managing feedback requires an authenticated agent so it can be
// scoped to their city / subcity / woreda.
Route::middleware('auth:sanctum')->group(function () {
    Route::get('feedback', [FeedbackController::class, 'index'])->middleware('permission:feedback.read');
    Route::get('feedback/{feedback}', [FeedbackController::class, 'show'])->middleware('permission:feedback.read');
    Route::put('feedback/{feedback}', [FeedbackController::class, 'update'])->middleware('permission:feedback.update');
    Route::patch('feedback/{feedback}', [FeedbackController::class, 'update'])->middleware('permission:feedback.update');
    Route::delete('feedback/{feedback}', [FeedbackController::class, 'destroy'])->middleware('permission:feedback.delete');
});

Route::get(
    'windows/{window}/services',
    [WindowController::class, 'services']
);
