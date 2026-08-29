<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subcity;
use Illuminate\Http\Request;

class SubcityController extends Controller
{
    public function index()
    {
        return response()->json([
            'success' => true,
            'data' => Subcity::with('city')->latest()->paginate(10)
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string',
            'city_id' => 'required|exists:cities,id'
        ]);

        $subcity = Subcity::create($data);

        return response()->json([
            'success' => true,
            'data' => $subcity
        ]);
    }

    public function show($id)
    {
        return response()->json([
            'success' => true,
            'data' => Subcity::with('city')->findOrFail($id)
        ]);
    }

    public function update(Request $request, $id)
    {
        $subcity = Subcity::findOrFail($id);

        $data = $request->validate([
            'name' => 'required|string',
            'city_id' => 'required|exists:cities,id'
        ]);

        $subcity->update($data);

        return response()->json([
            'success' => true,
            'data' => $subcity
        ]);
    }

    public function destroy($id)
    {
        Subcity::findOrFail($id)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Deleted successfully'
        ]);
    }
}
