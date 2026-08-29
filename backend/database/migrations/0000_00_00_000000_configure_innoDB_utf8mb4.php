<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Run only for PostgreSQL
        if (DB::getDriverName() === 'pgsql') {

            // Set UTF8 client encoding
            DB::statement("SET client_encoding TO 'UTF8'");

            // Optional timezone
            DB::statement("SET TIME ZONE 'UTC'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};