<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Admin\ApplicationCertificateController;

Route::middleware('auth:sanctum')->group(function () {

    Route::get(
        '/applications/{application}/certificate',
        [ApplicationCertificateController::class, 'generate']
    );
});
