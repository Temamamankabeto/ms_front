<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('service_form_fields', function (Blueprint $table) {
            if (!Schema::hasColumn('service_form_fields', 'section_id')) {
                $table->foreignId('section_id')
                    ->nullable()
                    ->constrained('service_form_sections')
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('service_form_fields', function (Blueprint $table) {
            if (Schema::hasColumn('service_form_fields', 'section_id')) {
                $table->dropForeign(['section_id']);
                $table->dropColumn('section_id');
            }
        });
    }
};
