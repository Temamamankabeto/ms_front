<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\City;
use Illuminate\Http\Request;

class CityController extends Controller
{
    public function index()
    {
        return response()->json([
            'success' => true,
            'data' => City::latest()->paginate(10)
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|unique:cities,code'
        ]);

        $city = City::create($data);

        return response()->json([
            'success' => true,
            'data' => $city
        ]);
    }

    public function show($id)
    {
        return response()->json([
            'success' => true,
            'data' => City::findOrFail($id)
        ]);
    }

    public function update(Request $request, $id)
    {
        $city = City::findOrFail($id);

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|unique:cities,code,' . $id
        ]);

        $city->update($data);

        return response()->json([
            'success' => true,
            'data' => $city
        ]);
    }

    public function destroy($id)
    {
        City::findOrFail($id)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Deleted successfully'
        ]);
    }
}