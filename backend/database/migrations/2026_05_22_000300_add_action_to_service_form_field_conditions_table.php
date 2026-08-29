<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (
            Schema::hasTable('service_form_field_conditions') &&
            ! Schema::hasColumn('service_form_field_conditions', 'action')
        ) {
            Schema::table('service_form_field_conditions', function (Blueprint $table) {
                $table->string('action')->default('show')->after('expected_value');
            });
        }
    }

    public function down(): void
    {
        if (
            Schema::hasTable('service_form_field_conditions') &&
            Schema::hasColumn('service_form_field_conditions', 'action')
        ) {
            Schema::table('service_form_field_conditions', function (Blueprint $table) {
                $table->dropColumn('action');
            });
        }
    }
};
