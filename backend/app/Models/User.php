<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;
use App\Models\City;
use App\Models\Subcity;
use App\Models\Woreda;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles, SoftDeletes;

    protected $guard_name = 'sanctum';

    protected $fillable = [
        'name', 'email', 'phone', 'gender', 'profile_image', 'password', 'address',
        'user_type', 'status', 'is_active', 'city_id', 'subcity_id', 'woreda_id',
        'created_by', 'activated_by', 'activated_at',
        'failed_login_attempts', 'locked_until', 'last_failed_login_at', 'password_changed_at',
        'phone_verified_at', 'last_login_at', 'date_of_birth', 'officer_code',
         'fin',
    'is_fayda_verified',
    'fayda_payload'
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'phone_verified_at' => 'datetime',
        'last_login_at' => 'datetime',
        'locked_until' => 'datetime',
        'last_failed_login_at' => 'datetime',
        'password_changed_at' => 'datetime',
        'activated_at' => 'datetime',
        'password' => 'hashed',
        'is_active' => 'boolean',
    ];

    protected $appends = ['profile_image_url'];

    public function activationRequests()
    {
        return $this->hasMany(UserActivationRequest::class);
    }

    public function latestActivationRequest()
    {
        return $this->hasOne(UserActivationRequest::class)->latestOfMany();
    }

    public function officerWindowAssignments()
    {
        return $this->hasMany(OfficerWindowAssignment::class, 'officer_id');
    }

    public function assignedWindows()
    {
        return $this->belongsToMany(Window::class, 'officer_window_assignments', 'officer_id', 'window_id')
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

    public function assignedServices()
    {
        return $this->belongsToMany(Service::class, 'user_service_assignments')
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

    public function auditLogs()
    {
        return $this->hasMany(AuditLog::class);
    }

    // public function customer()
    // {
    //     return $this->hasOne(Customer::class);
    // }

    public function getProfileImageUrlAttribute(): ?string
    {
        return $this->profile_image ? asset('storage/' . $this->profile_image) : null;
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function activator()
    {
        return $this->belongsTo(User::class, 'activated_by');
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
}
