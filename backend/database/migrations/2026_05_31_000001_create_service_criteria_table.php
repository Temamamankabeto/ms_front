<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('service_criteria')) {
            Schema::create('service_criteria', function (Blueprint $table) {
                $table->id();
                $table->foreignId('service_id')->constrained('services')->cascadeOnDelete();
                $table->string('title')->default('Service Criteria');
                $table->longText('criteria');
                $table->unsignedInteger('sort_order')->default(0);
                $table->boolean('is_active')->default(true)->index();
                $table->timestamps();

                $table->index(['service_id', 'is_active']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('service_criteria');
    }
};
