<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'user_type')) {
                $table->string('user_type')->default('internal')->after('password');
            }

            if (!Schema::hasColumn('users', 'status')) {
                $table->string('status')->default('active')->after('user_type');
            }

            if (!Schema::hasColumn('users', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('status');
            }

            if (!Schema::hasColumn('users', 'city_id')) {
                $table->unsignedBigInteger('city_id')->nullable()->index()->after('address');
            }

            if (!Schema::hasColumn('users', 'subcity_id')) {
                $table->unsignedBigInteger('subcity_id')->nullable()->index()->after('city_id');
            }

            if (!Schema::hasColumn('users', 'woreda_id')) {
                $table->unsignedBigInteger('woreda_id')->nullable()->index()->after('subcity_id');
            }

            if (!Schema::hasColumn('users', 'phone_verified_at')) {
                $table->timestamp('phone_verified_at')->nullable()->after('email_verified_at');
            }

            if (!Schema::hasColumn('users', 'last_login_at')) {
                $table->timestamp('last_login_at')->nullable()->after('remember_token');
            }

            if (!Schema::hasColumn('users', 'refresh_token')) {
                $table->string('refresh_token', 128)->nullable()->after('remember_token');
            }

            if (!Schema::hasColumn('users', 'refresh_token_expires_at')) {
                $table->timestamp('refresh_token_expires_at')->nullable()->after('refresh_token');
            }

            if (!Schema::hasColumn('users', 'deleted_at')) {
                $table->softDeletes();
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            foreach ([
                'user_type',
                'status',
                'is_active',
                'city_id',
                'subcity_id',
                'woreda_id',
                'phone_verified_at',
                'last_login_at',
                'refresh_token',
                'refresh_token_expires_at',
                'deleted_at',
            ] as $column) {
                if (Schema::hasColumn('users', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
