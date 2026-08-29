<?php

namespace App\Models\Traits;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;

trait Auditable
{
    protected static function bootAuditable()
    {
        static::created(function ($model) {

            AuditLog::create([
                'user_id' => Auth::id(),
                'role_name' => Auth::user()?->roles?->first()?->name,

                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),

                'entity_type' => class_basename($model),
                'entity_id' => $model->id,

                'action' => 'created',

                'message' => class_basename($model) . ' created',

                'before' => null,

                'after' => $model->toArray(),
            ]);
        });

        static::updated(function ($model) {

            AuditLog::create([
                'user_id' => Auth::id(),
                'role_name' => Auth::user()?->roles?->first()?->name,

                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),

                'entity_type' => class_basename($model),
                'entity_id' => $model->id,

                'action' => 'updated',

                'message' => class_basename($model) . ' updated',

                'before' => $model->getOriginal(),

                'after' => $model->getChanges(),
            ]);
        });

        static::deleted(function ($model) {

            AuditLog::create([
                'user_id' => Auth::id(),
                'role_name' => Auth::user()?->roles?->first()?->name,

                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),

                'entity_type' => class_basename($model),
                'entity_id' => $model->id,

                'action' => 'deleted',

                'message' => class_basename($model) . ' deleted',

                'before' => $model->toArray(),

                'after' => null,
            ]);
        });
    }
}