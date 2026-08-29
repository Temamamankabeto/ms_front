<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_service_assignments', function (Blueprint $table) {
            if (!Schema::hasColumn('user_service_assignments', 'officer_type')) {
                $table->string('officer_type', 20)->nullable()->after('service_id')->index();
            }

            if (!Schema::hasColumn('user_service_assignments', 'window_id')) {
                $table->unsignedBigInteger('window_id')->nullable()->after('officer_type')->index();
            }

            if (!Schema::hasColumn('user_service_assignments', 'assignment_level')) {
                $table->string('assignment_level', 20)->nullable()->after('window_id')->index();
            }

            if (!Schema::hasColumn('user_service_assignments', 'city_id')) {
                $table->unsignedBigInteger('city_id')->nullable()->after('assignment_level')->index();
            }

            if (!Schema::hasColumn('user_service_assignments', 'subcity_id')) {
                $table->unsignedBigInteger('subcity_id')->nullable()->after('city_id')->index();
            }

            if (!Schema::hasColumn('user_service_assignments', 'woreda_id')) {
                $table->unsignedBigInteger('woreda_id')->nullable()->after('subcity_id')->index();
            }

            if (!Schema::hasColumn('user_service_assignments', 'assigned_by')) {
                $table->unsignedBigInteger('assigned_by')->nullable()->after('is_active')->index();
            }

            if (!Schema::hasColumn('user_service_assignments', 'assigned_at')) {
                $table->timestamp('assigned_at')->nullable()->after('assigned_by');
            }
        });

        DB::table('user_service_assignments')
            ->whereNull('officer_type')
            ->update(['officer_type' => 'front_officer']);

        DB::table('user_service_assignments')
            ->whereNull('assignment_level')
            ->update(['assignment_level' => 'city']);

        $driver = DB::getDriverName();

        try {
            if ($driver === 'pgsql') {
                DB::statement('ALTER TABLE user_service_assignments DROP CONSTRAINT IF EXISTS user_service_assignments_user_id_service_id_unique');
                DB::statement('DROP INDEX IF EXISTS user_service_assignments_user_id_service_id_unique');
                DB::statement('DROP INDEX IF EXISTS usa_user_service_window_level_type_unique');
            }

            if ($driver === 'mysql') {
                DB::statement('ALTER TABLE user_service_assignments DROP INDEX user_service_assignments_user_id_service_id_unique');
                DB::statement('ALTER TABLE user_service_assignments DROP INDEX usa_user_service_window_level_type_unique');
            }
        } catch (\Throwable $e) {
            //
        }

        if ($driver === 'pgsql') {
            DB::statement(<<<SQL
DELETE FROM user_service_assignments a
USING user_service_assignments b
WHERE a.ctid < b.ctid
  AND a.user_id = b.user_id
  AND a.service_id = b.service_id
  AND COALESCE(a.window_id, 0) = COALESCE(b.window_id, 0)
  AND COALESCE(a.assignment_level, 'city') = COALESCE(b.assignment_level, 'city')
  AND COALESCE(a.officer_type, 'front_officer') = COALESCE(b.officer_type, 'front_officer')
SQL);

            DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS usa_user_service_window_level_type_unique ON user_service_assignments (user_id, service_id, window_id, assignment_level, officer_type)');
            return;
        }

        if ($driver === 'mysql') {
            DB::statement(<<<SQL
DELETE usa1 FROM user_service_assignments usa1
INNER JOIN user_service_assignments usa2
WHERE usa1.id > usa2.id
  AND usa1.user_id = usa2.user_id
  AND usa1.service_id = usa2.service_id
  AND COALESCE(usa1.window_id, 0) = COALESCE(usa2.window_id, 0)
  AND COALESCE(usa1.assignment_level, 'city') = COALESCE(usa2.assignment_level, 'city')
  AND COALESCE(usa1.officer_type, 'front_officer') = COALESCE(usa2.officer_type, 'front_officer')
SQL);

            DB::statement('CREATE UNIQUE INDEX usa_user_service_window_level_type_unique ON user_service_assignments (user_id, service_id, window_id, assignment_level, officer_type)');
        }
    }

    public function down(): void
    {
        $driver = DB::getDriverName();

        try {
            if ($driver === 'pgsql') {
                DB::statement('DROP INDEX IF EXISTS usa_user_service_window_level_type_unique');
            }

            if ($driver === 'mysql') {
                DB::statement('ALTER TABLE user_service_assignments DROP INDEX usa_user_service_window_level_type_unique');
            }
        } catch (\Throwable $e) {
            //
        }
    }
};
