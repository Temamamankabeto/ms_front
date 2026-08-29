<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogger
{
    public function log(
        ?Request $request,
        ?int $userId,
        string $entityType,
        ?int $entityId,
        string $action,
        ?array $before = null,
        ?array $after = null,
        ?string $message = null,
        ?array $approval = null
    ): void {
        $roleName = null;
        if ($request && $request->user()) {
            // Snapshot first role name if exists (Spatie)
            $roleName = $request->user()->getRoleNames()->first();
        }

        AuditLog::create([
            'user_id' => $userId,
            'role_name' => $roleName,
            'ip_address' => $request?->ip(),
            'user_agent' => substr((string)$request?->userAgent(), 0, 500),
            'device_id' => $request?->header('X-DEVICE-ID'),

            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'action' => $action,
            'message' => $message,

            'before' => $before,
            'after' => $after,

            'approved_by' => $approval['approved_by'] ?? null,
            'approved_at' => $approval['approved_at'] ?? null,
            'approval_reason' => $approval['approval_reason'] ?? null,
        ]);
    }
}