<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;

class ApplicationAuditService
{
    public function log(
        string $action,
        string $module,
        ?int $recordId = null,
        ?array $meta = []
    ) {
        return AuditLog::create([
            'user_id' => Auth::id(),
            'action' => $action,
            'module' => $module,
            'record_id' => $recordId,
            'meta' => json_encode($meta),
        ]);
    }
}
