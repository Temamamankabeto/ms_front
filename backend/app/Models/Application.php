<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Application extends Model
{
    protected $fillable = [
        'application_number',
        'customer_id',
        'service_id',
        'administrative_level',
        'city_id',
        'subcity_id',
        'woreda_id',
        'status',
        'assigned_to',
        'submitted_at',
        'completed_at',
        'remarks',
    ];

    protected $casts = [
        'customer_id' => 'integer',
        'service_id' => 'integer',
        'city_id' => 'integer',
        'subcity_id' => 'integer',
        'woreda_id' => 'integer',
        'assigned_to' => 'integer',
        'submitted_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function customer()
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function assignee()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function city()
    {
        return $this->belongsTo(City::class);
    }

    public function subcity()
    {
        return $this->belongsTo(Subcity::class);
    }

    public function woreda()
    {
        return $this->belongsTo(Woreda::class);
    }
}
