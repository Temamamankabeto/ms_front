<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Office;
use Illuminate\Http\Request;

class OfficeController extends Controller
{
    // GET all offices
    public function index()
    {
        $offices = Office::latest()->get();

        return response()->json([
            'status' => true,
            'data' => $offices
        ]);
    }

    // CREATE office
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $office = Office::create([
            'name' => $request->name,
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Office created successfully',
            'data' => $office
        ], 201);
    }

    // SHOW single office
    public function show(Office $office)
    {
        return response()->json([
            'status' => true,
            'data' => $office
        ]);
    }

    // UPDATE office
    public function update(Request $request, Office $office)
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $office->update([
            'name' => $request->name,
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Office updated successfully',
            'data' => $office
        ]);
    }

    // DELETE office
    public function destroy(Office $office)
    {
        $office->delete();

        return response()->json([
            'status' => true,
            'message' => 'Office deleted successfully'
        ]);
    }
}