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

                $table->index(['user_id', 'created_at']);
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

            if (! Schema::hasColumn('chatbot_conversations', 'language')) {
                $table->string('language', 10)->default('en');
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
            foreach (['role', 'scope'] as $column) {
                if (Schema::hasColumn('chatbot_conversations', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
