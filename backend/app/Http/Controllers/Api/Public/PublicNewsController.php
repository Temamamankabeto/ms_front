<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use Illuminate\Http\Request;

class PublicNewsController extends Controller
{
    public function index(Request $request)
    {
        $items = Announcement::query()
            ->where('status', 'active')
            ->with('city:id,name')
            ->when($request->filled('city_id'), fn ($query) => $query->where('city_id', $request->integer('city_id')))
            ->latest()
            ->paginate(min(max((int) $request->integer('per_page', 12), 1), 50));

        return response()->json([
            'success' => true,
            'message' => 'News retrieved successfully',
            'data' => $items->items(),
            'meta' => [
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
                'per_page' => $items->perPage(),
                'total' => $items->total(),
            ],
        ]);
    }
}
