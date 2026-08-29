<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
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
            | LOCATION LINK
            |--------------------------------------------------------------------------
            | Feedback is given at a specific service window. The window already
            | carries city_id / subcity_id / woreda_id, so linking feedback to the
            | window is what lets us later show that feedback only to the agents
            | who are assigned to that city, subcity, or woreda.
            */

            $table->foreignId('window_id')
                ->nullable()
                ->after('service_id')
                ->constrained('windows')
                ->nullOnDelete();

            $table->index('window_id');
        });
    }

    /**
     * Reverse migrations.
     */
    public function down(): void
    {
        Schema::table('feedback', function (Blueprint $table) {
            $table->dropConstrainedForeignId('window_id');
        });
    }
};
