<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_applications', function (Blueprint $table) {

            $table->id();

            $table->string('tracking_number')
                ->unique();

            $table->foreignId('service_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('customer_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('current_window_id')
                ->nullable()
                ->constrained('windows')
                ->nullOnDelete();

            $table->foreignId('current_officer_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->enum('status', [

                'draft',
                'submitted',
                'under_review',
                'returned',
                'approved',
                'rejected',
                'completed',

            ])->default('submitted');

            $table->timestamp('submitted_at')
                ->nullable();

            $table->timestamp('approved_at')
                ->nullable();

            $table->timestamp('rejected_at')
                ->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(
            'service_applications'
        );
    }
};