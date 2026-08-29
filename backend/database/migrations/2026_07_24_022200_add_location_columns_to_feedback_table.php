<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('feedback', function (Blueprint $table) {

            /*
            |--------------------------------------------------------------------------
            | DIRECT LOCATION COLUMNS
            |--------------------------------------------------------------------------
            | Feedback previously only had a location through window_id. Reporting
            | needs city_id / subcity_id / woreda_id on the feedback row itself:
            | - when a logged-in agent submits feedback, it's their own location
            |   (not necessarily the window's)
            | - when an anonymous kiosk customer submits it, it's the window's
            |   location, copied at submission time
            */

            $table->foreignId('city_id')
                ->nullable()
                ->after('window_id')
                ->constrained('cities')
                ->nullOnDelete();

            $table->foreignId('subcity_id')
                ->nullable()
                ->after('city_id')
                ->constrained('subcities')
                ->nullOnDelete();

            $table->foreignId('woreda_id')
                ->nullable()
                ->after('subcity_id')
                ->constrained('woredas')
                ->nullOnDelete();

            $table->index(['city_id', 'subcity_id', 'woreda_id']);
        });

        // Backfill existing rows from their window's location so reports
        // built against feedback.city_id/subcity_id/woreda_id don't lose
        // data that was already submitted before this migration.
        if (DB::getDriverName() === 'pgsql') {
            DB::statement(<<<'SQL'
                UPDATE feedback
                SET
                    city_id = windows.city_id,
                    subcity_id = windows.subcity_id,
                    woreda_id = windows.woreda_id
                FROM windows
                WHERE windows.id = feedback.window_id
            SQL);
        } else {
            DB::table('feedback')
                ->join('windows', 'windows.id', '=', 'feedback.window_id')
                ->update([
                    'feedback.city_id' => DB::raw('windows.city_id'),
                    'feedback.subcity_id' => DB::raw('windows.subcity_id'),
                    'feedback.woreda_id' => DB::raw('windows.woreda_id'),
                ]);
        }
    }

    /**
     * Reverse migrations.
     */
    public function down(): void
    {
        Schema::table('feedback', function (Blueprint $table) {
            $table->dropConstrainedForeignId('city_id');
            $table->dropConstrainedForeignId('subcity_id');
            $table->dropConstrainedForeignId('woreda_id');
        });
    }
};
