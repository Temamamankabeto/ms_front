<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\Auditable;

class ServiceForm extends Model
{
    use Auditable;

    protected $fillable = [
        'service_id',
        'title',
        'description',
        'is_active',
    ];

    protected $casts = [
        'service_id' => 'integer',
        'is_active' => 'boolean',
    ];

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function steps()
    {
        return $this->hasMany(ServiceFormStep::class)
            ->orderBy('step_order');
    }

    public function sections()
    {
        return $this->hasMany(ServiceFormSection::class)
            ->orderBy('sort_order');
    }

    public function fields()
    {
        return $this->hasMany(ServiceFormField::class)
            ->orderBy('sort_order');
    }

    public function activeFields()
    {
        return $this->fields()->where('is_active', true);
    }
}
