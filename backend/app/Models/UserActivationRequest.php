<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserActivationRequest extends Model
{
    protected $fillable = [
        'user_id',
        'requested_by',
        'verified_by',
        'verified_at',
        'approved_by',
        'approved_at',
        'status',
        'request_level',
        'city_id',
        'subcity_id',
        'woreda_id',
        'request_note',
        'verification_note',
        'approval_note',
        'rejection_reason',
    ];

    protected $casts = [
        'verified_at' => 'datetime',
        'approved_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function requester()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function verifier()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
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
