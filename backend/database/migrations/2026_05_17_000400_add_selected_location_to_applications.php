<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        /*
        |--------------------------------------------------------------------------
        | Services already have availability JSON.
        |--------------------------------------------------------------------------
        | Do not add service location columns. If an earlier patch added them,
        | remove them so services.availability remains the single source of truth.
        */
        Schema::table('services', function (Blueprint $table) {
            foreach (['administrative_level', 'city_id', 'subcity_id', 'woreda_id'] as $column) {
                if (Schema::hasColumn('services', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        Schema::table('service_applications', function (Blueprint $table) {
            if (!Schema::hasColumn('service_applications', 'administrative_level')) {
                $table->string('administrative_level', 20)
                    ->nullable()
                    ->after('service_id')
                    ->index();
            }

            if (!Schema::hasColumn('service_applications', 'city_id')) {
                $table->unsignedBigInteger('city_id')
                    ->nullable()
                    ->after('administrative_level')
                    ->index();
            }

            if (!Schema::hasColumn('service_applications', 'subcity_id')) {
                $table->unsignedBigInteger('subcity_id')
                    ->nullable()
                    ->after('city_id')
                    ->index();
            }

            if (!Schema::hasColumn('service_applications', 'woreda_id')) {
                $table->unsignedBigInteger('woreda_id')
                    ->nullable()
                    ->after('subcity_id')
                    ->index();
            }
        });

        Schema::table('applications', function (Blueprint $table) {
            if (!Schema::hasColumn('applications', 'administrative_level')) {
                $table->string('administrative_level', 20)
                    ->nullable()
                    ->after('service_id')
                    ->index();
            }

            if (!Schema::hasColumn('applications', 'city_id')) {
                $table->unsignedBigInteger('city_id')
                    ->nullable()
                    ->after('administrative_level')
                    ->index();
            }

            if (!Schema::hasColumn('applications', 'subcity_id')) {
                $table->unsignedBigInteger('subcity_id')
                    ->nullable()
                    ->after('city_id')
                    ->index();
            }

            if (!Schema::hasColumn('applications', 'woreda_id')) {
                $table->unsignedBigInteger('woreda_id')
                    ->nullable()
                    ->after('subcity_id')
                    ->index();
            }
        });
    }

    public function down(): void
    {
        Schema::table('service_applications', function (Blueprint $table) {
            foreach (['administrative_level', 'city_id', 'subcity_id', 'woreda_id'] as $column) {
                if (Schema::hasColumn('service_applications', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        Schema::table('applications', function (Blueprint $table) {
            foreach (['administrative_level', 'city_id', 'subcity_id', 'woreda_id'] as $column) {
                if (Schema::hasColumn('applications', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
