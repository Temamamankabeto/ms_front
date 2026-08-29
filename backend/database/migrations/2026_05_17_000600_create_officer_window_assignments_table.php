<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('officer_window_assignments', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('officer_id')->index();
            $table->unsignedBigInteger('window_id')->index();
            $table->string('assignment_level', 20)->index();

            $table->unsignedBigInteger('city_id')->nullable()->index();
            $table->unsignedBigInteger('subcity_id')->nullable()->index();
            $table->unsignedBigInteger('woreda_id')->nullable()->index();

            $table->unsignedBigInteger('assigned_by')->nullable()->index();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamp('assigned_at')->nullable();

            $table->timestamps();

            $table->unique(
                ['officer_id', 'window_id', 'assignment_level'],
                'owa_officer_window_level_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('officer_window_assignments');
    }
};
