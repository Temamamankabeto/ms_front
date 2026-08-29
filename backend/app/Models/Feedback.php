<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Feedback extends Model
{
    protected $fillable = [

        'service_id',

        'window_id',

        'city_id',

        'subcity_id',

        'woreda_id',

        'overall_rating',

        'staff_behavior',

        'waiting_time',

        'service_quality',

        'cleanliness',

        'comment',

        'satisfaction',

        'gender',

        'age',

        'ip_address',

        'user_agent',

        'device',
    ];

    protected $casts = [

        'overall_rating' => 'integer',

        'staff_behavior' => 'integer',

        'waiting_time' => 'integer',

        'service_quality' => 'integer',

        'cleanliness' => 'integer',
    ];

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function window()
    {
        return $this->belongsTo(Window::class);
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
