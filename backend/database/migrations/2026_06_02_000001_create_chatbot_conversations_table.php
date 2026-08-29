<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('chatbot_conversations')) {
            Schema::create('chatbot_conversations', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('session_id')->nullable()->index();
                $table->string('source')->default('web');
                $table->string('intent')->nullable()->index();
                $table->string('role')->nullable()->index();
                $table->string('scope')->nullable();
                $table->string('language', 10)->default('en');
                $table->text('question');
                $table->longText('answer');
                $table->json('source_context')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('chatbot_conversations');
    }
};
