<?php

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;

if (!function_exists('audit_log')) {

    function audit_log(
        string $action,
        string $message,
        ?string $entityType = null,
        ?int $entityId = null,
        ?array $before = null,
        ?array $after = null
    ) {

        AuditLog::create([
            'user_id' => Auth::id(),

            'role_name' => Auth::user()?->roles?->first()?->name,

            'ip_address' => request()->ip(),

            'user_agent' => request()->userAgent(),

            'entity_type' => $entityType,

            'entity_id' => $entityId,

            'action' => $action,

            'message' => $message,

            'before' => $before,

            'after' => $after,
        ]);
    }
}