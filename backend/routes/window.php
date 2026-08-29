<?php

use App\Http\Controllers\Api\WindowController;
use App\Http\Controllers\Api\ServiceWindowController;
use App\Http\Controllers\Api\OfficerWindowAssignmentController;
use Illuminate\Support\Facades\Route;
use App\Http\Middleware\EnforceIdleSessionTimeout;

Route::middleware(['auth:sanctum', EnforceIdleSessionTimeout::class])->group(function () {
    Route::get('/windows', [WindowController::class, 'index'])->middleware('permission:windows.read');
    Route::post('/windows', [WindowController::class, 'store'])->middleware('permission:windows.create');
    Route::put('/windows/{window}', [WindowController::class, 'update'])->middleware('permission:windows.update');
    Route::delete('/windows/{window}', [WindowController::class, 'destroy'])->middleware('permission:windows.delete');

    Route::get('/service-window/board', [ServiceWindowController::class, 'board'])->middleware('permission:windows.read');
    Route::post('/service-window/move', [ServiceWindowController::class, 'move'])->middleware('permission:windows.update');
    Route::delete('/service-window/services/{service}', [ServiceWindowController::class, 'unassign'])->middleware('permission:windows.update');

    Route::post('/services/{service}/windows', [ServiceWindowController::class, 'assign'])->middleware('permission:windows.update');
    Route::get('/services/{service}/windows', [ServiceWindowController::class, 'show'])->middleware('permission:windows.read');

    Route::get('/officer-window-assignment/board', [OfficerWindowAssignmentController::class, 'board'])->middleware('permission:windows.read');
    Route::post('/officer-window-assignment/assign', [OfficerWindowAssignmentController::class, 'assign'])->middleware('permission:windows.update');
    Route::delete('/officer-window-assignment/unassign', [OfficerWindowAssignmentController::class, 'unassign'])->middleware('permission:windows.update');
    Route::get('/officer-window-assignment/windows/{window}/officers', [OfficerWindowAssignmentController::class, 'officers'])->middleware('permission:windows.read');
});
