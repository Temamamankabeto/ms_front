<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Models\City;
use App\Models\Service;
use App\Models\Subcity;
use App\Models\Woreda;

class PublicAboutController extends Controller
{
    public function index()
    {
        $cities = City::query()
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        $subcities = Subcity::query()
            ->orderBy('name')
            ->get(['id', 'city_id', 'name']);

        $woredas = Woreda::query()
            ->with('subcity:id,city_id,name')
            ->orderBy('name')
            ->get(['id', 'subcity_id', 'name'])
            ->map(fn ($woreda) => [
                'id' => $woreda->id,
                'city_id' => $woreda->subcity?->city_id,
                'subcity_id' => $woreda->subcity_id,
                'subcity_name' => $woreda->subcity?->name,
                'name' => $woreda->name,
            ])
            ->values();

        $services = Service::query()
            ->where('status', 'active')
            ->latest()
            ->get(['id', 'name', 'description', 'has_back_officer', 'service_fee', 'availability', 'status']);

        return response()->json([
            'success' => true,
            'message' => 'About page data retrieved successfully',
            'data' => [
                'summary' => [
                    'cities' => $cities->count(),
                    'subcities' => $subcities->count(),
                    'woredas' => $woredas->count(),
                    'digital_services' => $services->count(),
                ],
                'cities' => $cities,
                'subcities' => $subcities,
                'woredas' => $woredas,
                'services' => $services,
            ],
            'meta' => null,
        ]);
    }
}
