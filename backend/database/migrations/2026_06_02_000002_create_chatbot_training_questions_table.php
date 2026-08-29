<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('chatbot_training_questions')) {
            Schema::create('chatbot_training_questions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('category_id')->constrained('chatbot_categories')->cascadeOnDelete();
                $table->text('question');
                $table->text('normalized_question')->nullable()->index();
                $table->json('keywords')->nullable();
                $table->string('language', 10)->default('en')->index();
                $table->longText('answer_template')->nullable();
                $table->string('action_type')->default('static_answer')->index();
                $table->boolean('is_active')->default(true)->index();
                $table->timestamps();

                $table->index(['category_id', 'is_active']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('chatbot_training_questions');
    }
};
