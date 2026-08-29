<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\Public\HomeController;
use App\Http\Controllers\Api\Public\PublicLocationController;
use App\Http\Controllers\Api\Public\PublicServiceController;
use App\Http\Controllers\Api\Public\ApplicationTrackingController;
use App\Http\Controllers\Api\Public\ContactController;
use App\Http\Controllers\Api\Public\PublicReportController;
use App\Http\Controllers\Api\Public\PublicNewsController;
use App\Http\Controllers\Api\Chatbot\PublicChatbotController;

Route::prefix('public')->group(function () {
    Route::get('/homepage', [HomeController::class, 'index']);
    Route::get('/locations', [PublicLocationController::class, 'index']);
    Route::get('/services', [PublicServiceController::class, 'index']);
    Route::get('/services/featured', [PublicServiceController::class, 'featured']);
    Route::get('/window-services', [PublicServiceController::class, 'windowServices']);
    Route::get('/feedback-windows', [PublicServiceController::class, 'feedbackWindows']);
    Route::get('/services/{service}', [PublicServiceController::class, 'show']);
    Route::post('/track-application', [ApplicationTrackingController::class, 'track'])->middleware('throttle:track-application');
    Route::post('/contact', [ContactController::class, 'store']);
    Route::post('/chatbot/message', [PublicChatbotController::class, 'message']);
    Route::get('/reports/dashboard', [PublicReportController::class, 'dashboard']);
    Route::get('/news', [PublicNewsController::class, 'index']);
});
