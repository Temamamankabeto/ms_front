<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('service_form_sections')) {
            Schema::table('service_form_sections', function (Blueprint $table) {
                if (!Schema::hasColumn('service_form_sections', 'service_form_step_id')) {
                    $table->foreignId('service_form_step_id')
                        ->nullable()
                        ->after('service_form_id')
                        ->constrained('service_form_steps')
                        ->nullOnDelete();
                }
            });
        }

        if (Schema::hasTable('service_form_fields')) {
            Schema::table('service_form_fields', function (Blueprint $table) {
                if (!Schema::hasColumn('service_form_fields', 'service_form_section_id')) {
                    $table->foreignId('service_form_section_id')
                        ->nullable()
                        ->after('service_form_id')
                        ->constrained('service_form_sections')
                        ->nullOnDelete();
                }

                if (!Schema::hasColumn('service_form_fields', 'service_form_step_id')) {
                    $table->foreignId('service_form_step_id')
                        ->nullable()
                        ->after('service_form_section_id')
                        ->constrained('service_form_steps')
                        ->nullOnDelete();
                }

                if (!Schema::hasColumn('service_form_fields', 'help_text')) {
                    $table->text('help_text')->nullable()->after('placeholder');
                }

                if (!Schema::hasColumn('service_form_fields', 'default_value')) {
                    $table->text('default_value')->nullable()->after('help_text');
                }

                if (!Schema::hasColumn('service_form_fields', 'is_active')) {
                    $table->boolean('is_active')->default(true)->after('is_required');
                }
            });

            if (
                Schema::hasColumn('service_form_fields', 'section_id') &&
                Schema::hasColumn('service_form_fields', 'service_form_section_id')
            ) {
                DB::table('service_form_fields')
                    ->whereNull('service_form_section_id')
                    ->update(['service_form_section_id' => DB::raw('section_id')]);
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('service_form_fields')) {
            Schema::table('service_form_fields', function (Blueprint $table) {
                foreach (['service_form_step_id', 'service_form_section_id'] as $column) {
                    if (Schema::hasColumn('service_form_fields', $column)) {
                        $table->dropForeign([$column]);
                        $table->dropColumn($column);
                    }
                }

                foreach (['help_text', 'default_value', 'is_active'] as $column) {
                    if (Schema::hasColumn('service_form_fields', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }

        if (Schema::hasTable('service_form_sections')) {
            Schema::table('service_form_sections', function (Blueprint $table) {
                if (Schema::hasColumn('service_form_sections', 'service_form_step_id')) {
                    $table->dropForeign(['service_form_step_id']);
                    $table->dropColumn('service_form_step_id');
                }
            });
        }
    }
};
