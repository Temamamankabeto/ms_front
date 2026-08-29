<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;

class AuditLogService
{
    public static function log(
        string $module,
        string $action,
        Model|array|null $target = null,
        array $changes = [],
        ?string $message = null
    ): ?AuditLog {
        try {
            $actor = auth()->user();
            $before = Arr::get($changes, 'before');
            $after = Arr::get($changes, 'after');
            $targetType = $target instanceof Model ? class_basename($target) : Arr::get((array) $target, 'type');
            $targetId = $target instanceof Model ? $target->getKey() : Arr::get((array) $target, 'id');

            return AuditLog::create([
                'actor_id' => $actor?->id,
                'user_id' => $actor?->id,
                'role_name' => $actor?->roles?->pluck('name')->first(),
                'ip_address' => request()?->ip(),
                'user_agent' => request()?->userAgent(),
                'module' => $module,
                'entity_type' => $module,
                'target_type' => $targetType,
                'target_id' => $targetId,
                'entity_id' => $targetId,
                'action' => $action,
                'message' => $message ?: self::message($module, $action, $targetType, $targetId),
                'before' => $before,
                'after' => $after,
                'changes' => $changes,
            ]);
        } catch (\Throwable $e) {
            report($e);
            return null;
        }
    }

    protected static function message(string $module, string $action, ?string $targetType, mixed $targetId): string
    {
        $target = trim(($targetType ?: $module) . ($targetId ? " #{$targetId}" : ''));
        return trim(ucfirst(str_replace('_', ' ', $action)) . ' ' . $target);
    }
}
