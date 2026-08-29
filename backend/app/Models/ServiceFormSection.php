<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ServiceFormSection extends Model
{
    use HasFactory;

    protected $fillable = [
        'service_form_id',
        'service_form_step_id',
        'title',
        'description',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'service_form_id' => 'integer',
        'service_form_step_id' => 'integer',
        'sort_order' => 'integer',
        'is_active' => 'boolean',
    ];

    public function form()
    {
        return $this->belongsTo(ServiceForm::class, 'service_form_id');
    }

    public function step()
    {
        return $this->belongsTo(ServiceFormStep::class, 'service_form_step_id');
    }

    public function fields()
    {
        return $this->hasMany(ServiceFormField::class, 'service_form_section_id')
            ->orderBy('sort_order');
    }
}
