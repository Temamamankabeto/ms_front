<?php

use App\Http\Middleware\SecurityHeaders;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

Route::middleware(SecurityHeaders::class)->group(function () {
    Route::get('/', fn () => 'MESOB backend is running');

    Route::get('/storage/{path}', function (string $path) {
        abort_unless(Storage::disk('public')->exists($path), 404);

        return Storage::disk('public')->response($path);
    })->where('path', '.*');
});
