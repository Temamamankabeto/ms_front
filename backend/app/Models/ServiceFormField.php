<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ServiceFormField extends Model
{
    use HasFactory;

    protected $fillable = [
        'service_form_id',
        'service_form_section_id',
        'service_form_step_id',
        'label',
        'description',
        'name',
        'type',
        'placeholder',
        'help_text',
        'default_value',
        'options',
        'validation_rules',
        'is_required',
        'is_active',
        'is_searchable',
        'sort_order',
        'width',
    ];

    protected $casts = [
        'options' => 'array',
        'validation_rules' => 'array',
        'is_required' => 'boolean',
        'is_active' => 'boolean',
        'is_searchable' => 'boolean',
        'sort_order' => 'integer',
        'service_form_id' => 'integer',
        'service_form_section_id' => 'integer',
        'service_form_step_id' => 'integer',
    ];

    public function form()
    {
        return $this->belongsTo(ServiceForm::class, 'service_form_id');
    }

    public function section()
    {
        return $this->belongsTo(ServiceFormSection::class, 'service_form_section_id');
    }

    public function step()
    {
        return $this->belongsTo(ServiceFormStep::class, 'service_form_step_id');
    }

    public function conditions()
    {
        return $this->hasMany(ServiceFormFieldCondition::class, 'field_id');
    }

    public function dependentConditions()
    {
        return $this->hasMany(ServiceFormFieldCondition::class, 'depends_on_field_id');
    }
}
