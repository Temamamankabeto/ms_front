<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Woreda extends Model
{
    protected $fillable = ['city_id', 'subcity_id', 'name'];

    public function subcity()
    {
        return $this->belongsTo(Subcity::class);
    }
}
