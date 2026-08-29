<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    /**
     * Customer List
     */
    public function customerlist(Request $request)
    {
        $perPage = $request->get('per_page', 10);
        $search = $request->get('search');

        $customers = User::query()
            ->role('customer') // Spatie role filter
            ->when($search, function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate($perPage);

        $customers->getCollection()->transform(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'address' => $user->address,
                'profile_image' => $user->profile_image,
                'email_verified_at' => $user->email_verified_at,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
                'roles' => $user->getRoleNames(),
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Customer list retrieved successfully.',
            'data' => $customers->items(),
            'meta' => [
                'current_page' => $customers->currentPage(),
                'last_page' => $customers->lastPage(),
                'per_page' => $customers->perPage(),
                'total' => $customers->total(),
            ],
        ]);
    }
     public function show($id)
    {
        $customer = User::where('role','customer')
            ->findOrFail($id);


        return response()->json([
            'data' => $customer
        ]);
    }
}