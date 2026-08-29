<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ServiceFormStep extends Model
{
    use HasFactory;

    protected $fillable = [
        'service_form_id',
        'title',
        'step_order',
    ];

    protected $casts = [
        'service_form_id' => 'integer',
        'step_order' => 'integer',
    ];

    public function form()
    {
        return $this->belongsTo(ServiceForm::class, 'service_form_id');
    }

    public function sections()
    {
        return $this->hasMany(ServiceFormSection::class, 'service_form_step_id')
            ->orderBy('sort_order');
    }

    public function fields()
    {
        return $this->hasMany(ServiceFormField::class, 'service_form_step_id')
            ->orderBy('sort_order');
    }
}
