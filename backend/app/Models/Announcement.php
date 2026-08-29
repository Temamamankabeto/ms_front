<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Announcement extends Model
{
    protected $fillable = [
        'city_id',
        'title',
        'description',
        'status',
        'created_by',
    ];

    protected $casts = [
        'city_id' => 'integer',
        'created_by' => 'integer',
    ];

    public function city()
    {
        return $this->belongsTo(City::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
