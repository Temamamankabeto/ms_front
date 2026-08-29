<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServiceApplicationAppointment extends Model
{
    protected $fillable = [
        'application_id',
        'scheduled_by',
        'appointment_at',
        'location',
        'message',
        'status',
    ];

    protected $casts = [
        'application_id' => 'integer',
        'scheduled_by' => 'integer',
        'appointment_at' => 'datetime',
    ];

    public function application()
    {
        return $this->belongsTo(ServiceApplication::class, 'application_id');
    }

    public function scheduler()
    {
        return $this->belongsTo(User::class, 'scheduled_by');
    }
}
