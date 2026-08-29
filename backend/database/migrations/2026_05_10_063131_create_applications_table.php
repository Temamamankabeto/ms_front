<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('applications', function (Blueprint $table) {

            $table->id();

            $table->string('application_number')
                ->unique();

            $table->foreignId('customer_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('service_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->enum('status', [
                'draft',
                'submitted',
                'under_review',
                'returned_for_correction',
                'resubmitted',
                'approved',
                'rejected',
                'completed',
                'cancelled',
            ])->default('draft');

            $table->foreignId('assigned_to')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('submitted_at')
                ->nullable();

            $table->timestamp('completed_at')
                ->nullable();

            $table->text('remarks')
                ->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('applications');
    }
};