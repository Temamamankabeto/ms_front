<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Admin\ApplicationDashboardController;
use App\Http\Controllers\Api\Admin\ApplicationReportController;

Route::middleware('auth:sanctum')->group(function () {

    Route::get(
        '/dashboard/application-stats',
        [ApplicationDashboardController::class, 'stats']
    );

    Route::get(
        '/reports/application-summary',
        [ApplicationReportController::class, 'summary']
    );
});
