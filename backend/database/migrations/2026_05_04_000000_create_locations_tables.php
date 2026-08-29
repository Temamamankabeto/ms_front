<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('cities')) {
            Schema::create('cities', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('code')->nullable()->unique();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('subcities')) {
            Schema::create('subcities', function (Blueprint $table) {
                $table->id();
                $table->foreignId('city_id')->constrained('cities')->cascadeOnDelete();
                $table->string('name');
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('woredas')) {
            Schema::create('woredas', function (Blueprint $table) {
                $table->id();
                $table->foreignId('subcity_id')->constrained('subcities')->cascadeOnDelete();
                $table->string('name');
                $table->timestamps();
            });
        } elseif (!Schema::hasColumn('woredas', 'city_id')) {
            Schema::table('woredas', function (Blueprint $table) {
                $table->unsignedBigInteger('city_id')->nullable()->after('id');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('woredas');
        Schema::dropIfExists('subcities');
        Schema::dropIfExists('cities');
    }
};
