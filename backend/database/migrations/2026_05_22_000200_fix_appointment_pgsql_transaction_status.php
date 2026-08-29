<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('service_applications', function (Blueprint $table) {
            if (! Schema::hasColumn('service_applications', 'appointment_at')) {
                $table->timestamp('appointment_at')->nullable();
            }
            if (! Schema::hasColumn('service_applications', 'appointment_location')) {
                $table->string('appointment_location')->nullable();
            }
            if (! Schema::hasColumn('service_applications', 'appointment_message')) {
                $table->text('appointment_message')->nullable();
            }
            if (! Schema::hasColumn('service_applications', 'appointment_status')) {
                $table->string('appointment_status')->nullable();
            }
            if (! Schema::hasColumn('service_applications', 'sla_started_at')) {
                $table->timestamp('sla_started_at')->nullable();
            }
        });

        if (! Schema::hasTable('service_application_appointments')) {
            Schema::create('service_application_appointments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('application_id')->constrained('service_applications')->cascadeOnDelete();
                $table->foreignId('scheduled_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('appointment_at');
                $table->string('location')->nullable();
                $table->text('message')->nullable();
                $table->string('status')->default('scheduled');
                $table->timestamps();
            });
        }

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE service_applications DROP CONSTRAINT IF EXISTS service_applications_status_check');

            DB::statement("
                ALTER TABLE service_applications
                ADD CONSTRAINT service_applications_status_check
                CHECK (
                    status IN (
                        'draft','submitted','pending','accepted','under_review',
                        'front_officer_review','appointment_scheduled',
                        'shared','shared_to_front_officer','shared_to_back_officer',
                        'returned_from_share','forwarded_to_back_officer',
                        'back_officer_review','under_back_review',
                        'back_officer_approved','back_officer_rejected',
                        'approved','rejected','returned','returned_to_customer',
                        'returned_to_front_officer','returned_to_back_officer',
                        'resubmitted','escalated','escalated_to_manager',
                        'manager_review','manager_assigned','assigned_by_manager',
                        'manager_returned','returned_to_manager','manager_forwarded',
                        'manager_resolved','completed','closed','cancelled'
                    )
                )
            ");
        }
    }

    public function down(): void
    {
        //
    }
};
