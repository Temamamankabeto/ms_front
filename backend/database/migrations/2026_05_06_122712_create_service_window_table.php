<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run migrations.
     */
    public function up(): void
    {
        Schema::create('service_window', function (Blueprint $table) {

            $table->id();

            $table->foreignId('service_id')
                ->constrained('services')
                ->cascadeOnDelete();

            $table->foreignId('window_id')
                ->constrained('windows')
                ->cascadeOnDelete();

            $table->unsignedInteger('step_order')
                ->default(1);

            $table->boolean('is_required')
                ->default(true);

            $table->timestamps();

            $table->unique([
                'service_id',
                'window_id'
            ]);
        });
    }

    /**
     * Reverse migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_window');
    }
};