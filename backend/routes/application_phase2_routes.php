<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Admin\ApplicationWorkflowController;
use App\Http\Controllers\Api\Admin\ApplicationAssignmentController;

Route::middleware('auth:sanctum')->group(function () {

    Route::post(
        '/applications/{application}/assign',
        [ApplicationAssignmentController::class, 'assign']
    );

    Route::post(
        '/applications/{application}/approve',
        [ApplicationWorkflowController::class, 'approve']
    );

    Route::post(
        '/applications/{application}/reject',
        [ApplicationWorkflowController::class, 'reject']
    );

    Route::post(
        '/applications/{application}/return',
        [ApplicationWorkflowController::class, 'returnForCorrection']
    );

    Route::post(
        '/applications/{application}/complete',
        [ApplicationWorkflowController::class, 'complete']
    );
});
