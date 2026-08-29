<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChatbotConversation extends Model
{
    protected $fillable = [
        'user_id',
        'session_id',
        'role',
        'scope',
        'question',
        'normalized_question',
        'matched_category_id',
        'answer',
        'source_context',
    ];

    protected $casts = [
        'source_context' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function matchedCategory()
    {
        return $this->belongsTo(ChatbotCategory::class, 'matched_category_id');
    }
}
