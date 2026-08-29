<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('feedback', function (Blueprint $table) {

            $table->id();

            /*
            |--------------------------------------------------------------------------
            | SERVICE
            |--------------------------------------------------------------------------
            */

            $table->foreignId('service_id')
                ->constrained('services')
                ->cascadeOnDelete();

            /*
            |--------------------------------------------------------------------------
            | CUSTOMER EXPERIENCE
            |--------------------------------------------------------------------------
            */

            // Overall rating (1-5)
            $table->unsignedTinyInteger('overall_rating');

            // Staff courtesy
            $table->unsignedTinyInteger('staff_behavior')
                ->nullable();

            // Waiting time satisfaction
            $table->unsignedTinyInteger('waiting_time')
                ->nullable();

            // Service quality
            $table->unsignedTinyInteger('service_quality')
                ->nullable();

            // Office cleanliness
            $table->unsignedTinyInteger('cleanliness')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | CUSTOMER OPINION
            |--------------------------------------------------------------------------
            */

            $table->text('comment')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | SATISFACTION
            |--------------------------------------------------------------------------
            */

            $table->enum('satisfaction', [
                'highly_satisfied',
                'satisfied',
                'not_satisfied'
            ]);

            /*
            |--------------------------------------------------------------------------
            | OPTIONAL INFORMATION
            |--------------------------------------------------------------------------
            */

            $table->enum('gender', [
                'male',
                'female'
            ])->nullable();

            $table->unsignedTinyInteger('age')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | SYSTEM INFORMATION
            |--------------------------------------------------------------------------
            */

            $table->ipAddress('ip_address')
                ->nullable();

            $table->string('user_agent')
                ->nullable();

            $table->string('device')
                ->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('feedback');
    }
};
