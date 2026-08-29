<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('announcements', function (Blueprint $table) {
            if (! Schema::hasColumn('announcements', 'city_id')) {
                $table->foreignId('city_id')->nullable()->index();
            }

            if (! Schema::hasColumn('announcements', 'created_by')) {
                $table->foreignId('created_by')->nullable()->index();
            }
        });

        Schema::table('announcements', function (Blueprint $table) {
            $table->foreign('city_id', 'announcements_city_id_foreign')
                ->references('id')
                ->on('cities')
                ->nullOnDelete();

            $table->foreign('created_by', 'announcements_created_by_foreign')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('announcements', function (Blueprint $table) {
            $table->dropForeign('announcements_created_by_foreign');
            $table->dropForeign('announcements_city_id_foreign');

            if (Schema::hasColumn('announcements', 'created_by')) {
                $table->dropColumn('created_by');
            }

            if (Schema::hasColumn('announcements', 'city_id')) {
                $table->dropColumn('city_id');
            }
        });
    }
};
