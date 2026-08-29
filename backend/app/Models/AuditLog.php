<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
   protected $fillable = [
        'user_id',
        'role_name',
        'ip_address',
        'user_agent',
        'device_id',
        'entity_type',
        'entity_id',
        'action',
        'message',
        'before',
        'after',
        'approved_by',
        'approved_at',
        'approval_reason',
    ];

    protected $casts = [
        'before' => 'array',
        'after' => 'array',
        'approved_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
