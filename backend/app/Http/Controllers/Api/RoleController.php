<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Role\AssignRolePermissionsRequest;
use App\Http\Requests\Role\IndexPermissionRequest;
use App\Http\Requests\Role\IndexRoleRequest;
use App\Http\Requests\Role\StoreRoleRequest;
use App\Http\Requests\Role\UpdateRoleRequest;
use App\Services\RoleService;
use Illuminate\Http\JsonResponse;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    public function __construct(
        protected RoleService $roleService
    ) {}

    /*
    |--------------------------------------------------------------------------
    | LIST ROLES
    |--------------------------------------------------------------------------
    */
    public function index(IndexRoleRequest $request): JsonResponse
    {
        // $this->authorize('viewAny', Role::class);

        $roles = $this->roleService->paginateRoles(
            $request->validated()
        );

        return response()->json([
            'success' => true,
            'data' => $roles->items(),
            'meta' => [
                'current_page' => $roles->currentPage(),
                'last_page' => $roles->lastPage(),
                'per_page' => $roles->perPage(),
                'total' => $roles->total(),
            ],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | ALL PERMISSIONS
    |--------------------------------------------------------------------------
    */
    public function permissions(IndexPermissionRequest $request): JsonResponse
    {
        // $this->authorize('viewAny', Permission::class);

        return response()->json([
            'success' => true,
            'data' => $this->roleService->getPermissions(
                $request->validated()['search'] ?? null
            ),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE ROLE
    |--------------------------------------------------------------------------
    */
    public function store(StoreRoleRequest $request): JsonResponse
    {
        // $this->authorize('create', Role::class);

        $role = $this->roleService->createRole(
            $request->validated()
        );

        return response()->json([
            'success' => true,
            'message' => 'Role created successfully',
            'data' => $role,
        ], 201);
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE ROLE
    |--------------------------------------------------------------------------
    */
    public function update(UpdateRoleRequest $request, $id): JsonResponse
    {
        $role = $this->roleService->getRole($id);

        // $this->authorize('update', $role);

        $updatedRole = $this->roleService->updateRole(
            $role,
            $request->validated()
        );

        return response()->json([
            'success' => true,
            'message' => 'Role updated successfully',
            'data' => $updatedRole,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | ROLE PERMISSIONS
    |--------------------------------------------------------------------------
    */
    public function rolePermissions($id): JsonResponse
    {
        $role = $this->roleService->getRole($id);

        return response()->json([
            'success' => true,
            'data' => $this->roleService->getRolePermissions($role),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | ASSIGN PERMISSIONS
    |--------------------------------------------------------------------------
    */
    public function assignPermissions(
        AssignRolePermissionsRequest $request,
        $id
    ): JsonResponse {

        $role = Role::findOrFail($id);

        $result = $this->roleService->assignPermissions(
            $role,
            $request->validated()['permissions'] ?? []
        );

        return response()->json([
            'success' => true,
            'message' => 'Permissions assigned successfully',
            'data' => $result,
        ]);
    }
}