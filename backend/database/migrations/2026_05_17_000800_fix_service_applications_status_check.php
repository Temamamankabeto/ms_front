<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('ALTER TABLE service_applications DROP CONSTRAINT IF EXISTS service_applications_status_check');

        DB::statement("
            ALTER TABLE service_applications
            ADD CONSTRAINT service_applications_status_check
            CHECK (
                status IN (
                    'submitted',
                    'pending',
                    'accepted',
                    'front_officer_review',
                    'shared',
                    'forwarded_to_back_officer',
                    'back_officer_review',
                    'back_officer_approved',
                    'approved',
                    'returned',
                    'returned_to_customer',
                    'returned_to_front_officer',
                    'rejected',
                    'escalated',
                    'manager_review',
                    'manager_assigned',
                    'manager_returned',
                    'manager_forwarded',
                    'manager_resolved',
                    'completed',
                    'cancelled'
                )
            )
        ");
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('ALTER TABLE service_applications DROP CONSTRAINT IF EXISTS service_applications_status_check');

        DB::statement("
            ALTER TABLE service_applications
            ADD CONSTRAINT service_applications_status_check
            CHECK (
                status IN (
                    'submitted',
                    'accepted',
                    'approved',
                    'returned',
                    'rejected',
                    'completed',
                    'cancelled'
                )
            )
        ");
    }
};
