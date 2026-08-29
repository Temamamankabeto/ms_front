<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ChatbotTrainingQuestion extends Model
{
    protected $fillable = [
        'category_id',
        'question',
        'normalized_question',
        'keywords',
        'language',
        'answer_template',
        'action_type',
        'is_active',
    ];

    protected $casts = [
        'keywords' => 'array',
        'is_active' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::saving(function (ChatbotTrainingQuestion $question) {
            $question->normalized_question = static::normalize($question->question);
        });
    }

    public static function normalize(?string $value): string
    {
        $value = Str::lower((string) $value);
        $value = preg_replace('/[^\p{L}\p{N}\s\-]/u', ' ', $value) ?: $value;

        return trim(preg_replace('/\s+/', ' ', $value) ?: $value);
    }

    public function category()
    {
        return $this->belongsTo(ChatbotCategory::class, 'category_id');
    }
}
