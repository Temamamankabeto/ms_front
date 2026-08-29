<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServiceApplicationShare extends Model
{
    protected $fillable = [
        'application_id',
        'shared_from_officer_id',
        'shared_to_officer_id',
        'from_window_id',
        'to_window_id',
        'administrative_level',
        'note',
        'shared_at',
    ];

    protected $casts = [
        'shared_at' => 'datetime',
    ];

    public function application()
    {
        return $this->belongsTo(ServiceApplication::class, 'application_id');
    }

    public function sharedFromOfficer()
    {
        return $this->belongsTo(User::class, 'shared_from_officer_id');
    }

    public function sharedToOfficer()
    {
        return $this->belongsTo(User::class, 'shared_to_officer_id');
    }

    public function fromWindow()
    {
        return $this->belongsTo(Window::class, 'from_window_id');
    }

    public function toWindow()
    {
        return $this->belongsTo(Window::class, 'to_window_id');
    }
}
