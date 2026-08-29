<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class PermissionController extends Controller
{
    public function index(Request $request)
    {
        // $this->authorize('viewAny', Permission::class);
    
        $search = trim((string) $request->query('search', ''));
        $perPage = (int) $request->query('per_page', 10);
        $all = $request->boolean('all');
    
        if ($perPage <= 0) {
            $perPage = 10;
        }
    
        if ($perPage > 100) {
            $perPage = 100;
        }
    
        $q = Permission::query()
            ->where('guard_name', 'sanctum')
            ->orderBy('name');
    
        if ($search !== '') {
            $q->where('name', 'like', "%{$search}%");
        }
    
        $columns = ['id', 'name', 'guard_name', 'created_at', 'updated_at'];
    
        if ($all) {
            $permissions = $q->get($columns);
    
            return response()->json([
                'data' => $permissions,
                'meta' => [
                    'current_page' => 1,
                    'per_page' => $permissions->count(),
                    'total' => $permissions->count(),
                    'last_page' => 1,
                ],
            ]);
        }
    
        $permissions = $q->paginate($perPage, $columns);
    
        return response()->json([
            'data' => $permissions->items(),
            'meta' => [
                'current_page' => $permissions->currentPage(),
                'per_page' => $permissions->perPage(),
                'total' => $permissions->total(),
                'last_page' => $permissions->lastPage(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', Permission::class);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120', 'unique:permissions,name'],
        ]);

        $perm = Permission::create([
            'name' => $data['name'],
            'guard_name' => 'sanctum',
        ]);

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return response()->json([
            'success' => true,
            'message' => 'Permission created',
            'data' => $perm,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $perm = Permission::where('guard_name', 'sanctum')->findOrFail($id);
        $this->authorize('update', $perm);

        $data = $request->validate([
            'name' => [
                'required',
                'string',
                'max:120',
                Rule::unique('permissions', 'name')->ignore($perm->id),
            ],
        ]);

        $perm->update([
            'name' => $data['name'],
        ]);

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return response()->json([
            'success' => true,
            'message' => 'Permission updated',
            'data' => $perm,
        ]);
    }

    public function destroy($id)
    {
        $perm = Permission::where('guard_name', 'sanctum')->findOrFail($id);
        $this->authorize('delete', $perm);

        $perm->delete();

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return response()->json([
            'success' => true,
            'message' => 'Permission deleted',
        ]);
    }
}