<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index()
    {
        return AuditLog::latest()->paginate(20);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'nullable|exists:users,id',
            'role_name' => 'nullable|string',
            'ip_address' => 'nullable|string',
            'user_agent' => 'nullable|string',
            'device_id' => 'nullable|string',
            'entity_type' => 'nullable|string',
            'entity_id' => 'nullable|integer',
            'action' => 'required|string',
            'message' => 'nullable|string',
            'before' => 'nullable|array',
            'after' => 'nullable|array',
            'approved_by' => 'nullable|exists:users,id',
            'approved_at' => 'nullable|date',
            'approval_reason' => 'nullable|string',
        ]);

        $log = AuditLog::create($validated);

        return response()->json($log, 201);
    }

    public function show($id)
    {
        return AuditLog::findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $log = AuditLog::findOrFail($id);

        $log->update($request->all());

        return response()->json($log);
    }

    public function destroy($id)
    {
        AuditLog::destroy($id);

        return response()->json(['message' => 'Deleted successfully']);
    }
}