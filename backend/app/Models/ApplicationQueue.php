<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ApplicationQueue extends Model
{
    protected $fillable = [
        'service_application_id',
        'queue_number',
        'position',
        'status',
        'called_at',
        'completed_at',
    ];

    public function application()
    {
        return $this->belongsTo(ServiceApplication::class, 'service_application_id');
    }
    
}