<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('windows', function (Blueprint $table) {
            if (! Schema::hasColumn('windows', 'title')) {
                $table->string('title')->nullable()->after('name');
            }

            if (! Schema::hasColumn('windows', 'administrative_level')) {
                $table->string('administrative_level')->nullable()->after('title');
            }

            if (! Schema::hasColumn('windows', 'city_id')) {
                $table->foreignId('city_id')->nullable()->after('administrative_level')->constrained('cities')->nullOnDelete();
            }

            if (! Schema::hasColumn('windows', 'subcity_id')) {
                $table->foreignId('subcity_id')->nullable()->after('city_id')->constrained('subcities')->nullOnDelete();
            }

            if (! Schema::hasColumn('windows', 'woreda_id')) {
                $table->foreignId('woreda_id')->nullable()->after('subcity_id')->constrained('woredas')->nullOnDelete();
            }
        });

        /*
        |--------------------------------------------------------------------------
        | Backfill old rows
        |--------------------------------------------------------------------------
        | Old windows only had name + availability JSON. Keep them usable by
        | assigning a title and one administrative level. Existing rows can later
        | be edited into proper per-level/per-scope windows.
        */
        DB::table('windows')
            ->whereNull('title')
            ->update(['title' => DB::raw('name')]);

        $windows = DB::table('windows')
            ->select('id', 'availability', 'administrative_level')
            ->whereNull('administrative_level')
            ->get();

        foreach ($windows as $window) {
            $availability = $window->availability;

            if (is_string($availability)) {
                $decoded = json_decode($availability, true);
                $availability = json_last_error() === JSON_ERROR_NONE ? $decoded : [];
            }

            $level = 'city';

            if (is_array($availability)) {
                if (array_is_list($availability)) {
                    $level = in_array('city', $availability, true)
                        ? 'city'
                        : ($availability[0] ?? 'city');
                } elseif (isset($availability['levels']) && is_array($availability['levels'])) {
                    $level = in_array('city', $availability['levels'], true)
                        ? 'city'
                        : ($availability['levels'][0] ?? 'city');
                } elseif (isset($availability['administrative_levels']) && is_array($availability['administrative_levels'])) {
                    $level = in_array('city', $availability['administrative_levels'], true)
                        ? 'city'
                        : ($availability['administrative_levels'][0] ?? 'city');
                } elseif (($availability['woreda'] ?? false) === true) {
                    $level = 'woreda';
                } elseif (($availability['subcity'] ?? false) === true) {
                    $level = 'subcity';
                }
            }

            DB::table('windows')
                ->where('id', $window->id)
                ->update(['administrative_level' => $level]);
        }

        Schema::table('windows', function (Blueprint $table) {
            $table->index(['administrative_level', 'city_id', 'subcity_id', 'woreda_id'], 'windows_scope_index');
            $table->index(['name', 'administrative_level'], 'windows_name_level_index');
        });
    }

    public function down(): void
    {
        Schema::table('windows', function (Blueprint $table) {
            $table->dropIndex('windows_scope_index');
            $table->dropIndex('windows_name_level_index');

            if (Schema::hasColumn('windows', 'woreda_id')) {
                $table->dropConstrainedForeignId('woreda_id');
            }

            if (Schema::hasColumn('windows', 'subcity_id')) {
                $table->dropConstrainedForeignId('subcity_id');
            }

            if (Schema::hasColumn('windows', 'city_id')) {
                $table->dropConstrainedForeignId('city_id');
            }

            if (Schema::hasColumn('windows', 'administrative_level')) {
                $table->dropColumn('administrative_level');
            }

            if (Schema::hasColumn('windows', 'title')) {
                $table->dropColumn('title');
            }
        });
    }
};
