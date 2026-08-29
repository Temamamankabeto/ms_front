<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServiceApplicationHistory extends Model
{
    protected $fillable = [
        'application_id','from_status','to_status','action','action_type','remark','comment','metadata','actor_id',
        'sender_id','receiver_id','from_window_id','to_window_id','administrative_level','status','escalation_details',
    ];

    protected $casts = [
        'application_id' => 'integer','actor_id' => 'integer','sender_id' => 'integer','receiver_id' => 'integer',
        'from_window_id' => 'integer','to_window_id' => 'integer','metadata' => 'array','escalation_details' => 'array',
    ];

    public function application(){ return $this->belongsTo(ServiceApplication::class, 'application_id'); }
    public function actor(){ return $this->belongsTo(User::class, 'actor_id'); }
    public function sender(){ return $this->belongsTo(User::class, 'sender_id'); }
    public function receiver(){ return $this->belongsTo(User::class, 'receiver_id'); }
    public function fromWindow(){ return $this->belongsTo(Window::class, 'from_window_id'); }
    public function toWindow(){ return $this->belongsTo(Window::class, 'to_window_id'); }
}
