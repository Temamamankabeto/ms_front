<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChatbotCategory extends Model
{
    protected $fillable = [
        'name',
        'code',
        'description',
        'allowed_roles',
        'blocked_roles',
        'is_active',
    ];

    protected $casts = [
        'allowed_roles' => 'array',
        'blocked_roles' => 'array',
        'is_active' => 'boolean',
    ];

    public function trainingQuestions()
    {
        return $this->hasMany(ChatbotTrainingQuestion::class, 'category_id');
    }
}
