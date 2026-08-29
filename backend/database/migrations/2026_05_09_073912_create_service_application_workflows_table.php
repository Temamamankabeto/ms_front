<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        /*
        |--------------------------------------------------------------------------
        | SERVICE APPLICATION WORKFLOWS
        |--------------------------------------------------------------------------
        */

        Schema::create('service_application_workflows', function (Blueprint $table) {

            $table->id();

            /*
            |--------------------------------------------------------------------------
            | RELATIONS
            |--------------------------------------------------------------------------
            */

            $table->foreignId('application_id')
                ->constrained('service_applications')
                ->cascadeOnDelete();

            $table->foreignId('window_id')
                ->nullable()
                ->constrained('windows')
                ->nullOnDelete();

            $table->foreignId('officer_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->foreignId('acted_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            /*
            |--------------------------------------------------------------------------
            | WORKFLOW STAGES
            |--------------------------------------------------------------------------
            */

            $table->string('from_stage')
                ->nullable();

            $table->string('to_stage')
                ->nullable();

            $table->string('action')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | STATUS
            |--------------------------------------------------------------------------
            */

            $table->enum('status', [

                'pending',
                'processing',
                'approved',
                'returned',
                'rejected',
                'completed',

            ])->default('pending');

            /*
            |--------------------------------------------------------------------------
            | COMMENTS / REMARKS
            |--------------------------------------------------------------------------
            */

            $table->text('remark')
                ->nullable();

            $table->text('comment')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | ESCALATION
            |--------------------------------------------------------------------------
            */

            $table->timestamp('escalated_at')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | ACTION TIME
            |--------------------------------------------------------------------------
            */

            $table->timestamp('acted_at')
                ->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_application_workflows');
    }
};