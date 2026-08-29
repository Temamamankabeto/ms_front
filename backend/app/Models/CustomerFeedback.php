<?php

namespace App\Models;

use App\Models\ServiceApplication;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class CustomerFeedback extends Model
{
    protected $table = 'customer_feedbacks';
    protected $fillable = [
        'service_application_id',
        'customer_id',
        'token',
        'rating',
        'comment',
        'submitted_at',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
    ];

    public function application()
    {
        return $this->belongsTo(ServiceApplication::class);
    }

    public function customer()
    {
        return $this->belongsTo(User::class, 'customer_id');
    }
}