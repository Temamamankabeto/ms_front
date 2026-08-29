<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OfficerWindowAssignment extends Model
{
    protected $fillable = [
        'officer_id',
        'window_id',
        'assignment_level',
        'city_id',
        'subcity_id',
        'woreda_id',
        'assigned_by',
        'is_active',
        'assigned_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'assigned_at' => 'datetime',
    ];

    public function officer()
    {
        return $this->belongsTo(User::class, 'officer_id');
    }

    public function window()
    {
        return $this->belongsTo(Window::class);
    }

    public function assigner()
    {
        return $this->belongsTo(User::class, 'assigned_by');
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
