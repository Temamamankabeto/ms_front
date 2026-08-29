<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\Auditable;

class Window extends Model
{
    use Auditable;

    protected $fillable = [
        'name',
        'title',
        'city_title',
        'subcity_title',
        'woreda_title',
        'administrative_level',
        'city_id',
        'subcity_id',
        'woreda_id',
        'availability',
    ];

    protected $casts = [
        'availability' => 'array',
    ];

    public function services()
    {
        return $this->belongsToMany(
            Service::class,
            'service_window',
            'window_id',
            'service_id'
        )
            ->withPivot([
                'assignment_level',
                'step_order',
                'is_required',
            ])
            ->withTimestamps()
            ->orderBy('service_window.step_order');
    }

    public function officerAssignments()
    {
        return $this->hasMany(OfficerWindowAssignment::class);
    }

    public function assignedOfficers()
    {
        return $this->belongsToMany(User::class, 'officer_window_assignments', 'window_id', 'officer_id')
            ->withPivot([
                'assignment_level',
                'city_id',
                'subcity_id',
                'woreda_id',
                'is_active',
                'assigned_by',
                'assigned_at',
            ])
            ->withTimestamps();
    }

    public function city()
    {
        return $this->belongsTo(City::class);
    }

    public function subcity()
    {
        return $this->belongsTo(Subcity::class);
    }

    public function woreda()
    {
        return $this->belongsTo(Woreda::class);
    }

    public function titleForLevel(string $level): ?string
    {
        return match ($level) {
            'city' => $this->city_title,
            'subcity' => $this->subcity_title,
            'woreda' => $this->woreda_title,
            default => $this->title,
        };
    }

}
