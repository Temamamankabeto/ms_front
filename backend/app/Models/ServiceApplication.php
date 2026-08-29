<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\Auditable;
use App\Models\ApplicationQueue;
use App\Models\CustomerFeedback;

class ServiceApplication extends Model
{
    use Auditable;

    protected $fillable = [
        'tracking_number',
        'service_id',
        'administrative_level',
        'city_id',
        'subcity_id',
        'woreda_id',
        'customer_id',
        'current_window_id',
        'current_officer_id',
        'status',
        'current_stage',
        'assigned_to',
        'assigned_role',
        'priority',
        'sla_started_at',
        'sla_due_at',
        'appointment_at',
        'appointment_location',
        'appointment_message',
        'appointment_status',
        'submitted_at',
        'approved_at',
        'rejected_at',
        'completed_at',
        'rejection_reason',
        'returned_count',
    ];

    protected $casts = [
        'service_id' => 'integer',
        'city_id' => 'integer',
        'subcity_id' => 'integer',
        'woreda_id' => 'integer',
        'customer_id' => 'integer',
        'current_window_id' => 'integer',
        'current_officer_id' => 'integer',
        'assigned_to' => 'integer',
        'returned_count' => 'integer',
        'sla_started_at' => 'datetime',
        'sla_due_at' => 'datetime',
        'appointment_at' => 'datetime',
        'submitted_at' => 'datetime',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function customer()
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function assignee()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function data()
    {
        return $this->hasMany(ServiceApplicationData::class, 'application_id');
    }

    public function files()
    {
        return $this->hasMany(ServiceApplicationFile::class, 'application_id');
    }

    public function workflows()
    {
        return $this->hasMany(ServiceApplicationWorkflow::class, 'application_id');
    }

    public function workflow()
    {
        return $this->workflows();
    }

    public function histories()
    {
        return $this->hasMany(ServiceApplicationHistory::class, 'application_id')->latest();
    }

    public function shares()
    {
        return $this->hasMany(ServiceApplicationShare::class, 'application_id')->latest();
    }

    public function appointments()
    {
        return $this->hasMany(ServiceApplicationAppointment::class, 'application_id')->latest();
    }

    public function currentWindow()
    {
        return $this->belongsTo(Window::class, 'current_window_id');
    }

    public function currentOfficer()
    {
        return $this->belongsTo(User::class, 'current_officer_id');
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
//     public function queue()
// {
//     return $this->hasOne(ApplicationQueue::class);
// }
public function queue()
{
    return $this->hasOne(
        ApplicationQueue::class,
        'service_application_id'
    );
}
public function feedback()
{
    return $this->hasOne(CustomerFeedback::class);
}
}
