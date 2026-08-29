<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\Auditable;

class ServiceApplicationData extends Model
{
    use Auditable;

    protected $table = 'service_application_data';

    protected $fillable = [
        'application_id',
        'field_name',
        'field_value',
    ];

    protected $casts = [
        'application_id' => 'integer',
    ];

    public function application()
    {
        return $this->belongsTo(ServiceApplication::class, 'application_id');
    }
}
