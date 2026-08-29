<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Subcity extends Model
{
    protected $fillable = ['city_id', 'name'];

    public function city()
    {
        return $this->belongsTo(City::class);
    }

    public function woredas()
    {
        return $this->hasMany(Woreda::class);
    }
}
