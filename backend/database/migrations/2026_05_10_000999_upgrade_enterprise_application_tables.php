<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('service_applications', function (Blueprint $table) {
            if (!Schema::hasColumn('service_applications', 'current_stage')) {
                $table->string('current_stage')->default('submitted');
            }

            if (!Schema::hasColumn('service_applications', 'assigned_to')) {
                $table->unsignedBigInteger('assigned_to')->nullable();
            }

            if (!Schema::hasColumn('service_applications', 'assigned_role')) {
                $table->string('assigned_role')->nullable();
            }

            if (!Schema::hasColumn('service_applications', 'priority')) {
                $table->enum('priority', ['low', 'normal', 'high', 'urgent'])
                    ->default('normal');
            }

            if (!Schema::hasColumn('service_applications', 'sla_due_at')) {
                $table->timestamp('sla_due_at')->nullable();
            }

            if (!Schema::hasColumn('service_applications', 'completed_at')) {
                $table->timestamp('completed_at')->nullable();
            }

            if (!Schema::hasColumn('service_applications', 'rejection_reason')) {
                $table->text('rejection_reason')->nullable();
            }

            if (!Schema::hasColumn('service_applications', 'returned_count')) {
                $table->integer('returned_count')->default(0);
            }
        });

        Schema::table('service_application_workflows', function (Blueprint $table) {
            if (!Schema::hasColumn('service_application_workflows', 'from_stage')) {
                $table->string('from_stage')->nullable();
            }

            if (!Schema::hasColumn('service_application_workflows', 'to_stage')) {
                $table->string('to_stage')->nullable();
            }

            if (!Schema::hasColumn('service_application_workflows', 'action')) {
                $table->string('action')->nullable();
            }

            if (!Schema::hasColumn('service_application_workflows', 'comment')) {
                $table->text('comment')->nullable();
            }

            if (!Schema::hasColumn('service_application_workflows', 'acted_by')) {
                $table->unsignedBigInteger('acted_by')->nullable();
            }

            if (!Schema::hasColumn('service_application_workflows', 'escalated_at')) {
                $table->timestamp('escalated_at')->nullable();
            }
        });

        Schema::table('service_application_histories', function (Blueprint $table) {
            if (!Schema::hasColumn('service_application_histories', 'action_type')) {
                $table->string('action_type')->nullable();
            }

            if (!Schema::hasColumn('service_application_histories', 'comment')) {
                $table->text('comment')->nullable();
            }

            if (!Schema::hasColumn('service_application_histories', 'metadata')) {
                $table->json('metadata')->nullable();
            }

            if (!Schema::hasColumn('service_application_histories', 'actor_id')) {
                $table->unsignedBigInteger('actor_id')->nullable();
            }
        });

        Schema::table('service_application_files', function (Blueprint $table) {
            if (!Schema::hasColumn('service_application_files', 'file_category')) {
                $table->string('file_category')->nullable();
            }

            if (!Schema::hasColumn('service_application_files', 'verification_status')) {
                $table->enum('verification_status', [
                    'pending',
                    'verified',
                    'rejected'
                ])->default('pending');
            }

            if (!Schema::hasColumn('service_application_files', 'verified_by')) {
                $table->unsignedBigInteger('verified_by')->nullable();
            }

            if (!Schema::hasColumn('service_application_files', 'verified_at')) {
                $table->timestamp('verified_at')->nullable();
            }
        });
    }

    public function down(): void
    {
        //
    }
};
