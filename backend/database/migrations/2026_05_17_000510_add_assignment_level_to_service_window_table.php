<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

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
    }

    public function down(): void
    {
        Schema::table('service_window', function (Blueprint $table) {
            if (Schema::hasColumn('service_window', 'assignment_level')) {
                $table->dropColumn('assignment_level');
            }
        });
    }
};
