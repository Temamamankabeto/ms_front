<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ServiceFormFieldCondition extends Model
{
    use HasFactory;

    protected $fillable = [
        'field_id',
        'depends_on_field_id',
        'operator',
        'expected_value',
        'action',
    ];

    protected $casts = [
        'field_id' => 'integer',
        'depends_on_field_id' => 'integer',
    ];

    public function field()
    {
        return $this->belongsTo(ServiceFormField::class, 'field_id');
    }

    public function dependsOnField()
    {
        return $this->belongsTo(ServiceFormField::class, 'depends_on_field_id');
    }
}
