<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServiceCriterion extends Model
{
    protected $table = 'service_criteria';

    protected $fillable = [
        'service_id',
        'title',
        'criteria',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'service_id' => 'integer',
        'sort_order' => 'integer',
        'is_active' => 'boolean',
    ];

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function getCriteriaItemsAttribute(): array
    {
        return collect(preg_split('/\r\n|\r|\n/', (string) $this->criteria))
            ->map(fn ($item) => trim($item))
            ->filter()
            ->values()
            ->all();
    }
}
