<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Models\City;
use App\Models\Subcity;
use App\Models\Woreda;

class PublicLocationController extends Controller
{
    public function index()
    {
        return response()->json([
            'success' => true,
            'message' => 'Locations retrieved successfully',
            'data' => [
                'cities' => City::query()
                    ->orderBy('name')
                    ->get(['id', 'name', 'code']),
                'subcities' => Subcity::query()
                    ->orderBy('name')
                    ->get(['id', 'city_id', 'name']),
                'woredas' => Woreda::query()
                    ->orderBy('name')
                    ->get(['id', 'city_id', 'subcity_id', 'name']),
            ],
        ]);
    }
}
