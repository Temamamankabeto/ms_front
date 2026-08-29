<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\Auditable;

class Service extends Model
{
    use Auditable;

    protected $fillable = [
        'name',
        'description',
        'has_back_officer',
        'service_fee',
        'availability',
        'status',
    ];

    protected $casts = [
        'availability' => 'array',
        'has_back_officer' => 'boolean',
        'service_fee' => 'float',
    ];

    public function windows()
    {
        return $this->belongsToMany(
            Window::class,
            'service_window',
            'service_id',
            'window_id'
        )
            ->withPivot([
                'assignment_level',
                'step_order',
                'is_required',
            ])
            ->withTimestamps()
            ->orderBy('service_window.step_order');
    }

    public function assignedUsers()
    {
        return $this->belongsToMany(
            User::class,
            'user_service_assignments'
        )
            ->withPivot([
                'officer_type',
                'window_id',
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

    public function frontOfficers()
    {
        return $this->assignedUsers()
            ->wherePivot('officer_type', 'front_officer');
    }

    public function backOfficers()
    {
        return $this->assignedUsers()
            ->wherePivot('officer_type', 'back_officer');
    }

    public function forms()
    {
        return $this->hasMany(ServiceForm::class);
    }

    public function form()
    {
        return $this->hasOne(ServiceForm::class)
            ->where('is_active', true)
            ->latestOfMany();
    }

    public function applications()
    {
        return $this->hasMany(ServiceApplication::class);
    }

    public function criteria()
    {
        return $this->hasMany(ServiceCriterion::class)
            ->orderBy('sort_order');
    }

    public function feedbacks()
    {
        return $this->hasMany(Feedback::class);
    }
}
