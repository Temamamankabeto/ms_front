<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Services\HomepageService;

class HomeController extends Controller
{
    public function __construct(
        protected HomepageService $homepageService
    ) {}

    public function index()
    {
        return response()->json([
            'success' => true,
            'message' => 'Homepage data retrieved successfully',
            'data' => $this->homepageService->getHomepageData(),
        ]);
    }
}