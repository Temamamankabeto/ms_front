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
                    ->after('description')
                    ->constrained('service_form_sections')
                    ->nullOnDelete();
            }

            if (!Schema::hasColumn('service_form_fields', 'is_searchable')) {
                $table->boolean('is_searchable')->default(false);
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
