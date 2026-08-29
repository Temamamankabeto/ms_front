<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Models\ServiceProvider;
use Illuminate\Http\JsonResponse;

class PublicServiceProviderController extends Controller
{
    public function index(): JsonResponse
    {
        $providers = ServiceProvider::query()
            ->select(['id', 'name'])
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Service providers retrieved successfully.',
            'data' => $providers,
            'meta' => [
                'total' => $providers->count(),
            ],
        ]);
    }
}
