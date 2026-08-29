<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'refresh_token')) {
                $table->string('refresh_token', 255)->nullable()->after('remember_token');
            }

            if (! Schema::hasColumn('users', 'refresh_token_expires_at')) {
                $table->timestamp('refresh_token_expires_at')->nullable()->after('refresh_token');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'refresh_token_expires_at')) {
                $table->dropColumn('refresh_token_expires_at');
            }

            if (Schema::hasColumn('users', 'refresh_token')) {
                $table->dropColumn('refresh_token');
            }
        });
    }
};
