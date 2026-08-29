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
            if (! Schema::hasColumn('windows', 'city_title')) {
                $table->string('city_title')->nullable()->after('title');
            }

            if (! Schema::hasColumn('windows', 'subcity_title')) {
                $table->string('subcity_title')->nullable()->after('city_title');
            }

            if (! Schema::hasColumn('windows', 'woreda_title')) {
                $table->string('woreda_title')->nullable()->after('subcity_title');
            }
        });

        /*
        |--------------------------------------------------------------------------
        | Backward compatibility
        |--------------------------------------------------------------------------
        | If old windows have a single title, use it as fallback for the selected
        | administrative levels.
        */
        $windows = DB::table('windows')->select('id', 'title', 'availability', 'administrative_level')->get();

        foreach ($windows as $window) {
            $title = $window->title ?: null;
            if (! $title) {
                continue;
            }

            $availability = $window->availability;
            if (is_string($availability)) {
                $decoded = json_decode($availability, true);
                $availability = json_last_error() === JSON_ERROR_NONE ? $decoded : [];
            }

            $levels = [];

            if (is_array($availability)) {
                if (array_is_list($availability)) {
                    $levels = $availability;
                } elseif (isset($availability['levels']) && is_array($availability['levels'])) {
                    $levels = $availability['levels'];
                } elseif (isset($availability['administrative_levels']) && is_array($availability['administrative_levels'])) {
                    $levels = $availability['administrative_levels'];
                } else {
                    foreach (['city', 'subcity', 'woreda'] as $level) {
                        if (($availability[$level] ?? false) === true) {
                            $levels[] = $level;
                        }
                    }
                }
            }

            if (! $levels && $window->administrative_level) {
                $levels = [$window->administrative_level];
            }

            DB::table('windows')
                ->where('id', $window->id)
                ->update([
                    'city_title' => in_array('city', $levels, true) ? $title : null,
                    'subcity_title' => in_array('subcity', $levels, true) ? $title : null,
                    'woreda_title' => in_array('woreda', $levels, true) ? $title : null,
                ]);
        }
    }

    public function down(): void
    {
        Schema::table('windows', function (Blueprint $table) {
            if (Schema::hasColumn('windows', 'woreda_title')) {
                $table->dropColumn('woreda_title');
            }

            if (Schema::hasColumn('windows', 'subcity_title')) {
                $table->dropColumn('subcity_title');
            }

            if (Schema::hasColumn('windows', 'city_title')) {
                $table->dropColumn('city_title');
            }
        });
    }
};
