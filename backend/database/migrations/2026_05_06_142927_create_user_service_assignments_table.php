<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run migrations.
     */
    public function up(): void
    {
        Schema::create(
            'user_service_assignments',
            function (Blueprint $table) {

                $table->id();

                $table->foreignId('user_id')
                    ->constrained('users')
                    ->cascadeOnDelete();

                $table->foreignId('service_id')
                    ->constrained('services')
                    ->cascadeOnDelete();

                $table->boolean('is_active')
                    ->default(true);

                $table->timestamps();

                $table->unique([
                    'user_id',
                    'service_id',
                ]);
            }
        );
    }

    /**
     * Reverse migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists(
            'user_service_assignments'
        );
    }
};