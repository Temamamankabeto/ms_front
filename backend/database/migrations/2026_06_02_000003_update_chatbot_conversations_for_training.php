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
                $table->string('role')->nullable()->index();
                $table->string('scope')->nullable();
                $table->text('question');
                $table->text('normalized_question')->nullable();
                $table->foreignId('matched_category_id')->nullable()->constrained('chatbot_categories')->nullOnDelete();
                $table->longText('answer');
                $table->json('source_context')->nullable();
                $table->timestamps();

                $table->index(['user_id', 'created_at']);
                $table->index(['matched_category_id', 'created_at']);
            });

            return;
        }

        Schema::table('chatbot_conversations', function (Blueprint $table) {
            if (! Schema::hasColumn('chatbot_conversations', 'role')) {
                $table->string('role')->nullable()->index();
            }

            if (! Schema::hasColumn('chatbot_conversations', 'scope')) {
                $table->string('scope')->nullable();
            }

            if (! Schema::hasColumn('chatbot_conversations', 'normalized_question')) {
                $table->text('normalized_question')->nullable();
            }

            if (! Schema::hasColumn('chatbot_conversations', 'matched_category_id')) {
                $table->foreignId('matched_category_id')->nullable()->constrained('chatbot_categories')->nullOnDelete();
            }

            if (! Schema::hasColumn('chatbot_conversations', 'source_context')) {
                $table->json('source_context')->nullable();
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('chatbot_conversations')) {
            return;
        }

        Schema::table('chatbot_conversations', function (Blueprint $table) {
            foreach (['normalized_question', 'matched_category_id', 'role', 'scope'] as $column) {
                if (Schema::hasColumn('chatbot_conversations', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
