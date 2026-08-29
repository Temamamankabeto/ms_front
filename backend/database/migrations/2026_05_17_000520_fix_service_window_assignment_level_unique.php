<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('service_window', function (Blueprint $table) {
            if (!Schema::hasColumn('service_window', 'assignment_level')) {
                $table->string('assignment_level', 20)
                    ->nullable()
                    ->after('window_id')
                    ->index();
            }
        });

        DB::table('service_window')
            ->whereNull('assignment_level')
            ->update(['assignment_level' => 'city']);

        /*
        |--------------------------------------------------------------------------
        | Old unique key was only service_id + window_id.
        |--------------------------------------------------------------------------
        | That blocks independent city/subcity/woreda assignments for the same
        | service/window. Drop it and replace with service_id+window_id+level.
        */
        $driver = DB::getDriverName();

        try {
            if ($driver === 'pgsql') {
                DB::statement('ALTER TABLE service_window DROP CONSTRAINT IF EXISTS service_window_service_id_window_id_unique');
                DB::statement('DROP INDEX IF EXISTS service_window_service_id_window_id_unique');
            } elseif ($driver === 'mysql') {
                DB::statement('ALTER TABLE service_window DROP INDEX service_window_service_id_window_id_unique');
            }
        } catch (\Throwable $exception) {
            // Index may already be removed. Safe to continue.
        }

        try {
            if ($driver === 'pgsql') {
                DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS service_window_service_window_level_unique ON service_window (service_id, window_id, assignment_level)');
            } elseif ($driver === 'mysql') {
                DB::statement('CREATE UNIQUE INDEX service_window_service_window_level_unique ON service_window (service_id, window_id, assignment_level)');
            }
        } catch (\Throwable $exception) {
            // Index may already exist. Safe to continue.
        }
    }

    public function down(): void
    {
        $driver = DB::getDriverName();

        try {
            if ($driver === 'pgsql') {
                DB::statement('DROP INDEX IF EXISTS service_window_service_window_level_unique');
            } elseif ($driver === 'mysql') {
                DB::statement('ALTER TABLE service_window DROP INDEX service_window_service_window_level_unique');
            }
        } catch (\Throwable $exception) {
            //
        }
    }
};
