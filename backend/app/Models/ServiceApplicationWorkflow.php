<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServiceApplicationWorkflow extends Model
{
    protected $table = 'service_application_workflows';

    protected $fillable = [
        'application_id',
        'window_id',
        'officer_id',
        'acted_by',
        'from_stage',
        'to_stage',
        'action',
        'status',
        'remark',
        'comment',
        'escalated_at',
        'acted_at',
    ];

    protected $casts = [
        'application_id' => 'integer',
        'window_id' => 'integer',
        'officer_id' => 'integer',
        'acted_by' => 'integer',
        'escalated_at' => 'datetime',
        'acted_at' => 'datetime',
    ];

    public function application()
    {
        return $this->belongsTo(ServiceApplication::class, 'application_id');
    }

    public function window()
    {
        return $this->belongsTo(Window::class);
    }

    public function officer()
    {
        return $this->belongsTo(User::class, 'officer_id');
    }

    public function actor()
    {
        return $this->belongsTo(User::class, 'acted_by');
    }
}
