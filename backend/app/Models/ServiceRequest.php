<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ServiceRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'service_name',
        'customer_id',
        'assigned_officer_id',
        'status',
        'data',
        'city_id',
        'subcity_id',
        'woreda_id',
    ];

    protected $casts = [
        'data' => 'array',
    ];

    public function customer()
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function officer()
    {
        return $this->belongsTo(User::class, 'assigned_officer_id');
    }
}
